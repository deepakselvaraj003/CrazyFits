from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from datetime import timedelta


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):

    username = None
    full_name = models.CharField(max_length=150,null=True,blank=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20,unique=True,null=True,blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email
    

class EmailOTP(models.Model):

    email = models.EmailField()
    otp = models.CharField(max_length=6)
    attempts = models.PositiveSmallIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "email_otp"

    def __str__(self):
        return self.email
    
    def save(self, *args, **kwargs):

        if not self.expires_at:
            self.expires_at = (timezone.now() +timedelta(minutes=5))

        super().save(*args, **kwargs)
   
class CloudConnect(models.Model):

    provider = models.CharField(max_length=100,unique=True)
    folder_ids = models.JSONField(default=dict,blank=True)
    client_id = models.TextField()
    client_secret = models.TextField()
    refresh_token = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:

        db_table = "cloud_connects"

    def __str__(self):

        return self.provider