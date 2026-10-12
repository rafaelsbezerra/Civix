import { useEffect } from 'react'
import Lenis from 'lenis'
import { useLocation } from 'react-router-dom'

export function PublicSmoothScroll() {
  const { pathname } = useLocation()
  const isPublicPage = pathname !== '/login'

  useEffect(() => {
    if (!isPublicPage || typeof window.matchMedia !== 'function') return

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let lenis: Lenis | undefined

    function syncPreference() {
      lenis?.destroy()
      lenis = undefined
      if (preference.matches) return

      lenis = new Lenis({
        anchors: true,
        autoRaf: true,
        duration: 1.1,
        smoothWheel: true,
        stopInertiaOnNavigate: true,
      })

    }

    syncPreference()
    preference.addEventListener('change', syncPreference)

    return () => {
      preference.removeEventListener('change', syncPreference)
      lenis?.destroy()
    }
  }, [isPublicPage])

  useEffect(() => {
    const hash = window.location.hash
    if (!isPublicPage || !hash) return

    // Ao trocar de página, a seção só existe depois que o React monta o destino.
    const frame = window.requestAnimationFrame(() => {
      try {
        document.getElementById(decodeURIComponent(hash.slice(1)))
          ?.scrollIntoView({ block: 'start', behavior: 'instant' })
      } catch {
        // Uma âncora inválida não deve impedir a navegação da página.
      }
    })

    return () => window.cancelAnimationFrame(frame)
    // Mudanças de hash na mesma página são atendidas pelas âncoras do Lenis/browser.
  }, [isPublicPage, pathname])

  return null
}
