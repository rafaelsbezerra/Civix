import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccessChoice from './AccessChoice'
import ClientAccess from './ClientAccess'
import Login from './login'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async importOriginal => ({
  ...await importOriginal<typeof import('react-router-dom')>(), useNavigate: () => navigate,
}))
const fetchMock = vi.fn<typeof fetch>()
const setItem = vi.fn()

function respond(body: unknown, status: number) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  }))
}

beforeEach(() => {
  fetchMock.mockReset()
  navigate.mockReset()
  setItem.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('localStorage', { setItem })
})
afterEach(() => vi.unstubAllGlobals())

describe('Escolha e formulários de acesso', () => {
  it.each([
    ['Sou empresa', '/login/empresa'],
    ['Sou cliente', '/login/cliente'],
    ['Sou atendente', '/login/atendente'],
  ])('escolha %s abre %s', (label, destination) => {
    const { container } = render(<MemoryRouter initialEntries={['/login']}><AccessChoice /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Escolha seu acesso' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(container.querySelector('form')).toBeNull()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }))
    expect(navigate).toHaveBeenCalledWith(destination)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('cliente mostra a mensagem diretamente, sem formulário, requisição ou sessão', () => {
    const { container } = render(<MemoryRouter initialEntries={['/login/cliente']}><ClientAccess /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'A área logada do cliente está sendo construída.' })).toBeInTheDocument()
    expect(container.querySelector('form')).toBeNull()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('login empresarial encaminha admin_empresa para o dashboard após autenticação', async () => {
    respond({ data: { user: {
      id: 'user-1', email: 'empresa@example.test', role: 'admin_empresa', companyId: 'company-1',
    } } }, 200)
    render(<MemoryRouter initialEntries={['/login/empresa']}><Login /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: /Sou empresa|Sou cliente/ })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'empresa@example.test' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-teste' } })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard-empresa'))
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: 'empresa@example.test',
      password: 'senha-teste',
      role: 'admin_empresa',
    })
    expect(setItem).not.toHaveBeenCalled()
  })

  it('login do atendente envia o papel esperado e abre o dashboard operacional', async () => {
    respond({ data: { user: {
      id: 'attendant-1',
      email: 'atendente@example.test',
      role: 'atendente',
      companyId: 'company-1',
    } } }, 200)
    render(<MemoryRouter initialEntries={['/login/atendente']}><Login access="atendente" /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'atendente@example.test' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-teste' } })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard-atendente'))
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: 'atendente@example.test',
      password: 'senha-teste',
      role: 'atendente',
    })
    expect(setItem).not.toHaveBeenCalled()
  })
})
