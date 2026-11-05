import { RotateCcw, TriangleAlert } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

export default function ErrorState({
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
}: ErrorStateProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 py-5">
      <p role="alert" aria-atomic="true" className="flex items-center gap-2 text-sm text-rose-200">
        <TriangleAlert size={18} className="shrink-0" aria-hidden="true" />
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-11 items-center gap-2 rounded-md border border-slate-400 px-3 text-sm hover:bg-white/10"
      >
        <RotateCcw size={16} aria-hidden="true" />
        {retryLabel}
      </button>
    </div>
  );
}
