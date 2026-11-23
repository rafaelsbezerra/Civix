import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ActionButton } from './ActionButton';

describe('ActionButton', () => {
  it('renders the primary variant with the Civix navy treatment', () => {
    render(
      <ActionButton href="#busca" variant="primary">
        Começar agora
      </ActionButton>,
    );

    const link = screen.getByRole('link', { name: 'Começar agora' });
    expect(link).toHaveAttribute('href', '#busca');
    expect(link).toHaveClass('bg-[#07192a]');
    expect(link).toHaveClass('hover:bg-[#102c43]');
    expect(link.className).toContain('font-[family-name:var(--font-display)]');
  });

  it('renders the light variant', () => {
    render(
      <ActionButton href="#sobre" variant="light">
        Saiba mais
      </ActionButton>,
    );

    expect(screen.getByRole('link', { name: 'Saiba mais' })).toHaveClass(
      'bg-[#faf9f6]',
      'hover:bg-[#e8e7e3]',
    );
  });

  it('renders the translucent variant', () => {
    render(
      <ActionButton href="#contato" variant="translucent">
        Fale conosco
      </ActionButton>,
    );

    expect(screen.getByRole('link', { name: 'Fale conosco' })).toHaveClass(
      'bg-[rgba(250,249,246,0.2)]',
      'hover:bg-[rgba(250,249,246,0.32)]',
    );
  });

  it('renders the login variant with a distinct login icon', () => {
    const { container } = render(
      <ActionButton href="/login" variant="login">
        Login
      </ActionButton>,
    );

    const link = screen.getByRole('link', { name: 'Login' });
    expect(link).toHaveAttribute('href', '/login');
    expect(link).toHaveClass('border-[#07192a]/20', 'bg-transparent');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows a decorative 24px arrow when requested', () => {
    const { container } = render(
      <ActionButton href="#busca" variant="primary" showArrow>
        Buscar
      </ActionButton>,
    );

    const arrow = container.querySelector('img');
    expect(arrow).toHaveAttribute('alt', '');
    expect(arrow).toHaveAttribute('aria-hidden', 'true');
    expect(arrow).toHaveAttribute('width', '24');
    expect(arrow).toHaveAttribute('height', '24');
  });

  it('does not render the arrow by default', () => {
    const { container } = render(
      <ActionButton href="#busca" variant="primary">
        Buscar
      </ActionButton>,
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('forwards anchor props and keeps a visible focus treatment', () => {
    render(
      <ActionButton
        aria-label="Abrir ajuda"
        href="/ajuda"
        rel="noreferrer"
        target="_blank"
        variant="light"
      >
        Ajuda
      </ActionButton>,
    );

    const link = screen.getByRole('link', { name: 'Abrir ajuda' });
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.className).toContain('focus-visible:');
  });
});
