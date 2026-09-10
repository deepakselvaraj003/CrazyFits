from django.urls import path

from .views import *

urlpatterns = [

    path("requests/",QuoteRequestAPIView.as_view()),
    path("requests/<int:request_id>/",QuoteRequestAPIView.as_view()),
    path("requests/<int:request_id>/download-pngs/<str:side>/", DownloadPNGsAPIView.as_view()),
    path("requests/filter/",QuoteRequestFilterAPIView.as_view()),
    path("dashboard/",DashboardAPIView.as_view()),

    # Admin Notifications
    path("notifications/", AdminNotificationAPIView.as_view()),
    path("notifications/<int:notification_id>/", AdminNotificationAPIView.as_view()),
    path("notifications/<int:notification_id>/read/", AdminNotificationAPIView.as_view()),
    path("notifications/empty-all/", AdminNotificationAPIView.as_view()),

]