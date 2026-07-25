# BID2 TODO

작성일: 2026-07-25  
기준 커밋: `3ea9c1e`

> 완료 여부를 관리하는 작업 목록이다. 기능의 연결 구조는 `docs/MAPPING.md`,
> 작업 장소를 옮길 때의 설명은 `docs/HANDOFF.md`에서 확인한다.

## 최우선: 제안서 RAG와 분량 제한 완성

- [ ] `server/bids/services/proposal_document.py`
  - Word 페이지 구분에서 빈 페이지가 생기지 않도록 정리
  - 최대 페이지 제한이 DOCX와 PPTX 모두에서 지켜지는지 확인
- [ ] `server/bids/views.py`
  - `length_mode` 요청값 검증
  - `short`, `standard`, `detailed`만 허용
  - `generate_bid_proposal()`에 선택값 전달
- [ ] `web/components/proposal/ProposalGeneratorButton.tsx`
  - 간단형 15쪽, 표준형 30쪽, 상세형 50쪽 선택 UI 추가
  - 기본값은 표준형 30쪽
  - POST 요청에 `length_mode` 포함
- [ ] `web/types/bid.ts`
  - `length_mode`, `page_limit`, `estimated_pages` 자료형 추가
  - 기존 제안서 Chunk 처리 정보 자료형 추가
- [ ] 회사 제안서 RAG 테스트 추가
  - 처음 실행 시 인덱스 생성
  - 두 번째 실행 시 기존 Chroma 재사용
  - 다른 사용자의 문서 DB와 분리
- [ ] 페이지 배분 테스트 추가
  - 간단형 본문 11쪽
  - 표준형 본문 26쪽
  - 상세형 본문 46쪽
- [ ] API 테스트 추가
  - 잘못된 분량 값 거절
  - 분량 값이 생성 서비스에 전달되는지 확인

## 검증

- [ ] Python 문법 검사
- [ ] `manage.py check`
- [ ] 제안서 관련 Django 테스트
- [ ] Django 전체 테스트
- [ ] Next.js `npm run build`
- [ ] 실제 작은 DOCX 제안서로 15쪽 생성 시험
- [ ] 같은 문서로 재실행했을 때 Embedding을 다시 하지 않는지 확인
- [ ] 비용 확인 후 30쪽 시험
- [ ] 50쪽 시험은 마지막에 1회만 진행

## 제안서 품질 확인

- [ ] 공고의 모든 처리 가능한 첨부문서가 인덱싱되는지 확인
- [ ] 기존 제안서의 회사 강점과 문체가 반영되는지 확인
- [ ] 이전 발주처명·사업명·금액이 잘못 복사되지 않는지 확인
- [ ] 확인되지 않은 정보가 임의 생성되지 않는지 확인
- [ ] 공고문에 페이지 제한이 있으면 사용자 선택보다 우선하도록 설계
- [ ] 출처 파일명과 페이지·문단 위치가 결과에 남는지 확인
- [ ] 생성된 Word/PPT의 실제 페이지 수와 레이아웃 확인

## 문서 갱신

- [x] `docs/HANDOFF.md`를 2026-07-25 현재 상태로 갱신
- [ ] `docs/BID2_과제_설계_문서.md`에 제안서 RAG 구조 추가
- [x] 오래된 폴더 구조 문서를 삭제하고 `docs/MAPPING.md`로 통합
- [ ] `docs/BID2_과제_요구사항_점검표.md`의 제안서 미구현 표시 갱신
- [ ] 테스트 결과와 실제 OpenAI 설정표 갱신
- [ ] 완료 후 `docs/MAPPING.md`의 상태 표시 갱신

## 집 컴퓨터에서 시작

```powershell
cd <집 컴퓨터의 bid2 경로>
git pull
git log -3 --oneline --decorate
git status
```

Codex 요청 문장:

> `docs/HANDOFF.md`, `docs/MAPPING.md`, `docs/TODO.md`를 읽고 실제 코드와 비교해줘.
> TODO의 최우선 작업부터 이어서 진행하고, 실제 OpenAI 호출 전에는 Mock 테스트와
> Django check, Next.js build를 먼저 실행해줘.
