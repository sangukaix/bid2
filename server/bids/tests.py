from datetime import datetime, timedelta
from unittest.mock import patch
from zoneinfo import ZoneInfo

from django.test import TestCase
from django.test import override_settings
from django.utils import timezone

from bids.management.commands.sync_bids import (
    determine_deadline_status,
    update_latest_notices,
)
from bids.models import BidNotice
from bids.services.g2b_api import fetch_bid_notices


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

    def test_returns_second_page_and_deadline_status(self):
        for index in range(21):
            self.create_notice(index)

        response = self.client.get("/api/bids/?page=2&page_size=20")
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["deadlineStatus"], "active")
        self.assertTrue(data["items"][0]["isActive"])

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

    def test_filters_notices_by_deadline_days(self):
        self.create_notice(1, close_at=timezone.now() + timedelta(days=2))
        self.create_notice(2, close_at=timezone.now() + timedelta(days=10))

        response = self.client.get("/api/bids/?deadline_days=3")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)


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
