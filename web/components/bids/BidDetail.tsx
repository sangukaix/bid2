import type { Bid } from "@/types/bid";

export default function BidDetail({ bid }: { bid: Bid }) {
  return (
    <article className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
      <p className="text-sm font-semibold text-blue-600">입찰 상세</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-950">{bid.title}</h1>
      <div className="mt-5 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
        <p>기관: {bid.agency}</p>
        <p>지역: {bid.region}</p>
        <p>예산: {bid.budget}</p>
        <p>마감일: {bid.deadline}</p>
      </div>

      <section className="mt-8 rounded-lg bg-slate-50 p-5">
        <h2 className="text-lg font-bold">AI 분석 결과</h2>
        <p className="mt-4 text-sm leading-6 text-slate-700">추천 이유: {bid.matchReason}</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">주의 조건: {bid.caution}</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">간단 의견: 현재 회사 조건과 일부 맞아 보이지만, 실제 참여 전 참가 자격과 실적 조건을 확인해야 합니다.</p>
      </section>
    </article>
  );
}
