import React from 'react';
import { Eye, Server, Lock, UserCheck, Mail } from 'lucide-react';

import { SiteHeader } from '@/components/layout/SiteHeader';

export const PrivacyPolicy: React.FC = () => {
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
              Política de Privacidade
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Conforme a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)
              &bull; Atualizado em Setembro de 2026
            </p>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed text-sm sm:text-base">
            {/* Qualificação do Controlador */}
            <section className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs sm:text-sm text-gray-600">
              <p>
                A empresa <strong>[NOME DA RAZÃO SOCIAL]</strong>, inscrita no CNPJ/MF
                sob o nº <strong>[00.000.000/0001-00]</strong>, atuando como
                Controladora de Dados Pessoais da plataforma <strong>CIVIX</strong>,
                reafirma o seu compromisso com a privacidade, proteção e transparência
                no tratamento dos seus dados.
              </p>
            </section>

            <section className="flex gap-4 items-start">
              <Eye className="text-[#071b2b] shrink-0 mt-1" size={22} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#071b2b] mb-2">
                  1. Coleta e Categorias de Dados Tratados
                </h3>
                <p className="mb-2">
                  Tratamos apenas os dados pessoais estritamente necessários para a
                  operacionalização dos nossos serviços SaaS:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>
                    <strong>Dados Cadastrais:</strong> Nome completo, endereço de e-mail
                    corporativo ou pessoal, telefone e perfil de acesso.
                  </li>
                  <li>
                    <strong>Dados Empresariais:</strong> Razão Social, CNPJ e dados de
                    identificação da organização contratante.
                  </li>
                  <li>
                    <strong>Dados de Registro e Acesso:</strong> Endereço IP, data e
                    hora de acesso e logs de interações no sistema.
                  </li>
                </ul>
              </div>
            </section>

            <section className="flex gap-4 items-start">
              <Server className="text-[#071b2b] shrink-0 mt-1" size={22} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#071b2b] mb-2">
                  2. Finalidade e Bases Legais do Tratamento
                </h3>
                <p>
                  O tratamento de dados pessoais pela CIVIX fundamenta-se nas seguintes
                  hipóteses legais da LGPD:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                  <li>
                    <strong>Execução de Contrato:</strong> Para autenticação de
                    usuários, envio de e-mails transacionais (convites, redefinição de
                    senha) e gestão de acessos.
                  </li>
                  <li>
                    <strong>Legítimo Interesse:</strong> Para aprimoramento da segurança
                    da informação e prevenção contra fraudes.
                  </li>
                  <li>
                    <strong>Cumprimento de Obrigação Legal:</strong> Para armazenamento
                    de logs de acesso conforme exigido pelo Marco Civil da Internet.
                  </li>
                </ul>
              </div>
            </section>

            <section className="flex gap-4 items-start">
              <Lock className="text-[#071b2b] shrink-0 mt-1" size={22} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#071b2b] mb-2">
                  3. Compartilhamento e Armazenamento Seguro
                </h3>
                <p>
                  Não comercializamos dados pessoais sob qualquer hipótese. O
                  compartilhamento ocorre estritamente com fornecedores de
                  infraestrutura essencial (como servidores em nuvem resilientes e
                  gateway de envio de e-mails de transação), mantendo padrões de
                  criptografia ponta a ponta (SSL/TLS).
                </p>
              </div>
            </section>

            <section className="flex gap-4 items-start">
              <UserCheck className="text-[#071b2b] shrink-0 mt-1" size={22} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#071b2b] mb-2">
                  4. Direitos do Titular dos Dados
                </h3>
                <p>
                  Nos termos do art. 18 da LGPD, o Titular possui o direito de solicitar
                  a confirmação, acesso, correção ou eliminação dos seus dados tratados
                  na plataforma CIVIX a qualquer momento.
                </p>
              </div>
            </section>

            <section className="flex gap-4 items-start">
              <Mail className="text-[#071b2b] shrink-0 mt-1" size={22} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#071b2b] mb-2">
                  5. Contato do Encarregado de Dados (DPO)
                </h3>
                <p>
                  Para exercer seus direitos de titular ou esclarecer dúvidas sobre esta
                  Política, entre em contato com nosso Encarregado pelo e-mail:{' '}
                  <strong>privacidade@civix.com.br</strong> (ou via e-mail corporativo
                  cadastrado na conta).
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

export default PrivacyPolicy;
