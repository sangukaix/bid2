import Link from "next/link"; // 페이지 이동을 위한 Next.js 링크 컴포넌트

const menuItems = [ // 사이드바에 보여줄 메뉴 목록
  { href: "/dashBoard/myInfo", label: "내 정보" },
  { href: "/dashBoard/myCompanyInfo", label: "회사 정보" },
  { href: "/dashBoard/bidList", label: "입찰공고 목록" },
  { href: "/dashBoard/recommendBid", label: "추천 입찰" },
  { href: "/dashBoard/matchBid", label: "AI 매칭 분석" },
];

export default function Sidebar() { // 대시보드에서 공통으로 쓰는 왼쪽 메뉴
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4"> {/* 왼쪽 메뉴 박스 */}
      <p className="mb-4 text-sm font-bold text-slate-950">DashBoard</p>
      <nav className="flex flex-col gap-2"> {/* 메뉴 링크 목록 */}
        {menuItems.map((item) => (
          <Link className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
