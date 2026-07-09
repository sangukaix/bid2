import Link from "next/link";

const menuItems = [
  { href: "/company", label: "회사 정보 설정" },
  { href: "/bids", label: "추천 입찰 목록" },
];

export default function Sidebar() {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-4 text-sm font-bold text-slate-950">My Page</p>
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
