import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { SiteHeader } from './SiteHeader'

function renderHeader(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SiteHeader />
    </MemoryRouter>,
  )
}

describe('SiteHeader', () => {
  it('renders the logo, four desktop anchors and contact CTA', () => {
    renderHeader()

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
    expect(within(desktopNav).getByRole('link', { name: 'Planos' })).toHaveAttribute(
      'href',
      '/planos',
    )
    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute(
      'href',
      '/#contato',
    )
  })

  it('exposes accessible mobile menu state and relationship', () => {
    renderHeader()

    const menuButton = screen.getByRole('button', {
      name: 'Abrir menu principal',
    })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(menuButton).toHaveAttribute('aria-controls', 'mobile-navigation')
  })

  it('opens the compact navigation from the menu button', async () => {
    const user = userEvent.setup()
    renderHeader()

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
    renderHeader()
    const menuButton = screen.getByRole('button', {
      name: 'Abrir menu principal',
    })

    await user.click(menuButton)
    await user.click(screen.getByRole('button', { name: 'Fechar menu principal' }))

    expect(screen.queryByRole('navigation', { name: 'Navegação móvel' })).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the menu button', async () => {
    const user = userEvent.setup()
    renderHeader()
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
    renderHeader()
    await user.click(
      screen.getByRole('button', { name: 'Abrir menu principal' }),
    )
    const mobileNav = screen.getByRole('navigation', { name: 'Navegação móvel' })

    await user.click(within(mobileNav).getByRole('link', { name: 'Sobre' }))

    expect(screen.queryByRole('navigation', { name: 'Navegação móvel' })).not.toBeInTheDocument()
  })

  it('accepts a custom navigation collection', () => {
    render(
      <MemoryRouter>
        <SiteHeader navigationItems={[{ href: '/servicos', label: 'Serviços' }]} />
      </MemoryRouter>,
    )

    const desktopNav = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })
    expect(within(desktopNav).getByRole('link', { name: 'Serviços' })).toHaveAttribute(
      'href',
      '/servicos',
    )
  })

  it('marks Plans as the current page on /planos', () => {
    renderHeader('/planos')

    const desktopNav = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })
    expect(within(desktopNav).getByRole('link', { name: 'Planos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
