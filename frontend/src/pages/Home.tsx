import { SiteHeader } from '@/components/layout/SiteHeader'
import { HeroSection } from '@/components/home/HeroSection'
import Footer from '@/components/footer/SiteFooter'
import CardEmpresas from '@/components/EmpresasCard/CardEmpresas'
import FAQ from '@/pages/FAQ'
import AboutPage from './About'

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[var(--color-civix-ivory)]">
            <SiteHeader />
            <main>
                <HeroSection />
                <AboutPage />
                <CardEmpresas />
                <FAQ />
                <Footer />
            </main>
        </div>
    )
};