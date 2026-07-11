export interface BidNotice { // 입찰공고 한 건의 데이터 형태를 정의
  bidNtceNo: string; // 입찰공고 번호
  bidNtceNm: string; // 입찰공고 이름
  bsnsDivNm: string; // 업무 구분
  cntrctCnclsMthdNm: string; // 계약 방법
  bidNtceDate: string; // 공고 날짜
}