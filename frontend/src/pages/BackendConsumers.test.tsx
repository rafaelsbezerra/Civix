import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Login from './login'
import FirstAccess from './FirstAccess'
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('react-router-dom', async importOriginal => ({
  ...await importOriginal<typeof import('react-router-dom')>(),
  useNavigate: () => navigate,
}))

const fetchMock = vi.fn<typeof fetch>()

function respond(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  }))
}

function renderPage(element: React.ReactElement, entry: string) {
  return render(<MemoryRouter initialEntries={[entry]}>{element}</MemoryRouter>)
}

function fillPassword(confirmPlaceholder: string) {
  fireEvent.change(screen.getByPlaceholderText('Mínimo de 8 caracteres'), { target: { value: 'senha-teste-123' } })
  fireEvent.change(screen.getByPlaceholderText(confirmPlaceholder), { target: { value: 'senha-teste-123' } })
}

describe('Formulários existentes integrados ao backend', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    navigate.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('Recuperação envia e-mail e reconhece sucesso em data', async () => {
    respond({ data: { message: 'Instruções enviadas.' } })
    renderPage(<ForgotPassword />, '/esqueci-senha')
    fireEvent.change(screen.getByPlaceholderText('seu.email@exemplo.com'), { target: { value: 'pessoa@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar Link de Recuperação' }))

    expect(await screen.findByRole('heading', { name: 'E-mail Enviado!' })).toBeInTheDocument()
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/v1\/users\/esqueci-senha$/)
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ email: 'pessoa@example.test' })
  })

  it('Recuperação exibe a mensagem pública do backend sem seu diagnóstico', async () => {
    respond({ status: 503, message: 'Recuperação temporariamente indisponível.', stack: 'pilha-confidencial', details: { source: 'diagnóstico-confidencial' } }, 503)
    renderPage(<ForgotPassword />, '/esqueci-senha')
    fireEvent.change(screen.getByPlaceholderText('seu.email@exemplo.com'), { target: { value: 'pessoa@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar Link de Recuperação' }))

    expect(await screen.findByText('Recuperação temporariamente indisponível.')).toBeInTheDocument()
    expect(screen.queryByText(/confidencial/)).not.toBeInTheDocument()
  })

  it('Redefinição envia o token da URL e a nova senha pelo contrato atual', async () => {
    respond({ data: { message: 'Senha atualizada.' } })
    renderPage(<ResetPassword />, '/redefinir-senha?token=reset%2Bcom%2Fbarra')
    fillPassword('Repita a nova senha')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Nova Senha' }))

    expect(await screen.findByRole('heading', { name: 'Senha Alterada!' })).toBeInTheDocument()
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/v1\/users\/redefinir-senha$/)
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ token: 'reset+com/barra', password: 'senha-teste-123' })
  })

  it('Redefinição inválida mostra message e mantém o formulário', async () => {
    respond({ status: 400, message: 'Token inválido ou expirado.' }, 400)
    renderPage(<ResetPassword />, '/redefinir-senha?token=reset-invalido')
    fillPassword('Repita a nova senha')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Nova Senha' }))

    expect(await screen.findByText('Token inválido ou expirado.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar Nova Senha' })).toBeEnabled()
  })

  it('Link de redefinição sem token usa a rota existente de recuperação sem chamar API', () => {
    renderPage(<ResetPassword />, '/redefinir-senha')
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar Novo Link' }))

    expect(navigate).toHaveBeenCalledWith('/esqueci-senha')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each(['query', 'param'])('Primeiro acesso aceita token por %s e ativa após validação do mesmo convite', async source => {
    const token = 'convite+com/barra?outro=1'
    const encoded = encodeURIComponent(token)

    respond({ data: { email: 'pessoa@example.test' } })
    respond({ data: { message: 'Conta ativada.' } })
    render(
      <MemoryRouter initialEntries={[source === 'query' ? '/primeiro-acesso?token=' + encoded : '/primeiro-acesso/' + encoded]}>
        <Routes>
          <Route path="/primeiro-acesso" element={<FirstAccess />} />
          <Route path="/primeiro-acesso/:token" element={<FirstAccess />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('pessoa@example.test')).toBeInTheDocument()
    const url = new URL(String(fetchMock.mock.calls[0][0]), 'http://frontend.example.test')

    expect(url.pathname).toBe('/api/auth/validate-token')
    expect(url.searchParams.get('token')).toBe(token)
    expect(url.searchParams.size).toBe(1)
    fillPassword('Repita a senha digitada')
    fireEvent.click(screen.getByRole('button', { name: 'Ativar Conta e Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Senha Cadastrada!' })).toBeInTheDocument()
    expect(String(fetchMock.mock.calls[1][0])).toMatch(/\/api\/auth\/first-access$/)
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ token, password: 'senha-teste-123' })
  })

  it('Primeiro acesso mostra falha pública de pré-validação sem apresentar a senha', async () => {
    respond({ status: 401, message: 'Link de convite inválido ou expirado.', stack: 'diagnóstico-interno' }, 401)
    renderPage(<FirstAccess />, '/primeiro-acesso?token=convite-expirado')

    expect(await screen.findByText('Link de convite inválido ou expirado.')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Mínimo de 8 caracteres')).not.toBeInTheDocument()
    expect(screen.queryByText('diagnóstico-interno')).not.toBeInTheDocument()
  })

  it('Primeiro acesso cancela a pré-validação quando a tela é desmontada', async () => {
    let finish: ((response: Response) => void) | undefined

    fetchMock.mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve }))
    const { unmount } = renderPage(<FirstAccess />, '/primeiro-acesso?token=convite-pendente')

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const signal = fetchMock.mock.calls[0][1]?.signal

    expect(signal).toBeInstanceOf(AbortSignal)
    unmount()
    expect(signal?.aborted).toBe(true)
    await act(async () => { finish?.(new Response(JSON.stringify({ data: { email: 'pessoa@example.test' } }))) })
  })
  it.each([
    ['admin_empresa', 'empresa', '/dashboard-empresa'],
    ['atendente', 'atendente', '/dashboard-atendente'],
  ] as const)('Login %s armazena token e abre sua área', async (role, access, destination) => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { setItem })
    respond({ data: { token: 'token-sintetico', user: { id: 'user-1', name: 'Teste', email: 'pessoa@example.test', role, companyId: 'company-1' } } })
    renderPage(<Login access={access} />, `/login/${access}`)
    fireEvent.change(screen.getByPlaceholderText('seu_email@email.com'), { target: { value: 'pessoa@example.test' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'senha-teste' } })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => expect(setItem).toHaveBeenCalledWith('token', 'token-sintetico'))
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: 'pessoa@example.test',
      password: 'senha-teste',
      role,
    })
    expect(navigate).toHaveBeenCalledWith(destination)
  })

  it('Login com falha mostra mensagem pública sem gravar token ou navegar', async () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { setItem })
    respond({ status: 401, message: 'Credenciais inválidas.', stack: 'diagnóstico privado' }, 401)
    renderPage(<Login />, '/login')
    fireEvent.change(screen.getByPlaceholderText('seu_email@email.com'), { target: { value: 'pessoa@example.test' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'senha-teste' } })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    expect(await screen.findByText('Credenciais inválidas.')).toBeInTheDocument()
    expect(screen.queryByText(/diagnóstico privado/)).not.toBeInTheDocument()
    expect(setItem).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

})
