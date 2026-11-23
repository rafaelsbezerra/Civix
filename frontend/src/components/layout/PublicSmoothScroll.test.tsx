import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicSmoothScroll } from './PublicSmoothScroll';

const { construct, destroy, lenisScroll, stop, start, lenisState } = vi.hoisted(() => ({
  construct: vi.fn(),
  destroy: vi.fn(),
  lenisScroll: vi.fn(),
  stop: vi.fn(),
  start: vi.fn(),
  lenisState: { isStopped: false, targetScroll: 0 },
}));

vi.mock('lenis', () => ({
  default: class {
    constructor() {
      construct();
    }
    destroy = destroy;
    scrollTo = lenisScroll;
    stop = stop;
    start = start;
    get isStopped() {
      return lenisState.isStopped;
    }
  },
}));

let observers: ControlledResizeObserver[];

class ControlledResizeObserver implements ResizeObserver {
  readonly callback: ResizeObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  active = true;
  disconnect = vi.fn(() => {
    this.active = false;
  });

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    observers.push(this);
  }

  emit() {
    if (this.active) {
      this.callback([], this);
    }
  }
}

let preference: EventTarget & { matches: boolean };
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const originalScroll = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView',
);
const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
const scroll = vi.fn();

beforeEach(() => {
  preference = Object.assign(new EventTarget(), { matches: false });
  frames = new Map();
  nextFrame = 0;
  construct.mockClear();
  destroy.mockClear();
  observers = [];
  lenisState.isStopped = false;
  lenisState.targetScroll = 0;
  stop.mockReset();
  stop.mockImplementation(() => {
    lenisState.isStopped = true;
    lenisState.targetScroll = window.scrollY;
  });
  start.mockReset();
  start.mockImplementation(() => {
    lenisState.isStopped = false;
    lenisState.targetScroll = window.scrollY;
  });
  lenisScroll.mockReset();
  lenisScroll.mockImplementation((target: unknown) => {
    if (typeof target !== 'number' || target === lenisState.targetScroll) {
      return;
    }
    lenisState.targetScroll = target;
    window.scrollY = target;
  });
  scroll.mockReset();
  window.history.replaceState({}, '', '/');
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    writable: true,
    value: 0,
  });
  vi.spyOn(window, 'scrollTo').mockImplementation(
    (xOrOptions?: number | ScrollToOptions) => {
      if (typeof xOrOptions === 'object' && xOrOptions.top !== undefined) {
        window.scrollY = xOrOptions.top;
      }
    },
  );
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => preference),
  );
  vi.stubGlobal('ResizeObserver', ControlledResizeObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scroll,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalScroll) {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  }
  if (originalScrollY) {
    Object.defineProperty(window, 'scrollY', originalScrollY);
  } else {
    Reflect.deleteProperty(window, 'scrollY');
  }
  window.history.replaceState({}, '', '/');
});

function tick() {
  act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(0));
  });
}

function CompanyNavigation({ replace = false }: { replace?: boolean }) {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/empresa/company-internal', { replace })}>
      Abrir empresa
    </button>
  );
}

function renderCompanyNavigation(replace = false) {
  window.history.replaceState({}, '', '/catalogo');
  return render(
    <BrowserRouter>
      <PublicSmoothScroll />
      <Routes>
        <Route path="/catalogo" element={<CompanyNavigation replace={replace} />} />
        <Route path="/empresa/:id" element={<h1>Perfil da empresa</h1>} />
      </Routes>
    </BrowserRouter>,
  );
}

describe('Rolagem pública e âncoras', () => {
  it('navega de ajuda até a seção da Home depois que o destino é montado', () => {
    window.history.replaceState({}, '', '/central-de-ajuda');
    render(
      <BrowserRouter>
        <PublicSmoothScroll />
        <Routes>
          <Route
            path="/central-de-ajuda"
            element={<Link to="/#empresas">Ir para empresas</Link>}
          />
          <Route
            path="/"
            element={<section id="empresas">Empresas montadas</section>}
          />
        </Routes>
      </BrowserRouter>,
    );
    expect(document.getElementById('empresas')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Ir para empresas' }));
    expect(screen.getByText('Empresas montadas')).toBeInTheDocument();
    tick();
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('empresas'));
  });

  it('desativa Lenis ao mudar preferência e recria somente quando permitido', () => {
    const { unmount } = render(
      <BrowserRouter>
        <PublicSmoothScroll />
      </BrowserRouter>,
    );
    expect(construct).toHaveBeenCalledTimes(1);
    act(() => {
      preference.matches = true;
      preference.dispatchEvent(new Event('change'));
    });
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(construct).toHaveBeenCalledTimes(1);
    act(() => {
      preference.matches = false;
      preference.dispatchEvent(new Event('change'));
    });
    expect(construct).toHaveBeenCalledTimes(2);
    unmount();
    expect(destroy).toHaveBeenCalledTimes(2);
  });

  it('não cria ou altera destino de Contato ausente', () => {
    window.history.replaceState({}, '', '/#contato');
    render(
      <BrowserRouter>
        <PublicSmoothScroll />
      </BrowserRouter>,
    );
    tick();
    expect(document.getElementById('contato')).toBeNull();
    expect(scroll).not.toHaveBeenCalled();
  });

  it('preferência inicial reduzida mantém Lenis desligado e cancela frame no unmount', () => {
    preference.matches = true;
    window.history.replaceState({}, '', '/#empresas');
    const { unmount } = render(
      <BrowserRouter>
        <PublicSmoothScroll />
        <section id="empresas" />
      </BrowserRouter>,
    );
    expect(construct).not.toHaveBeenCalled();
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(scroll).not.toHaveBeenCalled();
  });

  for (const replace of [false, true]) {
    it(`abre o perfil no topo em navegação programática ${replace ? 'REPLACE' : 'PUSH'} e sincroniza Lenis`, () => {
      renderCompanyNavigation(replace);
      tick();
      lenisScroll.mockClear();
      vi.mocked(window.scrollTo).mockClear();
      window.scrollY = 720;
      lenisState.targetScroll = 0;
      stop.mockClear();
      start.mockClear();

      fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }));
      expect(window.scrollY).toBe(0);
      tick();

      expect(
        screen.getByRole('heading', { name: 'Perfil da empresa' }),
      ).toBeInTheDocument();
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
      expect(stop).toHaveBeenCalledTimes(1);
      expect(start).toHaveBeenCalledTimes(1);
      expect(window.scrollY).toBe(0);
      expect(lenisScroll).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ immediate: true, force: true }),
      );
      expect(construct).toHaveBeenCalledTimes(1);
    });
  }

  it('preserva a posição restaurada pelo navegador em POP sem forçar o topo', () => {
    renderCompanyNavigation();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }));
    tick();
    lenisScroll.mockClear();
    vi.mocked(window.scrollTo).mockClear();
    window.scrollY = 360;

    act(() => {
      window.history.replaceState({}, '', '/catalogo');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(lenisScroll).toHaveBeenCalledWith(
      360,
      expect.objectContaining({ immediate: true, force: true }),
    );
    window.scrollY = 680;
    tick();

    expect(screen.getByRole('button', { name: 'Abrir empresa' })).toBeInTheDocument();
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(window.scrollY).toBe(680);
    expect(lenisScroll).toHaveBeenLastCalledWith(
      680,
      expect.objectContaining({ immediate: true, force: true }),
    );
  });

  it('movimento reduzido abre nova página no topo usando rolagem nativa sem Lenis', () => {
    preference.matches = true;
    renderCompanyNavigation();
    tick();
    vi.mocked(window.scrollTo).mockClear();
    window.scrollY = 720;

    fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }));
    tick();

    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 0, behavior: 'instant' }),
    );
    expect(window.scrollY).toBe(0);
    expect(construct).not.toHaveBeenCalled();
    expect(lenisScroll).not.toHaveBeenCalled();
  });

  it('sincroniza Lenis com a posição da âncora calculada pelo navegador sem substituir a compensação da navbar', () => {
    window.history.replaceState({}, '', '/central-de-ajuda');
    scroll.mockImplementation(() => {
      window.scrollY = 870;
    });
    render(
      <BrowserRouter>
        <PublicSmoothScroll />
        <Routes>
          <Route
            path="/central-de-ajuda"
            element={<Link to="/#empresas">Ir para empresas</Link>}
          />
          <Route
            path="/"
            element={<section id="empresas">Empresas montadas</section>}
          />
        </Routes>
      </BrowserRouter>,
    );
    tick();
    lenisScroll.mockClear();
    vi.mocked(window.scrollTo).mockClear();

    fireEvent.click(screen.getByRole('link', { name: 'Ir para empresas' }));
    tick();

    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
    expect(window.scrollY).toBe(870);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(lenisScroll).toHaveBeenCalledWith(
      870,
      expect.objectContaining({ immediate: true, force: true }),
    );
  });

  it('cancela sincronização da âncora pendente quando a página é desmontada', () => {
    window.history.replaceState({}, '', '/central-de-ajuda');
    const { unmount } = render(
      <BrowserRouter>
        <PublicSmoothScroll />
        <Routes>
          <Route
            path="/central-de-ajuda"
            element={<Link to="/#empresas">Ir para empresas</Link>}
          />
          <Route
            path="/"
            element={<section id="empresas">Empresas montadas</section>}
          />
        </Routes>
      </BrowserRouter>,
    );
    tick();
    lenisScroll.mockClear();

    fireEvent.click(screen.getByRole('link', { name: 'Ir para empresas' }));
    expect(frames.size).toBeGreaterThan(0);
    const beforeUnmount = lenisScroll.mock.calls.length;
    unmount();
    expect(frames.size).toBe(0);
    tick();
    expect(lenisScroll).toHaveBeenCalledTimes(beforeUnmount);
    expect(scroll).not.toHaveBeenCalled();
  });

  it('preserva a âncora inicial no segundo ciclo de efeitos do StrictMode', () => {
    window.history.replaceState({}, '', '/#empresas');
    render(
      <StrictMode>
        <BrowserRouter>
          <PublicSmoothScroll />
          <section id="empresas">Empresas montadas</section>
        </BrowserRouter>
      </StrictMode>,
    );

    expect(frames.size).toBe(1);
    tick();
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
  });

  it('realinha a âncora quando dados assíncronos mudam a altura do body e agrupa notificações por frame', () => {
    window.history.replaceState({}, '', '/#empresas');
    let anchorPosition = 870;
    scroll.mockImplementation(() => {
      window.scrollY = anchorPosition;
    });
    render(
      <BrowserRouter>
        <PublicSmoothScroll />
        <section id="empresas" />
      </BrowserRouter>,
    );
    tick();
    expect(window.scrollY).toBe(870);
    expect(observers).toHaveLength(1);
    expect(observers[0].observe).toHaveBeenCalledWith(document.body);

    anchorPosition = 1180;
    act(() => {
      observers[0].emit();
      observers[0].emit();
      observers[0].emit();
    });
    expect(frames.size).toBe(1);
    tick();

    expect(scroll).toHaveBeenCalledTimes(2);
    expect(window.scrollY).toBe(1180);
    expect(lenisScroll).toHaveBeenLastCalledWith(
      1180,
      expect.objectContaining({ immediate: true, force: true }),
    );
  });

  for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
    it(`devolve a rolagem ao visitante após ${event}, cancelando realinhamento pendente e observer`, () => {
      window.history.replaceState({}, '', '/#empresas');
      scroll.mockImplementation(() => {
        window.scrollY = 870;
      });
      render(
        <BrowserRouter>
          <PublicSmoothScroll />
          <section id="empresas" />
        </BrowserRouter>,
      );
      tick();
      scroll.mockClear();
      window.scrollY = 440;
      const observer = observers[0];
      act(() => observer.emit());
      expect(frames.size).toBe(1);

      fireEvent(document.body, new Event(event, { bubbles: true }));
      expect(observer.disconnect).toHaveBeenCalledTimes(1);
      expect(frames.size).toBe(0);
      act(() => observer.callback([], observer));
      tick();

      expect(scroll).not.toHaveBeenCalled();
      expect(window.scrollY).toBe(440);
    });
  }

  it('remove observer e todos os listeners da âncora ao desmontar e ignora notificações tardias', () => {
    window.history.replaceState({}, '', '/#empresas');
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <BrowserRouter>
        <PublicSmoothScroll />
        <section id="empresas" />
      </BrowserRouter>,
    );
    const observer = observers[0];
    expect(frames.size).toBe(1);

    unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
      expect(removeListener).toHaveBeenCalledWith(event, expect.any(Function));
    }
    act(() => observer.callback([], observer));
    tick();
    expect(scroll).not.toHaveBeenCalled();
  });

  it('não reinicia uma instância Lenis que já estava parada ao abrir o perfil', () => {
    renderCompanyNavigation();
    lenisState.isStopped = true;
    start.mockClear();
    window.scrollY = 720;

    fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }));
    expect(window.scrollY).toBe(0);
    expect(start).not.toHaveBeenCalled();
    expect(lenisState.isStopped).toBe(true);
  });
});
