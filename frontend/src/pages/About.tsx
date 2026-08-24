import { AboutPrinciples } from '@/components/about/AboutPrinciples'
import { AboutVisual } from '@/components/about/AboutVisual'

/** Renders the public institutional page from Figma frame 103:1987. */
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[rgba(250,249,246,0.96)]">
      <section
        aria-label="Sobre a Civix"
        className="relative mx-auto min-h-screen w-full overflow-hidden bg-[rgba(250,249,246,0.96)] pb-12 lg:h-[760px] lg:min-h-[760px] lg:max-w-[1728px] lg:pb-0"
        data-testid="about-frame"
      >
        <div className="relative z-20 grid gap-8 px-6 pt-12 sm:px-10 sm:pt-16 md:grid-cols-[0.8fr_1.2fr] md:gap-12 lg:contents">
          <p
            className="font-[family-name:var(--font-display)] text-base font-medium leading-normal text-[var(--color-civix-navy)] lg:absolute lg:left-[128px] lg:top-[80px] lg:w-[88px]"
            data-testid="about-marker"
          >
            <span className="text-[var(--color-civix-gold)]">//</span>{' '}
            <span>Sobre nós</span>
          </p>

          <div className="lg:contents">
            <h1
              className="font-[family-name:var(--font-display)] text-[clamp(2.25rem,7vw,3rem)] font-normal leading-[1.1] text-[var(--color-civix-navy)] lg:absolute lg:left-[calc(41.667%+93px)] lg:top-[80px] lg:w-[683px] lg:text-[48px]"
              id="about-title"
            >
              <span className="block">Transformamos atendimento</span>{' '}
              <span className="block">em oportunidades.</span>
            </h1>
            <p
              className="mt-6 max-w-[557px] whitespace-pre-wrap font-[family-name:var(--font-body)] text-base font-normal leading-normal text-[var(--color-civix-navy)]/80 md:col-start-2 lg:absolute lg:left-[calc(41.667%+93px)] lg:top-[209px] lg:mt-0 lg:w-[557px]"
              data-testid="about-introduction"
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
