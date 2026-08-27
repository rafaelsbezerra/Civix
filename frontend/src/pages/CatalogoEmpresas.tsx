import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEmpresas } from '@/lib/api';
import type { Empresa } from '@/lib/api';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { MapPin, Search } from 'lucide-react';

function BuildingMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="w-8 h-8 text-[var(--color-civix-gold)]">
      <path d="M10 40V15l14-7 14 7v25" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 40h34M17 21h4M27 21h4M17 28h4M27 28h4M21 40V34h6v6" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
        <section className="relative bg-[var(--color-civix-navy)] text-[var(--color-civix-ivory)] py-20 px-6 sm:px-10 lg:px-16 xl:px-32 flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <p className="text-[var(--color-civix-gold)] font-bold tracking-widest text-sm mb-4">REDE CIVIX / EMPRESAS</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-display)] font-semibold mb-6">
              Empresas parceiras<br />
              <em className="text-[var(--color-civix-gold)] not-italic">da construção civil.</em>
            </h1>
            <p className="text-lg text-[var(--color-civix-ivory)]/80 max-w-2xl mx-auto mb-12">
              Encontre fornecedores, especialistas e parceiros que fazem a construção acontecer.
            </p>
            
            {/* Search Panel */}
            <div className="bg-white rounded-[var(--radius-search)] p-4 shadow-2xl flex flex-col md:flex-row gap-4 items-end max-w-5xl mx-auto text-left text-[var(--color-civix-ink)]">
              <label className="flex-1 flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-500 px-2">O que busca?</span>
                <input 
                  type="text" 
                  placeholder="Nome ou palavra-chave" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-civix-navy)] transition-shadow"
                />
              </label>
              <label className="flex-1 flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-500 px-2">Região</span>
                <input 
                  type="text" 
                  placeholder="Todo o Brasil" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-civix-navy)] transition-shadow"
                />
              </label>
              <label className="flex-1 flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-500 px-2">Área de atuação</span>
                <input 
                  type="text" 
                  placeholder="Selecionar área" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-civix-navy)] transition-shadow"
                />
              </label>
              <button 
                type="button" 
                className="bg-[var(--color-civix-navy)] hover:bg-[var(--color-civix-ink)] text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors h-[46px] w-full md:w-auto"
              >
                Buscar <Search size={18} />
              </button>
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
                  <div className={`h-32 p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ${
                    empresa.tone === 'blue' ? 'from-blue-50 to-blue-100' :
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
      
      <SiteFooter />
    </div>
  )
}