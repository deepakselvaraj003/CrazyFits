from rest_framework import serializers
from .models import Design
from common.google_drive import convert_to_proxy_url, convert_to_gallery_url


class DesignSerializer(serializers.ModelSerializer):

    request_status = serializers.SerializerMethodField()
    request_number = serializers.SerializerMethodField()
    quantity = serializers.SerializerMethodField()

    class Meta:

        model = Design

        fields = [
            "id",
            "design_name",
            "front_design_json",
            "back_design_json",
            "front_preview_image_url",
            "back_preview_image_url",
            "request_number",
            "quantity",
            "request_status",
            "created_at"
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        
        if ret.get('front_preview_image_url'):
            ret['front_preview_image_url'] = convert_to_proxy_url(request, ret['front_preview_image_url'])
            
        if ret.get('back_preview_image_url'):
            ret['back_preview_image_url'] = convert_to_proxy_url(request, ret['back_preview_image_url'])
            
        return ret

    def _get_first_request(self, obj):
        if not hasattr(obj, '_first_request_cache'):
            if hasattr(obj, '_prefetched_objects_cache') and 'requests' in obj._prefetched_objects_cache:
                requests_list = list(obj.requests.all())
                obj._first_request_cache = requests_list[0] if requests_list else None
            else:
                obj._first_request_cache = obj.requests.first()
        return obj._first_request_cache

    def get_request_status(self, obj):
        quote = self._get_first_request(obj)
        return quote.status if quote else None

    def get_request_number(self, obj):
        quote = self._get_first_request(obj)
        return quote.request_number if quote else None

    def get_quantity(self, obj):
        quote = self._get_first_request(obj)
        return quote.quantity if quote else None

class CreateDesignSerializer(serializers.ModelSerializer):

    class Meta:

        model = Design

        fields = [
            "design_name",
            "front_design_json",
            "back_design_json",
            "front_preview_image_url",
"back_preview_image_url",
        ]

    def validate_design_name(self, value):

        if not value.strip():

            raise serializers.ValidationError(
                "Design name is required."
            )

        return value
    
class UpdateDesignSerializer(serializers.ModelSerializer):

    class Meta:

        model = Design

        fields = [
            "design_name",
            "front_design_json",
            "back_design_json"
        ]


class MyDesignSerializer(serializers.Serializer):

    id = serializers.IntegerField()

    design_type = serializers.CharField()

    design_name = serializers.CharField()

    preview_image_url = serializers.CharField(
        allow_null=True,
        required=False
    )

    front_preview_image_url = serializers.CharField(
        allow_null=True,
        required=False
    )

    back_preview_image_url = serializers.CharField(
        allow_null=True,
        required=False
    )

    gallery_image_url = serializers.CharField(
        allow_null=True,
        required=False
    )

    request_number = serializers.CharField()

    quantity = serializers.IntegerField()

    request_status = serializers.CharField()

    created_at = serializers.DateTimeField()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        is_gallery = ret.get('design_type') == 'gallery'

        # Route images to either private or public proxy based on design type
        convert_fn = convert_to_gallery_url if is_gallery else convert_to_proxy_url

        if ret.get('preview_image_url'):
            ret['preview_image_url'] = convert_fn(request, ret['preview_image_url'])

        if ret.get('front_preview_image_url'):
            ret['front_preview_image_url'] = convert_fn(request, ret['front_preview_image_url'])

        if ret.get('back_preview_image_url'):
            ret['back_preview_image_url'] = convert_fn(request, ret['back_preview_image_url'])

        if ret.get('gallery_image_url'):
            ret['gallery_image_url'] = convert_to_gallery_url(request, ret['gallery_image_url'])

        return ret