import { useEffect, useRef, useState } from 'react'

import logoCivix from '@/assets/civix/logo-civix.png'
import { ActionButton } from '@/components/ui/ActionButton'

export interface NavigationItem {
  href: `/${string}` | `#${string}`
  label: string
}

export interface SiteHeaderProps {
  navigationItems?: readonly NavigationItem[]
}

const defaultNavigationItems: readonly NavigationItem[] = [
  { href: '/', label: 'Home' },
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#empresas', label: 'Empresas' },
  { href: '/#planos', label: 'Planos' },
  { href: '/#faq', label: 'FAQ' },
]

export function SiteHeader({
  navigationItems = defaultNavigationItems,
}: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      setIsMenuOpen(false)
      menuButtonRef.current?.focus()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isMenuOpen])

  return (
    <header className="relative z-50 mx-auto flex h-[106px] w-full max-w-[1728px] items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-32">
      <a
        aria-label="Civix — início"
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center rounded-sm lg:-translate-y-[5px]"
        href="/"
      >
        <img
          alt="Civix"
          className="h-8 w-[99px] object-contain"
          height="32"
          src={logoCivix}
          width="99"
        />
      </a>

      <div className="hidden items-center gap-[18px] lg:flex lg:-translate-y-1">
        <nav aria-label="Navegação principal" className="h-[19px]">
          <ul className="flex h-[19px] items-center gap-[30.48px]">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <a
                  className="font-[family-name:var(--font-body)] text-base font-normal leading-[19px] text-[var(--color-civix-navy)] transition-colors hover:text-[#000e1b]"
                  href={item.href}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ActionButton
          className="w-[138px] min-w-0 gap-2 px-3"
          href="#contato"
          showArrow
          variant="primary"
        >
          Contato
        </ActionButton>

        <ActionButton
          className="w-[138px] min-w-0 gap-2 px-3"
          href="/login"
          variant="login"
        >
          Login
        </ActionButton>
      </div>

      <button
        ref={menuButtonRef}
        aria-controls="mobile-navigation"
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? 'Fechar menu principal' : 'Abrir menu principal'}
        className="grid size-11 place-items-center rounded-[var(--radius-control)] border border-[var(--color-civix-navy)]/15 text-[var(--color-civix-navy)] lg:hidden"
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        <span aria-hidden="true" className="relative block h-4 w-5">
          <span
            className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform ${isMenuOpen ? 'translate-y-[7px] rotate-45' : ''}`}
          />
          <span
            className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`absolute bottom-0 left-0 h-0.5 w-5 bg-current transition-transform ${isMenuOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
          />
        </span>
      </button>

      {isMenuOpen ? (
        <nav
          aria-label="Navegação móvel"
          className="absolute left-6 right-6 top-[82px] rounded-2xl bg-[var(--color-civix-ivory)] p-4 shadow-[0_18px_50px_rgba(7,25,42,0.16)] sm:left-10 sm:right-10 lg:hidden"
          id="mobile-navigation"
        >
          <ul className="flex flex-col">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <a
                  className="block rounded-lg px-4 py-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-civix-navy)] hover:bg-[var(--color-civix-gold)]/10"
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <ActionButton
            className="mt-3 w-full"
            href="#contato"
            onClick={() => setIsMenuOpen(false)}
            variant="primary"
          >
            Contato
          </ActionButton>

          <ActionButton
            className="mt-3 w-full"
            href="/login"
            onClick={() => setIsMenuOpen(false)}
            variant="login"
          >
            Login
          </ActionButton>
        </nav>
      ) : null}
    </header>
  )
}
