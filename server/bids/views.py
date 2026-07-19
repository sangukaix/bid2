from datetime import timedelta
from io import StringIO

from django.core.management import call_command
from django.core.paginator import EmptyPage, Paginator
from django.db.models import Count, F, Max, Q
from django.db.models.functions import Coalesce
from django.http import FileResponse, JsonResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import BidAnalysis, BidChatMessage, BidNotice, CompanyProfile, RecommendedBid, SavedBid
from .serializers import CompanyProfileSerializer, LoginSerializer, SignupSerializer
from .services.recommendation import get_profile_keywords


DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
RECOMMENDATION_LIMIT = 20
MAX_CHAT_QUESTION_LENGTH = 500  # 지나치게 긴 질문과 AI 비용을 제한
PREFERRED_BID_TYPE_MAP = {
    "service": "용역",
    "goods": "물품",
    "construction": "공사",
}
BUSINESS_TYPES = {"물품", "용역", "공사"}
DEADLINE_STATUSES = {
    BidNotice.DeadlineStatus.ACTIVE,
    BidNotice.DeadlineStatus.REVIEW,
}
REGIONS = {
    "seoul": "서울",
    "busan": "부산",
    "daegu": "대구",
    "incheon": "인천",
    "gwangju": "광주",
    "daejeon": "대전",
    "ulsan": "울산",
    "sejong": "세종",
    "gyeonggi": "경기",
    "gangwon": "강원",
    "chungbuk": "충북",
    "chungnam": "충남",
    "jeonbuk": "전북",
    "jeonnam": "전남",
    "gyeongbuk": "경북",
    "gyeongnam": "경남",
    "jeju": "제주",
}
DEADLINE_DAYS = {0, 3, 7, 30}
DEADLINE_SORTS = {"asc", "desc"}
REGION_ALIASES = {
    "충북": ("충북", "충청북도"),
    "충남": ("충남", "충청남도"),
    "전북": ("전북", "전라북도"),
    "전남": ("전남", "전라남도"),
    "경북": ("경북", "경상북도"),
    "경남": ("경남", "경상남도"),
}


def build_region_condition(regions):
    condition = Q(region_limit=False)  # 지역 제한이 없으면 어느 희망 지역에서든 참가 가능

    for region in regions:
        for alias in REGION_ALIASES.get(region, (region,)):
            condition |= Q(allowed_region__icontains=alias)

    return condition


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()  # 현재 사용자의 로그인 Token 삭제
    return Response({"message": "로그아웃되었습니다."})


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)  # 사용자 인증표 발급
        return Response(
            {
                "token": token.key,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            }
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()  # 검사된 정보로 Django 회원 생성
        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                }
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST", "PATCH"])
@permission_classes([IsAuthenticated])
def company_profile(request):
    profile = CompanyProfile.objects.filter(user=request.user).first()

    if request.method == "GET":  # 로그인한 사용자의 회사 정보 조회
        if profile is None:
            return Response({"profile": None})

        serializer = CompanyProfileSerializer(profile)
        return Response({"profile": serializer.data})

    if request.method == "PATCH":  # 기존 회사 정보 중 전달받은 값만 수정
        if profile is None:
            return Response(
                {"error": "Company profile does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanyProfileSerializer(
            profile,
            data=request.data,
            partial=True,
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"profile": serializer.data})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if profile is not None:  # 한 사용자에게 회사 프로필이 중복 저장되는 것을 방지
        return Response(
            {"error": "Company profile already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = CompanyProfileSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)  # 로그인한 사용자를 회사 프로필에 연결
        return Response(
            {"profile": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


def get_last_updated_at():
    return BidNotice.objects.aggregate(last_updated_at=Max("updated_at"))[
        "last_updated_at"
    ]


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sync_bid_notices(request):
    """나라장터 최근 30일 공고를 즉시 다시 수집합니다."""
    command_output = StringIO()  # 관리 명령의 긴 터미널 출력을 API 응답에서 숨김

    try:
        call_command("sync_bids", stdout=command_output)
    except Exception:
        return Response(
            {"error": "나라장터 공고 업데이트에 실패했습니다."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {
            "message": "입찰공고를 최신 정보로 업데이트했습니다.",
            "last_updated_at": get_last_updated_at(),
            "count": BidNotice.objects.count(),
        }
    )


def serialize_notice(notice, match_reasons=None):
    item = dict(notice.raw_data or {})
    item["deadlineStatus"] = notice.deadline_status
    item["isActive"] = notice.is_active
    item["regionLimit"] = notice.region_limit
    item["allowedRegion"] = notice.allowed_region or "전국"
    item["bidNtceUrl"] = item.get("bidNtceUrl") or notice.source_url

    if match_reasons is not None:
        item["matchReasons"] = match_reasons

    return item


def serialize_saved_bid(saved_bid):
    item = serialize_notice(saved_bid.bid_notice)  # 연결된 입찰공고를 JSON 형태로 변환
    item["savedAt"] = saved_bid.created_at
    item["hasChat"] = bool(saved_bid.chat_messages.all())
    item["hasAnalysis"] = hasattr(saved_bid, "analysis")
    return item


def serialize_recommendation(recommendation):
    item = serialize_notice(
        recommendation.bid_notice,
        recommendation.match_reasons,
    )
    item["matchScore"] = recommendation.match_score
    item["matchedKeywords"] = recommendation.matched_keywords
    item["matchedAt"] = recommendation.created_at
    item["notificationSentAt"] = recommendation.notification_sent_at
    return item


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stored_recommendation_list(request):
    recommendations = RecommendedBid.objects.filter(
        user=request.user,
        bid_notice__is_active=True,
        is_match=True,
    ).select_related("bid_notice").order_by(
        "-match_score",
        "-title_match_count",
        "-bid_notice__notice_date",
        "-bid_notice__close_at",
    )
    return Response(
        {
            "count": recommendations.count(),
            "pending_notification_count": recommendations.filter(
                notification_sent_at__isnull=True,
            ).count(),
            "items": [
                serialize_recommendation(recommendation)
                for recommendation in recommendations[:100]
            ],
        }
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def saved_bid_list(request):
    if request.method == "GET":
        saved_bids = SavedBid.objects.filter(user=request.user).select_related(
            "bid_notice", "analysis"
        ).prefetch_related("chat_messages")  # 사용 여부까지 한 번에 조회
        return Response(
            {
                "count": saved_bids.count(),
                "items": [serialize_saved_bid(saved_bid) for saved_bid in saved_bids],
            }
        )

    bid_ntce_no = str(request.data.get("bid_ntce_no", "")).strip()
    if not bid_ntce_no:
        return Response(
            {"error": "공고번호를 입력해 주세요."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    notice = (
        BidNotice.objects.filter(
            bid_ntce_no=bid_ntce_no,
            is_active=True,
        )
        .order_by("-bid_ntce_ord")
        .first()
    )  # 공고번호와 일치하는 최신 활성 공고 조회
    if notice is None:
        return Response(
            {"error": "저장할 입찰공고를 찾을 수 없습니다."},
            status=status.HTTP_404_NOT_FOUND,
        )

    saved_bid = SavedBid.objects.filter(
        user=request.user,
        bid_notice__bid_ntce_no=bid_ntce_no,
    ).first()
    if saved_bid is not None:
        if saved_bid.bid_notice_id != notice.id:
            saved_bid.bid_notice = notice
            saved_bid.save(update_fields=["bid_notice"])
        return Response(
            {"created": False, "item": serialize_saved_bid(saved_bid)}
        )  # 이미 저장한 공고면 중복 생성 없이 기존 저장 결과 반환

    saved_bid = SavedBid.objects.create(
        user=request.user,
        bid_notice=notice,
    )  # 로그인한 회원과 선택한 공고를 SavedBid로 연결
    return Response(
        {"created": True, "item": serialize_saved_bid(saved_bid)},
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def saved_bid_delete(request, bid_ntce_no):
    deleted_count, _ = SavedBid.objects.filter(
        user=request.user,
        bid_notice__bid_ntce_no=bid_ntce_no,
    ).delete()  # 현재 회원이 저장한 해당 공고만 삭제

    if deleted_count == 0:
        return Response(
            {"error": "저장한 입찰공고를 찾을 수 없습니다."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(status=status.HTTP_204_NO_CONTENT)


def build_match_reasons(
    notice,
    keywords,
    preferred_business_type,
    preferred_regions,
    profile,
):
    searchable_text = " ".join(
        [
            notice.title,
            notice.allowed_industry,
            notice.notice_organization,
            notice.demand_organization,
        ]
    ).lower()
    matched_keywords = [
        keyword for keyword in keywords if keyword.lower() in searchable_text
    ]
    reasons = [f"키워드 일치: {', '.join(matched_keywords)}"]

    if preferred_business_type:
        reasons.append(f"업무 구분 일치: {preferred_business_type}")

    if preferred_regions:
        reasons.append("전국 참가 가능" if not notice.region_limit else "희망 지역 일치")

    if profile and (
        profile.min_bid_amount is not None
        or profile.max_bid_amount is not None
    ):
        reasons.append("희망 금액 범위 포함")

    return reasons


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommended_bid_list(request):
    profile = CompanyProfile.objects.filter(user=request.user).first()  # 현재 사용자의 회사 정보

    if "keywords" in request.GET:
        keyword_text = request.GET.get("keywords", "")  # 추천 화면에서 보낸 임시 키워드
    else:
        keyword_text = ",".join(get_profile_keywords(profile)) if profile else ""  # 저장된 회사 키워드

    if "region" in request.GET:
        region_text = request.GET.get("region", "")  # 추천 화면에서 임시로 바꾼 지역
    else:
        region_text = profile.preferred_region if profile else ""  # 저장된 회사 희망 지역

    keywords = [
        keyword.strip()
        for keyword in keyword_text.split(",")
        if keyword.strip()
    ]  # 쉼표로 연결된 문장을 검색 가능한 키워드 목록으로 변환
    preferred_regions = [
        region.strip()
        for region in region_text.split(",")
        if region.strip()
    ]  # 쉼표로 연결된 희망 지역을 목록으로 변환

    if not keywords:
        last_updated_at = get_last_updated_at()
        return Response(
            {
                "keywords": [],
                "region": ", ".join(preferred_regions),
                "count": 0,
                "last_updated_at": last_updated_at,
                "items": [],
            }
        )

    keyword_condition = Q()
    for keyword in keywords:
        keyword_condition |= (
            Q(title__icontains=keyword)
            | Q(allowed_industry__icontains=keyword)
            | Q(notice_organization__icontains=keyword)
            | Q(demand_organization__icontains=keyword)
        )  # 공고명, 업종, 기관 중 한 곳이라도 키워드가 포함되면 추천

    notices = BidNotice.objects.filter(is_active=True).filter(keyword_condition)
    preferred_business_type = (
        PREFERRED_BID_TYPE_MAP.get(profile.preferred_bid_type)
        if profile
        else None
    )

    if preferred_business_type:
        notices = notices.filter(business_type=preferred_business_type)  # 회사의 희망 공고 유형 적용

    if preferred_regions:
        notices = notices.filter(build_region_condition(preferred_regions))

    if profile and (
        profile.min_bid_amount is not None
        or profile.max_bid_amount is not None
    ):
        notices = notices.annotate(
            recommendation_amount=Coalesce("budget_amount", "estimated_price")
        )  # 배정예산이 없으면 추정가격을 추천 금액으로 사용

        if profile.min_bid_amount is not None:
            notices = notices.filter(recommendation_amount__gte=profile.min_bid_amount)

        if profile.max_bid_amount is not None:
            notices = notices.filter(recommendation_amount__lte=profile.max_bid_amount)

    notices = notices.order_by("-notice_date", "-id")
    total_count = notices.count()
    recommended_notices = notices[:RECOMMENDATION_LIMIT]
    last_updated_at = get_last_updated_at()

    return Response(
        {
            "keywords": keywords,
            "region": ", ".join(preferred_regions),
            "count": total_count,
            "last_updated_at": last_updated_at,
            "items": [
                serialize_notice(
                    notice,
                    build_match_reasons(
                        notice,
                        keywords,
                        preferred_business_type,
                        preferred_regions,
                        profile,
                    ),
                )
                for notice in recommended_notices
            ],
        }
    )


def filter_notices(notices, request):
    query = request.GET.get("q", "").strip()
    keyword_text = request.GET.get("keywords", "").strip()
    region_text = request.GET.get("regions", "").strip()
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

    keywords = [keyword.strip() for keyword in keyword_text.split(",") if keyword.strip()]
    if keywords:
        keyword_condition = Q()
        for keyword in keywords:
            keyword_condition |= (
                Q(title__icontains=keyword)
                | Q(notice_organization__icontains=keyword)
                | Q(demand_organization__icontains=keyword)
                | Q(allowed_industry__icontains=keyword)
            )
        notices = notices.filter(keyword_condition)  # 회사 키워드 중 하나라도 맞는 공고 검색

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
        notices = notices.filter(build_region_condition([REGIONS[region]]))

    preferred_regions = [
        selected_region.strip()
        for selected_region in region_text.split(",")
        if selected_region.strip()
    ]
    if preferred_regions:
        notices = notices.filter(build_region_condition(preferred_regions))

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

    deadline_sort = request.GET.get("deadline_sort", "").strip()
    if deadline_sort and deadline_sort not in DEADLINE_SORTS:
        return JsonResponse({"error": "deadline_sort is not valid."}, status=400)

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
    if deadline_sort == "asc":
        notices = notices.order_by(F("close_at").asc(nulls_last=True), "-id")
    elif deadline_sort == "desc":
        notices = notices.order_by(F("close_at").desc(nulls_last=True), "-id")
    else:
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
            "last_updated_at": get_last_updated_at(),
            "summary": summary,
            "items": [serialize_notice(notice) for notice in page.object_list],
        }
    )


def bid_detail(request, bid_ntce_no):  # URL로 받은 공고번호의 상세정보를 조회
    notice = (
        BidNotice.objects.filter(
            bid_ntce_no=bid_ntce_no,
            is_active=True,
        )
        .order_by("-bid_ntce_ord")
        .first()
    )  # 같은 공고번호가 여러 차수면 가장 최신 활성 공고 한 건 선택

    if notice is None:
        return JsonResponse(
            {"error": "입찰공고를 찾을 수 없습니다."},
            status=404,
        )  # 없는 공고번호임을 HTTP 404로 전달

    return JsonResponse(
        {"item": serialize_notice(notice)}
    )  # DB 공고를 브라우저가 사용할 JSON 형태로 전달


def generate_bid_chat_answer(bid_ntce_no, question):
    """필요할 때만 RAG 챗봇 모듈을 불러와 답변을 생성합니다."""
    from .services.rag.chatbot import ask_bid_question

    return ask_bid_question(bid_ntce_no, question)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def bid_chat(request, bid_ntce_no):
    """공고번호와 질문을 받아 AI 답변과 출처를 반환합니다."""
    notice = (
        BidNotice.objects.filter(bid_ntce_no=bid_ntce_no, is_active=True)
        .order_by("-bid_ntce_ord")
        .first()
    )
    if notice is None:
        return Response(
            {"error": "입찰공고를 찾을 수 없습니다."},
            status=status.HTTP_404_NOT_FOUND,
        )

    saved_bid, _ = SavedBid.objects.get_or_create(
        user=request.user,
        bid_notice=notice,
    )  # 채팅 기록을 회원과 공고별로 저장할 기준

    if request.method == "GET":
        return Response(
            {
                "messages": [
                    {
                        "id": message.id,
                        "role": message.role,
                        "text": message.content,
                        "sources": message.sources,
                    }
                    for message in saved_bid.chat_messages.all()
                ]
            }
        )

    question = request.data.get("question")

    if not isinstance(question, str) or not question.strip():
        return Response(
            {"error": "질문을 입력해 주세요."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    question = question.strip()
    if len(question) > MAX_CHAT_QUESTION_LENGTH:
        return Response(
            {"error": f"질문은 {MAX_CHAT_QUESTION_LENGTH}자 이하로 입력해 주세요."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = generate_bid_chat_answer(bid_ntce_no, question)
    except ValueError as error:
        return Response(
            {"error": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception:
        return Response(
            {"error": "AI 답변을 생성하지 못했습니다."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    BidChatMessage.objects.create(
        saved_bid=saved_bid,
        role=BidChatMessage.Role.USER,
        content=question,
    )
    BidChatMessage.objects.create(
        saved_bid=saved_bid,
        role=BidChatMessage.Role.ASSISTANT,
        content=result["answer"],
        sources=result.get("sources", []),
    )  # 답변 생성에 성공한 대화만 DB에 저장

    return Response(result)  # answer와 sources를 Next.js에 JSON으로 전달


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def bid_analysis(request, bid_ntce_no):
    saved_bid = (
        SavedBid.objects.filter(
            user=request.user,
            bid_notice__bid_ntce_no=bid_ntce_no,
        )
        .select_related("bid_notice")
        .first()
    )
    if saved_bid is None:
        return Response(
            {"error": "먼저 공고를 저장해 주세요."},
            status=status.HTTP_404_NOT_FOUND,
        )

    analysis = BidAnalysis.objects.filter(saved_bid=saved_bid).first()
    if request.method == "GET":
        return Response(
            {
                "report": analysis.report if analysis else None,
                "updated_at": analysis.updated_at if analysis else None,
            }
        )

    if analysis is not None:
        return Response(
            {"report": analysis.report, "updated_at": analysis.updated_at}
        )  # 기존 분석은 재사용해 중복 OpenAI 비용 방지

    profile = CompanyProfile.objects.filter(user=request.user).first()
    if profile is None:
        return Response(
            {"error": "AI 분석 전에 회사 정보를 입력해 주세요."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        from .services.rag.analysis import generate_bid_analysis

        report = generate_bid_analysis(bid_ntce_no, profile)
    except ValueError as error:
        return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response(
            {"error": "AI 분석 리포트를 생성하지 못했습니다."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    analysis = BidAnalysis.objects.create(saved_bid=saved_bid, report=report)
    return Response(
        {"report": analysis.report, "updated_at": analysis.updated_at},
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bid_analysis_pdf(request, bid_ntce_no):
    analysis = (
        BidAnalysis.objects.filter(
            saved_bid__user=request.user,
            saved_bid__bid_notice__bid_ntce_no=bid_ntce_no,
        )
        .select_related("saved_bid__bid_notice", "saved_bid__user")
        .first()
    )
    if analysis is None:
        return Response(
            {"error": "저장된 AI 분석 결과가 없습니다."},
            status=status.HTTP_404_NOT_FOUND,
        )

    from .services.analysis_pdf import build_analysis_pdf

    pdf_buffer = build_analysis_pdf(analysis)
    return FileResponse(
        pdf_buffer,
        as_attachment=True,
        filename=f"bid-analysis-{bid_ntce_no}.pdf",
        content_type="application/pdf",
    )
