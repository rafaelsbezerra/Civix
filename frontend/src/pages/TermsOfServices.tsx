import React from 'react';
import { FileText, UserCheck, Scale, AlertTriangle, Lock } from 'lucide-react';

import { SiteHeader } from '@/components/layout/SiteHeader';

export const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#071b2b] flex flex-col justify-between font-sans">
      <SiteHeader />

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-10">
          <div
            data-motion="item"
            data-motion-trigger="mount"
            className="border-b border-gray-100 pb-6 mb-8"
          >
            <h2 className="text-3xl font-extrabold text-[#071b2b] mb-2">
              Termos e Condições de Uso
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Última atualização: Setembro de 2026 &bull; Versão 1.0
            </p>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed text-sm sm:text-base">
            {/* Qualificação das Partes */}
            <section className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs sm:text-sm text-gray-600">
              <p>
                Este Termo de Uso regula a utilização da plataforma tecnológica{' '}
                <strong>CIVIX</strong>, disponibilizada e mantida por{' '}
                <strong>[NOME DA RAZÃO SOCIAL OU EMPRESA]</strong>, inscrita no CNPJ/MF
                sob o nº <strong>[00.000.000/0001-00]</strong>, doravante denominada
                simplesmente <strong>"CIVIX"</strong>.
              </p>
            </section>

            <section className="flex gap-4 items-start">
              <FileText className="text-[#071b2b] shrink-0 mt-1" size={22} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#071b2b] mb-2">
                  1. Objeto e Escopo dos Serviços
                </h3>
                <p>
                  A plataforma CIVIX consiste em um software como serviço (SaaS) voltado
                  para a gestão e intermediação de processos na construção civil,
                  conectando construtoras, empresas do setor, fornecedores e clientes
                  finais. O acesso e uso de qualquer funcionalidade implica a aceitação
                  plena e sem reservas destes Termos.
                </p>
              </div>
            </section>

            <section className="flex gap-4 items-start">
              <UserCheck className="text-[#071b2b] shrink-0 mt-1" size={22} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#071b2b] mb-2">
                  2. Cadastro, Acesso e Credenciais
                </h3>
                <p className="mb-2">
                  O acesso às áreas restritas do sistema ocorre mediante convite prévio
                  ou cadastro validado.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>
                    O Usuário compromete-se a fornecer informações exatas, atualizadas e
                    completas.
                  </li>
                  <li>
                    O uso das credenciais (login e senha) é pessoal e intransferível,
                    cabendo ao Usuário total responsabilidade pelo sigilo das mesmas.
                  </li>
                  <li>
                    A CIVIX reserva-se o direito de suspender ou cancelar contas que
                    apresentem indícios de fraude ou violação dos presentes termos.
                  </li>
                </ul>
              </div>
            </section>

            <section className="flex gap-4 items-start">
              <Lock className="text-[#071b2b] shrink-0 mt-1" size={22} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#071b2b] mb-2">
                  3. Direitos de Propriedade Intelectual
                </h3>
                <p>
                  Todos os direitos relativos à marca CIVIX, software, código-fonte,
                  layout, banco de dados, marcas e demais conteúdos são de propriedade
                  exclusiva de <strong>[NOME DA RAZÃO SOCIAL]</strong> (CNPJ{' '}
                  <strong>[00.000.000/0001-00]</strong>). É proibida qualquer
                  reprodução, engenharia reversa ou exploração não autorizada.
                </p>
              </div>
            </section>

            <section className="flex gap-4 items-start">
              <AlertTriangle className="text-[#071b2b] shrink-0 mt-1" size={22} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#071b2b] mb-2">
                  4. Limitações de Responsabilidade
                </h3>
                <p>
                  A CIVIX emprega os melhores esforços técnicos para assegurar a
                  disponibilidade contínua do sistema, todavia:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                  <li>
                    Não se responsabiliza por indisponibilidades temporárias decorrentes
                    de falhas de infraestrutura de terceiros, ataques cibernéticos ou
                    força maior.
                  </li>
                  <li>
                    Não responde pela veracidade técnica ou qualidade dos serviços
                    negociados diretamente entre empresas e clientes cadastrados na
                    plataforma.
                  </li>
                </ul>
              </div>
            </section>

            <section className="flex gap-4 items-start">
              <Scale className="text-[#071b2b] shrink-0 mt-1" size={22} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#071b2b] mb-2">
                  5. Disposições Gerais e Foro
                </h3>
                <p>
                  Estes Termos serão regidos e interpretados segundo as leis da
                  República Federativa do Brasil. Para dirimir eventuais controvérsias
                  oriundas deste documento, fica eleito o Foro da Comarca de{' '}
                  <strong>[CIDADE/ESTADO]</strong>, com renúncia expressa a qualquer
                  outro, por mais privilegiado que seja.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer / Rodapé Formal */}
      <footer className="bg-[#071b2b] border-t border-gray-200 py-6 text-center text-xs text-white">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p>
            <strong>CIVIX</strong> &bull; [NOME DA RAZÃO SOCIAL] &bull; CNPJ
            [00.000.000/0001-00]
          </p>
          <p>&copy; 2026 Civix - Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
