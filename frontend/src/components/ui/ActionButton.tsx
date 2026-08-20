import type { AnchorHTMLAttributes, ReactNode } from 'react'

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
    'bg-[var(--color-civix-gold)] text-[var(--color-civix-navy)] hover:bg-[#e5ad3d]',
  light:
    'bg-[var(--color-civix-ivory)] text-[var(--color-civix-navy)] hover:bg-white',
  translucent:
    'bg-white/10 text-[var(--color-civix-ivory)] backdrop-blur-[2px] hover:bg-white/20',
}

export function ActionButton({
  children,
  className = '',
  showArrow = false,
  variant,
  ...anchorProps
}: ActionButtonProps) {
  return (
    <a
      className={`inline-flex min-h-[42px] min-w-[138px] items-center justify-center gap-2.5 rounded-[var(--radius-control)] px-6 font-[var(--font-display)] text-sm font-semibold leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-civix-gold)] ${variantClasses[variant]} ${className}`.trim()}
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
