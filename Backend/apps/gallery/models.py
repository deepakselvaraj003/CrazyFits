from django.db import models


class GalleryCategory(models.Model):

    name = models.CharField(max_length=100,unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "gallery_categories"

    def __str__(self):
        
        return self.name


class GalleryDesign(models.Model):

    category = models.ForeignKey(GalleryCategory,on_delete=models.CASCADE,related_name="designs")
    design_name = models.CharField(max_length=255)
    front_image_url = models.URLField(max_length=1100, null=True, blank=True)
    back_image_url = models.URLField(max_length=1100, null=True, blank=True)
    description = models.TextField(null=True,blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "gallery_designs"
        indexes = [
            models.Index(fields=["is_active", "category"]),
        ]

    def __str__(self):
        return self.design_name