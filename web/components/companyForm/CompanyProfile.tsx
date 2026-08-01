"use client";

import { useEffect, useState } from "react";

import LoginRequiredNotice from "@/components/auth/LoginRequiredNotice";
import CompanyDocuments from "@/components/companyForm/CompanyDocuments";
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

type InfoItemProps = {
  label: string;
  value: string;
};

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="min-w-0 border-l-2 border-slate-200 pl-3">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-slate-900">{value || "-"}</dd>
    </div>
  );
}

function formatAmount(value: number | null) {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}원`;
}

function formatStoredAmount(value: string) {
  if (!value) return "-";
  if (!/^[\d,\s원]+$/.test(value)) return value;

  const digits = value.replace(/\D/g, "");
  return digits ? `${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원` : "-";
}

function splitTags(value: string | undefined = "") {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseStructuredRows(value: string) {
  return value
    .split("\n")
    .map((line) => line.split("|").map((item) => item.trim()))
    .filter((row) => row.some(Boolean));
}

function DescriptionBlock({ title, value }: { title: string; value: string }) {
  const lines = value.split("\n").map((line) => line.trim()).filter(Boolean);

  return (
    <article className="px-6 py-5">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {lines.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          {lines.map((line, index) => (
            <li className="flex gap-2" key={`${line}-${index}`}>
              <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">등록된 내용이 없습니다.</p>
      )}
    </article>
  );
}

function TagList({ items, color }: { items: string[]; color: "blue" | "green" | "red" | "slate" }) {
  const colorClass = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-600",
  }[color];

  if (items.length === 0) return <span className="text-sm text-slate-400">등록된 조건이 없습니다.</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${colorClass}`} key={item}>
          {item}
        </span>
      ))}
    </div>
  );
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

  const certifications = parseStructuredRows(profile.licenses);
  const performances = parseStructuredRows(profile.past_performance);

  return (
    <div className="mt-6 max-w-6xl space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-200 px-6 py-6">
          <div>
            <p className="text-xs font-semibold text-blue-600">회사 정보</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{profile.company_name}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {companyTypeLabels[profile.company_type] ?? "회사 구분 미등록"}
              </span>
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {profile.industry || "사업 분야 미등록"}
              </span>
            </div>
          </div>
          <button
            className="cursor-pointer rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            회사정보 수정
          </button>
        </div>
        <dl className="grid gap-x-7 gap-y-6 bg-slate-50/50 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="대표자" value={profile.representative_name} />
          <InfoItem label="회사 구분" value={companyTypeLabels[profile.company_type] ?? "-"} />
          <InfoItem label="설립일" value={profile.established_date ?? "-"} />
          <InfoItem label="직원 수" value={profile.employee_count === null ? "-" : `${profile.employee_count}명`} />
          <InfoItem label="사업자등록번호" value={profile.business_registration_number} />
          <InfoItem label="전화번호" value={profile.phone} />
          <InfoItem label="이메일" value={profile.email} />
          <InfoItem label="회사 소재지" value={profile.address} />
        </dl>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <h2 className="text-base font-bold text-slate-950">사업 역량</h2>
          <p className="mt-1 text-sm text-slate-500">회사의 사업 분야와 입찰 수행 역량입니다.</p>
        </div>
        <dl className="grid gap-5 border-b border-slate-200 px-6 py-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold text-slate-500">사업 분야</dt>
            <dd className="mt-2">
              <TagList
                color="blue"
                items={splitTags([profile.industry, profile.related_industries].filter(Boolean).join(","))}
              />
            </dd>
          </div>
          <InfoItem label="자본금" value={formatAmount(profile.capital)} />
          <InfoItem label="연 매출액" value={formatAmount(profile.annual_revenue)} />
        </dl>
        <div className="grid divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
          <DescriptionBlock title="주요 사업 내용" value={profile.main_business} />
          <DescriptionBlock title="보유 기술 및 역량" value={profile.capabilities} />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <h2 className="text-base font-bold text-slate-950">참가 자격 및 수행 실적</h2>
          <p className="mt-1 text-sm text-slate-500">입찰 자격과 사업 경험을 확인할 수 있는 정보입니다.</p>
        </div>
        <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div className="px-6 py-5">
            <h3 className="text-sm font-bold text-slate-900">입찰 참가 자격 증빙</h3>
            <div className="mt-3 divide-y divide-slate-100">
              {certifications.length > 0 ? certifications.map(([name, issuer, year], index) => (
                <div className="flex gap-2 py-3 first:pt-0 last:pb-0" key={`${name}-${index}`}>
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{name || "증빙명 미등록"}</p>
                    <p className="mt-1 text-xs text-slate-500">{[issuer, year].filter(Boolean).join(" · ") || "-"}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-slate-400">등록된 참가 자격 증빙이 없습니다.</p>}
            </div>
          </div>

          <div className="px-6 py-5">
            <h3 className="text-sm font-bold text-slate-900">과거 수행 실적</h3>
            <div className="mt-3 divide-y divide-slate-100">
              {performances.length > 0 ? performances.map(([client, year, amount, description], index) => (
                <div className="flex gap-2 py-3 first:pt-0 last:pb-0" key={`${client}-${index}`}>
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{client || "발주처 미등록"}</p>
                      <p className="text-xs text-slate-500">{[year, formatStoredAmount(amount)].filter(Boolean).join(" · ")}</p>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{description || "사업내용 미등록"}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-slate-400">등록된 수행 실적이 없습니다.</p>}
            </div>
          </div>
        </div>
      </section>

      <CompanyDocuments />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <h2 className="text-base font-bold text-slate-950">희망 입찰 조건</h2>
          <p className="mt-1 text-sm text-slate-500">공고 검색과 추천에 사용하는 조건입니다.</p>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-xs font-semibold text-slate-500">희망 키워드</h3>
            <TagList color="blue" items={splitTags(formatCompanyKeywords(profile))} />
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold text-slate-500">희망 지역</h3>
            <TagList color="green" items={splitTags(profile.preferred_region)} />
          </div>
          <div className="md:col-span-2">
            <h3 className="mb-3 text-xs font-semibold text-red-600">제외 키워드</h3>
            <TagList color="red" items={splitTags(profile.excluded_keywords)} />
          </div>
        </div>
        <dl className="border-t border-slate-200 bg-slate-50/40 px-6 py-5">
          <InfoItem label="공고 유형" value={bidTypeLabels[profile.preferred_bid_type] ?? "전체"} />
        </dl>
      </section>

    </div>
  );
}
