import BidAnalysisReport from "@/components/analysis/BidAnalysisReport";
import SavedBidBoard from "@/components/savedBids/SavedBidBoard";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProposalAnalysisPage({ searchParams }: PageProps) {
  const values = await searchParams;
  const bidValue = values.bid;
  const bidNtceNo = Array.isArray(bidValue) ? bidValue[0] : bidValue;

  return (
    <section className="min-w-0">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold">제안서 제작</h1>
      </header>
      {bidNtceNo ? (
        <BidAnalysisReport
          backHref="/dashBoard/matchBid/analysis"
          bidNtceNo={bidNtceNo}
        />
      ) : (
        <SavedBidBoard workflow="analysis" />
      )}
    </section>
  );
}
