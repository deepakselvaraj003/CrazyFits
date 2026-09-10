from django.urls import path

from .views import *

urlpatterns = [
    # User / Public
    path("",UserFeedbackAPIView.as_view(),name="feedback-list-create",),
    path("<int:id>/",UserFeedbackAPIView.as_view(),name="feedback-detail",),
    # Admin
    path("admin/",AdminFeedbackAPIView.as_view(),name="admin-feedback",),
    path("admin/<int:id>/",AdminFeedbackAPIView.as_view(),name="admin-feedback-detail",),
    path("admin/filter/",FeedbackFilterAPIView.as_view(),name="admin-feedback-filter",),
]