import { Link, useOutletContext } from 'react-router-dom';
import { ArrowUpRight, Building2, Layers3 } from 'lucide-react';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';
export default function Overview() {
  const { session } = useOutletContext<SuperAdminContext>();
  return <>
    <div className="sa-page-heading"><span className="sa-eyebrow">PLATAFORMA CIVIX</span><h1>Uma visão clara.<br /><span>O próximo passo, nas suas mãos.</span></h1>
      <p>Olá, {session.user.name || 'Superadmin'}. Gerencie o cadastro comercial da plataforma em um só lugar.</p></div>
    <section className="sa-overview-actions" aria-label="Operações disponíveis">
      <Link to="/dashboard/super-admin/companies/new" className="sa-action-card"><Building2 aria-hidden="true" /><span className="sa-eyebrow">EMPRESAS</span><h2>Conecte uma nova empresa.</h2><p>Escolha um plano e confirme o cadastro com o registro da venda inicial.</p><span className="sa-card-link">Cadastrar empresa <ArrowUpRight size={18} /></span></Link>
      <Link to="/dashboard/super-admin/plans" className="sa-action-card"><Layers3 aria-hidden="true" /><span className="sa-eyebrow">PLANOS</span><h2>Organize sua oferta.</h2><p>Consulte e administre os planos comerciais disponíveis na Civix.</p><span className="sa-card-link">Gerenciar planos <ArrowUpRight size={18} /></span></Link>
    </section>
    <p className="sa-footnote">A venda inicial é um registro comercial. Assinaturas, cobranças e pagamentos ainda não fazem parte desta área.</p>
  </>;
}
