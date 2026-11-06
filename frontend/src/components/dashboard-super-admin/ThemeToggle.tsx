import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return <Button variant="ghost" size="icon" className="size-10 rounded-xl" type="button" onClick={onToggle}
    aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}>
    {dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
  </Button>;
}
