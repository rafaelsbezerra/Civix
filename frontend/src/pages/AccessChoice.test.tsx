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

function submitClient() {
  render(<MemoryRouter initialEntries={['/login/cliente']}><ClientAccess /></MemoryRouter>)
  expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'cliente@example.test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Login' }))
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
  ])('escolha %s contém somente dois destinos e abre %s', (label, destination) => {
    const { container } = render(<MemoryRouter initialEntries={['/login']}><AccessChoice /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Escolha seu acesso' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(container.querySelector('form')).toBeNull()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }))
    expect(navigate).toHaveBeenCalledWith(destination)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('cliente envia somente e-mail e perfil, apresenta construção no 403 e não inicia sessão', async () => {
    respond({ status: 403, message: 'Acesso indisponível.' }, 403)
    submitClient()
    expect(await screen.findByRole('alert')).toHaveTextContent('A área logada do cliente está sendo construída.')
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/v1\/users\/login$/)
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST')
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ email: 'cliente@example.test', role: 'cliente' })
    expect(setItem).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('cliente preserva erro público de servidor sem apresentá-lo como construção', async () => {
    respond({ status: 500, message: 'Serviço temporariamente indisponível.' }, 500)
    submitClient()
    expect(await screen.findByRole('alert')).toHaveTextContent('Serviço temporariamente indisponível.')
    expect(screen.queryByText(/está sendo construída/)).not.toBeInTheDocument()
    expect(setItem).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('cliente preserva falha de rede sem apresentá-la como construção', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    submitClient()
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API. Tente novamente.')
    expect(screen.queryByText(/está sendo construída/)).not.toBeInTheDocument()
    expect(setItem).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('cliente rejeita sucesso inesperado sem armazenar token nem navegar', async () => {
    respond({ data: { token: 'token-indevido' } }, 200)
    submitClient()
    expect(await screen.findByRole('alert')).toHaveTextContent('A API retornou uma resposta inesperada para o acesso de cliente.')
    expect(setItem).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('acesso empresarial envia e-mail e senha sem escolher perfil e mantém destino Home', async () => {
    respond({ data: { token: 'token-teste', user: {
      id: 'user-1', email: 'empresa@example.test', role: 'admin_empresa', companyId: 'company-1',
    } } }, 200)
    render(<MemoryRouter initialEntries={['/login/empresa']}><Login /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: /Sou empresa|Sou cliente/ })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'empresa@example.test' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-teste' } })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => expect(setItem).toHaveBeenCalledWith('token', 'token-teste'))
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ email: 'empresa@example.test', password: 'senha-teste' })
    expect(navigate).toHaveBeenCalledWith('/')
  })
})
