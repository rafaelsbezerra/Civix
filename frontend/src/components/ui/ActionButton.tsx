import type { AnchorHTMLAttributes, ReactNode } from 'react'

import arrowRight from '@/assets/civix/arrow-right.svg'

type ActionButtonVariant = 'primary' | 'light' | 'translucent' | 'yellow'

export interface ActionButtonProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
  showArrow?: boolean
  variant: ActionButtonVariant
}

const variantClasses: Record<ActionButtonVariant, string> = {
  primary:
    'bg-[#07192a] text-[#faf9f6] hover:bg-[#102c43]',
  light:
    'bg-[#faf9f6] text-[#07192a] hover:bg-[#e8e7e3]',
  translucent:
    'bg-[rgba(250,249,246,0.2)] text-[#faf9f6] backdrop-blur-[2px] hover:bg-[rgba(250,249,246,0.32)]',
  yellow:
    'bg-[#d89c28] text-[#faf9f6] hover:bg-[#b88320]',
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
      className={`action-button--${variant} inline-flex min-h-11 min-w-[138px] items-center justify-center gap-2.5 rounded-[var(--radius-control)] px-6 font-[family-name:var(--font-display)] text-lg font-semibold leading-[19.8px] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 lg:min-h-[42px] ${variantClasses[variant]} ${className}`.trim()}
      style={style}
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
