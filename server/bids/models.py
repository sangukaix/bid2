from django.db import models


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
