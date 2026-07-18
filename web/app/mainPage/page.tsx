import Link from "next/link"; // 페이지 이동을 위한 Next.js 링크 컴포넌트
import Header from "@/components/layout/Header"; // 상단 메뉴 컴포넌트
import StepCard from "@/components/home/StepCard"; // 메인 페이지의 단계 설명 카드 컴포넌트

export default function MainPage() { // /mainPage 주소에서 보이는 메인 페이지
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950"> {/* 페이지 전체 영역 */}
      <Header /> {/* 상단 메뉴 */}

      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center"> {/* 메인 소개 영역 */}
        <h1 className="max-w-2xl text-4xl font-bold leading-tight">AI 기반 입찰 자동화 서비스</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600"> 
          회사 정보와 관심 분야를 등록하면 AI가 입찰 가능한 공고를 검색하고<br/>제안서 초안 작성 및 낙찰성공률을 분석해 드립니다</p>

        <div className="mt-8 flex gap-3"> {/* 주요 이동 버튼 영역 */}
          <Link className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white" href="/signup">시작하기</Link>
          <Link className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700" href="/login">로그인</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-20 md:grid-cols-3"> {/* 서비스 단계 카드 영역 */}
        <StepCard title="1. 회사 정보 입력" description="회사 기본 정보와 보유 역량, 희망 입찰 조건을 상세히 입력합니다." />
        <StepCard title="2. AI 비서와 공고 입찰 가능성 확인" description="공고 문서를 AI 비서와 검토하고 우리 회사의 입찰 참가 가능성을 확인합니다." />
        <StepCard title="3. 제안서 자동 생성" description="공고 요구사항과 회사 정보를 바탕으로 맞춤형 제안서 초안을 생성합니다." />
      </section>
    </main>
  );
}
