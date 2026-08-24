import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppRoutes } from './AppRoute'

describe('AppRoutes', () => {
  it('renders the About page at /sobre', () => {
    render(
      <MemoryRouter initialEntries={['/sobre']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Transformamos atendimento em oportunidades.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Princípios da Civix' })).toBeInTheDocument()
  })
})
