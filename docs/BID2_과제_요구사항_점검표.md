# BID2 과제 요구사항 점검표

> 검토 기준: `생성형 AI 활용 챗봇 or 서비스 웹앱 개발 수행과제.pdf` 5쪽 전체  
> 검토일: 2026-07-19  
> 목적: 과제 요구사항과 현재 BID2 구현을 대조하고, 제출 전 보완할 항목을 정리한다.

## 1. 최종 판단

BID2는 나라장터 입찰공고를 수집하고, 회사 조건에 맞는 공고를 추천하며, 공고 첨부문서를 RAG로 검색해 질의응답과 회사 적합도 분석을 제공하는 AI 서비스이다.

핵심 서비스, LangChain, RAG, Prompt 설계는 과제 방향에 맞게 구현되어 있다. 다만 현재 상태를 완전한 제출 준비 상태로 보기는 어렵다. 제출 전에 다음 항목을 우선 보완해야 한다.

1. LLM 파라미터 비교 실험 2종 이상과 결과표 작성
2. 실제 `system`과 `human` 역할이 분리된 System Prompt 구성
3. 엄격한 채점에 대비한 LLM Function Calling Tool 1개 구현
4. 필수 실행 화면 5종 캡처
5. 루트 README와 환경변수 예시 정리
6. 메인 화면의 미구현 기능 안내 문구 정리
7. 테스트와 빌드 재검증 후 전체 변경사항 커밋 및 제출

## 2. 과제 요구사항별 점검

| 과제 요구사항 | 상태 | BID2 구현 및 점검 내용 |
|---|---|---|
| 실제 문제를 해결하는 AI 서비스 | 완료 | 나라장터 공고 수집, 검색, 추천, 저장, 문서 질의응답, 회사 적합도 분석을 제공한다. |
| 명확한 목적과 Role | 완료 | 입찰공고 탐색과 공고문 검토 시간을 줄이고, 회사 조건과 공고 조건을 비교하는 목적이 명확하다. |
| 생성형 AI 활용 | 완료 | `gpt-4o-mini`를 사용하여 RAG 질의응답과 구조화된 AI 분석 보고서를 생성한다. |
| Persona | 완료 | 공고문 질의응답용 AI 챗봇과 회사 적합도 분석용 입찰 검토 전문가 Persona가 정의되어 있다. |
| Prompt 출력 형식 제어 | 완료 | 챗봇은 출처 표시와 간결한 답변 원칙을 사용하고, AI 분석은 Pydantic 구조화 출력을 사용한다. |
| Prompt 금지사항과 제약 | 완료 | 검색 문서 밖의 내용을 추측하지 않고, 근거가 부족하면 확인할 수 없다고 답하도록 제한한다. |
| System Prompt | 부분 완료 | Prompt 내용에는 역할과 규칙이 있으나, 현재 `ChatPromptTemplate.from_template()`을 사용하므로 LangChain 메시지의 실제 `system` 역할과 `human` 역할이 분리되어 있지 않다. |
| Prompt 설계 의도 문서 | 완료 | `BID2_과제_설계_문서.md`에 Persona, Prompt 내용, 설계 의도, 환각 억제 원칙이 정리되어 있다. |
| Temperature 설정 | 완료 | 챗봇과 AI 분석 모두 `temperature=0`으로 설정되어 있다. |
| max_tokens 설정 | 완료 | 챗봇은 최대 800, AI 분석은 최대 3,500 completion tokens로 제한한다. |
| 파라미터 비교 분석 | 미완료 | 설정값은 있으나 서로 다른 Temperature, token 제한, Prompt 등의 결과를 비교한 실험표가 없다. |
| LangChain 기능 2개 이상 | 완료 | ChatPromptTemplate, LCEL, StrOutputParser, Pydantic 구조화 출력을 사용한다. |
| 데이터 수집 및 문서 준비 | 완료 | 나라장터 API에서 공고와 첨부파일 정보를 가져오고 필요한 문서를 다운로드한다. |
| Document Loader | 완료 | PDF, HWP/HWPX, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, XML, ZIP 등 다양한 문서를 공통 Document 형태로 변환한다. |
| Text Splitter | 완료 | `RecursiveCharacterTextSplitter`로 500자 Chunk와 100자 overlap을 적용한다. |
| Embedding | 완료 | `text-embedding-3-small`로 문서와 질문을 벡터화한다. |
| Vector DB | 완료 | 공고번호별 Chroma DB와 collection을 생성하고 정상 인덱스를 재사용한다. |
| Retriever | 완료 | 최대 30개 후보를 검색하고 관련도 0.2 이상을 선택하며, 결과가 부족하면 상위 5개를 보완한다. |
| Retrieval 기반 응답 | 완료 | 검색 Chunk가 포함된 원문 페이지 또는 문단을 복원하여 LLM에 전달하고 답변과 출처를 반환한다. |
| Tool 활용 | 부분 완료 | 나라장터 API, 첨부파일 다운로드, DB 조회 등 외부 API와 사용자 정의 함수를 사용한다. 일반적인 Tool 활용에는 해당한다. |
| Tool Function Calling | 미완료 가능성 | 현재 Django 코드가 정해진 순서로 함수를 호출한다. LLM이 Tool을 선택하는 `bind_tools`, `@tool`, Agent 또는 Tool Calling 구조는 없다. 과제의 `Tool(Function Calling)`을 엄격히 해석하면 보완이 필요하다. |
| RAG와 Tool 결합 | 부분 완료 | 하나의 서비스에서 나라장터 API Tool과 RAG를 함께 사용하지만, 하나의 LLM Agent Chain 안에서 Tool을 선택·호출하는 구조는 아니다. |
| 환각 억제 | 완료 | 검색 문서만 근거로 사용하고, 출처를 표시하며, 근거 부족 시 답변을 제한하고, Temperature를 0으로 설정한다. |
| 환각 분석표 | 선택사항·미작성 | 정확도, 근거 제시, RAG 적용 전후의 환각 감소를 비교한 별도 평가표는 없다. 필수는 아니지만 발표 자료로 권장된다. |
| 실행 코드 | 부분 완료 | 로컬 프로젝트는 실행 가능하지만 현재 주요 변경사항과 `docs` 문서가 아직 Git에 커밋되지 않았다. |
| Prompt 설계 제출 문서 | 완료 | `BID2_과제_설계_문서.md`에 Persona, System Prompt 내용, 설계 의도가 들어 있다. |
| LangChain 구성 설명 | 완료 | 같은 문서에 Chain 구조, Prompt, Retriever, Output Parser가 설명되어 있다. |
| 실행 화면 캡처 | 미완료 | 메인 화면, 질의응답, Tool 실행, RAG 검색 결과, 최종 응답의 제출용 이미지가 아직 준비되지 않았다. |

## 3. 현재 RAG 처리 구조

```text
나라장터 첨부문서
`-- 문서 다운로드
    `-- PDF, HWP, Word, Excel 등 텍스트 추출
        `-- 500자 Chunk + 100자 overlap
            `-- text-embedding-3-small
                `-- 공고별 Chroma 저장
                    `-- 최대 30개 후보 검색
                        `-- 관련도 0.2 이상 선택
                            `-- 결과가 부족하면 상위 5개 보완
                                `-- 원문 페이지 또는 문단 복원
                                    `-- gpt-4o-mini 답변 생성
                                        `-- 답변과 출처 반환
```

단순히 검색된 짧은 Chunk만 LLM에 전달하지 않고, 검색 Chunk가 포함된 원문 페이지 또는 문단을 복원해서 전달한다. 따라서 문장 앞뒤의 조건을 함께 확인할 수 있고, 참가 자격이나 제출 서류처럼 여러 조건이 연결된 질문에서 누락을 줄일 수 있다.

## 4. LangChain 적용 내용

### 4.1 챗봇 Chain

```text
공고 문서 준비
-> Chroma Retriever
-> 검색 위치의 원문 복원
-> ChatPromptTemplate
-> ChatOpenAI
-> StrOutputParser
-> 답변과 출처 반환
```

적용 요소:

- `ChatPromptTemplate`
- LCEL: `prompt | model | StrOutputParser()`
- `StrOutputParser`
- OpenAI Embedding과 Chroma Retriever

### 4.2 AI 분석 Chain

```text
회사정보
+ 공고 개요 Query 검색
+ 참가 자격 Query 검색
+ 평가·제출서류 Query 검색
+ 과업·위험요소 Query 검색
-> 검색 결과 중복 제거
-> 원문 복원
-> ChatPromptTemplate
-> ChatOpenAI
-> BidAnalysisSchema 구조화 출력
-> DB 저장 및 화면·PDF 표시
```

AI 분석은 `.with_structured_output(BidAnalysisSchema)`를 사용하므로, 모델 응답을 자유로운 문장이 아닌 정해진 JSON 구조로 받는다. 이 방식은 화면과 PDF에서 항상 같은 필드 구조를 사용할 수 있게 한다.

## 5. Prompt 점검

현재 Prompt에는 다음 요소가 포함되어 있다.

- 나라장터 공고문 분석 전문가 역할
- 검색 문서만 근거로 사용
- 문서에 없는 내용 추측 금지
- 근거가 부족한 경우 확인할 수 없다고 응답
- 여러 조건을 빠짐없이 정리
- 출처 번호 표시
- 한국어로 간결하고 명확하게 답변
- AI 분석 결과가 낙찰확률이 아닌 회사와 공고의 적합도라는 제한

다만 과제에서 System Prompt를 반드시 포함하라고 했으므로, 제출 안전성을 위해 다음과 같이 실제 메시지 역할을 분리하는 것이 좋다.

```python
ChatPromptTemplate.from_messages([
    ("system", "역할, 규칙, 금지사항, 출력 원칙"),
    ("human", "검색 문서와 사용자 질문"),
])
```

CoT, few-shot, Top-p, Memory, Agent는 과제 문서상 모든 항목을 전부 사용해야 하는 것은 아니다. 현재 BID2는 필요한 Prompt 기법과 LangChain 기능을 선택해 사용하고 있으므로, 이 항목들이 없다는 사실만으로 미완성은 아니다.

## 6. 파라미터 비교 실험 보완안

과제는 다음 항목 중 2개 이상을 비교하고 결과를 표로 정리하도록 요구한다. 현재 서비스 설정은 그대로 유지하면서, 동일한 공고와 동일한 질문으로 별도 실험을 진행하면 된다.

### 6.1 권장 실험

| 실험 | 비교값 | 확인할 내용 |
|---|---|---|
| Temperature | `0` vs `0.7` | 답변 변동성, 추측 증가 여부, 조건 누락 여부 |
| 최대 출력 tokens | `200` vs `800` | 답변 잘림, 필수 조건 포함 여부, 불필요한 장문 여부 |

### 6.2 결과표 예시

| 실험 조건 | 정확성 | 조건 누락 | 출처 표시 | 답변 길이 | 응답 시간 | 평가 |
|---|---|---|---|---|---|---|
| Temperature 0 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 |
| Temperature 0.7 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 |
| max_tokens 200 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 |
| max_tokens 800 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 | 실험 후 작성 |

최종 설명은 실험 결과에 따라 작성해야 하지만, 입찰 문서 분석은 창의성보다 근거, 정확성, 일관성이 중요하므로 낮은 Temperature를 선택한 이유를 설명하기 좋다.

## 7. Function Calling 보완안

현재 나라장터 API 호출은 실제 외부 Tool 활용이지만 LLM Function Calling은 아니다. 채점 위험을 줄이려면 다음 중 하나를 LangChain Tool 또는 OpenAI Tool Calling으로 구현할 수 있다.

- 공고번호로 DB의 공고 기본정보 조회
- 공고 마감일까지 남은 날짜 계산
- 사용자의 저장 공고 목록 조회
- 공고 첨부문서 준비 상태 확인

예를 들어 사용자가 “이 공고는 며칠 남았어?”라고 질문했을 때 LLM이 마감일 계산 Tool을 선택하고, Tool 결과를 받아 최종 답변을 생성하도록 구성하면 Function Calling 실행 과정을 명확히 시연할 수 있다.

## 8. 필수 실행 화면 준비

| 과제 필수 화면 | BID2에서 캡처할 화면 |
|---|---|
| 메인 화면 | `/mainPage`의 서비스 소개 화면 |
| 질의응답 | 저장 공고의 AI 챗봇에서 질문과 답변이 함께 보이는 화면 |
| Tool 실행 | 입찰공고 목록에서 마지막 업데이트 버튼을 누른 장면과 완료 결과 |
| RAG 검색 결과 | AI 답변 아래 출처 파일명과 문서 위치가 표시된 화면 |
| 최종 응답 | 공고문 답변 또는 회사 적합도 AI 분석 보고서 화면 |

Function Calling을 추가한다면 Tool 실행 화면은 LLM이 Tool을 호출한 기록이나 결과까지 함께 보이게 준비하는 것이 가장 명확하다.

## 9. 제출 자료 점검

### 9.1 이미 준비된 문서

- `docs/BID2_과제_설계_문서.md`
  - 전체 아키텍처
  - React, Next.js, Django 역할
  - Persona
  - Prompt와 설계 의도
  - LangChain Chain 구조
  - Retriever
  - Output Parser
  - OpenAI와 RAG 설정
- `docs/BID2_프로젝트_폴더_구조.md`
  - 실제 프로젝트 트리
  - 폴더 및 주요 파일 역할
  - 프론트엔드, 백엔드, DB, RAG 데이터 흐름

### 9.2 추가 정리가 필요한 자료

- 파라미터 비교 실험 결과표
- 실행 화면 5종
- 프로젝트 설치·실행·환경변수·테스트 방법이 들어간 루트 README
- `server/.env.example`의 `OPENAI_API_KEY=` 변수명 예시
- 전체 변경사항의 Git 커밋과 원격 저장소 반영

실제 API Key 값은 문서, 채팅, Git에 넣지 않는다. `.env.example`에는 변수명과 빈 값만 기록한다.

## 10. 시연 내용과 실제 구현의 일치 여부

메인 화면에는 현재 다음 기능이 구현된 것처럼 안내되어 있다.

- 제안서 초안 작성
- 제안서 자동 생성
- 낙찰성공률 분석

하지만 현재 제안서 제작 버튼은 비활성화되어 있고, AI가 계산하는 점수는 낙찰확률이 아니라 회사정보와 공고 조건의 적합도이다. 제출 시연에서 오해가 생기지 않도록 다음 중 하나가 필요하다.

1. 현재 구현에 맞게 메인 화면 문구를 수정한다.
2. 해당 기능을 실제로 구현한다.

과제 제출 시에는 구현되지 않은 기능을 현재 제공 기능처럼 설명하지 않는 것이 안전하다.

## 11. 제출 전 최종 체크리스트

- [x] 실제 문제를 해결하는 AI 서비스 기획
- [x] OpenAI 생성형 AI 적용
- [x] Persona와 Role 정의
- [x] Prompt 규칙, 제약, 출력 형식, 금지사항 정의
- [x] LangChain 기능 2개 이상 적용
- [x] 문서 Loader 구현
- [x] Text Splitter 적용
- [x] Embedding 생성
- [x] Chroma Vector DB 저장
- [x] Retriever 구성
- [x] Retrieval 기반 답변 생성
- [x] Prompt 설계 문서 작성
- [x] LangChain 구성 설명 작성
- [ ] 실제 `system` 역할 메시지로 Prompt 분리
- [ ] LLM Function Calling Tool 1개 구현 또는 채점 기준 확인
- [ ] 파라미터 비교 실험 2종 이상 수행
- [ ] 파라미터 비교 결과표 작성
- [ ] 메인 화면 캡처
- [ ] 질의응답 화면 캡처
- [ ] Tool 실행 화면 캡처
- [ ] RAG 검색 결과 캡처
- [ ] 최종 응답 화면 캡처
- [ ] 루트 README 작성
- [ ] `.env.example` 변수명 정리
- [ ] 메인 화면과 실제 구현 기능의 안내 문구 일치
- [ ] Django migration 및 check 재확인
- [ ] 백엔드 전체 테스트 재실행
- [ ] 프론트엔드 `npm run build` 재실행
- [ ] 변경사항 전체 Git 커밋 및 제출 저장소 반영

## 12. 관련 코드 및 문서 위치

| 내용 | 위치 |
|---|---|
| 과제 설계 문서 | `docs/BID2_과제_설계_문서.md` |
| 프로젝트 구조 문서 | `docs/BID2_프로젝트_폴더_구조.md` |
| 챗봇 Prompt와 Chain | `server/bids/services/rag/chatbot.py` |
| AI 분석 Prompt와 구조화 출력 | `server/bids/services/rag/analysis.py` |
| Retriever 설정 | `server/bids/services/rag/retriever.py` |
| Text Splitter | `server/bids/services/rag/split_documents.py` |
| Embedding과 Chroma | `server/bids/services/rag/vector_store.py` |
| 문서 준비와 인덱싱 | `server/bids/services/rag/prepare_docs_for_ai.py` |
| 문서 형식별 추출 | `server/bids/services/rag/extract_document.py` |
| 나라장터 공고 API | `server/bids/services/g2b_api.py` |
| 첨부파일 조회 | `server/bids/services/get_bid_attachments.py` |
| 첨부파일 다운로드 | `server/bids/services/download_bid_attachment.py` |
| 메인 화면 안내 문구 | `web/app/mainPage/page.tsx` |

---

이 문서는 2026-07-19 현재 로컬 BID2 코드와 과제 PDF를 대조한 결과이다. 이후 Function Calling, System Prompt 역할 분리, 실험표, 실행 화면 등이 추가되면 체크 상태와 설명을 함께 갱신해야 한다.
