"use client";

import Link from "next/link"; // 페이지 이동을 위한 Next.js 링크 컴포넌트
import { usePathname } from "next/navigation"; // 현재 보고 있는 페이지 주소 확인
import { useCallback, useEffect, useState } from "react";

import LogoutButton from "@/components/auth/LogoutButton"; // 로그인 정보 삭제 버튼
import type { BidNotice, SavedBidResponse } from "@/types/bid";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const menuItems = [ // 사이드바의 기본 메뉴 목록
  { href: "/dashBoard/myCompanyInfo", label: "회사정보" },
  { href: "/dashBoard/bidList", label: "입찰공고 목록" },
  { href: "/dashBoard/recommendedBid", label: "추천공고" },
];

export default function Sidebar() { // 대시보드에서 공통으로 쓰는 왼쪽 메뉴
  const pathname = usePathname();
  const [proposalProjects, setProposalProjects] = useState<BidNotice[]>([]);
  const isProposalPage = pathname.startsWith("/dashBoard/matchBid");
  const currentProjectId =
    isProposalPage && !pathname.startsWith("/dashBoard/matchBid/analysis")
      ? decodeURIComponent(pathname.split("/")[3] ?? "")
      : "";

  const loadProposalProjects = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setProposalProjects([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/saved-bids/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!response.ok) return;
      const data = (await response.json()) as SavedBidResponse;
      setProposalProjects(
        data.items
          .filter((item) => item.hasProposalProject)
          .sort((first, second) => {
            const firstTime =
              first.proposalProjectStartedAt ?? first.savedAt ?? "";
            const secondTime =
              second.proposalProjectStartedAt ?? second.savedAt ?? "";
            return firstTime.localeCompare(secondTime);
          }),
      ); // 프로젝트를 시작한 순서대로 프로젝트 1, 2 번호 유지
    } catch {
      // 사이드바 목록 실패는 현재 페이지 사용을 막지 않음
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => void loadProposalProjects(),
      0,
    );
    window.addEventListener("proposal-projects-updated", loadProposalProjects);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(
        "proposal-projects-updated",
        loadProposalProjects,
      );
    };
  }, [loadProposalProjects]);

  function isMenuCurrent(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function menuClassName(href: string) {
    const isCurrent = isMenuCurrent(href);

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
          const isCurrent = isMenuCurrent(item.href);

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

        <div>
          <Link
            aria-current={isProposalPage ? "page" : undefined}
            className={menuClassName("/dashBoard/matchBid")}
            href="/dashBoard/matchBid"
          >
            <span
              aria-hidden="true"
              className={`h-4 w-1 rounded-full ${isProposalPage ? "bg-blue-600" : "bg-transparent"}`}
            />
            제안서 제작
          </Link>

          <div className="ml-5 mt-1 border-l border-slate-200 pl-2">
            {proposalProjects.map((project, index) => {
              const isCurrent = currentProjectId === project.bidNtceNo;
              return (
                <Link
                  aria-current={isCurrent ? "page" : undefined}
                  className={`mt-1 block rounded-md px-3 py-2 transition-colors ${
                    isCurrent
                      ? "bg-slate-200 font-semibold text-slate-900"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                  href={`/dashBoard/matchBid/${encodeURIComponent(project.bidNtceNo)}`}
                  key={project.bidNtceNo}
                  title={`프로젝트${index + 1} ${project.bidNtceNm}`}
                >
                  <span className="block text-xs font-semibold">프로젝트{index + 1}</span>
                  <span className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-4 opacity-75">
                    {project.bidNtceNm}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
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

        <nav className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-2">
          <Link className="rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950" href="/mainPage">
            메인 페이지
          </Link>
          <LogoutButton />
        </nav>
      </div>
    </aside>
  );
}
