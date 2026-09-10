from django.urls import path
from .views import *

urlpatterns = [

    path("design/",DesignAPIView.as_view(),name="design-list-create"),
    path("design/<int:design_id>/",DesignAPIView.as_view(),name="design-detail"),
    path("my-designs/",MyDesignAPIView.as_view()),
]