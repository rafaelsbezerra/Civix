import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
      '/#planos',
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

  it('identifica Empresas como página atual no catálogo', () => {
    renderHeader('/catalogo')

    const desktopNav = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })
    expect(within(desktopNav).getByRole('link', { name: 'Empresas' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('mantém destinos de seções na Home e reserva espaço para a navbar fixa', () => {
    const { container } = renderHeader()
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })

    expect(within(nav).getByRole('link', { name: 'Sobre' })).toHaveAttribute('href', '/#sobre')
    expect(within(nav).getByRole('link', { name: 'Empresas' })).toHaveAttribute('href', '/#empresas')
    expect(within(nav).getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/#faq')
    expect(screen.getByRole('banner')).toHaveClass('fixed', 'z-40')
    expect(container.querySelector('[aria-hidden="true"].h-\\[76px\\]')).toBeInTheDocument()
    expect(container.querySelector('#contato')).not.toBeInTheDocument()
  })

  it('acompanha a seção visível no desktop e no menu móvel após scroll', async () => {
    const rectangles: Record<string, { top: number; bottom: number }> = {
      home: { top: -500, bottom: -100 }, empresas: { top: 40, bottom: 500 }, planos: { top: 600, bottom: 1000 },
    }
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const bounds = rectangles[this.id] ?? { top: 0, bottom: 106 }
      return { ...bounds, height: bounds.bottom - bounds.top, width: 100, x: 0, y: bounds.top, left: 0, right: 100, toJSON: () => ({}) }
    })
    vi.stubGlobal('scrollY', 200)
    render(<MemoryRouter><SiteHeader /><section id="home" /><section id="empresas" /><section id="planos" /></MemoryRouter>)
    const desktop = screen.getByRole('navigation', { name: 'Navegação principal' })

    await waitFor(() => expect(within(desktop).getByRole('link', { name: 'Empresas' })).toHaveAttribute('aria-current', 'location'))
    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu principal' }))
    expect(within(screen.getByRole('navigation', { name: 'Navegação móvel' })).getByRole('link', { name: 'Empresas' })).toHaveAttribute('aria-current', 'location')
    rectangles.empresas = { top: -500, bottom: -20 }
    rectangles.planos = { top: 30, bottom: 500 }
    fireEvent.scroll(window)
    await waitFor(() => expect(within(desktop).getByRole('link', { name: 'Planos' })).toHaveAttribute('aria-current', 'location'))
    expect(within(desktop).getByRole('link', { name: 'Empresas' })).not.toHaveAttribute('aria-current')
  })

  it('identifica a seção ao abrir uma âncora inicial e limpa listeners no unmount', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const top = this.id === 'planos' ? 40 : -500
      return { top, bottom: top + 500, height: 500, width: 100, x: 0, y: top, left: 0, right: 100, toJSON: () => ({}) }
    })
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<MemoryRouter initialEntries={['/#planos']}><SiteHeader /><section id="planos" /></MemoryRouter>)

    await waitFor(() => expect(screen.getByRole('link', { name: 'Planos' })).toHaveAttribute('aria-current', 'location'))
    unmount()
    expect(remove.mock.calls.map(call => call[0])).toEqual(expect.arrayContaining(['scroll', 'resize', 'hashchange']))
  })

})
