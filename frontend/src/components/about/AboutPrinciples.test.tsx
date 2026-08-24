import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AboutPrinciples } from './AboutPrinciples'

describe('AboutPrinciples', () => {
  it('renders the three institutional principles in the Figma order', () => {
    render(<AboutPrinciples />)

    const section = screen.getByRole('region', { name: 'Princípios da Civix' })
    expect(
      within(section)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['Valor', 'Visão', 'Missão'])
  })

  it('renders the exact supporting copy for each principle', () => {
    render(<AboutPrinciples />)

    expect(
      screen.getByText('Tecnologia só faz sentido quando gera valor de verdade.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Ser referência em inteligência para atendimento e vendas.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Simplificar o atendimento e potencializar vendas por meio da tecnologia.',
      ),
    ).toBeInTheDocument()
  })

  it('uses two original dividers as decorative images', () => {
    render(<AboutPrinciples />)

    const section = screen.getByRole('region', { name: 'Princípios da Civix' })
    const dividers = section.querySelectorAll('img')

    expect(dividers).toHaveLength(2)
    for (const divider of dividers) {
      expect(divider).toHaveAttribute('alt', '')
      expect(divider).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('keeps the reference typography and desktop list geometry', () => {
    render(<AboutPrinciples />)

    const section = screen.getByRole('region', { name: 'Princípios da Civix' })
    expect(section).toHaveClass(
      'min-[1440px]:left-[calc(58.333%_-_19px)]',
      'min-[1440px]:top-[446px]',
      'min-[1440px]:w-[611px]',
    )
    expect(screen.getByRole('heading', { name: 'Valor' }).className).toContain(
      'font-[family-name:var(--font-display)]',
    )
    expect(
      screen.getByText('Tecnologia só faz sentido quando gera valor de verdade.').className,
    ).toContain('font-[family-name:var(--font-body)]')
  })
})
