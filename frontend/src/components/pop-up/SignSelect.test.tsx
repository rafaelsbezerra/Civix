import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RoleSelectionModal from './SignSelect'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async importOriginal => ({
  ...await importOriginal<typeof import('react-router-dom')>(), useNavigate: () => navigate,
}))
let values: Map<string, string>

beforeEach(() => {
  values = new Map()
  navigate.mockReset()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  })
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); document.body.style.overflow = '' })

describe('Diálogo de escolha de perfil', () => {
  it('contém foco com Tab/Escape e restaura inert, rolagem e foco anterior', () => {
    document.body.style.overflow = 'auto'
    render(<MemoryRouter>
      <button ref={element => { if (element) { element.inert = false; element.focus() } }}>Conteúdo anterior</button>
      <section data-testid="already-inert" ref={element => { if (element) element.inert = true }}>Conteúdo bloqueado</section>
      <RoleSelectionModal />
    </MemoryRouter>)
    const dialog = screen.getByRole('dialog', { name: 'Bem-vindo ao sistema!' })
    const previous = screen.getByRole('button', { name: 'Conteúdo anterior' })
    const first = within(dialog).getByRole('button', { name: 'Fechar pop-up' })
    const last = within(dialog).getByRole('button', { name: 'Continuar navegando sem entrar' })

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(first).toHaveFocus()
    expect(previous.inert).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(previous).toHaveFocus()
    expect(previous.inert).toBe(false)
    expect(screen.getByTestId('already-inert').inert).toBe(true)
    expect(document.body.style.overflow).toBe('auto')
  })

  it('preserva cooldown de trinta minutos ao fechar e não reabre antes da expiração', () => {
    const now = 1_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    const { unmount } = render(<MemoryRouter><RoleSelectionModal /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar pop-up' }))
    expect(values.get('@civix:modal_dismissed_until')).toBe(String(now + 30 * 60 * 1000))
    unmount()
    render(<MemoryRouter><RoleSelectionModal /></MemoryRouter>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('perfil já salvo evita abrir o modal e escolha continua enviando ao login', () => {
    values.set('@civix:user_role', 'cliente')
    const { unmount } = render(<MemoryRouter><RoleSelectionModal /></MemoryRouter>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    unmount()
    values.delete('@civix:user_role')
    const onSelectRole = vi.fn()
    render(<MemoryRouter><RoleSelectionModal onSelectRole={onSelectRole} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Sou empresa/ }))
    expect(values.get('@civix:user_role')).toBe('empresa')
    expect(values.has('@civix:modal_dismissed_until')).toBe(false)
    expect(onSelectRole).toHaveBeenCalledWith('empresa')
    expect(navigate).toHaveBeenCalledWith('/login/empresa')
  })

  it('escolha de cliente abre diretamente o acesso de cliente', () => {
    const onSelectRole = vi.fn()
    render(<MemoryRouter><RoleSelectionModal onSelectRole={onSelectRole} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Sou cliente/ }))
    expect(values.get('@civix:user_role')).toBe('cliente')
    expect(onSelectRole).toHaveBeenCalledWith('cliente')
    expect(navigate).toHaveBeenCalledWith('/login/cliente')
  })

  it('unmount com modal aberto devolve rolagem, inert e foco', () => {
    document.body.style.overflow = 'scroll'
    const outer = document.createElement('button')
    outer.textContent = 'Foco anterior externo'
    document.body.append(outer)
    outer.focus()
    const { unmount } = render(<MemoryRouter><RoleSelectionModal /></MemoryRouter>)
    unmount()
    expect(document.body.style.overflow).toBe('scroll')
    expect(outer).toHaveFocus()
    outer.remove()
  })
})
