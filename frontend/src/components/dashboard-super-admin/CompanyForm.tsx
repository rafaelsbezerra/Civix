import { useState, type FormEvent } from 'react';
import { Button } from '../ui/button';
import type { CompanyRegistrationInput, Plan, PlatformCompany } from '../../lib/api';
import { CompanyImageInput } from './CompanyImageInput';

export function CompanyForm({ plans, busy, onSave, company }: { plans: Plan[]; busy: boolean; company?: PlatformCompany; onSave: (input: Omit<CompanyRegistrationInput, 'operationId'>, logo?: File | null) => void }) {
  const [logo, setLogo] = useState<File | null>(null);
  const [form, setForm] = useState(() => { const initial = { nome: '', cnpj: '', descricao: '', descricao_detalhada: '', categoria: '', cidade: '', estado: '', tamanho: 'pequena', email: '', telefone: '', endereco: '', website: '', whatsapp: '', planId: company?.plan_id || '' };
    for (const key of Object.keys(initial) as (keyof typeof initial)[]) { if (key !== 'planId' && company?.[key] != null) initial[key] = String(company[key]); }
    return initial; });
  const field = (name: keyof typeof form, value: string) => setForm(current => ({ ...current, [name]: value }));
  const selected = plans.find(plan => plan.id === form.planId);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ nome: form.nome, cnpj: form.cnpj, descricao: form.descricao, descricao_detalhada: form.descricao_detalhada,
      categoria: form.categoria, cidade: form.cidade, estado: form.estado, tamanho: form.tamanho as CompanyRegistrationInput['tamanho'], planId: form.planId,
      ...(form.email || company ? { email: form.email || null } : {}), ...(form.telefone || company ? { telefone: form.telefone || null } : {}),
      ...(form.endereco || company ? { endereco: form.endereco || null } : {}), ...(form.website || company ? { website: form.website || null } : {}), ...(form.whatsapp || company ? { whatsapp: form.whatsapp || null } : {}) }, logo);
  };
  return <form onSubmit={submit} className="sa-form" aria-label={company ? 'Editar empresa' : 'Cadastrar empresa com plano'}>
    <fieldset className="sa-panel" disabled={busy}><legend className="sa-section-legend">01 · Identificação</legend><div className="sa-form-grid">
      <label>Nome da empresa<input required value={form.nome} onChange={e => field('nome', e.target.value)} /></label>
      <label>CNPJ<input required value={form.cnpj} onChange={e => field('cnpj', e.target.value)} /></label>
      <label>Categoria<input required value={form.categoria} onChange={e => field('categoria', e.target.value)} /></label>
      <label>Porte<select value={form.tamanho} onChange={e => field('tamanho', e.target.value)}><option value="pequena">Pequena</option><option value="media">Média</option><option value="grande">Grande</option></select></label>
      <label className="sa-span-two">Resumo<input required value={form.descricao} onChange={e => field('descricao', e.target.value)} /></label>
      <label className="sa-span-two">Descrição detalhada<textarea required value={form.descricao_detalhada} onChange={e => field('descricao_detalhada', e.target.value)} /></label>
    </div></fieldset>
    <fieldset className="sa-panel" disabled={busy}><legend className="sa-section-legend">02 · Localização e contato</legend><div className="sa-form-grid">
      <label>Cidade<input required value={form.cidade} onChange={e => field('cidade', e.target.value)} /></label>
      <label>Estado<input required value={form.estado} onChange={e => field('estado', e.target.value)} /></label>
      <label>E-mail da empresa<input type="email" value={form.email} onChange={e => field('email', e.target.value)} /></label>
      <label>Telefone<input type="tel" value={form.telefone} onChange={e => field('telefone', e.target.value)} /></label>
      <label>Endereço<input value={form.endereco} onChange={e => field('endereco', e.target.value)} /></label>
      <label>Site<input type="url" value={form.website} onChange={e => field('website', e.target.value)} /></label>
      <label>WhatsApp<input type="tel" value={form.whatsapp} onChange={e => field('whatsapp', e.target.value)} /></label>
    </div></fieldset>
    <fieldset className="sa-panel" disabled={busy}><legend className="sa-section-legend">03 · Plano comercial</legend>
      <label>Plano comercial<select required value={form.planId} onChange={e => field('planId', e.target.value)}><option value="">Selecione um plano</option>{plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}{!plan.isActive ? ' (inativo — vínculo atual)' : ''} — {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(plan.price))}</option>)}</select></label>
      {selected && <div className="sa-plan-preview"><strong>{selected.name}</strong><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(selected.price))}</span><p>{company ? 'A alteração do plano não gera uma venda automática. Registre a venda manualmente na área de vendas.' : 'O valor vigente do plano será registrado pelo servidor no momento da confirmação.'}</p></div>}
      <p className="sa-footnote">{company ? 'A alteração do plano não gera uma venda automática. Registre a venda manualmente na área de vendas.' : <>Este cadastro registra uma venda comercial inicial. Não realiza cobrança nem cria assinatura. O convite da equipe é uma etapa separada.</>}</p>
    </fieldset>
    {!company && <fieldset className="sa-panel" disabled={busy}><legend className="sa-section-legend">04 · Logo</legend><CompanyImageInput purpose="logo" file={logo} onChange={setLogo} /></fieldset>}
    <div className="sa-form-actions"><Button className="sa-button" type="submit" disabled={busy || !plans.length}>{busy ? 'Salvando…' : company ? 'Salvar empresa' : 'Cadastrar empresa e registrar venda'}</Button></div>
  </form>;
}
