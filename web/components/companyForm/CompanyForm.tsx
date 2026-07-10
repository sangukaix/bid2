import Input from "@/components/ui/Input"; // 한 줄 입력칸을 재사용하기 위한 컴포넌트
import FormSection from "@/components/companyForm/FormSection"; // 관련 입력값을 주제별로 묶는 컴포넌트

export default function CompanyForm() { // 회사 정보 입력 화면 전체를 담당하는 컴포넌트
  return (
    <form className="mt-6 space-y-5"> {/* 여러 입력 영역과 저장 버튼을 하나의 폼으로 묶음 */}
      <FormSection title="기본 정보" description="회사를 확인하기 위한 기본 정보를 입력해주세요.">
        <Input label="회사명 *" placeholder="예: 비드링크" />
        <Input label="사업자등록번호 *" placeholder="000-00-00000" />
        <Input label="대표자명 *" placeholder="예: 김대표" />
        <Input label="전화번호" type="tel" placeholder="02-1234-5678" />

        <div className="md:col-span-2"> {/* 주소 입력칸은 두 열 전체를 사용 */}
          <Input label="회사 소재지 *" placeholder="예: 서울특별시 강남구 테헤란로 123" />
        </div>
      </FormSection>

      <FormSection title="사업 정보" description="회사가 주로 수행하는 업무와 보유 역량을 입력해주세요.">
        <div className="md:col-span-2">
          <Input label="주요 업종 *" placeholder="예: 소프트웨어 개발 및 공급" />
        </div>

        <label className="block md:col-span-2"> {/* 여러 줄을 입력하는 회사 소개 영역 */}
          <span className="text-sm font-medium text-slate-700">주요 사업 내용 *</span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="회사가 제공하는 주요 제품이나 서비스를 입력해주세요."
          />
        </label>

        <label className="block md:col-span-2"> {/* 입찰 참가 자격 확인에 사용할 면허와 인증 입력 영역 */}
          <span className="text-sm font-medium text-slate-700">보유 면허 및 인증</span>
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="예: 소프트웨어사업자, 정보통신공사업 면허"
          />
        </label>
      </FormSection>

      <FormSection title="희망 입찰 조건" description="찾고 싶은 입찰공고의 기준을 입력해주세요.">
        <label className="block md:col-span-2"> {/* 공고 검색에 사용할 핵심 단어 입력 영역 */}
          <span className="text-sm font-medium text-slate-700">희망 입찰 키워드 *</span>
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="예: 홈페이지 구축, 시스템 유지보수, 웹 접근성"
          />
          <span className="mt-2 block text-xs text-slate-500">여러 키워드는 쉼표로 구분해주세요.</span>
        </label>

        <label className="block"> {/* 정해진 공고 유형 중 하나를 선택하는 영역 */}
          <span className="text-sm font-medium text-slate-700">공고 유형</span>
          <select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500">
            <option value="">전체</option>
            <option value="service">용역</option>
            <option value="goods">물품</option>
            <option value="construction">공사</option>
          </select>
        </label>

        <Input label="희망 지역" placeholder="예: 서울, 경기" />
        <Input label="최소 공고 금액" type="number" placeholder="예: 10000000" />
        <Input label="최대 공고 금액" type="number" placeholder="예: 100000000" />
      </FormSection>

      <div className="flex justify-end pt-1"> {/* 입력 영역 아래 오른쪽에 저장 버튼 배치 */}
        <button
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          type="button"
        >
          회사 정보 저장
        </button>
      </div>
    </form>
  );
}
