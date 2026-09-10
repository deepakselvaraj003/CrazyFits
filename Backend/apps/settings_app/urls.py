from django.urls import path

from .views import *

urlpatterns = [

    path("platformsettings/",PlatformSettingsAPI.as_view()),
]