export default function BidTable() { // API에서 받은 입찰공고들이 표시될 표 영역
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"> {/* 표 제목 영역 */}
        <h2 className="text-base font-bold text-slate-950">검색 결과</h2>
        <p className="text-sm text-slate-500">총 0건</p>
      </div>

      <div className="overflow-x-auto"> {/* 작은 화면에서는 표만 가로로 스크롤 */}
        <table className="min-w-[840px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3 font-semibold" scope="col">업무</th>
              <th className="px-5 py-3 font-semibold" scope="col">공고명 / 발주기관</th>
              <th className="px-5 py-3 font-semibold" scope="col">계약방법</th>
              <th className="px-5 py-3 font-semibold" scope="col">기초금액</th>
              <th className="px-5 py-3 font-semibold" scope="col">공고일</th>
              <th className="px-5 py-3 font-semibold" scope="col">마감일</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="px-5 py-16 text-center text-slate-500" colSpan={6}> {/* 더미 공고 대신 빈 목록 상태 표시 */}
                표시할 입찰공고가 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
