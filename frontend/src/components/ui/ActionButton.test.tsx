import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ActionButton } from './ActionButton'

describe('ActionButton', () => {
  it('renders the primary variant with the Civix gold treatment', () => {
    render(
      <ActionButton href="#busca" variant="primary">
        Começar agora
      </ActionButton>,
    )

    const link = screen.getByRole('link', { name: 'Começar agora' })
    expect(link).toHaveAttribute('href', '#busca')
    expect(link).toHaveClass('bg-[var(--color-civix-gold)]')
  })

  it('renders the light variant', () => {
    render(
      <ActionButton href="#sobre" variant="light">
        Saiba mais
      </ActionButton>,
    )

    expect(screen.getByRole('link', { name: 'Saiba mais' })).toHaveClass(
      'bg-[var(--color-civix-ivory)]',
    )
  })

  it('renders the translucent variant', () => {
    render(
      <ActionButton href="#contato" variant="translucent">
        Fale conosco
      </ActionButton>,
    )

    expect(screen.getByRole('link', { name: 'Fale conosco' })).toHaveClass(
      'bg-white/10',
    )
  })

  it('shows a decorative 24px arrow when requested', () => {
    const { container } = render(
      <ActionButton href="#busca" variant="primary" showArrow>
        Buscar
      </ActionButton>,
    )

    const arrow = container.querySelector('img')
    expect(arrow).toHaveAttribute('alt', '')
    expect(arrow).toHaveAttribute('aria-hidden', 'true')
    expect(arrow).toHaveAttribute('width', '24')
    expect(arrow).toHaveAttribute('height', '24')
  })

  it('does not render the arrow by default', () => {
    const { container } = render(
      <ActionButton href="#busca" variant="primary">
        Buscar
      </ActionButton>,
    )

    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('forwards anchor props and keeps a visible focus treatment', () => {
    render(
      <ActionButton
        aria-label="Abrir ajuda"
        href="/ajuda"
        rel="noreferrer"
        target="_blank"
        variant="light"
      >
        Ajuda
      </ActionButton>,
    )

    const link = screen.getByRole('link', { name: 'Abrir ajuda' })
    expect(link).toHaveAttribute('rel', 'noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.className).toContain('focus-visible:')
  })
})
