# BID2 기능·파일 매핑 문서

작성일: 2026-07-25  
현재 작업 위치: 학원 컴퓨터  
다음 작업 위치: 집 컴퓨터  
작성 시점 커밋: `3ea9c1e`

> 이 문서는 프로젝트 기능이 어떤 파일과 데이터 흐름으로 연결되는지 찾기 위한 지도이다.
> 현재 제안서 RAG 개선은 구현 중이며 아직 전체 테스트가 끝나지 않았다.

## 1. 전체 구조

```text
사용자
  |
  v
Next.js + React 화면 (web)
  |
  | HTTP 요청 + 로그인 Token
  v
Django REST API (server)
  |
  |-- SQLite: 회원, 회사정보, 공고, 저장공고, 분석결과
  |-- media/: 업로드 문서, 생성된 제안서
  |-- chroma_db/: 공고와 회사 제안서의 Chunk/Embedding
  `-- OpenAI API: Embedding, 채팅, 분석, 제안서 작성
```

## 2. 제안서 기능 매핑

```text
회사정보에서 기존 제안서 업로드
  web/components/companyForm/CompanyDocuments.tsx
        |
        v
  Django 회사문서 API
  server/bids/views.py
        |
        v
  CompanyDocument 모델 + media/company_documents/
  server/bids/models.py

저장공고에서 제안서 제작 클릭
  web/components/proposal/ProposalGeneratorButton.tsx
        |
        | POST /api/bids/<공고번호>/proposal/
        v
  bid_proposal()
  server/bids/views.py
        |
        v
  generate_bid_proposal()
  server/bids/services/rag/proposal.py
```

## 3. 제안서 생성 내부 흐름

```text
[새 공고 첨부문서]
prepare_docs_for_ai.py
  -> 모든 처리 가능한 첨부문서 추출
  -> 500자 Chunk, 100자 overlap
  -> OpenAI Embedding
  -> chroma_db/<공고번호>/

[기존 회사 제안서]
company_document_rag.py
  -> 제안서 전체 텍스트 추출
  -> 500자 Chunk, 100자 overlap
  -> OpenAI Embedding
  -> chroma_db/company_documents/user_<회원>/document_<문서>/
  -> 이미 처리한 문서는 기존 DB 재사용

[맞춤형 제안서 생성]
공고 RAG 검색 + 회사 제안서 RAG 검색 + 회사정보
  -> 1단계: 전체 수주 전략과 목차 설계
  -> 2단계: 목차별 관련 Chunk 재검색
  -> 3단계: 목차별 페이지 초안 생성
  -> 4단계: DOCX 또는 PPTX로 합치기
  -> BidProposal DB와 media/generated_proposals/에 저장
```

## 4. 분량 설정

`server/bids/services/rag/proposal.py`

| 모드 | 최대 결과 분량 | 본문 페이지 예산 |
|---|---:|---:|
| `short` 간단형 | 15쪽 | 11쪽 |
| `standard` 표준형 | 30쪽 | 26쪽 |
| `detailed` 상세형 | 50쪽 | 46쪽 |

나머지 약 4쪽은 표지, 제안 요약, 수주 전략, 최종 확인 사항에 사용한다.
공고문에 별도의 페이지 제한이 있으면 향후 그 제한을 가장 먼저 적용해야 한다.

## 5. 주요 파일 역할

| 파일 | 역할 | 상태 |
|---|---|---|
| `server/bids/services/rag/company_document_rag.py` | 회사 제안서 Lazy indexing, Chroma 저장·검색 | 구현, 테스트 필요 |
| `server/bids/services/rag/proposal.py` | 전략 설계, 페이지 배분, 목차별 RAG 생성 | 구현 중 |
| `server/bids/services/proposal_document.py` | 생성 결과를 DOCX/PPTX로 합침 | 페이지 제한 반영, 보완 필요 |
| `server/bids/views.py` | 제안서 생성 API 요청 검증과 서비스 호출 | 분량 값 연결 필요 |
| `server/bids/models.py` | 업로드 문서와 생성 제안서 DB 모델 | 완료 |
| `web/components/proposal/ProposalGeneratorButton.tsx` | 제안서 선택·생성·다운로드 UI | 분량 선택 UI 필요 |
| `web/types/bid.ts` | 제안서 API TypeScript 자료형 | 새 필드 추가 필요 |
| `server/bids/tests.py` | 제안서 API와 RAG 자동 테스트 | 새 구조 테스트 필요 |

## 6. 현재 완료된 부분

- 회사 제안서 전용 Chroma 경로와 컬렉션 구조 추가
- 회사 제안서 최초 1회 Embedding 후 재사용하는 Lazy indexing 추가
- 간단형 15쪽, 표준형 30쪽, 상세형 50쪽 설정 추가
- 목차 중요도에 따라 페이지를 배분하는 함수 추가
- 전략 생성 후 목차별로 공고와 기존 제안서를 다시 검색하는 구조 추가
- DOCX/PPTX 생성기가 설정된 본문 페이지 예산까지만 사용하도록 변경

## 7. 중단된 지점과 다음 작업

파일 수정 승인 서비스의 일시적인 `503 Service Unavailable` 오류로 아래 작업 전에 중단되었다.
코드 자체에서 발생한 오류가 아니라 Codex 파일 수정 승인 처리의 일시적 장애였다.

다음 작업 순서:

1. `proposal_document.py`의 Word 페이지 구분에서 빈 페이지가 생기지 않도록 정리
2. `views.py`에서 `length_mode`를 검증하고 `generate_bid_proposal()`에 전달
3. `ProposalGeneratorButton.tsx`에 간단형·표준형·상세형 선택 UI 추가
4. `web/types/bid.ts`에 `length_mode`, `page_limit`, 제안서 Chunk 수 필드 추가
5. 회사 제안서 RAG 재사용, 페이지 배분, API 전달 테스트 추가
6. Django `check`와 제안서 테스트 실행
7. Next.js `npm run build` 실행
8. 실제 작은 제안서로 먼저 시험한 뒤 큰 문서는 호출 비용을 확인하며 시험

## 8. 집 컴퓨터에서 시작하는 방법

```powershell
cd <집 컴퓨터의 bid2 경로>
git pull
git log -3 --oneline --decorate
git status
```

Codex에 다음과 같이 요청한다.

> `docs/HANDOFF.md`, `docs/MAPPING.md`, `docs/TODO.md`를 읽고 현재 코드를 확인해줘.
> `docs/TODO.md`의 최우선 작업부터 제안서 RAG와 최대 50쪽 생성 기능을 완성해줘.
> 먼저 현재 코드가 문법적으로 정상인지 확인하고, 실제 OpenAI 호출은 비용이 발생하므로 자동 테스트에서는 Mock을 사용해줘.

환경 준비:

```powershell
cd server
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py check
```

```powershell
cd ..\web
npm install
npm run build
```

주의:

- `.env`, SQLite DB, `venv`, `node_modules`, `media`, `chroma_db`는 Git으로 옮겨지지 않을 수 있다.
- 집 컴퓨터에서는 `server/.env`의 `OPENAI_API_KEY`, `G2B_API_KEY`를 별도로 준비한다.
- 큰 문서 실험 전에 작은 문서와 Mock 테스트로 흐름을 먼저 검증한다.

## 9. HANDOFF.md와의 차이

| 문서 | 목적 |
|---|---|
| `HANDOFF.md` | 오늘 무엇을 했고 다음 컴퓨터에서 무엇부터 해야 하는지 알려주는 작업 인수인계 |
| `MAPPING.md` | 기능이 어느 폴더·파일·DB·API로 연결되는지 보여주는 프로젝트 지도 |

쉽게 말하면:

```text
HANDOFF.md = 작업 일지 + 다음 할 일
MAPPING.md = 기능과 파일의 연결 지도
```

`HANDOFF.md`는 작업할 때마다 최신 상태로 갱신하고,
`MAPPING.md`는 구조나 데이터 흐름이 달라질 때 갱신한다.
