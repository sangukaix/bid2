type StepCardProps = {
  title: string;
  description: string;
};

export default function StepCard({ title, description }: StepCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 text-left">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
