import Sidebar from "@/components/layout/Sidebar";
import CompanyForm from "@/components/company/CompanyForm";

export default function CompanyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-[220px_1fr]">
        <Sidebar />
        <section>
          <h1 className="text-2xl font-bold">회사 정보 설정</h1>
          <p className="mt-2 text-sm text-slate-600">추천 기준으로 사용할 회사 기본 정보를 입력합니다.</p>
          <CompanyForm />
        </section>
      </div>
    </main>
  );
}
