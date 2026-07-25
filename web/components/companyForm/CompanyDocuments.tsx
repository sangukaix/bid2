"use client";

import { useEffect, useRef, useState } from "react";

import type { CompanyDocumentData } from "@/types/company";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const MAX_DOCUMENTS = 10;
const ACCEPTED_DOCUMENTS = ".doc,.docx,.ppt,.pptx,.hwp,.hwpx";
const documentTypeLabels = {
  proposal: "입찰 제안서",
  company_introduction: "기본 제안서·회사소개서",
};

function getErrorMessage(data: Record<string, unknown>) {
  if (typeof data.error === "string") return data.error;

  const messages = Object.values(data).flat().filter((value) => typeof value === "string");
  return messages.join(" ") || "문서를 업로드하지 못했습니다.";
}

export default function CompanyDocuments() {
  const basicFileInputRef = useRef<HTMLInputElement>(null);
  const bidFileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<CompanyDocumentData[]>([]);
  const [basicFile, setBasicFile] = useState<File | null>(null);
  const [bidFile, setBidFile] = useState<File | null>(null);
  const [targetCompany, setTargetCompany] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<CompanyDocumentData["document_type"] | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/company-documents/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) throw new Error();

        const data = (await response.json()) as {
          items: CompanyDocumentData[];
        };
        setDocuments(data.items);
      } catch {
        setMessage("등록한 회사 문서를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDocuments();
  }, []);

  async function uploadDocument(documentType: CompanyDocumentData["document_type"]) {
    const token = localStorage.getItem("auth_token");
    const selectedFile = documentType === "proposal" ? bidFile : basicFile;

    if (!token || !selectedFile) {
      setMessage("업로드할 파일을 선택해 주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("document_type", documentType);
    formData.append(
      "target_company",
      documentType === "proposal" ? targetCompany.trim() : "",
    );

    setMessage("");
    setUploadingType(documentType);

    try {
      const response = await fetch(`${API_BASE_URL}/api/company-documents/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
        body: formData,
      });
      const data = (await response.json()) as CompanyDocumentData & Record<string, unknown>;

      if (!response.ok) {
        setMessage(getErrorMessage(data));
        return;
      }

      setDocuments((current) => [data, ...current]);
      if (documentType === "proposal") {
        setBidFile(null);
        setTargetCompany("");
        if (bidFileInputRef.current) bidFileInputRef.current.value = "";
      } else {
        setBasicFile(null);
        if (basicFileInputRef.current) basicFileInputRef.current.value = "";
      }
      setMessage("회사 문서가 등록되었습니다.");
    } catch {
      setMessage("문서 업로드 서버에 연결할 수 없습니다.");
    } finally {
      setUploadingType(null);
    }
  }

  async function deleteDocument(documentId: number) {
    if (!window.confirm("등록한 문서를 삭제하시겠습니까?")) return;

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/api/company-documents/${documentId}/`, {
      method: "DELETE",
      headers: { Authorization: `Token ${token}` },
    });

    if (response.ok) {
      setDocuments((current) => current.filter((document) => document.id !== documentId));
      setMessage("회사 문서가 삭제되었습니다.");
    } else {
      setMessage("회사 문서를 삭제하지 못했습니다.");
    }
  }

  const reachedLimit = documents.length >= MAX_DOCUMENTS;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-5">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-1 h-8 w-1 rounded-full bg-blue-600" />
          <div>
            <h2 className="text-base font-bold text-slate-950">회사 제안서 및 소개서</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">기존 입찰에 사용한 제안서와 회사소개서를 등록해 주세요.</p>
          </div>
        </div>
        <span className="whitespace-nowrap text-sm font-semibold text-slate-500">{documents.length} / {MAX_DOCUMENTS}</span>
      </div>

      <div className="p-6">
        <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          제안서는 1개 이상 등록해야 제안서 자동생성이 가능합니다.
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="text-sm font-semibold text-slate-800">기본 제안서</h3>
            <p className="mt-1 text-xs text-slate-500">회사의 기본 제안서나 회사소개서에서 공통 정보와 강점을 참고합니다.</p>
            <div className="mt-3 grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <input
                accept={ACCEPTED_DOCUMENTS}
                className="block h-10 w-full cursor-pointer rounded-md border border-slate-300 bg-white text-xs text-slate-600 file:mr-3 file:h-full file:cursor-pointer file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-3 file:text-xs file:font-normal file:text-slate-700 hover:file:bg-slate-100"
                disabled={reachedLimit}
                onChange={(event) => setBasicFile(event.target.files?.[0] ?? null)}
                ref={basicFileInputRef}
                type="file"
              />
              <button
                className="h-10 cursor-pointer rounded-md bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={uploadingType !== null || reachedLimit}
                onClick={() => uploadDocument("company_introduction")}
                type="button"
              >
                {uploadingType === "company_introduction" ? "업로드 중" : "등록"}
              </button>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="text-sm font-semibold text-slate-800">입찰 제안서</h3>
            <p className="mt-1 text-xs text-slate-500">이전에 제출한 제안서의 구성, 문체와 수행 전략을 참고합니다.</p>
            <div className="mt-3 grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(180px,0.7fr)_auto]">
              <input
                accept={ACCEPTED_DOCUMENTS}
                className="block h-10 w-full cursor-pointer rounded-md border border-slate-300 bg-white text-xs text-slate-600 file:mr-3 file:h-full file:cursor-pointer file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-3 file:text-xs file:font-normal file:text-slate-700 hover:file:bg-slate-100"
                disabled={reachedLimit}
                onChange={(event) => setBidFile(event.target.files?.[0] ?? null)}
                ref={bidFileInputRef}
                type="file"
              />
              <input
                aria-label="제안 업체명"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                maxLength={200}
                onChange={(event) => setTargetCompany(event.target.value)}
                placeholder="제안 업체명"
                type="text"
                value={targetCompany}
              />
              <button
                className="h-10 cursor-pointer rounded-md bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={uploadingType !== null || reachedLimit}
                onClick={() => uploadDocument("proposal")}
                type="button"
              >
                {uploadingType === "proposal" ? "업로드 중" : "등록"}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Word, PowerPoint, HWP, HWPX · 파일당 최대 20MB
          <span className="ml-2">HWP/HWPX 파일은 내용 분석 후 Word(.docx) 결과로 제공됩니다.</span>
        </p>

        <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
          <div className="hidden grid-cols-[minmax(0,1fr)_160px_minmax(160px,1fr)_60px] bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 md:grid">
            <span>파일명</span>
            <span>유형</span>
            <span>제안 업체</span>
            <span className="text-right">관리</span>
          </div>

          {isLoading && <p className="px-4 py-8 text-center text-sm text-slate-500">등록 문서를 불러오는 중입니다.</p>}
          {!isLoading && documents.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">아직 등록한 문서가 없습니다.</p>}

          <div className="divide-y divide-slate-200">
            {documents.map((document) => (
              <div className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[minmax(0,1fr)_160px_minmax(160px,1fr)_60px] md:items-center" key={document.id}>
                <span className="min-w-0 truncate font-semibold text-slate-800">{document.original_name}</span>
                <span className="text-slate-600">{documentTypeLabels[document.document_type]}</span>
                <span className="text-slate-600">{document.target_company || "-"}</span>
                <button className="w-fit cursor-pointer text-sm font-semibold text-red-600 hover:text-red-700 md:ml-auto" onClick={() => deleteDocument(document.id)} type="button">삭제</button>
              </div>
            ))}
          </div>
        </div>

        {message && <p className="mt-4 text-sm text-slate-600" role="status">{message}</p>}
      </div>
    </section>
  );
}
