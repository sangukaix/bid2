from django.contrib import admin

from .models import BidNotice


@admin.register(BidNotice)
class BidNoticeAdmin(admin.ModelAdmin):
    list_display = (
        "bid_ntce_no",
        "title",
        "business_type",
        "notice_organization",
        "budget_amount",
        "close_at",
        "deadline_status",
        "is_active",
    )
    list_filter = (
        "deadline_status",
        "is_active",
        "business_type",
        "notice_date",
    )
    search_fields = (
        "bid_ntce_no",
        "title",
        "notice_organization",
        "demand_organization",
        "allowed_region",
        "allowed_industry",
    )
    ordering = ("close_at", "-notice_date")
    list_per_page = 50
    date_hierarchy = "notice_date"
    readonly_fields = ("raw_data", "created_at", "updated_at")

