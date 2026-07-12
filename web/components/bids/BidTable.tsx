import Link from "next/link";

import type { BidApiResponse, BidNotice, BidSearchParams } from "@/types/bid"; // 입찰공고 한 건의 TypeScript 자료형 가져오기
import BidDetailModal from "@/components/bids/BidDetailModal";

type BidTableProps = {
  data: BidApiResponse | null;
  error: string | null;
  filters: BidSearchParams;
};


function formatAmount(bid: BidNotice) {
  const amountText = bid.asignBdgtAmt || bid.presmptPrce;
  const amount = Number(amountText);

  if (!amountText || !Number.isFinite(amount)) {
    return "-";
  }

  return `${amount.toLocaleString("ko-KR")}원`;
}


function formatDeadline(bid: BidNotice) {
  if (!bid.bidClseDate) {
    return "-";
  }

  const date = bid.bidClseDate.replaceAll("-", ".");

  return bid.bidClseTm ? `${date} ${bid.bidClseTm}` : date;
}


function pageHref(filters: BidSearchParams, page: number) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "page") {
      params.set(key, value);
    }
  }

  params.set("page", String(page));
  return `/dashBoard/bidList?${params.toString()}`;
}

export default function BidTable({ data, error, filters }: BidTableProps) { // 입찰 데이터를 서버에서 가져오는 서버 컴포넌트
  const bids = data?.items ?? [];

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* 검색 결과 제목과 공고 개수를 보여주는 영역 */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-bold text-slate-950">
          검색 결과
        </h2>

        <p className="text-sm text-slate-500">
          총 {(data?.count ?? 0).toLocaleString("ko-KR")}건
        </p>
      </div>

      {/* 화면이 좁을 때 표를 가로로 스크롤할 수 있게 하는 영역 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3 font-semibold" scope="col">
                업무
              </th>

              <th className="px-5 py-3 font-semibold" scope="col">
                공고명
              </th>

              <th className="px-5 py-3 font-semibold" scope="col">
                계약 방법
              </th>

              <th className="px-5 py-3 font-semibold" scope="col">
                기초 금액
              </th>

              <th className="px-5 py-3 font-semibold" scope="col">
                공고일
              </th>

              <th className="px-5 py-3 font-semibold" scope="col">
                마감일
              </th>

              <th className="px-5 py-3 text-center font-semibold" scope="col">
                상세
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {error && (
              <tr>
                <td className="px-5 py-12 text-center text-slate-500" colSpan={7}>
                  {error}
                </td>
              </tr>
            )}

            {!error && bids.length === 0 && (
              <tr>
                <td className="px-5 py-12 text-center text-slate-500" colSpan={7}>
                  표시할 입찰공고가 없습니다.
                </td>
              </tr>
            )}

            {bids.map((bid) => ( // 입찰공고를 한 건씩 꺼내서 표의 행으로 반복 출력
              <tr
                key={`${bid.bidNtceNo}-${bid.bidNtceOrd}`} // 공고번호와 차수로 각 행을 구분
                className="hover:bg-slate-50"
              >
                <td className="px-5 py-4 text-slate-600">
                  {bid.bsnsDivNm} {/* 업무 구분 */}
                </td>

                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-950">
                    {bid.bidNtceNm} {/* 입찰공고 이름 */}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {bid.bidNtceNo} {/* 입찰공고 번호 */}
                  </p>
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {bid.cntrctCnclsMthdNm} {/* 계약 방법 */}
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {formatAmount(bid)} {/* 배정 예산이 없으면 추정 가격 표시 */}
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {bid.bidNtceDate} {/* 공고 날짜 */}
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {bid.deadlineStatus === "review" ? (
                    <span className="inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                      마감일 확인 필요
                    </span>
                  ) : (
                    formatDeadline(bid)
                  )}
                </td>

                <td className="px-5 py-4 text-center">
                  <BidDetailModal bid={bid} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total_pages > 1 && (
        <nav
          aria-label="입찰공고 페이지"
          className="flex items-center justify-between border-t border-slate-200 px-5 py-4"
        >
          {data.page > 1 ? (
            <Link
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              href={pageHref(filters, data.page - 1)}
            >
              이전
            </Link>
          ) : (
            <span className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-300">
              이전
            </span>
          )}

          <p className="text-sm text-slate-600">
            <strong className="text-slate-950">{data.page}</strong> / {data.total_pages.toLocaleString("ko-KR")}
          </p>

          {data.page < data.total_pages ? (
            <Link
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              href={pageHref(filters, data.page + 1)}
            >
              다음
            </Link>
          ) : (
            <span className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-300">
              다음
            </span>
          )}
        </nav>
      )}
    </section>
  );
}
