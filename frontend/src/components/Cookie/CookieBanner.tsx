import { useEffect, useState } from 'react';
import { readConsent, saveConsent, onOpenPreferences } from '@/lib/consent';
import { loadAnalytics, loadMarketing } from '@/lib/scripts';

type Escolha = { analytics: boolean; marketing: boolean };

function aplicar(c: Escolha) {
  if (c.analytics) {
    loadAnalytics();
  }
  if (c.marketing) {
    loadMarketing();
  }
}

// Os três botões compartilham o mesmo estilo, de propósito (LGPD)
const btn =
  'rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 ' +
  'hover:border-blue-600 focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-blue-600 ' +
  'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 ' +
  'dark:hover:border-blue-400 dark:focus-visible:outline-blue-400';

export default function CookieBanner() {
  const [visivel, setVisivel] = useState(() => readConsent() === null);
  const [personalizando, setPersonalizando] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Na carga: aplica a escolha salva ou mostra o banner
  useEffect(() => {
    const salvo = readConsent();
    if (salvo) {
      aplicar(salvo);
    }
  }, []);

  // Permite reabrir pelo link do rodapé
  useEffect(
    () =>
      onOpenPreferences(() => {
        const salvo = readConsent();
        setAnalytics(salvo?.analytics ?? false);
        setMarketing(salvo?.marketing ?? false);
        setPersonalizando(true);
        setVisivel(true);
      }),
    [],
  );

  const salvar = (escolha: Escolha) => {
    const anterior = readConsent();
    saveConsent(escolha);

    // Se retirou um consentimento já dado, recarrega para descartar os scripts ativos
    const retirou =
      (anterior?.analytics && !escolha.analytics) ||
      (anterior?.marketing && !escolha.marketing);
    if (retirou) {
      return window.location.reload();
    }

    aplicar(escolha);
    setVisivel(false);
    setPersonalizando(false);
  };

  if (!visivel) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferências de cookies"
      className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto border-t border-gray-300 bg-white px-5 py-4 text-sm leading-6 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
    >
      {!personalizando ? (
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <p className="flex-1 text-gray-600 dark:text-gray-400">
            Usamos cookies para o funcionamento do site e, com a sua permissão, para
            entender como ele é usado. Veja nossa{' '}
            <a
              href="/politica-de-cookies"
              className="text-blue-600 underline dark:text-blue-400"
            >
              política de cookies
            </a>
            .
          </p>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              className={btn}
              onClick={() => salvar({ analytics: false, marketing: false })}
            >
              Recusar
            </button>
            <button className={btn} onClick={() => setPersonalizando(true)}>
              Personalizar
            </button>
            <button
              className={btn}
              onClick={() => salvar({ analytics: true, marketing: true })}
            >
              Aceitar
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <Opcao
            titulo="Essenciais"
            descricao="Login e segurança. Sempre ativos, o site não funciona sem eles."
            checked
            disabled
          />
          <Opcao
            titulo="Análise de uso"
            descricao="Nos ajudam a entender quais páginas são mais usadas."
            checked={analytics}
            onChange={setAnalytics}
          />
          <Opcao
            titulo="Marketing"
            descricao="Medem campanhas e personalizam anúncios."
            checked={marketing}
            onChange={setMarketing}
          />

          <div className="flex justify-end gap-2">
            <button className={btn} onClick={() => setPersonalizando(false)}>
              Voltar
            </button>
            <button className={btn} onClick={() => salvar({ analytics, marketing })}>
              Salvar preferências
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type OpcaoProps = {
  titulo: string;
  descricao: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (valor: boolean) => void;
};

function Opcao({ titulo, descricao, checked, disabled, onChange }: OpcaoProps) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? '' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-4 w-4 accent-blue-600"
      />
      <span>
        <span className="block font-medium">{titulo}</span>
        <span className="block text-gray-600 dark:text-gray-400">{descricao}</span>
      </span>
    </label>
  );
}
