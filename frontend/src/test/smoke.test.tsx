import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('React test environment', () => {
  it('renders semantic and decorative content in jsdom', () => {
    const { container } = render(
      <main aria-label="Conteúdo principal">
        <img alt="" aria-hidden="true" src="/decorative.svg" />
      </main>,
    );

    expect(
      screen.getByRole('main', { name: 'Conteúdo principal' }),
    ).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(container.querySelector('img')).toHaveAttribute('aria-hidden', 'true');
  });
});
