
from django.contrib import admin
from django.urls import path,include
from common.views import proxy_google_drive_image, gallery_google_drive_image

urlpatterns = [
    path('admin/', admin.site.urls),
    path('account/',include('apps.accounts.urls')),
    path('designs/',include('apps.designs.urls')),
    path('gallery/',include('apps.gallery.urls')),
    path('requests/',include('apps.requests_app.urls')),
    path('feedbacks/',include('apps.feedbacks.urls')),
    path('settings/',include('apps.settings_app.urls')),
    
    # Proxy endpoints for Google Drive images
    path('media/gallery/<str:file_id>/', gallery_google_drive_image, name='gallery_google_drive_image'),
    path('media/proxy/<str:file_id>/', proxy_google_drive_image, name='proxy_google_drive_image'),
]
