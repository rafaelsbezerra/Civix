import { ActionButton } from '@/components/ui/ActionButton'

const companies = [
    { name: 'Estrutura Alfa Engenharia', city: 'Sao Paulo, SP', category: 'Engenharia', tone: 'blue' },
    { name: 'Concreto & Cia', city: 'Campinas, SP', category: 'Materiais', tone: 'gold' },
    { name: 'Habita Norte', city: 'Belo Horizonte, MG', category: 'Construcao', tone: 'slate' },
    { name: 'Hidraulica Horizonte', city: 'Curitiba, PR', category: 'Instalacoes', tone: 'teal' },
    { name: 'Acabamento Real', city: 'Santos, SP', category: 'Acabamentos', tone: 'orange' },
    { name: 'Terraplenagem Sul', city: 'Joinville, SC', category: 'Servicos', tone: 'navy' },
]

function BuildingMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="building-mark">
      <path d="M10 40V15l14-7 14 7v25" />
      <path d="M7 40h34M17 21h4M27 21h4M17 28h4M27 28h4M21 40V34h6v6" />
    </svg>
  )
}

export default function CatalogoEmpresas() {
    return (
        <section className="catalog-content" id="empresas">
            <div className="results-heading companies-section-heading">
                <div>
                    <p className="font-[family-name:var(--font-display)] text-base font-medium leading-normal text-[var(--color-civix-navy)]">
                        <span className="text-[var(--color-civix-gold-accessible)]">//</span>{' '}
                        <span>Empresas</span>
                    </p>
                    <h2 className="mt-3 max-w-[760px] font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.1] text-[var(--color-civix-navy)]">
                        Empresas que constroem o futuro com a gente.
                    </h2>
                </div>
                <ActionButton href="/catalogo" showArrow variant="primary">
                    Ver todas
                </ActionButton>
            </div>
            <div className="company-grid">
                {companies.map((company) => (
                    <article className="company-card" key={company.name}>
                        <div className={`company-art art-${company.tone}`}><span className="category-badge">{company.category}</span><BuildingMark /></div>
                        <div className="company-details"><h3>{company.name}</h3><p><span className="pin">+</span>{company.city}</p><span className="card-link"><a href={`/empresas/${company.name.split(' ').join('-')}`}>Ver perfil</a> <span aria-hidden="true">-&gt;</span></span></div>
                    </article>
                ))}
            </div>
        </section>

    )
}
