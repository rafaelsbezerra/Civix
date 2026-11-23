import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { Plan } from '@/lib/api';
import { usePlans } from '@/components/plans/usePlans';
import { AppRoutes } from '@/routes/AppRoute';

vi.mock('@/components/plans/usePlans', () => ({
  usePlans: vi.fn(),
}));

const plan: Plan = {
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
};

describe('Plans route', () => {
  it('renders the plans page and marks its header link as current', () => {
    vi.mocked(usePlans).mockReturnValue({
      plans: [plan],
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/planos']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Escolha o espaço certo para sua empresa crescer.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Plano Profissional' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole(
        'link',
        { name: 'Planos' },
      ),
    ).toHaveAttribute('aria-current', 'page');
  });
});
