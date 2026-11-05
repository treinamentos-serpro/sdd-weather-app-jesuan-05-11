interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <p role="status" aria-atomic="true" className="min-h-16 py-5 text-sm text-slate-300">
      {message}
    </p>
  );
}
