import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchEmpresas,
  searchCompaniesByFilters,
  fetchEmpresasByCategoria,
  fetchEmpresasByEstado,
} from '@/lib/api';
import type { Empresa } from '@/lib/api';
import { SiteHeader } from '@/components/layout/SiteHeader';
import Footer from '@/components/layout/SiteFooter';
import { MapPin, SearchX } from 'lucide-react';
import { SearchForm, type SearchFormValues } from '@/components/home/SearchForm';
import decorativeShape from '@/assets/civix/decorative-shape.svg';
import heroArtwork from '@/assets/civix/hero-artwork.svg';

function BuildingMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="w-8 h-8 text-[var(--color-civix-gold)]"
    >
      <path
        d="M10 40V15l14-7 14 7v25"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 40h34M17 21h4M27 21h4M17 28h4M27 28h4M21 40V34h6v6"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CatalogoEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [searchFormResetKey, setSearchFormResetKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQuery = searchParams.get('q') ?? '';
  const initialUf = searchParams.get('uf') ?? '';
  const initialPriceRange = searchParams.get('priceRange') ?? '';

  // Função para carregar todas as empresas (usada ao recarregar/limpar filtros)
  const loadEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsFiltered(false);
      const data = await fetchEmpresas();
      setEmpresas(data);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar empresas. Tente novamente mais tarde.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Efeito de busca inicial ou quando parâmetros de busca na URL mudam
  useEffect(() => {
    let active = true;
    const q = (searchParams.get('q') ?? '').trim();
    const uf = (searchParams.get('uf') ?? '').trim().toUpperCase();
    const priceRange = (searchParams.get('priceRange') ?? '').trim();

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const hasNameFilter = q.length > 0;
        const hasUfFilter = uf.length > 0;
        const hasPriceFilter = priceRange.length > 0;

        if (!hasNameFilter && !hasUfFilter && !hasPriceFilter) {
          setIsFiltered(false);
          const data = await fetchEmpresas();
          if (active) {
            setEmpresas(data);
          }
          return;
        }

        setIsFiltered(true);

        if (!hasNameFilter && hasUfFilter !== hasPriceFilter) {
          if (active) {
            setEmpresas([]);
            setError(
              'Para buscar por região e preço, selecione tanto a Região / UF quanto a Faixa de preço, ou informe o nome da empresa.',
            );
          }
          return;
        }

        const data = await searchCompaniesByFilters({
          q: hasNameFilter ? q : undefined,
          uf: hasUfFilter && hasPriceFilter ? uf : undefined,
          priceRange: hasUfFilter && hasPriceFilter ? priceRange : undefined,
        });

        if (active) {
          setEmpresas(data);
        }
      } catch (err) {
        console.error('Erro ao carregar empresas:', err);
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Erro ao carregar empresas. Tente novamente mais tarde.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [searchParams]);

  // Callback executado quando o usuário submete o card de busca por nome e UF + faixa de preço
  const handleSearchFormSubmit = (values: SearchFormValues) => {
    const q = values.query.trim();
    const uf = values.region.trim().toUpperCase();
    const priceRange = values.priceRange.trim();

    if (!q && !uf && !priceRange) {
      setSearchParams({});
      return;
    }

    if (!q && Boolean(uf) !== Boolean(priceRange)) {
      setIsFiltered(true);
      setEmpresas([]);
      setError(
        'Para buscar por região e preço, selecione tanto a Região / UF quanto a Faixa de preço, ou informe o nome da empresa.',
      );
      return;
    }

    const nextParams = new URLSearchParams();
    if (q) {
      nextParams.set('q', q);
    }
    if (uf && priceRange) {
      nextParams.set('uf', uf);
      nextParams.set('priceRange', priceRange);
    }
    setSearchParams(nextParams);
  };

  // Callback legado de busca por categoria/estado
  const handleSearch = async (filters: {
    termo?: string;
    categoria?: string;
    estado?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      setIsFiltered(true);

      let result: Empresa[] = [];

      if (filters.termo && filters.termo.trim() !== '') {
        result = await searchCompaniesByFilters({ q: filters.termo.trim() });
      } else if (filters.categoria && filters.categoria !== 'todas') {
        result = await fetchEmpresasByCategoria(filters.categoria);
      } else if (filters.estado && filters.estado !== 'todos') {
        result = await fetchEmpresasByEstado(filters.estado);
      } else {
        await loadEmpresas();
        return;
      }

      setEmpresas(result);
    } catch (err) {
      console.error('Erro ao buscar empresas filtradas:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao aplicar filtros de busca. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Reseta todos os filtros e recarrega a lista original
  const handleClearFilters = () => {
    setSearchFormResetKey((prev) => prev + 1);
    if (searchParams.toString()) {
      setSearchParams({});
    } else {
      void loadEmpresas();
    }
  };

  const handleEmpresaClick = (empresaId: string, startedAt: number) => {
    navigate(`/empresa/${empresaId}`, { state: { companyTransition: { startedAt } } });
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
                <p className="mb-4 text-sm font-bold tracking-widest text-[var(--color-civix-gold)]">
                  REDE CIVIX / EMPRESAS
                </p>
                <h1
                  id="hero-title"
                  data-motion="page"
                  data-motion-trigger="mount"
                  className="max-w-[643px] font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,4rem)] font-bold uppercase leading-[1.1] tracking-normal lg:w-[643px] lg:text-[64px] lg:leading-[72px]"
                >
                  <span className="lg:block lg:whitespace-nowrap">
                    EMPRESAS PARCEIRAS DA
                  </span>{' '}
                  <span className="lg:block lg:whitespace-nowrap text-[var(--color-civix-gold)]">
                    CONSTRUÇÃO CIVIL
                  </span>
                </h1>
                <p
                  data-motion="page"
                  data-motion-trigger="mount"
                  data-motion-delay="60"
                  className="mt-6 max-w-[511px] font-[family-name:var(--font-body)] text-base font-medium leading-[normal] text-[var(--color-civix-ivory)]/90 sm:text-lg lg:mt-6 lg:w-[511px]"
                >
                  Encontre profissionais e fornecedores verificados, prontos para o seu
                  próximo projeto.
                </p>
              </div>
            </div>

            <div
              className="relative z-20 mx-4 -mt-8 rounded-[var(--radius-search)] bg-[var(--color-civix-ivory)] p-6 shadow-[0_34px_26px_rgba(13,10,44,0.25),0_12px_34px_rgba(13,10,44,0.25),0_4px_4px_rgba(0,0,0,0.25)] sm:mx-8 sm:p-8 lg:absolute lg:left-[17.875%] lg:top-[525px] lg:mx-0 lg:mt-0 lg:min-h-[142px] lg:w-[69%] lg:px-10 lg:py-[45px]"
              data-testid="hero-search-card"
            >
              <SearchForm
                key={`${searchFormResetKey}-${initialQuery}-${initialUf}-${initialPriceRange}`}
                initialValues={{
                  query: initialQuery,
                  region: initialUf,
                  priceRange: initialPriceRange,
                }}
                onSubmit={handleSearchFormSubmit}
                onSearch={handleSearch}
              />
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-16 px-6 sm:px-10 lg:px-16 xl:px-32 max-w-[1728px] mx-auto">
          <div
            data-motion="section"
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-gray-200 pb-6"
          >
            <div>
              <p className="text-sm font-bold text-gray-400 tracking-wider mb-2">
                EXPLORAR A REDE
              </p>
              <h2
                aria-live="polite"
                aria-atomic="true"
                className="text-3xl font-[family-name:var(--font-display)] font-semibold text-[var(--color-civix-navy)]"
              >
                {loading
                  ? 'Buscando empresas...'
                  : `${empresas.length} ${empresas.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}`}
              </h2>
            </div>
            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-[var(--color-civix-navy)] font-medium text-sm transition-colors mt-4 md:mt-0 flex items-center gap-1 cursor-pointer"
              >
                Limpar filtros <span className="text-lg leading-none">&times;</span>
              </button>
            )}
          </div>

          {loading && (
            <div
              role="status"
              aria-label="Carregando empresas"
              className="flex justify-center items-center py-20"
            >
              <div className="animate-spin motion-reduce:animate-none rounded-full h-12 w-12 border-b-2 border-[var(--color-civix-navy)]"></div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              data-motion="feedback"
              data-motion-trigger="mount"
              className="bg-red-50 text-red-600 p-6 rounded-lg text-center font-medium"
            >
              {error}
            </div>
          )}

          {!loading && !error && empresas.length === 0 && (
            <div
              role="status"
              data-motion="feedback"
              data-motion-trigger="mount"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <SearchX className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhuma empresa encontrada
              </h3>
              <p className="text-gray-500 max-w-md mb-6">
                Não encontramos nenhuma empresa com os critérios selecionados. Tente
                buscar por outros termos ou categorias.
              </p>
              {isFiltered && (
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-[var(--color-civix-navy)] text-white rounded-lg hover:bg-[var(--color-civix-navy)]/90 transition-colors font-medium text-sm"
                >
                  Ver todas as empresas
                </button>
              )}
            </div>
          )}

          {!loading && !error && empresas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {empresas.map((empresa) => (
                <article
                  data-motion="item"
                  data-motion-step="50"
                  key={empresa.id}
                  onClick={() => handleEmpresaClick(empresa.id, Date.now())}
                  className="group active:scale-[0.985] motion-reduce:active:scale-100 bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full"
                >
                  {/* Card Header Pattern/Color */}
                  <div
                    className={`h-32 p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ${
                      empresa.tone === 'blue'
                        ? 'from-blue-50 to-blue-100'
                        : empresa.tone === 'green'
                          ? 'from-green-50 to-green-100'
                          : empresa.tone === 'orange'
                            ? 'from-orange-50 to-orange-100'
                            : empresa.tone === 'purple'
                              ? 'from-purple-50 to-purple-100'
                              : 'from-gray-50 to-gray-100'
                    }`}
                  >
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

                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {empresa.descricao}
                    </p>

                    <div className="mt-auto">
                      <p className="flex items-center text-sm text-gray-500 mb-4">
                        <MapPin
                          size={16}
                          className="mr-1 text-[var(--color-civix-gold)] flex-shrink-0"
                        />
                        {empresa.cidade}, {empresa.estado}
                      </p>
                      <div className="flex items-center text-sm font-semibold text-[var(--color-civix-navy)] group-hover:text-[var(--color-civix-gold)] transition-colors">
                        Ver perfil{' '}
                        <span className="ml-1 group-hover:translate-x-1 transition-transform">
                          &rarr;
                        </span>
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
  );
}
