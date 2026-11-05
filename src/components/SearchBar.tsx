import { Search } from 'lucide-react';
import type { FormEvent, RefObject } from 'react';
import { useRef, useState } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  isLoading = false,
  inputRef,
}: SearchBarProps) {
  const [validation, setValidation] = useState<string | null>(null);
  const localInputRef = useRef<HTMLInputElement>(null);
  const fieldRef = inputRef ?? localInputRef;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    if (!value.trim()) {
      setValidation('Informe o nome de uma cidade.');
      fieldRef.current?.focus();
      return;
    }
    setValidation(null);
    onSearch();
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full min-w-0" role="search">
      <label htmlFor="city-search" className="sr-only">
        Buscar cidade
      </label>
      <div className="flex h-12 items-center rounded-lg border border-slate-400 bg-white/5 backdrop-blur-md focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-300/40">
        <input
          ref={fieldRef}
          id="city-search"
          type="search"
          placeholder="Buscar cidade"
          autoComplete="off"
          enterKeyHint="search"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setValidation(null);
          }}
          aria-invalid={Boolean(validation)}
          aria-describedby={validation ? 'search-validation' : undefined}
          className="h-full min-w-0 flex-1 bg-transparent pl-4 text-sm text-white placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          aria-label="Buscar"
          title="Buscar cidade"
          className="m-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-cyan-200 transition-colors hover:bg-white/10 disabled:opacity-40"
        >
          <Search size={19} aria-hidden="true" />
        </button>
      </div>
      {validation && (
        <p id="search-validation" role="alert" className="mt-2 text-sm text-rose-200">
          {validation}
        </p>
      )}
    </form>
  );
}
