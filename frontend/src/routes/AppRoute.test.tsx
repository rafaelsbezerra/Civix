import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSessionProfile } from '@/lib/api'
import { AppRoutes } from './AppRoute'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api')>(),
  getSessionProfile: vi.fn(),
}))

const profileMock = vi.mocked(getSessionProfile)

describe('AppRoutes', () => {
  beforeEach(() => {
    profileMock.mockReset()
  })

  it('renders the Home page with the About section at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Transformamos atendimento em oportunidades.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Princípios da Civix' })).toBeInTheDocument()
  })

  it('opens the company dashboard with the verified owner profile', async () => {
    profileMock.mockResolvedValue({
      user: {
        id: 'owner-1',
        name: 'Ana',
        email: 'ana@example.test',
        role: 'admin_empresa',
        companyId: 'company-1',
      },
      permissions: { uploadCompanyCover: true },
    })

    render(
      <MemoryRouter initialEntries={['/dashboard-empresa']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Equipe' })).toHaveLength(2)
  })

  it('opens the attendant dashboard only with the verified attendant profile', async () => {
    profileMock.mockResolvedValue({
      user: {
        id: 'attendant-1',
        name: 'Bia',
        email: 'bia@example.test',
        role: 'atendente',
        companyId: 'company-1',
      },
      permissions: { uploadCompanyCover: false },
    })

    render(
      <MemoryRouter initialEntries={['/dashboard-atendente']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Início' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toHaveTextContent(
      'InícioConversasHistóricoPerfil',
    )
    expect(screen.queryByRole('link', { name: 'Equipe' })).not.toBeInTheDocument()
  })

  it('denies the attendant dashboard to a verified company owner', async () => {
    profileMock.mockResolvedValue({
      user: {
        id: 'owner-1',
        email: 'ana@example.test',
        role: 'admin_empresa',
        companyId: 'company-1',
      },
      permissions: { uploadCompanyCover: true },
    })

    render(
      <MemoryRouter initialEntries={['/dashboard-atendente']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Acesso não permitido')
    expect(screen.queryByRole('heading', { name: 'Início' })).not.toBeInTheDocument()
  })

  it('blocks the company dashboard for attendants', async () => {
    profileMock.mockResolvedValue({
      user: {
        id: 'attendant-1',
        email: 'equipe@example.test',
        role: 'atendente',
        companyId: 'company-1',
      },
      permissions: { uploadCompanyCover: false },
    })

    render(
      <MemoryRouter initialEntries={['/dashboard-empresa/equipe']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Acesso não permitido')
    expect(screen.queryByRole('link', { name: 'Equipe' })).not.toBeInTheDocument()
  })

  it('shows the leads screen as unavailable instead of inventing an empty result', async () => {
    profileMock.mockResolvedValue({
      user: {
        id: 'owner-1',
        email: 'ana@example.test',
        role: 'admin_empresa',
        companyId: 'company-1',
      },
      permissions: { uploadCompanyCover: true },
    })

    render(
      <MemoryRouter initialEntries={['/dashboard-empresa/leads']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Leads' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Esta área ainda não está conectada' }))
      .toBeInTheDocument()
    expect(screen.getByText(/não exibimos uma lista vazia/i)).toBeInTheDocument()
  })

  it.each([
    ['/dashboard-empresa/conversas', 'Conversas', 'admin_empresa'],
    ['/dashboard-empresa/equipe', 'Equipe', 'admin_empresa'],
    ['/dashboard-empresa/configuracoes', 'Empresa e configurações', 'admin_empresa'],
  ] as const)(
    'opens the %s dashboard section and explains its unavailable state',
    async (path, title, role) => {
      profileMock.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.test',
          role,
          companyId: 'company-1',
        },
        permissions: { uploadCompanyCover: role === 'admin_empresa' },
      })

      render(
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>,
      )

      expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Esta área ainda não está conectada' }))
        .toBeInTheDocument()
      expect(screen.getByText(/Nenhum dado foi carregado ou criado nesta tela/))
        .toBeInTheDocument()
    },
  )

  it('shows mobile navigation controls for direct section visits', async () => {
    profileMock.mockResolvedValue({
      user: {
        id: 'attendant-1',
        email: 'equipe@example.test',
        role: 'atendente',
        companyId: 'company-1',
      },
      permissions: { uploadCompanyCover: false },
    })

    render(
      <MemoryRouter initialEntries={['/dashboard-atendente/conversas']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Conversas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir navegação' }))
      .toHaveAttribute('aria-controls', 'company-dashboard-mobile-navigation')
  })
})
