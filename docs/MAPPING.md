# Bid2 구조와 흐름

## 폴더

```text
bid2/
|-- web/                         # Next.js 사용자 화면
|   |-- app/                     # URL별 page.tsx, layout.tsx
|   |-- components/              # 재사용 React 컴포넌트
|   `-- types/                   # API 응답 TypeScript 자료형
|-- server/                      # Django API 서버
|   |-- bids/
|   |   |-- models.py            # DB 테이블
|   |   |-- views.py             # 웹 요청 처리
|   |   |-- services/            # 수집, 문서 처리, AI 로직
|   |   `-- tests.py             # 자동 테스트
|   |-- proposal_templates/      # Bid2 기본 PPTX 템플릿
|   |-- media/                   # 업로드/생성 파일
|   `-- chroma_db/               # 공고 문서 벡터 DB
`-- docs/                        # 인계, 구조, 할 일 문서
```

## 제안서 생성

```text
회사 문서(PPTX/DOCX/HWP/HWPX 등)
  -> extract_document.py
  -> company_knowledge.py
  -> CompanyKnowledgeItem(DB, 출처 포함)
                           \
공고 첨부문서 -> Chunk/Embedding -> Chroma -> 공고 근거
                                             |
회사 프로필 ---------------------------------+
                                             v
proposal.py -> 수주 전략 -> 템플릿 작성 계획
            -> proposal_pptx_renderer.py -> PPTX
            -> 자리표시자·빈 슬라이드·텍스트 적용 자동 검수
            -> 미리보기 -> 채팅 수정 -> 최종 다운로드
```

## 주요 파일

| 파일 | 역할 |
|---|---|
| `server/bids/services/company_knowledge.py` | 회사 문서에서 재사용 가능한 사실과 실적을 자동 추출 |
| `server/bids/services/rag/prepare_docs_for_ai.py` | 공고 첨부문서를 Lazy indexing |
| `server/bids/services/rag/chatbot.py` | 현재 공고 문서에 근거한 채팅 |
| `server/bids/services/rag/analysis.py` | 공고와 회사 조건의 구조화 분석 |
| `server/bids/services/rag/proposal.py` | 수주 전략과 제안서 작성 계획 생성 |
| `server/bids/services/proposal_pptx_renderer.py` | 계획을 PPTX 템플릿에 적용 |
| `server/bids/services/proposal_rules.py` | 공통 흐름과 업종별 제안서 작성 규칙 제공 |
| `server/proposal_templates/public_standard.pptx` | 기본으로 사용하는 30장 공공입찰 실무형 템플릿 |
| `web/components/proposal/ProposalWorkspace.tsx` | 생성, 미리보기, 수정, 다운로드 화면 |
