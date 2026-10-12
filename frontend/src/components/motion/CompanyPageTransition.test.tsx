import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CompanyPageTransition } from './CompanyPageTransition'

const { animations } = vi.hoisted(() => ({
  animations: [] as { complete: () => void; transition: { duration?: number } }[],
}))

vi.mock('motion/react', async () => {
  const React = await import('react')

  return {
    motion: {
      div: (props: Record<string, unknown>) => {
        const excluded = new Set(['initial', 'animate', 'transition', 'onAnimationComplete'])
        if (typeof props.onAnimationComplete === 'function') {
          animations.push({
            complete: props.onAnimationComplete as () => void,
            transition: props.transition as { duration?: number },
          })
        }
        return React.createElement('div', Object.fromEntries(Object.entries(props).filter(([key]) => !excluded.has(key))))
      },
    },
  }
})

let preference: EventTarget & { matches: boolean }

function Navigation({ marker }: { marker?: unknown }) {
  const navigate = useNavigate()
  const location = useLocation()
  const getState = () => ({ companyTransition: marker ?? { startedAt: Date.now() } })

  return <>
    <output aria-label="Destino atual">{location.pathname}</output>
    <button onClick={() => navigate('/empresa/company-one', { state: getState() })}>Abrir empresa</button>
    <button onClick={() => navigate('/empresa/company-two', { state: getState() })}>Abrir outra empresa</button>
    <button onClick={() => navigate('/empresa/company-one')}>Abrir sem marcador</button>
    <button onClick={() => navigate('/empresa/company-one', { state: getState(), replace: true })}>Substituir rota</button>
    <button onClick={() => navigate('/login', { state: getState() })}>Abrir acesso</button>
    <button onClick={() => navigate(-1)}>Voltar</button>
    <button onClick={() => navigate(1)}>Avançar</button>
  </>
}

function fixture(entry: string | { pathname: string; state?: unknown } = '/catalogo', marker?: unknown) {
  return render(<MemoryRouter initialEntries={[entry]}>
    <CompanyPageTransition />
    <Navigation marker={marker} />
  </MemoryRouter>)
}

beforeEach(() => {
  animations.length = 0
  preference = Object.assign(new EventTarget(), { matches: false })
  vi.stubGlobal('matchMedia', vi.fn(() => preference))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Cortina de entrada no perfil de empresa', () => {
  it('executa somente o PUSH marcado, mantém navegação disponível e termina pelo callback Motion', () => {
    fixture()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }))

    const curtain = screen.getByTestId('company-page-transition')
    expect(curtain).toHaveAttribute('aria-hidden', 'true')
    expect(curtain.querySelector('button, a, input, [tabindex]')).toBeNull()
    expect(screen.getByLabelText('Destino atual')).toHaveTextContent('/empresa/company-one')
    expect(animations.at(-1)?.transition.duration).toBe(0.64)
    act(() => animations.at(-1)!.complete())
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeEnabled()
  })

  it('não reproduz o marcador de um acesso direto POP nem de REPLACE ou navegação sem marcador', () => {
    const { unmount } = fixture({ pathname: '/empresa/company-one', state: { companyTransition: { startedAt: Date.now() } } })
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
    unmount()
    fixture()
    fireEvent.click(screen.getByRole('button', { name: 'Substituir rota' }))
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir sem marcador' }))
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
    expect(animations).toHaveLength(0)
  })

  it('histórico Voltar/Avançar não reinicia a transição guardada no state do clique', () => {
    fixture()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }))
    act(() => animations.at(-1)!.complete())
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByLabelText('Destino atual')).toHaveTextContent('/catalogo')
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
    expect(screen.getByLabelText('Destino atual')).toHaveTextContent('/empresa/company-one')
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
    expect(animations).toHaveLength(1)
  })

  it('a conclusão de uma navegação antiga não encerra a cortina da nova empresa', () => {
    fixture()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }))
    const previous = animations.at(-1)!.complete
    const previousCurtain = screen.getByTestId('company-page-transition')
    fireEvent.click(screen.getByRole('button', { name: 'Abrir outra empresa' }))
    const current = animations.at(-1)!.complete

    expect(screen.getByTestId('company-page-transition')).not.toBe(previousCurtain)
    expect(screen.getByLabelText('Destino atual')).toHaveTextContent('/empresa/company-two')
    act(() => previous())
    expect(screen.getByTestId('company-page-transition')).toBeInTheDocument()
    act(() => current())
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
  })

  it('preferência reduzida impede ou encerra a cortina sem reproduzi-la quando o movimento volta', () => {
    preference.matches = true
    const { unmount } = fixture()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }))
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
    expect(animations).toHaveLength(0)
    act(() => {
      preference.matches = false
      preference.dispatchEvent(new Event('change'))
    })
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
    expect(animations).toHaveLength(0)
    unmount()

    preference.matches = false
    fixture()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }))
    expect(screen.getByTestId('company-page-transition')).toBeInTheDocument()
    act(() => {
      preference.matches = true
      preference.dispatchEvent(new Event('change'))
    })
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
    act(() => {
      preference.matches = false
      preference.dispatchEvent(new Event('change'))
    })
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
    expect(animations).toHaveLength(1)
  })

  it('não cria transição nas telas de acesso mesmo com marcador e mantém fallback sem matchMedia', () => {
    const { unmount } = fixture()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir acesso' }))
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
    expect(animations).toHaveLength(0)
    unmount()

    vi.stubGlobal('matchMedia', undefined)
    fixture()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }))
    expect(screen.getByLabelText('Destino atual')).toHaveTextContent('/empresa/company-one')
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
  })

  for (const startedAt of ['invalid-date', NaN, Infinity]) {
    it(`ignora marcador de origem sem timestamp numérico finito: ${String(startedAt)}`, () => {
      fixture('/catalogo', { startedAt })
      fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }))
      expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument()
      expect(animations).toHaveLength(0)
    })
  }
})
