type InputProps = {
  label: string;
  type?: string;
  placeholder?: string;
};

export default function Input({ label, type = "text", placeholder }: InputProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}
