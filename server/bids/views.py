from datetime import timedelta

from django.core.paginator import EmptyPage, Paginator
from django.db.models import Count, Q
from django.http import JsonResponse
from django.utils import timezone

from .models import BidNotice


DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
BUSINESS_TYPES = {"물품", "용역", "공사"}
DEADLINE_STATUSES = {
    BidNotice.DeadlineStatus.ACTIVE,
    BidNotice.DeadlineStatus.REVIEW,
}
REGIONS = {
    "seoul": "서울",
    "gyeonggi": "경기",
    "incheon": "인천",
}
DEADLINE_DAYS = {0, 3, 7, 30}


def parse_positive_integer(value, default, name):
    if value is None:
        return default

    try:
        number = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{name} must be a positive integer.") from error

    if number < 1:
        raise ValueError(f"{name} must be a positive integer.")

    return number


def serialize_notice(notice):
    item = dict(notice.raw_data or {})
    item["deadlineStatus"] = notice.deadline_status
    item["isActive"] = notice.is_active
    return item


def filter_notices(notices, request):
    query = request.GET.get("q", "").strip()
    business_type = request.GET.get("business_type", "").strip()
    deadline_status = request.GET.get("deadline_status", "").strip()
    region = request.GET.get("region", "").strip()
    deadline_days = request.GET.get("deadline_days", "").strip()

    if query:
        notices = notices.filter(
            Q(title__icontains=query)
            | Q(bid_ntce_no__icontains=query)
            | Q(notice_organization__icontains=query)
            | Q(demand_organization__icontains=query)
            | Q(allowed_region__icontains=query)
            | Q(allowed_industry__icontains=query)
        )

    if business_type:
        if business_type not in BUSINESS_TYPES:
            raise ValueError("business_type is not valid.")
        notices = notices.filter(business_type=business_type)

    if deadline_status:
        if deadline_status not in DEADLINE_STATUSES:
            raise ValueError("deadline_status is not valid.")
        notices = notices.filter(deadline_status=deadline_status)

    if region:
        if region not in REGIONS:
            raise ValueError("region is not valid.")
        notices = notices.filter(
            Q(region_limit=False) | Q(allowed_region__icontains=REGIONS[region])
        )

    if deadline_days:
        try:
            days = int(deadline_days)
        except ValueError as error:
            raise ValueError("deadline_days is not valid.") from error

        if days not in DEADLINE_DAYS:
            raise ValueError("deadline_days is not valid.")

        now = timezone.now()
        if days == 0:
            notices = notices.filter(close_at__date=timezone.localdate())
        else:
            notices = notices.filter(
                close_at__gte=now,
                close_at__lte=now + timedelta(days=days),
            )

    return notices


def bid_list(request):
    try:
        page_number = parse_positive_integer(request.GET.get("page"), 1, "page")
        page_size = parse_positive_integer(
            request.GET.get("page_size"),
            DEFAULT_PAGE_SIZE,
            "page_size",
        )
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)

    if page_size > MAX_PAGE_SIZE:
        return JsonResponse(
            {"error": f"page_size cannot be greater than {MAX_PAGE_SIZE}."},
            status=400,
        )

    notices = BidNotice.objects.filter(is_active=True)

    try:
        notices = filter_notices(notices, request)
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)

    summary = notices.aggregate(
        total=Count("id"),
        goods=Count("id", filter=Q(business_type="물품")),
        services=Count("id", filter=Q(business_type="용역")),
        construction=Count("id", filter=Q(business_type="공사")),
    )
    notices = notices.order_by("-notice_date", "-id")
    paginator = Paginator(notices, page_size)

    try:
        page = paginator.page(page_number)
    except EmptyPage:
        return JsonResponse({"error": "The requested page does not exist."}, status=404)

    return JsonResponse(
        {
            "count": paginator.count,
            "page": page.number,
            "page_size": page_size,
            "total_pages": paginator.num_pages,
            "summary": summary,
            "items": [serialize_notice(notice) for notice in page.object_list],
        }
    )
