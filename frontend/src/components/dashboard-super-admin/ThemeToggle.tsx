import { Moon, Sun } from 'lucide-react';
export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return <button className="sa-icon-button" type="button" onClick={onToggle}
    aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}>
    {dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
  </button>;
}
