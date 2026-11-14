import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AboutPrinciples } from './AboutPrinciples';

describe('AboutPrinciples', () => {
  it('renders the three institutional principles in the approved order', () => {
    render(<AboutPrinciples />);

    const section = screen.getByRole('region', { name: 'Princípios da Civix' });
    expect(
      within(section)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['Valor', 'Visão', 'Missão']);
  });

  it('renders the exact supporting copy for each principle', () => {
    render(<AboutPrinciples />);

    expect(
      screen.getByText('Tecnologia só faz sentido quando gera valor de verdade.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ser referência em inteligência para atendimento e vendas.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Simplificar o atendimento e potencializar vendas por meio da tecnologia.',
      ),
    ).toBeInTheDocument();
  });

  it('presents each principle in a compact responsive card', () => {
    render(<AboutPrinciples />);

    const section = screen.getByRole('region', { name: 'Princípios da Civix' });
    const cards = within(section).getAllByRole('article');

    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card).toHaveClass('rounded-xl', 'border', 'bg-white/80', 'sm:p-5');
    }
  });

  it('keeps the reference typography and places the cards closer to the introduction', () => {
    render(<AboutPrinciples />);

    const section = screen.getByRole('region', { name: 'Princípios da Civix' });
    expect(section).toHaveClass(
      '2xl:left-[calc(41.667%_+_93px)]',
      '2xl:top-[374px]',
      '2xl:w-[611px]',
    );
    expect(screen.getByRole('heading', { name: 'Valor' }).className).toContain(
      'font-[family-name:var(--font-display)]',
    );
    expect(
      screen.getByText('Tecnologia só faz sentido quando gera valor de verdade.')
        .className,
    ).toContain('font-[family-name:var(--font-body)]');
  });
});
