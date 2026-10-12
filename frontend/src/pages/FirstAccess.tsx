import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { validateInviteToken, completeFirstAccess } from "@/lib/api";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Lock, Loader2 } from "lucide-react";

import civixLogo from "../assets/civix/logoCivix.png";

export default function FirstAccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { token: pathToken } = useParams<{ token: string }>();
  const token = pathToken ?? searchParams.get("token");

  // Estados de Validação do Token
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Estados do Formulário
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Regras de validação em tempo real
  const hasMinLength = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && passwordsMatch;

  // 1. Valida o token assim que o componente carrega
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const validateToken = async () => {
      setIsValidatingToken(true);
      setIsTokenValid(false);
      setUserEmail(null);
      setError("");

      if (!token) {
        setError("Token de convite ausente no link.");
        setIsValidatingToken(false);
        return;
      }

      try {
        const data = await validateInviteToken(token, controller.signal);

        if (active) {
          setUserEmail(data.email);
          setIsTokenValid(true);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Erro ao validar o convite.");
        }
      } finally {
        if (active) {
          setIsValidatingToken(false);
        }
      }
    };

    void validateToken();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token]);

  // 2. Envio da nova senha
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isFormValid || !token || !isTokenValid) return;

    try {
      setLoading(true);

      await completeFirstAccess(token, password);

      setSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro ao processar sua solicitação.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Tela de Carregamento da Validação Inicial
  if (isValidatingToken) {
    return (
      <main className="w-full min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-[#071b2b]">
          <Loader2 className="w-8 h-8 animate-spin text-[#061c2c]" />
          <p className="text-xs font-medium">Validando seu convite de acesso...</p>
        </div>
      </main>
    );
  }

  // Estado: Token ausente ou inválido/expirado
  if (!isTokenValid) {
    return (
      <main className="w-full min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#071b2b] mb-2">Convite Indisponível</h2>
          <p className="text-xs text-[#626262] leading-relaxed mb-6">
            {error || "O token de ativação é inválido ou expirou. Solicite um novo convite ao administrador."}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-2.5 rounded bg-[#061c2c] text-white text-xs font-semibold hover:bg-[#0b293d] transition"
          >
            Ir para a Tela de Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#faf9f7] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={civixLogo} alt="Civix" className="h-10 w-auto" />
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {success ? (
            /* Estado de Sucesso */
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-[#071b2b] mb-2">
                Senha Cadastrada!
              </h2>
              <p className="text-xs text-[#626262] mb-4">
                Sua conta foi ativada com sucesso. Redirecionando para a tela de login...
              </p>
            </div>
          ) : (
            /* Formulário de Criação de Senha */
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#071b2b] mb-1">
                  Primeiro Acesso
                </h1>
                <p className="text-xs text-[#737373]">
                  {userEmail ? (
                    <>Defina a senha para <strong>{userEmail}</strong></>
                  ) : (
                    "Defina sua senha de acesso para ativar sua conta no Civix"
                  )}
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
                    Confirmar Senha
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha digitada"
                    required
                    className="w-full h-11 rounded-lg bg-[#f3f3f3] px-3 text-xs text-[#222] outline-none focus:ring-1 focus:ring-[#0b2030] transition"
                  />
                </div>

                {/* Requisitos rápidos de senha */}
                <div className="p-3 bg-[#faf9f7] rounded-lg border border-gray-100 text-[11px] text-[#737373] space-y-1">
                  <p className="font-medium text-[#071b2b]">Sua senha deve conter:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li className={hasMinLength ? "text-emerald-600 font-medium" : ""}>
                      Pelo menos 8 caracteres
                    </li>
                    <li className={passwordsMatch ? "text-emerald-600 font-medium" : ""}>
                      Confirmação coincidente
                    </li>
                  </ul>
                </div>

                {/* Botão de Envio */}
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full h-11 rounded-lg bg-[#061c2c] hover:bg-[#0b293d] transition text-white font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Cadastrando senha...
                    </div>
                  ) : (
                    <>
                      <Lock size={14} />
                      Ativar Conta e Entrar
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