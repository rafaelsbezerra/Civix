import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  it('renders the single hero heading from the approved frame', () => {
    render(<HeroSection />)

    const heading = screen.getByRole('heading', {
        level: 1,
        name: 'A TECNOLOGIA QUE CONSTRÓI O FUTURO',
      })
    expect(heading).toBeInTheDocument()
    expect(heading.className).toContain('font-[family-name:var(--font-display)]')
  })

  it('renders the supporting platform copy', () => {
    render(<HeroSection />)

    expect(
      screen.getByText(/A plataforma que conecta pessoas, serviços e soluções/i),
    ).toBeInTheDocument()
  })

  it('renders local anchors for the two hero actions', () => {
    render(<HeroSection />)

    expect(screen.getByRole('link', { name: 'Sobre nós' })).toHaveAttribute(
      'href',
      '#sobre',
    )
    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute(
      'href',
      '#contato',
    )
  })

  it('marks both visual assets as decorative', () => {
    render(<HeroSection />)
    const heroSurface = screen.getByTestId('hero-surface')
    const decorativeImages = heroSurface.querySelectorAll('img[aria-hidden="true"]')

    expect(decorativeImages).toHaveLength(2)
    for (const image of decorativeImages) {
      expect(image).toHaveAttribute('alt', '')
    }
  })

  it('composes the local search form', () => {
    render(<HeroSection />)
    const search = screen.getByRole('search', { name: 'Pesquisa de serviços' })

    expect(within(search).getByLabelText('O que busca?')).toBeInTheDocument()
    expect(within(search).getByRole('button', { name: 'Pesquisar' })).toBeInTheDocument()
  })

  it('keeps the reference desktop geometry classes', () => {
    render(<HeroSection />)

    expect(screen.getByTestId('hero-surface')).toHaveClass(
      'max-w-[1600px]',
      'lg:h-[900px]',
    )
    expect(screen.getByTestId('hero-search-card')).toHaveClass(
      'lg:top-[811px]',
      'lg:w-[69%]',
    )
  })
})
