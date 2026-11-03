import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompanyRegistrationResult, PlatformCompany, Plan, SessionProfile } from '../../lib/api'
import {
  getCompanyImageUrl,
  getPlatformCompany,
  getPlatformPlans,
  registerCompany,
  updatePlatformCompany,
  uploadCompanyImage,
} from '../../lib/api'
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout'
import CompanyCreate from './CompanyCreate'
import CompanyEdit from './CompanyEdit'

vi.mock('../../lib/api', async original => ({
  ...await original<typeof import('../../lib/api')>(),
  getCompanyImageUrl: vi.fn(),
  getPlatformCompany: vi.fn(),
  getPlatformPlans: vi.fn(),
  registerCompany: vi.fn(),
  updatePlatformCompany: vi.fn(),
  uploadCompanyImage: vi.fn(),
}))

const session: SessionProfile = {
  user: { id: 'super-1', name: 'Admin Inicial', email: 'admin@example.test', role: 'super_admin', companyId: null },
  permissions: { uploadCompanyCover: true },
}
const context: SuperAdminContext = { session, setProfile: vi.fn(), handleError: vi.fn(error => error instanceof Error ? error.message : 'Falha inesperada.') }
const plan: Plan = {
  id: 'plan-1', name: 'Profissional', slug: 'profissional', description: 'Plano comercial', price: '59.90',
  billingPeriod: 'monthly', features: ['Catálogo'], limits: {}, isFeatured: false, isActive: true, displayOrder: 10,
}
const company: PlatformCompany = {
  id: 'company-1', nome: 'Empresa de Exemplo', cnpj: '12345678000190', descricao: 'Resumo da empresa',
  descricao_detalhada: 'Descrição detalhada da empresa', categoria: 'Tecnologia', cidade: 'Fortaleza', estado: 'CE',
  status: 'ativo', verificado: false, tamanho: 'media', plan_id: plan.id,
  email: 'contato@example.test', telefone: '+5585999999999', endereco: 'Rua das Flores, 10',
  website: 'https://example.test', whatsapp: '+5585999999999', logo: null,
  cover_image_url: 'https://images.example.test/current-cover.webp',
}
const registration: CompanyRegistrationResult = {
  company: { id: 'company-created-1', nome: 'Empresa Nova', plan_id: plan.id } as CompanyRegistrationResult['company'],
  sale: {
    id: 'sale-initial-1', companyId: 'company-created-1', planId: plan.id, planName: plan.name,
    amount: '59.90', currency: 'BRL', soldAt: '2026-11-01T12:00:00.000Z', createdAt: '2026-11-01T12:00:00.000Z',
  },
  replayed: false,
}

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')

function renderCompanyRoutes(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/super-admin/companies" element={<Outlet context={context} />}>
          <Route path="new" element={<CompanyCreate />} />
          <Route path=":companyId/edit" element={<CompanyEdit />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

async function fillCreateCompanyForm() {
  for (const [label, value] of [
    ['Nome da empresa', 'Empresa Nova'],
    ['CNPJ', '12345678000190'],
    ['Categoria', 'Tecnologia'],
    ['Resumo', 'Resumo sintético'],
    ['Descrição detalhada', 'Descrição sintética completa'],
    ['Cidade', 'Fortaleza'],
    ['Estado', 'CE'],
  ]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }
  fireEvent.change(screen.getByLabelText('Plano comercial'), { target: { value: plan.id } })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(context.handleError).mockClear()
  vi.mocked(getPlatformPlans).mockReset().mockResolvedValue([plan])
  vi.mocked(getPlatformCompany).mockReset().mockResolvedValue(company)
  vi.mocked(registerCompany).mockReset()
  vi.mocked(updatePlatformCompany).mockReset().mockResolvedValue(company)
  vi.mocked(uploadCompanyImage).mockReset()
  vi.mocked(getCompanyImageUrl).mockReset()
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:company-image-preview') })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
})

afterEach(() => {
  vi.restoreAllMocks()
  if (originalCreateObjectURL) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL)
  else Reflect.deleteProperty(URL, 'createObjectURL')
  if (originalRevokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL)
  else Reflect.deleteProperty(URL, 'revokeObjectURL')
})

describe('Logo no cadastro e capa na edição de empresa', () => {
  it('cadastra empresa/venda antes da logo e permite repetir somente o upload que falhou', async () => {
    const user = userEvent.setup()
    const logo = new File(['logo sintética'], 'logo.png', { type: 'image/png' })
    vi.mocked(registerCompany).mockResolvedValue(registration)
    vi.mocked(uploadCompanyImage)
      .mockRejectedValueOnce(new Error('Upload indisponível.'))
      .mockResolvedValueOnce({ imageId: 'image-logo-1', target: { module: 'companies', resourceId: registration.company.id, purpose: 'logo' } })
    renderCompanyRoutes('/super-admin/companies/new')

    await screen.findByLabelText('Nome da empresa')
    await fillCreateCompanyForm()
    const logoInput = screen.getByLabelText('Logo da empresa') as HTMLInputElement
    expect(screen.queryByLabelText('Capa da empresa')).not.toBeInTheDocument()
    await user.upload(logoInput, logo)
    expect(screen.getByAltText('Prévia: logo da empresa')).toHaveAttribute('src', 'blob:company-image-preview')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar empresa e registrar venda' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Empresa e venda já cadastradas. Não foi possível enviar a logo: Upload indisponível.')
    expect(screen.getByRole('heading', { name: 'Empresa cadastrada.' })).toBeInTheDocument()
    expect(screen.getByText('Venda comercial inicial')).toBeInTheDocument()
    expect(registerCompany).toHaveBeenCalledTimes(1)
    expect(uploadCompanyImage).toHaveBeenCalledTimes(1)
    expect(uploadCompanyImage).toHaveBeenLastCalledWith(registration.company.id, 'logo', logo)
    expect(vi.mocked(registerCompany).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(uploadCompanyImage).mock.invocationCallOrder[0])

    fireEvent.click(screen.getByRole('button', { name: 'Tentar enviar logo novamente' }))
    expect(await screen.findByText('Logo enviada com sucesso.')).toBeInTheDocument()
    expect(registerCompany).toHaveBeenCalledTimes(1)
    expect(uploadCompanyImage).toHaveBeenCalledTimes(2)
    expect(uploadCompanyImage).toHaveBeenLastCalledWith(registration.company.id, 'logo', logo)
    expect(screen.queryByRole('button', { name: 'Tentar enviar logo novamente' })).not.toBeInTheDocument()
  })

  it('em falha no cadastro, não envia logo e repete cadastro/venda com o mesmo operationId', async () => {
    const user = userEvent.setup()
    const logo = new File(['logo sintética'], 'logo.webp', { type: 'image/webp' })
    vi.mocked(registerCompany).mockRejectedValueOnce(new Error('Falha temporária no cadastro.')).mockResolvedValueOnce(registration)
    vi.mocked(uploadCompanyImage).mockResolvedValue({ imageId: 'image-logo-2', target: { module: 'companies', resourceId: registration.company.id, purpose: 'logo' } })
    renderCompanyRoutes('/super-admin/companies/new')

    await screen.findByLabelText('Nome da empresa')
    await fillCreateCompanyForm()
    await user.upload(screen.getByLabelText('Logo da empresa'), logo)
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar empresa e registrar venda' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha temporária no cadastro.')
    expect(registerCompany).toHaveBeenCalledTimes(1)
    expect(uploadCompanyImage).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar empresa e registrar venda' }))
    expect(await screen.findByRole('heading', { name: 'Empresa cadastrada.' })).toBeInTheDocument()
    await waitFor(() => expect(uploadCompanyImage).toHaveBeenCalledTimes(1))
    const calls = vi.mocked(registerCompany).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[0][0].operationId).toMatch(/^[0-9a-f-]{36}$/)
    expect(calls[1][0].operationId).toBe(calls[0][0].operationId)
    expect(uploadCompanyImage).toHaveBeenCalledWith(registration.company.id, 'logo', logo)
    expect(calls[0][0]).not.toHaveProperty('logo')
  })

  it('edita dados comerciais e envia apenas a capa em operação separada, mostrando a URL assinada', async () => {
    const user = userEvent.setup()
    const cover = new File(['capa sintética'], 'cover.jpg', { type: 'image/jpeg' })
    vi.mocked(updatePlatformCompany).mockResolvedValue(company)
    vi.mocked(uploadCompanyImage).mockResolvedValue({ imageId: 'image-cover-1', target: { module: 'companies', resourceId: company.id, purpose: 'cover' } })
    vi.mocked(getCompanyImageUrl).mockResolvedValue('https://images.example.test/signed-cover.webp')
    renderCompanyRoutes('/super-admin/companies/' + company.id + '/edit')

    const coverInput = await screen.findByLabelText('Capa da empresa')
    expect(screen.queryByLabelText('Logo da empresa')).not.toBeInTheDocument()
    expect(screen.getByAltText('Prévia: capa da empresa')).toHaveAttribute('src', company.cover_image_url)
    await user.upload(coverInput, cover)
    expect(screen.getByAltText('Prévia: capa da empresa')).toHaveAttribute('src', 'blob:company-image-preview')
    fireEvent.change(screen.getByLabelText('Nome da empresa'), { target: { value: 'Empresa atualizada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar empresa' }))
    expect(await screen.findByText('Empresa atualizada. Nenhuma venda foi lançada automaticamente.')).toBeInTheDocument()
    expect(updatePlatformCompany).toHaveBeenCalledTimes(1)
    expect(updatePlatformCompany).toHaveBeenCalledWith(company.id, expect.objectContaining({ nome: 'Empresa atualizada' }))
    expect(uploadCompanyImage).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar capa' }))
    expect(await screen.findByText('Capa enviada com sucesso.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByAltText('Prévia: capa da empresa')).toHaveAttribute('src', 'https://images.example.test/signed-cover.webp'))
    expect(uploadCompanyImage).toHaveBeenCalledTimes(1)
    expect(uploadCompanyImage).toHaveBeenCalledWith(company.id, 'cover', cover)
    expect(getCompanyImageUrl).toHaveBeenCalledWith('image-cover-1')
    expect(updatePlatformCompany).toHaveBeenCalledTimes(1)
    expect(registerCompany).not.toHaveBeenCalled()
  })

  it('mantém erro de upload da capa separado e informa quando a imagem foi salva sem prévia assinada', async () => {
    const user = userEvent.setup()
    const cover = new File(['capa sintética'], 'cover.webp', { type: 'image/webp' })
    vi.mocked(uploadCompanyImage)
      .mockRejectedValueOnce(new Error('Storage indisponível.'))
      .mockResolvedValueOnce({ imageId: 'image-cover-2', target: { module: 'companies', resourceId: company.id, purpose: 'cover' } })
    vi.mocked(getCompanyImageUrl).mockRejectedValue(new Error('Prévia indisponível.'))
    renderCompanyRoutes('/super-admin/companies/' + company.id + '/edit')

    await user.upload(await screen.findByLabelText('Capa da empresa'), cover)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar capa' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Storage indisponível.')
    expect(getCompanyImageUrl).not.toHaveBeenCalled()
    expect(updatePlatformCompany).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar capa' }))
    expect(await screen.findByText('Capa enviada com sucesso.')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Capa salva. Não foi possível carregar a prévia: Prévia indisponível.')
    expect(uploadCompanyImage).toHaveBeenCalledTimes(2)
    expect(getCompanyImageUrl).toHaveBeenCalledWith('image-cover-2')
    expect(updatePlatformCompany).not.toHaveBeenCalled()
  })

  it('valida MIME e tamanho no formulário sem iniciar cadastro ou upload', async () => {
    const user = userEvent.setup({ applyAccept: false })
    vi.mocked(registerCompany).mockResolvedValue(registration)
    const createView = renderCompanyRoutes('/super-admin/companies/new')
    await screen.findByLabelText('Nome da empresa')
    const invalidLogo = new File(['não é imagem'], 'documento.pdf', { type: 'application/pdf' })
    const logoInput = screen.getByLabelText('Logo da empresa') as HTMLInputElement
    await user.upload(logoInput, invalidLogo)
    expect(await screen.findByRole('alert')).toHaveTextContent('Selecione uma imagem PNG, JPG ou WEBP de até 10 MB, não vazia.')
    expect(logoInput).toHaveAttribute('aria-invalid', 'true')
    expect(registerCompany).not.toHaveBeenCalled()
    expect(uploadCompanyImage).not.toHaveBeenCalled()
    createView.unmount()

    const editView = renderCompanyRoutes('/super-admin/companies/' + company.id + '/edit')
    const coverInput = await screen.findByLabelText('Capa da empresa') as HTMLInputElement
    const oversizedCover = new File([new Uint8Array(10_000_001)], 'cover.png', { type: 'image/png' })
    await user.upload(coverInput, oversizedCover)
    expect(await screen.findByRole('alert')).toHaveTextContent('Selecione uma imagem PNG, JPG ou WEBP de até 10 MB, não vazia.')
    expect(coverInput).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Enviar capa' })).toBeDisabled()
    expect(uploadCompanyImage).not.toHaveBeenCalled()
    expect(updatePlatformCompany).not.toHaveBeenCalled()
    editView.unmount()
  })
})
