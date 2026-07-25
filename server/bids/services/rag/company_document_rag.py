import json
import shutil
from pathlib import Path

from django.conf import settings
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

from .extract_document import extract_document
from .split_documents import split_bid_documents
from .vector_store import EMBEDDING_MODEL


INDEX_VERSION = 1
MAX_SEARCH_CANDIDATES = 30
MIN_RELEVANCE_SCORE = 0.2
MIN_SEARCH_RESULTS = 5


def get_company_document_db_path(document):
    """사용자와 회사 문서별로 분리된 Chroma 저장 경로를 만듭니다."""

    db_root = (Path(settings.BASE_DIR) / "chroma_db" / "company_documents").resolve()
    db_path = (db_root / f"user_{document.user_id}" / f"document_{document.id}").resolve()

    if db_root not in db_path.parents:
        raise ValueError("올바르지 않은 회사 문서 경로입니다.")

    return db_path


def get_company_document_collection_name(document):
    return f"company_document_{document.id}"


def _get_manifest_path(document):
    return get_company_document_db_path(document) / "index.json"


def _load_manifest(document):
    try:
        return json.loads(_get_manifest_path(document).read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def get_company_document_vector_store(document):
    """이미 생성된 회사 문서 Chroma DB를 불러옵니다."""

    db_path = get_company_document_db_path(document)
    if not db_path.exists():
        raise ValueError("회사 제안서의 Chroma DB가 없습니다.")

    return Chroma(
        collection_name=get_company_document_collection_name(document),
        persist_directory=str(db_path),
        embedding_function=OpenAIEmbeddings(model=EMBEDDING_MODEL),
    )


def prepare_company_document_for_ai(document):
    """회사 문서를 최초 1회만 추출·분할·Embedding합니다."""

    manifest = _load_manifest(document)
    if manifest and manifest.get("version") == INDEX_VERSION:
        vector_store = get_company_document_vector_store(document)
        if vector_store._collection.count() > 0:
            return {
                **manifest,
                "reused": True,
                "message": "기존 회사 제안서 Chroma DB를 재사용합니다.",
            }

    extraction = extract_document(document.file.path)
    if not extraction.documents:
        reason = (
            extraction.failed_files[0]["reason"]
            if extraction.failed_files
            else "텍스트가 없습니다."
        )
        raise ValueError(f"기존 제안서를 읽지 못했습니다: {reason}")

    chunks = split_bid_documents(extraction.documents)
    for chunk in chunks:
        chunk.metadata.update(
            {
                "company_document_id": document.id,
                "user_id": document.user_id,
                "original_name": document.original_name,
            }
        )

    db_path = get_company_document_db_path(document)
    if db_path.exists():
        shutil.rmtree(db_path)
    db_path.mkdir(parents=True, exist_ok=True)

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=OpenAIEmbeddings(model=EMBEDDING_MODEL),
        collection_name=get_company_document_collection_name(document),
        persist_directory=str(db_path),
    )

    manifest = {
        "version": INDEX_VERSION,
        "chunk_count": vector_store._collection.count(),
        "processed_files": extraction.processed_files,
        "failed_files": extraction.failed_files,
    }
    _get_manifest_path(document).write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return {
        **manifest,
        "reused": False,
        "message": "회사 제안서를 새 Chroma DB에 저장했습니다.",
    }


def search_company_document(document, question):
    """질문과 관련된 회사 제안서 Chunk를 점수에 따라 선택합니다."""

    prepare_company_document_for_ai(document)
    vector_store = get_company_document_vector_store(document)
    stored_chunk_count = vector_store._collection.count()
    candidate_count = min(stored_chunk_count, MAX_SEARCH_CANDIDATES)

    if candidate_count == 0:
        raise ValueError("회사 제안서에 저장된 Chunk가 없습니다.")

    results = vector_store.similarity_search_with_relevance_scores(
        question,
        k=candidate_count,
    )
    relevant_documents = [
        chunk for chunk, score in results if score >= MIN_RELEVANCE_SCORE
    ]

    if len(relevant_documents) < MIN_SEARCH_RESULTS:
        return [chunk for chunk, _score in results[:MIN_SEARCH_RESULTS]]

    return relevant_documents
