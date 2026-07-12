import type { BidSummaryData } from "@/types/bid";

type BidSummaryProps = {
  summary: BidSummaryData;
};

export default function BidSummary({ summary }: BidSummaryProps) { // 공고 유형별 개수를 카드 형태로 표시
  const summaryItems = [
    { label: "전체 공고", count: summary.total },
    { label: "물품", count: summary.goods },
    { label: "용역", count: summary.services },
    { label: "공사", count: summary.construction },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="입찰공고 요약">
      {summaryItems.map((item) => ( // 배열의 항목 수만큼 같은 모양의 카드를 반복 생성
        <article className="rounded-lg border border-slate-200 bg-white p-5" key={item.label}>
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{item.count.toLocaleString()}</p>
        </article>
      ))}
    </section>
  );
}
