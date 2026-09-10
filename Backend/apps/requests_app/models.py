from django.db import models
from apps.gallery.models import GalleryDesign
from apps.designs.models import Design


class QuoteRequest(models.Model):

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("contacted", "Contacted"),
        ("order_confirmed", "Order Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )

    request_number = models.CharField(max_length=50,unique=True)
    design = models.ForeignKey(Design,null=True,blank=True,on_delete=models.CASCADE,related_name="requests")
    gallery_design = models.ForeignKey(GalleryDesign,null=True,blank=True,on_delete=models.CASCADE, related_name="requests")
    customer_name = models.CharField(max_length=255,null=True,blank=True)
    email = models.EmailField()
    phone_number = models.CharField(max_length=20)
    quantity = models.PositiveIntegerField()
    size_breakdown =models.JSONField(default=dict)
    notes = models.TextField(null=True,blank=True)
    status = models.CharField(max_length=50,choices=STATUS_CHOICES,default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "quote_requests"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self):
        return self.request_number


class AdminNotification(models.Model):
    quote_request = models.ForeignKey(
        QuoteRequest,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications"
    )
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "admin_notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_read", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.message} (Read: {self.is_read})"