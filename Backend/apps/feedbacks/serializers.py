from rest_framework import serializers
from .models import Feedback
from apps.requests_app.models import QuoteRequest

class FeedbackSerializer(serializers.ModelSerializer):
    admin_replied = serializers.SerializerMethodField()
    edited = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = [
            "id",
            "customer_name",
            "customer_email",
            "rating",
            "review",
            "admin_reply",
            "admin_replied",
            "edited",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "admin_reply",
            "admin_replied",
            "edited",
            "created_at",
            "updated_at"
        ]
    def get_quote(self, obj):
        return QuoteRequest.objects.filter(
            email=obj.user.email
        ).first()
    def get_admin_replied(self, obj):
        return bool(obj.admin_reply)

    def get_edited(self, obj):
        return obj.created_at != obj.updated_at

    def get_customer_name(self, obj):

        quote = self.get_quote(obj)

        if quote:
            return quote.customer_name

        return obj.user.full_name


    def get_customer_email(self, obj):

        quote = self.get_quote(obj)

        if quote:
            return quote.email

        return obj.user.email



class AdminFeedbackSerializer(serializers.ModelSerializer):
    
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    edited = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = [
            "id",
            "customer_name",
            "customer_email",
            "rating",
            "review",
            "admin_reply",
            "edited",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "customer_name",
            "customer_email",
            "rating",
            "review",
            "admin_reply",
            "created_at",
            "updated_at",
            "edited",
        ]
    def get_quote(self, obj):
        return QuoteRequest.objects.filter(
            email=obj.user.email
        ).first()

    def get_edited(self, obj):
        return obj.created_at != obj.updated_at

    def get_customer_name(self, obj):

        quote = self.get_quote(obj)

        if quote:
            return quote.customer_name

        return obj.user.full_name


    def get_customer_email(self, obj):

        quote = self.get_quote(obj)

        if quote:
            return quote.email

        return obj.user.email



class FeedbackFilterSerializer(serializers.Serializer):

    DATE_FILTER_CHOICES = (
        ("today", "Today"),
        ("yesterday", "Yesterday"),
        ("this_week", "This Week"),
        ("last_week", "Last Week"),
        ("custom", "Custom"),
    )

    search = serializers.CharField(
        required=False,
        allow_blank=True
    )

    date_filter = serializers.ChoiceField(
        choices=DATE_FILTER_CHOICES,
        required=False
    )

    start_date = serializers.DateField(
        required=False
    )

    end_date = serializers.DateField(
        required=False
    )

    def validate(self, attrs):

        if attrs.get("date_filter") == "custom":

            if not attrs.get("start_date") or not attrs.get("end_date"):

                raise serializers.ValidationError(
                    "Start date and end date are required for custom date filter."
                )

            if attrs["start_date"] > attrs["end_date"]:

                raise serializers.ValidationError(
                    "Start date cannot be greater than end date."
                )

        return attrs


