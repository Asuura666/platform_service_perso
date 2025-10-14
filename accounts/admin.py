from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Feature, User


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ("name", "code")
    search_fields = ("name", "code")
    ordering = ("name",)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (("Fonctionnalités", {"fields": ("role", "features")}),)
    list_display = BaseUserAdmin.list_display + ("role",)
    list_filter = BaseUserAdmin.list_filter + ("role", "features")
    filter_horizontal = BaseUserAdmin.filter_horizontal + ("features",)
