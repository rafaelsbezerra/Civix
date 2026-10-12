import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, User, ArrowRight, X } from "lucide-react";

// Tempo padrão de bloqueio do modal (30 minutos em milissegundos)
const MODAL_COOLDOWN_MS = 30 * 60 * 1000;

interface RoleModalProps {
  onSelectRole?: (role: "empresa" | "cliente") => void;
}

export default function RoleSelectionModal({ onSelectRole }: RoleModalProps) {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const savedRole = localStorage.getItem("@civix:user_role");
      const expiryTime = localStorage.getItem("@civix:modal_dismissed_until");
      return !savedRole && (!expiryTime || Date.now() > Number(expiryTime));
    } catch {
      return true;
    }
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const handleSelectRole = (role: "empresa" | "cliente") => {
    try {
      localStorage.setItem("@civix:user_role", role);
      localStorage.removeItem("@civix:modal_dismissed_until");
    } catch {
      // A navegação continua quando o armazenamento do navegador está indisponível.
    }
    if (onSelectRole) onSelectRole(role);
    setIsOpen(false);
    
    navigate("/login");
  };

  const handleCloseWithTimer = useCallback(() => {
    try {
      const expireAt = Date.now() + MODAL_COOLDOWN_MS;
      localStorage.setItem("@civix:modal_dismissed_until", expireAt.toString());
    } catch {
      // Fechar o diálogo também deve funcionar sem localStorage.
    }
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const overlay = dialog.parentElement;
    const siblings = [...(overlay?.parentElement?.children ?? [])]
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlay)
      .map(element => ({ element, inert: element.inert }));

    document.body.style.overflow = "hidden";
    siblings.forEach(({ element }) => { element.inert = true; });
    closeButtonRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCloseWithTimer();
        return;
      }
      if (event.key !== "Tab") return;

      const controls = [...dialog!.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !dialog!.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog!.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      siblings.forEach(({ element, inert }) => { element.inert = inert; });
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen, handleCloseWithTimer]);

  if (!isOpen) return null;

  return (
    <div 
      role="presentation"
      data-lenis-prevent=""
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleCloseWithTimer}
    >
      <div aria-hidden="true" data-motion="overlay" data-motion-trigger="mount" className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-dialog-title"
        aria-describedby="role-dialog-description"
        data-motion="panel"
        data-motion-trigger="mount"
        className="w-full max-w-md bg-[#faf9f7] rounded-xl p-6 shadow-2xl border border-gray-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleCloseWithTimer}
          className="absolute top-4 right-4 p-1 rounded-lg text-[#737373] hover:text-[#101010] hover:bg-gray-200/60 transition"
          aria-label="Fechar pop-up"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="role-dialog-title" className="text-xl font-bold text-[#071b2b] text-center mb-2 pr-6 pl-6">
          Bem-vindo ao sistema!
        </h2>
        <p id="role-dialog-description" className="text-sm text-[#626262] text-center mb-6">
          Escolha como deseja se identificar para entrar ou continue navegando.
        </p>

        <div className="space-y-3 mb-4">
          <button
            type="button"
            onClick={() => handleSelectRole("empresa")}
            className="w-full p-4 rounded-lg bg-[#dedede] hover:bg-[#d0d0d0] transition flex items-center group text-left"
          >
            <div className="w-10 h-10 rounded-md bg-[#c0c0c0] flex items-center justify-center mr-3 shrink-0">
              <Building2 className="w-5 h-5 text-[#35404a]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#101010] text-sm">Sou empresa</p>
              <p className="text-xs text-[#626262]">Acessar/cadastrar conta organizacional</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#35404a] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole("cliente")}
            className="w-full p-4 rounded-lg bg-[#dedede] hover:bg-[#d0d0d0] transition flex items-center group text-left"
          >
            <div className="w-10 h-10 rounded-md bg-[#c0c0c0] flex items-center justify-center mr-3 shrink-0">
              <User className="w-5 h-5 text-[#35404a]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#101010] text-sm">Sou cliente</p>
              <p className="text-xs text-[#626262]">Acessar/cadastrar conta individual</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#35404a] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleCloseWithTimer}
          className="w-full py-2 text-center text-xs text-[#737373] hover:text-[#101010] font-medium transition"
        >
          Continuar navegando sem entrar
        </button>
      </div>
    </div>
  );
}