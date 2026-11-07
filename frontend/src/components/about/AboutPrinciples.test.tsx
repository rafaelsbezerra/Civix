import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AboutPrinciples } from './AboutPrinciples';

describe('AboutPrinciples', () => {
  it('renders the three institutional principles in the Figma order', () => {
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

  it('renders a decorative divider below every principle', () => {
    render(<AboutPrinciples />);

    const section = screen.getByRole('region', { name: 'Princípios da Civix' });
    const dividers = section.querySelectorAll('img');

    expect(dividers).toHaveLength(3);
    for (const divider of dividers) {
      expect(divider).toHaveAttribute('alt', '');
      expect(divider).toHaveAttribute('aria-hidden', 'true');
    }
    expect(Array.from(dividers, (divider) => divider.getAttribute('src'))).toEqual(
      expect.arrayContaining([
        expect.stringContaining('value-divider.svg'),
        expect.stringContaining('vision-divider.svg'),
      ]),
    );
  });

  it('keeps the reference typography and desktop list geometry', () => {
    render(<AboutPrinciples />);

    const section = screen.getByRole('region', { name: 'Princípios da Civix' });
    expect(section).toHaveClass(
      '2xl:left-[calc(58.333%_-_19px)]',
      '2xl:top-[446px]',
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
