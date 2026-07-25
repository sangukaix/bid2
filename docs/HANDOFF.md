# BID2 작업 인수인계

작성일: 2026-07-25  
다음 작업 장소: 집 컴퓨터  
작성 시점 커밋: `3ea9c1e`

> 현재 제안서 RAG와 최대 15·30·50쪽 생성 기능은 구현 중이다.
> 기능 연결 구조는 `MAPPING.md`, 남은 작업은 `TODO.md`를 기준으로 확인한다.

## 현재 작업

사용자가 업로드한 기존 제안서를 전체 추출해 회사 문서 전용 Chroma DB에 저장하고,
새 공고 문서와 함께 RAG 검색하여 맞춤형 제안서를 만드는 구조로 변경하고 있다.

```text
공고 첨부문서 RAG
        +
회사 제안서 RAG
        +
저장된 회사정보
        |
        v
수주 전략 설계
        |
        v
목차별 관련 Chunk 재검색
        |
        v
목차별 페이지 초안 생성
        |
        v
DOCX 또는 PPTX로 합치기
```

## 완료된 부분

- 회사 제안서 전용 Lazy indexing 모듈 추가
- 사용자·회사문서별 Chroma 저장 경로 분리
- 기존 인덱스 재사용 구조 추가
- 간단형 15쪽, 표준형 30쪽, 상세형 50쪽 설정 추가
- 목차 중요도에 따른 본문 페이지 배분 함수 추가
- 목차별 공고·회사 제안서 RAG 검색과 생성 구조 추가
- DOCX/PPTX 생성기에 본문 페이지 예산 반영

## 아직 완료되지 않은 부분

- Word 생성 시 빈 페이지가 생기지 않도록 페이지 구분 정리
- Django API에 `length_mode` 검증과 전달 연결
- Next.js에 간단형·표준형·상세형 선택 UI 추가
- TypeScript 응답 자료형 갱신
- 회사 제안서 RAG와 페이지 배분 자동 테스트 추가
- Django check, 전체 테스트, Next.js build
- 실제 제안서 생성 품질과 비용 확인

자세한 순서는 `TODO.md`를 따른다.

## 집에서 시작

```powershell
cd <집 컴퓨터의 bid2 경로>
git pull
git log -3 --oneline --decorate
git status
```

Codex 요청 문장:

> `docs/HANDOFF.md`, `docs/MAPPING.md`, `docs/TODO.md`를 읽고 실제 코드와 비교해줘.
> TODO의 최우선 작업부터 이어서 진행해줘. 실제 OpenAI 호출은 비용이 발생하므로
> Mock 테스트, Django check, Next.js build를 먼저 실행해줘.

## 로컬 환경 주의

- `.env`, `db.sqlite3`, `venv`, `node_modules`, `media`, `chroma_db`는 컴퓨터마다 다를 수 있다.
- 집 컴퓨터의 `server/.env`에 `OPENAI_API_KEY`, `G2B_API_KEY`가 필요하다.
- Git pull만으로 학원 컴퓨터의 계정, DB, 업로드 문서와 Chroma DB가 복사되지는 않는다.
- 큰 문서 실험 전에 작은 DOCX 제안서로 흐름을 먼저 확인한다.
- `.env` 값과 실제 API Key는 문서나 Git에 기록하지 않는다.

## 작업 종료 시 갱신할 내용

- 완료한 TODO
- 변경한 주요 파일
- Django check와 테스트 결과
- Next.js build 결과
- 실제 OpenAI 호출 여부와 비용
- 남은 문제
- 마지막 커밋과 push 여부
