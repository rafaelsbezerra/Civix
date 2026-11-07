import { useSyncExternalStore } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const preference = window.matchMedia?.(REDUCED_MOTION_QUERY);
  preference?.addEventListener('change', onChange);
  return () => preference?.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? true;
}

export function useCompanyTransition() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const reducedMotion = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const state = location.state as {
    companyTransition?: { startedAt?: unknown };
  } | null;
  const startedAt = state?.companyTransition?.startedAt;
  const fromCard =
    navigationType === 'PUSH' &&
    /^\/empresa\/[^/]+\/?$/.test(location.pathname) &&
    typeof startedAt === 'number' &&
    Number.isFinite(startedAt);

  return {
    fromCard,
    reducedMotion,
    startedAt: fromCard ? startedAt : undefined,
    navigationKey: location.key,
  };
}
