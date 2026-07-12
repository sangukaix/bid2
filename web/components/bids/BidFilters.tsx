import Link from "next/link";

import type { BidSearchParams } from "@/types/bid";

type BidFiltersProps = {
  filters: BidSearchParams;
};

export default function BidFilters({ filters }: BidFiltersProps) { // 공고명과 조건으로 목록을 검색하는 화면 영역
  return (
    <form action="/dashBoard/bidList" className="rounded-lg border border-slate-200 bg-white p-5" method="get">
      <div> {/* 검색어 입력 영역 */}
        <label className="text-sm font-semibold text-slate-800" htmlFor="bid-search">
          공고 검색
        </label>
        <input
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          id="bid-search"
          name="q"
          defaultValue={filters.q}
          placeholder="공고명 또는 발주기관을 입력해주세요."
          type="search"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"> {/* 화면 크기에 따라 필터 배치를 변경 */}
        <label className="block">
          <span className="text-sm font-medium text-slate-700">업무 구분</span>
          <select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500" defaultValue={filters.business_type} name="business_type">
            <option value="">전체</option>
            <option value="물품">물품</option>
            <option value="용역">용역</option>
            <option value="공사">공사</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">참가 지역</span>
          <select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500" defaultValue={filters.region} name="region">
            <option value="">전체 지역</option>
            <option value="seoul">서울</option>
            <option value="gyeonggi">경기</option>
            <option value="incheon">인천</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">마감 기간</span>
          <select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500" defaultValue={filters.deadline_days} name="deadline_days">
            <option value="">전체 기간</option>
            <option value="0">오늘 마감</option>
            <option value="3">3일 이내</option>
            <option value="7">7일 이내</option>
            <option value="30">30일 이내</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">마감 상태</span>
          <select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500" defaultValue={filters.deadline_status} name="deadline_status">
            <option value="">전체 상태</option>
            <option value="active">유효</option>
            <option value="review">마감일 확인 필요</option>
          </select>
        </label>

        <div className="flex items-end gap-2"> {/* 초기화와 검색 명령 버튼 영역 */}
          <Link
            className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href="/dashBoard/bidList"
          >
            초기화
          </Link>
          <button
            className="flex-1 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            type="submit"
          >
            검색
          </button>
        </div>
      </div>
    </form>
  );
}
