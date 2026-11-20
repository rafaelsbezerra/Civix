interface AboutPrinciple {
  title: 'Valor' | 'Visão' | 'Missão';
  description: string;
}

const principles: readonly AboutPrinciple[] = [
  {
    title: 'Valor',
    description: 'Tecnologia só faz sentido quando gera valor de verdade.',
  },
  {
    title: 'Visão',
    description: 'Ser referência em inteligência para atendimento e vendas.',
  },
  {
    title: 'Missão',
    description:
      'Simplificar o atendimento e potencializar vendas por meio da tecnologia.',
  },
];

/** Apresenta valor, visão e missão da Civix em cards compactos. */
export function AboutPrinciples() {
  return (
    <section
      aria-label="Princípios da Civix"
      className="relative z-10 grid w-full gap-3 px-6 pb-12 sm:px-10 2xl:absolute 2xl:left-[calc(41.667%+93px)] 2xl:top-[374px] 2xl:w-[611px] 2xl:px-0 2xl:pb-0"
    >
      {principles.map((principle) => (
        <article
          data-motion="item"
          data-motion-step="60"
          className="grid gap-2 rounded-xl border border-[rgba(7,25,42,0.1)] bg-white/80 p-4 shadow-[0_8px_24px_rgba(7,25,42,0.04)] sm:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] sm:items-center sm:gap-6 sm:p-5 2xl:grid-cols-[120px_minmax(0,1fr)] 2xl:gap-8"
          key={principle.title}
        >
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold leading-tight text-[var(--color-civix-navy)]">
            {principle.title}
          </h2>
          <p className="font-[family-name:var(--font-body)] text-sm font-normal leading-6 text-[rgba(7,25,42,0.8)]">
            {principle.description}
          </p>
        </article>
      ))}
    </section>
  );
}
