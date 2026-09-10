from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User




class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):

        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(
            username=email,
            password=password
        )

        if not user:

            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.is_active:

            raise serializers.ValidationError(
                "Account is inactive."
            )

        if not user.is_superuser:

            raise serializers.ValidationError(
                "Only admin can login."
            )

        attrs["user"] = user

        return attrs

class ProfileSerializer(serializers.ModelSerializer):

    class Meta:

        model = User

        fields = [
            "id",
            "full_name",
            "email",
            "phone_number",
            "created_at"
        ]


class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):

    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class GoogleAuthURLSerializer(serializers.Serializer):
    url = serializers.CharField()



class AdminSecuritySerializer(serializers.Serializer):

    ACTION_CHOICES = (("change_password", "Change Password"),("change_email", "Change Email"))

    action = serializers.ChoiceField(choices=ACTION_CHOICES,required=False)
    current_password = serializers.CharField(write_only=True,required=False,trim_whitespace=False)
    new_password = serializers.CharField(write_only=True,required=False,trim_whitespace=False)
    new_email = serializers.EmailField(required=False)
    otp = serializers.CharField(max_length=6,min_length=6,required=False)

    def validate(self, attrs):

        request = self.context["request"]
        user = request.user
        action = attrs.get("action")

        if not user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        if not user.is_superuser:
            raise serializers.ValidationError("Only super admin can perform this action.")

        if action == "change_password":
            current_password = attrs.get("current_password")
            new_password = attrs.get("new_password")

            if not current_password:
                raise serializers.ValidationError(
                    {
                        "current_password":
                        "Current password is required."
                    }
                )

            if not new_password:
                raise serializers.ValidationError(
                    {
                        "new_password":
                        "New password is required."
                    }
                )

            if not user.check_password(current_password):
                raise serializers.ValidationError(
                    {
                        "current_password":
                        "Current password is incorrect."
                    }
                )

            if current_password == new_password:
                raise serializers.ValidationError(
                    {
                        "new_password":
                        "New password cannot be same as current password."
                    }
                )

            validate_password(new_password, user)

        elif action == "change_email":

            current_password = attrs.get("current_password")
            new_email = attrs.get("new_email")

            if not current_password:
                raise serializers.ValidationError(
                    {
                        "current_password":
                        "Current password is required."
                    }
                )

            if not new_email:
                raise serializers.ValidationError(
                    {
                        "new_email":
                        "New email is required."
                    }
                )

            if not user.check_password(current_password):
                raise serializers.ValidationError(
                    {
                        "current_password":
                        "Current password is incorrect."
                    }
                )

            if new_email.lower() == user.email.lower():
                raise serializers.ValidationError(
                    {
                        "new_email":
                        "New email cannot be same as current email."
                    }
                )

            if User.objects.filter(
                email__iexact=new_email
            ).exists():

                raise serializers.ValidationError(
                    {
                        "new_email":
                        "Email already exists."
                    }
                )

        else:

            otp = attrs.get("otp")
            new_email = attrs.get("new_email")

            if not otp:
                raise serializers.ValidationError(
                    {
                        "otp": "OTP is required."
                    }
                )

            if not new_email:
                raise serializers.ValidationError(
                    {
                        "new_email":
                        "New email is required."
                    }
                )

        return attrs
