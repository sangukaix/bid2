import Sidebar from "@/components/layout/Sidebar";
import BidList from "@/components/bids/BidList";
import { mockBids } from "@/data/mockBids";

export default function BidsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-[220px_1fr]">
        <Sidebar />
        <section>
          <h1 className="text-2xl font-bold">추천 입찰 목록</h1>
          <p className="mt-2 text-sm text-slate-600">백엔드 연결 전까지는 더미 데이터로 화면을 확인합니다.</p>
          <BidList bids={mockBids} />
        </section>
      </div>
    </main>
  );
}
