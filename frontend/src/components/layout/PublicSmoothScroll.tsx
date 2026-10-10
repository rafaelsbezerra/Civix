import { useEffect } from 'react'
import Lenis from 'lenis'
import { useLocation } from 'react-router-dom'

export function PublicSmoothScroll() {
  const { pathname } = useLocation()
  const isPublicPage = pathname !== '/login'

  useEffect(() => {
    if (!isPublicPage || typeof window.matchMedia !== 'function') return

    const lenis = new Lenis({
      anchors: true,
      autoRaf: true,
      duration: 1.1,
      smoothWheel: true,
      stopInertiaOnNavigate: true,
    })

    return () => lenis.destroy()
  }, [isPublicPage])

  return null
}
