import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { requestPasswordReset } from '@/lib/api';

import civixLogo from '../assets/civix/logoCivix.png';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor, digite seu e-mail.');
      return;
    }

    try {
      setLoading(true);

      await requestPasswordReset(email);

      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao enviar o e-mail de recuperação.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#faf9f7] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={civixLogo} alt="Civix" className="h-10 w-auto" />
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {submitted ? (
            /* Confirmando Envio */
            <div className="text-center py-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-[#071b2b] mb-2">
                E-mail Enviado!
              </h2>
              <p className="text-xs text-[#626262] leading-relaxed mb-6">
                Se a conta <strong>{email}</strong> existir no sistema, você receberá um
                e-mail com instruções para redefinir sua senha.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded-lg bg-[#061c2c] text-white text-xs font-semibold hover:bg-[#0b293d] transition"
              >
                Voltar para o Login
              </button>
            </div>
          ) : (
            /* Form de Solicitação */
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#071b2b] mb-1">
                  Recuperar Senha
                </h1>
                <p className="text-xs text-[#737373]">
                  Informe seu e-mail para receber o link de redefinição
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#737373] mb-1.5 font-semibold">
                    E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      required
                      className="w-full h-11 rounded-lg bg-[#f3f3f3] px-3 pr-10 text-xs text-[#222] outline-none focus:ring-1 focus:ring-[#0b2030] transition"
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] w-4 h-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-[#061c2c] hover:bg-[#0b293d] transition text-white font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Enviando...
                    </div>
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#071b2b] transition font-medium"
                >
                  <ArrowLeft size={14} />
                  Voltar para a tela de login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
