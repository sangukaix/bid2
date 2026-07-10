const summaryItems = [ // 나중에 API 결과 개수로 교체할 요약 항목
  { label: "전체 공고", count: 0 },
  { label: "물품", count: 0 },
  { label: "용역", count: 0 },
  { label: "공사", count: 0 },
];

export default function BidSummary() { // 공고 유형별 개수를 카드 형태로 표시
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
