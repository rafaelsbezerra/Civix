import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from 'react'

import arrowRight from '@/assets/civix/arrow-right.svg'

type ActionButtonVariant = 'primary' | 'light' | 'translucent'

export interface ActionButtonProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
  showArrow?: boolean
  variant: ActionButtonVariant
}

const variantClasses: Record<ActionButtonVariant, string> = {
  primary:
    'bg-[#07192a] text-[#faf9f6] hover:bg-[#102f4b]',
  light:
    'bg-[#faf9f6] text-[#07192a] hover:bg-white',
  translucent:
    'bg-white/10 text-[#faf9f6] backdrop-blur-[2px] hover:bg-white/20',
}

const variantStyles: Record<ActionButtonVariant, CSSProperties> = {
  primary: { backgroundColor: '#07192a', color: '#faf9f6' },
  light: { backgroundColor: '#faf9f6', color: '#07192a' },
  translucent: { backgroundColor: 'rgba(250, 249, 246, 0.2)', color: '#faf9f6' },
}

export function ActionButton({
  children,
  className = '',
  showArrow = false,
  style,
  variant,
  ...anchorProps
}: ActionButtonProps) {
  return (
    <a
      className={`inline-flex min-h-11 min-w-[138px] items-center justify-center gap-2.5 rounded-[var(--radius-control)] px-6 font-[var(--font-display)] text-lg font-semibold leading-[19.8px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-civix-gold)] lg:min-h-[42px] ${variantClasses[variant]} ${className}`.trim()}
      style={{ ...variantStyles[variant], ...style }}
      {...anchorProps}
    >
      <span>{children}</span>
      {showArrow ? (
        <img
          aria-hidden="true"
          alt=""
          className="size-6 shrink-0"
          height="24"
          src={arrowRight}
          width="24"
        />
      ) : null}
    </a>
  )
}
