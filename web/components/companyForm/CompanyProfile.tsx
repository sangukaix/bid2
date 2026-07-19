"use client";

import { useEffect, useState } from "react";

import LoginRequiredNotice from "@/components/auth/LoginRequiredNotice";
import CompanyForm from "@/components/companyForm/CompanyForm";
import { formatCompanyKeywords } from "@/lib/companyKeywords";
import type { CompanyProfileData } from "@/types/company";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const companyTypeLabels: Record<string, string> = {
  "small-medium": "중소기업",
  small: "소기업",
  micro: "소상공인",
  other: "기타",
};

const bidTypeLabels: Record<string, string> = {
  service: "용역",
  goods: "물품",
  construction: "공사",
};

type SummaryItemProps = {
  label: string;
  value: string;
  full?: boolean;
};

function SummaryItem({ label, value, full = false }: SummaryItemProps) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-900">{value || "-"}</dd>
    </div>
  );
}

function formatAmount(value: number | null) {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}원`;
}

export default function CompanyProfile() {
  const [profile, setProfile] = useState<CompanyProfileData | null>(); // undefined는 조회 중 상태
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false); // 요약 화면과 수정 폼 전환 상태
  const [needsLogin, setNeedsLogin] = useState(false); // 로그인 안 됨과 회사 정보 미등록을 구분

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("auth_token"); // 로그인한 사용자 확인

      if (!token) {
        setNeedsLogin(true);
        setProfile(null);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/company-profile/`, {
          headers: { Authorization: `Token ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          setNeedsLogin(true);
          setProfile(null);
          return;
        }

        if (!response.ok) {
          setError("회사 정보를 불러오지 못했습니다.");
          setProfile(null);
          return;
        }

        const data = (await response.json()) as { profile: CompanyProfileData | null };
        setProfile(data.profile); // 저장 정보가 없으면 null, 있으면 회사 정보
      } catch {
        setError("회사 정보 서버에 연결할 수 없습니다.");
        setProfile(null);
      }
    }

    loadProfile();
  }, []);

  if (profile === undefined) {
    return <p className="mt-6 text-sm text-slate-500">회사 정보를 불러오는 중입니다.</p>;
  }

  if (needsLogin) {
    return <LoginRequiredNotice />;
  }

  if (profile === null) {
    return (
      <>
        {error && <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <CompanyForm onSaved={setProfile} />
      </>
    );
  }

  if (isEditing) {
    return (
      <CompanyForm
        initialProfile={profile}
        onCancel={() => setIsEditing(false)}
        onSaved={(updatedProfile) => {
          setProfile(updatedProfile); // 수정된 회사 정보로 요약 갱신
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-950">기본 정보</h2>
          <button
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            수정
          </button>
        </div>
        <dl className="mt-5 grid gap-5 md:grid-cols-2">
          <SummaryItem label="회사명" value={profile.company_name} />
          <SummaryItem label="사업자등록번호" value={profile.business_registration_number} />
          <SummaryItem label="대표자명" value={profile.representative_name} />
          <SummaryItem label="설립일" value={profile.established_date ?? "-"} />
          <SummaryItem label="전화번호" value={profile.phone} />
          <SummaryItem label="이메일" value={profile.email} />
          <SummaryItem full label="회사 소재지" value={profile.address} />
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-bold text-slate-950">사업 정보</h2>
        <dl className="mt-5 grid gap-5 md:grid-cols-2">
          <SummaryItem label="주요 업종" value={profile.industry} />
          <SummaryItem label="회사 구분" value={companyTypeLabels[profile.company_type] ?? "-"} />
          <SummaryItem label="직원 수" value={profile.employee_count === null ? "-" : `${profile.employee_count}명`} />
          <SummaryItem label="자본금" value={formatAmount(profile.capital)} />
          <SummaryItem label="연 매출액" value={formatAmount(profile.annual_revenue)} />
          <SummaryItem full label="주요 사업 내용" value={profile.main_business} />
          <SummaryItem full label="보유 기술 및 역량" value={profile.capabilities} />
          <SummaryItem full label="보유 면허 및 인증" value={profile.licenses} />
          <SummaryItem full label="과거 수행 실적" value={profile.past_performance} />
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-bold text-slate-950">희망 입찰 조건</h2>
        <dl className="mt-5 grid gap-5 md:grid-cols-2">
          <SummaryItem full label="찾는 공고 키워드" value={formatCompanyKeywords(profile)} />
          <SummaryItem full label="제외 키워드" value={profile.excluded_keywords} />
          <SummaryItem label="공고 유형" value={bidTypeLabels[profile.preferred_bid_type] ?? "전체"} />
          <SummaryItem label="희망 지역" value={profile.preferred_region} />
          <SummaryItem label="최소 공고 금액" value={formatAmount(profile.min_bid_amount)} />
          <SummaryItem label="최대 공고 금액" value={formatAmount(profile.max_bid_amount)} />
        </dl>
      </section>
    </div>
  );
}
