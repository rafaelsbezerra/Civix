import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import logoCivix from '@/assets/civix/logo-civix.png'
import { ActionButton } from '@/components/ui/ActionButton'

export interface NavigationItem {
  href: string
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
  const { pathname, hash } = useLocation()
  const headerRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 8)
  const [activeSection, setActiveSection] = useState<string | null>('home')

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

  useEffect(() => {
    let frame = 0
    const ids = ['home', ...navigationItems.filter(item => item.href.startsWith('/#')).map(item => item.href.slice(2))]
    const sections = ids.map(id => document.getElementById(id)).filter((element): element is HTMLElement => !!element)

    function update() {
      frame = 0
      setIsScrolled(window.scrollY > 8)
      if (pathname !== '/') return

      const line = (headerRef.current?.getBoundingClientRect().height || 76) + 24
      let current: string | null = null
      for (const element of sections) {
        const bounds = element.getBoundingClientRect()
        if (bounds.top <= line && bounds.bottom > line) current = element.id
      }
      setActiveSection(current ?? (window.scrollY < 8 ? 'home' : null))
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('hashchange', schedule)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null
    observer?.observe(document.body)
    schedule()

    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('hashchange', schedule)
      observer?.disconnect()
      window.cancelAnimationFrame(frame)
    }
  }, [pathname, hash, navigationItems])

  function currentLocation(item: NavigationItem): 'page' | 'location' | undefined {
    if (pathname === '/') {
      const id = item.href === '/' ? 'home' : item.href.startsWith('/#') ? item.href.slice(2) : undefined
      return id && id === activeSection ? 'location' : undefined
    }

    if ((pathname === '/catalogo' || pathname.startsWith('/empresa/')) && item.href === '/#empresas') return 'page'
    return item.href === pathname ? 'page' : undefined
  }

  return (
    <>
      <div aria-hidden="true" className="h-[76px] shrink-0" />
      <header data-site-header="" data-scrolled={isScrolled} className={`fixed inset-x-0 top-0 z-40 w-full rounded-b-2xl transition-all duration-300 motion-reduce:transition-none ${isScrolled || isMenuOpen ? 'border-b border-[var(--color-civix-navy)]/8 bg-[var(--color-civix-ivory)]/88 shadow-[0_8px_28px_rgba(7,25,42,0.06)] backdrop-blur-md' : 'bg-transparent'}`}>
        <div ref={headerRef} className="relative mx-auto flex h-[76px] w-full max-w-[1728px] items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-32">
          <a
            data-motion="item"
            data-motion-trigger="mount"
            aria-label="Civix — início"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center rounded-sm"
            href="/"
          >
            <img
              alt="Civix"
              className="h-7 w-[88px] object-contain"
              height="28"
              src={logoCivix}
              width="88"
            />
          </a>

          <div data-motion="item" data-motion-trigger="mount" data-motion-delay="60" className="hidden items-center gap-4 lg:flex">
            <nav aria-label="Navegação principal" className="h-[19px]">
              <ul className="flex h-[19px] items-center gap-7">
                {navigationItems.map((item) => (
                  <li key={item.href}>
                    <a
                      aria-current={currentLocation(item)}
                      className={`font-[family-name:var(--font-body)] text-[15px] leading-[19px] transition-colors hover:text-[#000e1b] ${currentLocation(item) ? 'font-semibold text-[var(--color-civix-gold-accessible)]' : 'font-normal text-[var(--color-civix-navy)]'}`}
                      href={item.href}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <ActionButton
              className="min-h-10 w-[124px] min-w-0 gap-1.5 px-3 text-base lg:min-h-[38px]"
              href="/#contato"
              showArrow
              variant="primary"
            >
              Contato
            </ActionButton>

            <ActionButton
              className="min-h-10 w-[116px] min-w-0 gap-1.5 px-3 text-base lg:min-h-[38px]"
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
              data-motion="panel"
              data-motion-trigger="mount"
              className="absolute left-6 right-6 top-[72px] max-h-[calc(100dvh-88px)] overflow-y-auto rounded-2xl bg-[var(--color-civix-ivory)] p-4 shadow-[0_18px_50px_rgba(7,25,42,0.16)] sm:left-10 sm:right-10 lg:hidden"
              id="mobile-navigation"
            >
              <ul className="flex flex-col">
                {navigationItems.map((item) => (
                  <li key={item.href}>
                    <a
                      aria-current={currentLocation(item)}
                      className={`block rounded-lg px-4 py-3 font-[family-name:var(--font-body)] text-sm hover:bg-[var(--color-civix-gold)]/10 ${currentLocation(item) ? 'font-semibold text-[var(--color-civix-gold-accessible)]' : 'text-[var(--color-civix-navy)]'}`}
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
                href="/#contato"
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
        </div>
      </header>
    </>
  )
}
