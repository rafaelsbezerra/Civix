import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MotionRoot } from './MotionRoot'

const { animateMock, ready, release } = vi.hoisted(() => {
  let release!: () => void
  const ready = new Promise<void>(resolve => { release = resolve })
  return { animateMock: vi.fn(), ready, release }
})
vi.mock('motion/mini', async () => { await ready; return { animate: animateMock } })

class Observer {
  static instances: Observer[] = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) { this.callback = callback; Observer.instances.push(this) }
  enter(target: Element) {
    this.callback([{ target, isIntersecting: true, intersectionRatio: 1, boundingClientRect: target.getBoundingClientRect() } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}
let preference: EventTarget & { matches: boolean }
const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate')

beforeEach(() => {
  Observer.instances = []
  preference = Object.assign(new EventTarget(), { matches: false })
  vi.stubGlobal('matchMedia', vi.fn((query: string) => query.includes('reduced-motion') ? preference : { matches: false }))
  vi.stubGlobal('IntersectionObserver', Observer)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: vi.fn() })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 1000, bottom: 1100, height: 100, width: 100, left: 0, right: 100, x: 0, y: 1000, toJSON: () => ({}) })
  animateMock.mockReset()
  animateMock.mockImplementation(() => {
    let finish!: () => void
    const finished = new Promise<void>(resolve => { finish = resolve })
    return { cancel: vi.fn(() => finish()), then: finished.then.bind(finished) }
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate)
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate')
})

function fixture(path = '/catalogo') {
  return render(<MemoryRouter initialEntries={[path]}><MotionRoot>
    <article data-testid="entry" data-motion="item" style={{ opacity: 0.8, translate: '10px 20px', transform: 'rotate(5deg)' }}><button>Controle da entrada</button></article>
  </MotionRoot></MemoryRouter>)
}

describe('Entradas públicas progressivas', () => {
  it('mantém conteúdo visível durante import assíncrono', async () => {
    fixture()
    const entry = screen.getByTestId('entry')
    expect(entry.style.opacity).toBe('0.8')
    await act(async () => { release(); await ready })
    await waitFor(() => expect(entry).toHaveAttribute('data-motion-state', 'waiting'))
    expect(Observer.instances[0].observe).toHaveBeenCalledWith(entry)
  })

  it('ausência de observer conserva conteúdo e controles sem animação', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    fixture()
    expect(screen.getByTestId('entry').style.opacity).toBe('0.8')
    expect(screen.getByRole('button', { name: 'Controle da entrada' })).toBeInTheDocument()
    expect(animateMock).not.toHaveBeenCalled()
  })

  it('entrada ocorre uma vez e o foco cancela e restaura estilos sem alterar transform', async () => {
    fixture()
    const entry = screen.getByTestId('entry')
    await waitFor(() => expect(entry).toHaveAttribute('data-motion-state', 'waiting'))
    act(() => Observer.instances[0].enter(entry))
    expect(animateMock).toHaveBeenCalledTimes(1)
    const controls = animateMock.mock.results[0].value
    act(() => screen.getByRole('button', { name: 'Controle da entrada' }).focus())
    expect(controls.cancel).toHaveBeenCalled()
    expect(entry.style.opacity).toBe('0.8')
    expect(entry.style.translate).toBe('10px 20px')
    expect(entry.style.transform).toBe('rotate(5deg)')
    act(() => Observer.instances[0].enter(entry))
    expect(animateMock).toHaveBeenCalledTimes(1)
  })

  it('mudança de reduced motion cancela e revela a entrada imediatamente', async () => {
    fixture()
    const entry = screen.getByTestId('entry')
    await waitFor(() => expect(entry).toHaveAttribute('data-motion-state', 'waiting'))
    act(() => Observer.instances[0].enter(entry))
    const controls = animateMock.mock.results[0].value
    await act(async () => { preference.matches = true; preference.dispatchEvent(new Event('change')) })
    expect(controls.cancel).toHaveBeenCalled()
    expect(entry.style.opacity).toBe('0.8')
    expect(entry.style.translate).toBe('10px 20px')
    expect(entry).toHaveAttribute('data-motion-state', 'done')
  })

  it('preferência reduzida inicial mantém conteúdo estático visível', async () => {
    preference.matches = true
    fixture()
    await waitFor(() => expect(screen.getByTestId('entry')).toHaveAttribute('data-motion-state', 'done'))
    expect(screen.getByTestId('entry').style.opacity).toBe('0.8')
    expect(animateMock).not.toHaveBeenCalled()
  })

  it('falha visual não esconde o conteúdo ou bloqueia controles', async () => {
    animateMock.mockImplementation(() => { throw new Error('Falha visual simulada') })
    fixture()
    const entry = screen.getByTestId('entry')
    await waitFor(() => expect(entry).toHaveAttribute('data-motion-state', 'waiting'))
    act(() => Observer.instances[0].enter(entry))
    expect(entry).toHaveAttribute('data-motion-state', 'done')
    expect(entry.style.opacity).toBe('0.8')
    expect(entry.style.translate).toBe('10px 20px')
  })

  it('não consome entradas atrás de um dialog e anima após remover inert', async () => {
    const { container } = render(<MemoryRouter><MotionRoot><section inert><article data-testid="blocked" data-motion="item" data-motion-trigger="mount" style={{ opacity: 1 }}>Entrada atrás do dialog</article></section></MotionRoot></MemoryRouter>)
    await act(async () => { await Promise.resolve() })
    expect(animateMock).not.toHaveBeenCalled()
    expect(screen.getByTestId('blocked').style.opacity).toBe('1')
    container.querySelector('section')!.removeAttribute('inert')
    await waitFor(() => expect(animateMock).toHaveBeenCalledTimes(1))
  })

  it.each(['/login', '/primeiro-acesso', '/primeiro-acesso/token', '/esqueci-senha', '/redefinir-senha'])('rota %s preserva formulários sem observer', path => {
    const { container } = fixture(path)
    expect(container.querySelector('[data-motion-root]')).not.toBeInTheDocument()
    expect(Observer.instances).toHaveLength(0)
    expect(animateMock).not.toHaveBeenCalled()
  })

  it('observa novo conteúdo da API sem repetir o existente por mudança de hash e limpa no unmount', async () => {
    function Content() {
      const navigate = useNavigate()
      return <><button onClick={() => navigate('/catalogo#resultado')}>Mudar hash</button><article data-testid="stable" data-motion="item" style={{ opacity: 1 }}>Empresa estável</article></>
    }
    const remove = vi.spyOn(preference, 'removeEventListener')
    const { container, unmount } = render(<MemoryRouter initialEntries={['/catalogo']}><MotionRoot><Content /></MotionRoot></MemoryRouter>)
    const stable = screen.getByTestId('stable')
    await waitFor(() => expect(stable).toHaveAttribute('data-motion-state', 'waiting'))
    act(() => Observer.instances[0].enter(stable))
    fireEvent.click(screen.getByRole('button', { name: 'Mudar hash' }))
    expect(Observer.instances).toHaveLength(1)
    const fresh = document.createElement('article')
    fresh.dataset.motion = 'item'
    fresh.style.opacity = '1'
    fresh.textContent = 'Empresa recebida depois da API'
    container.querySelector('[data-motion-root]')!.append(fresh)
    await waitFor(() => expect(Observer.instances[0].observe).toHaveBeenCalledWith(fresh))
    act(() => Observer.instances[0].enter(fresh))
    expect(animateMock).toHaveBeenCalledTimes(2)
    const observer = Observer.instances[0]
    unmount()
    expect(observer.disconnect).toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith('change', expect.any(Function))
    expect(fresh.style.opacity).toBe('1')
    expect(animateMock.mock.results.every(result => result.value.cancel.mock.calls.length > 0)).toBe(true)
  })
})
