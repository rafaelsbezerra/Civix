import { useState, type FormEvent } from 'react';
import { Button } from '../ui/button';
export function ProfileForm({ name, email, busy, onSave }: { name?: string; email: string; busy: boolean; onSave: (input: { name: string; email: string }) => void }) {
  const [value, setValue] = useState({ name: name || '', email });
  const submit = (event: FormEvent) => { event.preventDefault(); onSave(value); };
  return <form className="sa-form sa-panel sa-profile-form" aria-label="Atualizar meu perfil" onSubmit={submit}>
    <div className="sa-section-title"><h2>Informações pessoais</h2><p>Ao trocar o e-mail, será necessário entrar novamente.</p></div>
    <label>Nome<input autoComplete="name" required maxLength={120} value={value.name} onChange={e => setValue({ ...value, name: e.target.value })} disabled={busy} /></label>
    <label>E-mail<input autoComplete="email" type="email" required value={value.email} onChange={e => setValue({ ...value, email: e.target.value })} disabled={busy} /></label>
    <div className="sa-form-actions"><Button className="sa-button" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar perfil'}</Button></div>
  </form>;
}
