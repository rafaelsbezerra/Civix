import { useState } from 'react';
import {
    HelpCircle,
    UserCheck,
    Building2,
    FileText,
    MessageSquare,
    ChevronRight,
    Mail,
    ShieldCheck,
    Plus,
    Minus
} from 'lucide-react';

import { SiteHeader } from '@/components/layout/SiteHeader';
import decorativeShape from "@/assets/civix/decorative-shape.svg";
import heroArtwork from "@/assets/civix/hero-artwork.svg";

interface FAQItem {
    question: string
    answer: string
}

export default function HelpCenter() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    const categories = [
        {
            icon: <UserCheck className="w-6 h-6 [#0b1825]" />,
            title: 'Para Construtores',
            description: 'Como cadastrar obras, solicitar orçamentos e gerenciar fornecedores homologados.',
            articlesCount: 12,
            link: '#construtores'
        },
        {
            icon: <Building2 className="w-6 h-6 [#0b1825]" />,
            title: 'Para Fornecedores',
            description: 'Gestão de perfil, envio de propostas, qualificação e suporte a convites.',
            articlesCount: 15,
            link: '#fornecedores'
        },
        {
            icon: <FileText className="w-6 h-6 [#0b1825]" />,
            title: 'Contratos e Cotações',
            description: 'Regras para emissão de pedidos, negociação direta e conformidade legal.',
            articlesCount: 9,
            link: '#cotacoes'
        },
        {
            icon: <ShieldCheck className="w-6 h-6 [#0b1825]" />,
            title: 'Conta e Segurança',
            description: 'Alteração de acessos, permissões de membros da equipe e verificação CNPJ.',
            articlesCount: 8,
            link: '#conta'
        }
    ];

    const faqData: FAQItem[] = [
        {
            question: 'Como faço o meu primeiro acesso na plataforma Civix?',
            answer:
                'Você receberá um convite por e-mail com um link de ativação. Basta clicar no botão indicado no e-mail para cadastrar a sua senha e acessar a plataforma.',
        },
        {
            question: 'Como posso redefinir a minha senha?',
            answer:
                'Na tela de login, clique em "Esqueceu sua senha?". Digite o e-mail cadastrado na plataforma para receber as instruções e o link de redefinição.',
        },
        {
            question: 'O link do convite de acesso expirou, o que fazer?',
            answer:
                'Por motivos de segurança, os convites de primeiro acesso têm validade de 24 horas. Entre em contato com o administrador da sua organização para solicitar o reenvio do convite.',
        },
        {
            question: 'Como convidar novos membros para a minha empresa?',
            answer:
                'Acesse a área de gestão da sua organização na plataforma e utilize a opção "Enviar Convite". Insira o e-mail do colaborador e selecione o perfil de acesso desejado.',
        },
        {
            question: 'Os dados dos meus projetos estão protegidos?',
            answer:
                'Sim. O Civix utiliza criptografia de ponta a ponta nas comunicações (HTTPS/TLS) e armazenamento em nuvem seguro, em conformidade com a LGPD.',
        },
    ]

    return (
        <div className="min-h-screen text-slate-800 font-sans">
        <SiteHeader />
            {/* Header / Hero Section */}
            <section className=" text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" />

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
                  id="hero-title"
                  className="max-w-[643px] font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,4rem)] font-semibold uppercase leading-[1.1] tracking-[-0.02em] lg:w-[643px] lg:text-[64px] lg:leading-[80px] lg:tracking-[-0.034em]"
                >
                  <p className="text-[var(--color-civix-gold)] font-bold tracking-widest text-sm mb-4">REDE CIVIX / CENTRAL DE AJUDA</p>
                  <span className="lg:block lg:whitespace-nowrap">Como podemos ajudar <br></br> sua empresa hoje?</span>{' '}
                </h1>
                <p className="mt-10 max-w-[511px] font-[family-name:var(--font-body)] text-base font-normal leading-[normal] text-[var(--color-civix-ivory)]/90 sm:text-lg lg:absolute lg:left-0 lg:top-[164px] lg:mt-0 lg:w-[511px] lg:leading-[20.6667px]">
                  Pesquise por soluções rápidas sobre convites, gestão, senhas e parcerias.
                </p>
              </div>
            </div>
          </div>
            </section>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Categories Grid */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-900">Navegue por Categoria</h2>
                    <div className="grid grid-cols-1 mt-6 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((cat, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="p-3 bg-blue-50 rounded-lg w-fit mb-4">
                                        {cat.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{cat.title}</h3>
                                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">{cat.description}</p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
                                    <span>{cat.articlesCount} artigos</span>
                                    <ChevronRight className="w-4 h-4 #0b1825 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Popular Articles */}
                <div className="w-full max-w-4xl mx-auto mb-16">
                    <div className="bg-white rounded-xl p-6 border border-slate-200">
                        <div className="flex items-center space-x-2 mb-6">
                            <span className="text-[var(--color-civix-gold-accessible)]">//</span>{' '}
                            <h2 className="text-xl font-bold text-slate-900">Artigos Mais Acessados</h2>
                        </div>
                        {/* Lista Accordion */}
                        <div className="space-y-3">
                            {faqData.map((item, index) => {
                                const isOpen = openIndex === index
                                return (
                                    <div
                                        key={index}
                                        className={`rounded-xl transition-all duration-300 overflow-hidden ${isOpen
                                            ? 'bg-[#98a1a8] text-[#071b2b]'
                                            : 'bg-[#eeeeed] hover:bg-[#e7e6e4] text-[#071b2b]'
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleFAQ(index)}
                                            className="w-full py-4 px-6 flex items-center justify-between text-left font-semibold text-base md:text-lg focus:outline-none"
                                        >
                                            <span>{item.question}</span>
                                            <div
                                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${isOpen
                                                    ? 'bg-[#071b2b] text-white'
                                                    : 'bg-[#e0dfdc] text-[#071b2b]'
                                                    }`}
                                            >
                                                {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="px-6 pb-5 text-sm md:text-base leading-relaxed text-[#071b2b]/90 border-t border-black/5 pt-2">
                                                {item.answer}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Contact Support Section */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center max-w-4xl mx-auto">
                    <HelpCircle className="w-12 h-12 #0b1825 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Ainda precisa de ajuda?</h2>
                    <p className="text-slate-600 mb-8 max-w-xl mx-auto text-sm sm:text-base">
                        Nossa equipe especializada está pronta para atender você.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="mailto:suporte@civix.com.br"
                            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold text-sm"
                        >
                            <Mail className="w-4 h-4 text-slate-500" />
                            <span>Enviar e-mail</span>
                        </a>
                        <a
                            href="#"
                            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-[#0b1825] rounded-lg text-white font-semibold text-sm"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span>Falar pelo Chat</span>
                        </a>
                    </div>
                </div>
            </main>

            {/* Footer Simple */}
            <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
                <p>© {new Date().getFullYear()} CIVIX. Conectando Construtores e Fornecedores.</p>
            </footer>
        </div>
    );
}