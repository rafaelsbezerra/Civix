import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionButton } from '@/components/ui/ActionButton'
import { fetchEmpresas } from '@/lib/api'
import type { Empresa } from '@/lib/api'
import { MapPin, SearchX, Loader2 } from 'lucide-react'

function BuildingMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="w-8 h-8 text-[var(--color-civix-gold)]">
      <path d="M10 40V15l14-7 14 7v25" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 40h34M17 21h4M27 21h4M17 28h4M27 28h4M21 40V34h6v6" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function CatalogoEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const data = await fetchEmpresas()
        
        if (isMounted) {
          // Exibe apenas as primeiras 6 empresas na Home
          setEmpresas(data.slice(0, 6))
          setError(null)
        }
      } catch (err) {
        console.error('Erro ao carregar empresas para a home:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar lista de empresas.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleEmpresaClick = (id: string, startedAt: number) => {
    navigate(`/empresa/${id}`, { state: { companyTransition: { startedAt } } })
  }

  return (
    <section className="py-16 px-6 sm:px-10 lg:px-16 xl:px-32 max-w-[1728px] mx-auto" id="empresas">
      {/* Cabeçalho da Seção */}
      <div data-motion="section" className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-gray-200 pb-6 gap-4">
        <div>
          <p className="font-[family-name:var(--font-display)] text-base font-medium leading-normal text-[var(--color-civix-navy)]">
            <span className="text-[var(--color-civix-gold-accessible)]">//</span>{' '}
            <span>Empresas</span>
          </p>
          <h2 className="mt-3 max-w-[760px] font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] text-[var(--color-civix-navy)]">
            Empresas que constroem o futuro com a gente.
          </h2>
        </div>
        <ActionButton href="/catalogo" showArrow variant="primary">
          Ver todas
        </ActionButton>
      </div>

      {/* Estado de Carregamento */}
      {loading && (
        <div role="status" className="flex justify-center items-center py-20 text-gray-500 gap-2">
          <Loader2 className="animate-spin motion-reduce:animate-none w-6 h-6 text-[var(--color-civix-navy)]" />
          <span>Carregando empresas...</span>
        </div>
      )}

      {/* Estado de Erro */}
      {error && (
        <div role="alert" data-motion="feedback" data-motion-trigger="mount" className="p-6 rounded-lg bg-red-50 text-red-600 font-medium text-center my-8 border border-red-200">
          {error}
        </div>
      )}

      {/* Estado Sem Registros */}
      {!loading && !error && empresas.length === 0 && (
        <div role="status" data-motion="feedback" data-motion-trigger="mount" className="flex flex-col items-center justify-center py-16 text-center">
          <SearchX className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma empresa encontrada</h3>
          <p className="text-gray-500 max-w-md">
            Não há empresas disponíveis para exibição no momento.
          </p>
        </div>
      )}

      {/* Grid de Cards de Empresas */}
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
              {/* Topo / Pattern do Card */}
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

              {/* Conteúdo do Card */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-semibold text-[var(--color-civix-navy)] mb-3 group-hover:text-[var(--color-civix-gold)] transition-colors">
                  {empresa.nome}
                </h3>

                {empresa.descricao && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {empresa.descricao}
                  </p>
                )}

                <div className="mt-auto">
                  <p className="flex items-center text-sm text-gray-500 mb-4">
                    <MapPin size={16} className="mr-1 text-[var(--color-civix-gold)] flex-shrink-0" />
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
  )
}