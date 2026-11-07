import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import App from './App';

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('composes the semantic header, navigation and main landmarks', () => {
    renderHome();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders exactly one page heading', () => {
    renderHome();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('uses the current application destinations in the landing header', () => {
    renderHome();
    const header = screen.getByRole('banner');
    const links = within(header).getAllByRole('link');

    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      expect.arrayContaining([
        '/',
        '/sobre',
        '/catalogo',
        '/planos',
        '#contato',
        '/login',
      ]),
    );
  });

  it('integrates the hero search without Vite starter content', () => {
    renderHome();

    expect(
      screen.getByRole('search', { name: 'Pesquisa de serviços' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Get started')).not.toBeInTheDocument();
    expect(screen.queryByText(/Count is/i)).not.toBeInTheDocument();
  });
});
