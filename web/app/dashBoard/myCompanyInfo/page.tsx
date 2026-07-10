import CompanyForm from "@/components/companyForm/CompanyForm"; // 회사 정보 입력 폼 컴포넌트

export default function MyCompanyInfoPage() { // /dashBoard/myCompanyInfo 주소에서 보이는 회사 정보 페이지
  return (
    <section className="mx-auto max-w-4xl"> {/* 회사 정보 페이지 본문 너비를 제한하는 영역 */}
      <div className="border-b border-slate-200 pb-6"> {/* 페이지 제목 영역 */}
        <p className="text-sm font-semibold text-blue-600">회사 설정</p>
        <h1 className="mt-2 text-2xl font-bold">회사 프로필</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          회사와 잘 맞는 입찰공고를 찾기 위해 필요한 정보를 입력해주세요.
        </p>
      </div>

      <CompanyForm /> {/* 회사 정보 입력 폼 */}
    </section>
  );
}
