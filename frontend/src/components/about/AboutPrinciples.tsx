import valueDivider from '@/assets/civix/about/value-divider.svg'
import visionDivider from '@/assets/civix/about/vision-divider.svg'

interface AboutPrinciple {
  title: 'Valor' | 'Visão' | 'Missão'
  description: string
  divider?: string
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
  },
]

/** Presents Civix's value, vision, and mission in the order defined by Figma. */
export function AboutPrinciples() {
  return (
    <section
      aria-label="Princípios da Civix"
      className="relative z-10 flex w-full flex-col px-6 sm:px-10 min-[1440px]:absolute min-[1440px]:left-[calc(58.333%_-_19px)] min-[1440px]:top-[446px] min-[1440px]:w-[611px] min-[1440px]:px-0"
    >
      {principles.map((principle, index) => (
        <article
          className="relative py-5 min-[1440px]:h-[130px] min-[1440px]:py-0 last:min-[1440px]:h-auto [&:nth-child(2)]:min-[1440px]:h-[127px]"
          key={principle.title}
        >
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold leading-[normal] text-[var(--color-civix-navy)] min-[1440px]:absolute min-[1440px]:left-0 min-[1440px]:top-3">
            {principle.title}
          </h2>
          <p
            className={`mt-2 max-w-[330px] font-[family-name:var(--font-body)] text-xs font-normal leading-[normal] text-[var(--color-civix-navy)]/80 sm:text-right min-[1440px]:absolute min-[1440px]:right-0 min-[1440px]:top-0 min-[1440px]:mt-0 ${index < 2 ? 'min-[1440px]:w-[230px]' : 'min-[1440px]:w-[263px]'}`}
          >
            {principle.description}
          </p>
          {principle.divider ? (
            <img
              aria-hidden="true"
              alt=""
              className="mt-5 h-0.5 w-full min-[1440px]:absolute min-[1440px]:left-0 min-[1440px]:top-[37px] min-[1440px]:mt-0 min-[1440px]:w-[611px]"
              height={index === 0 ? 2 : 1}
              src={principle.divider}
              width="611"
            />
          ) : null}
        </article>
      ))}
    </section>
  )
}
