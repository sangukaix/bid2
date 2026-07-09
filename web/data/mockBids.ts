import type { Bid } from "@/types/bid";

export const mockBids: Bid[] = [
  {
    id: "1",
    title: "공공기관 홈페이지 유지보수 용역",
    agency: "서울시 디지털정책관",
    region: "서울",
    budget: "45,000,000원",
    deadline: "2026-07-31",
    keywords: ["홈페이지", "유지보수", "소프트웨어"],
    matchReason: "희망 키워드와 주요 업종이 공고 내용과 잘 맞습니다.",
    caution: "유사 사업 실적 제출 조건이 있는지 확인해야 합니다.",
  },
  {
    id: "2",
    title: "업무 시스템 기능개선 사업",
    agency: "한국정보화진흥원",
    region: "대전",
    budget: "80,000,000원",
    deadline: "2026-08-05",
    keywords: ["시스템", "기능개선", "개발"],
    matchReason: "소프트웨어 개발 역량이 필요한 공고라 회사 조건과 연결됩니다.",
    caution: "예산 규모와 투입 인력 조건을 먼저 확인하는 것이 좋습니다.",
  },
];
