import type { BidNotice } from "@/types/bid"; // 입찰공고 한 건의 TypeScript 자료형 가져오기


type BidApiResponse = { // Django가 보내주는 JSON 데이터 형태
  items: BidNotice[]; // items에는 입찰공고 여러 건이 배열로 들어옴
};


export default async function BidTable() { // 입찰 데이터를 서버에서 가져오는 서버 컴포넌트
  const response = await fetch( // Django API의 응답을 기다렸다가 response 변수에 저장
    "http://127.0.0.1:8000/api/bids/",
  );

  const data: BidApiResponse = await response.json(); // JSON 응답을 JavaScript 객체로 변환
  const bids = data.items; // JSON의 items 목록을 bids 변수에 저장

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* 검색 결과 제목과 공고 개수를 보여주는 영역 */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-bold text-slate-950">
          검색 결과
        </h2>

        <p className="text-sm text-slate-500">
          총 {bids.length}건 {/* bids 배열에 들어 있는 공고 개수 표시 */}
        </p>
      </div>

      {/* 화면이 좁을 때 표를 가로로 스크롤할 수 있게 하는 영역 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3 font-semibold" scope="col">
                업무
              </th>

              <th className="px-5 py-3 font-semibold" scope="col">
                공고명
              </th>

              <th className="px-5 py-3 font-semibold" scope="col">
                계약 방법
              </th>

              <th className="px-5 py-3 font-semibold" scope="col">
                기초 금액
              </th>

              <th className="px-5 py-3 font-semibold" scope="col">
                공고일
              </th>

              <th className="px-5 py-3 font-semibold" scope="col">
                마감일
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {bids.map((bid) => ( // 입찰공고를 한 건씩 꺼내서 표의 행으로 반복 출력
              <tr
                key={bid.bidNtceNo} // 각 행을 구분하는 고유한 공고 번호
                className="hover:bg-slate-50"
              >
                <td className="px-5 py-4 text-slate-600">
                  {bid.bsnsDivNm} {/* 업무 구분 */}
                </td>

                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-950">
                    {bid.bidNtceNm} {/* 입찰공고 이름 */}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {bid.bidNtceNo} {/* 입찰공고 번호 */}
                  </p>
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {bid.cntrctCnclsMthdNm} {/* 계약 방법 */}
                </td>

                <td className="px-5 py-4 text-slate-400">
                  - {/* 기초 금액은 다음 단계에서 연결 */}
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {bid.bidNtceDate} {/* 공고 날짜 */}
                </td>

                <td className="px-5 py-4 text-slate-400">
                  - {/* 마감일은 다음 단계에서 연결 */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}