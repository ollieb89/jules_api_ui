from django.contrib import admin

from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "created_at")
    list_filter = ("created_at",)
    search_fields = ("name", "email")
    ordering = ("-created_at",)
