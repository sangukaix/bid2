import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import BidDetail from "@/components/bids/BidDetail";
import { mockBids } from "@/data/mockBids";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BidDetailPage({ params }: PageProps) {
  const { id } = await params;
  const bid = mockBids.find((item) => item.id === id);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-[220px_1fr]">
        <Sidebar />
        <section>
          <Link className="text-sm font-semibold text-blue-600" href="/bids">← 목록으로</Link>
          {bid ? <BidDetail bid={bid} /> : <p className="mt-8 text-slate-600">입찰공고를 찾을 수 없습니다.</p>}
        </section>
      </div>
    </main>
  );
}
