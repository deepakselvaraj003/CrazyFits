from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from common.google_drive import get_google_drive_service
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from google.auth.exceptions import RefreshError
from .models import EmailOTP
from django.shortcuts import redirect
import random,logging,secrets,requests
from django.conf import settings
from .models import CloudConnect
from .serializers import *
logger = logging.getLogger(__name__)




class LoginAPIView(APIView):

    def post(self, request):

        try:

            serializer = LoginSerializer(data=request.data)
            if serializer.is_valid():

                user = serializer.validated_data["user"]
                refresh = RefreshToken.for_user(user)

                response = Response(
                    {
                        "success": True,
                        "message": "Login successful.",
                        "access_token": str(refresh.access_token),
                        "refresh_token": str(refresh),
                        "user": {
                            "id": user.id,
                            "full_name": user.full_name,
                            "email": user.email
                        }
                    }
                )
                response.set_cookie(
                    key="access_token",
                    value=str(refresh.access_token),
                    httponly=True,
                    samesite="Lax",
                    secure=not settings.DEBUG,
                    max_age=1800,  # 30 minutes
                )
                return response

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.exception("LoginAPIView error")
            return Response(
                {
                    "success": False,
                    "message": "An unexpected error occurred during login. Please try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProfileAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        try:

            serializer = ProfileSerializer(request.user)
            return Response(
                {
                    "success": True,
                    "data": serializer.data
                }
            )

        except Exception as e:
            logger.exception("ProfileAPIView error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to fetch profile."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SendOTPAPIView(APIView):

    def post(self, request):

        try:

            serializer = SendOTPSerializer(data=request.data)
            if serializer.is_valid():

                email = serializer.validated_data["email"]

                # Prune expired OTPs to maintain table hygiene
                EmailOTP.objects.filter(expires_at__lt=timezone.now()).delete()

                recent_otp = EmailOTP.objects.filter(
                    email=email,
                    created_at__gte=timezone.now() - timedelta(minutes=1)
                ).exists()

                if recent_otp:
                    return Response(
                        {
                            "success": False,
                            "message": "Please wait 1 minute before requesting another OTP."
                        },
                        status=status.HTTP_429_TOO_MANY_REQUESTS
                    )
                otp = f"{secrets.randbelow(900000) + 100000:06d}"
                EmailOTP.objects.filter(email=email).delete()
                EmailOTP.objects.create(email=email,otp=otp)

                send_mail(
                    subject="OTP Verification",
                    message=f"Your OTP is {otp}",
                    from_email=None,
                    recipient_list=[email]
                )

                return Response(
                    {
                        "success": True,
                        "message": "OTP sent successfully."
                    }
                )

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.exception("SendOTPAPIView error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to send OTP. Please try again later."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifyOTPAPIView(APIView):

    def post(self, request):

        try:

            serializer = VerifyOTPSerializer(data=request.data)

            if serializer.is_valid():

                email = serializer.validated_data["email"]
                otp = serializer.validated_data["otp"]
                otp_obj = EmailOTP.objects.filter(email=email).first()

                if not otp_obj:

                    return Response(
                        {
                            "success": False,
                            "message": "Invalid OTP or OTP not requested."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if timezone.now() > otp_obj.expires_at:
                    otp_obj.delete()
                    return Response(
                        {
                            "success": False,
                            "message": "OTP expired. Please request a new OTP."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if getattr(otp_obj, 'attempts', 0) >= 5:
                    otp_obj.delete()
                    return Response(
                        {
                            "success": False,
                            "message": "Too many failed attempts. Please request a new OTP."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if not secrets.compare_digest(str(otp_obj.otp), str(otp)):
                    otp_obj.attempts = getattr(otp_obj, 'attempts', 0) + 1
                    otp_obj.save(update_fields=["attempts"])
                    remaining = 5 - otp_obj.attempts
                    if remaining <= 0:
                        otp_obj.delete()
                        return Response(
                            {
                                "success": False,
                                "message": "Too many failed attempts. Please request a new OTP."
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    return Response(
                        {
                            "success": False,
                            "message": f"Invalid OTP. {remaining} attempt(s) remaining."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Delete OTP immediately upon success to prevent replay attacks
                otp_obj.delete()

                user, created = User.objects.get_or_create(email=email)
                refresh = RefreshToken.for_user(user)

                response = Response(
                    {
                        "success": True,
                        "message": "OTP verified successfully.",
                        "access_token": str(refresh.access_token),
                        "refresh_token": str(refresh),
                        "is_new_user": created,
                        "user": {
                                "id": user.id,
                                "email": user.email,
                                "full_name": user.full_name,
                            }
                                }
                )
                response.set_cookie(
                    key="access_token",
                    value=str(refresh.access_token),
                    httponly=True,
                    samesite="Lax",
                    secure=not settings.DEBUG,
                    max_age=1800,  # 30 minutes
                )
                return response

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.exception("VerifyOTPAPIView error")
            return Response(
                {
                    "success": False,
                    "message": "Verification failed. Please try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



      
class GoogleAuthURLAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):

        auth_url = (
            "https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={settings.GOOGLE_CLIENT_ID}"
            f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
            "&response_type=code"
            "&scope=https://www.googleapis.com/auth/drive"
            "&access_type=offline"
            "&prompt=consent"
        )

        return Response(
            {
                "success": True,
                "url": auth_url
            }
        )


class GoogleCallbackAPIView(APIView):
    permission_classes = []

    def get(self, request):
        code = request.GET.get("code")
        error = request.GET.get("error")

        if error or not code:
            logger.error("Google OAuth error or missing code: %s", error)
            return redirect(f"{settings.FRONTEND_URL}/admin/security?google_drive=error")

        try:
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
            res = requests.post(token_url, data=data)
            token_data = res.json()

            if res.status_code != 200 or "access_token" not in token_data:
                logger.error("Failed to exchange code for tokens: %s", token_data)
                return redirect(f"{settings.FRONTEND_URL}/admin/security?google_drive=error")

            refresh_token = token_data.get("refresh_token")

            cloud = CloudConnect.objects.filter(provider="google_drive").first()
            if not refresh_token and cloud:
                refresh_token = cloud.refresh_token

            if not refresh_token:
                logger.error("No refresh token received from Google.")
                return redirect(f"{settings.FRONTEND_URL}/admin/security?google_drive=error")

            CloudConnect.objects.update_or_create(
                provider="google_drive",
                defaults={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                    "is_active": True,
                }
            )

            return redirect(f"{settings.FRONTEND_URL}/admin/security?google_drive=connected")

        except Exception as e:
            logger.exception("Google OAuth callback error: %s", e)
            return redirect(f"{settings.FRONTEND_URL}/admin/security?google_drive=error")

    

class GoogleDriveStatusAPIView(APIView):

    permission_classes = [IsAdminUser]

    def get(self, request):

        cloud = CloudConnect.objects.filter(
            provider="google_drive"
        ).first()

        if not cloud:

            return Response(
                {
                    "success": True,
                    "connected": False,
                    "last_connected": None,
                    "message": "Google Drive has not been connected."
                }
            )

        try:

            get_google_drive_service()

            cloud.refresh_from_db()

            return Response(
                {
                    "success": True,
                    "connected": True,
                    "last_connected": cloud.updated_at,
                    "message": "Google Drive connected successfully."
                }
            )

        except RefreshError:

            cloud.refresh_from_db()

            return Response(
                {
                    "success": True,
                    "connected": False,
                    "last_connected": cloud.updated_at,
                    "message": "Google Drive connection expired."
                }
            )

        except Exception as e:

            logger.exception("GoogleDriveStatusAPIView error")

            return Response(
                {
                    "success": False,
                    "connected": False,
                    "message": "Failed to verify Google Drive connection."
                },
                status=500
            )       


class AdminSecurityAPIView(APIView):

    permission_classes = [IsAdminUser]

    def post(self, request):

        try:

            serializer = AdminSecuritySerializer(
                data=request.data,
                context={
                    "request": request
                }
            )

            if serializer.is_valid():

                user = request.user
                action = serializer.validated_data["action"]

                # -------------------------
                # CHANGE PASSWORD
                # -------------------------

                if action == "change_password":

                    new_password = serializer.validated_data["new_password"]
                    user.set_password(new_password)
                    user.save()
                    refresh_token = request.data.get("refresh")

                    if refresh_token:

                        try:
                            RefreshToken(refresh_token).blacklist()

                        except Exception:
                            pass

                    return Response(
                        {
                            "success": True,
                            "message": "Password changed successfully. Please login again."
                        },
                        status=status.HTTP_200_OK
                    )

                # -------------------------
                # CHANGE EMAIL
                # -------------------------

                elif action == "change_email":

                    new_email = serializer.validated_data[
                        "new_email"
                    ]

                    recent_otp = EmailOTP.objects.filter(
                        email=new_email,
                        created_at__gte=timezone.now() - timedelta(minutes=1)
                    ).exists()

                    if recent_otp:

                        return Response(
                            {
                                "success": False,
                                "message": "Please wait 1 minute before requesting another OTP."
                            },
                            status=status.HTTP_429_TOO_MANY_REQUESTS
                        )

                    otp = str(
                        random.randint(
                            100000,
                            999999
                        )
                    )

                    EmailOTP.objects.filter(
                        email=new_email
                    ).delete()

                    EmailOTP.objects.create(
                        email=new_email,
                        otp=otp
                    )

                    send_mail(
                        subject="Verify New Email",
                        message=f"""
                        Hello Admin,

                        Your OTP for changing your email address is:

                        {otp}

                        This OTP is valid for 5 minutes.

                        If you did not request this change, please ignore this email.
                                                """,
                        from_email=None,
                        recipient_list=[new_email]
                    )

                    return Response(
                        {
                            "success": True,
                            "message": "OTP sent successfully to your new email."
                        }
                    )


            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.exception("AdminProfileAPIView post error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to update profile. Please try again later."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request):

        try:

            user = request.user

            full_name = request.data.get("full_name", "").strip()

            if not full_name:

                return Response(
                    {
                        "success": False,
                        "message": "Full name is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if len(full_name) < 3:

                return Response(
                    {
                        "success": False,
                        "message": "Full name must be at least 3 characters."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.full_name = full_name
            user.save(update_fields=["full_name"])

            return Response(
                {
                    "success": True,
                    "message": "Full name updated successfully.",
                    "user": {
                        "id": user.id,
                        "full_name": user.full_name,
                        "email": user.email,
                    }
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.exception("AdminSecurityAPIView patch error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to update profile name."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class VerifyEmailChangeAPIView(APIView):

    permission_classes = [IsAdminUser]

    def post(self, request):

        try:

            serializer = AdminSecuritySerializer(data=request.data,context={"request": request})

            if serializer.is_valid():

                user = request.user
                new_email = serializer.validated_data["new_email"]
                otp = serializer.validated_data["otp"]
                otp_obj = EmailOTP.objects.filter(email=new_email,otp=otp).first()

                if not otp_obj:

                    return Response(
                        {
                            "success": False,
                            "message": "Invalid OTP."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if timezone.now() > otp_obj.expires_at:

                    otp_obj.delete()

                    return Response(
                        {
                            "success": False,
                            "message": "OTP has expired."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                user.email = new_email
                user.save()
                otp_obj.delete()

                refresh_token = request.data.get("refresh")
                if refresh_token:
                    try:
                        RefreshToken(refresh_token).blacklist()
                    except Exception:
                        pass

                return Response(
                    {
                        "success": True,
                        "message": "Email changed successfully. Please login again."
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
            logger.exception("VerifyEmailChangeAPIView error")
            return Response(
                {
                    "success": False,
                    "message": "Failed to verify email change."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view that updates the access_token in both the JSON
    response body and the secure HttpOnly cookie.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200 and "access" in response.data:
            access_token = response.data["access"]
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                samesite="Lax",
                secure=not settings.DEBUG,
                max_age=1800,  # 30 minutes
            )
        return response


class LogoutAPIView(APIView):
    """
    Logout view to clear the HttpOnly access_token cookie from the browser.
    """
    def post(self, request):
        response = Response({
            "success": True,
            "message": "Logged out successfully."
        })
        response.delete_cookie("access_token")
        return response


    
