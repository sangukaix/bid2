"use client"; // 별도 창에서 채팅 기록 조회와 질문 전송을 처리

import { FormEvent, useEffect, useRef, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type ChatSource = {
  number: number;
  file_name: string;
  location: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
};

export default function BidChatWindow({
  bidNtceNo,
  bidTitle,
}: {
  bidNtceNo: string;
  bidTitle: string;
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [error, setError] = useState("");
  const messageAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `AI 채팅 · ${bidTitle}`;

    async function loadHistory() {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("로그인 후 AI 채팅을 사용할 수 있습니다.");
        setIsHistoryLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/bids/${bidNtceNo}/chat/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const data = (await response.json().catch(() => ({}))) as {
          messages?: ChatMessage[];
          error?: string;
        };
        if (!response.ok) throw new Error(data.error || "대화 기록을 불러오지 못했습니다.");
        setMessages(data.messages ?? []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "대화 기록을 불러오지 못했습니다.");
      } finally {
        setIsHistoryLoading(false);
      }
    }

    loadHistory();
  }, [bidNtceNo, bidTitle]);

  useEffect(() => {
    const area = messageAreaRef.current;
    if (area) area.scrollTop = area.scrollHeight; // 새 답변이 오면 가장 아래 대화로 이동
  }, [messages, isAnswerLoading]);

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    const token = localStorage.getItem("auth_token");
    if (!trimmedQuestion || !token || isAnswerLoading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: trimmedQuestion,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError("");
    setIsAnswerLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/bids/${bidNtceNo}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        answer?: string;
        sources?: ChatSource[];
        error?: string;
      };
      if (!response.ok || !data.answer) throw new Error(data.error || "AI 답변을 불러오지 못했습니다.");

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: data.answer as string,
          sources: data.sources ?? [],
        },
      ]);
      window.opener?.postMessage(
        { type: "bid-chat-used", bidNtceNo },
        window.location.origin,
      ); // 원래 화면의 버튼을 이어하기 상태로 변경
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI 채팅 중 오류가 발생했습니다.");
    } finally {
      setIsAnswerLoading(false);
    }
  }

  return (
    <main className="flex h-screen min-h-[520px] flex-col bg-white">
      <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
        <div className="min-w-0 pr-4">
          <h1 className="text-base font-bold text-slate-950">공고 AI 채팅</h1>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{bidTitle}</p>
        </div>
        <button
          aria-label="채팅 창 닫기"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-xl text-slate-500 hover:bg-slate-100"
          onClick={() => window.close()}
          type="button"
        >
          ×
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-5 py-5" ref={messageAreaRef}>
        {isHistoryLoading && <p className="py-20 text-center text-sm text-slate-500">이전 대화를 불러오는 중입니다.</p>}
        {!isHistoryLoading && messages.length === 0 && (
          <p className="py-20 text-center text-sm text-slate-500">이 공고에 대해 궁금한 내용을 질문해 주세요.</p>
        )}

        {messages.map((message) => (
          <div className={message.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[92%]"} key={message.id}>
            <div className={message.role === "user" ? "whitespace-pre-wrap rounded-lg bg-blue-600 px-4 py-3 text-sm leading-6 text-white" : "whitespace-pre-wrap rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800"}>
              {message.text}
            </div>
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 space-y-1 px-1">
                {message.sources.map((source) => (
                  <p className="text-xs leading-5 text-slate-500" key={`${message.id}-${source.number}`}>
                    출처 {source.number}. {source.file_name} · {source.location}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}

        {isAnswerLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
            <p>공고 문서를 확인하고 답변을 생성하고 있습니다.</p>
          </div>
        )}
      </div>

      {error && <p className="border-t border-red-100 bg-red-50 px-5 py-2 text-sm text-red-600">{error}</p>}

      <form className="flex gap-2 border-t border-slate-200 bg-white p-4" onSubmit={submitQuestion}>
        <textarea
          className="min-h-11 max-h-28 min-w-0 flex-1 resize-y rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500"
          maxLength={500}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key !== "Enter"
              || event.shiftKey
              || event.ctrlKey
              || event.nativeEvent.isComposing
            ) return;

            event.preventDefault();
            event.currentTarget.form?.requestSubmit(); // Enter는 전송, Shift/Ctrl+Enter는 줄바꿈
          }}
          placeholder="공고에 대해 질문해 주세요."
          rows={1}
          value={question}
        />
        <button
          className="h-11 cursor-pointer rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!question.trim() || isAnswerLoading}
          type="submit"
        >
          전송
        </button>
      </form>
    </main>
  );
}
