import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { ApiError, getSessionProfile, login, logout } from "../lib/api";

import civixBackground from "../assets/civix/logo-civix-white.png";

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


export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Se já existe uma sessão de super admin válida, vai direto ao painel.
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Informe e-mail e senha para continuar.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await login({ email: email.trim(), password, role: "super_admin" });

      if (result.user.role !== "super_admin") {
        await logout().catch(() => undefined);
        setError("Acesso não autorizado.");
        return;
      }

      navigate("/dashboard/super-admin", { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível entrar. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full h-[clamp(42px,6.2vh,52px)] rounded-[10px] bg-[#0b1d31] border border-[#1d3a58] px-4 text-[15px] text-white " +
    "placeholder:text-[#5f7891] outline-none transition " +
    "focus:border-[#F0BE5A] focus:ring-2 focus:ring-[#F0BE5A]/30";

  return (
    <main className="h-dvh w-full overflow-hidden bg-[#08182a] text-white font-sans lg:grid lg:grid-cols-[minmax(420px,5fr)_7fr]">
      <meta name="robots" content="noindex, nofollow" />

      {/* Coluna do formulário */}
      <section className="relative flex h-full min-h-0 flex-col px-6 py-[clamp(12px,2.2vh,24px)] sm:px-12 lg:px-[clamp(40px,5vw,96px)]">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex w-fit items-center gap-2 rounded-[8px] border border-[#1d3a58] bg-[#0f2540] px-3 py-2 text-[13px] text-[#c5d3e2] transition hover:bg-[#143156] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F0BE5A]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar
        </button>

        <div className="mx-auto flex min-h-0 w-full max-w-[440px] flex-1 flex-col justify-center overflow-y-auto py-[clamp(8px,2vh,40px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Marca */}
          <div className="mb-[clamp(14px,4vh,40px)] flex items-center gap-3">
            {/* <span
              aria-hidden="true"
              className="flex h-[clamp(36px,5.5vh,48px)] w-[clamp(36px,5.5vh,48px)] shrink-0 items-center justify-center rounded-[12px] bg-[#F0BE5A] text-[clamp(20px,3.2vh,26px)] font-bold leading-none text-[#08182a]"
            >
              c.
            </span> */}
            <div className="leading-none">
                <img src={civixBackground} alt="Civix" />
              {/* <p className="text-[clamp(22px,3.4vh,28px)] font-semibold tracking-tight">Civix</p> */}
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.28em] text-[#8ba3bb]">
                Administração
              </p>
            </div>
          </div>

          <span className="mb-[clamp(8px,2vh,20px)] inline-flex w-fit items-center gap-2 rounded-full border border-[#F0BE5A]/40 bg-[#F0BE5A]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F0BE5A]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Acesso interno
          </span>

          <h1 className="text-[clamp(22px,min(2.6vw,4.6vh),40px)] font-semibold leading-[1.08] tracking-tight">
            Login do painel administrativo
          </h1>
          <p className="mt-[clamp(6px,1.6vh,16px)] text-[clamp(13px,2vh,16px)] leading-relaxed text-[#9fb2c5]">
            Área exclusiva da equipe Civix para gerenciar empresas, planos e vendas da plataforma.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-[clamp(10px,2vh,24px)] rounded-[10px] border border-red-400/40 bg-red-500/10 px-4 py-3 text-[14px] text-red-200"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-[clamp(12px,3vh,32px)] space-y-[clamp(10px,2vh,20px)]">
            <div>
              <label htmlFor="sa-email" className="mb-2 block text-[14px] font-medium text-[#dbe5ef]">
                E-mail interno
              </label>
              <input
                id="sa-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="nome@civix.com.br"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="sa-password" className="mb-2 block text-[14px] font-medium text-[#dbe5ef]">
                Senha
              </label>
              <div className="relative">
                <input
                  id="sa-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#7d95ad] transition hover:text-white focus-visible:outline-2 focus-visible:outline-[#F0BE5A]"
                >
                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-[clamp(42px,6.2vh,52px)] w-full items-center justify-between rounded-[10px] bg-[#F0BE5A] px-5 text-[15px] font-semibold text-[#08182a] transition hover:bg-[#f5cc78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{isLoading ? "Entrando..." : "Entrar no painel"}</span>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#6f879f]">
          © {new Date().getFullYear()} Civix. Todos os direitos reservados.
        </p>
      </section>

{/* Painel visual (apenas desktop) */}
      <section className="relative hidden min-h-screen p-3 lg:block">
        <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[#f4f6f9]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#f4f6f9] via-[#f4f6f9]/70 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-[clamp(32px,4vw,72px)]">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-[#b7860f]">
              Civix Super Admin
            </p>
            <h2 className="max-w-[16ch] text-[clamp(36px,3.6vw,64px)] font-bold uppercase leading-[0.98] tracking-tight text-[#08182a]">
              Painel interno da operação
            </h2>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-[#2b425b]">
              A base para a equipe acompanhar o crescimento, as vendas e a expansão da plataforma em um só lugar.
            </p>

            <AnimatedWave className="bottom-[-1px] h-[120px]" />
          </div>
        </div>
      </section>
    </main>
  );
}
