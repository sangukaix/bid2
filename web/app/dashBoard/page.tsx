import { redirect } from "next/navigation"; // 다른 주소로 바로 이동시키는 Next.js 함수

export default function DashBoardPage() { // /dashBoard 주소로 들어왔을 때 실행되는 페이지
  redirect("/dashBoard/myInfo"); // 대시보드 기본 화면으로 이동
}
