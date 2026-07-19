"use client"; // 로그인 토큰으로 회원별 추천 공고를 불러오는 화면

import { useEffect, useState } from "react";

import LoginRequiredNotice from "@/components/auth/LoginRequiredNotice";
import BidDetailModal from "@/components/bids/BidDetailModal";
import SaveBidButton from "@/components/bids/SaveBidButton";
import type { BidNotice, StoredRecommendationResponse } from "@/types/bid";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function formatAmount(bid: BidNotice) {
  const amount = Number(bid.asignBdgtAmt || bid.presmptPrce);
  return Number.isFinite(amount) && amount > 0 ? `${amount.toLocaleString("ko-KR")}원` : "확인 필요";
}

export default function RecommendedBidBoard() {
  const [data, setData] = useState<StoredRecommendationResponse | null>(null);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [businessType, setBusinessType] = useState(""); // 추천 목록에서 선택한 업무 구분

  useEffect(() => {
    async function loadRecommendations() {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setNeedsLogin(true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/recommendations/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (response.status === 401 || response.status === 403) {
          setNeedsLogin(true);
          return;
        }
        if (!response.ok) throw new Error();
        setData((await response.json()) as StoredRecommendationResponse);
      } catch {
        setError("추천 공고를 불러오지 못했습니다. Django 서버를 확인해 주세요.");
      }
    }

    loadRecommendations();
  }, []);

  if (needsLogin) {
    return <LoginRequiredNotice />;
  }
  if (error) {
    return <p className="mt-6 rounded-md bg-red-50 px-5 py-12 text-center text-sm text-red-600">{error}</p>;
  }
  if (!data) {
    return <p className="mt-6 py-12 text-center text-sm text-slate-500">추천 공고를 불러오는 중입니다.</p>;
  }

  const filteredItems = data.items.filter(
    (bid) => !businessType || bid.bsnsDivNm === businessType,
  ); // 전체·물품·용역·공사 중 선택한 공고만 표시

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-end border-b border-slate-200 pb-4">
        <span className="rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">알림 대기 {data.pending_notification_count}건</span>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-500">
          {data.items.length === 0
            ? "아직 조건에 맞는 새 공고가 없습니다. 회사 정보의 희망 조건을 확인해 주세요."
            : "선택한 구분에 해당하는 추천 공고가 없습니다."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="w-24 whitespace-nowrap px-4 py-3 font-semibold">
                    <label className={`relative inline-flex cursor-pointer items-center gap-1 ${businessType ? "text-blue-600" : ""}`}>
                      <span>구분</span>
                      <span aria-hidden="true" className="text-xs">▾</span>
                      <select
                        aria-label="추천 공고 업무 구분 필터"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        onChange={(event) => setBusinessType(event.target.value)}
                        value={businessType}
                      >
                        <option value="">전체</option>
                        <option value="물품">물품</option>
                        <option value="용역">용역</option>
                        <option value="공사">공사</option>
                      </select>
                    </label>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">공고명</th>
                  <th className="w-28 px-4 py-3 font-semibold">
                    <span className="group relative inline-flex items-center gap-1">
                      <span className="text-center leading-4">조건<br />일치도</span>
                      <button aria-label="조건 일치도 계산 기준" className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-400 text-[10px] text-slate-500" type="button">?</button>
                      <span className="invisible absolute left-0 top-6 z-20 w-72 rounded-md bg-slate-900 px-3 py-2 text-xs font-normal leading-5 text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                        공고명은 첫 키워드 40점·추가 키워드당 10점(최대 60점), 업종·기관은 첫 키워드 10점·추가 키워드당 5점(최대 15점)입니다. 업무 구분과 희망 지역은 각 10점, 금액 범위는 5점입니다. 동점이면 공고명 일치 개수, 최신 등록일, 마감일 순으로 정렬합니다.
                      </span>
                    </span>
                  </th>
                  <th className="w-32 px-4 py-3 font-semibold">예산/추정가격</th>
                  <th className="w-28 px-4 py-3 font-semibold">마감일</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">저장</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((bid) => (
                  <tr className="hover:bg-slate-50" key={`${bid.bidNtceNo}-${bid.bidNtceOrd}`}>
                    <td className="px-4 py-4 text-slate-600">{bid.bsnsDivNm || "-"}</td>
                    <td className="px-4 py-4">
                      <div className="leading-5">
                        <BidDetailModal bid={bid} flowTrigger trigger={bid.bidNtceNm} triggerClassName="inline cursor-pointer break-keep text-left font-semibold text-slate-950 hover:text-blue-600" />
                        {typeof bid.bidNtceUrl === "string" && bid.bidNtceUrl ? (
                          <>
                            {" "}
                            <a className="inline-flex h-6 items-center rounded-md border border-slate-300 px-2 align-middle text-[11px] font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600" href={bid.bidNtceUrl} rel="noreferrer" target="_blank">원문</a>
                          </>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{bid.matchReasons?.join(" · ") || "회사 조건 일치"}</p>
                    </td>
                    <td className="px-4 py-4"><span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{bid.matchScore ?? 0}점</span></td>
                    <td className="px-4 py-4 text-slate-600">{formatAmount(bid)}</td>
                    <td className="px-4 py-4 text-slate-600">{bid.bidClseDate || "확인 필요"}</td>
                    <td className="px-4 py-4 text-center"><SaveBidButton bidNtceNo={bid.bidNtceNo} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
