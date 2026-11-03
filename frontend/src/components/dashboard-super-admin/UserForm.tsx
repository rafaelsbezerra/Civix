import { useState, type FormEvent } from 'react';
import type { ManagedUser, ManagedUserInput } from '../../lib/api';
import { Button } from '../ui/button';

export function UserForm({ user, global, busy, onSave, onCancel }: { user?:ManagedUser;global:boolean;busy:boolean;onSave:(input:ManagedUserInput)=>void;onCancel:()=>void }) {
  const [name,setName] = useState(user?.name || '');
  const [email,setEmail] = useState(user?.email || '');
  const [role,setRole] = useState<'admin_empresa'|'atendente'>(user?.role === 'admin_empresa' ? 'admin_empresa' : 'atendente');
  const submit = (event:FormEvent) => { event.preventDefault();onSave({ name:name.trim(),email:email.trim(),...(global ? {} : { role }) }); };
  return <form className="sa-form sa-panel" onSubmit={submit} aria-label={user ? 'Editar usuário' : 'Convidar usuário'}><h2>{user ? 'Editar usuário' : 'Novo convite'}</h2>
    <div className="sa-form-grid"><label>Nome<input required maxLength={120} value={name} onChange={event=>setName(event.target.value)} disabled={busy} /></label>
      <label>E-mail<input type="email" required value={email} onChange={event=>setEmail(event.target.value)} disabled={busy} /></label>
      {global ? <p>Superadmin: todos possuem os mesmos poderes na plataforma.</p> : <label>Perfil<select value={role} onChange={event=>setRole(event.target.value as typeof role)} disabled={busy}><option value="atendente">Atendente</option><option value="admin_empresa">Admin da empresa</option></select></label>}
    </div><p className="sa-footnote">{user ? 'Alterar e-mail ou perfil revoga as sessões anteriores. Convites pendentes precisam ser reenviados se esses dados mudarem.' : 'Um convite será enviado para definir a senha. A conta não recebe uma senha pronta.'}</p>
    <div className="sa-form-actions"><Button className="sa-button sa-button-secondary" type="button" disabled={busy} onClick={onCancel}>Cancelar</Button><Button className="sa-button" type="submit" disabled={busy}>{busy ? 'Salvando…' : user ? 'Salvar usuário' : 'Enviar convite'}</Button></div>
  </form>;
}
