type CardProps = {
  children: React.ReactNode;
};

export default function Card({ children }: CardProps) {
  return <div className="app-panel rounded-lg border p-5">{children}</div>;
}
