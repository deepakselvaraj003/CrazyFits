from io import BytesIO
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
from apps.accounts.models import CloudConnect
import logging
from google.auth.exceptions import RefreshError
from PIL import Image

logger = logging.getLogger(__name__)

# Protect against PIL decompression bomb DoS attacks (max 25 megapixels)
Image.MAX_IMAGE_PIXELS = 25_000_000

def get_google_drive_service():

    cloud = CloudConnect.objects.filter(
        provider="google_drive"
    ).first()

    if not cloud:
        raise Exception("Google Drive not connected.")

    try:

        credentials = Credentials(
            token=None,
            refresh_token=cloud.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=cloud.client_id,
            client_secret=cloud.client_secret,
            scopes=["https://www.googleapis.com/auth/drive"],
        )

        credentials.refresh(Request())

        if not cloud.is_active:
            cloud.is_active = True
            cloud.save(update_fields=["is_active"])

        return build(
            "drive",
            "v3",
            credentials=credentials,
            cache_discovery=False,
        )

    except RefreshError:

        if cloud.is_active:
            cloud.is_active = False
            cloud.save(update_fields=["is_active"])

        logger.exception("Google Drive authentication failed.")

        raise

    except Exception as e:

        logger.exception("Failed to create Google Drive service.")

        raise Exception(
            f"Google Drive service error: {str(e)}"
        ) from e

def get_or_create_folder(service, folder_name):

    cloud = CloudConnect.objects.filter(
        provider="google_drive",
        is_active=True
    ).first()

    if not cloud:
        raise Exception("Google Drive not connected.")

    folder_ids = cloud.folder_ids or {}

    # Return cached folder ID if available
    if folder_name in folder_ids:
        return folder_ids[folder_name]

    query = (
        f"name='{folder_name}' "
        f"and mimeType='application/vnd.google-apps.folder' "
        f"and trashed=false"
    )

    result = service.files().list(
        q=query,
        fields="files(id,name)"
    ).execute()

    folders = result.get("files", [])

    if folders:

        folder_id = folders[0]["id"]

    else:

        folder = service.files().create(
            body={
                "name": folder_name,
                "mimeType": "application/vnd.google-apps.folder"
            },
            fields="id"
        ).execute()

        folder_id = folder["id"]

    folder_ids[folder_name] = folder_id
    cloud.folder_ids = folder_ids
    cloud.save(update_fields=["folder_ids"])

    return folder_id


def compress_image(file_obj):
    """
    Lossless WebP compression.
    Keeps image quality identical while reducing file size.
    """

    image = Image.open(file_obj)

    output = BytesIO()

    image.save(
        output,
        format="WEBP",
        lossless=True,   # Pixel-perfect
        method=6,        # Best compression (0-6)
    )

    output.seek(0)

    return output


def upload_file_to_google_drive(file_obj, filename, folder_name, public=False):
    """
    Upload a file to Google Drive.

    Args:
        file_obj:    File-like object to upload.
        filename:    Destination filename on Drive.
        folder_name: Drive folder name (created if absent).
        public:      If True, grant "anyone/reader" permission so the file is
                     publicly accessible via the Google Drive CDN URL.
                     Defaults to False (private) – callers must opt-in
                     explicitly for public images (e.g. Gallery uploads).

    Returns:
        str: Google Drive view URL for the uploaded file.
    """

    service = get_google_drive_service()

    folder_id = get_or_create_folder(service, folder_name)

    buffer = compress_image(file_obj)

    media = MediaIoBaseUpload(
        buffer,
        mimetype="image/webp",
        resumable=True,
    )

    uploaded_file = service.files().create(
        body={
            "name": filename,
            "parents": [folder_id]
        },
        media_body=media,
        fields="id"
    ).execute()

    file_id = uploaded_file["id"]

    if public:
        # Gallery images are intentionally world-readable.
        service.permissions().create(
            fileId=file_id,
            body={
                "role": "reader",
                "type": "anyone"
            }
        ).execute()
    else:
        # Private files: no public permission is set.
        # Access is controlled by the Django media proxy.
        logger.info("File %s uploaded as private (no public permission).", file_id)

    return f"https://drive.google.com/uc?export=view&id={file_id}"


def extract_drive_file_id(file_url):

    if not file_url:
        return None

    if "/d/" in file_url:
        try:
            return file_url.split("/d/")[1].split("/")[0]
        except Exception:
            return None

    if "id=" in file_url:
        try:
            return file_url.split("id=")[1].split("&")[0]
        except Exception:
            return None

    return None


def download_file_from_google_drive(file_id):

    service = get_google_drive_service()

    metadata = service.files().get(
        fileId=file_id,
        fields="mimeType"
    ).execute()

    mime_type = metadata.get("mimeType", "application/octet-stream")

    request = service.files().get_media(fileId=file_id)
    buffer = BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False

    while not done:
        _, done = downloader.next_chunk()

    buffer.seek(0)
    return buffer.read(), mime_type


def delete_file_from_google_drive(file_url):

    if not file_url:
        return

    file_id = extract_drive_file_id(file_url)

    if not file_id:
        raise Exception(
            "Invalid Google Drive file URL."
        )

    service = get_google_drive_service()
    service.files().delete(fileId=file_id).execute()

    return True


def convert_to_proxy_url(request, file_url):
    """
    Converts a Google Drive uc?export=view URL into a local private proxy URL.
    This URL is clean (contains no access tokens) and relies on HttpOnly cookies
    or headers for authentication.
    """
    if not file_url:
        return file_url
        
    file_id = extract_drive_file_id(file_url)
    if not file_id:
        return file_url
        
    if request:
        return request.build_absolute_uri(f"/media/proxy/{file_id}/")
    else:
        return f"/media/proxy/{file_id}/"


def convert_to_gallery_url(request, file_url):
    """
    Converts a Google Drive uc?export=view URL into a public gallery proxy URL.
    This endpoint does not require authentication but enforces that the file belongs
    to an active public GalleryDesign.
    """
    if not file_url:
        return file_url
        
    file_id = extract_drive_file_id(file_url)
    if not file_id:
        return file_url
        
    if request:
        return request.build_absolute_uri(f"/media/gallery/{file_id}/")
    else:
        return f"/media/gallery/{file_id}/"