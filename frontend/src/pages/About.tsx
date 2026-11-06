import { AboutPrinciples } from '@/components/about/AboutPrinciples'
import { AboutVisual } from '@/components/about/AboutVisual'

/** Renders the public institutional page from Figma frame 103:1987. */
export default function AboutPage() {
  return (
    <main className="about-page mt-8 min-h-screen bg-[var(--color-civix-ivory)] sm:mt-12 lg:mt-18" id='sobre'>
      <section
        aria-label="Sobre a Civix"
        className="relative mx-auto min-h-screen w-full overflow-hidden bg-[var(--color-civix-ivory)] pb-12 2xl:h-[760px] 2xl:min-h-[760px] 2xl:max-w-[1728px] 2xl:pb-0"
        data-testid="about-frame"
      >
        <div className="relative z-20 grid gap-8 px-6 pt-12 sm:px-10 sm:pt-16 2xl:contents">
          <p
            className="font-[family-name:var(--font-display)] text-base font-medium leading-[normal] text-[var(--color-civix-navy)] 2xl:absolute 2xl:left-[128px] 2xl:top-[80px] 2xl:w-[88px]"
            data-testid="about-marker"
            data-motion="section"
          >
            <span className="text-[var(--color-civix-gold-accessible)]">//</span>{' '}
            <span>Sobre nós</span>
          </p>

          <div className="2xl:contents">
            <h1
              className="break-words font-[family-name:var(--font-display)] text-[clamp(2.25rem,7vw,3rem)] font-normal leading-[1.1] text-[var(--color-civix-navy)] 2xl:absolute 2xl:left-[calc(41.667%+93px)] 2xl:top-[80px] 2xl:w-[683px] 2xl:text-[48px]"
              id="about-title"
              data-motion="section"
            >
              <span className="block">Transformamos atendimento</span>{' '}
              <span className="block">em oportunidades.</span>
            </h1>
            <p
              className="mt-6 max-w-[557px] whitespace-pre-wrap font-[family-name:var(--font-body)] text-base font-normal leading-[normal] text-[rgba(7,25,42,0.8)] 2xl:absolute 2xl:left-[calc(41.667%+93px)] 2xl:top-[209px] 2xl:mt-0 2xl:w-[557px]"
              data-testid="about-introduction"
              data-motion="section"
              data-motion-delay="60"
            >
              A Civix nasceu para tornar o atendimento comercial mais inteligente, ágil e
              eficiente. Unimos inteligência artificial, automação e gestão para ajudar
              empresas a se relacionarem melhor com seus clientes, identificarem novas
              oportunidades e transformarem conversas em negócios.
            </p>
          </div>
        </div>

        <AboutVisual />
        <AboutPrinciples />
      </section>
    </main>
  )
}
