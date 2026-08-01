"use client"; // 템플릿 선택과 실제 슬라이드 미리보기 팝업 관리

import { useEffect, useState } from "react";

import type { ProposalTemplateOption } from "@/types/bid";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type TemplateGalleryProps = {
  templates: ProposalTemplateOption[];
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
};

async function fetchSlideImage(template: ProposalTemplateOption, page: number) {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("로그인 후 템플릿을 확인할 수 있습니다.");
  const response = await fetch(
    `${API_BASE_URL}${template.preview_url}${page}/`,
    { headers: { Authorization: `Token ${token}` } },
  );
  if (!response.ok) throw new Error("템플릿 미리보기를 만들지 못했습니다.");
  return URL.createObjectURL(await response.blob());
}

export default function TemplateGallery({
  templates,
  selectedTemplateId,
  onSelect,
}: TemplateGalleryProps) {
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const [activeTemplate, setActiveTemplate] = useState<ProposalTemplateOption | null>(null);
  const [slideUrls, setSlideUrls] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"scroll" | "grid">("scroll");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const createdUrls: string[] = [];

    async function loadCovers() {
      for (const template of templates.filter((item) => item.available)) {
        try {
          const url = await fetchSlideImage(template, 1);
          createdUrls.push(url);
          if (!cancelled) {
            setCoverUrls((current) => ({ ...current, [template.id]: url }));
          }
        } catch {
          // 이미지가 없어도 템플릿 선택 기능은 유지
        }
      }
    }

    void loadCovers();
    return () => {
      cancelled = true;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [templates]);

  useEffect(() => {
    if (!activeTemplate) return;
    const template = activeTemplate;
    let cancelled = false;
    const createdUrls: string[] = [];

    async function loadSlides() {
      setIsPreviewLoading(true);
      setPreviewError("");
      try {
        const urls = await Promise.all(
          Array.from(
            { length: template.slide_count },
            (_, index) => fetchSlideImage(template, index + 1),
          ),
        );
        createdUrls.push(...urls);
        if (!cancelled) setSlideUrls(urls);
      } catch (error) {
        if (!cancelled) {
          setPreviewError(
            error instanceof Error ? error.message : "템플릿을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setIsPreviewLoading(false);
      }
    }

    void loadSlides();
    return () => {
      cancelled = true;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [activeTemplate]);

  useEffect(() => {
    if (!activeTemplate) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeTemplate]);

  return (
    <section className="py-5">
      <p className="text-xs font-semibold text-slate-500">디자인 템플릿</p>
      <div className="mt-2 grid gap-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            className={`grid min-h-24 grid-cols-[minmax(0,1fr)_92px] overflow-hidden rounded-md border transition-colors ${
              selectedTemplateId === template.id
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white hover:border-blue-300"
            }`}
            key={template.id}
          >
            <button
              aria-pressed={selectedTemplateId === template.id}
              className="min-w-0 cursor-pointer p-3 text-left text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
              disabled={!template.available}
              onClick={() => onSelect(template.id)}
              type="button"
            >
              <span className="block text-sm font-semibold">{template.name}</span>
              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
                {template.description}
              </span>
            </button>
            <button
              aria-label={`${template.name} 템플릿 크게 보기`}
              className="group relative flex cursor-pointer items-center justify-center overflow-hidden border-l border-slate-200 bg-slate-100 disabled:cursor-not-allowed"
              disabled={!template.available}
              onClick={() => {
                onSelect(template.id);
                setSlideUrls([]);
                setActiveTemplate(template);
              }}
              type="button"
            >
              {coverUrls[template.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`${template.name} 첫 페이지`}
                  className="h-full w-full object-cover object-left transition-transform group-hover:scale-105"
                  src={coverUrls[template.id]}
                />
              ) : (
                <span className="text-xs text-slate-400">미리보기</span>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-slate-950/65 py-1 text-center text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                크게 보기
              </span>
            </button>
          </div>
        ))}
      </div>

      {activeTemplate && (
        <div className="fixed inset-0 z-[110] bg-slate-950/55 p-3 backdrop-blur-[1px] sm:p-6">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-lg bg-slate-100 shadow-2xl">
            <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
              <div>
                <h3 className="text-sm font-bold text-slate-950">{activeTemplate.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500">템플릿 전체 미리보기</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-slate-200 p-0.5">
                  <button
                    className={`cursor-pointer rounded px-3 py-1.5 text-xs ${viewMode === "scroll" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                    onClick={() => setViewMode("scroll")}
                    type="button"
                  >
                    크게 보기
                  </button>
                  <button
                    className={`cursor-pointer rounded px-3 py-1.5 text-xs ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                    onClick={() => setViewMode("grid")}
                    type="button"
                  >
                    전체 보기
                  </button>
                </div>
                <button
                  aria-label="템플릿 미리보기 닫기"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-xl text-slate-500 hover:bg-slate-100"
                  onClick={() => setActiveTemplate(null)}
                  type="button"
                >
                  ×
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {isPreviewLoading && (
                <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-slate-500">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                  템플릿을 준비하는 중입니다.
                </div>
              )}
              {previewError && <p className="py-20 text-center text-sm text-red-600">{previewError}</p>}
              {!isPreviewLoading && !previewError && (
                <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "mx-auto max-w-4xl space-y-5"}>
                  {slideUrls.map((url, index) => (
                    <figure className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" key={url}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt={`${index + 1}페이지`} className="w-full" loading="lazy" src={url} />
                      <figcaption className="border-t border-slate-100 px-3 py-1.5 text-xs text-slate-500">
                        {index + 1}페이지
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
