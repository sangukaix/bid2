# BID2 프로젝트 작업 인수인계

작성일: 2026-07-18

다음 작업 장소: 집

기준 커밋: `57b76a6` (`2026학원`, 2026-07-18 18:57 KST)

원격 상태: 작성 시점에 `main`과 `origin/main`이 동일함

## 1. 내일 시작할 때 가장 먼저 할 일

집 컴퓨터에 저장소가 이미 있다면:

```powershell
cd D:\mbca_home\projects\bid2
git status
git pull
git log -3 --oneline
```

저장소가 없다면 GitHub에서 먼저 clone한다.

Codex에는 다음과 같이 요청한다.

> HANDOFF.md를 먼저 전부 읽고 git status, 최근 커밋, 실제 코드 구조를 확인해줘. 백엔드 테스트와 프론트 빌드를 실행해 현재 상태를 검증한 다음, 오늘 작업 요약과 다음 우선순위를 보여주고 이어서 작업해줘.

## 2. 프로젝트 구성

```text
bid2
├─ server/  Django 5.2 + Django REST Framework 백엔드
└─ web/     Next.js 16 + React 19 + TypeScript 프론트엔드
```

주요 데이터 흐름:

```text
나라장터 API → Django 수집 명령 → BidNotice DB
                                  ├─ 검색/필터 API → Next.js 공고 목록
                                  ├─ 회사 조건 매칭 → 회원별 추천 공고
                                  └─ 첨부 문서 → Chroma/OpenAI → AI 채팅·분석·PDF
```

## 3. 2026-07-18 완료한 작업

오늘 커밋은 70개 파일, 약 6,226줄 추가 규모다.

### 백엔드 데이터 모델 및 마이그레이션

다음 모델과 마이그레이션이 추가되었다.

- `CompanyProfile`: 회사 정보, 선호 지역/키워드, 제외 키워드 등
- `SavedBid`: 사용자가 저장한 관심 공고
- `RecommendedBid`: 사용자별 추천 공고와 매칭 여부/근거
- `BidAnalysis`: 공고 AI 분석 결과
- `BidChatMessage`: 공고별 AI 질문·답변 기록
- 마이그레이션 `0003`부터 `0008`까지 추가

### 인증과 회사 프로필

- 회원가입, 로그인, 로그아웃 API 구현
- DRF Token 기반 인증 적용
- 회사 프로필 최초 저장 및 조회/수정 기능 구현
- 프론트에 로그인, 회원가입, 로그아웃, 내 정보/회사 정보 화면 연결

API:

- `POST /api/auth/signup/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET/POST/PUT /api/company-profile/`

### 입찰 공고 조회와 필터

- DB 기반 공고 목록과 상세 조회 API 구현
- 페이지네이션, 일반 검색, 키워드, 지역, 마감일 정렬 지원
- 공고 목록 테이블, 요약, 상세 모달, 필터 UI 개선
- 지역 선택 컴포넌트 추가
- 나라장터 공고 수동 동기화 API 연결

주요 API:

- `GET /api/bids/`
- `GET /api/bids/<공고번호>/`
- `POST /api/bids/sync/`

확인된 쿼리 조건:

- `page`, `page_size`
- `q`
- `keywords`
- `regions`
- `deadline_sort=asc|desc`

### 관심 공고

- 관심 공고 저장, 목록 조회, 저장 취소 구현
- `SaveBidButton`, `SavedBidBoard` 프론트 컴포넌트 추가

API:

- `GET/POST /api/saved-bids/`
- `DELETE /api/saved-bids/<공고번호>/`

### 회사 맞춤 추천

- 회사 프로필과 공고 조건을 비교하는 추천 서비스 구현
- 사용자별 추천 결과와 매칭 근거 저장
- 추천 실행 관리 명령 `match_recommendations` 추가
- 추천 공고 대시보드 구현
- 기존 `/recommended-bids/`는 호환용으로 남기고 화면에서는 `/recommendations/` 사용

실행:

```powershell
cd server
.\venv\Scripts\python.exe manage.py match_recommendations
```

API:

- `GET /api/recommendations/`
- `GET /api/recommended-bids/` (기존 주소 호환용)

### AI 문서 검색, 채팅, 분석과 PDF

- 나라장터 공고 첨부파일 조회 및 다운로드 구현
- PDF, HWP/HWPX 및 여러 문서 형식의 텍스트 추출 처리 추가
- 압축파일 안전 해제와 문서 분할 처리 추가
- 공고별 Chroma 벡터 저장소와 OpenAI Embedding 기반 검색 구현
- 공고 문서를 근거로 질문하는 AI 채팅 구현
- 회사 프로필을 반영한 구조화된 공고 분석 구현
- 저장된 분석 결과를 PDF로 내려받는 기능 구현
- 프론트에 채팅창, 채팅 버튼, 분석 보고서 화면 추가

API:

- `POST /api/bids/<공고번호>/chat/`
- `GET/POST /api/bids/<공고번호>/analysis/`
- `GET /api/bids/<공고번호>/analysis/pdf/`

### Windows 예약 작업

- `server/scripts/register_bid_sync_task.ps1`
  - 나라장터 공고 수집: 매일 08:00~18:00 매시간
- `server/scripts/register_recommendation_task.ps1`
  - 회사별 추천 매칭: 매일 18:10

예약 작업은 각 컴퓨터에서 별도로 등록해야 하며, Git pull만으로 자동 등록되지는 않는다.

### 테스트

- `server/bids/tests.py`에 현재 테스트 함수 65개가 있음
- 인증, 회사 프로필, 추천, 문서 추출/검색, 채팅, 공고 목록/수집, 관심 공고, 분석 등을 검사함
- 내일 실제 환경에서 전체 테스트를 다시 실행해 최종 결과를 확인할 것

## 4. 집 컴퓨터 환경 준비

Git에는 일반적으로 `.env`, 가상환경, 로컬 DB, Node 모듈, 비밀키가 포함되지 않는다.

### 백엔드

```powershell
cd D:\mbca_home\projects\bid2\server

python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test -v 2
.\venv\Scripts\python.exe manage.py runserver
```

`server/.env`에 필요한 비밀값을 설정한다. 실제 값은 Git에 올리지 않는다.

```dotenv
G2B_API_KEY=<나라장터 API 키>
OPENAI_API_KEY=<OpenAI API 키>
```

DB가 비어 있다면 먼저 적은 범위로 시험 수집한다.

```powershell
.\venv\Scripts\python.exe manage.py sync_bids --max-pages 2
```

### 프론트엔드

```powershell
cd D:\mbca_home\projects\bid2\web
npm install
npm run build
npm run dev
```

`web/.env.local` 예시:

```dotenv
BID_API_BASE_URL=http://127.0.0.1:8000
```

접속 주소:

- 프론트엔드: `http://localhost:3000`
- Django API/관리자: `http://127.0.0.1:8000`

## 5. 내일 검증할 체크리스트

- [ ] `git status`가 깨끗하고 `origin/main`과 동일한지 확인
- [ ] 마이그레이션 `0003`~`0008` 적용
- [ ] Django `check` 통과
- [ ] 백엔드 테스트 65개 전체 실행 및 결과 기록
- [ ] 프론트 `npm run build` 통과
- [ ] 회원가입 → 로그인 → 로그아웃 확인
- [ ] 회사 프로필 저장/수정 확인
- [ ] 공고 목록, 검색, 키워드/지역 필터, 정렬 확인
- [ ] 관심 공고 저장/취소 확인
- [ ] `match_recommendations` 실행 후 추천 목록 확인
- [ ] 실제 첨부 문서가 있는 공고에서 AI 채팅 확인
- [ ] AI 분석 생성과 PDF 다운로드 확인
- [ ] 필요할 경우 Windows 예약 작업 등록

## 6. 알려진 주의사항

- Next.js 실행 로그에 `EADDRINUSE: address already in use :::3000` 오류가 한 번 있었다. 다시 발생하면 기존 3000번 포트 프로세스를 종료하거나 다른 포트로 실행한다.
- OpenAI 기능은 API 키와 네트워크가 필요하며 호출 비용이 발생할 수 있다.
- 나라장터 API 데이터와 수집 건수는 실행 시점마다 달라질 수 있다.
- 첨부 문서 형식에 따라 HWP/PDF/압축파일 추출 결과가 달라질 수 있으므로 실제 공고로 확인한다.
- `.env`, API 키, `venv`, `node_modules`, 로컬 DB, 다운로드 문서, Chroma 데이터, 실행 로그가 Git에 포함되지 않도록 확인한다.
- 예약 작업은 실행 경로의 `server\venv\Scripts\python.exe`를 사용하므로 가상환경을 먼저 만들어야 한다.

## 7. 다음 우선순위

1. 집 환경에서 pull 후 백엔드 테스트 65개와 프론트 빌드 실행
2. 전체 사용자 흐름을 브라우저에서 끝까지 확인
3. AI 채팅/분석/PDF를 실제 나라장터 첨부 문서로 검증
4. 실패 항목이 있으면 한 기능씩 원인 진단 후 수정
5. 검증이 끝나면 이 문서에 결과와 다음 작업을 다시 기록하고 커밋

## 8. 작업 종료 시 기록 규칙

다음 작업을 마칠 때 이 문서에 반드시 남긴다.

- 완료한 기능
- 변경한 주요 파일
- 실행한 테스트와 정확한 결과
- 아직 남은 문제
- 다음 작업의 첫 단계
- 마지막 커밋 해시

작업 종료 명령:

```powershell
git status
git add HANDOFF.md <오늘 변경한 파일들>
git commit -m "작업 내용 요약"
git push
```
