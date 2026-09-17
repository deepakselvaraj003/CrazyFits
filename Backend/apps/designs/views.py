from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
import uuid, logging
from PIL import Image
from .models import Design
from .serializers import *
from apps.requests_app.models import QuoteRequest
from common.google_drive import upload_file_to_google_drive,delete_file_from_google_drive,extract_drive_file_id

logger = logging.getLogger(__name__)

# Protect against PIL decompression bomb DoS attacks (max 25 megapixels)
Image.MAX_IMAGE_PIXELS = 25_000_000

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_PREVIEW_SIZE = 5 * 1024 * 1024   # 5 MB
MAX_PNG_SIZE = 15 * 1024 * 1024      # 15 MB

def validate_image_file(file_obj, max_size, label="Image"):
    if file_obj.size > max_size:
        return f"{label} exceeds maximum allowed size of {max_size // (1024 * 1024)}MB."
    if file_obj.content_type not in ALLOWED_IMAGE_TYPES:
        return f"{label} must be a valid image (PNG, JPEG, or WEBP)."
    try:
        img = Image.open(file_obj)
        img.verify()
        file_obj.seek(0)
    except Exception:
        return f"{label} is corrupted or an invalid image format."
    return None


class DesignAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, design_id=None):

        try:

            if design_id:

                design = Design.objects.get(id=design_id,user=request.user)
                serializer = DesignSerializer(
                    design,
                    context={"request": request}
                )

                return Response({
                    "success": True,
                    "data": serializer.data
                })

            designs = (Design.objects.filter(user=request.user).prefetch_related("requests")
                    .order_by("-id"))
            serializer = DesignSerializer(
                designs,
                many=True,
                context={"request": request}
            )

            return Response({
                "success": True,
                "data": serializer.data
            })

        except Design.DoesNotExist:

            return Response({
                "success": False,
                "message": "Design not found."
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.exception("DesignAPIView get error")
            return Response({
                "success": False,
                "message": "Failed to retrieve designs."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def post(self, request):

        uploaded_drive_files = []

        try:

            serializer = CreateDesignSerializer(data=request.data)

            if not serializer.is_valid():
                return Response(
                    {
                        "success": False,
                        "errors": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            front_preview = request.FILES.get("front_preview_image")
            back_preview = request.FILES.get("back_preview_image")

            front_png_files_list = request.FILES.getlist("front_png_files")
            back_png_files_list = request.FILES.getlist("back_png_files")


            if front_preview:
                err = validate_image_file(
                    front_preview,
                    MAX_PREVIEW_SIZE,
                    "Front preview image"
                )

                if err:
                    return Response(
                        {
                            "success": False,
                            "message": err
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            if back_preview:
                err = validate_image_file(
                    back_preview,
                    MAX_PREVIEW_SIZE,
                    "Back preview image"
                )

                if err:
                    return Response(
                        {
                            "success": False,
                            "message": err
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # ---------------------------------------------------------
            # VALIDATE FRONT PNG FILES
            # ---------------------------------------------------------

            for png in front_png_files_list:

                err = validate_image_file(
                    png,
                    MAX_PNG_SIZE,
                    f"Front PNG file ({png.name})"
                )

                if err:
                    return Response(
                        {
                            "success": False,
                            "message": err
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # ---------------------------------------------------------
            # VALIDATE BACK PNG FILES
            # ---------------------------------------------------------

            for png in back_png_files_list:

                err = validate_image_file(
                    png,
                    MAX_PNG_SIZE,
                    f"Back PNG file ({png.name})"
                )

                if err:
                    return Response(
                        {
                            "success": False,
                            "message": err
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # ---------------------------------------------------------
            # INITIAL VALUES
            # ---------------------------------------------------------

            front_image_url = None
            back_image_url = None

            front_pngs_data = []
            back_pngs_data = []

            # ---------------------------------------------------------
            # UPLOAD FRONT PREVIEW
            # ---------------------------------------------------------

            if front_preview:

                filename = f"{uuid.uuid4()}_{front_preview.name}"

                front_image_url = upload_file_to_google_drive(
                    file_obj=front_preview,
                    filename=filename,
                    folder_name="designs",
                    public=False
                )

                # Remember the uploaded file for rollback.
                uploaded_drive_files.append(front_image_url)

            # ---------------------------------------------------------
            # UPLOAD BACK PREVIEW
            # ---------------------------------------------------------

            if back_preview:

                filename = f"{uuid.uuid4()}_{back_preview.name}"

                back_image_url = upload_file_to_google_drive(
                    file_obj=back_preview,
                    filename=filename,
                    folder_name="designs",
                    public=False
                )

                # Remember the uploaded file for rollback.
                uploaded_drive_files.append(back_image_url)

            # ---------------------------------------------------------
            # UPLOAD FRONT PNG FILES
            # ---------------------------------------------------------

            for png in front_png_files_list:

                filename = f"{uuid.uuid4()}_{png.name}"

                url = upload_file_to_google_drive(
                    file_obj=png,
                    filename=filename,
                    folder_name="designs",
                    public=False
                )

                # Remember the uploaded file for rollback.
                uploaded_drive_files.append(url)

                file_id = extract_drive_file_id(url)

                front_pngs_data.append(
                    {
                        "name": png.name,
                        "file_id": file_id,
                        "url": url
                    }
                )

            # ---------------------------------------------------------
            # UPLOAD BACK PNG FILES
            # ---------------------------------------------------------

            for png in back_png_files_list:

                filename = f"{uuid.uuid4()}_{png.name}"

                url = upload_file_to_google_drive(
                    file_obj=png,
                    filename=filename,
                    folder_name="designs",
                    public=False
                )

                # Remember the uploaded file for rollback.
                uploaded_drive_files.append(url)

                file_id = extract_drive_file_id(url)

                back_pngs_data.append(
                    {
                        "name": png.name,
                        "file_id": file_id,
                        "url": url
                    }
                )

            # ---------------------------------------------------------
            # ALL GOOGLE DRIVE UPLOADS SUCCESSFUL
            # NOW CREATE DATABASE RECORD
            # ---------------------------------------------------------

            with transaction.atomic():

                design = Design.objects.create(
                    user=request.user,
                    design_name=serializer.validated_data["design_name"],
                    front_design_json=serializer.validated_data["front_design_json"],
                    back_design_json=serializer.validated_data.get(
                        "back_design_json"
                    ),
                    front_preview_image_url=front_image_url,
                    back_preview_image_url=back_image_url,
                    front_png_files=front_pngs_data,
                    back_png_files=back_pngs_data,
                )

            # ---------------------------------------------------------
            # SUCCESS
            # ---------------------------------------------------------

            return Response(
                {
                    "success": True,
                    "message": "Design created successfully.",
                    "data": DesignSerializer(
                        design,
                        context={"request": request}
                    ).data,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception:

            logger.exception("DesignAPIView post error")

            # ---------------------------------------------------------
            # GOOGLE DRIVE ROLLBACK
            #
            # If ANY upload or database operation fails,
            # delete every Google Drive file uploaded during
            # this request.
            # ---------------------------------------------------------

            for file_url in uploaded_drive_files:

                try:

                    delete_file_from_google_drive(file_url)

                    logger.info(
                        "Rolled back Google Drive file: %s",
                        file_url
                    )

                except Exception:

                    logger.exception(
                        "Failed to rollback Google Drive file: %s",
                        file_url
                    )

            # ---------------------------------------------------------
            # RETURN ERROR
            # ---------------------------------------------------------

            return Response(
                {
                    "success": False,
                    "message": "Failed to save design. Please try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request, design_id):

        try:

            design = Design.objects.get(
                id=design_id,
                user=request.user
            )

            serializer = UpdateDesignSerializer(
                design,
                data=request.data,
                partial=True
            )

            if design.is_submitted:

                return Response(
                    {
                        "success": False,
                        "message": "Submitted design cannot be modified."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            if serializer.is_valid():

                serializer.save()

                return Response(
                    {
                        "success": True,
                        "message": "Design updated successfully.",
                        "data": DesignSerializer(
                            design,
                            context={"request": request}
                        ).data
                    }
                )

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Design.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Design not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, design_id):

        try:

            design = Design.objects.get(
                id=design_id,
                user=request.user
            )
            if design.is_submitted:

                return Response(
                    {
                        "success": False,
                        "message": "Submitted design cannot be deleted."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if design.front_preview_image_url:
                delete_file_from_google_drive(design.front_preview_image_url)

            if design.back_preview_image_url:
                delete_file_from_google_drive(design.back_preview_image_url)

            if design.front_png_files:
                for png in design.front_png_files:
                    try:
                        delete_file_from_google_drive(png.get("url"))
                    except Exception as e:
                        logger.warning("Error deleting front png %s: %s", png.get('name'), e)

            if design.back_png_files:
                for png in design.back_png_files:
                    try:
                        delete_file_from_google_drive(png.get("url"))
                    except Exception as e:
                        logger.warning("Error deleting back png %s: %s", png.get('name'), e)

            design.delete()

            return Response({
                "success": True,
                "message": "Design deleted successfully."
            })

        except Design.DoesNotExist:

            return Response({
                "success": False,
                "message": "Design not found."
            }, status=status.HTTP_404_NOT_FOUND)


class MyDesignAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def _custom_design_data(self, design):
        requests_list = list(design.requests.all())
        quote = requests_list[0] if requests_list else None
        if not quote:
            return None

        return {
            "id": design.id,
            "design_type": "custom",
            "design_name": design.design_name,
            "front_preview_image_url": design.front_preview_image_url,
            "back_preview_image_url": design.back_preview_image_url,
            "gallery_image_url": None,
            "request_number": quote.request_number,
            "quantity": quote.quantity,
            "request_status": quote.status,
            "created_at": design.created_at,
        }

    def _gallery_design_data(self, quote):
        return {
            "id": quote.id,
            "design_type": "gallery",
            "design_name": quote.gallery_design.design_name,
            "front_preview_image_url": quote.gallery_design.front_image_url,
            "back_preview_image_url": quote.gallery_design.back_image_url,
            "gallery_image_url": (
                quote.gallery_design.front_image_url
                or quote.gallery_design.back_image_url
            ),
            "request_number": quote.request_number,
            "quantity": quote.quantity,
            "request_status": quote.status,
            "created_at": quote.created_at,
        }
    
    def get(self, request):
        try:
            custom_designs = Design.objects.filter(
                user=request.user,
                is_submitted=True
            ).prefetch_related("requests")

            gallery_quotes = QuoteRequest.objects.filter(
                email=request.user.email,
                gallery_design__isnull=False
            ).select_related("gallery_design")

            result = [
                data
                for design in custom_designs
                if (data := self._custom_design_data(design))
            ]

            result.extend(
                self._gallery_design_data(quote)
                for quote in gallery_quotes
            )

            result.sort(
                key=lambda item: item["created_at"],
                reverse=True
            )

            return Response({
                "success": True,
                "data": MyDesignSerializer(result, many=True, context={"request": request}).data
            })

        except Exception as e:
            logger.exception("MyDesignAPIView get error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to retrieve your designs."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
