import SavedBidBoard from "@/components/savedBids/SavedBidBoard";

export default function MatchBidPage() {
  return (
    <section className="min-w-0">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold">제안서 제작</h1>
      </header>
      <SavedBidBoard workflow="proposal" />
    </section>
  );
}
