import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { SuperAdminLayout } from '../../components/dashboard-super-admin/layout/SuperAdminLayout'
import { ApiError, getPlatformPlans, getSessionProfile, registerCompany, savePlatformPlan, setPlatformPlanActive, updateOwnProfile, type CompanyRegistrationResult, type Plan, type SessionProfile } from '../../lib/api'
import Plans from './Plans'
import CompanyCreate from './CompanyCreate'
import ProfileSettings from './ProfileSettings'

vi.mock('../../lib/api', async original => ({
  ...await original<typeof import('../../lib/api')>(),
  getPlatformPlans: vi.fn(), getSessionProfile: vi.fn(), registerCompany: vi.fn(),
  savePlatformPlan: vi.fn(), setPlatformPlanActive: vi.fn(), updateOwnProfile: vi.fn(),
}))

const session: SessionProfile = {
  user: { id: 'super-1', name: 'Admin Inicial', email: 'admin@example.test', role: 'super_admin', companyId: null },
  permissions: { uploadCompanyCover: true },
}
const plan: Plan = { id: 'plan-1', name: 'Profissional', slug: 'profissional', description: 'Plano comercial', price: '59.90', billingPeriod: 'monthly', features: ['Catálogo'], limits: {}, isFeatured: false, isActive: true, displayOrder: 10 }
const memory = new Map<string, string>()
const storage = {
  getItem: vi.fn((key: string) => memory.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => memory.set(key, value)),
  removeItem: vi.fn((key: string) => memory.delete(key)),
}

function renderArea(path: string, guarded = false) {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/login" element={<p>Login necessário</p>} />
    <Route path="/login/empresa" element={<p>Entre com seu novo e-mail</p>} />
    <Route element={guarded ? <ProtectedRoute allowedRoles={['super_admin']} /> : <Outlet context={session} />}>
      <Route path="/dashboard/super-admin" element={<SuperAdminLayout />}>
        <Route index element={<p>Visão inicial autorizada</p>} />
        <Route path="plans" element={<Plans />} />
        <Route path="companies/new" element={<CompanyCreate />} />
        <Route path="settings/profile" element={<ProfileSettings />} />
      </Route>
    </Route>
  </Routes></MemoryRouter>)
}

describe('Fluxos do dashboard de superadmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memory.clear()
    memory.set('token', 'token-sintetico')
    vi.stubGlobal('localStorage', storage)
    vi.mocked(getPlatformPlans).mockReset().mockResolvedValue([plan])
    vi.mocked(getSessionProfile).mockReset().mockResolvedValue(session)
    vi.mocked(savePlatformPlan).mockReset()
    vi.mocked(registerCompany).mockReset()
    vi.mocked(updateOwnProfile).mockReset()
    vi.mocked(setPlatformPlanActive).mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('Não libera dashboard para admin empresarial nem quando possui permissão de upload', async () => {
    vi.mocked(getSessionProfile).mockResolvedValue({ ...session, user: { ...session.user, role: 'admin_empresa', companyId: 'empresa-1' } })
    renderArea('/dashboard/super-admin', true)
    expect(await screen.findByRole('alert')).toHaveTextContent('Acesso não permitido')
    expect(screen.queryByText('Visão inicial autorizada')).not.toBeInTheDocument()
    expect(getPlatformPlans).not.toHaveBeenCalled()
  })

  it('Tema inicia claro, responde ao teclado, persiste e não modifica o tema público', async () => {
    const user = userEvent.setup()
    const originalClass = document.documentElement.className
    const first = renderArea('/dashboard/super-admin')
    const toggle = screen.getByRole('button', { name: 'Ativar modo escuro' })
    expect(first.container.querySelector('.super-admin-root')).toHaveAttribute('data-theme', 'light')
    toggle.focus()
    await user.keyboard('{Enter}')
    expect(first.container.querySelector('.super-admin-root')).toHaveAttribute('data-theme', 'dark')
    expect(memory.get('civix:super-admin:theme')).toBe('dark')
    expect(document.documentElement.className).toBe(originalClass)
    first.unmount()
    const second = renderArea('/dashboard/super-admin')
    expect(second.container.querySelector('.super-admin-root')).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Ativar modo claro' })).toBeInTheDocument()
  })

  it('Planos distingue lista vazia de falha e permite repetir consulta', async () => {
    vi.mocked(getPlatformPlans).mockRejectedValueOnce(new ApiError('Consulta indisponível')).mockResolvedValueOnce([])
    renderArea('/dashboard/super-admin/plans')
    expect(await screen.findByRole('alert')).toHaveTextContent('Consulta indisponível')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Nenhum plano cadastrado.')).toBeInTheDocument()
    expect(getPlatformPlans).toHaveBeenCalledTimes(2)
  })

  it('Criar e editar plano envia campos comerciais sem transportar ID no corpo', async () => {
    vi.mocked(savePlatformPlan).mockResolvedValue(plan)
    renderArea('/dashboard/super-admin/plans')
    await screen.findByRole('button', { name: 'Editar Profissional' })
    fireEvent.click(screen.getByRole('button', { name: 'Novo plano' }))
    fireEvent.change(screen.getByLabelText('Nome do plano'), { target: { value: 'Profissional' } })
    fireEvent.change(screen.getByLabelText('Identificador (slug)'), { target: { value: 'profissional' } })
    fireEvent.change(screen.getByLabelText(/Preço em reais/), { target: { value: '59,90' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar plano' }))
    await screen.findByText('Plano salvo com sucesso.')
    expect(savePlatformPlan).toHaveBeenCalledWith(expect.objectContaining({ name: 'Profissional', price: '59.90', isActive: true }), undefined)
    expect(vi.mocked(savePlatformPlan).mock.calls[0][0]).not.toHaveProperty('id')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Profissional' }))
    fireEvent.change(screen.getByLabelText('Nome do plano'), { target: { value: 'Profissional revisado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar plano' }))
    await waitFor(() => expect(savePlatformPlan).toHaveBeenCalledTimes(2))
    expect(savePlatformPlan).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Profissional revisado' }), plan.id)
    expect(vi.mocked(savePlatformPlan).mock.calls[1][0]).not.toHaveProperty('id')
  })

  it('Falha ao desativar plano mantém disponibilidade e mensagem pública', async () => {
    vi.mocked(setPlatformPlanActive).mockRejectedValue(new ApiError('Plano não pode ser alterado', 409))
    renderArea('/dashboard/super-admin/plans')
    fireEvent.click(await screen.findByRole('button', { name: 'Desativar Profissional' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Plano não pode ser alterado')
    expect(screen.getByRole('button', { name: 'Desativar Profissional' })).toBeEnabled()
    expect(setPlatformPlanActive).toHaveBeenCalledWith(plan.id, false)
  })

  it('Cadastro sem plano comercial elegível não permite confirmar empresa', async () => {
    vi.mocked(getPlatformPlans).mockResolvedValue([{ ...plan, isActive: false }, { ...plan, id: 'free', price: '0.00' }])
    renderArea('/dashboard/super-admin/companies/new')
    expect(await screen.findByRole('heading', { name: 'Nenhum plano disponível para cadastro.' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cadastrar empresa e registrar venda' })).not.toBeInTheDocument()
    expect(registerCompany).not.toHaveBeenCalled()
  })

  it('Repetição do cadastro preserva operationId e mostra resultado real da venda', async () => {
    const user = userEvent.setup()
    const result = { company: { id: 'empresa-1', nome: 'Empresa Nova', plan_id: plan.id }, sale: { id: 'sale-1', companyId: 'empresa-1', planId: plan.id, planName: plan.name, amount: '59.90', currency: 'BRL', soldAt: '2026-11-01T12:00:00Z', createdAt: '2026-11-01T12:00:00Z' }, replayed: true } as CompanyRegistrationResult
    vi.mocked(registerCompany).mockRejectedValueOnce(new ApiError('Conexão interrompida')).mockResolvedValueOnce(result)
    renderArea('/dashboard/super-admin/companies/new')
    await screen.findByLabelText('Nome da empresa')
    for (const [label, value] of [['Nome da empresa', 'Empresa Nova'], ['CNPJ', '12345678000190'], ['Categoria', 'Tecnologia'], ['Resumo', 'Resumo'], ['Descrição detalhada', 'Descrição'], ['Cidade', 'Fortaleza'], ['Estado', 'CE']]) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } })
    }
    await user.click(screen.getByLabelText('Plano comercial'))
    await user.click(await screen.findByRole('option', { name: /Profissional/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar empresa e registrar venda' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Conexão interrompida')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar empresa e registrar venda' }))
    expect(await screen.findByRole('heading', { name: 'Empresa cadastrada.' })).toBeInTheDocument()
    const calls = vi.mocked(registerCompany).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[0][0].operationId).toMatch(/^[0-9a-f-]{36}$/)
    expect(calls[1][0].operationId).toBe(calls[0][0].operationId)
    expect(calls[0][0]).not.toHaveProperty('amount')
    expect(screen.getByText('Empresa Nova está vinculada ao plano Profissional.')).toBeInTheDocument()
    expect(screen.getByText('Venda comercial inicial')).toBeInTheDocument()
  })

  it('Alterar nome atualiza cabeçalho sem encerrar sessão', async () => {
    vi.mocked(updateOwnProfile).mockResolvedValue({ user: { ...session.user, name: 'Nome Atualizado' }, requiresLogin: false })
    renderArea('/dashboard/super-admin/settings/profile')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nome Atualizado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }))
    expect(await screen.findByText('Perfil atualizado com sucesso.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Nome Atualizado/ })).toBeInTheDocument()
    expect(storage.removeItem).not.toHaveBeenCalledWith('token')
  })

  it('Alterar e-mail encerra sessão e solicita novo login', async () => {
    vi.mocked(updateOwnProfile).mockResolvedValue({ user: { ...session.user, email: 'novo@example.test' }, requiresLogin: true })
    renderArea('/dashboard/super-admin/settings/profile')
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'novo@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }))
    expect(await screen.findByText('Entre com seu novo e-mail')).toBeInTheDocument()
    expect(storage.removeItem).toHaveBeenCalledWith('token')
    expect(memory.has('token')).toBe(false)
  })
})
