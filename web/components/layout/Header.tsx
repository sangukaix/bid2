import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link className="text-sm font-bold text-slate-950" href="/">Bid Link</Link>
        <nav className="flex items-center gap-5 text-sm text-slate-600">
          <Link href="/bids">추천 입찰</Link>
          <Link href="/login">로그인</Link>
          <Link className="font-semibold text-blue-600" href="/signup">회원가입</Link>
        </nav>
      </div>
    </header>
  );
}
