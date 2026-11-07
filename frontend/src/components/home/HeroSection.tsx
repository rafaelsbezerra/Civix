import decorativeShape from '@/assets/civix/decorative-shape.svg';
import heroArtwork from '@/assets/civix/hero-artwork.svg';
import { ActionButton } from '@/components/ui/ActionButton';
import { SearchForm } from './SearchForm';

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="px-4 pb-12 sm:px-8 lg:px-16 lg:pb-0 lg:pt-[3px]"
      id="home"
    >
      <div className="relative mx-auto w-full max-w-[1600px] lg:h-[953px]">
        <div
          className="relative min-h-[650px] w-full max-w-[1600px] overflow-hidden rounded-[var(--radius-hero)] bg-[var(--color-civix-navy)] sm:min-h-[700px] lg:h-[900px] lg:min-h-0"
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
            data-motion="item"
            data-motion-trigger="mount"
            src={decorativeShape}
          />

          <div className="relative z-10 px-6 pb-36 pt-16 text-[var(--color-civix-ivory)] sm:px-10 sm:pt-20 lg:absolute lg:left-[63px] lg:top-[124px] lg:p-0">
            <h1
              id="hero-title"
              data-motion="page"
              data-motion-trigger="mount"
              className="max-w-[643px] font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,4rem)] font-bold uppercase leading-[1.1] tracking-normal lg:w-[643px] lg:text-[64px] lg:leading-[72px]"
            >
              <span className="lg:block lg:whitespace-nowrap">A TECNOLOGIA QUE</span>{' '}
              <span className="lg:block lg:whitespace-nowrap">CONSTRÓI O FUTURO</span>
            </h1>
            <p
              data-motion="page"
              data-motion-trigger="mount"
              data-motion-delay="60"
              className="mt-6 max-w-[557px] font-[family-name:var(--font-body)] text-base font-medium leading-[normal] text-[var(--color-civix-ivory)]/90 sm:text-lg lg:mt-6 lg:w-[557px]"
            >
              A plataforma que conecta pessoas, serviços e soluções para transformar o
              mercado da construção e inovação, praticidade e confiança
            </p>
            <div
              data-motion="page"
              data-motion-trigger="mount"
              data-motion-delay="120"
              className="mt-6 flex flex-wrap gap-[18px] lg:mt-8"
            >
              <ActionButton href="#sobre" variant="light">
                Sobre nós
              </ActionButton>
              <ActionButton href="#contato" variant="translucent">
                Contato
              </ActionButton>
            </div>
          </div>
        </div>

        <div
          className="relative z-20 mx-4 -mt-8 rounded-[var(--radius-search)] bg-[var(--color-civix-ivory)] p-6 shadow-[0_34px_26px_rgba(13,10,44,0.25),0_12px_34px_rgba(13,10,44,0.25),0_4px_4px_rgba(0,0,0,0.25)] sm:mx-8 sm:p-8 lg:absolute lg:left-[17.875%] lg:top-[811px] lg:mx-0 lg:mt-0 lg:min-h-[142px] lg:w-[69%] lg:px-10 lg:py-[45px]"
          data-testid="hero-search-card"
        >
          <SearchForm />
        </div>
      </div>
    </section>
  );
}
