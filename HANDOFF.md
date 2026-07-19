# BID2 프로젝트 작업 인수인계

작성일: 2026-07-19

다음 작업 장소: 학원 컴퓨터

프로젝트 저장소: BID2
집 컴퓨터 경로: `D:\mbca_home\projects\bid2`

작성 직전 기준 커밋:

- `b3781fe` (`20260719home`)
- 작성 시점에 `main`, `origin/main`이 동일함
- 오늘 주요 코드와 기존 과제 문서 2개는 위 커밋으로 원격에 반영됨
- 이 `HANDOFF.md`와 `docs/BID2_과제_요구사항_점검표.md`는 작성 후 함께 커밋해야 함
- 다음 컴퓨터에서는 이 문서에 적힌 해시보다 `git log -1`에 표시되는 최신 커밋을 우선 기준으로 삼을 것

> 보안 주의: 실제 API Key, `.env` 값, 비밀번호는 이 문서·채팅·Git에 기록하지 않는다.

## 1. 다음 작업을 시작할 때 가장 먼저 할 일

학원 컴퓨터의 기존 BID2 저장소에서 다음 순서로 확인한다. 경로가 다르면 학원 컴퓨터의 실제 저장소 경로를 사용한다.

```powershell
cd <학원 컴퓨터의 BID2 저장소 경로>
git status
git pull
git log -3 --oneline --decorate
```

Codex에는 다음과 같이 요청한다.

> 저장소 최상위의 HANDOFF.md를 처음부터 끝까지 읽고, git status와 최근 커밋을 확인해줘. 실제 프로젝트 구조와 코드가 HANDOFF 내용과 일치하는지 확인하고, 마이그레이션·Django check·백엔드 테스트·프론트 빌드를 검증해줘. 오류가 있으면 원인을 먼저 설명하고 수정해줘. API Key나 .env 실제 값은 노출하지 말고, test1 계정은 변경하지 마.

처음 확인할 문서:

1. `HANDOFF.md`
2. `docs/BID2_과제_요구사항_점검표.md`
3. `docs/BID2_과제_설계_문서.md`
4. `docs/BID2_프로젝트_폴더_구조.md`

## 2. 프로젝트 구성과 역할

```text
bid2
|-- server/  Django 5.2 + Django REST Framework 백엔드
|-- web/     Next.js 16 + React 19 + TypeScript 프론트엔드
|-- docs/    과제 설계, 실제 폴더 구조, 요구사항 점검 문서
`-- HANDOFF.md
```

주요 데이터 흐름:

```text
나라장터 API
`-- Django 공고 수집
    `-- BidNotice DB
        |-- 검색·필터 API -> Next.js 공고 목록
        |-- 회사 조건 매칭 -> 회원별 추천 공고
        |-- 저장 공고 -> AI 채팅·AI 분석
        `-- 첨부 문서 -> 추출·Chunk·Embedding·Chroma -> RAG 답변·분석·PDF
```

역할 구분:

- Next.js·React: 사용자가 보는 화면, 폼 입력, 로그인 토큰, 필터와 목록 상태 처리
- Django·DRF: 인증, DB, 나라장터 수집, 추천 규칙, 저장 공고, AI API 처리
- SQLite: 회원, 회사정보, 공고, 추천, 저장 공고, 채팅, 분석 결과 저장
- LangChain: Prompt, Retriever, OpenAI 모델, Output Parser 연결
- Chroma: 공고 첨부문서 Chunk의 벡터 인덱스 저장과 검색
- OpenAI: Embedding과 RAG 답변·분석 결과 생성

상세한 실제 파일 트리는 `docs/BID2_프로젝트_폴더_구조.md`를 참고한다.

## 3. 기존 핵심 기능

### 인증과 회사 프로필

- 회원가입, 로그인, 로그아웃
- DRF Token 인증
- 회사정보 입력, 조회, 수정
- 희망 지역, 공고 유형, 금액, 키워드를 회사 추천 조건으로 사용

### 입찰공고

- 나라장터 API 수집 및 최근 공고 동기화
- DB 기반 목록과 상세 API
- 검색, 키워드, 지역, 업무 구분, 마감일 정렬
- 상세 모달과 나라장터 원문 링크

### 저장 공고와 추천

- 회원별 공고 저장과 취소
- 회사 조건 기반 규칙 추천
- 추천 근거와 점수 저장
- 저장 공고에서 AI 채팅과 AI 분석 실행

### RAG와 AI

- 나라장터 첨부파일 조회와 다운로드
- PDF, HWP/HWPX, Word, Excel, PowerPoint, TXT, CSV, XML, ZIP 등 처리
- 500자 Chunk, 100자 overlap
- `text-embedding-3-small`
- 공고별 Chroma 인덱스
- 최대 30개 후보 검색, 관련도 0.2 이상 선택, 부족하면 상위 5개 보완
- 검색 Chunk의 원문 페이지·문단 복원
- `gpt-4o-mini`, `temperature=0`
- 챗봇 최대 출력 800 completion tokens
- AI 분석 최대 출력 3,500 completion tokens
- 챗봇 답변과 출처 제공
- 회사정보와 공고문을 대조한 구조화 AI 분석
- 분석 결과 저장과 PDF 다운로드

## 4. 2026-07-19 완료한 작업

### 4.1 로그인 필요 화면 통일

- 회사정보, 추천공고, 저장공고·AI분석을 비로그인 상태로 열었을 때 같은 디자인을 사용하도록 통일
- 공통 컴포넌트: `web/components/auth/LoginRequiredNotice.tsx`
- 인증 토큰이 없거나 API가 401/403을 반환하면 동일한 안내와 로그인 버튼 표시

### 4.2 회사정보 문구와 입력 UI

회사 프로필 안내 문구를 다음으로 변경했다.

> 회사정보를 입력해주세요. 상세히 입력할 수록 입찰 분석률이 높아지니 최대한 상세히 작성해 주세요.

- 필수 키워드와 관심 키워드를 화면에서는 `찾는 공고 키워드` 하나로 통합
- 기존 DB의 두 필드 값은 화면과 추천 로직에서 합쳐 사용해 이전 데이터와 호환
- 수정 후에는 새 입력값을 `preferred_keywords`에 저장하고 `required_keywords`는 빈 값으로 정리
- 추천·검색·AI 분석도 통합된 키워드 목록을 사용
- 희망 지역을 선택하지 않으면 `전체 지역`으로 표시
- 지역 선택 목록 최상단에 `전체 지역` 추가
- 회사정보 요약 화면에서도 지역 미입력 시 `전체 지역` 표시
- 추천 화면 하단의 “규칙 기반이며 낙찰확률이 아님…” 안내 문구 삭제

관련 파일:

- `web/components/companyForm/CompanyForm.tsx`
- `web/components/companyForm/CompanyProfile.tsx`
- `web/components/ui/RegionSelector.tsx`
- `web/lib/companyKeywords.ts`
- `server/bids/services/recommendation.py`
- `server/bids/services/rag/analysis.py`
- `server/bids/views.py`

### 4.3 추천 점수 기준 변경

현재 추천 점수:

| 조건 | 점수 |
|---|---:|
| 공고명 키워드 첫 1개 일치 | 40점 |
| 공고명 추가 키워드 | 개당 10점, 공고명 최대 60점 |
| 업종·발주기관·수요기관 키워드 첫 1개 일치 | 10점 |
| 업종·기관 추가 키워드 | 개당 5점, 해당 영역 최대 15점 |
| 선택한 업무 구분 일치 | 10점 |
| 희망 지역 일치 또는 전국 참가 가능 | 10점 |
| 희망 금액 범위 포함 | 5점 |

중요 규칙:

- 찾는 공고 키워드가 하나도 일치하지 않으면 추천하지 않음
- 제외 키워드가 포함되면 추천하지 않음
- 선택한 업무 구분, 희망 지역, 희망 금액 범위를 벗어나면 추천하지 않음
- 최소 추천 점수는 30점
- 최대 10건 저장
- 동점 정렬은 점수, 공고명 일치 개수, 최신 등록일, 마감일 순서
- 공고명 일치 개수를 저장하기 위해 `RecommendedBid.title_match_count`와 migration `0009` 추가

### 4.4 공고 목록 UI 개선

- 공고명은 가능한 한 단어 중간에서 끊지 않고 단어 단위로 다음 줄에 배치
- `원문` 버튼을 제목 텍스트 흐름에 붙여 표시
- 제목과 원문 버튼이 다음 줄로 내려가도 불필요한 들여쓰기 공간이 생기지 않도록 수정
- 일반 공고, 추천 공고, 저장 공고에 같은 방식 적용
- 일반 공고 목록의 구분 열을 줄이고 공고명 영역을 넓힘
- 참가 지역은 최대 두 줄의 짧은 미리보기로 표시
- 지역이 길거나 여러 개인 경우 마우스를 올리거나 포커스하면 전체 지역 툴팁 표시

관련 파일:

- `web/components/bids/BidTable.tsx`
- `web/components/bids/BidDetailModal.tsx`
- `web/components/recommendations/RecommendedBidBoard.tsx`
- `web/components/savedBids/SavedBidBoard.tsx`

### 4.5 공고 동기화 상태 유지

- 공고 새로고침 요청과 상태를 `web/lib/bidSync.ts`의 모듈 상태로 분리
- 입찰공고 목록에서 업데이트를 시작하고 Next.js 내부의 다른 페이지로 이동해도 요청과 로딩 상태가 계속 유지됨
- 다시 공고 목록으로 돌아오면 진행 상태를 구독하고, 완료되면 화면을 새로 갱신
- 같은 브라우저 탭의 SPA 페이지 이동을 대상으로 함
- 브라우저 전체 새로고침, 탭 종료, 개발 서버 재시작까지 영구 유지하는 구조는 아님

### 4.6 OpenAI 객체 생성 시점 개선

- Django가 AI 기능을 사용하지 않는 테스트를 실행할 때 OpenAI Key가 없어도 import 단계에서 실패하지 않도록 변경
- `ChatOpenAI` 객체를 모듈 import 시점이 아니라 실제 채팅·분석 실행 시점에 생성
- 관련 파일: `server/bids/services/rag/chatbot.py`, `server/bids/services/rag/analysis.py`

### 4.7 과제 문서

다음 문서를 작성했다.

- `docs/BID2_과제_설계_문서.md`
  - React, Next.js, Django 역할
  - 전체 데이터 흐름
  - OpenAI 설정
  - Persona, Prompt, Prompt 설계 의도
  - LangChain Chain, Retriever, Output Parser
  - RAG 세부 구조와 개선 과정
- `docs/BID2_프로젝트_폴더_구조.md`
  - 실제 CLI 트리 형태의 전체 프로젝트 구조
  - 각 폴더와 주요 파일의 역할
- `docs/BID2_과제_요구사항_점검표.md`
  - 과제 PDF 요구사항과 현재 구현 대조
  - 완료, 부분 완료, 미완료 구분
  - 제출 전 필수 보완 항목과 체크리스트

## 5. 2026-07-19 마지막 검증 결과

오늘 변경 후 확인한 결과:

- Django migration 확인 및 적용: 통과
- Django `manage.py check`: 통과
- 백엔드 테스트: **68개 전체 통과**
- 프론트엔드 `npm run build`: 통과
- 기존 65개에서 추천 점수·키워드 통합 관련 테스트가 추가되어 현재 68개

다음 컴퓨터에서도 환경 차이를 확인하기 위해 아래 명령을 다시 실행한다.

```powershell
cd <저장소 경로>\server
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test -v 2

cd ..\web
npm install
npm run build
```

## 6. 실행 방법

### 백엔드

```powershell
cd <저장소 경로>\server
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py runserver
```

`server/.env`에는 로컬에서 필요한 환경변수를 설정한다. 실제 값은 Git에 올리지 않는다.

```dotenv
G2B_API_KEY=<로컬에서 설정>
OPENAI_API_KEY=<로컬에서 설정>
```

### 프론트엔드

```powershell
cd <저장소 경로>\web
npm install
npm run dev
```

`web/.env.local` 예시:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

접속 주소:

- 웹: `http://localhost:3000`
- Django API: `http://127.0.0.1:8000`
- Django 관리자: `http://127.0.0.1:8000/admin/`

## 7. 계정과 데이터 주의사항

- 학원 DB에 있는 `test1` 계정은 사용자가 만든 기존 테스트 계정이다.
- **`test1`의 비밀번호, 권한, 프로필, 토큰, 저장 공고 등 어떤 데이터도 임의로 변경하거나 삭제하지 않는다.**
- 집 컴퓨터에서는 별도 계정을 만들어 사용하기로 했다.
- SQLite DB와 회원 데이터는 컴퓨터마다 다를 수 있다.
- Git pull로 다른 컴퓨터의 로컬 DB나 계정이 자동 복사되지 않는다.
- 로그인 문제를 진단할 때 계정을 바로 변경하지 말고, 먼저 사용 중인 DB, 서버 경로, API 주소, 토큰 상태를 확인한다.

## 8. 과제 제출 기준 검토 결과

핵심 구현 상태:

- 실제 문제 해결 AI 서비스: 완료
- Persona, Role, Prompt 규칙: 완료
- LangChain 기능 2개 이상: 완료
- RAG 전체 과정: 완료
- OpenAI, Embedding, Chroma, React + Backend: 완료
- 파라미터 설정: 완료

제출 전에 필요한 항목:

1. 파라미터 비교 실험 2종 이상과 결과표
2. 실제 LangChain `system`과 `human` 메시지 역할 분리
3. 엄격한 채점에 대비한 LLM Function Calling Tool 1개
4. 실행 화면 5종
   - 메인 화면
   - 질의응답
   - Tool 실행
   - RAG 검색 결과
   - 최종 응답
5. 루트 README와 `.env.example` 변수명 정리
6. 메인 화면 문구와 실제 기능 일치

주의할 현재 불일치:

- 메인 화면에 `제안서 자동 생성`, `제안서 초안 작성`, `낙찰성공률 분석`이 현재 기능처럼 적혀 있음
- 실제 제안서 제작 버튼은 비활성화 상태
- 현재 AI 점수는 낙찰확률이 아니라 회사정보와 공고 조건의 적합도
- 제출 전 문구를 현재 구현에 맞추거나 기능을 구현해야 함

자세한 판단 근거는 `docs/BID2_과제_요구사항_점검표.md`를 참고한다.

## 9. 다음 우선순위

한 번에 전부 진행하지 말고 다음 순서대로 한 항목씩 작업한다.

1. 학원 컴퓨터에서 pull 후 migration, Django check, 백엔드 68개 테스트, 프론트 build 재검증
2. 브라우저에서 로그인, 회사정보, 공고 검색, 추천, 저장, AI 채팅, AI 분석 흐름 확인
3. Prompt를 실제 `system`과 `human` 메시지로 분리하고 테스트
4. 간단한 Function Calling Tool 1개 설계·구현
5. Temperature와 max token 비교 실험 및 결과표 작성
6. 제출용 실행 화면 5종 캡처
7. 루트 README와 환경변수 예시 정리
8. 메인 화면의 미구현 기능 문구 정리
9. 전체 검증 후 문서와 HANDOFF 갱신, 커밋, push

## 10. 알려진 주의사항

- OpenAI 기능은 API Key와 네트워크가 필요하며 호출 비용이 발생할 수 있다.
- 나라장터 API 결과와 수집 건수는 실행 시점마다 달라질 수 있다.
- 첨부 문서 형식에 따라 텍스트 추출 결과가 달라질 수 있으므로 실제 공고로 확인한다.
- `.env`, API Key, `venv`, `node_modules`, SQLite DB, 다운로드 첨부문서, Chroma DB, 실행 로그는 Git에 포함하지 않는다.
- 3000번 또는 8000번 포트가 이미 사용 중이면 기존 BID2 서버 프로세스인지 먼저 확인한 뒤 처리한다.
- 공고 동기화 상태 유지는 같은 브라우저 탭의 Next.js 페이지 이동에 대한 기능이다. 전체 새로고침까지 보존되는 영구 작업 큐는 아니다.
- 예약 작업은 컴퓨터마다 따로 등록해야 하며 Git pull만으로 자동 등록되지 않는다.

## 11. 다음 작업 종료 시 기록할 내용

작업을 마칠 때 이 문서에 반드시 기록한다.

- 완료한 기능
- 변경한 파일
- migration과 Django check 결과
- 실행한 백엔드 테스트 개수와 결과
- 프론트 build 결과
- 브라우저에서 직접 확인한 기능
- 아직 남은 문제
- 다음 작업의 첫 단계
- 마지막 커밋 해시와 push 여부

커밋 전 확인 예시:

```powershell
git status
git diff --check
git diff --stat
```

사용자가 직접 커밋할 예정이므로 Codex는 별도 요청 없이 임의로 commit 또는 push하지 않는다.
