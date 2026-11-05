import { LoaderCircle } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = 'Carregando dados do tempo…',
}: LoadingStateProps) {
  return (
    <p
      role="status"
      aria-atomic="true"
      className="flex min-h-16 items-center gap-3 py-4 text-sm text-slate-300"
    >
      <LoaderCircle
        size={18}
        className="animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      {message}
    </p>
  );
}
