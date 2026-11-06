import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { SessionProfile } from '@/lib/api'

import { CompanyDashboardHome } from './CompanyDashboardHome'
import { CompanyDashboardLayout, OwnerDashboardRoute } from './CompanyDashboardLayout'
import { DashboardSectionUnavailable } from './DashboardSectionUnavailable'

function createSession(role: 'admin_empresa' | 'atendente'): SessionProfile {
  return {
    user: {
      id: `${role}-1`,
      name: role === 'admin_empresa' ? 'Ana' : 'Bia',
      email: `${role}@example.test`,
      role,
      companyId: 'company-1',
    },
    permissions: { uploadCompanyCover: role === 'admin_empresa' },
  }
}

function renderDashboard(path: string, session: SessionProfile) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Outlet context={session} />}>
          <Route element={<CompanyDashboardLayout />} path="/dashboard-empresa">
            <Route element={<CompanyDashboardHome />} index />
            <Route
              element={
                <DashboardSectionUnavailable
                  title="Leads"
                  description="Acompanhe os contatos da empresa."
                  reason="A consulta e a gestão de leads ainda não têm uma API integrada. Por isso, não exibimos uma lista vazia."
                  icon="leads"
                />
              }
              path="leads"
            />
            <Route
              element={
                <DashboardSectionUnavailable
                  title="Conversas"
                  description="Acompanhe os atendimentos."
                  reason="A API de conversas ainda não está disponível."
                  icon="conversations"
                />
              }
              path="conversas"
            />
            <Route element={<OwnerDashboardRoute />}>
              <Route
                element={
                  <DashboardSectionUnavailable
                    title="Equipe"
                    description="Administre a equipe."
                    reason="A gestão de integrantes ainda não possui uma API conectada."
                    icon="team"
                  />
                }
                path="equipe"
              />
              <Route
                element={
                  <DashboardSectionUnavailable
                    title="Empresa e configurações"
                    description="Atualize informações empresariais."
                    reason="A consulta e a edição dos dados não estão integradas."
                    icon="company"
                  />
                }
                path="configuracoes"
              />
              </Route>
          </Route>
              <Route element={<CompanyDashboardLayout />} path="/dashboard-atendente">
              <Route
                element={
                  <DashboardSectionUnavailable
                    title="Início"
                    description="Acompanhe seus atendimentos."
                    reason="O conteúdo inicial aguarda definição."
                    icon="home"
                  />
                }
                index
              />
              <Route
                element={
                  <DashboardSectionUnavailable
                    title="Conversas"
                    description="Consulte os atendimentos atribuídos."
                    reason="A API de atendimentos ainda não está disponível."
                    icon="conversations"
                  />
                }
                path="conversas"
              />
              <Route
                element={
                  <DashboardSectionUnavailable
                    title="Histórico"
                    description="Consulte seu histórico."
                    reason="O escopo do histórico aguarda definição."
                    icon="history"
                  />
                }
                path="historico"
              />
              <Route
                element={
                  <DashboardSectionUnavailable
                    title="Perfil"
                    description="Consulte seu perfil."
                    reason="Os campos de perfil aguardam definição."
                    icon="profile"
                  />
                }
                path="perfil"
              />
            </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('CompanyDashboardLayout', () => {
  it('mostra os indicadores e mantém navegação lateral sem o aviso de demonstração', () => {
    renderDashboard('/dashboard-empresa', createSession('admin_empresa'))

    expect(screen.getByRole('link', { name: 'Civix — início' })).toContainElement(
      screen.getByRole('img', { name: 'Civix' }),
    )
    expect(screen.getByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorar indicadores' })).toHaveAttribute(
      'href',
      '#dashboard-indicators',
    )
    expect(screen.queryByLabelText('Aviso sobre os dados demonstrativos')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Leads e conversas por mês' }))
      .toBeInTheDocument()
    expect(screen.getByRole('img', {
      name: /Gráfico ilustrativo de novos leads e conversas/,
    })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Atividade recente' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Acesse suas áreas' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Equipe' })).toHaveLength(2)
    screen.getAllByRole('link', { name: 'Equipe' }).forEach((link) => {
      expect(link).toHaveAttribute('href', '/dashboard-empresa/equipe')
    })
    expect(screen.getByText('316')).toBeInTheDocument()
  })

  it('mostra ao atendente somente as áreas do dashboard operacional', async () => {
    renderDashboard('/dashboard-atendente', createSession('atendente'))

    expect(await screen.findByRole('heading', { name: 'Início' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toHaveTextContent(
      'InícioConversasHistóricoPerfil',
    )
    expect(screen.queryByRole('link', { name: 'Equipe' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Leads' })).not.toBeInTheDocument()
  })

  it('abre a navegação móvel com botão acessível e sinaliza módulos indisponíveis', async () => {
    const user = userEvent.setup()
    renderDashboard('/dashboard-atendente/conversas', createSession('atendente'))

    expect(screen.getByRole('heading', { name: 'Conversas' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Esta área ainda não está conectada' }))
      .toBeInTheDocument()
    expect(screen.getByText(/API de atendimentos ainda não está disponível/i)).toBeInTheDocument()

    const menuButton = screen.getByRole('button', { name: 'Abrir navegação' })
    await user.click(menuButton)

    expect(screen.getByRole('button', { name: 'Fechar navegação' }))
      .toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Navegação do painel' }))
      .toBeVisible()
  })

  it('alterna entre os temas Civix escuro e claro', async () => {
    const user = userEvent.setup()
    renderDashboard('/dashboard-empresa', createSession('admin_empresa'))

    const shell = document.querySelector('.company-dashboard-shell')
    expect(shell).toHaveAttribute('data-theme', 'dark')

    await user.click(screen.getByRole('button', { name: 'Ativar tema claro' }))
    expect(shell).toHaveAttribute('data-theme', 'light')
    expect(screen.getByRole('button', { name: 'Ativar tema escuro' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ativar tema escuro' }))
    expect(shell).toHaveAttribute('data-theme', 'dark')
  })
})
