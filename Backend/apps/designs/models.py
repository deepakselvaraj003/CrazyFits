from django.db import models

from apps.accounts.models import User


class Design(models.Model):

    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name="designs")
    design_name = models.CharField(max_length=255)
    front_design_json = models.JSONField()
    back_design_json = models.JSONField(null=True,blank=True)
    front_preview_image_url = models.URLField(max_length=1100, null=True, blank=True)
    back_preview_image_url = models.URLField(max_length=1100, null=True, blank=True)
    front_png_files = models.JSONField(default=list, blank=True)
    back_png_files = models.JSONField(default=list, blank=True)
    is_submitted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "designs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return self.design_name
    
