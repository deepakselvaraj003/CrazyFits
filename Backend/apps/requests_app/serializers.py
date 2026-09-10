from rest_framework import serializers
from apps.designs.models import Design
from .models import QuoteRequest, AdminNotification
from apps.gallery.models import GalleryDesign
from common.google_drive import convert_to_proxy_url, convert_to_gallery_url

class CreateQuoteRequestSerializer(serializers.ModelSerializer):

    design_id = serializers.IntegerField(write_only=True, required=False)
    gallery_design_id  = serializers.IntegerField(write_only=True, required=False)
    size_breakdown = serializers.JSONField()

    class Meta:
        model = QuoteRequest
        fields = [
            "design_id",
            "gallery_design_id",
            "customer_name",
            "email",
            "phone_number",
            "size_breakdown",
            "notes",
        ]

    def validate(self, attrs):

        design_id = attrs.get("design_id")
        gallery_design_id = attrs.get("gallery_design_id")

        if not design_id and not gallery_design_id:
            raise serializers.ValidationError(
                "design_id or gallery_design_id is required."
            )

        if design_id and gallery_design_id:
            raise serializers.ValidationError(
                "Only one design source is allowed."
            )

        if design_id:

            if not Design.objects.filter(id=design_id).exists():
                raise serializers.ValidationError(
                    {"design_id": "Design not found."}
                )

        if gallery_design_id:

            if not GalleryDesign.objects.filter(id=gallery_design_id).exists():
                raise serializers.ValidationError(
                    {"gallery_design_id": "Gallery design not found."}
                )

        return attrs

    def validate_customer_name(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Customer name must contain at least 3 characters."
            )

        return value

    def validate_email(self, value):
        return value.strip().lower()

    def validate_phone_number(self, value):
        value = value.strip()

        if not value.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only digits."
            )

        if len(value) != 10:
            raise serializers.ValidationError(
                "Phone number must contain exactly 10 digits."
            )

        return value

    def validate_size_breakdown(self, value):

        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "Size breakdown must be an object."
            )

        total = 0

        for size, qty in value.items():

            if not isinstance(qty, int):
                raise serializers.ValidationError(
                    f"{size} quantity must be an integer."
                )

            if qty < 0:
                raise serializers.ValidationError(
                    f"{size} quantity cannot be negative."
                )

            total += qty

        if total <= 0:
            raise serializers.ValidationError(
                "At least one size quantity is required."
            )

        return value


class QuoteRequestSerializer(serializers.ModelSerializer):

    design_name = serializers.SerializerMethodField()
    preview_image_url = serializers.SerializerMethodField()
    design_type = serializers.SerializerMethodField()
    preview_image = serializers.SerializerMethodField()
    gallery_back_preview = serializers.SerializerMethodField()
    front_preview = serializers.SerializerMethodField()
    back_preview = serializers.SerializerMethodField()
    front_design_details = serializers.SerializerMethodField()
    back_design_details = serializers.SerializerMethodField()
    has_front_pngs = serializers.SerializerMethodField()
    has_back_pngs = serializers.SerializerMethodField()

    class Meta:
        model = QuoteRequest

        fields = [
            "id",
            "request_number",

            "customer_name",
            "email",
            "phone_number",
            "design_name",
            "preview_image_url",
            "quantity",
            "size_breakdown",
            "notes",
            "status",
            "created_at",
            "updated_at",
            "design_type",
            "preview_image",
            "gallery_back_preview",
            "front_preview",
            "back_preview",
            "front_design_details",
            "back_design_details",
            "has_front_pngs",
            "has_back_pngs",
        ]

    def get_design_name(self, obj):

        if obj.design:
            return obj.design.design_name

        if obj.gallery_design:
            return obj.gallery_design.design_name

        return None

    def get_design_type(self, obj):

        if obj.design:
            return "custom"

        if obj.gallery_design:
            return "gallery"

        return None

    def get_preview_image_url(self, obj):

        if obj.design:

            return (
                obj.design.front_preview_image_url
                or obj.design.back_preview_image_url
            )

        if obj.gallery_design:
            return (
                obj.gallery_design.front_image_url
                or obj.gallery_design.back_image_url
            )

        return None
    

    def get_preview_image(self, obj):

        if obj.gallery_design:
            return (
                obj.gallery_design.front_image_url
                or obj.gallery_design.back_image_url
            )

        return None


    def get_gallery_back_preview(self, obj):

        if obj.gallery_design:
            return obj.gallery_design.back_image_url

        return None


    def get_front_preview(self, obj):

        if obj.design:
            return obj.design.front_preview_image_url

        return None


    def get_back_preview(self, obj):

        if obj.design:
            return obj.design.back_preview_image_url

        return None

    def get_front_design_details(self, obj):
        if obj.design and obj.design.front_design_json:
            # Extract just fonts and colors to be safe with old structures
            return {
                "fonts": obj.design.front_design_json.get("fonts", []),
                "colors": obj.design.front_design_json.get("colors", [])
            }
        return None

    def get_back_design_details(self, obj):
        if obj.design and obj.design.back_design_json:
            return {
                "fonts": obj.design.back_design_json.get("fonts", []),
                "colors": obj.design.back_design_json.get("colors", [])
            }
        return None

    def get_has_front_pngs(self, obj):
        return bool(obj.design and obj.design.front_png_files)

    def get_has_back_pngs(self, obj):
        return bool(obj.design and obj.design.back_png_files)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        is_gallery = ret.get('design_type') == 'gallery'

        # preview_image_url and preview_image come from gallery_design -> public proxy
        # front_preview and back_preview come from custom design -> private proxy
        if ret.get('preview_image_url'):
            if is_gallery:
                ret['preview_image_url'] = convert_to_gallery_url(request, ret['preview_image_url'])
            else:
                ret['preview_image_url'] = convert_to_proxy_url(request, ret['preview_image_url'])

        if ret.get('preview_image'):
            # preview_image always comes from gallery_design
            ret['preview_image'] = convert_to_gallery_url(request, ret['preview_image'])

        if ret.get('gallery_back_preview'):
            # gallery_back_preview comes from gallery_design -> public proxy
            ret['gallery_back_preview'] = convert_to_gallery_url(request, ret['gallery_back_preview'])

        if ret.get('front_preview'):
            # front_preview always comes from custom design
            ret['front_preview'] = convert_to_proxy_url(request, ret['front_preview'])

        if ret.get('back_preview'):
            # back_preview always comes from custom design
            ret['back_preview'] = convert_to_proxy_url(request, ret['back_preview'])

        return ret



class UpdateRequestStatusSerializer(serializers.Serializer):
    request_ids = serializers.ListField(child=serializers.IntegerField(),min_length=1)
    status = serializers.ChoiceField(choices=QuoteRequest.STATUS_CHOICES)



class QuoteRequestFilterSerializer(serializers.Serializer):

    DATE_CHOICES = (
        ("today", "Today"),
        ("yesterday", "Yesterday"),
        ("this_week", "This Week"),
        ("last_week", "Last Week"),
        ("custom", "Custom"),
    )

    date_filter = serializers.ChoiceField(
        choices=DATE_CHOICES,
        required=False
    )

    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    search = serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate(self, attrs):

        if attrs.get("date_filter") == "custom":

            if not attrs.get("start_date"):
                raise serializers.ValidationError(
                    {"start_date": "Start date is required."}
                )

            if not attrs.get("end_date"):
                raise serializers.ValidationError(
                    {"end_date": "End date is required."}
                )

            if attrs["start_date"] > attrs["end_date"]:
                raise serializers.ValidationError(
                    {"end_date": "End date must be after start date."}
                )

        return attrs


class AdminNotificationSerializer(serializers.ModelSerializer):
    request_id = serializers.IntegerField(source="quote_request.id", read_only=True)
    request_number = serializers.CharField(source="quote_request.request_number", read_only=True)
    customer_name = serializers.CharField(source="quote_request.customer_name", read_only=True)
    email = serializers.EmailField(source="quote_request.email", read_only=True)

    class Meta:
        model = AdminNotification
        fields = [
            "id",
            "quote_request",
            "request_id",
            "request_number",
            "customer_name",
            "email",
            "message",
            "is_read",
            "created_at",
        ]