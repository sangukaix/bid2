import BidList from "@/components/bids/BidList"; // 입찰공고 목록 화면 전체를 조립하는 컴포넌트
import type { BidSearchParams } from "@/types/bid";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BidListPage({ searchParams }: PageProps) { // /dashBoard/bidList 주소에서 보이는 페이지
  const values = await searchParams;
  const filters: BidSearchParams = {
    q: firstValue(values.q),
    business_type: firstValue(values.business_type),
    region: firstValue(values.region),
    deadline_days: firstValue(values.deadline_days),
    deadline_status: firstValue(values.deadline_status),
    page: firstValue(values.page),
  };

  return (
    <section className="min-w-0"> {/* 표가 넓어져도 대시보드 영역을 밀어내지 않도록 설정 */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div> {/* 페이지 제목과 설명 영역 */}
          <p className="text-sm font-semibold text-blue-600">공고 검색</p>
          <h1 className="mt-2 text-2xl font-bold">입찰공고 목록</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            나라장터에서 수집한 입찰공고를 조건별로 확인합니다.
          </p>
        </div>

        <button
          className="self-start rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:self-auto"
          type="button"
        >
          공고 새로고침
        </button>
      </div>

      <BidList filters={filters} /> {/* 요약, 검색 필터, 표를 한 번에 표시 */}
    </section>
  );
}
