import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Lock } from "lucide-react";

// Substitua pelo caminho do logo do Civix no seu projeto
import civixLogo from "../assets/civix/logoCivix.png";

export default function FirstAccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Pega o token diretamente dos parâmetros da URL
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
      setError("Token de convite ausente ou inválido.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve conter no mínimo 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:3000/api/auth/first-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao definir a senha.");
      }

      setSuccess(true);

      // Redireciona para o login após 2.5 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2500);

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  };

  // Estado 1: Link sem token
  if (!token) {
    return (
      <main className="w-full min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#071b2b] mb-2">Link Inválido</h2>
          <p className="text-xs text-[#626262] leading-relaxed mb-6">
            O token de ativação não foi encontrado no link. Por favor, solicite um novo e-mail de convite ao administrador do sistema.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-2.5 rounded bg-[#061c2c] text-white text-xs font-semibold hover:bg-[#0b293d] transition"
          >
            Voltar para a Home
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
                  Defina sua senha de acesso para ativar sua conta no Civix
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
                    <li className={password.length >= 8 ? "text-emerald-600 font-medium" : ""}>
                      Pelo menos 8 caracteres
                    </li>
                    <li className={password && password === confirmPassword ? "text-emerald-600 font-medium" : ""}>
                      Confirmação coincidente
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
                    "Cadastrando senha..."
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