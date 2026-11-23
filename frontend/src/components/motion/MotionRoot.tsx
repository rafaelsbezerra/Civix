import { useEffect, useRef, type PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';

type Animate = typeof import('motion/mini').animate;

type Entry = {
  opacity: string;
  translate: string;
  endOpacity: number;
  controls?: ReturnType<Animate>;
};

const presets = {
  page: { duration: 0.42, distance: 16 },
  section: { duration: 0.32, distance: 16 },
  item: { duration: 0.28, distance: 12 },
  feedback: { duration: 0.18, distance: 4 },
  panel: { duration: 0.22, distance: 8 },
  overlay: { duration: 0.14, distance: 0 },
} as const;

export function MotionRoot({ children }: PropsWithChildren) {
  const scope = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const enabled = ![
    '/login',
    '/primeiro-acesso',
    '/esqueci-senha',
    '/redefinir-senha',
    '/dashboard/super-admin',
  ].some((path) => pathname === path || pathname.startsWith(path + '/'));

  useEffect(() => {
    const root = scope.current;

    if (
      !root ||
      !enabled ||
      typeof window.matchMedia !== 'function' ||
      typeof IntersectionObserver !== 'function' ||
      typeof MutationObserver !== 'function' ||
      typeof HTMLElement.prototype.animate !== 'function'
    ) {
      return;
    }

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compact = window.matchMedia('(max-width: 767px)');
    const seen = new WeakSet<HTMLElement>();
    const entries = new Map<HTMLElement, Entry>();
    let animate: Animate | undefined;
    let disposed = false;
    let failed = false;
    let frame = 0;

    function finish(element: HTMLElement) {
      const entry = entries.get(element);
      if (!entry) {
        return;
      }

      entry.controls?.cancel();
      element.style.opacity = entry.opacity;
      element.style.translate = entry.translate;
      element.dataset.motionState = 'done';
      entries.delete(element);
      observer.unobserve(element);
    }

    function reveal(element: HTMLElement, extraDelay = 0) {
      const entry = entries.get(element);
      const preset = presets[element.dataset.motion as keyof typeof presets];
      if (!entry || !preset || !animate) {
        return;
      }

      observer.unobserve(element);
      if (preference.matches || element.contains(document.activeElement)) {
        finish(element);
        return;
      }

      // A propriedade translate é independente de transform/rotate; conservar seu valor CSS.
      const parts =
        getComputedStyle(element).translate.match(/calc\([^)]*\)|[^\s]+/g) ?? [];
      const x = parts[0] && parts[0] !== 'none' ? parts[0] : '0px';
      const y = parts[1] ?? '0px';
      const z = parts[2] ? ' ' + parts[2] : '';
      const distance = compact.matches ? Math.min(preset.distance, 8) : preset.distance;
      const delay =
        Math.min(Number(element.dataset.motionDelay || 0) + extraDelay, 240) / 1000;

      try {
        element.dataset.motionState = 'running';
        entry.controls = animate(
          element,
          {
            opacity: [
              preset === presets.feedback ? entry.endOpacity * 0.75 : 0,
              entry.endOpacity,
            ],
            translate: [
              x + ' calc(' + y + ' + ' + distance + 'px)' + z,
              x + ' ' + y + z,
            ],
          },
          {
            duration: preset.duration,
            delay,
            ease: [0.2, 0, 0, 1],
          },
        );
        void entry.controls.then(() => {
          if (!disposed && entries.get(element) === entry) {
            finish(element);
          }
        });
      } catch {
        // Uma falha visual não deve esconder conteúdo nem bloquear os controles.
        failed = true;
        for (const target of entries.keys()) {
          finish(target);
        }
      }
    }

    const observer = new IntersectionObserver(
      (batch) => {
        const groupCounts = new Map<Element | null, number>();

        for (const item of batch) {
          if (
            !item.isIntersecting ||
            (item.intersectionRatio < 0.15 &&
              item.boundingClientRect.height < window.innerHeight * 0.85)
          ) {
            continue;
          }

          const element = item.target as HTMLElement;
          const step = compact.matches
            ? 0
            : Math.max(0, Number(element.dataset.motionStep || 0));
          const count = groupCounts.get(element.parentElement) ?? 0;
          if (step) {
            groupCounts.set(element.parentElement, count + 1);
          }
          reveal(element, Math.min(count * step, 200));
        }
      },
      { threshold: [0, 0.15] },
    );

    function scan() {
      frame = 0;
      if (disposed) {
        return;
      }

      for (const [element] of entries) {
        if (!element.isConnected) {
          finish(element);
        }
      }

      for (const element of root!.querySelectorAll<HTMLElement>('[data-motion]')) {
        if (seen.has(element) || element.closest('[inert]')) {
          continue;
        }
        // A navbar permanece estática durante a abertura do perfil.
        if (pathname.startsWith('/empresa/') && element.closest('[data-site-header]')) {
          continue;
        }
        const preset = presets[element.dataset.motion as keyof typeof presets];
        if (!preset) {
          continue;
        }
        if (!animate && !preference.matches && !failed) {
          continue;
        }
        seen.add(element);
        if (preference.matches || failed) {
          element.dataset.motionState = 'done';
          continue;
        }

        const endOpacity = Number(getComputedStyle(element).opacity);
        entries.set(element, {
          opacity: element.style.opacity,
          translate: element.style.translate,
          endOpacity: Number.isFinite(endOpacity) ? endOpacity : 1,
        });

        if (element.contains(document.activeElement)) {
          finish(element);
        } else if (
          element.dataset.motionTrigger === 'mount' ||
          preset === presets.feedback
        ) {
          reveal(element);
        } else {
          element.dataset.motionState = 'waiting';
          // Preparar somente conteúdo fora da tela, após a biblioteca e o observer estarem disponíveis.
          if (element.getBoundingClientRect().top >= window.innerHeight) {
            element.style.opacity = '0';
          }
          observer.observe(element);
        }
      }
    }

    function scheduleScan() {
      if (!frame) {
        frame = window.requestAnimationFrame(scan);
      }
    }

    function revealFocused(event: Event) {
      let element = event.target instanceof HTMLElement ? event.target : null;
      while (element && root!.contains(element)) {
        if (entries.has(element)) {
          finish(element);
        }
        element = element.parentElement;
      }
    }

    async function load() {
      if (preference.matches) {
        for (const element of entries.keys()) {
          finish(element);
        }
        scan();
        return;
      }

      try {
        animate = (await import('motion/mini')).animate;
        if (!disposed) {
          scan();
        }
      } catch {
        failed = true;
        if (!disposed) {
          scan();
        }
      }
    }

    const mutations = new MutationObserver(scheduleScan);
    mutations.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['inert'],
    });
    root.addEventListener('focusin', revealFocused);
    preference.addEventListener('change', load);
    void load();

    return () => {
      disposed = true;
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener('change', load);
      root.removeEventListener('focusin', revealFocused);
      window.cancelAnimationFrame(frame);
      for (const element of entries.keys()) {
        finish(element);
      }
    };
  }, [enabled, pathname]);

  return (
    <div className="contents" data-motion-root={enabled ? '' : undefined} ref={scope}>
      {children}
    </div>
  );
}
