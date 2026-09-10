import os, uuid, logging
from PIL import Image
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import *
from common.pagination import TShirtPagination
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from common.google_drive import upload_file_to_google_drive, delete_file_from_google_drive

logger = logging.getLogger(__name__)

# Protect against PIL decompression bomb DoS attacks (max 25 megapixels)
Image.MAX_IMAGE_PIXELS = 25_000_000

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_GALLERY_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

def validate_gallery_image(file_obj, label="Image"):
    if file_obj.size > MAX_GALLERY_IMAGE_SIZE:
        return f"{label} exceeds maximum allowed size of {MAX_GALLERY_IMAGE_SIZE // (1024 * 1024)}MB."
    if file_obj.content_type not in ALLOWED_IMAGE_TYPES:
        return f"{label} must be a valid image (PNG, JPEG, or WEBP)."
    try:
        img = Image.open(file_obj)
        img.verify()
        file_obj.seek(0)
    except Exception:
        return f"{label} is corrupted or an invalid image format."
    return None


class GalleryCategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]

    def get(self, request):
        
        try:

            from django.db.models import Prefetch
            categories = GalleryCategory.objects.prefetch_related(
                Prefetch(
                    'designs',
                    queryset=GalleryDesign.objects.filter(is_active=True).order_by('-id'),
                    to_attr='prefetched_active_designs'
                )
            )
            serializer = GalleryCategorySerializer(categories,many=True,context={'request': request})

            return Response(
                {
                    "success": True,
                    "data": serializer.data
                }
            )

        except Exception as e:
            logger.exception("GalleryCategoryAPIView get error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to fetch gallery categories."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):

        try:

            if not request.user.is_superuser:

                return Response(
                    {
                        "success": False,
                        "message": "Permission denied."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer = GalleryCategorySerializer(data=request.data)

            if serializer.is_valid():

                serializer.save()

                return Response(
                    {
                        "success": True,
                        "message": "Category created successfully."
                    },
                    status=status.HTTP_201_CREATED
                )

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.exception("GalleryCategoryAPIView post error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to create category."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request):
        try:

            if not request.user.is_superuser:
                return Response(
                    {
                        "success": False,
                        "message": "Permission denied."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            category_ids = request.data.get("category_ids", [])

            if not category_ids or not isinstance(category_ids, list):
                return Response(
                    {
                        "success": False,
                        "message": "category_ids is required and must be a non-empty list."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            name = request.data.get("name")
            if name is None:
                return Response(
                    {
                        "success": False,
                        "message": "name is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not isinstance(name, str) or not name.strip():
                return Response(
                    {
                        "success": False,
                        "message": "name must be a non-empty string."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            name = name.strip()

            GalleryCategory.objects.filter(
                id__in=category_ids
            ).update(name=name)

            return Response(
                {
                    "success": True,
                    "message": "Category(s) updated successfully."
                }
            )

        except Exception as e:
            logger.exception("GalleryCategoryAPIView patch error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to update categories."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )        

    def delete(self, request):
        try:

            if not request.user.is_superuser:
                return Response(
                    {
                        "success": False,
                        "message": "Permission denied."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            category_ids = request.data.get("category_ids", [])

            if not category_ids:
                return Response(
                    {
                        "success": False,
                        "message": "category_ids is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            GalleryCategory.objects.filter(
                id__in=category_ids
            ).delete()

            return Response(
                {
                    "success": True,
                    "message": "Category(s) deleted successfully."
                }
            )

        except Exception as e:
            logger.exception("GalleryCategoryAPIView delete error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to delete categories."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GalleryDesignAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]

    def get(self, request, id=None):

        try:

            if id:

                design = GalleryDesign.objects.get(id=id)
                serializer = GalleryDesignSerializer(
                    design,
                    context={"request": request}
                )

                return Response(
                    {
                        "success": True,
                        "data": serializer.data
                    }
                )

            category_id = request.GET.get("category_id")

            queryset = GalleryDesign.objects.select_related("category").filter(
                is_active=True
            ).order_by("-id")      # or "-created_at" if the field exists

            if category_id:
                queryset = queryset.filter(category_id=category_id)

            paginator = TShirtPagination()
            page = paginator.paginate_queryset(queryset, request)

            if page is not None:
                serializer = GalleryDesignSerializer(
                    page,
                    many=True,
                    context={"request": request}
                )
                return paginator.get_paginated_response(serializer.data)

            serializer = GalleryDesignSerializer(
                queryset,
                many=True,
                context={"request": request}
            )

            return Response(
                {
                    "success": True,
                    "data": serializer.data
                }
            )

        except GalleryDesign.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Design not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            logger.exception("GalleryDesignAPIView get error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to retrieve gallery designs."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def post(self, request):

        try:

            if not request.user.is_superuser:
                return Response(
                    {
                        "success": False,
                        "message": "Permission denied."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            front_image = request.FILES.get("front_image")
            back_image = request.FILES.get("back_image")

            if not front_image or not back_image:
                return Response(
                    {
                        "success": False,
                        "message": "Front and Back images are required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            err = validate_gallery_image(front_image, "Front image")
            if err:
                return Response({"success": False, "message": err}, status=status.HTTP_400_BAD_REQUEST)

            err = validate_gallery_image(back_image, "Back image")
            if err:
                return Response({"success": False, "message": err}, status=status.HTTP_400_BAD_REQUEST)

            front_url = upload_file_to_google_drive(
                file_obj=front_image,
                filename=f"{uuid.uuid4().hex}_{os.path.splitext(front_image.name)[0]}.webp",
                folder_name="gallery/front",
                public=True
            )

            back_url = upload_file_to_google_drive(
                file_obj=back_image,
                filename=f"{uuid.uuid4().hex}_{os.path.splitext(back_image.name)[0]}.webp",
                folder_name="gallery/back",
                public=True
            )

            design = GalleryDesign.objects.create(
                category_id=request.data.get("category"),
                design_name=request.data.get("design_name"),
                front_image_url=front_url,
                back_image_url=back_url,
                description=request.data.get("description")
            )

            return Response(
                {
                    "success": True,
                    "message": "Design uploaded successfully.",
                    "data": GalleryDesignSerializer(
                        design,
                        context={"request": request}
                    ).data
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.exception("GalleryDesignAPIView post error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to upload gallery design."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def patch(self, request, id):

        try:

            if not request.user.is_superuser:

                return Response(
                    {
                        "success": False,
                        "message": "Permission denied."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            design = GalleryDesign.objects.get(id=id)
            front_image = request.FILES.get("front_image")
            back_image = request.FILES.get("back_image")

            if front_image:
                err = validate_gallery_image(front_image, "Front image")
                if err:
                    return Response({"success": False, "message": err}, status=status.HTTP_400_BAD_REQUEST)

                old_url = design.front_image_url

                new_url = upload_file_to_google_drive(
                    file_obj=front_image,
                    filename = f"{uuid.uuid4().hex}_{os.path.splitext(front_image.name)[0]}.webp",
                    folder_name="gallery/front",
                    public=True
                )

                design.front_image_url = new_url

                if old_url:
                    try:
                        delete_file_from_google_drive(old_url)
                    except Exception:
                        pass


            if back_image:
                err = validate_gallery_image(back_image, "Back image")
                if err:
                    return Response({"success": False, "message": err}, status=status.HTTP_400_BAD_REQUEST)

                old_url = design.back_image_url

                new_url = upload_file_to_google_drive(
                    file_obj=back_image,
                    filename = f"{uuid.uuid4().hex}_{os.path.splitext(back_image.name)[0]}.webp",
                    folder_name="gallery/back",
                    public=True
                )

                design.back_image_url = new_url

                if old_url:
                    try:
                        delete_file_from_google_drive(old_url)
                    except Exception:
                        pass


            if request.data.get("category"):
                design.category_id = request.data.get("category")

            if request.data.get("design_name"):
                design.design_name = request.data.get("design_name")

            if request.data.get("description") is not None:
                design.description = request.data.get("description")

            if request.data.get("is_active") is not None:
                design.is_active = request.data.get("is_active")

            design.save()

            return Response(
                {
                    "success": True,
                    "message": "Design updated successfully.",
                    "data": GalleryDesignSerializer(
                        design,
                        context={"request": request}
                    ).data
                }
            )

        except GalleryDesign.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Design not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            logger.exception("GalleryDesignAPIView patch error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to update gallery design."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, id):

        try:

            if not request.user.is_superuser:

                return Response(
                    {
                        "success": False,
                        "message": "Permission denied."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            design = GalleryDesign.objects.get(id=id)

            if design.front_image_url:
                try:
                    delete_file_from_google_drive(design.front_image_url)
                except Exception:
                    pass

            if design.back_image_url:
                try:
                    delete_file_from_google_drive(design.back_image_url)
                except Exception:
                    pass

            design.delete()

            return Response(
                {
                    "success": True,
                    "message": "Design deleted successfully."
                }
            )

        except GalleryDesign.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Design not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            logger.exception("GalleryDesignAPIView delete error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to delete gallery design."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )