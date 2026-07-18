import json  # Chroma 인덱스 버전과 파일 처리 결과 저장
import shutil  # 이전 PDF 전용 Chroma 인덱스 정리

from bids.models import BidNotice  # DB에 저장된 입찰공고 정보
from bids.services.download_bid_attachment import download_bid_attachment
from bids.services.get_bid_attachments import fetch_bid_attachments

from .extract_document import extract_documents  # 여러 문서 형식의 텍스트 추출
from .split_documents import split_bid_documents  # 긴 문서를 Chunk로 분할
from .vector_store import create_or_load_vector_store, get_bid_db_path


INDEX_VERSION = 2  # 여러 문서 형식과 ZIP을 처리하는 현재 인덱스 버전


def prepare_docs_for_ai(bid_ntce_no):
    """특정 공고의 모든 지원 문서를 AI가 검색할 수 있도록 준비합니다."""

    db_path = get_bid_db_path(bid_ntce_no)
    index_info_path = db_path / "index_info.json"

    if (db_path / "chroma.sqlite3").exists() and index_info_path.exists():
        try:
            index_info = json.loads(index_info_path.read_text(encoding="utf-8"))
            if index_info.get("version") == INDEX_VERSION:  # 현재 방식으로 처리한 공고만 재사용
                return {
                    "created": False,
                    "message": "기존 Chroma DB를 재사용합니다.",
                    **index_info,
                }
        except json.JSONDecodeError:
            pass  # 손상된 버전 파일은 아래에서 Chroma와 함께 다시 생성

    if db_path.exists():
        shutil.rmtree(db_path)  # 이전 PDF 전용 인덱스는 새 방식으로 다시 생성

    bid_notice = (
        BidNotice.objects.filter(bid_ntce_no=bid_ntce_no)
        .order_by("-bid_ntce_ord")
        .first()
    )  # DB에서 해당 공고의 최신 차수 가져오기

    if bid_notice is None:
        raise ValueError("DB에서 해당 입찰공고를 찾을 수 없습니다.")

    attachments = fetch_bid_attachments(
        bid_ntce_no=bid_notice.bid_ntce_no,
        business_type=bid_notice.business_type,
        bid_ntce_ord=bid_notice.bid_ntce_ord,
    )  # 나라장터 API에서 공고 첨부파일 목록 가져오기

    if not attachments:
        raise ValueError("AI가 처리할 첨부파일이 없습니다.")

    file_paths = []  # 정상적으로 다운로드한 전체 첨부파일 경로
    download_failures = []  # 다운로드하지 못한 파일과 이유

    for attachment in attachments:
        try:
            file_paths.append(download_bid_attachment(bid_ntce_no, attachment))
        except Exception as error:
            download_failures.append(
                {"file_name": attachment.get("filename", "알 수 없음"), "reason": str(error)}
            )

    extraction = extract_documents(file_paths)  # 모든 파일을 공통 Document 형태로 변환
    failed_files = download_failures + extraction.failed_files

    if not extraction.documents:
        raise ValueError("첨부파일에서 AI가 읽을 수 있는 텍스트를 추출하지 못했습니다.")

    chunks = split_bid_documents(extraction.documents)  # 전체 문서를 검색용 Chunk로 분할
    vector_store = create_or_load_vector_store(bid_ntce_no, chunks)
    index_info = {
        "version": INDEX_VERSION,
        "attachment_count": len(attachments),
        "processed_files": extraction.processed_files,
        "failed_files": failed_files,
        "chunk_count": vector_store._collection.count(),
    }
    index_info_path.write_text(
        json.dumps(index_info, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )  # 다시 질문할 때 파일 처리 상태와 Chroma를 그대로 재사용

    return {
        "created": True,
        "message": "첨부 문서를 새 Chroma DB에 저장했습니다.",
        **index_info,
    }
