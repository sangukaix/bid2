"use client"; // 로그인 회원의 저장 공고를 조회하고 화면에서 관리

import Link from "next/link";
import { useEffect, useState } from "react";

import BidDetailModal from "@/components/bids/BidDetailModal";
import BidChatButton from "@/components/chat/BidChatButton";
import type { BidNotice, SavedBidResponse } from "@/types/bid";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function formatAmount(bid: BidNotice) {
  const amount = Number(bid.asignBdgtAmt || bid.presmptPrce);
  return Number.isFinite(amount) && amount > 0 ? `${amount.toLocaleString("ko-KR")}원` : "확인 필요";
}

export default function SavedBidBoard() {
  const [bids, setBids] = useState<BidNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSavedBids() {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("로그인 후 확인이 가능합니다.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/saved-bids/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) throw new Error();
        const data = (await response.json()) as SavedBidResponse;
        setBids(data.items);
      } catch {
        setError("저장 공고를 불러오지 못했습니다. Django 서버를 확인해 주세요.");
      } finally {
        setIsLoading(false);
      }
    }

    loadSavedBids();
  }, []);

  async function removeSavedBid(bidNtceNo: string) {
    const confirmed = window.confirm(
      "저장한 공고를 삭제하면 해당 공고의 채팅 및 AI 분석 정보도 함께 삭제되며 복구할 수 없습니다. 정말 삭제하시겠습니까?",
    );
    if (!confirmed) return;

    const token = localStorage.getItem("auth_token");
    if (!token) return;
    const response = await fetch(`${API_BASE_URL}/api/saved-bids/${bidNtceNo}/`, {
      method: "DELETE",
      headers: { Authorization: `Token ${token}` },
    });

    if (response.ok) {
      setBids((current) => current.filter((bid) => bid.bidNtceNo !== bidNtceNo));
    } else {
      setError("저장 취소에 실패했습니다.");
    }
  }

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-bold text-slate-950">내 저장 공고</h2>
        <span className="text-sm text-slate-500">총 {bids.length}건</span>
      </div>

      {isLoading && <p className="px-5 py-14 text-center text-sm text-slate-500">저장 공고를 불러오는 중입니다.</p>}
      {!isLoading && error && <p className="px-5 py-14 text-center text-sm text-red-600">{error}</p>}
      {!isLoading && !error && bids.length === 0 && (
        <div className="px-5 py-14 text-center">
          <p className="text-sm text-slate-500">아직 저장한 공고가 없습니다.</p>
          <Link className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" href="/dashBoard/bidList">입찰공고 찾기</Link>
        </div>
      )}

      {bids.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] table-fixed border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="w-20 px-3 py-3 font-semibold">구분</th>
                <th className="px-3 py-3 text-center font-semibold">공고명</th>
                <th className="w-24 px-3 py-3 font-semibold">계약 방법</th>
                <th className="w-32 px-3 py-3 font-semibold">예산/추정가격</th>
                <th className="w-24 px-3 py-3 font-semibold">마감일</th>
                <th className="w-[340px] px-3 py-3 text-center font-semibold">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bids.map((bid) => (
                <tr className="hover:bg-slate-50" key={`${bid.bidNtceNo}-${bid.bidNtceOrd}`}>
                  <td className="px-3 py-4 text-slate-600">{bid.bsnsDivNm || "-"}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-end gap-2 leading-5">
                      <BidDetailModal bid={bid} trigger={bid.bidNtceNm} triggerClassName="min-w-0 flex-1 cursor-pointer text-left font-semibold text-slate-950 hover:text-blue-600" />
                      {typeof bid.bidNtceUrl === "string" && bid.bidNtceUrl ? (
                        <a className="inline-flex h-6 shrink-0 items-center rounded-md border border-slate-300 px-2 text-[11px] font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600" href={bid.bidNtceUrl} rel="noreferrer" target="_blank">원문</a>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-slate-600">{bid.cntrctCnclsMthdNm || "-"}</td>
                  <td className="px-3 py-4 text-slate-600">{formatAmount(bid)}</td>
                  <td className="px-3 py-4 text-slate-600">{bid.bidClseDate || "확인 필요"}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <BidChatButton bidNtceNo={bid.bidNtceNo} bidTitle={bid.bidNtceNm} initialHasHistory={bid.hasChat} />
                      <Link className="inline-flex h-10 w-[76px] flex-col items-center justify-center rounded-md bg-blue-600 text-xs font-semibold leading-4 text-white hover:bg-blue-700" href={`/dashBoard/matchBid?bid=${encodeURIComponent(bid.bidNtceNo)}`}>
                        <span>AI 분석</span>
                        {bid.hasAnalysis && <span className="text-[10px] font-normal text-blue-100">다시보기</span>}
                      </Link>
                      <button className="h-9 w-[88px] cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-400" disabled title="다음 개발 단계에서 연결합니다." type="button">제안서 제작</button>
                      <button className="h-9 w-[72px] rounded-md border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => removeSavedBid(bid.bidNtceNo)} type="button">저장 취소</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
