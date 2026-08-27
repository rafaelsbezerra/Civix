import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEmpresaById } from '@/lib/api';
import type { Empresa } from '@/lib/api';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { MapPin, Phone, LayoutGrid, Briefcase, ExternalLink, MessageCircle } from 'lucide-react';

export default function PerfilEmpresa() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmpresa = async () => {
      if (!id) {
        setError('ID da empresa não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchEmpresaById(id);
        setEmpresa(data);
      } catch (err) {
        console.error('Erro ao carregar empresa:', err);
        setError('Erro ao carregar detalhes da empresa. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadEmpresa();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-civix-ivory)] flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-civix-navy)]"></div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error || !empresa) {
    return (
      <div className="min-h-screen bg-[var(--color-civix-ivory)] flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex flex-col justify-center items-center p-6 text-center">
          <p className="text-red-500 font-semibold text-lg mb-4">{error || 'Empresa não encontrada'}</p>
          <button
            className="bg-[var(--color-civix-navy)] text-white px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
            onClick={() => navigate('/catalogo')}
          >
            Voltar ao Catálogo
          </button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-civix-ivory)] flex flex-col font-[family-name:var(--font-body)]">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Profile Hero */}
        <section className="relative bg-[var(--color-civix-navy)] text-[var(--color-civix-ivory)] pt-20 pb-32 px-6 sm:px-10 lg:px-16 xl:px-32 overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          <div className="relative z-10 max-w-[1728px] mx-auto flex flex-col lg:flex-row gap-12 justify-between">
            <div className="max-w-3xl">
              <p className="text-[var(--color-civix-gold)] font-bold tracking-widest text-sm mb-4 flex items-center gap-2">
                {empresa.verificado && <span className="w-2 h-2 rounded-full bg-[var(--color-civix-gold)] inline-block"></span>}
                {empresa.verificado ? 'PERFIL VERIFICADO / CIVIX' : 'PERFIL / CIVIX'}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-display)] font-semibold mb-2">
                {empresa.nome}
              </h1>
              <p className="text-xl md:text-2xl text-[var(--color-civix-ivory)]/70 italic mb-6">
                {empresa.categoria}
              </p>
              <p className="text-lg text-[var(--color-civix-ivory)]/90 mb-10 leading-relaxed">
                {empresa.descritivo}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-[#25D366]/20"
                  onClick={() => {
                    if (empresa.whatsapp) {
                      const telefone = empresa.whatsapp.replace(/[^\d]/g, '');
                      window.open(`https://wa.me/${telefone}`, '_blank');
                    }
                  }}
                >
                  <MessageCircle size={20} /> Whatsapp
                </button>
                <button
                  className="bg-transparent border border-[var(--color-civix-ivory)]/30 hover:border-[var(--color-civix-ivory)] text-[var(--color-civix-ivory)] px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                  onClick={() => {
                    if (empresa.website) {
                      window.open(empresa.website, '_blank');
                    }
                  }}
                >
                  <ExternalLink size={20} /> Visitar site
                </button>
              </div>
            </div>
            
            {/* Info Panel Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:w-[500px] shrink-0 h-fit">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-civix-gold)]/20 flex items-center justify-center mb-3">
                  <MapPin className="text-[var(--color-civix-gold)]" size={20} />
                </div>
                <p className="text-xs text-[var(--color-civix-ivory)]/60 font-semibold tracking-wider uppercase mb-1">Localização</p>
                <p className="text-base font-medium">{empresa.cidade}, {empresa.estado}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-civix-gold)]/20 flex items-center justify-center mb-3">
                  <Phone className="text-[var(--color-civix-gold)]" size={20} />
                </div>
                <p className="text-xs text-[var(--color-civix-ivory)]/60 font-semibold tracking-wider uppercase mb-1">Telefone</p>
                <p className="text-base font-medium">{empresa.telefone || 'Não informado'}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-civix-gold)]/20 flex items-center justify-center mb-3">
                  <LayoutGrid className="text-[var(--color-civix-gold)]" size={20} />
                </div>
                <p className="text-xs text-[var(--color-civix-ivory)]/60 font-semibold tracking-wider uppercase mb-1">Segmento</p>
                <p className="text-base font-medium">{empresa.categoria}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-civix-gold)]/20 flex items-center justify-center mb-3">
                  <Briefcase className="text-[var(--color-civix-gold)]" size={20} />
                </div>
                <p className="text-xs text-[var(--color-civix-ivory)]/60 font-semibold tracking-wider uppercase mb-1">Porte</p>
                <p className="text-base font-medium capitalize">{empresa.tamanho}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20 px-6 sm:px-10 lg:px-16 xl:px-32 max-w-[1728px] mx-auto -mt-10 relative z-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 max-w-5xl">
            <p className="text-sm font-bold text-gray-400 tracking-wider mb-2">SOBRE A EMPRESA</p>
            <h2 className="text-3xl font-[family-name:var(--font-display)] font-semibold text-[var(--color-civix-navy)] mb-8">
              Quem é {empresa.nome}?
            </h2>
            <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
              {empresa.descricaoDetalhada.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 text-center">
          <button
            className="text-[var(--color-civix-navy)] font-semibold hover:text-[var(--color-civix-gold)] transition-colors flex items-center justify-center gap-2 mx-auto"
            onClick={() => navigate('/catalogo')}
          >
            <span>&larr;</span> Voltar ao Catálogo
          </button>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}