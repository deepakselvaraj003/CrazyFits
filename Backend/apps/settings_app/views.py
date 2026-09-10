import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from .models import BusinessSettings
from .serializers import PlatformSettingsSerializer

logger = logging.getLogger(__name__)


class PlatformSettingsAPI(APIView):

    def get_permissions(self):

        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAdminUser()]

    def get(self, request):

        try:

            settings, created = BusinessSettings.objects.get_or_create(
                id=1,
                defaults={
                    "business_name": "",
                    "phone_number": "",
                    "email": "",
                    "address": ""
                }
            )

            serializer = PlatformSettingsSerializer(settings)

            return Response(
                {
                    "success": True,
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.exception("PlatformSettingsAPI get error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to retrieve business settings."
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

            settings, created = BusinessSettings.objects.get_or_create(
                id=1,
                defaults={
                    "business_name": "",
                    "phone_number": "",
                    "email": "",
                    "address": ""
                }
            )

            serializer = PlatformSettingsSerializer(
                settings,
                data=request.data,
                partial=True
            )

            if serializer.is_valid():

                serializer.save()

                return Response(
                    {
                        "success": True,
                        "message": "Settings updated successfully.",
                        "data": serializer.data
                    },
                    status=status.HTTP_200_OK
                )

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.exception("PlatformSettingsAPI patch error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to update business settings."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )