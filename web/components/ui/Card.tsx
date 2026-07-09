type CardProps = {
  children: React.ReactNode;
};

export default function Card({ children }: CardProps) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5">{children}</div>;
}
