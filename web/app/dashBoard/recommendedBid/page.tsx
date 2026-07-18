import RecommendedBidBoard from "@/components/recommendations/RecommendedBidBoard";

export default function RecommendedBidPage() {
  return (
    <section className="min-w-0">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold">추천 공고</h1>
      </header>
      <RecommendedBidBoard />
    </section>
  );
}
