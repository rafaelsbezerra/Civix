import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SearchForm } from './SearchForm'

describe('SearchForm', () => {
  it('associates accessible labels with every control', () => {
    render(<SearchForm />)

    expect(screen.getByLabelText('O que busca?')).toBeInTheDocument()
    expect(screen.getByLabelText('Região')).toBeInTheDocument()
    expect(screen.getByLabelText('Faixa de preço')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pesquisar' })).toBeInTheDocument()
  })

  it('keeps edited query and region values locally', async () => {
    const user = userEvent.setup()
    render(<SearchForm />)

    await user.type(screen.getByLabelText('O que busca?'), 'Eletricista')
    await user.type(screen.getByLabelText('Região'), 'Aldeota')

    expect(screen.getByLabelText('O que busca?')).toHaveValue('Eletricista')
    expect(screen.getByLabelText('Região')).toHaveValue('Aldeota')
  })

  it('limits both text inputs to 100 characters', async () => {
    const user = userEvent.setup()
    render(<SearchForm />)
    const query = screen.getByLabelText('O que busca?')
    const region = screen.getByLabelText('Região')

    await user.type(query, 'a'.repeat(105))
    await user.type(region, 'b'.repeat(105))

    expect(query).toHaveAttribute('maxlength', '100')
    expect(region).toHaveAttribute('maxlength', '100')
    expect(query).toHaveValue('a'.repeat(100))
    expect(region).toHaveValue('b'.repeat(100))
  })

  it('starts with an empty price and offers illustrative ranges', () => {
    render(<SearchForm />)
    const price = screen.getByLabelText('Faixa de preço')

    expect(price).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Até R$ 100' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Acima de R$ 500' })).toBeInTheDocument()
  })

  it('updates the selected price range', async () => {
    const user = userEvent.setup()
    render(<SearchForm />)

    await user.selectOptions(
      screen.getByLabelText('Faixa de preço'),
      '100-300',
    )

    expect(screen.getByLabelText('Faixa de preço')).toHaveValue('100-300')
  })

  it('prevents native navigation and calls onSubmit with current values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SearchForm onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('O que busca?'), 'Pintura')
    await user.type(screen.getByLabelText('Região'), 'Meireles')
    await user.selectOptions(screen.getByLabelText('Faixa de preço'), '300-500')
    const form = screen.getByRole('search')
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })

    fireEvent(form, submitEvent)

    expect(submitEvent.defaultPrevented).toBe(true)
    expect(onSubmit).toHaveBeenCalledWith({
      priceRange: '300-500',
      query: 'Pintura',
      region: 'Meireles',
    })
  })

  it('does not reset values after submission', async () => {
    const user = userEvent.setup()
    render(<SearchForm />)
    const query = screen.getByLabelText('O que busca?')
    await user.type(query, 'Marcenaria')

    await user.click(screen.getByRole('button', { name: 'Pesquisar' }))

    expect(query).toHaveValue('Marcenaria')
  })

  it('hydrates optional initial values', () => {
    render(
      <SearchForm
        initialValues={{ priceRange: '500-plus', query: 'Fotografia', region: 'Centro' }}
      />,
    )

    expect(screen.getByLabelText('O que busca?')).toHaveValue('Fotografia')
    expect(screen.getByLabelText('Região')).toHaveValue('Centro')
    expect(screen.getByLabelText('Faixa de preço')).toHaveValue('500-plus')
  })
})
