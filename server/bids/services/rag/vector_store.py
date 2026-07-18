from pathlib import Path  # 파일과 폴더 경로를 다루는 Python 도구

from django.conf import settings  # Django의 BASE_DIR 설정 가져오기
from langchain_chroma import Chroma  # Embedding과 Chunk를 저장하는 벡터 DB
from langchain_openai import OpenAIEmbeddings  # 텍스트를 숫자 벡터로 변환


EMBEDDING_MODEL = "text-embedding-3-small"  # 비용이 낮은 OpenAI Embedding 모델


def get_bid_db_path(bid_ntce_no):  # 공고별 Chroma 저장 경로를 안전하게 만드는 함수
    db_root = (Path(settings.BASE_DIR) / "chroma_db").resolve()
    db_path = (db_root / bid_ntce_no).resolve()

    if db_root not in db_path.parents:
        raise ValueError("올바르지 않은 공고번호입니다.")

    return db_path


def get_collection_name(bid_ntce_no):  # 저장과 검색에서 같은 컬렉션 이름 사용
    return f"bid_{bid_ntce_no.lower()}"


def create_or_load_vector_store(bid_ntce_no, chunks):  # 공고번호와 Chunk 목록을 받는 함수
    if not chunks:  # Chunk가 비어 있으면 실행 중단
        raise ValueError("저장할 Chunk가 없습니다.")

    db_path = get_bid_db_path(bid_ntce_no)  # 공고별 저장 폴더
    collection_name = get_collection_name(bid_ntce_no)  # 공고별 컬렉션 이름

    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)  # Embedding 도구 준비

    if db_path.exists():  # 해당 공고의 Chroma 폴더가 이미 있는지 확인
        vector_store = Chroma(
            collection_name=collection_name,  # 기존 공고 컬렉션 선택
            persist_directory=str(db_path),  # 기존 Chroma 저장 폴더 연결
            embedding_function=embeddings,  # 질문도 같은 모델로 Embedding
        )

        if vector_store._collection.count() > 0:  # 저장된 Chunk가 있는지 확인
            return vector_store  # 기존 DB를 반환하여 재Embedding과 비용 발생 방지

    for chunk in chunks:  # 각각의 Chunk를 하나씩 확인
        chunk.metadata["bid_ntce_no"] = bid_ntce_no  # Chunk 출처에 공고번호 추가

    vector_store = Chroma.from_documents(
        documents=chunks,  # 저장할 Chunk 목록
        embedding=embeddings,  # Chunk를 벡터로 변환할 도구
        collection_name=collection_name,  # 공고별 Chroma 컬렉션 이름
        persist_directory=str(db_path),  # 벡터 DB를 영구 저장할 위치
    )  # 처음 실행될 때만 OpenAI Embedding 비용 발생

    return vector_store  # Retriever에서 사용할 Chroma 객체 반환
