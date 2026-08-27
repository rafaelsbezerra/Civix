import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import ctaContainer from "@/assets/civix/ctaconhtainer.png"
import { ActionButton } from '@/components/ui/ActionButton'
interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: 'Como funciona a CIVIX?',
    answer:
      'A CIVIX é uma plataforma inteligente que conecta prestadores de serviços, construtores e clientes finais no mercado da construção civil. Facilitamos a descoberta de parceiros qualificados, contratação segura, gestão de planos e fechamento de novos negócios em um único ambiente moderno e integrado.',
  },
  {
    question: 'Como cadastrar minha empresa?',
    answer:
      'Para cadastrar sua empresa, basta clicar no botão de cadastro no topo da página, escolher o plano ideal para o seu perfil e preencher os dados organizacionais solicitados.',
  },
  {
    question: 'Como os clientes encontram minha empresa?',
    answer:
      'Sua empresa é exibida no catálogo da CIVIX de acordo com suas especialidades, localização e avaliações, permitindo que clientes qualificados encontrem seus serviços diretamente.',
  },
  {
    question: 'Posso cancelar meu plano a qualquer momento?',
    answer:
      'Sim, você pode gerenciar ou cancelar sua assinatura a qualquer momento através do seu painel administrativo sem multa de fidelidade.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer:
      'Aceitamos cartão de crédito, PIX e boleto bancário para os planos de assinatura e serviços da plataforma.',
  },
  {
    question: 'Como entrar em contato com o suporte?',
    answer:
      'Nosso time de suporte está disponível via chat diretamente na plataforma ou através do canal de atendimento via e-mail e WhatsApp comercial.',
  },
  {
    question: 'Quanto tempo leva para minha empresa aparecer na plataforma?',
    answer:
      'Logo após a validação dos dados cadastrais e a escolha do plano, seu perfil é ativado e fica visível imediatamente.',
  },
  {
    question: 'A CIVIX oferece suporte para marketing?',
    answer:
      'Sim! Dependendo do seu plano, auxiliamos na otimização da vitrine do seu negócio para impulsionar sua visibilidade na região.',
  },
]

export default function FAQSection() {
  // Define o índice 0 (primeira pergunta) aberto por padrão como no layout
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="flex w-full flex-col items-center bg-[#f8f7f5] px-4 py-16 sm:px-8 lg:px-16" id='faq'>
      <div className="max-w-3xl w-full">
        {/* Subtítulo e Título */}
        <div className="text-center mb-10">

          <p
            className="font-[family-name:var(--font-display)] text-base font-medium leading-[normal] text-[var(--color-civix-navy)]"
            data-testid="about-marker"
          >
            <span className="text-[var(--color-civix-gold-accessible)]">//</span>{' '}
            <span>Perguntas frequentes</span>
          </p>

          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-medium text-[#071b2b] mt-3 leading-tight">
            Possui perguntas? <br />
            Nós temos as respostas
          </h2>
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

      {/* Banner CTA com a mesma largura máxima do Hero */}
      <div className="relative mx-auto mt-16 flex min-h-[360px] w-full max-w-[1600px] items-center justify-center overflow-hidden rounded-[var(--radius-hero)] sm:min-h-[430px] lg:min-h-[530px]">
        <img
          src={ctaContainer}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="relative z-10 flex w-full flex-col items-center px-6 py-16 text-center text-[var(--color-civix-ivory)] sm:px-12">
          <h3 className="mx-auto max-w-[1000px] font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
            Preparado para transformar o atendimento da sua empresa?
          </h3>
          <ActionButton
            href='#'
            variant='yellow'
            className='mt-10'
          >

            Contato

          </ActionButton>
        </div>
      </div>
    </section>
  )
}
