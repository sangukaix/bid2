import Link from "next/link"; // 페이지 이동을 위한 Next.js 링크 컴포넌트

import LogoutButton from "@/components/auth/LogoutButton"; // 로그인 정보 삭제 버튼

const menuItems = [ // 사이드바에 보여줄 메뉴 목록
  { href: "/dashBoard/myCompanyInfo", label: "회사 정보" },
  { href: "/dashBoard/bidList", label: "입찰공고 목록" },
  { href: "/dashBoard/recommendedBid", label: "추천 공고" },
  { href: "/dashBoard/matchBid", label: "저장 공고 · AI 분석" },
];

export default function Sidebar() { // 대시보드에서 공통으로 쓰는 왼쪽 메뉴
  return (
    <aside className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 md:sticky md:top-10 md:h-[calc(100vh-5rem)]"> {/* 화면 왼쪽에 고정되는 공통 메뉴 */}
      <p className="mb-2 px-3 py-2 text-sm font-bold text-slate-950">
        DashBoard
      </p>

      <nav className="flex flex-col gap-2"> {/* 메뉴 링크 목록 */}
        {menuItems.map((item) => (
          <Link className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <Link className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href="/dashBoard/myInfo">
          내 정보
        </Link>

        <nav className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-2"> {/* 공통 페이지 이동 메뉴 */}
          <Link className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href="/mainPage">
            메인 페이지
          </Link>

          <LogoutButton />
        </nav>
      </div>
    </aside>
  );
}
