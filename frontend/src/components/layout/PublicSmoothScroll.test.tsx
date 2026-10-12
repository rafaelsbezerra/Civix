import { act, fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicSmoothScroll } from './PublicSmoothScroll'

const { construct, destroy } = vi.hoisted(() => ({ construct: vi.fn(), destroy: vi.fn() }))
vi.mock('lenis', () => ({ default: class { constructor() { construct() } destroy = destroy } }))
let preference: EventTarget & { matches: boolean }
let frames: Map<number, FrameRequestCallback>
let nextFrame: number
const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView')
const scroll = vi.fn()

beforeEach(() => {
  preference = Object.assign(new EventTarget(), { matches: false })
  frames = new Map()
  nextFrame = 0
  construct.mockClear()
  destroy.mockClear()
  scroll.mockClear()
  window.history.replaceState({}, '', '/')
  vi.stubGlobal('matchMedia', vi.fn(() => preference))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { const id = ++nextFrame; frames.set(id, callback); return id })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll })
})
afterEach(() => {
  vi.unstubAllGlobals()
  if (originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll)
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
  window.history.replaceState({}, '', '/')
})
function tick() {
  act(() => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(0)) })
}

describe('Rolagem pública e âncoras', () => {
  it('navega de ajuda até a seção da Home depois que o destino é montado', () => {
    window.history.replaceState({}, '', '/central-de-ajuda')
    render(<BrowserRouter><PublicSmoothScroll /><Routes>
      <Route path="/central-de-ajuda" element={<Link to="/#empresas">Ir para empresas</Link>} />
      <Route path="/" element={<section id="empresas">Empresas montadas</section>} />
    </Routes></BrowserRouter>)
    expect(document.getElementById('empresas')).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: 'Ir para empresas' }))
    expect(screen.getByText('Empresas montadas')).toBeInTheDocument()
    tick()
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' })
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('empresas'))
  })

  it('desativa Lenis ao mudar preferência e recria somente quando permitido', () => {
    const { unmount } = render(<BrowserRouter><PublicSmoothScroll /></BrowserRouter>)
    expect(construct).toHaveBeenCalledTimes(1)
    act(() => { preference.matches = true; preference.dispatchEvent(new Event('change')) })
    expect(destroy).toHaveBeenCalledTimes(1)
    expect(construct).toHaveBeenCalledTimes(1)
    act(() => { preference.matches = false; preference.dispatchEvent(new Event('change')) })
    expect(construct).toHaveBeenCalledTimes(2)
    unmount()
    expect(destroy).toHaveBeenCalledTimes(2)
  })

  it('não cria ou altera destino de Contato ausente', () => {
    window.history.replaceState({}, '', '/#contato')
    render(<BrowserRouter><PublicSmoothScroll /></BrowserRouter>)
    tick()
    expect(document.getElementById('contato')).toBeNull()
    expect(scroll).not.toHaveBeenCalled()
  })

  it('preferência inicial reduzida mantém Lenis desligado e cancela frame no unmount', () => {
    preference.matches = true
    window.history.replaceState({}, '', '/#empresas')
    const { unmount } = render(<BrowserRouter><PublicSmoothScroll /><section id="empresas" /></BrowserRouter>)
    expect(construct).not.toHaveBeenCalled()
    expect(frames.size).toBe(1)
    unmount()
    expect(frames.size).toBe(0)
    expect(scroll).not.toHaveBeenCalled()
  })
})
