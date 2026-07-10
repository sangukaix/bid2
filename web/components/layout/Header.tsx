import Link from "next/link"; // 페이지 이동을 위한 Next.js 링크 컴포넌트

export default function Header() { // 사이트 상단 공통 메뉴 컴포넌트
  return (
    <header className="border-b border-slate-200 bg-white"> {/* 상단 바 영역 */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6"> {/* 로고와 메뉴 배치 */}
        <Link className="text-sm font-bold text-slate-950" href="/mainPage">Bid Link</Link>
        <nav className="flex items-center gap-5 text-sm text-slate-600"> {/* 오른쪽 메뉴 */}
          <Link href="/dashBoard/bidList">입찰공고</Link>
          <Link href="/login">로그인</Link>
          <Link className="font-semibold text-blue-600" href="/signup">회원가입</Link>
        </nav>
      </div>
    </header>
  );
}
