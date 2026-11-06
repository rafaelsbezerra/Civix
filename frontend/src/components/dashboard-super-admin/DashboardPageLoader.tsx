import { Loader2 } from 'lucide-react';

export function DashboardPageLoader({ label = 'Carregando dados da página…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[52vh] flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--sa-line)] bg-[var(--sa-surface)] p-8 text-center shadow-xs"
    >
      <Loader2 className="size-8 animate-spin text-[var(--sa-accent)]" aria-hidden="true" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

