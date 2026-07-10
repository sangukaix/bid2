export default function MyInfoPage() { // /dashBoard/myInfo 주소에서 보이는 내 정보 페이지
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6"> {/* 내 정보 내용을 담는 영역 */}
      <h1 className="text-2xl font-bold">내 정보</h1>
      <p className="mt-2 text-sm text-slate-600">회원 이름, 이메일 같은 기본 정보가 들어갈 화면입니다.</p>
    </section>
  );
}
