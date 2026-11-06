import { useCallback, useState } from 'react';
import { getPlatformPlans } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';

export function PlanFilter({ onError }: { onError:(error:unknown)=>string }) {
  const [retry,setRetry] = useState(0);
  const load = useCallback(()=>getPlatformPlans().catch(error=>{ throw new Error(onError(error),{cause:error}); }),[onError]);
  const query = useAsyncQuery('plan-filter:'+retry,load);
  return <label>Plano<select name="planId" disabled={query.loading || !!query.error}><option value="">{query.loading ? 'Carregando planos…' : 'Todos os planos'}</option>{query.data?.map(plan=><option key={plan.id} value={plan.id}>{plan.name}{plan.isActive ? '' : ' (inativo)'}</option>)}</select>
    {!!query.error && <span role="alert">Não foi possível carregar os planos. <button type="button" onClick={()=>setRetry(value=>value+1)}>Tentar novamente</button></span>}
  </label>;
}
