"use client";

type Props = {
  label: string;
  unit?: string;
  error?: string;
  help?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({
  label,
  unit,
  error,
  help,
  className = "",
  id,
  ...props
}: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-gray-700 flex items-center gap-2"
      >
        {label}
        {unit && (
          <span className="text-xs text-gray-400 font-normal">({unit})</span>
        )}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? "border-red-400 bg-red-50" : "border-gray-300"}
        `}
        {...props}
      />
      {help && !error && (
        <span className="text-xs text-gray-400">{help}</span>
      )}
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
