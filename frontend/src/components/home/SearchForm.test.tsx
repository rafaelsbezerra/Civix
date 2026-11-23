import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BRAZIL_STATES } from '@/lib/brazil-states';

import { SearchForm } from './SearchForm';

describe('SearchForm', () => {
  it('associates accessible labels with every control', () => {
    render(<SearchForm />);

    expect(screen.getByLabelText('O que busca?')).toBeInTheDocument();
    expect(screen.getByLabelText('O que busca?').className).toContain(
      'font-[family-name:var(--font-display)]',
    );
    expect(screen.getByLabelText('Região')).toBeInTheDocument();
    expect(screen.getByLabelText('Faixa de preço')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pesquisar' })).toBeInTheDocument();
  });

  it('keeps edited query and selected UF locally', async () => {
    const user = userEvent.setup();
    render(<SearchForm />);

    await user.type(screen.getByLabelText('O que busca?'), 'Eletricista');
    await user.selectOptions(screen.getByLabelText('Região'), 'CE');

    expect(screen.getByLabelText('O que busca?')).toHaveValue('Eletricista');
    expect(screen.getByLabelText('Região')).toHaveValue('CE');
  });

  it('limits query text input to 100 characters and lists all 27 Brazilian UFs in Region select', async () => {
    const user = userEvent.setup();
    render(<SearchForm />);
    const query = screen.getByLabelText('O que busca?');
    const region = screen.getByLabelText('Região');

    await user.type(query, 'a'.repeat(105));

    expect(query).toHaveAttribute('maxlength', '100');
    expect(query).toHaveValue('a'.repeat(100));
    expect(region.tagName).toBe('SELECT');
    expect(region).toHaveValue('');
    for (const state of BRAZIL_STATES) {
      expect(
        screen.getByRole('option', { name: `${state.uf} - ${state.name}` }),
      ).toBeInTheDocument();
    }
  });

  it('starts with an empty price and offers illustrative ranges', () => {
    render(<SearchForm />);
    const price = screen.getByLabelText('Faixa de preço');

    expect(price).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Até R$ 100' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Acima de R$ 500' })).toBeInTheDocument();
  });

  it('updates the selected price range', async () => {
    const user = userEvent.setup();
    render(<SearchForm />);

    await user.selectOptions(screen.getByLabelText('Faixa de preço'), '100-300');

    expect(screen.getByLabelText('Faixa de preço')).toHaveValue('100-300');
  });

  it('prevents native navigation and calls onSubmit with current values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('O que busca?'), 'Pintura');
    await user.selectOptions(screen.getByLabelText('Região'), 'CE');
    await user.selectOptions(screen.getByLabelText('Faixa de preço'), '300-500');
    const form = screen.getByRole('search');
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });

    fireEvent(form, submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({
      priceRange: '300-500',
      query: 'Pintura',
      region: 'CE',
    });
  });

  it('does not reset values after submission', async () => {
    const user = userEvent.setup();
    render(<SearchForm />);
    const query = screen.getByLabelText('O que busca?');
    await user.type(query, 'Marcenaria');

    await user.click(screen.getByRole('button', { name: 'Pesquisar' }));

    expect(query).toHaveValue('Marcenaria');
  });

  it('hydrates optional initial values', () => {
    render(
      <SearchForm
        initialValues={{
          priceRange: '500-plus',
          query: 'Fotografia',
          region: 'SP',
        }}
      />,
    );

    expect(screen.getByLabelText('O que busca?')).toHaveValue('Fotografia');
    expect(screen.getByLabelText('Região')).toHaveValue('SP');
    expect(screen.getByLabelText('Faixa de preço')).toHaveValue('500-plus');
  });
});
