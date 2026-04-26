import { useRef, useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  light?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search resources…",
  light = false,
}: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (prevValue !== value) {
    setPrevValue(value);
    setLocal(value);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocal(e.target.value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(e.target.value), 300);
  }

  return (
    <div className="relative">
      <svg
        className={`absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 ${light ? "text-gray-400" : "text-zinc-500"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className={
          light
            ? "w-full rounded-lg border border-gray-200 bg-white py-2 pr-4 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none"
            : "w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pr-4 pl-9 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:outline-none"
        }
      />
    </div>
  );
}
