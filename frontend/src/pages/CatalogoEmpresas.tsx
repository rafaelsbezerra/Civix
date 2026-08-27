import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEmpresas } from '@/lib/api';
import type { Empresa } from '@/lib/api';
import { SiteHeader } from '@/components/layout/SiteHeader';
import Footer from '@/components/layout/SiteFooter';
import { MapPin } from 'lucide-react';
import { SearchForm } from '@/components/home/SearchForm';
import decorativeShape from "@/assets/civix/decorative-shape.svg";
import heroArtwork from "@/assets/civix/hero-artwork.svg";

function BuildingMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="w-8 h-8 text-[var(--color-civix-gold)]">
      <path d="M10 40V15l14-7 14 7v25" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 40h34M17 21h4M27 21h4M17 28h4M27 28h4M21 40V34h6v6" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CatalogoEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEmpresas();
        setEmpresas(data);
      } catch (err) {
        console.error('Erro ao carregar empresas:', err);
        setError('Erro ao carregar empresas. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadEmpresas();
  }, []);

  const handleEmpresaClick = (empresaId: string) => {
    navigate(`/empresa/${empresaId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-civix-ivory)] flex flex-col font-[family-name:var(--font-body)]">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          aria-labelledby="hero-title"
          className="px-4 pb-12 sm:px-8 lg:px-16 lg:pb-0 lg:pt-[3px]"
          id="home"
        >
          <div className="relative mx-auto w-full max-w-[1600px] lg:h-[653px]">
            <div
              className="relative min-h-[650px] w-full max-w-[1600px] overflow-hidden rounded-[var(--radius-hero)] bg-[var(--color-civix-navy)] sm:min-h-[700px] lg:h-[600px] lg:min-h-0"
              data-testid="hero-surface"
            >
              <img
                aria-hidden="true"
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
                src={heroArtwork}
              />
              <img
                aria-hidden="true"
                alt=""
                className="absolute -left-20 -top-24 w-[320px] opacity-80 sm:-left-16 sm:-top-32 sm:w-[432px]"
                src={decorativeShape}
              />

              <div className="relative z-10 px-6 pb-36 pt-16 text-[var(--color-civix-ivory)] sm:px-10 sm:pt-20 lg:absolute lg:left-[63px] lg:top-[124px] lg:p-0">
                <h1
                  className="max-w-[643px] font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,4rem)] font-semibold uppercase leading-[1.1] tracking-[-0.02em] lg:w-[643px] lg:text-[64px] lg:leading-[80px] lg:tracking-[-0.034em]"
                >
                  <p className="text-[var(--color-civix-gold)] font-bold tracking-widest text-sm mb-4">REDE CIVIX / EMPRESAS</p>
                  <span className="lg:block lg:whitespace-nowrap">EMPRESAS PARCEIRAS DA</span>{' '}
                  <span className="lg:block lg:whitespace-nowrap lg:tracking-[-0.045em] text-[var(--color-civix-gold)]">
                    CONSTRUÇÃO CIVIL
                  </span>
                </h1>
                <p className="mt-10 max-w-[511px] font-[family-name:var(--font-body)] text-base font-normal leading-[normal] text-[var(--color-civix-ivory)]/90 sm:text-lg lg:absolute lg:left-0 lg:top-[164px] lg:mt-0 lg:w-[511px] lg:leading-[20.6667px]">
                  Encontre profissionais e fornecedores verificados, prontos para o seu próximo projeto.
                </p>
              </div>
            </div>

            <div
              className="relative z-20 mx-4 -mt-8 rounded-[var(--radius-search)] bg-[var(--color-civix-ivory)] p-6 shadow-[0_34px_26px_rgba(13,10,44,0.25),0_12px_34px_rgba(13,10,44,0.25),0_4px_4px_rgba(0,0,0,0.25)] sm:mx-8 sm:p-8 lg:absolute lg:left-[17.875%] lg:top-[525px] lg:mx-0 lg:mt-0 lg:min-h-[142px] lg:w-[69%] lg:px-10 lg:py-[45px]"
              data-testid="hero-search-card"
            >
              <SearchForm />
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-16 px-6 sm:px-10 lg:px-16 xl:px-32 max-w-[1728px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-gray-200 pb-6">
            <div>
              <p className="text-sm font-bold text-gray-400 tracking-wider mb-2">EXPLORAR A REDE</p>
              <h2 className="text-3xl font-[family-name:var(--font-display)] font-semibold text-[var(--color-civix-navy)]">
                {empresas.length} empresas encontradas
              </h2>
            </div>
            <button className="text-gray-500 hover:text-[var(--color-civix-navy)] font-medium text-sm transition-colors mt-4 md:mt-0 flex items-center gap-1">
              Limpar filtros <span className="text-lg leading-none">&times;</span>
            </button>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-civix-navy)]"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {empresas.map((empresa) => (
                <article
                  key={empresa.id}
                  onClick={() => handleEmpresaClick(empresa.id)}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full"
                >
                  {/* Card Header Pattern/Color */}
                  <div className={`h-32 p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ${empresa.tone === 'blue' ? 'from-blue-50 to-blue-100' :
                    empresa.tone === 'green' ? 'from-green-50 to-green-100' :
                      empresa.tone === 'orange' ? 'from-orange-50 to-orange-100' :
                        empresa.tone === 'purple' ? 'from-purple-50 to-purple-100' :
                          'from-gray-50 to-gray-100'
                    }`}>
                    <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                      <BuildingMark />
                    </div>
                    <span className="bg-white/80 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full text-gray-700 w-fit">
                      {empresa.categoria}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-semibold text-[var(--color-civix-navy)] mb-3 group-hover:text-[var(--color-civix-gold)] transition-colors">
                      {empresa.nome}
                    </h3>

                    <div className="mt-auto">
                      <p className="flex items-center text-sm text-gray-500 mb-4">
                        <MapPin size={16} className="mr-1 text-[var(--color-civix-gold)]" />
                        {empresa.cidade}, {empresa.estado}
                      </p>
                      <div className="flex items-center text-sm font-semibold text-[var(--color-civix-navy)] group-hover:text-[var(--color-civix-gold)] transition-colors">
                        Ver perfil <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}