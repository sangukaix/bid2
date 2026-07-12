export interface BidNotice { // 입찰공고 한 건의 데이터 형태를 정의
  [key: string]: string | boolean | null | undefined;
  bidNtceNo: string; // 입찰공고 번호
  bidNtceOrd: string; // 같은 공고번호 안에서 구분되는 공고 차수
  bidNtceNm: string; // 입찰공고 이름
  bsnsDivNm: string; // 업무 구분
  cntrctCnclsMthdNm: string; // 계약 방법
  bidNtceDate: string; // 공고 날짜
  bidClseDate: string; // 입찰 마감 날짜
  bidClseTm: string; // 입찰 마감 시간
  asignBdgtAmt: string; // 배정 예산 금액
  presmptPrce: string; // 추정 가격
  deadlineStatus: "active" | "review"; // 유효 또는 마감일 확인 필요
  isActive: boolean; // 현재 추천 대상 여부
}

export interface BidSummaryData {
  total: number;
  goods: number;
  services: number;
  construction: number;
}

export interface BidApiResponse {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  summary: BidSummaryData;
  items: BidNotice[];
}

export interface BidSearchParams {
  q?: string;
  business_type?: string;
  region?: string;
  deadline_days?: string;
  deadline_status?: string;
  page?: string;
}
