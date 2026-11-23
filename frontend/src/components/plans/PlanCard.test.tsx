import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Plan } from '@/lib/api';
import { PlanCard } from './PlanCard';

const plan: Plan = {
  id: '2',
  name: 'Plano Profissional',
  slug: 'profissional',
  description: 'Mais visibilidade e recursos para sua empresa.',
  price: '59.90',
  billingPeriod: 'monthly',
  features: ['Perfil em destaque', 'Relatórios básicos'],
  limits: { leads_per_month: 100 },
  isFeatured: true,
  isActive: true,
  displayOrder: 20,
};

describe('PlanCard', () => {
  it('presents plan details, localized price, benefits and recommended status', () => {
    render(<PlanCard plan={plan} />);

    expect(
      screen.getByRole('heading', { name: 'Plano Profissional' }),
    ).toBeInTheDocument();
    expect(screen.getByText('59,90')).toBeInTheDocument();
    expect(screen.getByText('por mês')).toBeInTheDocument();
    expect(screen.getByText('Perfil em destaque')).toBeInTheDocument();
    expect(screen.getByText('Relatórios básicos')).toBeInTheDocument();
    expect(screen.getByText('Recomendado')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Começar agora com Plano Profissional' }),
    ).toHaveAttribute('href', '/login');
  });
});
