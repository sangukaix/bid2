import Link from "next/link";
import Header from "@/components/layout/Header";
import StepCard from "@/components/home/StepCard";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center">
        <p className="mb-4 text-sm font-semibold text-blue-600">Bid Link</p>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight">
          회사 조건에 맞는 정부입찰을 더 쉽게 찾습니다
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
          회사 정보와 희망 입찰 조건을 기준으로 공고를 모으고, 잘 맞는 입찰을 추천하는 MVP 서비스입니다.
        </p>

        <div className="mt-8 flex gap-3">
          <Link className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white" href="/signup">
            시작하기
          </Link>
          <Link className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700" href="/login">
            로그인
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-20 md:grid-cols-3">
        <StepCard title="1. 회사 정보 입력" description="업종, 지역, 키워드, 예산 같은 기본 조건을 입력합니다." />
        <StepCard title="2. 입찰공고 확인" description="나라장터 API로 수집한 공고를 목록에서 확인합니다." />
        <StepCard title="3. AI 분석 확인" description="추천 이유와 주의할 조건을 상세 페이지에서 확인합니다." />
      </section>
    </main>
  );
}
