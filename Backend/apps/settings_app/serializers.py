from rest_framework import serializers

from .models import BusinessSettings


class PlatformSettingsSerializer(serializers.ModelSerializer):

    class Meta:
        model = BusinessSettings
        fields = "__all__"

