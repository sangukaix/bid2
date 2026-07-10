export default function BidFilters() { // 공고명과 조건으로 목록을 검색하는 화면 영역
  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5">
      <div> {/* 검색어 입력 영역 */}
        <label className="text-sm font-semibold text-slate-800" htmlFor="bid-search">
          공고 검색
        </label>
        <input
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          id="bid-search"
          placeholder="공고명 또는 발주기관을 입력해주세요."
          type="search"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"> {/* 화면 크기에 따라 필터 배치를 변경 */}
        <label className="block">
          <span className="text-sm font-medium text-slate-700">업무 구분</span>
          <select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
            <option value="">전체</option>
            <option value="goods">물품</option>
            <option value="service">용역</option>
            <option value="construction">공사</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">참가 지역</span>
          <select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
            <option value="">전체 지역</option>
            <option value="seoul">서울</option>
            <option value="gyeonggi">경기</option>
            <option value="incheon">인천</option>
            <option value="other">그 외 지역</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">마감 기간</span>
          <select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
            <option value="">전체 기간</option>
            <option value="today">오늘 마감</option>
            <option value="3days">3일 이내</option>
            <option value="7days">7일 이내</option>
            <option value="30days">30일 이내</option>
          </select>
        </label>

        <div className="flex items-end gap-2"> {/* 초기화와 검색 명령 버튼 영역 */}
          <button
            className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            type="reset"
          >
            초기화
          </button>
          <button
            className="flex-1 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            type="button"
          >
            검색
          </button>
        </div>
      </div>
    </form>
  );
}
