from django.db import models
from apps.accounts.models import User


class Feedback(models.Model):

    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name="feedbacks")
    rating = models.PositiveSmallIntegerField()
    review = models.TextField()
    admin_reply = models.TextField(null=True, blank=True)
    admin_replied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = "feedbacks"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.rating}"