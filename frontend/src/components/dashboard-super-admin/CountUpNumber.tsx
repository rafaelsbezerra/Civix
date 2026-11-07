import { useEffect, useState } from 'react';

const intFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function CountUpNumber({
  value,
  format = 'integer',
  suffix = '',
  duration = 900,
}: {
  value: number;
  format?: 'integer' | 'currency';
  suffix?: string;
  duration?: number;
}) {
  const isTestEnv = import.meta.env.MODE === 'test';
  const [animState, setAnimState] = useState<{ target: number; current: number }>(
    () => ({
      target: value,
      current: isTestEnv || value === 0 ? value : 0,
    }),
  );

  useEffect(() => {
    if (isTestEnv || value === 0) {
      return;
    }

    let frameId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = format === 'integer' ? Math.round(value * eased) : value * eased;
      setAnimState({ target: value, current: progress < 1 ? next : value });
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, format, duration, isTestEnv]);

  const effectiveValue =
    isTestEnv || value === 0
      ? value
      : animState.target === value
        ? animState.current
        : 0;

  const formatted =
    format === 'currency'
      ? brlFormatter.format(effectiveValue)
      : intFormatter.format(effectiveValue);

  return (
    <>
      {formatted}
      {suffix}
    </>
  );
}
