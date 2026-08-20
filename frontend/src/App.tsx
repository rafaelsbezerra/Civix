import { SiteHeader } from './components/layout/SiteHeader'
import { HeroSection } from './features/home/components/HeroSection'

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-civix-ivory)]">
      <SiteHeader />
      <main>
        <HeroSection />
      </main>
    </div>
  )
}

export default App
