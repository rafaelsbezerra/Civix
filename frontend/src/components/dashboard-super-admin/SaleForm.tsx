import { useState, type FormEvent } from 'react';
import type { ManualSaleDraft, Plan, PlatformCompany } from '../../lib/api';
import { Button } from '../ui/button';

export function SaleForm({ company, plan, busy, onSave }: { company: PlatformCompany; plan?: Plan; busy: boolean; onSave: (input: ManualSaleDraft) => void }) {
  const planEligible = !!plan?.isActive && Number(plan.price) > 0;
  const [mode, setMode] = useState<'company_plan'|'manual_amount'>(planEligible ? 'company_plan' : 'manual_amount');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [soldAt, setSoldAt] = useState(() => new Date().toISOString().slice(0,16));
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'manual_amount' && !description.trim()) { setError('Informe a descrição / motivo.'); return; }
    setError('');
    const common = { companyId: company.id, soldAt: new Date(soldAt + 'Z').toISOString() };
    onSave(mode === 'company_plan' ? { ...common, pricingMode: 'company_plan', ...(description ? { description } : {}) }
      : { ...common, pricingMode: 'manual_amount', amount: amount.replace(',','.'), description: description.trim() });
  };
  return <form className="sa-form sa-panel" aria-label="Lançar venda manual" onSubmit={submit}><h2>Venda para {company.nome}</h2>
    {error && <p role="alert" className="sa-feedback sa-error">{error}</p>}
    <fieldset disabled={busy} className="sa-form-grid"><label>Origem do valor<select value={mode} onChange={event => setMode(event.target.value as typeof mode)}><option value="company_plan" disabled={!planEligible}>Plano atual da empresa</option><option value="manual_amount">Valor manual com motivo</option></select></label>
      <label>Data comercial (UTC)<input type="datetime-local" required value={soldAt} onChange={event => setSoldAt(event.target.value)} /></label>
      {mode === 'company_plan' ? <div className="sa-plan-preview sa-span-two"><strong>{plan?.name}</strong><span>{plan?.price} BRL</span><p>O backend usará o preço vigente do plano ao confirmar. Não é uma cobrança.</p></div>
        : <label>Valor em reais<input required inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="59.90" /></label>}
      <label className="sa-span-two">Descrição / motivo{mode === 'manual_amount' ? ' (obrigatório)' : ' (opcional)'}<textarea required={mode === 'manual_amount'} maxLength={3000} value={description} onChange={event => setDescription(event.target.value)} /></label>
    </fieldset><p className="sa-footnote">Datas interpretadas em UTC, inclusive datas passadas. Este lançamento não muda o plano da empresa. Vendas não podem ser editadas; correções exigem exclusão definitiva e novo lançamento.</p>
    <div className="sa-form-actions"><Button className="sa-button" type="submit" disabled={busy || mode === 'company_plan' && !planEligible}>{busy ? 'Registrando…' : 'Registrar venda manual'}</Button></div>
  </form>;
}
