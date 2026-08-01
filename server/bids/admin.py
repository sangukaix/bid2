from django.contrib import admin

from .models import (
    BidAnalysis,
    BidChatMessage,
    BidNotice,
    BidProposal,
    CompanyDocument,
    CompanyKnowledgeItem,
    CompanyProfile,
    RecommendedBid,
    SavedBid,
)


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = (
        "company_name",
        "business_registration_number",
        "representative_name",
        "industry",
        "company_type",
        "updated_at",
    )
    search_fields = (
        "company_name",
        "business_registration_number",
        "representative_name",
        "user__username",
        "user__email",
    )
    list_filter = ("company_type", "preferred_bid_type")
    readonly_fields = ("created_at", "updated_at")


@admin.register(CompanyDocument)
class CompanyDocumentAdmin(admin.ModelAdmin):
    list_display = ("original_name", "user", "document_type", "uploaded_at")
    list_filter = ("document_type", "uploaded_at")
    search_fields = ("original_name", "user__username")
    readonly_fields = ("uploaded_at",)


@admin.register(CompanyKnowledgeItem)
class CompanyKnowledgeItemAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "source_document",
        "user",
        "updated_at",
    )
    list_filter = ("category", "updated_at")
    search_fields = (
        "title",
        "content",
        "source_document__original_name",
        "user__username",
    )
    readonly_fields = (
        "user",
        "source_document",
        "category",
        "title",
        "content",
        "source_locations",
        "evidence_excerpt",
        "tags",
        "created_at",
        "updated_at",
    )


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


@admin.register(SavedBid)
class SavedBidAdmin(admin.ModelAdmin):
    list_display = ("user", "bid_notice", "created_at")  # 관리자 목록에 보일 정보
    search_fields = (
        "user__username",
        "bid_notice__bid_ntce_no",
        "bid_notice__title",
    )
    readonly_fields = ("created_at",)


@admin.register(RecommendedBid)
class RecommendedBidAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "bid_notice",
        "match_score",
        "notification_sent_at",
        "created_at",
    )
    search_fields = ("user__username", "bid_notice__bid_ntce_no", "bid_notice__title")
    list_filter = ("notification_sent_at", "created_at")
    readonly_fields = ("created_at", "updated_at")


@admin.register(BidAnalysis)
class BidAnalysisAdmin(admin.ModelAdmin):
    list_display = ("saved_bid", "created_at", "updated_at")
    search_fields = ("saved_bid__user__username", "saved_bid__bid_notice__bid_ntce_no")
    readonly_fields = ("report", "created_at", "updated_at")


@admin.register(BidChatMessage)
class BidChatMessageAdmin(admin.ModelAdmin):
    list_display = ("saved_bid", "role", "created_at")
    search_fields = ("saved_bid__user__username", "saved_bid__bid_notice__bid_ntce_no", "content")
    list_filter = ("role", "created_at")
    readonly_fields = ("saved_bid", "role", "content", "sources", "created_at")


@admin.register(BidProposal)
class BidProposalAdmin(admin.ModelAdmin):
    list_display = ("saved_bid", "output_format", "created_at", "updated_at")
    search_fields = ("saved_bid__user__username", "saved_bid__bid_notice__bid_ntce_no")
    list_filter = ("output_format", "template_mode", "created_at")
    readonly_fields = (
        "saved_bid",
        "output_format",
        "template_mode",
        "strategy",
        "revision_plan",
        "generated_file",
        "created_at",
        "updated_at",
    )

