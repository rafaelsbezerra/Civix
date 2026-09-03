import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, Lock } from "lucide-react";
import axios from "axios";

import civixLogo from "../assets/civix/logoCivix.png";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("O link de recuperação não possui um token válido.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/v1/users/reset-password", { token, password });
      setSuccess(true);
    } catch (requestError: unknown) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.error || "Não foi possível redefinir sua senha.");
      } else {
        setError("Ocorreu um erro inesperado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#faf9f7] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-6">
          <img src={civixLogo} alt="Civix" className="h-10 w-auto" />
        </div>
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {success ? (
            <div className="text-center py-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h1 className="text-xl font-semibold text-[#071b2b] mb-2">Senha redefinida</h1>
              <p className="text-xs text-[#626262] mb-6">Sua senha foi atualizada com sucesso.</p>
              <button onClick={() => navigate("/login")} className="w-full h-11 rounded-lg bg-[#061c2c] text-white text-xs font-semibold">
                Ir para o login
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#071b2b] mb-1">Redefinir senha</h1>
                <p className="text-xs text-[#737373]">Escolha uma nova senha para sua conta.</p>
              </div>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nova senha (mínimo de 8 caracteres)" required className="w-full h-11 rounded-lg bg-[#f3f3f3] px-3 text-xs text-[#222] outline-none focus:ring-1 focus:ring-[#0b2030]" />
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirme sua nova senha" required className="w-full h-11 rounded-lg bg-[#f3f3f3] px-3 text-xs text-[#222] outline-none focus:ring-1 focus:ring-[#0b2030]" />
                <button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-[#061c2c] text-white font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Atualizando...</> : <><Lock size={14} /> Atualizar senha</>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
