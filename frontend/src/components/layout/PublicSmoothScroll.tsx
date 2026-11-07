import { useEffect, useLayoutEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useLocation, useNavigationType } from 'react-router-dom';

export function PublicSmoothScroll() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const isPublicPage =
    pathname !== '/login' &&
    !pathname.startsWith('/login/') &&
    !pathname.startsWith('/dashboard/super-admin');
  const lenisRef = useRef<Lenis | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!isPublicPage || typeof window.matchMedia !== 'function') {
      return;
    }

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');

    function syncPreference() {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      if (preference.matches) {
        return;
      }

      lenisRef.current = new Lenis({
        anchors: true,
        autoRaf: true,
        duration: 1.1,
        smoothWheel: true,
        stopInertiaOnNavigate: true,
      });
    }

    syncPreference();
    preference.addEventListener('change', syncPreference);

    return () => {
      preference.removeEventListener('change', syncPreference);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [isPublicPage]);

  useLayoutEffect(() => {
    const initial = !hasNavigated.current;
    if (navigationType !== 'POP') {
      hasNavigated.current = true;
    }
    if (!isPublicPage) {
      return;
    }

    function reposition(move?: () => void) {
      const lenis = lenisRef.current;
      const wasStopped = lenis?.isStopped;

      // Parar antes de mover: Lenis ignora scrollTo quando o alvo já é o mesmo.
      lenis?.stop();
      move?.();
      lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
      if (lenis && !wasStopped) {
        lenis.start();
      }
    }

    // Voltar/Avançar conserva a posição restaurada pelo navegador.
    if (!initial && navigationType === 'POP') {
      reposition();
      const frame = window.requestAnimationFrame(() => reposition());
      return () => window.cancelAnimationFrame(frame);
    }

    const hash = window.location.hash;
    if (!hash) {
      if (navigationType !== 'POP') {
        reposition(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
      }
      return;
    }

    let targetId: string;
    try {
      targetId = decodeURIComponent(hash.slice(1));
    } catch {
      // Uma âncora inválida não deve impedir a navegação da página.
      return;
    }

    reposition();
    let frame: number | undefined;
    let observer: ResizeObserver | undefined;
    let tracking = true;
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

    function alignAnchor() {
      if (!tracking) {
        return;
      }
      const target = document.getElementById(targetId);
      if (target) {
        reposition(() =>
          target.scrollIntoView({ block: 'start', behavior: 'instant' }),
        );
      }
    }

    function scheduleAlignment() {
      if (!tracking) {
        return;
      }
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
      frame = window.requestAnimationFrame(alignAnchor);
    }

    function stopTracking() {
      tracking = false;
      observer?.disconnect();
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
      events.forEach((event) => window.removeEventListener(event, stopTracking));
    }

    // Dados da API podem mudar a altura acima da âncora após o primeiro frame.
    // A primeira interação devolve o controle da posição ao visitante.
    events.forEach((event) =>
      window.addEventListener(event, stopTracking, { passive: true }),
    );
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(scheduleAlignment);
      observer.observe(document.body);
    }
    scheduleAlignment();

    return stopTracking;
    // Âncoras na mesma página continuam atendidas por Lenis/browser.
  }, [isPublicPage, pathname, navigationType]);

  return null;
}
