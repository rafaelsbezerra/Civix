import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { SiteHeader } from './SiteHeader'

describe('SiteHeader', () => {
  it('renders the logo, four desktop anchors and contact CTA', () => {
    render(<SiteHeader />)

    expect(screen.getByRole('img', { name: 'Civix' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Civix — início' })).toHaveClass(
      'min-h-11',
    )
    const desktopNav = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })

    for (const label of ['Home', 'Sobre', 'Empresas', 'Planos']) {
      expect(within(desktopNav).getByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute(
      'href',
      '#contato',
    )
  })

  it('exposes accessible mobile menu state and relationship', () => {
    render(<SiteHeader />)

    const menuButton = screen.getByRole('button', {
      name: 'Abrir menu principal',
    })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(menuButton).toHaveAttribute('aria-controls', 'mobile-navigation')
  })

  it('opens the compact navigation from the menu button', async () => {
    const user = userEvent.setup()
    render(<SiteHeader />)

    await user.click(
      screen.getByRole('button', { name: 'Abrir menu principal' }),
    )

    expect(screen.getByRole('navigation', { name: 'Navegação móvel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fechar menu principal' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('closes the compact navigation from the toggle', async () => {
    const user = userEvent.setup()
    render(<SiteHeader />)
    const menuButton = screen.getByRole('button', {
      name: 'Abrir menu principal',
    })

    await user.click(menuButton)
    await user.click(screen.getByRole('button', { name: 'Fechar menu principal' }))

    expect(screen.queryByRole('navigation', { name: 'Navegação móvel' })).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the menu button', async () => {
    const user = userEvent.setup()
    render(<SiteHeader />)
    const menuButton = screen.getByRole('button', {
      name: 'Abrir menu principal',
    })
    await user.click(menuButton)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByRole('navigation', { name: 'Navegação móvel' })).not.toBeInTheDocument()
    expect(menuButton).toHaveFocus()
  })

  it('closes after a mobile navigation anchor is selected', async () => {
    const user = userEvent.setup()
    render(<SiteHeader />)
    await user.click(
      screen.getByRole('button', { name: 'Abrir menu principal' }),
    )
    const mobileNav = screen.getByRole('navigation', { name: 'Navegação móvel' })

    await user.click(within(mobileNav).getByRole('link', { name: 'Sobre' }))

    expect(screen.queryByRole('navigation', { name: 'Navegação móvel' })).not.toBeInTheDocument()
  })

  it('accepts a custom navigation collection', () => {
    render(
      <SiteHeader navigationItems={[{ href: '#servicos', label: 'Serviços' }]} />,
    )

    const desktopNav = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })
    expect(within(desktopNav).getByRole('link', { name: 'Serviços' })).toHaveAttribute(
      'href',
      '#servicos',
    )
  })
})
