from django.conf import settings
from django.db import models


class CompanyProfile(models.Model):
    class CompanyType(models.TextChoices):
        SMALL_MEDIUM = "small-medium", "중소기업"
        SMALL = "small", "소기업"
        MICRO = "micro", "소상공인"
        OTHER = "other", "기타"

    class PreferredBidType(models.TextChoices):
        SERVICE = "service", "용역"
        GOODS = "goods", "물품"
        CONSTRUCTION = "construction", "공사"

    # 회원 한 명과 회사 프로필 하나를 연결
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="company_profile",
    )

    # 회사 기본 정보
    company_name = models.CharField(max_length=200)
    business_registration_number = models.CharField(max_length=20, unique=True)
    representative_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    established_date = models.DateField(null=True, blank=True)
    address = models.TextField()

    # 회사 자격과 수행 역량
    industry = models.CharField(max_length=200)
    company_type = models.CharField(
        max_length=20,
        choices=CompanyType.choices,
        blank=True,
    )
    employee_count = models.PositiveIntegerField(null=True, blank=True)
    capital = models.PositiveBigIntegerField(null=True, blank=True)
    annual_revenue = models.PositiveBigIntegerField(null=True, blank=True)
    main_business = models.TextField()
    capabilities = models.TextField(blank=True)
    licenses = models.TextField(blank=True)
    past_performance = models.TextField(blank=True)

    # 사용자가 원하는 입찰 조건
    required_keywords = models.TextField(blank=True)  # 기존 데이터 호환용, preferred_keywords와 합쳐 사용
    preferred_keywords = models.TextField()
    excluded_keywords = models.TextField(blank=True)  # 포함되면 추천에서 제외할 검색어
    preferred_bid_type = models.CharField(
        max_length=20,
        choices=PreferredBidType.choices,
        blank=True,
    )
    preferred_region = models.CharField(max_length=200, blank=True)
    min_bid_amount = models.PositiveBigIntegerField(null=True, blank=True)
    max_bid_amount = models.PositiveBigIntegerField(null=True, blank=True)

    # 최초 저장 시간과 마지막 수정 시간
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.company_name


class BidNotice(models.Model):
    class DeadlineStatus(models.TextChoices):
        ACTIVE = "active", "유효"
        EXPIRED = "expired", "마감"
        REVIEW = "review", "확인 필요"

    # 나라장터에서 공고를 구분하는 기본 정보
    bid_ntce_no = models.CharField(max_length=50)
    bid_ntce_ord = models.CharField(max_length=10, default="000")

    # 목록과 검색에서 자주 사용하는 정보
    title = models.CharField(max_length=500)
    status = models.CharField(max_length=50, blank=True)
    business_type = models.CharField(max_length=50, blank=True)
    contract_method = models.CharField(max_length=100, blank=True)

    # 공고기관과 수요기관
    notice_organization = models.CharField(max_length=200, blank=True)
    demand_organization = models.CharField(max_length=200, blank=True)

    # 공고 일정
    notice_date = models.DateField(null=True, blank=True)
    close_at = models.DateTimeField(null=True, blank=True)
    deadline_status = models.CharField(
        max_length=20,
        choices=DeadlineStatus.choices,
        default=DeadlineStatus.REVIEW,
    )

    # 공고 금액
    budget_amount = models.BigIntegerField(null=True, blank=True)
    estimated_price = models.BigIntegerField(null=True, blank=True)

    # 참가 제한
    region_limit = models.BooleanField(default=False)
    allowed_region = models.TextField(blank=True)
    industry_limit = models.BooleanField(default=False)
    allowed_industry = models.TextField(blank=True)

    # 나라장터 원문 주소
    source_url = models.URLField(max_length=1000, blank=True)

    # API가 보내준 53개 필드를 원본 그대로 보관
    raw_data = models.JSONField(default=dict, blank=True)

    # 공고 활성 상태와 저장 시간
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["bid_ntce_no", "bid_ntce_ord"],
                name="unique_bid_notice",
            )
        ]

    def __str__(self):
        return f"{self.bid_ntce_no} - {self.title}"


class SavedBid(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_bids",
    )  # 어떤 회원이 저장했는지 연결
    bid_notice = models.ForeignKey(
        BidNotice,
        on_delete=models.CASCADE,
        related_name="saved_by_users",
    )  # 어떤 입찰공고를 저장했는지 연결
    created_at = models.DateTimeField(auto_now_add=True)  # 공고를 저장한 시간

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "bid_notice"],
                name="unique_user_saved_bid",
            )
        ]  # 같은 회원이 같은 공고를 중복 저장하지 못하게 함
        ordering = ["-created_at"]  # 최근에 저장한 공고부터 조회

    def __str__(self):
        return f"{self.user.username} - {self.bid_notice.bid_ntce_no}"


class RecommendedBid(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recommended_bids",
    )  # 추천받은 회원
    bid_notice = models.ForeignKey(
        BidNotice,
        on_delete=models.CASCADE,
        related_name="recommended_to_users",
    )  # 조건과 일치한 공고
    match_score = models.PositiveSmallIntegerField(default=0)
    title_match_count = models.PositiveSmallIntegerField(default=0)
    matched_keywords = models.JSONField(default=list, blank=True)
    match_reasons = models.JSONField(default=list, blank=True)
    is_match = models.BooleanField(default=True)  # 현재 회사 조건에도 계속 맞는 공고인지 표시
    notification_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "bid_notice"],
                name="unique_user_recommended_bid",
            )
        ]  # 같은 회원에게 같은 공고를 두 번 추천하거나 알리지 않음
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.bid_notice.bid_ntce_no}"


class BidAnalysis(models.Model):
    saved_bid = models.OneToOneField(
        SavedBid,
        on_delete=models.CASCADE,
        related_name="analysis",
    )  # 회원이 저장한 공고 하나와 분석 결과 하나를 연결
    report = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.saved_bid} AI 분석"


class BidChatMessage(models.Model):
    class Role(models.TextChoices):
        USER = "user", "사용자"
        ASSISTANT = "assistant", "AI"

    saved_bid = models.ForeignKey(
        SavedBid,
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )  # 회원이 저장한 공고와 대화 내용을 연결
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()
    sources = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.saved_bid} - {self.get_role_display()}"
