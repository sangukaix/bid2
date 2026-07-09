import Link from "next/link";
import type { Bid } from "@/types/bid";

export default function BidCard({ bid }: { bid: Bid }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{bid.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{bid.agency} · {bid.region}</p>
          <p className="mt-2 text-sm text-slate-600">예산 {bid.budget} · 마감 {bid.deadline}</p>
        </div>
        <Link className="rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white" href={`/bids/${bid.id}`}>
          상세 보기
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {bid.keywords.map((keyword) => (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700" key={keyword}>
            {keyword}
          </span>
        ))}
      </div>
    </article>
  );
}
