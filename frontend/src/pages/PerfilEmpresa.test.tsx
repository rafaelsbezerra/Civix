import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Empresa } from '@/lib/api';
import PerfilEmpresa from './PerfilEmpresa';
import { CompanyPageTransition } from '@/components/motion/CompanyPageTransition';

const { fetchCompany, animations, heroSnapshots } = vi.hoisted(() => ({
  fetchCompany: vi.fn(),
  animations: [] as (() => void)[],
  heroSnapshots: [] as Record<string, unknown>[],
}));

vi.mock('@/lib/api', () => ({ fetchEmpresaById: fetchCompany }));
vi.mock('@/components/layout/SiteHeader', () => ({
  SiteHeader: () => <header>Menu público</header>,
}));
vi.mock('@/components/layout/SiteFooter', () => ({
  default: () => <footer>Rodapé público</footer>,
}));
vi.mock('motion/react', async () => {
  const React = await import('react');
  const excluded = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'variants',
    'whileInView',
    'viewport',
    'onAnimationComplete',
  ]);
  const renderTag = (tag: string) => (props: Record<string, unknown>) => {
    if (typeof props.onAnimationComplete === 'function') {
      animations.push(props.onAnimationComplete as () => void);
    }
    if (props['data-testid'] === 'hero-surface') {
      heroSnapshots.push(props);
    }
    return React.createElement(
      tag,
      Object.fromEntries(Object.entries(props).filter(([key]) => !excluded.has(key))),
      props.children as React.ReactNode,
    );
  };

  return {
    useReducedMotion: () => true,
    motion: {
      div: renderTag('div'),
      section: renderTag('section'),
      main: renderTag('main'),
      h1: renderTag('h1'),
      h2: renderTag('h2'),
      p: renderTag('p'),
    },
  };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function company(id: string, nome = 'Empresa de teste'): Empresa {
  return {
    id,
    nome,
    cnpj: '12345678000190',
    descricao: 'Descrição curta de teste',
    descricao_detalhada: 'Descrição detalhada recebida do backend.',
    categoria: 'Saúde',
    cidade: 'Fortaleza',
    estado: 'CE',
    tamanho: 'pequena',
    status: 'ativo',
    verificado: false,
  };
}

let preference: EventTarget & { matches: boolean };

function Navigation() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() =>
        navigate('/empresa/company-two', {
          state: { companyTransition: { startedAt: Date.now() } },
        })
      }
    >
      Abrir outra empresa
    </button>
  );
}

function fixture(entry = '/empresa/company-one') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <CompanyPageTransition />
      <Navigation />
      <Routes>
        <Route path="/empresa/:id" element={<PerfilEmpresa />} />
        <Route path="/catalogo" element={<h1>Catálogo de empresas</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  fetchCompany.mockReset();
  animations.length = 0;
  heroSnapshots.length = 0;
  preference = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => preference),
  );
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Perfil da empresa e respostas assíncronas', () => {
  it('mantém carregamento enquanto a API está pendente e mostra o perfil recebido sem alterar os campos', async () => {
    const pending = deferred<Empresa>();
    fetchCompany.mockReturnValue(pending.promise);
    fixture();
    expect(
      screen.getByRole('status', { name: 'Carregando empresa' }),
    ).toBeInTheDocument();
    expect(fetchCompany).toHaveBeenCalledWith('company-one');

    await act(async () => pending.resolve(company('company-one')));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Empresa de teste' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Descrição detalhada recebida do backend.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Fortaleza, CE')).toBeInTheDocument();
  });

  it('mostra erro público e conserva o retorno ao catálogo quando a API rejeita', async () => {
    const pending = deferred<Empresa>();
    fetchCompany.mockReturnValue(pending.promise);
    fixture();
    await act(async () =>
      pending.reject(new Error('Empresa temporariamente indisponível.')),
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Empresa temporariamente indisponível.',
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao Catálogo' }));
    expect(
      screen.getByRole('heading', { name: 'Catálogo de empresas' }),
    ).toBeInTheDocument();
  });

  it('ignora o sucesso antigo depois que outro perfil já foi carregado', async () => {
    const first = deferred<Empresa>();
    const second = deferred<Empresa>();
    fetchCompany.mockImplementation((id: string) =>
      id === 'company-one' ? first.promise : second.promise,
    );
    fixture();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir outra empresa' }));
    expect(fetchCompany.mock.calls.map((call) => call[0])).toEqual([
      'company-one',
      'company-two',
    ]);

    await act(async () => second.resolve(company('company-two', 'Empresa atual')));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Empresa atual' }),
    ).toBeInTheDocument();
    await act(async () => first.resolve(company('company-one', 'Empresa antiga')));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Empresa atual' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Empresa antiga' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uma rejeição antiga não interrompe o carregamento nem mostra erro na navegação seguinte', async () => {
    const first = deferred<Empresa>();
    const second = deferred<Empresa>();
    fetchCompany.mockImplementation((id: string) =>
      id === 'company-one' ? first.promise : second.promise,
    );
    fixture();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir outra empresa' }));
    await act(async () => first.reject(new Error('Erro da requisição antiga.')));

    expect(
      screen.getByRole('status', { name: 'Carregando empresa' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await act(async () => second.resolve(company('company-two', 'Empresa atual')));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Empresa atual' }),
    ).toBeInTheDocument();
  });

  for (const outcome of ['success', 'error'] as const) {
    it(`a cortina termina com API ainda pendente e não reaparece após ${outcome}`, async () => {
      const pending = deferred<Empresa>();
      fetchCompany.mockReturnValue(pending.promise);
      fixture('/catalogo');
      fireEvent.click(screen.getByRole('button', { name: 'Abrir outra empresa' }));
      expect(screen.getByTestId('company-page-transition')).toBeInTheDocument();
      expect(
        screen.getByRole('status', { name: 'Carregando empresa' }),
      ).toBeInTheDocument();
      expect(fetchCompany).toHaveBeenCalledWith('company-two');

      act(() => animations.at(-1)!());
      expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument();
      expect(
        screen.getByRole('status', { name: 'Carregando empresa' }),
      ).toBeInTheDocument();
      if (outcome === 'success') {
        await act(async () => pending.resolve(company('company-two', 'Empresa atual')));
        expect(
          screen.getByRole('heading', { level: 1, name: 'Empresa atual' }),
        ).toBeInTheDocument();
      } else {
        await act(async () =>
          pending.reject(new Error('Erro público da empresa atual.')),
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Erro público da empresa atual.',
        );
      }
      expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument();
    });
  }

  it('redução de movimento durante o hero troca a animação por estado estático imediato e visível', async () => {
    fetchCompany.mockResolvedValue(company('company-one'));
    fixture();
    await screen.findByRole('heading', { level: 1, name: 'Empresa de teste' });
    expect(heroSnapshots.at(-1)?.animate).toBe('visible');

    act(() => {
      preference.matches = true;
      preference.dispatchEvent(new Event('change'));
    });

    expect(heroSnapshots.at(-1)).toMatchObject({
      initial: false,
      animate: 'static',
      variants: {
        static: {
          opacity: [1, 1],
          y: [0, 0],
          transition: { duration: 0, delayChildren: 0, staggerChildren: 0 },
        },
      },
    });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Empresa de teste' }),
    ).toBeInTheDocument();
  });

  it('resposta tardia monta o hero sem repetir a espera da cortina já concluída', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(5000);
    const pending = deferred<Empresa>();
    fetchCompany.mockReturnValue(pending.promise);
    fixture('/catalogo');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir outra empresa' }));
    act(() => animations.at(-1)!());
    clock.mockReturnValue(6500);

    await act(async () => pending.resolve(company('company-two', 'Empresa atual')));

    expect(heroSnapshots.at(-1)).toMatchObject({
      animate: 'visible',
      variants: { visible: { transition: { delay: 0, duration: 0.42 } } },
    });
    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument();
  });
});
