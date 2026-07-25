"use client";

import Link from "next/link"; // 페이지 이동을 위한 Next.js 링크 컴포넌트
import { usePathname } from "next/navigation"; // 현재 보고 있는 페이지 주소 확인

import LogoutButton from "@/components/auth/LogoutButton"; // 로그인 정보 삭제 버튼

const menuItems = [ // 사이드바에 보여줄 메뉴 목록
  { href: "/dashBoard/myCompanyInfo", label: "회사정보" },
  { href: "/dashBoard/bidList", label: "입찰공고 목록" },
  { href: "/dashBoard/recommendedBid", label: "추천공고" },
  { href: "/dashBoard/matchBid", label: "저장공고 · AI분석" },
];

export default function Sidebar() { // 대시보드에서 공통으로 쓰는 왼쪽 메뉴
  const pathname = usePathname();

  function menuClassName(href: string) {
    const isCurrent = pathname === href;

    return `flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
      isCurrent
        ? "border-blue-100 bg-blue-50 font-semibold text-blue-700"
        : "border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-950"
    }`;
  }

  return (
    <aside className="app-panel flex flex-col rounded-lg border p-4 md:sticky md:top-10 md:h-[calc(100vh-5rem)]"> {/* 화면 왼쪽에 고정되는 공통 메뉴 */}
      <p className="mb-3 border-b border-slate-200 px-3 pb-3 pt-1 text-sm font-bold text-slate-950">
        Dashboard
      </p>

      <nav className="flex flex-col gap-2"> {/* 메뉴 링크 목록 */}
        {menuItems.map((item) => {
          const isCurrent = pathname === item.href;

          return (
            <Link
              aria-current={isCurrent ? "page" : undefined}
              className={menuClassName(item.href)}
              href={item.href}
              key={item.href}
            >
              <span
                aria-hidden="true"
                className={`h-4 w-1 rounded-full ${isCurrent ? "bg-blue-600" : "bg-transparent"}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Link
          aria-current={pathname === "/dashBoard/myInfo" ? "page" : undefined}
          className={menuClassName("/dashBoard/myInfo")}
          href="/dashBoard/myInfo"
        >
          <span
            aria-hidden="true"
            className={`h-4 w-1 rounded-full ${pathname === "/dashBoard/myInfo" ? "bg-blue-600" : "bg-transparent"}`}
          />
          결제 정보
        </Link>

        <nav className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-2"> {/* 공통 페이지 이동 메뉴 */}
          <Link className="rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950" href="/mainPage">
            메인 페이지
          </Link>

          <LogoutButton />
        </nav>
      </div>
    </aside>
  );
}
