export interface BidNotice { // 입찰공고 한 건의 데이터 형태를 정의
  [key: string]: string | number | boolean | string[] | null | undefined;
  bidNtceNo: string; // 입찰공고 번호
  bidNtceOrd: string; // 같은 공고번호 안에서 구분되는 공고 차수
  bidNtceNm: string; // 입찰공고 이름
  bsnsDivNm: string; // 업무 구분
  cntrctCnclsMthdNm: string; // 계약 방법
  ntceInsttNm?: string; // 공고기관
  dminsttNm?: string; // 수요기관
  bidNtceDate: string; // 공고 날짜
  bidClseDate: string; // 입찰 마감 날짜
  bidClseTm: string; // 입찰 마감 시간
  asignBdgtAmt: string; // 배정 예산 금액
  presmptPrce: string; // 추정 가격
  deadlineStatus: "active" | "review" | "expired"; // 유효, 확인 필요 또는 저장 후 마감
  isActive: boolean; // 현재 추천 대상 여부
  regionLimit: boolean; // 참가 지역이 제한된 공고인지 여부
  allowedRegion: string; // 참가 가능한 지역, 제한이 없으면 전국
  matchReasons?: string[]; // 추천 조건과 맞은 간단한 이유
  matchScore?: number; // 회사 조건과 일치한 정도이며 낙찰 확률은 아님
  matchedKeywords?: string[]; // 공고명 등에서 일치한 회사 키워드
  matchedAt?: string; // 추천 공고로 처음 저장된 시간
  notificationSentAt?: string | null; // 향후 문자 또는 이메일을 보낸 시간
  savedAt?: string; // 사용자가 공고를 저장한 시간
  hasChat?: boolean; // 이 공고에서 저장된 AI 채팅이 있는지 여부
  hasAnalysis?: boolean; // 이 공고에서 저장된 AI 분석이 있는지 여부
  hasProposal?: boolean; // 이 공고에서 생성한 맞춤형 제안서가 있는지 여부
  hasProposalProject?: boolean; // 제안서 만들기를 눌러 프로젝트를 시작했는지 여부
  proposalProjectStartedAt?: string | null; // 프로젝트 번호를 정하는 시작 시간
}

export type ProposalStrategy = {
  bid_summary: string;
  client_needs: string[];
  core_value_proposition: string;
  win_themes: string[];
  differentiators: string[];
  company_strengths: string[];
  gaps_and_mitigations: string[];
};

export type ProposalTextChange = {
  target: string;
  content_label?: string;
  summary?: string;
  before?: string;
  after?: string;
  reason?: string;
};

export type ProposalRevisionLog = {
  source_slide_number: number | null;
  output_slide_number: number | null;
  action: "UPDATE" | "REMOVE" | "REVIEW" | "ADD";
  title: string;
  reason: string;
  changes: ProposalTextChange[];
  warnings: string[];
};

export type BidProposalData = {
  id: number;
  status: "draft" | "final" | "generating";
  output_format: "pptx";
  template_mode: "default_template";
  strategy: ProposalStrategy;
  revision_plan: {
    version?: string;
    template_id?: string;
    template_name?: string;
    summary?: string;
    source_slide_count?: number;
    output_slide_count?: number;
    reviewed_slide_count?: number;
    revision_log?: ProposalRevisionLog[];
    final_review_items?: string[];
    quality_review?: {
      passed: boolean;
      unresolved_placeholders: Array<{
        slide_number: number;
        marker: string;
      }>;
      empty_slide_numbers: number[];
      apply_warnings: Array<{
        slide_number: number | null;
        message: string;
      }>;
      review_items: string[];
    };
    feedback_history?: Array<{
      instruction: string;
      slide_number: number | null;
      summary: string;
      created_at: string;
    }>;
    document_processing?: {
      processed_files: string[];
      failed_files: Array<{ file_name: string; reason: string }>;
      chunk_count: number;
      company_knowledge_item_count?: number;
      company_knowledge_processed_files?: string[];
      company_knowledge_reused_files?: string[];
      company_knowledge_failed_files?: Array<{
        file_name: string;
        reason: string;
      }>;
    };
  };
  created_at: string;
  updated_at: string;
  preview_url: string;
  download_url: string;
};

export type ProposalTemplateOption = {
  id: string;
  name: string;
  description: string;
  available: boolean;
  target_slides: number;
  slide_count: number;
  preview_url: string;
};

export type BidProposalResponse = {
  proposal: BidProposalData | null;
  templates?: ProposalTemplateOption[];
  selected_template_id?: string;
};

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
  last_updated_at: string | null; // 나라장터 공고가 DB에 마지막으로 저장된 시간
  summary: BidSummaryData;
  items: BidNotice[];
}

export interface RecommendedBidResponse {
  keywords: string[]; // 회사 프로필에서 가져온 추천 키워드
  region: string; // 회사 프로필 또는 추천 화면에서 선택한 희망 지역
  count: number; // DB 전체에서 키워드와 일치한 공고 수
  last_updated_at: string | null; // 추천에 사용하는 공고 DB의 마지막 업데이트 시간
  items: BidNotice[]; // 화면에 먼저 표시할 추천 공고 최대 20건
}

export interface SavedBidResponse {
  count: number;
  items: BidNotice[];
}

export interface StoredRecommendationResponse {
  count: number;
  pending_notification_count: number;
  items: BidNotice[];
}

export interface BidSearchParams {
  q?: string;
  keywords?: string;
  regions?: string;
  business_type?: string;
  region?: string;
  deadline_days?: string;
  deadline_status?: string;
  deadline_sort?: "asc" | "desc";
  notice_sort?: "asc" | "desc";
  contract_method?: "제한경쟁" | "수의계약" | "일반경쟁";
  page?: string;
}
