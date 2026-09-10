from django.http import HttpResponse, Http404
from django.db.models import Q
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from apps.designs.models import Design
from apps.gallery.models import GalleryDesign
from .google_drive import download_file_from_google_drive
import logging

logger = logging.getLogger(__name__)

_jwt_auth = JWTAuthentication()


def gallery_google_drive_image(request, file_id):
    """
    Public unauthenticated proxy for gallery images.
    
    Verifies that the requested file_id belongs to an active GalleryDesign in
    the database. If so, fetches from Google Drive and returns the image bytes
    with public caching headers.
    """
    if not _is_public_gallery_file(file_id):
        return HttpResponse(
            '{"detail": "You do not have permission to access this image."}',
            status=403,
            content_type="application/json",
        )

    try:
        content, mime_type = download_file_from_google_drive(file_id)
    except Exception:
        logger.exception("Proxy: Google Drive fetch failed for gallery image. file_id=%s", file_id)
        raise Http404("Image not found or inaccessible.")

    if not mime_type or not mime_type.startswith("image/"):
        mime_type = "image/jpeg"

    response = HttpResponse(content, content_type=mime_type)
    response["Cache-Control"] = "public, max-age=86400"  # Cache for 24 hours
    return response


def proxy_google_drive_image(request, file_id):
    """
    Authenticated, authorized proxy for private customer Google Drive images.

    Authentication:
      - Checks the HTTPOnly 'access_token' cookie first (for browser <img> requests).
      - Falls back to the Authorization Bearer header (for standard API requests).

    Authorization:
      - Superusers may access any customer design image.
      - Authenticated customers may access images belonging to their own Designs.
    """
    user = _authenticate_request(request)
    if user is None:
        return HttpResponse(
            '{"detail": "Authentication credentials were not provided."}',
            status=401,
            content_type="application/json",
        )

    if not user.is_superuser:
        authorized = _user_owns_file(user, file_id)
        if not authorized:
            return HttpResponse(
                '{"detail": "You do not have permission to access this image."}',
                status=403,
                content_type="application/json",
            )

    try:
        content, mime_type = download_file_from_google_drive(file_id)
    except Exception:
        logger.exception(
            "Proxy: Google Drive fetch failed. file_id=%s user_id=%s",
            file_id,
            user.pk,
        )
        raise Http404("Image not found or inaccessible.")

    if not mime_type or not mime_type.startswith("image/"):
        mime_type = "image/jpeg"

    response = HttpResponse(content, content_type=mime_type)
    response["Cache-Control"] = "private, max-age=3600"  # Cache privately for 1 hour
    return response


# ── Helpers ──────────────────────────────────────────────────────────────────

def _authenticate_request(request):
    """
    Validate the JWT token.
    Checks the cookie 'access_token' first, then falls back to headers.
    Returns the User object on success, or None on failure.
    """
    try:
        # Check secure HttpOnly cookie first (critical for browser <img> tags)
        raw_token = request.COOKIES.get('access_token')
        if raw_token:
            validated_token = _jwt_auth.get_validated_token(raw_token)
            user = _jwt_auth.get_user(validated_token)
            return user

        # Fallback to standard Header Bearer token
        result = _jwt_auth.authenticate(request)
        if result is None:
            return None
        user, _ = result
        return user
    except (InvalidToken, TokenError):
        return None
    except Exception:
        logger.exception("Proxy: unexpected error during JWT authentication.")
        return None


def _is_public_gallery_file(file_id):
    """Return True if the file_id belongs to an active public GalleryDesign."""
    return GalleryDesign.objects.filter(
        Q(is_active=True) & (
            Q(front_image_url__contains=file_id) |
            Q(back_image_url__contains=file_id)
        )
    ).exists()


def _user_owns_file(user, file_id):
    """Return True if the file_id is used in any Design owned by the user."""
    return Design.objects.filter(user=user).filter(
        Q(front_preview_image_url__contains=file_id) |
        Q(back_preview_image_url__contains=file_id)
    ).exists()
