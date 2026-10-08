import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Plan } from '@/lib/api'
import { usePlans } from '@/components/plans/usePlans'
import { PlansSection } from './PlansSection'

vi.mock('@/components/plans/usePlans', () => ({
  usePlans: vi.fn(),
}))

const plans: Plan[] = [
  {
    id: '1',
    name: 'Plano Inicial',
    slug: 'inicial',
    description: 'Presença profissional para começar a crescer.',
    price: '0.00',
    billingPeriod: 'monthly',
    features: ['Perfil no catálogo'],
    limits: { leads_per_month: 10 },
    isFeatured: false,
    isActive: true,
    displayOrder: 10,
  },
  {
    id: '2',
    name: 'Plano Profissional',
    slug: 'profissional',
    description: 'Mais visibilidade e recursos para sua empresa.',
    price: '59.90',
    billingPeriod: 'monthly',
    features: ['Perfil em destaque'],
    limits: { leads_per_month: 100 },
    isFeatured: true,
    isActive: true,
    displayOrder: 20,
  },
]

describe('PlansSection', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders plans from the shared source and links to the full page', () => {
    vi.mocked(usePlans).mockReturnValue({
      plans,
      loading: false,
      error: null,
    })

    render(<PlansSection />)

    expect(
      screen.getByRole('heading', {
        name: 'O plano certo para cada etapa do seu crescimento',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Plano Inicial' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Plano Profissional' })).toBeInTheDocument()
    expect(screen.getByText('Recomendado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todos os planos' })).toHaveAttribute(
      'href',
      '/planos',
    )
  })

  it('announces API errors instead of hiding the plans section failure', () => {
    vi.mocked(usePlans).mockReturnValue({
      plans: [],
      loading: false,
      error: 'Não foi possível carregar os planos agora.',
    })

    render(<PlansSection />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os planos agora.',
    )
    expect(screen.getByRole('link', { name: 'Ver todos os planos' })).toBeInTheDocument()
  })
})
