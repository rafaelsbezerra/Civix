import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Lock, Loader2 } from "lucide-react";
import axios from "axios";

import civixLogo from "../assets/civix/logoCivix.png";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Captura o token passado na URL pelo link do e-mail
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token de redefinição ausente ou inválido.");
      return;
    }

    if (password.length < 8) {
      setError("A nova senha deve conter no mínimo 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      // Envia o token e a nova senha para o backend
      await api.post("/api/v1/users/redefinir-senha", {
        token,
        password,
      });

      setSuccess(true);

      // Redireciona para o login após 2.5 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error ||
            "Não foi possível redefinir a senha. O link pode ter expirado."
        );
      } else {
        setError("Ocorreu um erro inesperado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Estado caso o usuário acesse a página sem um token na URL
  if (!token) {
    return (
      <main className="w-full min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#071b2b] mb-2">Link Inválido</h2>
          <p className="text-xs text-[#626262] leading-relaxed mb-6">
            O token de redefinição de senha não foi encontrado. Solicite um novo link na tela de recuperação.
          </p>
          <button
            onClick={() => navigate("/esqueci-minha-senha")}
            className="w-full py-2.5 rounded-lg bg-[#061c2c] text-white text-xs font-semibold hover:bg-[#0b293d] transition"
          >
            Solicitar Novo Link
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#faf9f7] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-[400px]">
        {/* Logo Civix */}
        <div className="flex justify-center mb-6">
          <img src={civixLogo} alt="Civix" className="h-10 w-auto" />
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {success ? (
            /* Estado de Sucesso */
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-[#071b2b] mb-2">
                Senha Alterada!
              </h2>
              <p className="text-xs text-[#626262] mb-4">
                Sua senha foi atualizada com sucesso. Redirecionando para a tela de login...
              </p>
            </div>
          ) : (
            /* Formulário de Redefinição */
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#071b2b] mb-1">
                  Redefinir Senha
                </h1>
                <p className="text-xs text-[#737373]">
                  Crie uma nova senha segura para acessar sua conta
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo: Nova Senha */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#737373] mb-1.5 font-semibold">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      required
                      className="w-full h-11 rounded-lg bg-[#f3f3f3] px-3 pr-10 text-xs text-[#222] outline-none focus:ring-1 focus:ring-[#0b2030] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#333] transition"
                    >
                      {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>

                {/* Campo: Confirmar Senha */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#737373] mb-1.5 font-semibold">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    className="w-full h-11 rounded-lg bg-[#f3f3f3] px-3 text-xs text-[#222] outline-none focus:ring-1 focus:ring-[#0b2030] transition"
                  />
                </div>

                {/* Requisitos Visuais */}
                <div className="p-3 bg-[#faf9f7] rounded-lg border border-gray-100 text-[11px] text-[#737373] space-y-1">
                  <p className="font-medium text-[#071b2b]">Requisitos da senha:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li className={password.length >= 8 ? "text-emerald-600 font-medium" : ""}>
                      Pelo menos 8 caracteres
                    </li>
                    <li className={password && password === confirmPassword ? "text-emerald-600 font-medium" : ""}>
                      As senhas devem ser iguais
                    </li>
                  </ul>
                </div>

                {/* Botão de Envio */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-[#061c2c] hover:bg-[#0b293d] transition text-white font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Atualizando...
                    </div>
                  ) : (
                    <>
                      <Lock size={14} />
                      Salvar Nova Senha
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}