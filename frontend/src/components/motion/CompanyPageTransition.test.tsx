import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyPageTransition } from './CompanyPageTransition';

const { animations } = vi.hoisted(() => ({
  animations: [] as { complete: () => void; transition: { duration?: number } }[],
}));

vi.mock('motion/react', async () => {
  const React = await import('react');

  return {
    motion: {
      div: (props: Record<string, unknown>) => {
        const excluded = new Set([
          'initial',
          'animate',
          'transition',
          'onAnimationComplete',
        ]);
        if (typeof props.onAnimationComplete === 'function') {
          animations.push({
            complete: props.onAnimationComplete as () => void,
            transition: props.transition as { duration?: number },
          });
        }
        return React.createElement(
          'div',
          Object.fromEntries(
            Object.entries(props).filter(([key]) => !excluded.has(key)),
          ),
        );
      },
    },
  };
});

let preference: EventTarget & { matches: boolean };

function Navigation({ marker }: { marker?: unknown }) {
  const navigate = useNavigate();
  const location = useLocation();
  const getState = () => ({ companyTransition: marker ?? { startedAt: Date.now() } });

  return (
    <>
      <output aria-label="Destino atual">{location.pathname}</output>
      <button onClick={() => navigate('/empresa/company-one', { state: getState() })}>
        Abrir empresa
      </button>
      <button onClick={() => navigate('/empresa/company-two', { state: getState() })}>
        Abrir outra empresa
      </button>
      <button onClick={() => navigate('/empresa/company-one')}>
        Abrir sem marcador
      </button>
      <button
        onClick={() =>
          navigate('/empresa/company-one', { state: getState(), replace: true })
        }
      >
        Substituir rota
      </button>
      <button onClick={() => navigate('/login', { state: getState() })}>
        Abrir acesso
      </button>
      <button onClick={() => navigate(-1)}>Voltar</button>
      <button onClick={() => navigate(1)}>Avançar</button>
    </>
  );
}

function fixture(
  entry: string | { pathname: string; state?: unknown } = '/catalogo',
  marker?: unknown,
) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <CompanyPageTransition />
      <Navigation marker={marker} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  animations.length = 0;
  preference = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => preference),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Cortina de entrada no perfil de empresa', () => {
  it('não renderiza overlay de cortina na navegação para perfil de empresa', () => {
    fixture();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }));

    expect(screen.queryByTestId('company-page-transition')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Destino atual')).toHaveTextContent(
      '/empresa/company-one',
    );
    expect(animations).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeEnabled();
  });
});
