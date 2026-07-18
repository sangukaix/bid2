type InputProps = {
  label: string;
  type?: string;
  placeholder?: string;
  name?: string;
  autoComplete?: string;
  defaultValue?: string | number;
  minLength?: number;
  required?: boolean;
};

export default function Input({
  label,
  type = "text",
  placeholder,
  name,
  autoComplete,
  defaultValue,
  minLength,
  required,
}: InputProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        defaultValue={defaultValue}
        minLength={minLength}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}
