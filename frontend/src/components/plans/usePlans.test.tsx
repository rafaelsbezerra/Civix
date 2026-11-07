import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPlans } from '@/lib/api';
import { usePlans } from './usePlans';

vi.mock('@/lib/api', () => ({
  fetchPlans: vi.fn(),
}));

function PlansPreview() {
  const { plans, loading, error } = usePlans();

  if (loading) {
    return <p>Carregando</p>;
  }
  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <ul>
      {plans.map((plan) => (
        <li key={plan.id}>{plan.name}</li>
      ))}
    </ul>
  );
}

describe('usePlans', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error when the plans API is unavailable without substituting data', async () => {
    vi.mocked(fetchPlans).mockRejectedValue(
      new Error('Planos indisponíveis no backend.'),
    );

    render(<PlansPreview />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Planos indisponíveis no backend.',
    );
    expect(screen.queryByText('Plano Profissional')).not.toBeInTheDocument();
  });

  it('renders plans returned by the API', async () => {
    vi.mocked(fetchPlans).mockResolvedValue([
      {
        id: 'api-1',
        name: 'Plano retornado pela API',
        slug: 'plano-api',
        description: 'Plano real.',
        price: '20.00',
        billingPeriod: 'monthly',
        features: ['Benefício real'],
        limits: {},
        isFeatured: false,
        isActive: true,
        displayOrder: 1,
      },
    ]);

    render(<PlansPreview />);

    expect(await screen.findByText('Plano retornado pela API')).toBeInTheDocument();
  });
});
