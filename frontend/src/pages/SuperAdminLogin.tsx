import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { ApiError, getSessionProfile, login, logout } from "../lib/api";

import civixLogo from "../assets/civix/logoCivix.png";
import civixLogoDark from "../assets/civix/logoBackground.png";

function AnimatedWave() {
  return (
    <div className="absolute bottom-0 left-0 z-10 w-full overflow-hidden leading-none">
      <svg
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="superAdminWaveGrad1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#E5A93B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          <linearGradient
            id="superAdminWaveGrad2"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#E5A93B" />
          </linearGradient>

          <linearGradient
            id="superAdminWaveGrad3"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <path
            id="superAdminWaveShape"
            d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,149.3C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </defs>

        <use
          href="#superAdminWaveShape"
          className="super-admin-wave super-admin-wave-3"
          fill="url(#superAdminWaveGrad3)"
        />
        <use
          href="#superAdminWaveShape"
          className="super-admin-wave super-admin-wave-2"
          fill="url(#superAdminWaveGrad2)"
        />
        <use
          href="#superAdminWaveShape"
          className="super-admin-wave super-admin-wave-1"
          fill="url(#superAdminWaveGrad1)"
        />
      </svg>
    </div>
  );
}

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    getSessionProfile()
      .then((profile) => {
        if (active && profile.user.role === "super_admin") {
          navigate("/dashboard/super-admin", { replace: true });
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Informe e-mail e senha para continuar.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await login({
        email: email.trim(),
        password,
        role: "super_admin",
      });

      if (result.user.role !== "super_admin") {
        await logout().catch(() => undefined);
        setError("Acesso não autorizado.");
        return;
      }

      navigate("/dashboard/super-admin", { replace: true });
    } catch (failure: unknown) {
      setError(
        failure instanceof ApiError
          ? failure.message
          : "Não foi possível entrar. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full overflow-hidden bg-[#202020]">
      <meta name="robots" content="noindex, nofollow" />

      <style>{`
        @keyframes superAdminLoginFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes superAdminWaveFloat {
          0%, 100% {
            transform: matrix(1, 0.015, -0.015, 1, 0, 8);
          }

          50% {
            transform: matrix(1, -0.015, 0.015, 1, 0, -8);
          }
        }

        .super-admin-login-entry-left {
          animation: superAdminLoginFadeIn 1.5s
            cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .super-admin-login-entry-right {
          animation: superAdminLoginFadeIn 0.95s
            cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
          opacity: 0;
        }

        .super-admin-wave {
          animation: superAdminWaveFloat 9s ease-in-out infinite;
          transform-origin: center bottom;
        }

        .super-admin-wave-1 {
          opacity: 0.85;
        }

        .super-admin-wave-2 {
          animation-delay: -3s;
          opacity: 0.6;
        }

        .super-admin-wave-3 {
          animation-delay: -6s;
          opacity: 0.35;
        }

        @media (prefers-reduced-motion: reduce) {
          .super-admin-login-entry-left,
          .super-admin-login-entry-right,
          .super-admin-wave {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <div className="flex min-h-screen w-full flex-col bg-[#faf9f7] lg:flex-row">
        <section className="super-admin-login-entry-left relative flex min-h-screen w-full flex-col lg:w-1/2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-[5px] px-2 py-2 text-sm font-medium text-[#071b2b] transition hover:bg-[#f0efec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#071b2b] sm:left-10 sm:top-8"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar
          </button>

          <div className="flex flex-1 items-center justify-center px-6 pb-8 pt-24">
            <div className="w-full max-w-[clamp(320px,24vw,460px)]">
              <h1
                id="login-title"
                className="text-[clamp(28px,2.2vw,40px)] font-semibold leading-[1.08] tracking-tight text-[#071b2b]"
              >
                Login do painel administrativo
              </h1>

              <p className="mt-4 max-w-[46ch] text-[clamp(13px,0.85vw,16px)] leading-relaxed text-[#66717b]">
                Área exclusiva da equipe Civix para gerenciar empresas, planos e
                vendas da plataforma.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-[5px] border border-red-300 bg-red-100 p-3 text-xs text-red-700"
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                noValidate
                aria-labelledby="login-title"
                className="mt-[clamp(20px,3vh,32px)] space-y-[clamp(10px,1.2vh,18px)]"
              >
                <div>
                  <label
                    htmlFor="sa-email"
                    className="mb-1.5 block text-[clamp(12px,0.5vw,13px)] text-[#737373]"
                  >
                    E-mail interno
                  </label>

                  <input
                    id="sa-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    placeholder="nome@civix.com.br"
                    className="h-[clamp(50px,4vh,52px)] w-full rounded-[5px] bg-[#f3f3f3] px-[clamp(10px,0.8vw,16px)] text-[clamp(14px,0.6vw,15px)] text-[#222] outline-none placeholder:text-[#777] focus:ring-1 focus:ring-[#0b2030]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sa-password"
                    className="mb-1.5 block text-[clamp(12px,0.5vw,13px)] text-[#737373]"
                  >
                    Senha
                  </label>

                  <div className="relative">
                    <input
                      id="sa-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-[clamp(50px,4vh,52px)] w-full rounded-[5px] bg-[#f3f3f3] px-[clamp(10px,0.8vw,16px)] pr-10 text-[clamp(14px,0.6vw,15px)] text-[#222] outline-none placeholder:text-[#777] focus:ring-1 focus:ring-[#0b2030]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#999] transition hover:text-[#071b2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#071b2b]"
                    >
                      {showPassword ? (
                        <Eye className="h-[clamp(14px,0.8vw,18px)] w-[clamp(14px,0.8vw,18px)]" />
                      ) : (
                        <EyeOff className="h-[clamp(14px,0.8vw,18px)] w-[clamp(14px,0.8vw,18px)]" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-[clamp(44px,4vh,52px)] w-full items-center justify-between rounded-[5px] bg-[#061c2c] px-[clamp(12px,0.8vw,18px)] text-[clamp(12px,0.6vw,14px)] font-medium text-white transition hover:bg-[#0b293d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#061c2c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{isLoading ? "Entrando..." : "Entrar no painel"}</span>

                  {isLoading ? (
                    <Loader2
                      className="h-[clamp(14px,0.9vw,19px)] w-[clamp(14px,0.9vw,19px)] animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRight
                      className="h-[clamp(14px,0.9vw,19px)] w-[clamp(14px,0.9vw,19px)]"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="flex h-[clamp(60px,10vh,110px)] items-center justify-center">
            <img
              src={civixLogo}
              alt="Civix"
              className="h-auto w-[clamp(72px,20vw,110px)]"
            />
          </div>
        </section>

        <section className="super-admin-login-entry-right relative hidden min-h-screen w-1/2 overflow-hidden bg-[#061b2b] lg:block">
          <img
            src={civixLogoDark}
            alt=""
            className="absolute inset-0 z-0 h-full w-full object-cover opacity-90"
          />

          <AnimatedWave />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[70%] bg-gradient-to-t from-[#E5A93B]/20 to-transparent" />
        </section>
      </div>
    </main>
  );
}
