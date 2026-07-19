# BID2 프로젝트 전체 폴더 구조와 역할

작성 기준: 현재 `D:\mbca_home\projects\bid2` 실제 구조  
표기 방식: CLI `tree` 스타일 (`|--`, `` `-- ``)

> `venv`, `node_modules`, `.next`, `.git`처럼 자동 생성되는 폴더는 내부 파일이 매우 많으므로 펼치지 않았다. `.env`, SQLite DB, 다운로드 첨부파일, Chroma DB도 민감정보 또는 실행 데이터이므로 이름과 역할만 설명한다.

---

## 1. 전체 구조

```text
bid2/
|-- .git/                                  # Git이 커밋과 브랜치 이력을 관리하는 내부 폴더
|-- HANDOFF.md                             # 다른 장소·컴퓨터에서 작업을 이어가기 위한 인수인계 문서
|-- docs/                                  # 과제 제출 및 프로젝트 설명 문서
|   |-- BID2_과제_설계_문서.md             # 전체 구조, Prompt, LangChain, RAG 설계 문서
|   `-- BID2_프로젝트_폴더_구조.md         # 현재 보고 있는 폴더·파일 역할 문서
|
|-- server/                                # Django·DRF 백엔드와 AI/RAG가 실행되는 Python 프로젝트
|   |-- .env                               # 실제 API Key 등 비밀 환경변수, Git 제외
|   |-- .env.example                       # 환경변수 이름을 알려주는 빈 예시 파일
|   |-- .gitignore                         # 백엔드에서 Git에 올리지 않을 파일 지정
|   |-- db.sqlite3                         # 회원·공고·추천·채팅·분석이 저장되는 로컬 DB, Git 제외
|   |-- manage.py                          # Django 관리 명령 실행 진입점
|   |-- requirements.txt                   # Python 패키지와 버전 목록
|   |
|   |-- config/                            # Django 프로젝트 전체 설정
|   |   |-- __init__.py                    # config를 Python package로 인식
|   |   |-- settings.py                    # DB, 앱, 인증, CORS, 시간대, media 등 전역 설정
|   |   |-- urls.py                        # 최상위 URL: /admin과 /api를 연결
|   |   |-- asgi.py                        # ASGI 서버 배포 진입점
|   |   `-- wsgi.py                        # WSGI 서버 배포 진입점
|   |
|   |-- bids/                              # BID2의 실제 업무 기능을 담은 Django app
|   |   |-- __init__.py                    # bids를 Python package로 인식
|   |   |-- apps.py                        # bids app 등록 설정
|   |   |-- admin.py                       # Django 관리자 화면에 모델 등록
|   |   |-- models.py                      # DB 테이블 구조와 모델 관계 정의
|   |   |-- serializers.py                 # 로그인·회원가입·회사정보 입력 검증 및 JSON 변환
|   |   |-- urls.py                        # bids API 주소와 views 함수 연결
|   |   |-- views.py                       # HTTP 요청 처리, 인증, DB 조회, 서비스 호출, JSON 응답
|   |   |-- tests.py                       # 백엔드 전체 기능 자동 테스트
|   |   |
|   |   |-- migrations/                    # models.py의 DB 구조 변경 이력
|   |   |   |-- __init__.py
|   |   |   |-- 0001_initial.py            # 최초 BidNotice 테이블 생성
|   |   |   |-- 0002_bidnotice_deadline_status.py
|   |   |   |-- 0003_companyprofile.py
|   |   |   |-- 0004_savedbid.py
|   |   |   |-- 0005_bidanalysis_recommendedbid.py
|   |   |   |-- 0006_recommendedbid_is_match.py
|   |   |   |-- 0007_companyprofile_excluded_keywords_and_more.py
|   |   |   |-- 0008_bidchatmessage.py
|   |   |   `-- 0009_recommendedbid_title_match_count.py
|   |   |
|   |   |-- management/                    # python manage.py로 실행하는 사용자 정의 명령
|   |   |   |-- __init__.py
|   |   |   `-- commands/
|   |   |       |-- __init__.py
|   |   |       |-- sync_bids.py           # 나라장터 최근 공고 수집·정리·저장
|   |   |       `-- match_recommendations.py # 회원별 추천 점수 계산·저장
|   |   |
|   |   `-- services/                      # views에서 분리한 재사용 업무 로직
|   |       |-- __init__.py
|   |       |-- g2b_api.py                 # 나라장터 공고 API 호출
|   |       |-- get_bid_attachments.py     # 공고 첨부파일 목록 API 호출
|   |       |-- download_bid_attachment.py # 첨부파일 안전 다운로드
|   |       |-- recommendation.py          # 회사 조건과 공고의 규칙 기반 추천 계산
|   |       |-- analysis_pdf.py            # 저장된 AI 분석 JSON을 PDF로 변환
|   |       `-- rag/                       # LangChain·OpenAI·Chroma 기반 RAG 핵심
|   |           |-- __init__.py
|   |           |-- extract_document.py    # 여러 문서 형식의 텍스트와 metadata 추출
|   |           |-- split_documents.py     # 문서를 500자/100자 overlap Chunk로 분할
|   |           |-- vector_store.py        # OpenAI Embedding과 공고별 Chroma 생성·재사용
|   |           |-- retriever.py           # 질문 관련 Chunk 검색: 최대30, 0.2, 최소5
|   |           |-- prepare_docs_for_ai.py # 다운로드→추출→분할→인덱싱 전체 준비
|   |           |-- chatbot.py             # 챗봇 Prompt·Chain·출처 context·답변 생성
|   |           `-- analysis.py            # 회사정보 대조 AI 분석과 구조화 출력
|   |
|   |-- scripts/                           # Windows 작업 스케줄러 등록 스크립트
|   |   |-- register_bid_sync_task.ps1     # 08~18시 매시간 공고 수집 예약
|   |   `-- register_recommendation_task.ps1 # 매일 18:10 추천 계산 예약
|   |
|   |-- venv/                              # Python 가상환경, 설치 시 생성, Git 제외
|   |-- media/                             # 나라장터 첨부파일 저장, 실행 시 생성 가능, Git 제외
|   `-- chroma_db/                         # 공고별 벡터 DB, AI 최초 사용 시 생성, Git 제외
|
`-- web/                                   # Next.js·React·TypeScript 프론트엔드
    |-- .env.example                       # Django 서버 주소 환경변수 예시
    |-- .gitignore                         # node_modules, .next, 환경파일 등을 Git에서 제외
    |-- AGENTS.md                          # 이 폴더 작업 시 지켜야 할 Next.js 개발 지침
    |-- CLAUDE.md                          # AGENTS.md 지침을 다른 도구에도 연결
    |-- README.md                          # create-next-app 기본 실행 안내
    |-- package.json                       # npm 명령과 프론트 패키지 정의
    |-- package-lock.json                  # 실제 설치 패키지 버전을 고정
    |-- next.config.ts                     # Next.js 전체 설정
    |-- tsconfig.json                      # TypeScript 검사와 @/* 경로 별칭 설정
    |-- eslint.config.mjs                  # Next.js·TypeScript 코드 품질 검사
    |-- postcss.config.mjs                 # Tailwind CSS PostCSS plugin 설정
    |-- next-env.d.ts                      # Next.js가 자동 생성하는 TypeScript 선언, Git 제외
    |
    |-- app/                               # App Router: 폴더 경로가 브라우저 URL이 됨
    |   |-- favicon.ico                    # 브라우저 탭 아이콘
    |   |-- globals.css                    # 전체 페이지 공통 CSS와 Tailwind 불러오기
    |   |-- layout.tsx                     # 모든 페이지의 최상위 HTML/body 레이아웃
    |   |-- page.tsx                       # / 접속 시 /mainPage로 이동
    |   |
    |   |-- mainPage/
    |   |   `-- page.tsx                   # /mainPage 서비스 소개 화면
    |   |-- login/
    |   |   `-- page.tsx                   # /login 로그인 화면
    |   |-- signup/
    |   |   `-- page.tsx                   # /signup 회원가입 화면
    |   |-- bidChat/
    |   |   `-- page.tsx                   # /bidChat 별도 팝업 채팅 화면
    |   `-- dashBoard/
    |       |-- layout.tsx                 # 대시보드 공통 Sidebar와 본문 레이아웃
    |       |-- page.tsx                   # /dashBoard를 /dashBoard/myInfo로 이동
    |       |-- myInfo/
    |       |   `-- page.tsx               # 로그인 상태와 요금제 안내
    |       |-- myCompanyInfo/
    |       |   `-- page.tsx               # 회사 프로필 화면
    |       |-- bidList/
    |       |   `-- page.tsx               # 공고 목록 URL 검색조건 해석
    |       |-- recommendedBid/
    |       |   `-- page.tsx               # 추천공고 화면
    |       `-- matchBid/
    |           `-- page.tsx               # 저장공고 목록 또는 선택 공고 AI 분석
    |
    |-- components/                        # 여러 페이지에서 조립·재사용하는 React UI
    |   |-- home/
    |   |   `-- StepCard.tsx               # 메인 페이지 서비스 단계 카드
    |   |-- layout/
    |   |   |-- Header.tsx                 # 메인·로그인 화면 상단 메뉴
    |   |   `-- Sidebar.tsx                # 대시보드 왼쪽 공통 메뉴
    |   |-- auth/
    |   |   |-- LoginForm.tsx              # 로그인 API 호출과 Token 저장
    |   |   |-- SignupForm.tsx             # 회원가입 입력과 API 호출
    |   |   |-- LogoutButton.tsx           # 로그아웃 API 호출과 Token 삭제
    |   |   `-- LoginRequiredNotice.tsx    # 비로그인 기능의 통일된 안내 UI
    |   |-- companyForm/
    |   |   |-- CompanyProfile.tsx         # 회사정보 조회·로그인 확인·요약/수정 전환
    |   |   |-- CompanyForm.tsx            # 회사정보 생성·수정 폼과 API 호출
    |   |   `-- FormSection.tsx            # 회사정보 폼 항목을 주제별 카드로 묶음
    |   |-- bids/
    |   |   |-- BidList.tsx                # Django 공고 API 호출 후 요약·필터·표 조립
    |   |   |-- BidSummary.tsx             # 전체·물품·용역·공사 개수 요약
    |   |   |-- BidFilters.tsx             # 검색·키워드·지역·정렬·새로고침 UI
    |   |   |-- BidTable.tsx               # 공고 목록, 페이지 이동, 저장·채팅 버튼
    |   |   |-- BidDetailModal.tsx         # 공고 제목 클릭 시 상세 모달
    |   |   `-- SaveBidButton.tsx          # 로그인 사용자의 공고 저장 API 호출
    |   |-- recommendations/
    |   |   `-- RecommendedBidBoard.tsx    # 저장형 추천 API와 조건 일치도 표
    |   |-- savedBids/
    |   |   `-- SavedBidBoard.tsx          # 저장공고 조회·취소·AI 기능 진입
    |   |-- chat/
    |   |   |-- BidChatButton.tsx          # 공고별 팝업 채팅창 열기·이어하기 표시
    |   |   `-- BidChatWindow.tsx          # 채팅 기록 조회·질문 전송·답변/출처 출력
    |   |-- analysis/
    |   |   `-- BidAnalysisReport.tsx      # 분석 실행·결과 표시·PDF 다운로드
    |   `-- ui/
    |       |-- Button.tsx                 # 단순 공통 버튼 모양
    |       |-- Card.tsx                   # 단순 공통 카드 모양
    |       |-- Input.tsx                  # label이 포함된 공통 입력창
    |       `-- RegionSelector.tsx         # 여러 지역 선택·삭제·hidden 값 생성
    |
    |-- lib/                               # 화면이 공유하는 데이터 처리·상태 로직
    |   |-- bidSync.ts                     # 페이지 이동 중에도 유지되는 공고 동기화 Promise
    |   `-- companyKeywords.ts             # 기존 두 키워드 필드 병합·중복 제거
    |
    |-- types/                             # Django JSON과 React props의 TypeScript 자료형
    |   |-- bid.ts                         # 공고·검색·추천·저장 API 타입
    |   `-- company.ts                     # 회사 프로필 API 타입
    |
    |-- node_modules/                      # npm 설치 패키지, npm install로 생성, Git 제외
    |-- .next/                             # Next.js 개발·빌드 결과, Git 제외
    `-- .npm-cache/                        # 프로젝트 npm cache, Git 제외
```

---

## 2. 최상위 폴더를 왜 나누었는가?

```text
bid2/
|-- server/   백엔드
|-- web/      프론트엔드
`-- docs/     설명·제출 문서
```

### `server/`

데이터와 비밀정보를 다루는 영역이다. 브라우저가 직접 DB나 OpenAI를 호출하지 않도록 Django가 중간에서 요청을 검사한다.

이 폴더가 필요한 이유:

- 회원 비밀번호와 인증 Token 관리
- 나라장터 API Key와 OpenAI API Key 보호
- 공고와 회사정보를 SQLite에 저장
- 회사 맞춤 추천 규칙 계산
- 첨부파일 다운로드와 문서 변환
- LangChain, Chroma, OpenAI 실행
- 분석 JSON 저장과 PDF 생성

### `web/`

사용자가 보는 화면을 담당한다. Django가 보내는 JSON을 표, 폼, 버튼, 모달, 채팅, 보고서로 표현한다.

이 폴더가 필요한 이유:

- URL별 페이지 구성
- 사용자의 클릭과 입력 처리
- 로딩·성공·오류 상태 표시
- PC와 작은 화면에 맞는 UI 배치
- Django API 요청과 결과 출력

### `docs/`

실행 코드와 설명 문서를 분리한다. 과제 제출 자료, 구조 설명, 인수인계 내용을 코드 파일 사이에 섞지 않고 찾기 쉽게 보관한다.

---

## 3. Django 백엔드 구조를 이해하는 순서

```text
브라우저 요청
→ config/urls.py
→ bids/urls.py
→ bids/views.py
→ serializers.py 또는 services/
→ models.py
→ SQLite / 나라장터 / OpenAI
→ JSON 응답
```

### 3.1 `config/`: 프로젝트 전체 설정

#### `settings.py`

Django 전체가 어떤 환경에서 실행되는지를 정한다.

- `.env` 로드
- SQLite 연결
- `bids`, DRF, Token, CORS app 등록
- 인증 방식 지정
- Next.js Origin 허용
- 한국 시간대 지정
- 첨부파일을 저장할 `MEDIA_ROOT` 지정

`settings.py`는 개별 공고 기능을 처리하지 않는다. 모든 app이 공유할 환경을 만드는 파일이다.

#### `config/urls.py`

```text
/admin/ → Django 관리자
/api/   → bids/urls.py
```

최상위 주소를 어느 app으로 보낼지만 결정한다.

#### `asgi.py`, `wsgi.py`

개발 중 `runserver`가 내부적으로 사용하며, 나중에 운영 서버에 배포할 때 웹 서버와 Django를 연결하는 진입점이다. 일반 기능을 수정할 때는 거의 건드리지 않는다.

---

### 3.2 `bids/`: 실제 BID2 업무 app

#### `models.py`

데이터의 형태와 관계를 정의한다.

```text
Django User
|-- 1:1 CompanyProfile
|-- 1:N SavedBid -- N:1 BidNotice
|-- 1:N RecommendedBid -- N:1 BidNotice
`-- SavedBid
    |-- 1:N BidChatMessage
    `-- 1:1 BidAnalysis
```

- `CompanyProfile`: 회사 기본정보, 역량, 키워드, 지역, 유형, 금액
- `BidNotice`: 나라장터 공고와 원본 `raw_data`
- `SavedBid`: 누가 어떤 공고를 저장했는지 연결
- `RecommendedBid`: 추천 점수, 근거, 공고명 일치 수, 현재 추천 여부
- `BidChatMessage`: 공고별 사용자/AI 메시지와 출처
- `BidAnalysis`: 저장공고별 AI 분석 JSON

#### `serializers.py`

외부에서 들어오는 JSON을 그대로 DB에 넣지 않고 검사한다.

- 로그인 아이디·비밀번호 인증
- 회원가입 아이디·이메일 중복 검사
- 비밀번호 확인 일치 검사
- 회사 프로필 필드 JSON ↔ Django model 변환

#### `urls.py`

API 주소와 `views.py` 함수를 연결한다.

| API | 연결 기능 |
|---|---|
| `/api/bids/` | 공고 목록·검색·필터 |
| `/api/bids/sync/` | 나라장터 공고 즉시 동기화 |
| `/api/bids/{번호}/` | 공고 상세 |
| `/api/bids/{번호}/chat/` | 채팅 기록 조회·질문 |
| `/api/bids/{번호}/analysis/` | AI 분석 조회·생성 |
| `/api/bids/{번호}/analysis/pdf/` | 분석 PDF 다운로드 |
| `/api/saved-bids/` | 저장공고 조회·추가 |
| `/api/saved-bids/{번호}/` | 저장 취소 |
| `/api/recommendations/` | 현재 저장형 추천 결과 |
| `/api/recommended-bids/` | 과거 화면 호환용 즉시 추천 API |
| `/api/company-profile/` | 회사정보 조회·생성·수정 |
| `/api/auth/signup/` | 회원가입 |
| `/api/auth/login/` | Token 발급 |
| `/api/auth/logout/` | Token 삭제 |

#### `views.py`

URL 요청을 실제로 처리하는 관제실이다.

- HTTP method와 입력값 확인
- 로그인 필요 여부 검사
- model 조회·저장
- service 함수 호출
- 오류에 맞는 HTTP 상태 반환
- Next.js가 읽을 JSON 구성

문서 추출, 추천 계산, PDF 생성처럼 긴 로직을 전부 `views.py`에 넣지 않고 `services/`로 분리하여 재사용과 테스트를 쉽게 만들었다.

#### `admin.py`

`/admin/`에서 회사, 공고, 저장, 추천, 채팅, 분석을 검색·필터·확인할 수 있게 한다. 사용자용 화면이 아니라 개발·운영 확인용이다.

#### `tests.py`

인증, 회사정보, 추천 점수, 문서 추출, Retriever, 채팅, 분석, 저장공고, 공고 수집 등 기능이 변경되어도 기존 동작이 깨지지 않았는지 검사한다.

---

## 4. `migrations/`는 왜 필요한가?

`models.py`를 고치는 것만으로 기존 DB 테이블은 자동 변경되지 않는다. Migration은 DB가 어떤 순서로 바뀌었는지를 기록한다.

| 파일 | 역할 |
|---|---|
| `0001_initial.py` | 최초 입찰공고 구조 생성 |
| `0002_bidnotice_deadline_status.py` | 유효·마감·확인 필요 상태 추가 |
| `0003_companyprofile.py` | 회원별 회사정보 추가 |
| `0004_savedbid.py` | 관심 공고 저장 구조 추가 |
| `0005_bidanalysis_recommendedbid.py` | AI 분석과 추천 결과 추가 |
| `0006_recommendedbid_is_match.py` | 현재도 추천되는 결과인지 표시 |
| `0007_companyprofile_excluded_keywords_and_more.py` | 필수·제외 키워드와 추가 조건 보강 |
| `0008_bidchatmessage.py` | 공고별 채팅 기록 추가 |
| `0009_recommendedbid_title_match_count.py` | 동점 정렬용 공고명 일치 개수 추가 |

새 컴퓨터에서는 `python manage.py migrate`를 실행해 이 이력을 순서대로 DB에 적용한다. 적용된 migration 파일을 임의로 삭제하거나 수정하면 다른 컴퓨터의 DB와 구조가 달라질 수 있다.

---

## 5. `management/commands/`는 언제 실행되는가?

Django 웹 요청과 별도로 터미널이나 Windows 작업 스케줄러에서 실행할 업무다.

### `sync_bids.py`

```powershell
python manage.py sync_bids
```

1. 현재 시각 기준 최근 30일 나라장터 공고를 요청한다.
2. 페이지별 데이터를 모은다.
3. 같은 공고번호는 가장 최신 차수를 고른다.
4. 날짜·금액·지역·업종을 Django 값으로 변환한다.
5. 종료된 공고 상태를 갱신한다.
6. 새 공고를 만들거나 기존 공고를 수정한다.

### `match_recommendations.py`

```powershell
python manage.py match_recommendations
```

회사 프로필이 있는 회원마다 `recommendation.py`를 실행한다. 결과는 `RecommendedBid`에 저장되어 추천공고 화면이 빠르게 조회할 수 있다.

---

## 6. `services/`를 별도로 만든 이유

`views.py`는 HTTP 요청과 응답에 집중하고, 실제 업무 계산은 service가 담당하도록 분리했다.

### 일반 service

| 파일 | 입력 | 처리 | 결과 |
|---|---|---|---|
| `g2b_api.py` | 페이지·기간·API Key | 나라장터 공고 API 요청 | 원본 JSON |
| `get_bid_attachments.py` | 공고번호·구분·차수 | 첨부 목록 API 요청 | 첨부파일 metadata 목록 |
| `download_bid_attachment.py` | 공고번호·첨부 metadata | 경로·크기 검사 후 stream 다운로드 | 로컬 파일 경로 |
| `recommendation.py` | 사용자 회사정보·활성 공고 | 키워드·유형·지역·금액 점수와 제외 규칙 | `RecommendedBid` 저장 |
| `analysis_pdf.py` | 저장된 `BidAnalysis` | 한글 font와 표·문단 구성 | PDF 메모리 buffer |

### `services/rag/`

```text
prepare_docs_for_ai.py
|-- 첨부 목록 조회
|-- 다운로드
|-- extract_document.py
|-- split_documents.py
`-- vector_store.py

chatbot.py / analysis.py
|-- retriever.py
|-- 원문 위치 복원
|-- Prompt
|-- ChatOpenAI
`-- Parser 또는 Pydantic 구조화 결과
```

#### `extract_document.py`

서로 다른 파일을 LangChain `Document`로 통일한다. 파일명, 형식, 페이지·문단 위치, element index metadata를 추가한다. ZIP 경로 탈출, 실행파일, 암호화, 과도한 크기와 중첩을 검사한다.

#### `split_documents.py`

원문 검색을 위해 500자 Chunk와 100자 overlap으로 나눈다. metadata는 각 Chunk에 유지된다.

#### `vector_store.py`

Chunk를 `text-embedding-3-small`로 벡터화해 공고번호별 Chroma에 영구 저장한다. 기존 정상 DB가 있으면 다시 Embedding하지 않는다.

#### `retriever.py`

질문과 의미가 가까운 Chunk를 찾는다. 최대 30개 후보, relevance 0.2 이상, 결과 부족 시 상위 5개 보완 규칙을 담당한다.

#### `prepare_docs_for_ai.py`

여러 service를 순서대로 묶는 인덱싱 관리자다. `INDEX_VERSION=2`와 `index_info.json`을 이용해 현재 방식으로 이미 처리한 공고는 재사용한다.

#### `chatbot.py`

사용자 질문으로 Retriever를 실행하고, 검색 Chunk의 원문 페이지·문단을 최대 20,000자까지 구성한다. `ChatPromptTemplate → gpt-4o-mini → StrOutputParser` Chain으로 답변을 만들고 출처 목록을 함께 반환한다.

#### `analysis.py`

사업 개요, 참가 자격, 평가·서류, 인력·위험의 네 Query로 문서를 넓게 검색한다. 최대 30,000자 문맥과 회사정보 JSON을 Prompt에 넣고, Pydantic Schema에 맞는 분석 결과를 만든다.

---

## 7. Next.js `app/`은 어떻게 URL이 되는가?

App Router에서는 폴더 안의 `page.tsx`가 URL 화면이 된다.

```text
app/mainPage/page.tsx
→ http://localhost:3000/mainPage

app/dashBoard/bidList/page.tsx
→ http://localhost:3000/dashBoard/bidList
```

`layout.tsx`는 하위 페이지가 공통으로 사용하는 틀이다.

```text
app/layout.tsx
`-- 모든 페이지
    `-- app/dashBoard/layout.tsx
        `-- 모든 대시보드 페이지
```

대시보드 `layout.tsx` 안의 `{children}` 자리에 선택한 `page.tsx`가 들어간다. 그래서 페이지마다 Sidebar를 반복 작성하지 않아도 된다.

---

## 8. `page.tsx`와 `components/`를 나눈 이유

### `page.tsx`

URL의 입구다. URL parameter를 읽고 페이지 제목과 큰 구성을 정한다.

### `components/`

실제 기능과 재사용 UI를 담당한다.

예:

```text
app/dashBoard/matchBid/page.tsx
|-- bid query가 없음 → SavedBidBoard
`-- bid query가 있음 → BidAnalysisReport
```

페이지 파일을 작게 유지하면 UI 기능을 별도로 테스트·수정하기 쉽고 다른 페이지에서도 재사용할 수 있다.

---

## 9. Server Component와 Client Component

### Server Component

파일 위에 `"use client"`가 없으며 Next.js 서버에서 실행된다.

예: `BidList.tsx`

- Django 공고 API를 서버에서 호출
- HTML을 만든 뒤 브라우저에 전달
- `cache: "no-store"`로 현재 공고 조회
- 브라우저의 `localStorage`에는 접근할 수 없음

### Client Component

파일 첫 줄에 `"use client"`가 있다.

예: `BidChatWindow.tsx`, `CompanyProfile.tsx`

- `useState`, `useEffect` 사용
- 클릭·입력·팝업·로딩 처리
- 브라우저 `localStorage`에서 인증 Token 확인
- Token을 넣어 Django API 호출

서버에서 가능한 데이터 조회는 Server Component로, 브라우저 상태가 필요한 기능은 Client Component로 분리한다.

---

## 10. 프론트 컴포넌트 묶음별 역할

### `auth/`

회원 인증 관련 UI다. 비로그인 상태를 각 화면에서 다르게 작성하지 않도록 `LoginRequiredNotice`를 공통 사용한다.

### `companyForm/`

회사정보의 조회, 요약, 입력, 수정 흐름을 담당한다. `CompanyProfile`이 로그인과 데이터 유무를 판단하고 `CompanyForm`을 보여준다.

### `bids/`

공고 목록 한 페이지를 여러 책임으로 나눈다.

```text
BidList
|-- BidSummary
|-- BidFilters
`-- BidTable
    |-- BidDetailModal
    |-- SaveBidButton
    `-- BidChatButton
```

### `recommendations/`

Django가 미리 계산해 저장한 `RecommendedBid`를 조건 일치도 순으로 보여준다.

### `savedBids/`

사용자가 저장한 공고를 보여주고 저장 취소, 상세, 채팅, AI 분석으로 연결한다.

### `chat/`

공고별 별도 팝업창을 열고, 이전 메시지를 조회하며, 새 질문과 답변·출처를 화면에 쌓는다.

### `analysis/`

저장된 분석을 조회하고, 없을 때 최초 AI 분석을 실행하며, 구조화된 결과를 화면과 PDF로 제공한다.

### `ui/`

업무 의미가 없는 공통 모양을 재사용한다. `Input`, `Card`, `Button`, `RegionSelector`처럼 여러 화면에서 반복될 수 있는 UI다.

---

## 11. `lib/`와 `types/`를 만든 이유

### `lib/bidSync.ts`

공고 새로고침 요청의 Promise와 상태를 React 페이지 바깥 module에 보관한다. Next.js 내부 페이지를 이동해도 같은 JavaScript 실행 환경이 유지되는 동안 수집 요청과 로딩 상태가 계속된다.

브라우저 전체 새로고침이나 탭 종료까지 견디는 서버 작업 Queue는 아니며, 현재는 Client navigation 범위의 지속 상태다.

### `lib/companyKeywords.ts`

예전 `required_keywords`와 `preferred_keywords` 값을 하나의 “찾는 공고 키워드”로 합친다. 쉼표 분리, 공백 제거, 중복 제거를 한곳에서 처리해 회사정보 화면과 공고 필터가 같은 결과를 사용하게 한다.

### `types/`

Django가 보내는 JSON의 형태를 TypeScript에 알려준다. 필드 오타나 `null`, 숫자, 문자열 혼동을 빌드 단계에서 찾을 수 있다. 실제 DB를 만드는 파일은 아니며 프론트의 안전장치다.

---

## 12. 설정 파일 역할

| 파일 | 역할 | 보통 수정하는 때 |
|---|---|---|
| `package.json` | npm 명령과 Next/React/Tailwind 의존성 | package 추가·버전 변경 |
| `package-lock.json` | 모든 하위 package 버전 고정 | `npm install`이 자동 변경 |
| `next.config.ts` | Next.js 전체 동작 설정 | image host, build, redirect 등 필요 시 |
| `tsconfig.json` | strict TypeScript와 `@/*` 별칭 | TypeScript 정책 변경 |
| `eslint.config.mjs` | 코드 품질 규칙 | lint 규칙 조정 |
| `postcss.config.mjs` | Tailwind CSS 변환 연결 | CSS build plugin 변경 |
| `.env.example` | 필요한 환경변수 예시 | 새 환경변수 추가 시 |
| `.gitignore` | 생성물·비밀값 Git 제외 | 새로운 로컬 생성물 발생 시 |

`web/.env.example`의 `BID_API_BASE_URL`은 Next.js Server Component가 Django에 접속할 주소다. 브라우저 Client Component는 `NEXT_PUBLIC_API_BASE_URL`이 없으면 코드의 기본값 `http://127.0.0.1:8000`을 사용한다.

현재 `server/.env.example`에는 `G2B_API_KEY`만 적혀 있지만 AI 기능을 실제 실행하려면 로컬 `server/.env`에 `OPENAI_API_KEY`도 필요하다. 실제 값은 문서나 Git에 넣지 않는다.

---

## 13. 자동 생성·로컬 전용 폴더

이 항목은 코드를 직접 작성하는 장소가 아니다.

| 경로 | 만드는 명령·시점 | 지워도 되는가? |
|---|---|---|
| `.git/` | `git clone`, `git init` | 삭제하면 Git 이력·저장소 연결 소실 |
| `server/venv/` | `python -m venv venv` | 재설치 가능하지만 Python package 다시 설치 필요 |
| `web/node_modules/` | `npm install` | 재설치 가능 |
| `web/.next/` | `npm run dev/build/start` | 다시 build 가능 |
| `web/.npm-cache/` | npm package 설치 | 다시 생성 가능 |
| `server/db.sqlite3` | `migrate`, 앱 실행 | 삭제하면 로컬 회원·공고·분석 데이터 소실 |
| `server/media/` | 첨부파일 다운로드 | 삭제하면 AI가 파일을 다시 받아야 함 |
| `server/chroma_db/` | 최초 AI 질문·분석 | 삭제하면 Embedding을 다시 실행해 비용 발생 가능 |
| `__pycache__/`, `*.pyc` | Python 실행 | 다시 생성 가능 |
| `next-env.d.ts` | Next.js 실행 | 자동 재생성 |

DB, media, Chroma를 삭제하면 코드는 남아도 로컬 데이터나 AI 인덱스는 사라진다. 단순 cache 삭제와 동일하게 생각하면 안 된다.

---

## 14. 기능별로 어느 파일을 수정해야 하는가?

| 원하는 변경 | 먼저 볼 파일 | 함께 확인할 파일 |
|---|---|---|
| 공고 표 UI | `web/components/bids/BidTable.tsx` | `web/types/bid.ts` |
| 공고 검색 조건 | `BidFilters.tsx` | `views.py`의 bid filter |
| 회사정보 입력 항목 | `CompanyForm.tsx` | `models.py`, `serializers.py`, migration, company type |
| 추천 배점 | `services/recommendation.py` | `tests.py`, `RecommendedBidBoard.tsx` 안내 |
| 추천 목록 정렬 | `views.py`의 recommendations | `models.py`, migration |
| 공고 수집 필드 | `sync_bids.py` | `g2b_api.py`, `models.py` |
| 새 API | `bids/urls.py`, `views.py` | serializer, service, tests |
| 챗봇 Persona·Prompt | `rag/chatbot.py` | `tests.py` |
| Chunk 크기 | `rag/split_documents.py` | 기존 `chroma_db`, INDEX_VERSION |
| 검색 후보·0.2 기준 | `rag/retriever.py` | Retriever tests |
| Embedding 모델 | `rag/vector_store.py` | 기존 Chroma 재생성 정책 |
| AI 분석 항목·Schema | `rag/analysis.py` | `BidAnalysisReport.tsx`, `analysis_pdf.py` |
| 문서 형식 추가 | `rag/extract_document.py` | `requirements.txt`, tests |
| 채팅 화면 | `BidChatWindow.tsx` | Django `bid_chat` view |
| PDF 디자인 | `services/analysis_pdf.py` | 저장된 분석 Schema |
| 로그인 방식 | auth components | serializers, views, settings |
| 공고 동기화 지속 상태 | `web/lib/bidSync.ts` | `BidFilters.tsx`, sync API |

---

## 15. 프로젝트 실행 시 실제 순서

```text
1. Django 실행
   server/manage.py
   → config/settings.py
   → config/urls.py
   → bids app와 API 준비

2. Next.js 실행
   web/package.json의 dev/start 명령
   → app/layout.tsx
   → 현재 URL의 page.tsx
   → components 조립

3. 사용자 요청
   React/Next.js fetch
   → Django URL
   → view
   → model/service
   → JSON
   → React 화면 갱신

4. AI 요청인 경우
   view
   → prepare_docs_for_ai
   → extract/split/Chroma
   → retriever
   → prompt/model/parser
   → DB 저장
   → 답변·출처 또는 분석 JSON
```

---

## 16. 가장 짧은 발표용 설명

> BID2는 `server`와 `web`을 분리한 프로젝트입니다. `web`은 Next.js App Router와 React 컴포넌트로 사용자가 보는 페이지와 입력 상태를 만들고, `server`는 Django REST Framework로 인증, SQLite 데이터, 나라장터 수집, 추천 규칙, LangChain RAG와 OpenAI 호출을 담당합니다. Django의 `views`가 API 요청을 받고 복잡한 업무는 `services`에 위임하며, DB 변경은 `migrations`로 관리합니다. RAG 폴더는 첨부 문서 추출, Chunk 분할, Embedding, Chroma 검색, Prompt, 모델, Output Parser 순으로 나누었습니다. 이렇게 책임별로 폴더를 분리했기 때문에 화면·데이터·추천·AI 기능을 서로 덜 영향을 주면서 수정하고 테스트할 수 있습니다.
