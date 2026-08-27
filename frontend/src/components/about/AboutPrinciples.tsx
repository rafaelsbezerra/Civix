import valueDivider from '@/assets/civix/about/value-divider.svg'
import visionDivider from '@/assets/civix/about/vision-divider.svg'

interface AboutPrinciple {
  title: 'Valor' | 'Visão' | 'Missão'
  description: string
  divider: string
}

const principles: readonly AboutPrinciple[] = [
  {
    title: 'Valor',
    description: 'Tecnologia só faz sentido quando gera valor de verdade.',
    divider: valueDivider,
  },
  {
    title: 'Visão',
    description: 'Ser referência em inteligência para atendimento e vendas.',
    divider: visionDivider,
  },
  {
    title: 'Missão',
    description:
      'Simplificar o atendimento e potencializar vendas por meio da tecnologia.',
    divider: valueDivider,
  },
]

/** Presents Civix's value, vision, and mission in the order defined by Figma. */
export function AboutPrinciples() {
  return (
    <section
      aria-label="Princípios da Civix"
      className="relative z-10 flex w-full flex-col px-6 sm:px-10 2xl:absolute 2xl:left-[calc(58.333%_-_19px)] 2xl:top-[446px] 2xl:w-[611px] 2xl:px-0"
    >
      {principles.map((principle, index) => (
        <article
          className="relative py-5 2xl:h-[130px] 2xl:py-0 last:2xl:h-auto [&:nth-child(2)]:2xl:h-[127px]"
          key={principle.title}
        >
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold leading-[normal] text-[var(--color-civix-navy)] 2xl:absolute 2xl:left-0 2xl:top-3">
            {principle.title}
          </h2>
          <p
            className={`mt-2 max-w-[330px] font-[family-name:var(--font-body)] text-xs font-normal leading-[normal] text-[rgba(7,25,42,0.8)] sm:text-right 2xl:absolute 2xl:right-0 2xl:top-0 2xl:mt-0 ${index < 2 ? '2xl:w-[230px]' : '2xl:w-[263px]'}`}
          >
            {principle.description}
          </p>
          <img
            aria-hidden="true"
            alt=""
            className="mt-5 h-0.5 w-full 2xl:absolute 2xl:left-0 2xl:top-[37px] 2xl:mt-0 2xl:w-[611px]"
            height={index === 0 ? 2 : 1}
            src={principle.divider}
            width="611"
          />
        </article>
      ))}
    </section>
  )
}
