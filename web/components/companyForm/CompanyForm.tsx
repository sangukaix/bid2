"use client";

import { FormEvent, useState } from "react";

import Input from "@/components/ui/Input"; // 한 줄 입력칸을 재사용하기 위한 컴포넌트
import RegionSelector, { parseRegions } from "@/components/ui/RegionSelector"; // 여러 희망 지역 선택
import FormSection from "@/components/companyForm/FormSection"; // 관련 입력값을 주제별로 묶는 컴포넌트
import { formatCompanyKeywords } from "@/lib/companyKeywords";
import type { CompanyProfileData } from "@/types/company"; // 회사 정보 JSON의 TypeScript 자료형

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const nullableFields = new Set([
  "established_date",
  "employee_count",
  "capital",
  "annual_revenue",
  "min_bid_amount",
  "max_bid_amount",
]); // 빈 문자열 대신 null을 보내야 하는 Django 필드

type CompanyFormProps = {
  initialProfile?: CompanyProfileData; // 수정할 때 입력칸에 채울 기존 회사 정보
  onCancel?: () => void; // 수정을 취소하고 요약 화면으로 돌아감
  onSaved?: (profile: CompanyProfileData) => void; // 저장한 정보를 요약 화면에 전달
};

export default function CompanyForm({ initialProfile, onCancel, onSaved }: CompanyFormProps) { // 회사 정보 입력 화면 전체를 담당하는 컴포넌트
  const [message, setMessage] = useState(""); // 저장 성공 또는 오류 안내문
  const [isSubmitting, setIsSubmitting] = useState(false); // 중복 저장 방지 상태
  const [preferredRegions, setPreferredRegions] = useState(() =>
    parseRegions(initialProfile?.preferred_region ?? ""),
  ); // 저장 또는 수정할 희망 지역 목록
  const isEditing = Boolean(initialProfile); // 기존 정보가 있으면 수정 모드

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // 브라우저의 기본 새로고침 방지
    const token = localStorage.getItem("auth_token"); // 로그인할 때 저장한 인증표

    if (!token) {
      setMessage("회사 정보를 저장하려면 먼저 로그인해 주세요.");
      return;
    }

    const formData = new FormData(event.currentTarget); // 입력값 전체를 모음
    const companyData: Record<string, FormDataEntryValue | null> = {};

    for (const [name, value] of formData.entries()) {
      if (value !== "") {
        companyData[name] = value;
      } else if (isEditing) {
        companyData[name] = nullableFields.has(name) ? null : ""; // 수정할 때 지운 값도 반영
      }
    }

    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/company-profile/`, {
        method: isEditing ? "PATCH" : "POST", // 최초 저장과 기존 정보 수정을 구분
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errors = (await response.json()) as Record<string, string[]>;
        setMessage(Object.values(errors).flat().join(" "));
        return;
      }

      const data = (await response.json()) as { profile: CompanyProfileData };
      setMessage(isEditing ? "회사 정보가 수정되었습니다." : "회사 정보가 저장되었습니다.");
      onSaved?.(data.profile); // 저장 직후 요약 화면으로 변경
    } catch {
      setMessage("회사 정보 저장 서버에 연결할 수 없습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}> {/* 여러 입력 영역과 저장 버튼을 하나의 폼으로 묶음 */}
      <FormSection title="기본 정보" description="회사를 확인하기 위한 기본 정보를 입력해주세요.">
        <Input defaultValue={initialProfile?.company_name} label="회사명 *" name="company_name" placeholder="예: 비드링크" required />
        <Input defaultValue={initialProfile?.business_registration_number} label="사업자등록번호 *" name="business_registration_number" placeholder="000-00-00000" required />
        <Input defaultValue={initialProfile?.representative_name} label="대표자명 *" name="representative_name" placeholder="예: 김대표" required />
        <Input defaultValue={initialProfile?.phone} label="전화번호" name="phone" type="tel" placeholder="02-1234-5678" />
        <Input defaultValue={initialProfile?.email} label="이메일" name="email" type="email" placeholder="contact@company.com" />
        <Input defaultValue={initialProfile?.established_date ?? ""} label="설립일" name="established_date" type="date" />

        <div className="md:col-span-2"> {/* 주소 입력칸은 두 열 전체를 사용 */}
          <Input defaultValue={initialProfile?.address} label="회사 소재지 *" name="address" placeholder="예: 서울특별시 강남구 테헤란로 123" required />
        </div>
      </FormSection>

      <FormSection title="사업 정보" description="회사가 주로 수행하는 업무와 보유 역량을 입력해주세요.">
        <div className="md:col-span-2">
          <Input defaultValue={initialProfile?.industry} label="주요 업종 *" name="industry" placeholder="예: 소프트웨어 개발 및 공급" required />
        </div>

        <label className="block"> {/* 입찰 참가 제한 확인에 사용할 회사 규모 구분 */}
          <span className="text-sm font-medium text-slate-700">회사 구분</span>
          <select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" defaultValue={initialProfile?.company_type ?? ""} name="company_type">
            <option value="">선택</option>
            <option value="small-medium">중소기업</option>
            <option value="small">소기업</option>
            <option value="micro">소상공인</option>
            <option value="other">기타</option>
          </select>
        </label>

        <Input defaultValue={initialProfile?.employee_count ?? ""} label="직원 수" name="employee_count" type="number" placeholder="예: 10" />
        <Input defaultValue={initialProfile?.capital ?? ""} label="자본금" name="capital" type="number" placeholder="예: 100000000" />
        <Input defaultValue={initialProfile?.annual_revenue ?? ""} label="연 매출액" name="annual_revenue" type="number" placeholder="예: 500000000" />

        <label className="block md:col-span-2"> {/* 여러 줄을 입력하는 회사 소개 영역 */}
          <span className="text-sm font-medium text-slate-700">주요 사업 내용 *</span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            defaultValue={initialProfile?.main_business}
            name="main_business"
            placeholder="회사가 제공하는 주요 제품이나 서비스를 입력해주세요."
            required
          />
        </label>

        <label className="block md:col-span-2"> {/* 공고 내용과 비교할 회사의 기술 및 역량 */}
          <span className="text-sm font-medium text-slate-700">보유 기술 및 역량</span>
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            defaultValue={initialProfile?.capabilities}
            name="capabilities"
            placeholder="예: React, Python, 공공기관 시스템 구축"
          />
        </label>

        <label className="block md:col-span-2"> {/* 입찰 참가 자격 확인에 사용할 면허와 인증 입력 영역 */}
          <span className="text-sm font-medium text-slate-700">보유 면허 및 인증</span>
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            defaultValue={initialProfile?.licenses}
            name="licenses"
            placeholder="예: 소프트웨어사업자, 정보통신공사업 면허"
          />
        </label>

        <label className="block md:col-span-2"> {/* 유사 공고 추천에 참고할 과거 업무 경험 */}
          <span className="text-sm font-medium text-slate-700">과거 수행 실적</span>
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            defaultValue={initialProfile?.past_performance}
            name="past_performance"
            placeholder="예: 공공기관 홈페이지 구축, 업무 시스템 유지보수"
          />
        </label>
      </FormSection>

      <FormSection title="희망 입찰 조건" description="찾고 싶은 입찰공고의 기준을 입력해주세요.">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">찾는 공고 키워드 *</span>
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            defaultValue={formatCompanyKeywords(initialProfile)}
            name="preferred_keywords"
            placeholder="예: 홈페이지 구축, 시스템 유지보수, 웹 접근성"
            required
          />
          <input name="required_keywords" readOnly type="hidden" value="" />
          <span className="mt-2 block text-xs text-slate-500">쉼표로 구분해 입력하세요. 일치하는 키워드가 많을수록 추천 점수가 높아집니다.</span>
        </label>

        <label className="block md:col-span-2"> {/* 포함되면 추천하지 않을 단어 */}
          <span className="text-sm font-medium text-slate-700">제외 키워드</span>
          <textarea
            className="mt-2 min-h-20 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            defaultValue={initialProfile?.excluded_keywords}
            name="excluded_keywords"
            placeholder="예: 건축, 의료장비, 해외배송 (하나라도 포함되면 추천에서 제외)"
          />
          <span className="mt-2 block text-xs text-slate-500">제외할 내용이 없다면 비워두세요.</span>
        </label>

        <label className="block"> {/* 정해진 공고 유형 중 하나를 선택하는 영역 */}
          <span className="text-sm font-medium text-slate-700">공고 유형</span>
          <select className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" defaultValue={initialProfile?.preferred_bid_type ?? ""} name="preferred_bid_type">
            <option value="">전체</option>
            <option value="service">용역</option>
            <option value="goods">물품</option>
            <option value="construction">공사</option>
          </select>
        </label>

        <div className="md:col-span-2">
          <RegionSelector
            description="선택한 모든 지역과 지역 제한이 없는 공고를 추천합니다."
            name="preferred_region"
            onChange={setPreferredRegions}
            regions={preferredRegions}
          />
        </div>
        <Input defaultValue={initialProfile?.min_bid_amount ?? ""} label="최소 공고 금액" name="min_bid_amount" type="number" placeholder="예: 10000000" />
        <Input defaultValue={initialProfile?.max_bid_amount ?? ""} label="최대 공고 금액" name="max_bid_amount" type="number" placeholder="예: 100000000" />
      </FormSection>

      {message && (
        <p className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700" role="status">
          {message}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1"> {/* 입력 영역 아래 오른쪽에 취소와 저장 버튼 배치 */}
        {isEditing && (
          <button
            className="rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onCancel}
            type="button"
          >
            취소
          </button>
        )}

        <button
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "저장 중..." : isEditing ? "수정 저장" : "회사 정보 저장"}
        </button>
      </div>
    </form>
  );
}
