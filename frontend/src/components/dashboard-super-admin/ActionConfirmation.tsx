import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../ui/button';

export function ActionConfirmation({ title, description, requireReason = false, onConfirm, onClose }: {
  title: string; description: string; requireReason?: boolean;
  onConfirm: (reason: string) => Promise<void>; onClose: () => void;
}) {
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
  return <dialog className="sa-confirmation" ref={dialog} aria-labelledby="confirmation-title" aria-describedby="confirmation-description"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <form className="sa-form" onSubmit={submit}><h2 id="confirmation-title">{title}</h2><p id="confirmation-description">{description}</p>
      {requireReason && <label>Motivo<textarea required maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} disabled={busy} /></label>}
      {error && <p role="alert" className="sa-feedback sa-error">{error}</p>}
      <div className="sa-form-actions"><Button className="sa-button sa-button-secondary" type="button" onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button className="sa-button" type="submit" disabled={busy}>{busy ? 'Confirmando…' : 'Confirmar'}</Button></div>
    </form>
  </dialog>;
}
