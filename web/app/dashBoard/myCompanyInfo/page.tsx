import CompanyProfile from "@/components/companyForm/CompanyProfile"; // 회사 정보 조회와 요약 컴포넌트

export default function MyCompanyInfoPage() { // /dashBoard/myCompanyInfo 주소에서 보이는 회사 정보 페이지
  return (
    <section className="min-w-0"> {/* 다른 대시보드 페이지와 같은 본문 너비 사용 */}
      <div className="border-b border-slate-200 pb-6"> {/* 페이지 제목 영역 */}
        <h1 className="text-2xl font-bold">회사정보</h1>
      </div>

      <CompanyProfile /> {/* 저장 정보가 있으면 요약, 없으면 입력 폼 표시 */}
    </section>
  );
}
