import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Button } from '../ui/button';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { Textarea } from '../ui/textarea';

const themeVariables = {
  '--card': 'var(--sa-surface)',
  '--card-foreground': 'var(--sa-ink)',
  '--popover': 'var(--sa-surface)',
  '--popover-foreground': 'var(--sa-ink)',
  '--input': 'var(--sa-line)',
  '--accent': 'var(--sa-soft)',
  '--accent-foreground': 'var(--sa-ink)',
} as CSSProperties;

export function ActionConfirmation({ title, description, requireReason = false, onConfirm, onClose }: {
  title: string; description: string; requireReason?: boolean;
  onConfirm: (reason: string) => Promise<void>; onClose: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => {
      if (element?.open) element.close?.();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
      else document.getElementById('admin-content')?.focus();
    };
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (requireReason && !reason.trim()) { setError('Informe o motivo.'); return; }
    setBusy(true); setError('');
    try { await onConfirm(reason.trim()); onClose(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  };
  return (
    <dialog
      className="sa-confirmation rounded-2xl p-6 shadow-xl"
      style={themeVariables}
      ref={dialog}
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description"
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    >
      <form className="space-y-5 text-foreground" onSubmit={submit}>
        <div className="space-y-1.5">
          <h2 id="confirmation-title" className="text-lg font-semibold tracking-tight">{title}</h2>
          <p id="confirmation-description" className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {requireReason && (
          <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor={id + '-reason'}>Motivo</FieldLabel>
            <Textarea
              id={id + '-reason'}
              required
              maxLength={2000}
              value={reason}
              onChange={event => setReason(event.target.value)}
              disabled={busy}
              aria-invalid={!!error}
              className="min-h-24 bg-background"
            />
          </Field>
        )}
        {error && <FieldError>{error}</FieldError>}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="outline" className="min-h-10 rounded-xl px-4" type="button" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button className="min-h-10 rounded-xl px-4" type="submit" disabled={busy}>
            {busy ? 'Confirmando…' : 'Confirmar'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
