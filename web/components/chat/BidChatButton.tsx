"use client"; // 별도 AI 채팅 창을 열고 사용 여부를 표시

import { useEffect, useState } from "react";

type BidChatButtonProps = {
  bidNtceNo: string;
  bidTitle: string;
  initialHasHistory?: boolean;
};

export default function BidChatButton({
  bidNtceNo,
  bidTitle,
  initialHasHistory = false,
}: BidChatButtonProps) {
  const [hasHistory, setHasHistory] = useState(initialHasHistory);

  useEffect(() => {
    function handleChatUsed(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "bid-chat-used" && event.data.bidNtceNo === bidNtceNo) {
        setHasHistory(true); // 첫 답변이 저장되면 바로 이어하기로 변경
      }
    }

    window.addEventListener("message", handleChatUsed);
    return () => window.removeEventListener("message", handleChatUsed);
  }, [bidNtceNo]);

  function openChatWindow() {
    const query = new URLSearchParams({ bid: bidNtceNo, title: bidTitle });
    const windowName = `bid-chat-${bidNtceNo.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const left = Math.max(0, window.screenX + window.outerWidth - 580);
    const top = Math.max(0, window.screenY + 70);
    const chatWindow = window.open(
      `/bidChat?${query.toString()}`,
      windowName,
      `popup=yes,width=540,height=760,left=${left},top=${top},resizable=yes,scrollbars=yes`,
    ); // 같은 공고는 같은 이름의 창을 재사용

    if (!chatWindow) {
      window.alert("AI 채팅 창을 열 수 없습니다. 브라우저의 팝업 차단을 허용해 주세요.");
      return;
    }

    chatWindow.focus(); // 이미 열려 있다면 해당 창을 화면 앞으로 가져옴
  }

  return (
    <button
      className="inline-flex h-10 w-[76px] cursor-pointer flex-col items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-xs font-semibold leading-4 text-blue-700 transition hover:bg-blue-100"
      onClick={openChatWindow}
      type="button"
    >
      <span>AI 채팅</span>
      {hasHistory && <span className="text-[10px] font-normal">이어하기</span>}
    </button>
  );
}
