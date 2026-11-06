import { useState, type FormEvent } from 'react';
import { Button } from '../ui/button';
import type { Plan, PlanInput } from '../../lib/api';

export function PlanForm({ plan, busy, onSave, onCancel }: { plan?: Plan; busy: boolean; onSave: (input: PlanInput) => void; onCancel: () => void }) {
  const [value, setValue] = useState<PlanInput>(() => plan ? {
    name: plan.name, slug: plan.slug, description: plan.description, price: plan.price,
    billingPeriod: plan.billingPeriod, features: plan.features, limits: plan.limits,
    isFeatured: plan.isFeatured, isActive: plan.isActive, displayOrder: plan.displayOrder,
  } : {
    name: '', slug: '', description: '', price: '', billingPeriod: 'monthly', features: [], limits: {},
    isFeatured: false, isActive: true, displayOrder: 10,
  });
  const [features, setFeatures] = useState(plan?.features.join('\n') || '');
  const submit = (event: FormEvent) => { event.preventDefault(); const { ...input } = value; onSave({ ...input, price: input.price.replace(',', '.'), features: features.split('\n').map(item => item.trim()).filter(Boolean) }); };
  return <form className="sa-form sa-panel" onSubmit={submit} aria-label={plan ? 'Editar plano' : 'Novo plano'}>
    <div className="sa-section-title"><h2>{plan ? 'Editar plano' : 'Novo plano'}</h2><p>Dados comerciais. Recursos são descritivos; não definem permissões.</p></div>
    <div className="sa-form-grid">
      <label>Nome do plano<input required maxLength={120} value={value.name} onChange={e => setValue({ ...value, name: e.target.value })} /></label>
      <label>Identificador (slug)<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} value={value.slug} onChange={e => setValue({ ...value, slug: e.target.value })} /></label>
      <label>Preço em reais<input required inputMode="decimal" placeholder="59.90" value={value.price} onChange={e => setValue({ ...value, price: e.target.value })} /><small>Valor positivo, com até duas casas decimais.</small></label>
      <label>Período comercial<select value={value.billingPeriod} onChange={e => setValue({ ...value, billingPeriod: e.target.value as PlanInput['billingPeriod'] })}>
        <option value="monthly">Mensal</option><option value="yearly">Anual</option><option value="one_time">Único</option></select></label>
      <label className="sa-span-two">Descrição<textarea maxLength={3000} value={value.description} onChange={e => setValue({ ...value, description: e.target.value })} /></label>
      <label className="sa-span-two">Recursos apresentados<textarea value={features} onChange={e => setFeatures(e.target.value)} /><small>Um recurso por linha.</small></label>
      <label>Ordem de exibição<input type="number" required step="1" value={value.displayOrder} onChange={e => setValue({ ...value, displayOrder: Number(e.target.value) })} /></label>
      <div className="sa-checkboxes"><label><input type="checkbox" checked={value.isActive} onChange={e => setValue({ ...value, isActive: e.target.checked })} /> Disponível para novos cadastros</label>
        <label><input type="checkbox" checked={value.isFeatured} onChange={e => setValue({ ...value, isFeatured: e.target.checked })} /> Destacar no catálogo</label></div>
    </div>
    <div className="sa-form-actions"><Button className="sa-button sa-button-secondary" type="button" disabled={busy} onClick={onCancel}>Cancelar</Button>
      <Button className="sa-button" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar plano'}</Button></div>
  </form>;
}
