# Bid2 작업 인계

## 현재 방향

- 프론트엔드: Next.js + React
- 백엔드: Django REST Framework
- 개발 DB: SQLite, 운영 전 MySQL 전환 예정
- 공고 수집: 나라장터 Open API
- AI: OpenAI + LangChain + Chroma

## 완료된 핵심 흐름

```text
회원가입/로그인
  -> 회사 정보와 회사 문서 등록
  -> 나라장터 공고 수집/검색/저장
  -> 공고 첨부문서 Lazy indexing
  -> 공고별 AI 채팅과 분석
  -> Bid2 템플릿 기반 제안서 생성/미리보기/수정/다운로드
```

회사 문서는 제안서를 처음 만들 때 자동 분석합니다. 추출 결과는
`CompanyKnowledgeItem`에 출처와 함께 저장하며 다음 생성부터 재사용합니다.
사용자 승인 단계는 두지 않습니다.

## 2026-07-30 제안서 작업 화면

- 기본 제안서는 약 30장을 목표로 생성하며 최종 결과는 최대 50장입니다.
- AI비서 한 화면에서 공고 질문과 제안서 수정 요청을 함께 입력합니다.
- 공고 질문은 공고 RAG만 사용하고, 명시적인 웹 검색 수정 요청만 웹 자료를 참고합니다.
- 대화는 `BidChatMessage`에 저장되어 재로그인 후에도 유지됩니다.
- 메시지 삭제는 실제 행을 지우지 않고 `삭제된 메시지입니다.`로 남깁니다.
- `제안서 만들기`를 누른 공고는 사이드바에 프로젝트 1, 2 순서로 저장됩니다.

## 로컬 실행

```powershell
# Django
cd server
.\venv\Scripts\Activate.ps1
python manage.py runserver

# Next.js (새 터미널)
cd web
npm run dev
```

`.env`, `db.sqlite3`, `venv`, `node_modules`, `chroma_db`는 Git으로 공유하지
않습니다. 새 컴퓨터에서는 `.env.example`을 참고하고 의존성과 DB를 다시
준비해야 합니다.

## 다음 작업

1. 실제 공고 1건으로 30장 실무형 템플릿 생성 품질 검증
2. 요구사항·평가항목·회사 증빙 반영 여부와 미해결 문구 확인
3. 서로 다른 업종 공고 2건으로 업종별 목차와 전략 품질 비교
4. 생성 작업을 백그라운드 작업으로 분리해 운영 서버 시간 초과 방지
5. 배포 전 SQLite/로컬 Chroma를 운영 DB와 벡터 저장소로 전환
