import Link from "next/link";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Header />
      <section className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="mt-2 text-sm text-slate-600">아직 기능 연결 전이라 화면만 준비합니다.</p>

        <form className="mt-8 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <Input label="이메일" type="email" placeholder="company@example.com" />
          <Input label="비밀번호" type="password" placeholder="비밀번호" />
          <button className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white" type="button">
            로그인
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          계정이 없다면 <Link className="font-semibold text-blue-600" href="/signup">회원가입</Link>
        </p>
      </section>
    </main>
  );
}
