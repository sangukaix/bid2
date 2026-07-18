"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const plans = [
  { name: "Free", price: "0원", analysis: "월 3회", proposal: "제공 안 함", chat: "제한적 AI 채팅" },
  { name: "Plus", price: "월 10,000원", analysis: "월 20회", proposal: "월 2회", chat: "더 많은 메모리" },
  { name: "Pro", price: "월 50,000원", analysis: "월 100회", proposal: "월 10회", chat: "Plus 대비 20배 메모리" },
];

export default function MyInfoPage() { // /dashBoard/myInfo 주소에서 보이는 내 정보 페이지
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>();

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("auth_token"))); // 브라우저의 로그인 Token 확인
  }, []);

  if (isLoggedIn === undefined) {
    return <p className="text-sm text-slate-500">내 정보를 불러오는 중입니다.</p>;
  }

  if (!isLoggedIn) {
    return (
      <section className="border-y border-slate-200 py-10 text-center">
        <p className="text-sm text-slate-600">내 정보를 불러오려면 로그인해 주세요.</p>
        <Link className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" href="/login">로그인</Link>
      </section>
    );
  }

  return (
    <section className="min-w-0"> {/* 이용 중인 요금제와 월 제공량을 보여주는 영역 */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold text-slate-950">내 정보</h1>
      </div>

      <section className="mt-6">
        <h2 className="text-base font-bold text-slate-950">현재 이용 정보</h2>
        <dl className="mt-3 grid overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-200">
          <div className="p-4"><dt className="text-xs text-slate-500">현재 플랜</dt><dd className="mt-2 text-base font-semibold text-blue-700">Free</dd></div>
          <div className="border-t border-slate-200 p-4 sm:border-t-0"><dt className="text-xs text-slate-500">결제 정보</dt><dd className="mt-2 text-sm text-slate-800">무료 이용 중</dd></div>
          <div className="border-t border-slate-200 p-4 lg:border-t-0"><dt className="text-xs text-slate-500">AI 공고 분석</dt><dd className="mt-2 text-sm text-slate-800">월 3회</dd></div>
          <div className="border-t border-slate-200 p-4 sm:border-t-0"><dt className="text-xs text-slate-500">제안서 작성</dt><dd className="mt-2 text-sm text-slate-800">제공 안 함</dd></div>
        </dl>
      </section>

      <section className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-950">요금제 안내</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr><th className="px-5 py-3 font-semibold">플랜</th><th className="px-5 py-3 font-semibold">가격</th><th className="px-5 py-3 font-semibold">AI 공고 분석</th><th className="px-5 py-3 font-semibold">제안서 작성</th><th className="px-5 py-3 font-semibold">AI 채팅</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {plans.map((plan) => (
                <tr className={plan.name === "Free" ? "bg-blue-50/50" : ""} key={plan.name}>
                  <td className="px-5 py-4 font-semibold text-slate-950">{plan.name}</td>
                  <td className="px-5 py-4 text-slate-700">{plan.price}</td>
                  <td className="px-5 py-4 text-slate-700">{plan.analysis}</td>
                  <td className="px-5 py-4 text-slate-700">{plan.proposal}</td>
                  <td className="px-5 py-4 text-slate-700">{plan.chat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
