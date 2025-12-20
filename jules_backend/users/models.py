from django.db import models


class User(models.Model):
    """User model matching the original SQLAlchemy schema."""

    name = models.CharField(max_length=50)
    email = models.CharField(max_length=100, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:  # noqa: RUF012
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.email})"
