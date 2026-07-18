"use client"; // 표 제목의 구분 필터와 마감일 정렬을 브라우저에서 처리

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { BidApiResponse, BidNotice, BidSearchParams } from "@/types/bid"; // 입찰공고 한 건의 TypeScript 자료형 가져오기
import BidDetailModal from "@/components/bids/BidDetailModal";
import SaveBidButton from "@/components/bids/SaveBidButton";

type BidTableProps = {
  data: BidApiResponse | null;
  error: string | null;
  filters: BidSearchParams;
};


function formatProjectBudget(bid: BidNotice) {
  const amountText = bid.asignBdgtAmt || bid.presmptPrce;
  const amount = Number(amountText);

  if (!amountText || !Number.isFinite(amount)) {
    return "-";
  }

  return `${amount.toLocaleString("ko-KR")}원`;
}


function getDeadlineParts(bid: BidNotice) {
  if (!bid.bidClseDate) {
    return { date: "-", time: "" };
  }

  const date = bid.bidClseDate.replaceAll("-", ".");
  return { date, time: bid.bidClseTm || "" };
}


function formatAllowedRegion(bid: BidNotice) {
  return bid.regionLimit ? bid.allowedRegion || "확인 필요" : "전국";
}


function RegionInfo({ bid }: { bid: BidNotice }) {
  const region = formatAllowedRegion(bid);
  const regionParts = [...new Set(region.split(/[,/\n]+/).map((item) => item.trim()).filter(Boolean))];
  const preview = regionParts.slice(0, 2).join(", ") || region;
  const needsTooltip = regionParts.length > 2 || preview.length > 14;

  if (!needsTooltip) {
    return <p className="mt-1 text-xs text-slate-500">{region}</p>;
  }

  return (
    <span className="group relative mt-1 block max-w-28">
      <button
        aria-label={`참가 지역 확인: ${region}`}
        className="flex w-full cursor-help items-center gap-1 text-left text-xs text-slate-500 hover:text-blue-600"
        type="button"
      >
        <span className="truncate">{preview}</span>
        <span aria-hidden="true" className="shrink-0 text-[10px]">▾</span>
      </button>
      <span className="invisible absolute left-0 top-7 z-20 w-64 whitespace-normal break-words rounded-md bg-slate-900 px-3 py-2 text-xs font-normal leading-5 text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        참가 지역: {region}
      </span>
    </span>
  );
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


function filterHref(
  filters: BidSearchParams,
  key: "business_type" | "deadline_sort",
  value: string,
) {
  const params = new URLSearchParams();

  for (const [filterKey, filterValue] of Object.entries(filters)) {
    if (filterValue && filterKey !== "page") params.set(filterKey, filterValue);
  }

  if (value) params.set(key, value);
  else params.delete(key);

  return `/dashBoard/bidList${params.size ? `?${params}` : ""}`;
}

export default function BidTable({ data, error, filters }: BidTableProps) { // 입찰 데이터를 서버에서 가져오는 서버 컴포넌트
  const router = useRouter();
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
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="w-32 whitespace-nowrap px-4 py-3 font-semibold" scope="col">
                <label className={`relative inline-flex cursor-pointer items-center gap-1 ${filters.business_type ? "text-blue-600" : ""}`}>
                  <span>구분</span>
                  <span aria-hidden="true" className="text-xs">▾</span>
                  <select
                    aria-label="업무 구분 필터"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(event) => router.push(filterHref(filters, "business_type", event.target.value))}
                    value={filters.business_type ?? ""}
                  >
                    <option value="">전체</option>
                    <option value="물품">물품</option>
                    <option value="용역">용역</option>
                    <option value="공사">공사</option>
                  </select>
                </label>
              </th>

              <th className="min-w-[440px] px-4 py-3 text-center font-semibold" scope="col">
                공고명
              </th>

              <th className="w-28 whitespace-nowrap px-4 py-3 font-semibold" scope="col">
                계약 방법
              </th>

              <th className="w-32 whitespace-nowrap px-4 py-3 font-semibold" scope="col">
                <span title="배정예산을 우선 표시하고, 없으면 추정가격을 표시합니다.">예산/추정가격</span>
              </th>

              <th className="w-28 whitespace-nowrap px-4 py-3 font-semibold" scope="col">
                공고일
              </th>

              <th className="w-28 whitespace-nowrap px-4 py-3 font-semibold" scope="col">
                <label className={`relative inline-flex cursor-pointer items-center gap-1 ${filters.deadline_sort ? "text-blue-600" : ""}`}>
                  <span>마감일</span>
                  <span aria-hidden="true" className="text-xs">▾</span>
                  <select
                    aria-label="마감일 정렬"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(event) => router.push(filterHref(filters, "deadline_sort", event.target.value))}
                    value={filters.deadline_sort ?? ""}
                  >
                    <option value="">기본순</option>
                    <option value="asc">빠른순</option>
                    <option value="desc">느린순</option>
                  </select>
                </label>
              </th>

              <th className="w-24 whitespace-nowrap px-4 py-3 text-center font-semibold" scope="col">
                작업
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
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {bid.bsnsDivNm} {/* 업무 구분 */}
                  <RegionInfo bid={bid} />
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-end gap-2 leading-6">
                    <BidDetailModal
                      bid={bid}
                      trigger={bid.bidNtceNm}
                      triggerClassName="min-w-0 flex-1 cursor-pointer whitespace-normal text-left font-semibold text-slate-950 transition-colors hover:text-blue-600 hover:underline"
                    /> {/* 공고명을 누르면 상세 팝업 열기 */}

                    {typeof bid.bidNtceUrl === "string" && bid.bidNtceUrl && (
                      <a
                        className="inline-flex h-6 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-300 px-2 text-[11px] font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
                        href={bid.bidNtceUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        원문
                      </a>
                    )}
                  </div>

                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {bid.cntrctCnclsMthdNm} {/* 계약 방법 */}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {formatProjectBudget(bid)} {/* 배정 예산이 없으면 추정 가격 표시 */}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {bid.bidNtceDate} {/* 공고 날짜 */}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {bid.deadlineStatus === "review" ? (
                    <span className="inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                      마감일 확인 필요
                    </span>
                  ) : (
                    <>
                      <p>{getDeadlineParts(bid).date}</p>
                      {getDeadlineParts(bid).time && (
                        <p className="mt-1 text-xs text-slate-500">{getDeadlineParts(bid).time}</p>
                      )}
                    </>
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4">
                  <div className="flex items-start justify-center">
                    <SaveBidButton bidNtceNo={bid.bidNtceNo} />
                  </div>
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
