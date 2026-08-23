import { SiteHeader } from '@/components/layout/SiteHeader'
import { HeroSection } from '@/components/home/HeroSection'

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[var(--color-civix-ivory)]">
            <SiteHeader />
            <main>
                <HeroSection />
            </main>
        </div>
    )
};