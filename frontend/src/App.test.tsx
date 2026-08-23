import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('composes the semantic header, navigation and main landmarks', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders exactly one page heading', () => {
    render(<App />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('uses only local fragment destinations for landing navigation', () => {
    render(<App />)
    const header = screen.getByRole('banner')
    const links = within(header).getAllByRole('link')

    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^#\w+/)
    }
  })

  it('integrates the hero search without Vite starter content', () => {
    render(<App />)

    expect(
      screen.getByRole('search', { name: 'Pesquisa de serviços' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Get started')).not.toBeInTheDocument()
    expect(screen.queryByText(/Count is/i)).not.toBeInTheDocument()
  })
})
