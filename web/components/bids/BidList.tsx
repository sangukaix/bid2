import BidFilters from "@/components/bids/BidFilters"; // 입찰공고 검색 조건 영역
import BidSummary from "@/components/bids/BidSummary"; // 공고 유형별 개수 요약 영역
import BidTable from "@/components/bids/BidTable"; // 입찰공고 표 영역

export default function BidList() { // 입찰 목록 화면에 필요한 컴포넌트를 순서대로 조립
  return (
    <div className="mt-6 space-y-5">
      <BidSummary />
      <BidFilters />
      <BidTable />
    </div>
  );
}
