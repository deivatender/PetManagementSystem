import { useEffect, useId, useRef, useState } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** Debounce in ms before firing onChange. */
  delay?: number;
}

/**
 * Debounced search box. Keeps a local value for responsive typing and only
 * propagates upstream after `delay` ms of inactivity, so we don't refetch on
 * every keystroke.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  delay = 350,
}: SearchInputProps) {
  const id = useId();
  const [local, setLocal] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Keep local in sync when the value is reset externally (e.g. clear filters).
  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const handle = window.setTimeout(() => onChangeRef.current(local), delay);
    return () => window.clearTimeout(handle);
  }, [local, value, delay]);

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 sm:w-72"
      />
    </div>
  );
}
