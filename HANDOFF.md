# BID2 프로젝트 작업 인수인계

작성일: 2026-07-12
프로젝트 경로: `D:\mbca_home\projects\bid2`

## 1. 프로젝트 구성

```text
bid2
|
+--- server                         Django 백엔드
|    |
|    +--- config
|    |    +--- settings.py         Django 설정, 한국 시간대 및 앱 설정
|    |    +--- urls.py             최상위 URL 연결
|    |
|    +--- bids
|    |    +--- models.py           BidNotice 데이터베이스 구조
|    |    +--- views.py            현재 입찰공고 API 응답
|    |    +--- urls.py             입찰공고 API URL
|    |    +--- admin.py            Django 관리자 화면 설정
|    |    +--- tests.py            자동 테스트 7개
|    |    |
|    |    +--- services
|    |    |    +--- g2b_api.py     나라장터 API 통신
|    |    |
|    |    +--- management
|    |         +--- commands
|    |              +--- sync_bids.py
|    |                               여러 페이지 공고 수집 및 DB 저장
|    |
|    +--- db.sqlite3               로컬 개발용 SQLite DB
|    +--- manage.py                Django 명령 실행 파일
|
+--- web                            Next.js 프런트엔드
     |
     +--- components
     |    +--- bids
     |         +--- BidTable.tsx
     |         +--- BidFilters.tsx
     |         +--- BidSummary.tsx
     |         +--- BidDetailModal.tsx
     |
     +--- types
          +--- bid.ts
```

## 2. 2026-07-12 완료한 작업

### `server/bids/services/g2b_api.py`

나라장터 API 요청 함수에 다음 조건을 전달할 수 있게 수정했다.

* 페이지 번호
* 페이지당 조회 개수
* 조회 시작 시각
* 조회 종료 시각
* 일반 웹 요청은 기존처럼 10건 유지
* 수집 명령에서는 한 페이지당 999건 요청 가능

### `server/bids/management/commands/sync_bids.py`

새로운 Django 관리 명령을 만들었다.

주요 기능:

* 최근 30일 조회 범위 계산
* 나라장터 API 첫 페이지 요청
* 전체 결과와 전체 페이지 수 계산
* 여러 페이지 반복 수집
* 같은 공고번호에서 가장 최신 공고 차수 선택
* 마감일 기준으로 상태 분류
* 신규 공고 저장
* 기존 공고 업데이트
* 과거에 이미 마감된 공고 제외
* 공고번호와 공고 차수 중복 방지

마감 상태는 다음과 같이 사용한다.

* `active`: 마감일이 확인되고 아직 유효한 공고
* `review`: 마감일을 명확하게 확인하기 어려운 공고
* `expired`: 이미 마감된 공고

`active`와 `review` 공고를 추천 후보로 사용한다.

### `server/bids/tests.py`

현재 자동 테스트 7개가 있으며 다음 내용을 검사한다.

* API 페이지 조건 전달
* 최신 공고 차수 선택
* 유효 공고 분류
* 확인 필요 공고 분류
* 마감 공고 분류
* 기존 API 응답 유지
* 중복 방지 및 저장 동작

### `server/bids/admin.py`

`BidNotice` 모델을 Django 관리자에 등록했다.

관리자 화면 기능:

* 공고번호 표시
* 공고명 표시
* 업무 구분 표시
* 공고기관 표시
* 금액 표시
* 마감일 표시
* 마감 상태 표시
* 추천 대상 여부 표시
* 공고번호, 공고명, 기관명 검색
* 마감 상태, 추천 여부, 업무 구분 필터
* 한 페이지에 50건 표시
* 원본 API 데이터와 생성·수정 시각은 읽기 전용

## 3. 집 컴퓨터에서 확인한 결과

실행한 명령:

```powershell
cd D:\mbca_home\projects\bid2\server

.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test -v 2
.\venv\Scripts\python.exe manage.py sync_bids --max-pages 2
```

확인 결과:

* Django 설정 검사 통과
* 자동 테스트 7개 통과
* 나라장터 API 2페이지 시험 수집 완료
* 원본 약 1,998행 확인
* 최신 공고번호 약 1,800건 확인
* DB에 약 511건 저장
* 중복된 공고번호와 공고 차수 0건

API 데이터는 실시간으로 변하므로 정확한 건수는 실행할 때마다 달라질 수 있다.

## 4. Django 관리자 페이지

실행:

```powershell
cd D:\mbca_home\projects\bid2\server
.\venv\Scripts\python.exe manage.py runserver
```

접속:

```text
http://127.0.0.1:8000/admin/
```

Django 관리자 화면의 기본 로그인 화면과 관리 기능은 Django가 제공한다.

우리가 만든 부분은 다음과 같다.

* BidNotice 데이터 구조
* 나라장터 수집 기능
* 저장 및 분류 규칙
* 관리자 목록에 표시할 열
* 검색 조건
* 필터 조건

## 5. 학원 컴퓨터에서 주의할 점

Git으로 가져오는 것은 Git에 등록된 코드 파일이다.

다음 항목은 일반적으로 Git으로 전달되지 않는다.

* `.env`
* API 서비스키
* `venv`
* `db.sqlite3`
* 집 컴퓨터에서 만든 Django 관리자 계정

따라서 학원 컴퓨터에서는 다음을 확인해야 한다.

1. `.env`가 존재하고 나라장터 API 키가 설정되어 있는지 확인
2. 가상환경이 없다면 생성
3. `requirements.txt` 패키지 설치
4. 마이그레이션 실행
5. Django 관리자 계정 생성
6. 나라장터 공고 시험 수집

기본 확인 명령:

```powershell
cd D:\mbca_home\projects\bid2\server

.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test -v 2
```

DB가 비어 있다면 시험 수집:

```powershell
.\venv\Scripts\python.exe manage.py sync_bids --max-pages 2
```

관리자 계정이 없다면:

```powershell
.\venv\Scripts\python.exe manage.py createsuperuser
```

## 6. 현재 데이터 흐름

```text
나라장터 API
     |
     v
g2b_api.py
나라장터 API 요청 및 응답 수신
     |
     v
sync_bids.py
여러 페이지 수집
최신 차수 선택
마감 상태 분류
     |
     v
models.py
BidNotice 구조에 맞게 변환
     |
     v
db.sqlite3
입찰공고 저장
     |
     v
admin.py
Django 관리자 화면에서 조회
```

## 7. 다음 작업 순서

### 1단계

학원 컴퓨터에서 다음을 확인한다.

* Git pull이 정상적으로 되었는지
* 마이그레이션이 적용되었는지
* 테스트 7개가 통과하는지
* 2페이지 시험 수집이 되는지
* Django 관리자 화면에서 공고가 보이는지

### 2단계

시험 결과가 정상이면 나라장터 전체 페이지 수집을 실행한다.

전체 페이지 수는 API 결과에 따라 달라질 수 있다. 이전 시험에서는 약 39페이지였다.

```powershell
.\venv\Scripts\python.exe manage.py sync_bids
```

전체 수집 전 반드시 2페이지 시험 수집과 관리자 화면 확인을 먼저 한다.

### 3단계

`server/bids/views.py`를 수정한다.

현재 웹 API는 나라장터 API에서 최근 10건을 직접 가져오는 방식이다.

앞으로는 다음 구조로 변경한다.

```text
Next.js 웹
     |
     v
Django /api/bids/
     |
     v
views.py
     |
     v
db.sqlite3의 BidNotice 조회
```

변경 목표:

* 나라장터 API를 웹 요청 때마다 직접 호출하지 않기
* 우리 DB의 `BidNotice`를 조회하기
* 추천 대상 공고만 조회하기
* 최신 공고 우선 정렬
* 한 번에 20건씩 반환
* 추후 페이지네이션 지원

### 4단계

Django API 변경 후 Next.js에서 다음 파일을 점검한다.

* `web/types/bid.ts`
* `web/components/bids/BidTable.tsx`
* `web/components/bids/BidSummary.tsx`
* `web/components/bids/BidFilters.tsx`

## 8. 코덱스 작업 방식

작업을 시작하기 전에 반드시 실제 코드를 먼저 읽어야 한다.

다음 순서로 확인한다.

1. `git status`
2. 최근 Git 커밋 확인
3. `HANDOFF.md` 확인
4. 관련 파일의 실제 코드 확인
5. 현재 코드와 HANDOFF 내용이 일치하는지 확인
6. 테스트 실행
7. 다음 한 단계만 수정

코드를 수정하기 전에 다음 형식의 CLI 트리를 먼저 보여준다.

```text
파일명                 상태
models.py              [완료] DB 구조와 마감 상태 정의
g2b_api.py             [완료] 나라장터 API 통신
sync_bids.py           [완료] 페이지 수집과 DB 저장
admin.py               [완료] Django 관리자 조회 화면
views.py               [다음] DB 기반 입찰 API로 변경
```

파일 옆에는 다음 내용을 설명한다.

* 이 파일의 역할
* 기존에 작성된 기능
* 이번에 수정할 내용
* 수정하는 이유

한 번에 여러 단계를 진행하지 않는다.

수정 후에는 반드시 다음을 알려준다.

* 수정된 파일
* 새로 만든 파일
* 삭제된 파일
* 실행한 테스트
* 테스트 결과
* 사용자가 직접 확인할 방법

코드 설명 시 사용한 Python 함수, Django 기능, JavaScript 함수, React 함수 및 연산자의 이름도 함께 설명한다.
