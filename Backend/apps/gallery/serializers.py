from rest_framework import serializers
from common.google_drive import convert_to_gallery_url

from .models import (
    GalleryCategory,
    GalleryDesign
)


class GalleryCategorySerializer(serializers.ModelSerializer):

    first_image = serializers.SerializerMethodField()

    class Meta:

        model = GalleryCategory

        fields = "__all__"

    def get_first_image(self, obj):
        if hasattr(obj, 'prefetched_active_designs'):
            designs = obj.prefetched_active_designs
            first_design = designs[0] if designs else None
        else:
            first_design = obj.designs.filter(
                is_active=True
            ).order_by("-id").first()

        if not first_design:
            return None

        image_url = (
            first_design.front_image_url
            or first_design.back_image_url
        )

        if image_url:
            request = self.context.get("request")
            return convert_to_gallery_url(request, image_url)

        return None


class GalleryDesignSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:

        model = GalleryDesign

        fields = [
            "id",
            "category",
            "category_name",
            "design_name",
            "front_image_url",
            "back_image_url",
            "description",
            "is_active",
            "created_at"
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get("request")

        if ret.get("front_image_url"):
            ret["front_image_url"] = convert_to_gallery_url(
                request,
                ret["front_image_url"]
            )

        if ret.get("back_image_url"):
            ret["back_image_url"] = convert_to_gallery_url(
                request,
                ret["back_image_url"]
            )

        return ret