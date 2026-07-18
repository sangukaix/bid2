from datetime import datetime, timedelta
from pathlib import Path
import tempfile
from unittest.mock import patch
import zipfile
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.test import override_settings
from django.utils import timezone
from rest_framework.authtoken.models import Token

from bids.management.commands.sync_bids import (
    determine_deadline_status,
    update_latest_notices,
)
from bids.models import BidAnalysis, BidChatMessage, BidNotice, CompanyProfile, RecommendedBid, SavedBid
from bids.services.g2b_api import fetch_bid_notices
from bids.services.rag.extract_document import extract_document
from bids.services.rag.retriever import search_bid_documents
from bids.services.recommendation import match_user_recommendations


class SignupViewTests(TestCase):
    def setUp(self):
        self.signup_data = {
            "username": "new-user",
            "email": "new@example.com",
            "password": "testpass123",
            "password_confirm": "testpass123",
        }

    def test_회원가입으로_사용자를_생성한다(self):
        response = self.client.post(
            "/api/auth/signup/",
            self.signup_data,
            content_type="application/json",
        )

        user = get_user_model().objects.get(username="new-user")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["user"]["email"], "new@example.com")
        self.assertTrue(user.check_password("testpass123"))

    def test_4자리_숫자_비밀번호로_회원가입할_수_있다(self):
        response = self.client.post(
            "/api/auth/signup/",
            {
                "username": "short-password-user",
                "email": "short@example.com",
                "password": "1234",
                "password_confirm": "1234",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)

    def test_같은_아이디로_다시_가입할_수_없다(self):
        get_user_model().objects.create_user(
            username="new-user",
            email="first@example.com",
            password="testpass123",
        )

        response = self.client.post(
            "/api/auth/signup/",
            self.signup_data,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.json())


class LoginViewTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="login-user",
            email="login@example.com",
            password="testpass123",
        )

    def test_로그인하면_token을_발급한다(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "login-user", "password": "testpass123"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["token"])
        self.assertEqual(response.json()["user"]["username"], "login-user")
        self.assertNotIn("password", response.json())

    def test_비밀번호가_틀리면_로그인할_수_없다(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "login-user", "password": "wrong-password"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("non_field_errors", response.json())

    def test_로그아웃하면_token을_삭제한다(self):
        token = Token.objects.create(user=self.user)

        response = self.client.post(
            "/api/auth/logout/",
            HTTP_AUTHORIZATION=f"Token {token.key}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_로그인하지_않으면_로그아웃할_수_없다(self):
        response = self.client.post("/api/auth/logout/")

        self.assertEqual(response.status_code, 401)


class CompanyProfileViewTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="profile-user",
            password="test-password",
        )
        self.profile_data = {
            "company_name": "테스트회사",
            "business_registration_number": "000-00-00000",
            "representative_name": "김대표",
            "address": "서울특별시",
            "industry": "소프트웨어 개발",
            "main_business": "웹 서비스 개발",
            "preferred_keywords": "홈페이지 구축",
        }

    def test_로그인하지_않으면_회사_프로필에_접근할_수_없다(self):
        response = self.client.get("/api/company-profile/")

        self.assertEqual(response.status_code, 401)

    def test_회사_프로필이_없으면_null을_반환한다(self):
        self.client.force_login(self.user)

        response = self.client.get("/api/company-profile/")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["profile"])

    def test_회사_프로필을_최초_저장한다(self):
        self.client.force_login(self.user)

        response = self.client.post(
            "/api/company-profile/",
            self.profile_data,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(CompanyProfile.objects.get().user, self.user)
        self.assertEqual(response.json()["profile"]["company_name"], "테스트회사")

    def test_기존_회사_프로필의_일부를_수정한다(self):
        self.client.force_login(self.user)
        CompanyProfile.objects.create(user=self.user, **self.profile_data)

        response = self.client.patch(
            "/api/company-profile/",
            {"company_name": "수정된 회사"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profile"]["company_name"], "수정된 회사")
        self.assertEqual(CompanyProfile.objects.get().industry, "소프트웨어 개발")


class RecommendedBidViewTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="recommend-user",
            password="test-password",
        )

    def create_profile(self, keywords):
        return CompanyProfile.objects.create(
            user=self.user,
            company_name="추천테스트회사",
            business_registration_number="111-11-11111",
            representative_name="김대표",
            address="서울특별시",
            industry="소프트웨어 개발",
            main_business="웹 서비스 개발",
            preferred_keywords=keywords,
        )

    @staticmethod
    def create_notice(index, title, **overrides):
        values = {
            "bid_ntce_no": f"REC-{index:03d}",
            "bid_ntce_ord": "000",
            "title": title,
            "is_active": True,
            "raw_data": {
                "bidNtceNo": f"REC-{index:03d}",
                "bidNtceOrd": "000",
                "bidNtceNm": title,
            },
        }
        values.update(overrides)
        return BidNotice.objects.create(**values)

    def test_로그인하지_않으면_추천_공고를_볼_수_없다(self):
        response = self.client.get("/api/recommended-bids/")

        self.assertEqual(response.status_code, 401)

    def test_회사_프로필이_없으면_빈_목록을_반환한다(self):
        self.client.force_login(self.user)

        response = self.client.get("/api/recommended-bids/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["items"], [])

    def test_회사_키워드가_포함된_유효_공고만_추천한다(self):
        self.create_profile("홈페이지, 시스템 유지보수")
        self.create_notice(1, "공공기관 홈페이지 구축 용역")
        self.create_notice(2, "업무 시스템 유지보수 사업")
        self.create_notice(3, "사무실 청소 용역")
        self.create_notice(4, "마감된 홈페이지 구축", is_active=False)
        self.client.force_login(self.user)

        response = self.client.get("/api/recommended-bids/")
        data = response.json()
        notice_numbers = {item["bidNtceNo"] for item in data["items"]}

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["keywords"], ["홈페이지", "시스템 유지보수"])
        self.assertEqual(data["count"], 2)
        self.assertEqual(notice_numbers, {"REC-001", "REC-002"})

    def test_기관명이나_허용업종에_키워드가_있어도_추천한다(self):
        self.create_profile("소프트웨어")
        self.create_notice(
            1,
            "정보시스템 사업",
            allowed_industry="소프트웨어사업자",
        )
        self.create_notice(
            2,
            "장비 구매",
            notice_organization="소프트웨어진흥원",
        )
        self.client.force_login(self.user)

        response = self.client.get("/api/recommended-bids/")

        self.assertEqual(response.json()["count"], 2)
        self.assertTrue(response.json()["items"][0]["matchReasons"])

    def test_임시_키워드로_검색해도_회사_키워드는_변경하지_않는다(self):
        profile = self.create_profile("홈페이지")
        self.create_notice(1, "공공기관 홈페이지 구축")
        self.create_notice(2, "방탄 장비 구매")
        self.create_notice(3, "교육용 장비 구매")
        self.client.force_login(self.user)

        response = self.client.get(
            "/api/recommended-bids/",
            {"keywords": "방탄, 구매"},
        )
        data = response.json()

        profile.refresh_from_db()  # DB에 저장된 회사 키워드를 다시 확인
        self.assertEqual(data["keywords"], ["방탄", "구매"])
        self.assertEqual(data["count"], 2)
        self.assertEqual(profile.preferred_keywords, "홈페이지")

    def test_회사가_선택한_공고_유형만_추천한다(self):
        profile = self.create_profile("홈페이지")
        profile.preferred_bid_type = "service"
        profile.save(update_fields=["preferred_bid_type"])
        self.create_notice(1, "홈페이지 구축 용역", business_type="용역")
        self.create_notice(2, "홈페이지 장비 구매", business_type="물품")
        self.client.force_login(self.user)

        response = self.client.get("/api/recommended-bids/")
        data = response.json()

        self.assertEqual(data["count"], 1)
        self.assertEqual(data["items"][0]["bidNtceNo"], "REC-001")

    def test_회사_희망지역과_참가_가능지역이_맞는_공고를_추천한다(self):
        profile = self.create_profile("홈페이지")
        profile.preferred_region = "서울"
        profile.save(update_fields=["preferred_region"])
        self.create_notice(1, "홈페이지 구축", region_limit=False)
        self.create_notice(2, "서울 홈페이지 구축", region_limit=True, allowed_region="서울특별시")
        self.create_notice(3, "부산 홈페이지 구축", region_limit=True, allowed_region="부산광역시")
        self.client.force_login(self.user)

        response = self.client.get("/api/recommended-bids/")
        data = response.json()

        self.assertEqual(data["region"], "서울")
        self.assertEqual(data["count"], 2)

    def test_임시_희망지역으로_검색해도_회사_지역은_변경하지_않는다(self):
        profile = self.create_profile("홈페이지")
        profile.preferred_region = "서울"
        profile.save(update_fields=["preferred_region"])
        self.create_notice(1, "부산 홈페이지 구축", region_limit=True, allowed_region="부산광역시")
        self.create_notice(2, "서울 홈페이지 구축", region_limit=True, allowed_region="서울특별시")
        self.client.force_login(self.user)

        response = self.client.get(
            "/api/recommended-bids/",
            {"region": "부산"},
        )

        profile.refresh_from_db()
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["items"][0]["bidNtceNo"], "REC-001")
        self.assertEqual(profile.preferred_region, "서울")

    def test_회사_희망금액_범위에_맞는_공고만_추천한다(self):
        profile = self.create_profile("홈페이지")
        profile.min_bid_amount = 10_000_000
        profile.max_bid_amount = 100_000_000
        profile.save(update_fields=["min_bid_amount", "max_bid_amount"])
        self.create_notice(1, "홈페이지 구축", budget_amount=9_000_000)
        self.create_notice(2, "홈페이지 구축", budget_amount=10_000_000)
        self.create_notice(3, "홈페이지 구축", estimated_price=100_000_000)
        self.create_notice(4, "홈페이지 구축", budget_amount=100_000_001)
        self.create_notice(5, "홈페이지 구축")
        self.client.force_login(self.user)

        response = self.client.get("/api/recommended-bids/")
        data = response.json()
        notice_numbers = {item["bidNtceNo"] for item in data["items"]}

        self.assertEqual(data["count"], 2)
        self.assertEqual(notice_numbers, {"REC-002", "REC-003"})

    def test_추천_공고는_최대_20건만_반환한다(self):
        self.create_profile("홈페이지")
        for index in range(25):
            self.create_notice(index, f"홈페이지 구축 사업 {index}")
        self.client.force_login(self.user)

        response = self.client.get("/api/recommended-bids/")
        data = response.json()

        self.assertEqual(data["count"], 25)
        self.assertEqual(len(data["items"]), 20)


class DocumentExtractionTests(TestCase):
    def test_HWPX_텍스트와_문서위치를_추출한다(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            file_path = Path(temp_dir) / "request.hwpx"
            with zipfile.ZipFile(file_path, "w") as archive:
                archive.writestr(
                    "Contents/section0.xml",
                    "<root xmlns:hp='urn:test'><hp:t>참가 자격</hp:t></root>",
                )

            result = extract_document(file_path)

        self.assertEqual(result.failed_files, [])
        self.assertIn("참가 자격", result.documents[0].page_content)
        self.assertEqual(result.documents[0].metadata["location"], "문서 구역 1")

    def test_ZIP의_문서는_처리하고_실행파일은_실패로_기록한다(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            file_path = Path(temp_dir) / "attachments.zip"
            with zipfile.ZipFile(file_path, "w") as archive:
                archive.writestr("notice.txt", "입찰 공고 내용")
                archive.writestr("danger.exe", b"MZ")

            result = extract_document(file_path)

        self.assertEqual(result.processed_files, ["notice.txt"])
        self.assertEqual(result.failed_files[0]["file_name"], "danger.exe")
        self.assertIn("실행 가능한 파일", result.failed_files[0]["reason"])


class BidDocumentSearchTests(TestCase):
    @patch("bids.services.rag.retriever.get_bid_vector_store")
    def test_관련도_기준을_통과한_chunk를_모두_선택한다(self, mock_get_store):
        documents = [object() for _ in range(10)]
        vector_store = mock_get_store.return_value
        vector_store._collection.count.return_value = 10
        vector_store.similarity_search_with_relevance_scores.return_value = [
            (document, 0.9) for document in documents
        ]

        result = search_bid_documents("BID-001", "사업비가 얼마야?")

        self.assertEqual(result, documents)
        vector_store.similarity_search_with_relevance_scores.assert_called_once_with(
            "사업비가 얼마야?",
            k=10,
        )

    @patch("bids.services.rag.retriever.get_bid_vector_store")
    def test_관련_chunk가_너무_적으면_상위_5개를_선택한다(self, mock_get_store):
        documents = [object() for _ in range(8)]
        vector_store = mock_get_store.return_value
        vector_store._collection.count.return_value = 8
        vector_store.similarity_search_with_relevance_scores.return_value = [
            (document, 0.1) for document in documents
        ]

        result = search_bid_documents("BID-001", "참가 자격은?")

        self.assertEqual(result, documents[:5])


class BidChatViewTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="chat-user",
            password="test-password",
        )
        self.notice = BidNotice.objects.create(
            bid_ntce_no="CHAT-001",
            bid_ntce_ord="000",
            title="AI 챗봇 테스트 공고",
            is_active=True,
        )

    def test_로그인하지_않으면_챗봇을_사용할_수_없다(self):
        response = self.client.post(
            "/api/bids/CHAT-001/chat/",
            {"question": "참가 자격은?"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)

    def test_빈_질문은_거부한다(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/bids/CHAT-001/chat/",
            {"question": ""},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_없는_공고번호는_404를_반환한다(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/bids/NOT-FOUND/chat/",
            {"question": "참가 자격은?"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)

    @patch("bids.views.generate_bid_chat_answer")
    def test_AI_답변과_출처를_JSON으로_반환한다(self, mock_generate_answer):
        mock_generate_answer.return_value = {
            "answer": "테스트 AI 답변",
            "sources": [{"file_name": "공고문.pdf", "page": "2"}],
        }
        self.client.force_login(self.user)

        response = self.client.post(
            "/api/bids/CHAT-001/chat/",
            {"question": " 참가 자격은? "},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["answer"], "테스트 AI 답변")
        self.assertEqual(response.json()["sources"][0]["page"], "2")
        self.assertEqual(BidChatMessage.objects.count(), 2)
        mock_generate_answer.assert_called_once_with("CHAT-001", "참가 자격은?")

    @patch("bids.views.generate_bid_chat_answer")
    def test_저장된_채팅을_다시_불러온다(self, mock_generate_answer):
        mock_generate_answer.return_value = {
            "answer": "저장된 답변",
            "sources": [],
        }
        self.client.force_login(self.user)
        self.client.post(
            "/api/bids/CHAT-001/chat/",
            {"question": "사업비는?"},
            content_type="application/json",
        )

        response = self.client.get("/api/bids/CHAT-001/chat/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["messages"]), 2)
        self.assertEqual(response.json()["messages"][1]["text"], "저장된 답변")


class BidListViewTests(TestCase):
    @staticmethod
    def create_notice(index, **overrides):
        values = {
            "bid_ntce_no": f"BID-{index:03d}",
            "bid_ntce_ord": "000",
            "title": f"Test notice {index}",
            "deadline_status": BidNotice.DeadlineStatus.ACTIVE,
            "is_active": True,
            "raw_data": {
                "bidNtceNo": f"BID-{index:03d}",
                "bidNtceOrd": "000",
                "bidNtceNm": f"Test notice {index}",
            },
        }
        values.update(overrides)
        return BidNotice.objects.create(**values)

    def test_returns_twenty_active_notices_per_page(self):
        for index in range(25):
            self.create_notice(index)

        self.create_notice(
            25,
            deadline_status=BidNotice.DeadlineStatus.REVIEW,
        )
        self.create_notice(
            26,
            deadline_status=BidNotice.DeadlineStatus.EXPIRED,
            is_active=False,
        )

        response = self.client.get("/api/bids/")
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["count"], 26)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["page_size"], 20)
        self.assertEqual(data["total_pages"], 2)
        self.assertEqual(len(data["items"]), 20)

    def test_공고번호로_상세공고_한건을_조회한다(self):
        self.create_notice(
            1,
            title="제주 정보시스템 구축 용역",
            region_limit=True,
            allowed_region="제주특별자치도",
        )

        response = self.client.get("/api/bids/BID-001/")  # 상세 API 주소 요청
        item = response.json()["item"]

        self.assertEqual(response.status_code, 200)
        self.assertEqual(item["bidNtceNo"], "BID-001")
        self.assertEqual(item["allowedRegion"], "제주특별자치도")

    def test_없는_공고번호는_404를_반환한다(self):
        response = self.client.get("/api/bids/NOT-FOUND/")

        self.assertEqual(response.status_code, 404)
        self.assertIn("error", response.json())

    def test_returns_second_page_and_deadline_status(self):
        for index in range(21):
            self.create_notice(index)

        response = self.client.get("/api/bids/?page=2&page_size=20")
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["deadlineStatus"], "active")
        self.assertTrue(data["items"][0]["isActive"])

    def test_참가가능지역과_마지막업데이트시간을_반환한다(self):
        self.create_notice(
            1,
            region_limit=True,
            allowed_region="제주특별자치도",
        )

        response = self.client.get("/api/bids/")
        item = response.json()["items"][0]

        self.assertTrue(item["regionLimit"])
        self.assertEqual(item["allowedRegion"], "제주특별자치도")
        self.assertIsNotNone(response.json()["last_updated_at"])

    def test_rejects_invalid_page_parameters(self):
        response = self.client.get("/api/bids/?page=wrong&page_size=20")

        self.assertEqual(response.status_code, 400)
        self.assertIn("page", response.json()["error"])

    def test_searches_notice_title_and_organization(self):
        self.create_notice(
            1,
            title="School repair project",
            notice_organization="Seoul Office of Education",
        )
        self.create_notice(2, title="Hospital supplies")

        response = self.client.get("/api/bids/?q=School")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["items"][0]["bidNtceNo"], "BID-001")

    def test_회사_키워드와_여러_희망지역으로_공고를_필터한다(self):
        self.create_notice(
            1,
            title="공공기관 홈페이지 구축",
            region_limit=True,
            allowed_region="충청북도",
        )
        self.create_notice(
            2,
            title="정보시스템 유지보수",
            region_limit=True,
            allowed_region="제주특별자치도",
        )
        self.create_notice(3, title="사무용품 구매", region_limit=False)

        response = self.client.get(
            "/api/bids/",
            {"keywords": "홈페이지,시스템", "regions": "충북,제주"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)

    def test_filters_business_type_deadline_status_and_region(self):
        self.create_notice(
            1,
            business_type="공사",
            deadline_status=BidNotice.DeadlineStatus.REVIEW,
            region_limit=True,
            allowed_region="서울특별시",
        )
        self.create_notice(
            2,
            business_type="용역",
            deadline_status=BidNotice.DeadlineStatus.REVIEW,
            region_limit=True,
            allowed_region="서울특별시",
        )
        self.create_notice(3, business_type="공사")

        response = self.client.get(
            "/api/bids/?business_type=공사&deadline_status=review&region=seoul"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["summary"]["construction"], 1)

    def test_참가_지역은_지역제한이_없거나_선택지역인_공고를_반환한다(self):
        self.create_notice(1, region_limit=False)
        self.create_notice(2, region_limit=True, allowed_region="서울특별시")
        self.create_notice(3, region_limit=True, allowed_region="부산광역시")

        response = self.client.get("/api/bids/?region=seoul")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)

    def test_마감_상태로_공고를_필터한다(self):
        self.create_notice(1, deadline_status=BidNotice.DeadlineStatus.ACTIVE)
        self.create_notice(2, deadline_status=BidNotice.DeadlineStatus.REVIEW)

        response = self.client.get("/api/bids/?deadline_status=review")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["items"][0]["bidNtceNo"], "BID-002")

    def test_filters_notices_by_deadline_days(self):
        self.create_notice(1, close_at=timezone.now() + timedelta(days=2))
        self.create_notice(2, close_at=timezone.now() + timedelta(days=10))

        response = self.client.get("/api/bids/?deadline_days=3")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)

    def test_마감일을_빠른순과_느린순으로_정렬한다(self):
        self.create_notice(1, close_at=timezone.now() + timedelta(days=2))
        self.create_notice(2, close_at=timezone.now() + timedelta(days=10))

        early_response = self.client.get("/api/bids/?deadline_sort=asc")
        late_response = self.client.get("/api/bids/?deadline_sort=desc")

        self.assertEqual(early_response.json()["items"][0]["bidNtceNo"], "BID-001")
        self.assertEqual(late_response.json()["items"][0]["bidNtceNo"], "BID-002")


class BidSyncViewTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="sync-user",
            password="test-password",
        )

    def test_로그인하지_않으면_공고를_업데이트할_수_없다(self):
        response = self.client.post("/api/bids/sync/")

        self.assertEqual(response.status_code, 401)

    @patch("bids.views.call_command")
    def test_공고_수집명령을_실행한다(self, mock_call_command):
        self.client.force_login(self.user)

        response = self.client.post("/api/bids/sync/")

        self.assertEqual(response.status_code, 200)
        mock_call_command.assert_called_once()


class SavedBidModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="saved-bid-user",
            password="test-password",
        )
        self.notice = BidNotice.objects.create(
            bid_ntce_no="SAVE-001",
            bid_ntce_ord="000",
            title="저장 테스트 공고",
        )

    def test_회원과_공고를_연결해서_저장한다(self):
        saved_bid = SavedBid.objects.create(
            user=self.user,
            bid_notice=self.notice,
        )

        self.assertEqual(saved_bid.user, self.user)
        self.assertEqual(saved_bid.bid_notice, self.notice)

    def test_같은_회원은_같은_공고를_중복저장할_수_없다(self):
        SavedBid.objects.create(user=self.user, bid_notice=self.notice)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                SavedBid.objects.create(user=self.user, bid_notice=self.notice)


class SavedBidViewTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="saved-api-user",
            password="test-password",
        )
        self.other_user = get_user_model().objects.create_user(
            username="other-saved-api-user",
            password="test-password",
        )
        self.notice = BidNotice.objects.create(
            bid_ntce_no="SAVE-API-001",
            bid_ntce_ord="000",
            title="저장 API 테스트 공고",
            is_active=True,
            raw_data={
                "bidNtceNo": "SAVE-API-001",
                "bidNtceOrd": "000",
                "bidNtceNm": "저장 API 테스트 공고",
            },
        )

    def test_로그인하지_않으면_저장공고_API를_사용할_수_없다(self):
        response = self.client.get("/api/saved-bids/")

        self.assertEqual(response.status_code, 401)

    def test_공고번호로_공고를_저장한다(self):
        self.client.force_login(self.user)

        response = self.client.post(
            "/api/saved-bids/",
            {"bid_ntce_no": "SAVE-API-001"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()["created"])
        self.assertTrue(SavedBid.objects.filter(user=self.user).exists())

    def test_같은_공고를_다시_저장해도_중복되지_않는다(self):
        self.client.force_login(self.user)

        for _ in range(2):
            response = self.client.post(
                "/api/saved-bids/",
                {"bid_ntce_no": "SAVE-API-001"},
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["created"])
        self.assertEqual(SavedBid.objects.filter(user=self.user).count(), 1)

    def test_로그인한_회원의_저장공고만_조회한다(self):
        SavedBid.objects.create(user=self.user, bid_notice=self.notice)
        SavedBid.objects.create(user=self.other_user, bid_notice=self.notice)
        self.client.force_login(self.user)

        response = self.client.get("/api/saved-bids/")

        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["items"][0]["bidNtceNo"], "SAVE-API-001")
        self.assertFalse(response.json()["items"][0]["hasChat"])
        self.assertFalse(response.json()["items"][0]["hasAnalysis"])

    def test_내가_저장한_공고만_저장취소한다(self):
        SavedBid.objects.create(user=self.user, bid_notice=self.notice)
        SavedBid.objects.create(user=self.other_user, bid_notice=self.notice)
        self.client.force_login(self.user)

        response = self.client.delete("/api/saved-bids/SAVE-API-001/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SavedBid.objects.filter(user=self.user).exists())
        self.assertTrue(SavedBid.objects.filter(user=self.other_user).exists())


class BidSyncHelperTests(TestCase):
    def test_마감일이_미래면_유효_상태다(self):
        result = determine_deadline_status(
            "일반공고",
            timezone.now() + timedelta(days=1),
        )

        self.assertEqual(result, BidNotice.DeadlineStatus.ACTIVE)

    def test_마감일이_없으면_확인_필요_상태다(self):
        result = determine_deadline_status("일반공고", None)

        self.assertEqual(result, BidNotice.DeadlineStatus.REVIEW)

    def test_취소공고는_마감_상태다(self):
        result = determine_deadline_status("취소공고", None)

        self.assertEqual(result, BidNotice.DeadlineStatus.EXPIRED)

    def test_같은_공고번호에서는_높은_차수를_선택한다(self):
        latest_notices = {}
        update_latest_notices(
            latest_notices,
            [
                {"bidNtceNo": "R001", "bidNtceOrd": "000"},
                {"bidNtceNo": "R001", "bidNtceOrd": "002"},
                {"bidNtceNo": "R001", "bidNtceOrd": "001"},
            ],
        )

        self.assertEqual(latest_notices["R001"]["bidNtceOrd"], "002")

    @override_settings(G2B_API_KEY="test-key")
    @patch("bids.services.g2b_api.requests.get")
    def test_API에_페이지_조건을_전달한다(self, mock_get):
        mock_get.return_value.json.return_value = {"response": {"body": {}}}
        start_at = datetime(2026, 7, 1, tzinfo=ZoneInfo("Asia/Seoul"))
        end_at = datetime(2026, 7, 12, tzinfo=ZoneInfo("Asia/Seoul"))

        fetch_bid_notices(
            page_no=2,
            num_of_rows=999,
            start_at=start_at,
            end_at=end_at,
        )

        params = mock_get.call_args.kwargs["params"]
        self.assertEqual(params["pageNo"], 2)
        self.assertEqual(params["numOfRows"], 999)
        self.assertEqual(params["bidNtceBgnDt"], "202607010000")
        self.assertEqual(params["bidNtceEndDt"], "202607120000")


class RecommendationTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="recommend-user",
            password="1234",
        )
        CompanyProfile.objects.create(
            user=self.user,
            company_name="추천 테스트 회사",
            business_registration_number="111-22-33333",
            representative_name="김대표",
            address="서울특별시",
            industry="외국어 교육",
            main_business="외국어 교육 서비스",
            preferred_keywords="외국어, 교육",
            preferred_bid_type="service",
            preferred_region="서울",
        )
        self.notice = BidNotice.objects.create(
            bid_ntce_no="REC-001",
            title="서울 외국어 교육 운영 용역",
            business_type="용역",
            region_limit=True,
            allowed_region="서울특별시",
            is_active=True,
            raw_data={
                "bidNtceNo": "REC-001",
                "bidNtceOrd": "000",
                "bidNtceNm": "서울 외국어 교육 운영 용역",
                "bsnsDivNm": "용역",
            },
        )

    def test_회사조건과_일치한_공고를_한번만_추천한다(self):
        first = match_user_recommendations(self.user)
        second = match_user_recommendations(self.user)

        self.assertEqual(first["created"], 1)
        self.assertEqual(second["created"], 0)
        self.assertEqual(RecommendedBid.objects.count(), 1)

    def test_저장된_추천공고_API는_현재_회원의_공고를_보여준다(self):
        match_user_recommendations(self.user)
        self.client.force_login(self.user)

        response = self.client.get("/api/recommendations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["items"][0]["bidNtceNo"], "REC-001")

    def test_회사조건이_바뀌면_예전_추천을_목록에서_숨긴다(self):
        match_user_recommendations(self.user)
        profile = self.user.company_profile
        profile.preferred_keywords = "건축"
        profile.save(update_fields=["preferred_keywords"])

        match_user_recommendations(self.user)
        self.client.force_login(self.user)
        response = self.client.get("/api/recommendations/")

        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(RecommendedBid.objects.count(), 1)

    def test_제외_키워드가_포함된_공고는_추천하지_않는다(self):
        profile = self.user.company_profile
        profile.excluded_keywords = "운영"
        profile.save(update_fields=["excluded_keywords"])

        result = match_user_recommendations(self.user)

        self.assertEqual(result["created"], 0)
        self.assertFalse(RecommendedBid.objects.filter(is_match=True).exists())

    def test_조건에_맞는_공고가_많아도_상위_10건만_활성화한다(self):
        for number in range(2, 13):
            BidNotice.objects.create(
                bid_ntce_no=f"REC-{number:03d}",
                title=f"서울 외국어 교육 운영 용역 {number}",
                business_type="용역",
                region_limit=True,
                allowed_region="서울특별시",
                is_active=True,
            )

        match_user_recommendations(self.user)

        self.assertEqual(
            RecommendedBid.objects.filter(user=self.user, is_match=True).count(),
            10,
        )


class BidAnalysisTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="analysis-user",
            password="1234",
        )
        self.other_user = get_user_model().objects.create_user(
            username="other-analysis-user",
            password="1234",
        )
        CompanyProfile.objects.create(
            user=self.user,
            company_name="분석 테스트 회사",
            business_registration_number="222-33-44444",
            representative_name="이대표",
            address="서울특별시",
            industry="소프트웨어",
            main_business="시스템 개발",
            preferred_keywords="시스템",
        )
        self.notice = BidNotice.objects.create(
            bid_ntce_no="ANALYSIS-001",
            title="정보시스템 구축 용역",
            notice_organization="테스트 기관",
            business_type="용역",
            is_active=True,
            raw_data={
                "bidNtceNo": "ANALYSIS-001",
                "bidNtceOrd": "000",
                "bidNtceNm": "정보시스템 구축 용역",
                "bsnsDivNm": "용역",
            },
        )
        self.saved_bid = SavedBid.objects.create(
            user=self.user,
            bid_notice=self.notice,
        )
        self.report = {
            "summary": "회사 역량과 공고 분야가 대체로 일치합니다.",
            "fit_score": 72,
            "recommendation": "조건부 검토",
            "overview": {
                "ordering_organization": "테스트 기관",
                "budget": "1억원",
                "bid_deadline": "2026-07-31",
                "contract_period": "3개월",
                "project_summary": "정보시스템 구축",
            },
            "evaluation_items": [
                {
                    "name": "업종/분야 적합성",
                    "score": 15,
                    "max_score": 20,
                    "status": "충족",
                    "explanation": "주요 사업과 일치",
                    "source_numbers": [1],
                }
            ],
            "eligibility": ["소프트웨어사업자"],
            "required_documents": ["사업자등록증"],
            "technical_evaluation": ["기술 제안 평가"],
            "price_evaluation": ["가격 점수 평가"],
            "main_tasks": ["시스템 구축"],
            "required_staff": ["PM 1명"],
            "certifications_and_experience": ["유사 실적"],
            "contract_cautions": ["납기 확인"],
            "strengths": ["개발 역량"],
            "risks": ["실적 확인 필요"],
            "company_checks": ["실적증명서 확인"],
            "action_strategy": ["담당자 배정"],
            "sources": [
                {"number": 1, "file_name": "공고문.pdf", "location": "3페이지"}
            ],
        }

    @patch("bids.services.rag.analysis.generate_bid_analysis")
    def test_AI분석은_한번_생성한_결과를_재사용한다(self, mock_generate):
        mock_generate.return_value = self.report
        self.client.force_login(self.user)

        first = self.client.post("/api/bids/ANALYSIS-001/analysis/")
        second = self.client.post("/api/bids/ANALYSIS-001/analysis/")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(mock_generate.call_count, 1)
        self.assertEqual(BidAnalysis.objects.count(), 1)

    def test_다른_회원은_내_공고_분석에_접근할_수_없다(self):
        self.client.force_login(self.other_user)

        response = self.client.get("/api/bids/ANALYSIS-001/analysis/")

        self.assertEqual(response.status_code, 404)

    def test_저장된_분석을_PDF로_받는다(self):
        BidAnalysis.objects.create(saved_bid=self.saved_bid, report=self.report)
        self.client.force_login(self.user)

        response = self.client.get("/api/bids/ANALYSIS-001/analysis/pdf/")
        content = b"".join(response.streaming_content)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(content.startswith(b"%PDF"))
