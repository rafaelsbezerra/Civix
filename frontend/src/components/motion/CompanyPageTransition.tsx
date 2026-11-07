import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useCompanyTransition } from './useCompanyTransition';

function CompanyCurtain() {
  const { reducedMotion } = useCompanyTransition();
  const [finished, setFinished] = useState(reducedMotion);

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const finishOnReduction = () => {
      if (preference?.matches) {
        setFinished(true);
      }
    };
    preference?.addEventListener('change', finishOnReduction);
    return () => preference?.removeEventListener('change', finishOnReduction);
  }, []);
  if (finished || reducedMotion) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-testid="company-page-transition"
      className="pointer-events-none fixed inset-x-0 bottom-0 top-[106px] z-30 overflow-hidden motion-reduce:hidden"
    >
      <motion.div
        className="absolute inset-0 border-t-2 border-[var(--color-civix-gold)] bg-[var(--color-civix-navy)]"
        initial={{ y: '100%' }}
        animate={{ y: ['100%', '0%', '0%', '-100%'] }}
        transition={{
          duration: 0.64,
          times: [0, 0.28, 0.35, 1],
          ease: [0.65, 0, 0.35, 1],
        }}
        onAnimationComplete={() => setFinished(true)}
      />
    </div>
  );
}

export function CompanyPageTransition() {
  const { fromCard, navigationKey } = useCompanyTransition();
  if (!fromCard) {
    return null;
  }

  // Cada clique tem sua própria animação; o histórico não repete o marcador antigo.
  return <CompanyCurtain key={navigationKey} />;
}
