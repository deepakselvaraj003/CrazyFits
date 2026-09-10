from django.db import models


class BusinessSettings(models.Model):

    business_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()
    website_url = models.URLField(null=True,blank=True)
    instagram_url = models.URLField(null=True,blank=True)
    twitter_url = models.URLField(null=True,blank=True)
    design_url = models.URLField(null=True,blank=True)
    address = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "business_settings"

    def __str__(self):
        return self.business_name