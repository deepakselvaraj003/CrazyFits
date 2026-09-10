from django.urls import path
from .views import *


urlpatterns = [

    path("login/",LoginAPIView.as_view()),
    path("profile/",ProfileAPIView.as_view()),
    path("refresh-token/",CustomTokenRefreshView.as_view()),
    path("logout/",LogoutAPIView.as_view()),
    path("send-otp/",SendOTPAPIView.as_view()),
    path("verify-otp/",VerifyOTPAPIView.as_view()),
    path("google/auth-url/",GoogleAuthURLAPIView.as_view()),
    path("imageupload/",GoogleCallbackAPIView.as_view(),name="google-callback-legacy"),
    path("google/callback/",GoogleCallbackAPIView.as_view(),name="google-callback"),

    path("admin/security/",AdminSecurityAPIView.as_view(),name="admin-security"),
    path("admin/security/verify/",VerifyEmailChangeAPIView.as_view(),name="verify-admin-email"),
    path("google/status/",GoogleDriveStatusAPIView.as_view(),name="google-status"),

]