import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEmpresaById } from '@/lib/api';
import type { Empresa } from '@/lib/api';
import { SiteHeader } from '@/components/layout/SiteHeader';
import Footer from '@/components/layout/SiteFooter';
import { MapPin, Phone, LayoutGrid, Briefcase, ExternalLink, MessageCircle } from 'lucide-react';
import decorativeShape from "@/assets/civix/decorative-shape.svg";
import heroArtwork from "@/assets/civix/hero-artwork.svg";

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
        setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes da empresa. Tente novamente mais tarde.');
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
        <Footer />
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
        <Footer />
      </div>
    );
  }

  const textoDescricaoDetalhada = empresa.descricao_detalhada || empresa.descricao || '';

  return (
    <div className="min-h-screen bg-[var(--color-civix-ivory)] flex flex-col font-[family-name:var(--font-body)]">
      <SiteHeader />

      <main className="flex-1">
        {/* Profile Hero */}
        <section className="px-4 pb-12 sm:px-8 lg:px-16">
          <div
            className="relative mx-auto w-full max-w-[1600px] overflow-hidden rounded-[var(--radius-hero)] bg-[var(--color-civix-navy)]"
            data-testid="hero-surface"
          >
            <img
              aria-hidden="true"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              height="900"
              src={heroArtwork}
              width="1600"
            />
            <img
              aria-hidden="true"
              alt=""
              className="absolute -left-20 -top-24 w-[320px] opacity-80 sm:-left-16 sm:-top-32 sm:w-[432px]"
              height="432"
              src={decorativeShape}
              width="432"
            />

            <div className="relative z-10 flex min-h-[600px] flex-col justify-center gap-12 px-6 py-16 text-[var(--color-civix-ivory)] sm:px-10 lg:flex-row lg:items-start lg:justify-between lg:px-16 lg:py-16 xl:px-24">
              <div className="min-w-0 max-w-3xl">
                <p className="mb-4 flex items-center gap-2 text-sm font-bold tracking-widest text-[var(--color-civix-gold)]">
                  {empresa.verificado ? (
                    <span
                      aria-hidden="true"
                      className="inline-block size-2 rounded-full bg-[var(--color-civix-gold)]"
                    />
                  ) : null}
                  {empresa.verificado ? 'PERFIL VERIFICADO / CIVIX' : 'PERFIL / CIVIX'}
                </p>

                <h1 className="max-w-[643px] break-words font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,4rem)] font-semibold uppercase leading-[1.1] tracking-[-0.02em] lg:leading-[80px] lg:tracking-[-0.034em]">
                  {empresa.nome}
                </h1>

                <p className="mt-2 text-xl italic text-[var(--color-civix-ivory)]/70 md:text-2xl">
                  {empresa.categoria?.toUpperCase()}
                </p>
                {empresa.descritivo ? (
                  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-civix-ivory)]/90">
                    {empresa.descritivo}
                  </p>
                ) : null}

                <div className="mt-10 flex flex-wrap gap-4">
                  {empresa.website ? (
                    <a
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-civix-ivory)]/30 bg-transparent px-6 py-3 font-semibold text-[var(--color-civix-ivory)] transition-colors hover:border-[var(--color-civix-ivory)] hover:bg-white/10"
                      href={empresa.website}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink aria-hidden="true" size={20} />
                      Visitar site
                    </a>
                  ) : null}
                  {empresa.whatsapp ? (
                    <a
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1FBC59] px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-[#20bd5a]"
                      href={`https://wa.me/${empresa.whatsapp.replace(/[^\d]/g, '')}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <MessageCircle aria-hidden="true" size={20} />
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="grid h-fit w-full shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:w-[500px]">
                <div className="rounded-xl border border-[#425466] bg-[#faf9f6] p-5 text-[var(--color-civix-navy)]">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#f3e6c9]">
                    <MapPin aria-hidden="true" className="text-[var(--color-civix-gold)]" size={20} />
                  </div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#5f6b75]">Localização</p>
                  <p className="break-words text-base font-medium">{empresa.cidade}, {empresa.estado}</p>
                </div>

                <div className="rounded-xl border border-[#dfe3e5] bg-[#faf9f6] p-5 text-[var(--color-civix-navy)]">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#f3e6c9]">
                    <Phone aria-hidden="true" className="text-[var(--color-civix-gold)]" size={20} />
                  </div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#5f6b75]">Telefone</p>
                  <p className="break-words text-base font-medium">{empresa.telefone || 'Não informado'}</p>
                </div>

                <div className="rounded-xl border border-[#dfe3e5] bg-[#faf9f6] p-5 text-[var(--color-civix-navy)]">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#f3e6c9]">
                    <LayoutGrid aria-hidden="true" className="text-[var(--color-civix-gold)]" size={20} />
                  </div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#5f6b75]">Segmento</p>
                  <p className="break-words text-base font-medium">{empresa.categoria}</p>
                </div>

                <div className="rounded-xl border border-[#dfe3e5] bg-[#faf9f6] p-5 text-[var(--color-civix-navy)]">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#f3e6c9]">
                    <Briefcase aria-hidden="true" className="text-[var(--color-civix-gold)]" size={20} />
                  </div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#5f6b75]">Porte</p>
                  <p className="text-base font-medium capitalize">{empresa.tamanho}</p>
                </div>
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
              {textoDescricaoDetalhada.split('\n').map((paragraph: string, index: number) => (
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

      <Footer />
    </div>
  );
}