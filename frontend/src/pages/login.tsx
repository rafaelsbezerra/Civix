import {
  Building2,
  User,
  Eye,
  ArrowRight,
  EyeOff,
  Loader2,
} from "lucide-react";

import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import civixLogo from "../assets/civix/logoCivix.png";
import civixLogoDark from "../assets/civix/logoBackground.png";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

const AnimatedWave = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={`absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 ${className}`}
    >
      <style>{`
        @keyframes waveFloat {
          0%, 100% {
            transform: matrix(1, 0.015, -0.015, 1, 0, 8);
          }

          50% {
            transform: matrix(1, -0.015, 0.015, 1, 0, -8);
          }
        }

        .wave-path {
          animation: waveFloat 9s ease-in-out infinite;
          transform-origin: center bottom;
        }

        .wave-1 {
          animation-delay: 0s;
          opacity: 0.85;
        }

        .wave-2 {
          animation-delay: -3s;
          opacity: 0.6;
        }

        .wave-3 {
          animation-delay: -6s;
          opacity: 0.35;
        }
      `}</style>

      <svg
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="waveGrad1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#E5A93B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          <linearGradient
            id="waveGrad2"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#E5A93B" />
          </linearGradient>

          <linearGradient
            id="waveGrad3"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <path
            id="waveShape"
            d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,149.3C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </defs>

        <use
          href="#waveShape"
          className="wave-path wave-3"
          fill="url(#waveGrad3)"
        />

        <use
          href="#waveShape"
          className="wave-path wave-2"
          fill="url(#waveGrad2)"
        />

        <use
          href="#waveShape"
          className="wave-path wave-1"
          fill="url(#waveGrad1)"
        />
      </svg>
    </div>
  );
};

export default function Login() {
  const [role, setRole] = useState<"empresa" | "cliente">("empresa");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleRoleChange = (newRole: "empresa" | "cliente") => {
    setRole(newRole);
    setError(null);

    if (newRole === "cliente") {
      setPassword("");
      setShowPassword(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!email) {
      setError("Por favor, informe seu email.");
      return;
    }

    if (role === "empresa" && !password) {
      setError("Por favor, informe sua senha.");
      return;
    }

    try {
      setIsLoading(true);

      console.log("Enviando login:", {
        email,
        role,
        password: role === "empresa" ? password : "(não enviado)",
      });

      const response = await api.post("/api/users/login", {
        email,
        password: role === "empresa" ? password : undefined,
        role,
      });

      console.log("Resposta do servidor:", response.data);

      localStorage.setItem("token", response.data.token);

      if (role === "empresa") {
        navigate("/dashboard-empresa");
      } else {
        navigate("/");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("ERRO COMPLETO:", err);
        console.error("RESPOSTA DO SERVIDOR:", err.response?.data);
        console.error("STATUS:", err.response?.status);
        console.error("URL:", err.config?.url);

        setError(
          err.response?.data?.error ||
          "Ocorreu um erro ao realizar o login. Tente novamente."
        );
      } else {
        console.error("Erro inesperado:", err);
        setError("Ocorreu um erro ao realizar o login. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#202020] overflow-hidden">
      <style>{`
        @keyframes pageFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-entry-left {
          animation: pageFadeIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-entry-right {
          animation: pageFadeIn 0.95s cubic-bezier(0.16, 1, 0.3, 1) 0.15s
            forwards;
          opacity: 0;
        }
      `}</style>

      <div className="w-full min-h-screen bg-[#faf9f7] flex flex-col lg:flex-row">
        <section className="w-full lg:w-1/2 min-h-screen relative flex flex-col animate-entry-left">
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="w-full max-w-[clamp(280px,20vw,500px)]">
              <h1
                id="login-title"
                className="font-sans text-[clamp(24px,1.5vw,30px)] leading-[1.1] font-semibold text-[#071b2b] text-center mb-[clamp(18px,2vh,30px)]"
              >
                Faça login para ter acesso
                <br />
                ao sistema
              </h1>

              <div className="space-y-[clamp(8px,0.7vw,14px)] mb-[clamp(18px,2vh,30px)]">
                <button
                  type="button"
                  onClick={() => handleRoleChange("empresa")}
                  className={`w-full h-[clamp(70px,2vh,72px)] rounded-[6px] transition flex items-center px-[clamp(12px,1vw,20px)] text-left border ${role === "empresa"
                      ? "bg-[#d0d0d0] border-[#b5b5b5]"
                      : "bg-[#dedede] border-transparent hover:bg-[#d5d5d5]"
                    }`}
                >
                  <div className="w-[clamp(30px,2.2vw,42px)] h-[clamp(30px,2.2vw,42px)] rounded-[5px] flex items-center justify-center mr-[clamp(10px,0.8vw,16px)] shrink-0 bg-[#c0c0c0]">
                    <Building2
                      size={18}
                      className="w-[clamp(15px,1vw,20px)] h-[clamp(15px,1vw,20px)] text-[#35404a]"
                      strokeWidth={1.5}
                    />
                  </div>

                  <div>
                    <p className="text-[clamp(14px,0.55vw,12px)] font-semibold text-[#101010]">
                      Sou empresa
                    </p>

                    <p className="text-[clamp(12px,0.48vw,11px)] leading-[1.25] text-[#626262]">
                      Acesse o painel administrativo da
                      <br />
                      sua organização.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("cliente")}
                  className={`w-full h-[clamp(70px,5vh,72px)] rounded-[6px] transition flex items-center px-[clamp(12px,1vw,20px)] text-left border ${role === "cliente"
                      ? "bg-[#d0d0d0] border-[#b5b5b5]"
                      : "bg-[#dedede] border-transparent hover:bg-[#d5d5d5]"
                    }`}
                >
                  <div className="w-[clamp(30px,2.2vw,42px)] h-[clamp(30px,2.2vw,42px)] rounded-[5px] flex items-center justify-center mr-[clamp(10px,0.8vw,16px)] shrink-0 bg-[#c0c0c0]">
                    <User
                      size={18}
                      className="w-[clamp(15px,1vw,20px)] h-[clamp(15px,1vw,20px)] text-[#35404a]"
                      strokeWidth={1.5}
                    />
                  </div>

                  <div>
                    <p className="text-[clamp(14px,0.55vw,12px)] font-semibold text-[#101010]">
                      Sou cliente
                    </p>

                    <p className="text-[clamp(12px,0.48vw,11px)] leading-[1.25] text-[#626262]">
                      Entre para acompanhar seus dados
                      <br />
                      e serviços.
                    </p>
                  </div>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded bg-red-100 border border-red-300 text-red-700 text-xs">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-[clamp(10px,1.2vh,18px)]"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[clamp(12px,0.5vw,11px)] text-[#737373] mb-1.5"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu_email@email.com"
                    className="w-full h-[clamp(50px,4vh,52px)] rounded-[5px] bg-[#f3f3f3] px-[clamp(10px,0.8vw,16px)] text-[clamp(14px,0.6vw,13px)] text-[#222] placeholder:text-[#777] outline-none focus:ring-1 focus:ring-[#0b2030]"
                  />
                </div>

                {role === "empresa" && (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-[clamp(12px,0.5vw,11px)] text-[#737373] mb-1.5"
                    >
                      Senha
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-[clamp(50px,4vh,52px)] rounded-[5px] bg-[#f3f3f3] px-[clamp(10px,0.8vw,16px)] pr-10 text-[clamp(14px,0.6vw,13px)] text-[#222] placeholder:text-[#777] outline-none focus:ring-1 focus:ring-[#0b2030]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999]"
                        aria-label={
                          showPassword
                            ? "Ocultar senha"
                            : "Mostrar senha"
                        }
                      >
                        {showPassword ? (
                          <Eye className="w-[clamp(12px,0.8vw,18px)] h-[clamp(12px,0.8vw,18px)]" />
                        ) : (
                          <EyeOff className="w-[clamp(12px,0.8vw,18px)] h-[clamp(12px,0.8vw,18px)]" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[clamp(34px,4vh,52px)] rounded-[5px] bg-[#061c2c] hover:bg-[#0b293d] transition text-white flex items-center justify-between px-[clamp(12px,0.8vw,18px)] text-[clamp(9px,0.6vw,13px)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>
                    {isLoading ? "Entrando..." : "Login"}
                  </span>

                  {isLoading ? (
                    <Loader2 className="w-[clamp(13px,0.9vw,19px)] h-[clamp(13px,0.9vw,19px)] animate-spin" />
                  ) : (
                    <ArrowRight
                      className="w-[clamp(13px,0.9vw,19px)] h-[clamp(13px,0.9vw,19px)]"
                      strokeWidth={1.5}
                    />
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="h-[clamp(60px,10vh,110px)] flex items-center justify-center">
            <img
              src={civixLogo}
              alt="Civix"
              className="w-[clamp(60px,20vw,100px)] h-auto"
            />
          </div>
        </section>

        <section className="hidden lg:block w-1/2 min-h-screen relative overflow-hidden bg-[#061b2b]">
          <img
            src={civixLogoDark}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-90 z-0"
          />

          <AnimatedWave className="h-[auto]" />

          <div className="absolute bottom-0 inset-x-0 h-[70%] bg-gradient-to-t from-[#E5A93B]/20 to-transparent pointer-events-none z-20" />
        </section>
      </div>
    </main>
  );
}