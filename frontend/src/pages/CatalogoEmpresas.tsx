import '@/App.css'

import { SiteHeader } from '@/components/layout/SiteHeader'
import decorativeShape from '@/assets/civix/decorative-shape.svg';
import heroArtwork from '@/assets/civix/hero-artwork.svg';
import { SearchForm } from '@/components/home/SearchForm';
// import { ActionButton } from '@/components/ui/ActionButton';
import Footer from '@/components/footer/SiteFooter';

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
    <section className="page-shell" id="catalogo">
      <SiteHeader />

      <section
        aria-labelledby="hero-title"
        className="px-4 pb-12 sm:px-8 lg:px-16 lg:pb-0 lg:pt-[3px]"
        id="home"
      >
        <div className="relative mx-auto w-full max-w-[1600px] lg:h-[653px]">
          <div
            className="relative min-h-[650px] w-full max-w-[1600px] overflow-hidden rounded-[var(--radius-hero)] bg-[var(--color-civix-navy)] sm:min-h-[700px] lg:h-[600px] lg:min-h-0"
            data-testid="hero-surface"
          >
            <img
              aria-hidden="true"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              src={heroArtwork}
            />
            <img
              aria-hidden="true"
              alt=""
              className="absolute -left-20 -top-24 w-[320px] opacity-80 sm:-left-16 sm:-top-32 sm:w-[432px]"
              src={decorativeShape}
            />

            <div className="relative z-10 px-6 pb-36 pt-16 text-[var(--color-civix-ivory)] sm:px-10 sm:pt-20 lg:absolute lg:left-[63px] lg:top-[124px] lg:p-0">
              <h1
                className="max-w-[643px] font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,4rem)] font-semibold uppercase leading-[1.1] tracking-[-0.02em] lg:w-[643px] lg:text-[64px] lg:leading-[80px] lg:tracking-[-0.034em]"
              >
                <span className="lg:block lg:whitespace-nowrap">EMPRESAS PARCEIRAS DA</span>{' '}
                <span className="lg:block lg:whitespace-nowrap lg:tracking-[-0.045em] text-[var(--color-civix-gold)]">
                  CONSTRUÇÃO CIVIL
                </span>
              </h1>
              <p className="mt-10 max-w-[511px] font-[family-name:var(--font-body)] text-base font-normal leading-[normal] text-[var(--color-civix-ivory)]/90 sm:text-lg lg:absolute lg:left-0 lg:top-[124px] lg:mt-0 lg:w-[511px] lg:leading-[20.6667px]">
                Encontre profissionais e fornecedores verificados, prontos para o seu próximo projeto.
              </p>
            </div>
          </div>

          <div
            className="relative z-20 mx-4 -mt-8 rounded-[var(--radius-search)] bg-[var(--color-civix-ivory)] p-6 shadow-[0_34px_26px_rgba(13,10,44,0.25),0_12px_34px_rgba(13,10,44,0.25),0_4px_4px_rgba(0,0,0,0.25)] sm:mx-8 sm:p-8 lg:absolute lg:left-[17.875%] lg:top-[525px] lg:mx-0 lg:mt-0 lg:min-h-[142px] lg:w-[69%] lg:px-10 lg:py-[45px]"
            data-testid="hero-search-card"
          >
            <SearchForm />
          </div>
        </div>
      </section>

      <main>
        <section className="catalog-content catalog-page-content" id="empresas">
          <div className="results-heading">
            <div>
              <p className="eyebrow dark-eyebrow">EXPLORAR A REDE</p>
              <h2 className='text-[28px]'>42 empresas encontradas</h2>
            </div>
            <button className="clear-button" type="button">
              Limpar filtros
              <span aria-hidden="true">x</span>
            </button>
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
      </main>
      <Footer />
    </section>
  )
}