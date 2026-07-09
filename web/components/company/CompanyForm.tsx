import Input from "@/components/ui/Input";

export default function CompanyForm() {
  return (
    <form className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2">
      <Input label="회사명" placeholder="예: 비드링크" />
      <Input label="사업자등록번호" placeholder="000-00-00000" />
      <Input label="주요 업종" placeholder="예: 소프트웨어 개발" />
      <Input label="희망 지역" placeholder="예: 서울, 경기" />
      <Input label="희망 키워드" placeholder="예: 홈페이지, 유지보수, 시스템" />
      <Input label="희망 예산" placeholder="예: 5천만원 이하" />
      <div className="md:col-span-2">
        <button className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white" type="button">
          저장하기
        </button>
      </div>
    </form>
  );
}
