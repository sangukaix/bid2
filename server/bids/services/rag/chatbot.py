from pathlib import Path  # 파일 경로에서 파일명만 가져오는 도구

from langchain_core.output_parsers import StrOutputParser  # AI 응답을 문자열로 변환
from langchain_core.prompts import ChatPromptTemplate  # AI 지시문 양식
from langchain_openai import ChatOpenAI  # OpenAI 채팅 모델

from .extract_document import extract_document  # 검색된 Chunk의 원본 문서 위치 불러오기
from .prepare_docs_for_ai import prepare_docs_for_ai  # 공고 문서 Lazy indexing
from .retriever import search_bid_documents  # 관련도에 따라 필요한 Chunk를 검색


CHAT_MODEL = "gpt-4o-mini"  # 수업에서 사용한 저비용 모델
MAX_OUTPUT_TOKENS = 800  # 조건 누락을 줄이면서 답변 비용 제한
MAX_CONTEXT_CHARS = 20000  # AI에게 전달할 원문 전체 길이 제한


prompt = ChatPromptTemplate.from_template(
    """
[역할]
너는 나라장터 입찰공고 문서를 분석하는 AI 챗봇입니다.

[답변 원칙]
- 반드시 아래 검색 문서만 근거로 답변합니다.
- 문서에 없는 내용은 추측하지 않습니다.
- 근거가 부족하면 "제공된 문서에서 확인할 수 없습니다."라고 답합니다.
- 참가 자격처럼 여러 조건이 나열된 질문은 모든 조건을 빠짐없이 정리합니다.
- 문장이 페이지 사이에 이어지면 앞뒤 페이지 내용을 연결해서 해석합니다.
- 핵심 내용 뒤에는 [출처 번호]를 표시합니다.
- 한국어로 간결하고 명확하게 답합니다.

[검색 문서]
{context}

[사용자 질문]
{question}

[답변]
"""
)  # 질문과 검색 문서를 넣을 PromptTemplate


def build_chat_chain():
    """AI를 실제로 호출할 때만 OpenAI 클라이언트를 만듭니다."""

    model = ChatOpenAI(
        model=CHAT_MODEL,
        temperature=0,
        max_completion_tokens=MAX_OUTPUT_TOKENS,
    )  # 같은 문서에는 최대한 일관되게 답변하도록 설정
    return prompt | model | StrOutputParser()
    # Prompt → OpenAI → 문자열 변환 순서로 연결한 LCEL 체인


def build_full_page_context(documents, max_context_chars=MAX_CONTEXT_CHARS):
    """검색된 Chunk가 속한 원본 페이지나 문단 전체를 문맥으로 만듭니다."""

    context_parts = []  # AI에게 전달할 원문 페이지 목록
    sources = []  # 사용자에게 보여줄 출처 목록
    loaded_sources = {}  # 같은 원본 파일을 여러 번 읽지 않도록 임시 보관
    used_locations = set()  # 같은 페이지나 문단이 중복으로 들어가는 것 방지
    context_length = 0  # 현재까지 추가한 원문 글자 수

    for document in documents:
        source = document.metadata.get("source", "")
        element_index = document.metadata.get("element_index")
        location = document.metadata.get("location", "위치 알 수 없음")
        location_key = (source, element_index, location)

        if location_key in used_locations:  # 같은 원문 위치는 한 번만 사용
            continue

        page_content = document.page_content  # 원본 위치를 못 읽으면 Chunk를 대신 사용

        if source and isinstance(element_index, int):
            if source not in loaded_sources:
                loaded_sources[source] = extract_document(source).documents

            source_documents = loaded_sources[source]
            if 0 < element_index <= len(source_documents):
                page_content = source_documents[element_index - 1].page_content

        remaining_length = max_context_chars - context_length
        if remaining_length <= 0:  # 비용 제한을 넘으면 페이지 추가 중단
            break

        page_content = page_content[:remaining_length]
        source_number = len(sources) + 1
        file_name = Path(source).name

        context_parts.append(
            f"[출처 {source_number}: {file_name}, {location}]\n"
            f"{page_content}"
        )
        sources.append(
            {
                "number": source_number,
                "file_name": file_name,
                "location": location,
                "page": location,  # 기존 Next.js 화면과의 호환을 위해 유지
            }
        )

        used_locations.add(location_key)
        context_length += len(page_content)

    return "\n\n".join(context_parts), sources


def ask_bid_question(bid_ntce_no, question):
    """특정 공고 문서를 검색하고 AI 답변을 생성하는 함수."""

    prepare_docs_for_ai(bid_ntce_no)  # 처음 질문한 공고만 다운로드하고 Embedding
    documents = search_bid_documents(bid_ntce_no, question)
    # 넓게 찾은 후보 중 관련도 기준을 통과한 Chunk를 동적으로 선택
    context, sources = build_full_page_context(documents)
    # 검색된 Chunk의 원본 페이지를 AI 문맥과 출처로 정리

    answer = build_chat_chain().invoke(
        {
            "context": context,
            "question": question,
        }
    )  # 검색 문서와 질문을 OpenAI에 전달해 답변 생성

    return {
        "answer": answer,
        "sources": sources,
    }  # AI 답변과 출처를 함께 반환
