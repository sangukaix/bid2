type FormSectionProps = { // FormSection 컴포넌트가 받을 값들의 타입
  title: string; // 각 입력 영역의 제목
  description: string; // 제목 아래에 보이는 짧은 설명
  children: React.ReactNode; // 영역 안에 들어갈 입력 요소들
};

export default function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6"> {/* 하나의 입력 주제를 묶는 영역 */}
      <div className="border-b border-slate-100 pb-4"> {/* 영역 제목과 입력칸을 시각적으로 구분 */}
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2"> {/* PC에서는 2열, 작은 화면에서는 1열로 배치 */}
        {children} {/* CompanyForm에서 전달한 입력 요소가 표시되는 자리 */}
      </div>
    </section>
  );
}
