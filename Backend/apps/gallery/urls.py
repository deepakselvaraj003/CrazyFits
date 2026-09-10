from django.urls import path

from .views import *

urlpatterns = [

    path("categories/",GalleryCategoryAPIView.as_view()),
    path("designs/",GalleryDesignAPIView.as_view()),
    path("designs/<int:id>/",GalleryDesignAPIView.as_view()),
]