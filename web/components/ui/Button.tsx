type ButtonProps = {
  children: React.ReactNode;
};

export default function Button({ children }: ButtonProps) {
  return (
    <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white" type="button">
      {children}
    </button>
  );
}
