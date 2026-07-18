import CompanyProfile from "@/components/companyForm/CompanyProfile"; // 회사 정보 조회와 요약 컴포넌트

export default function MyCompanyInfoPage() { // /dashBoard/myCompanyInfo 주소에서 보이는 회사 정보 페이지
  return (
    <section className="max-w-4xl"> {/* 회사 정보 페이지를 본문 왼쪽에 맞추는 영역 */}
      <div className="border-b border-slate-200 pb-6"> {/* 페이지 제목 영역 */}
        <h1 className="text-2xl font-bold">회사 프로필</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          나의 회사 정보를 입력합니다. 상세히 입력할수록 입찰 성공률이 높아지니 최대한 상세히 작성해 주세요.
        </p>
      </div>

      <CompanyProfile /> {/* 저장 정보가 있으면 요약, 없으면 입력 폼 표시 */}
    </section>
  );
}
