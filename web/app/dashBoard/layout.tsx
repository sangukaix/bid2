import Sidebar from "@/components/layout/Sidebar"; // 대시보드 왼쪽 메뉴 컴포넌트

type DashBoardLayoutProps = { // layout이 받을 props 타입
  children: React.ReactNode; // 현재 선택된 페이지 내용이 들어오는 자리
};

export default function DashBoardLayout({ children }: DashBoardLayoutProps) { // /dashBoard 아래 페이지들의 공통 화면 틀
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950"> {/* 대시보드 전체 배경 영역 */}
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-[220px_1fr]"> {/* 사이드바와 본문을 나누는 그리드 */}
        <Sidebar /> {/* 모든 대시보드 페이지에서 공통으로 보이는 왼쪽 메뉴 */}
        <div>{children}</div> {/* 각 page.tsx의 내용이 바뀌어 들어오는 자리 */}
      </div>
    </main>
  );
}
