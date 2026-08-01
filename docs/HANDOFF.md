# Bid2 작업 인계

기준일: 2026-08-01

## 기술 구성

- 프론트엔드: Next.js 16 + React 19 + TypeScript
- 백엔드: Django 5.2 + Django REST Framework
- 개발 DB: SQLite, 운영 전 MySQL 또는 PostgreSQL 검토
- 공고 수집: 나라장터 Open API
- AI: OpenAI + LangChain + Chroma
- 제안서 결과: PPTX, PDF 미리보기

## 현재 완료된 흐름

```text
회원가입/로그인
  -> 회사정보와 회사 문서 등록
  -> 나라장터 공고 수집/검색/추천/저장
  -> 공고 첨부문서 Lazy indexing
  -> 공고별 AI 채팅과 입찰성공률 분석
  -> Bid2 템플릿 선택
  -> 회사 자료와 공고 문서를 이용한 제안서 생성
  -> 미리보기에서 AI비서 수정
  -> 최종 PPTX 다운로드
```

## 2026-08-01 마지막 작업

- `제안서 초안 만들기`를 `제안서 생성`으로 변경했습니다.
- 생성 후 버튼은 `처음으로 되돌리기`이며 기존 작업 삭제 확인창이 나타납니다.
- 제작 횟수, 자동 검수 완료, AI비서 확인 안내 문구를 화면에서 제거했습니다.
- 생성 예상 시간은 생성 버튼 바로 아래에 표시합니다.
- 생성 제안서 미리보기 왼쪽에 간단한 페이지 번호를 표시합니다.
- 템플릿 카드에 실제 PPTX 첫 슬라이드 이미지를 표시합니다.
- 템플릿 이미지를 누르면 팝업에서 세로 스크롤 또는 바둑판 전체 보기가 가능합니다.
- PPTX는 PowerPoint/LibreOffice로 PDF 변환 후 `pypdfium2`로 PNG를 만들고 캐시합니다.
- 개발 모드의 중복 변환 요청이 충돌하지 않도록 서버 잠금을 적용했습니다.

주요 구현 파일:

- `web/components/proposal/ProposalWorkspace.tsx`
- `web/components/proposal/TemplateGallery.tsx`
- `web/components/proposal/ProposalPreviewModal.tsx`
- `web/components/chat/BidChatWindow.tsx`
- `server/bids/services/proposal_preview.py`
- `server/bids/services/rag/proposal.py`
- `server/bids/services/proposal_pptx_renderer.py`
- `server/bids/views.py`

## 현재 제안서 템플릿

| ID | 이름 | 실제 기본 슬라이드 | 용도 |
|---|---|---:|---|
| `corporate` | 코퍼레이트 블루 | 13장 | 안정적인 기본형 |
| `modern` | 모던 네이비 | 13장 | 간결한 전문형 |
| `public` | 공공입찰 실무형 | 30장 | 요구사항·평가항목 중심 기본 템플릿 |

웹은 PPTX의 실제 슬라이드 수를 읽어 템플릿 팝업에 표시합니다. 제안서 생성 목표 분량과
최종 최대 분량은 생성 규칙에서 별도로 관리합니다.

## AI 기능 구분

- 공고 질문: 현재 공고의 첨부문서 RAG만 근거로 답하고 출처를 표시합니다.
- 제안서 수정: 현재 생성된 제안서와 사용자 요청을 반영합니다.
- 회사 자료: 처음 분석한 결과를 `CompanyKnowledgeItem`에 출처와 함께 저장해 재사용합니다.
- 채팅 기록: `BidChatMessage`에 저장되어 다시 로그인해도 유지됩니다.
- 메시지 삭제: DB 행을 바로 지우지 않고 `삭제된 메시지입니다.`로 표시합니다.

## 마지막 검증 결과

- Django `check`: 통과
- Django 전체 자동 테스트: 115개 통과
- 템플릿 미리보기 API 테스트: 통과
- Next.js `npm run lint`: 통과
- Next.js `npm run build`: 통과
- 실제 템플릿 13장/30장 변환 및 세로·바둑판 팝업 확인

## 집에서 바로 할 일

1. `SETUP_NEW_PC.md` 순서대로 환경을 설치합니다.
2. 새 DB이므로 회원가입과 회사정보를 다시 입력합니다.
3. `sync_bids --max-pages 2`로 시험 공고를 수집합니다.
4. 공고 하나를 저장하고 AI 채팅과 제안서 템플릿 팝업을 확인합니다.
5. `TODO.md`의 첫 미완료 항목부터 이어갑니다.

## 주의

- `.env`, `db.sqlite3`, `media`, `chroma_db`는 Git에 없습니다.
- 새 PC의 `test1` 계정과 회사정보는 자동으로 복구되지 않습니다.
- OpenAI 호출은 실제 비용이 발생하므로 기능 테스트는 공고 한 건씩 진행합니다.
- 제안서 생성은 아직 동기식 요청이므로 운영 배포 전 백그라운드 작업 전환이 필요합니다.
