import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AboutPage from './About'

describe('AboutPage', () => {
  it('renders the semantic page with a single approved heading', () => {
    render(<AboutPage />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Sobre a Civix' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Transformamos atendimento em oportunidades.',
      }),
    ).toBeInTheDocument()
  })

  it('renders the Figma marker and exact institutional introduction', () => {
    render(<AboutPage />)

    expect(screen.getByText('//', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Sobre nós', { exact: true })).toBeInTheDocument()
    expect(
      screen.getByText(
        /A Civix nasceu para tornar o atendimento comercial mais inteligente, ágil e eficiente\./,
      ),
    ).toHaveTextContent(
      'A Civix nasceu para tornar o atendimento comercial mais inteligente, ágil e eficiente. Unimos inteligência artificial, automação e gestão para ajudar empresas a se relacionarem melhor com seus clientes, identificarem novas oportunidades e transformarem conversas em negócios.',
    )
  })

  it('composes the visual and the institutional principles', () => {
    render(<AboutPage />)

    expect(screen.getByTestId('about-visual')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Princípios da Civix' })).toBeInTheDocument()
  })

  it('keeps the reference frame and copy geometry on desktop', () => {
    render(<AboutPage />)

    const frame = screen.getByTestId('about-frame')
    const heading = screen.getByRole('heading', { level: 1 })
    const marker = screen.getByTestId('about-marker')

    expect(frame).toHaveClass('min-[1440px]:h-[760px]', 'min-[1440px]:max-w-[1728px]')
    expect(marker).toHaveClass('min-[1440px]:left-[128px]', 'min-[1440px]:top-[80px]')
    expect(heading).toHaveClass(
      'min-[1440px]:left-[calc(41.667%+93px)]',
      'min-[1440px]:top-[80px]',
      'min-[1440px]:w-[683px]',
      'min-[1440px]:text-[48px]',
    )
  })

  it('uses Civix typography for heading, marker, and supporting copy', () => {
    render(<AboutPage />)

    expect(screen.getByRole('heading', { level: 1 }).className).toContain(
      'font-[family-name:var(--font-display)]',
    )
    expect(screen.getByTestId('about-marker').className).toContain(
      'font-[family-name:var(--font-display)]',
    )
    expect(screen.getByTestId('about-introduction').className).toContain(
      'font-[family-name:var(--font-body)]',
    )
  })
})
