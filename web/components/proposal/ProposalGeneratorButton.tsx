"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  BidProposalData,
  BidProposalResponse,
  ProposalSourceDocument,
} from "@/types/bid";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type ProposalGeneratorButtonProps = {
  bidNtceNo: string;
  bidTitle: string;
  initialHasProposal?: boolean;
};

const templateModeLabels = {
  original_theme: "기존 파일의 스타일과 테마를 재사용했습니다.",
  content_reference: "기존 제안서의 내용과 문체를 참고해 새 문서로 작성했습니다.",
};

export default function ProposalGeneratorButton({
  bidNtceNo,
  bidTitle,
  initialHasProposal = false,
}: ProposalGeneratorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasProposal, setHasProposal] = useState(initialHasProposal);
  const [proposal, setProposal] = useState<BidProposalData | null>(null);
  const [sourceDocuments, setSourceDocuments] = useState<ProposalSourceDocument[]>([]);
  const [sourceDocumentId, setSourceDocumentId] = useState("");
  const [outputFormat, setOutputFormat] = useState<"docx" | "pptx">("docx");
  const [error, setError] = useState("");

  async function openGenerator() {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setIsOpen(true);
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/bids/${bidNtceNo}/proposal/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = (await response.json()) as BidProposalResponse & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "제안서 정보를 불러오지 못했습니다.");
        return;
      }

      setProposal(data.proposal);
      setHasProposal(Boolean(data.proposal));
      const sources = data.source_documents ?? [];
      setSourceDocuments(sources);
      if (!sourceDocumentId && sources[0]) {
        setSourceDocumentId(String(sources[0].id));
        if (/\.(hwp|hwpx)$/i.test(sources[0].original_name)) setOutputFormat("docx");
      }
    } catch {
      setError("제안서 생성 서버에 연결할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function generateProposal() {
    const token = localStorage.getItem("auth_token");
    if (!token || !sourceDocumentId) {
      setError("참고할 기존 제안서를 선택해 주세요.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/bids/${bidNtceNo}/proposal/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_document_id: Number(sourceDocumentId),
          output_format: outputFormat,
        }),
      });
      const data = (await response.json()) as BidProposalResponse & { error?: string };
      if (!response.ok || !data.proposal) {
        setError(data.error ?? "제안서를 생성하지 못했습니다.");
        return;
      }

      setProposal(data.proposal);
      setHasProposal(true);
    } catch {
      setError("제안서 생성 중 서버 연결이 끊어졌습니다.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function downloadProposal() {
    if (!proposal) return;
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setError("");
    const response = await fetch(`${API_BASE_URL}${proposal.download_url}`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!response.ok) {
      setError("제안서 파일을 내려받지 못했습니다.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `proposal-${bidNtceNo}.${proposal.output_format}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const selectedSourceDocument = sourceDocuments.find(
    (document) => String(document.id) === sourceDocumentId,
  );
  const isHwpSource = /\.(hwp|hwpx)$/i.test(selectedSourceDocument?.original_name ?? "");

  return (
    <>
      <button
        className="inline-flex h-10 w-[88px] cursor-pointer flex-col items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-xs font-semibold leading-4 text-blue-700 transition hover:border-blue-400 hover:bg-blue-100"
        onClick={openGenerator}
        type="button"
      >
        <span>제안서 제작</span>
        {hasProposal && <span className="text-[10px] font-normal text-blue-500">다시보기</span>}
      </button>

      {isOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
        >
          <section className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-600">맞춤형 제안서</p>
                <h2 className="mt-1 break-keep text-lg font-bold text-slate-950">{bidTitle}</h2>
              </div>
              <button
                aria-label="제안서 창 닫기"
                className="h-9 w-9 shrink-0 cursor-pointer rounded-md text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </header>

            <div className="overflow-y-auto px-6 py-5">
              {isLoading && (
                <p className="py-16 text-center text-sm text-slate-500">제안서 정보를 불러오는 중입니다.</p>
              )}

              {!isLoading && !proposal && sourceDocuments.length === 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-5 py-5 text-sm leading-6 text-amber-900">
                  <p className="font-semibold">등록된 기존 제안서가 없습니다.</p>
                  <p className="mt-1">회사정보에서 제안서 유형 파일을 1개 이상 등록해야 사용할 수 있습니다.</p>
                  <Link
                    className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                    href="/dashBoard/myCompanyInfo"
                  >
                    회사정보로 이동
                  </Link>
                </div>
              )}

              {!isLoading && !proposal && sourceDocuments.length > 0 && (
                <div className="space-y-5">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800">참고할 기존 제안서</span>
                    <select
                      className="mt-2 h-11 w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) => {
                        const nextDocumentId = event.target.value;
                        const nextDocument = sourceDocuments.find(
                          (document) => String(document.id) === nextDocumentId,
                        );
                        setSourceDocumentId(nextDocumentId);
                        if (/\.(hwp|hwpx)$/i.test(nextDocument?.original_name ?? "")) {
                          setOutputFormat("docx");
                        }
                      }}
                      value={sourceDocumentId}
                    >
                      {sourceDocuments.map((document) => (
                        <option key={document.id} value={document.id}>
                          {document.original_name}
                          {document.target_company ? ` · ${document.target_company}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <fieldset>
                    <legend className="text-sm font-semibold text-slate-800">출력 형식</legend>
                    <div className="mt-2 grid max-w-md grid-cols-2 gap-2">
                      {(["docx", "pptx"] as const).map((format) => (
                        <label
                          className={`rounded-md border px-4 py-3 text-center text-sm font-semibold ${
                            format === "pptx" && isHwpSource
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                              :
                            outputFormat === format
                                ? "cursor-pointer border-blue-500 bg-blue-50 text-blue-700"
                                : "cursor-pointer border-slate-300 text-slate-600 hover:border-slate-400"
                          }`}
                          key={format}
                        >
                          <input
                            checked={outputFormat === format}
                            className="sr-only"
                            disabled={format === "pptx" && isHwpSource}
                            name="proposal-format"
                            onChange={() => setOutputFormat(format)}
                            type="radio"
                          />
                          {format === "docx" ? "Word (.docx)" : "PowerPoint (.pptx)"}
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {isHwpSource
                        ? "HWP/HWPX 원본은 내용 분석 후 Word(.docx) 결과로 제공합니다."
                        : "원본과 같은 형식을 선택하면 기존 Word 스타일 또는 PowerPoint 테마를 더 잘 유지합니다."}
                    </p>
                  </fieldset>

                  <div className="rounded-md border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-950">
                    <h3 className="font-semibold">제안서를 제작하시겠습니까?</h3>
                    <p className="mt-1 text-amber-800">제안서 제작 가능 횟수가 1회 차감됩니다.</p>

                    <dl className="mt-4 grid max-w-sm grid-cols-2 gap-x-6 gap-y-2 border-y border-amber-200 py-3">
                      <div>
                        <dt className="text-xs text-amber-700">현재 보유 횟수</dt>
                        <dd className="mt-1 font-semibold">3회</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-amber-700">차감 후 횟수</dt>
                        <dd className="mt-1 font-semibold">2회</dd>
                      </div>
                    </dl>

                    <button
                      className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:bg-slate-400"
                      disabled={isGenerating}
                      onClick={generateProposal}
                      type="button"
                    >
                      {isGenerating ? "제안서 제작 중..." : "제안서 제작"}
                    </button>
                  </div>
                </div>
              )}

              {!isLoading && proposal && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">제안서 생성 완료</p>
                      <p className="mt-1 text-xs text-emerald-700">
                        {templateModeLabels[proposal.template_mode]}
                      </p>
                    </div>
                    <button
                      className="cursor-pointer rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      onClick={downloadProposal}
                      type="button"
                    >
                      {proposal.output_format === "docx" ? "Word 내려받기" : "PPT 내려받기"}
                    </button>
                  </div>

                  {proposal.draft.document_processing && (
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                      <span>처리 문서 {proposal.draft.document_processing.processed_files.length}개</span>
                      <span>공고 Chunk {proposal.draft.document_processing.chunk_count.toLocaleString("ko-KR")}개</span>
                      <span>회사소개서 {proposal.draft.document_processing.company_intro_files?.length ?? 0}개</span>
                      {proposal.draft.document_processing.failed_files.length > 0 && (
                        <span className="text-amber-700">
                          처리 실패 {proposal.draft.document_processing.failed_files.length}개
                        </span>
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-slate-950">{proposal.draft.proposal_title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{proposal.draft.subtitle}</p>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
                      {proposal.draft.executive_summary}
                    </p>
                  </div>

                  <div className="border-y border-slate-200 py-5">
                    <h3 className="text-sm font-bold text-slate-950">핵심 수주 전략</h3>
                    <ul className="mt-3 grid gap-2 md:grid-cols-2">
                      {proposal.strategy.win_themes.map((theme) => (
                        <li className="rounded-md bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-900" key={theme}>
                          {theme}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-950">목차별 초안</h3>
                    <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                      {proposal.draft.sections.map((section) => (
                        <details className="group py-4" key={section.title}>
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-slate-900 hover:text-blue-600">
                            <span>{section.title}</span>
                            <span className="text-xs text-slate-400 group-open:rotate-180">▾</span>
                          </summary>
                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{section.content}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
