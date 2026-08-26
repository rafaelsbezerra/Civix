import { SiteHeader } from "@/components/layout/SiteHeader"
import SiteFooter from "@/components/footer/SiteFooter"

import decorativeShape from '@/assets/civix/decorative-shape.svg'
import heroArtwork from '@/assets/civix/hero-artwork.svg'

import { useState } from 'react'

const companies = [
  { id: 1, name: 'Estrutura Alfa Engenharia', city: 'Sao Paulo, SP', category: 'Engenharia', tone: 'blue' },
  { id: 2, name: 'Concreto & Cia', city: 'Campinas, SP', category: 'Materiais', tone: 'gold' },
  { id: 3, name: 'Habita Norte', city: 'Belo Horizonte, MG', category: 'Construcao', tone: 'slate' },
  { id: 4, name: 'Hidraulica Horizonte', city: 'Curitiba, PR', category: 'Instalacoes', tone: 'teal' },
  { id: 5, name: 'Acabamento Real', city: 'Santos, SP', category: 'Acabamentos', tone: 'orange' },
  { id: 6, name: 'Terraplenagem Sul', city: 'Joinville, SC', category: 'Servicos', tone: 'navy' },
]

function InfoIcon({ type }: { type: 'pin' | 'phone' | 'grid' | 'briefcase' }) {
  const symbols = {
    pin: 'M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
    phone: 'M6 3l4 2-2 4c1.2 2.5 2.5 3.8 5 5l4-2 2 4-2 2c-6 0-12-5-11-11l2-2Z',
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    briefcase: 'M7 8V6h10v2M4 10h16v9H4zM10 13h4'
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="info-icon"
    >
      <path d={symbols[type]} />
    </svg>
  )
}

export default function PerfilEmpresa() {
  const [selectedCompany] = useState(companies[0])

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
                <span className="lg:block lg:whitespace-nowrap">
                  {selectedCompany.name}
                </span>

                <span className="lg:block lg:whitespace-nowrap lg:tracking-[-0.045em] text-[var(--color-civix-gold)]">
                  {selectedCompany.category.toUpperCase()}
                </span>
              </h1>

              <p className="mt-10 max-w-[511px] font-[family-name:var(--font-body)] text-base font-normal leading-[normal] text-[var(--color-civix-ivory)]/90 sm:text-lg lg:absolute lg:left-0 lg:top-[124px] lg:mt-0 lg:w-[511px] lg:leading-[20.6667px]">
                Encontre profissionais e fornecedores verificados, prontos para o seu próximo projeto.
              </p>

            </div>
          </div>

          <div className="company-info-panel">
            <div>
              <InfoIcon type="pin" />
              <span>
                Localizacao
                <strong>{selectedCompany.city}</strong>
              </span>
            </div>

            <div>
              <InfoIcon type="phone" />
              <span>
                Telefone
                <strong>(11) 99999-0000</strong>
              </span>
            </div>

            <div>
              <InfoIcon type="grid" />
              <span>
                Segmento
                <strong>{selectedCompany.category}</strong>
              </span>
            </div>

            <div>
              <InfoIcon type="briefcase" />
              <span>
                Tipo de empresa
                <strong>Engenharia civil</strong>
              </span>
            </div>
          </div>
        </div>

        <section className="about-company" id="sobre">
          <p className="eyebrow dark-eyebrow">
            SOBRE A EMPRESA
          </p>

          <h2>
            Quem e a {selectedCompany.name}?
          </h2>

          <div className="about-columns">
            <p>
              Construir e transformar ideias em lugares que melhoram a vida
              das pessoas. A {selectedCompany.name} atua no desenvolvimento
              de projetos e obras para empresas e comunidades.
            </p>

            <p>
              Nosso time combina conhecimento tecnico, escuta ativa e
              compromisso com cada detalhe para entregar resultados
              duradouros, sempre respeitando o tempo, o orcamento e o
              entorno de cada projeto.
            </p>
          </div>
        </section>
      </section>

      <SiteFooter />
    </section>
  )
}