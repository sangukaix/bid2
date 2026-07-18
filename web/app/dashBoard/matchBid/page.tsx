import BidAnalysisReport from "@/components/analysis/BidAnalysisReport";
import SavedBidBoard from "@/components/savedBids/SavedBidBoard";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MatchBidPage({ searchParams }: PageProps) {
  const values = await searchParams;
  const bidValue = values.bid;
  const bidNtceNo = Array.isArray(bidValue) ? bidValue[0] : bidValue;

  return (
    <section className="min-w-0">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold">저장 공고 · AI 분석</h1>
      </header>
      {bidNtceNo ? <BidAnalysisReport bidNtceNo={bidNtceNo} /> : <SavedBidBoard />}
    </section>
  );
}
