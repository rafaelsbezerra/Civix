import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SuperAdminUserMenu } from './SuperAdminUserMenu';
import { ThemeToggle } from '../ThemeToggle';

export function SuperAdminHeader({
  title,
  name,
  dark,
  onToggleTheme,
  onLogout,
}: {
  title: string;
  name: string;
  dark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  return (
    <header className="sa-header">
      <div className="sa-header-title">
        <SidebarTrigger
          className="size-9 rounded-xl"
          aria-label="Alternar menu lateral"
        />
        <Separator
          orientation="vertical"
          className="mx-1 h-5 data-vertical:self-auto"
        />
        <h1>{title}</h1>
      </div>
      <div className="sa-header-actions">
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        <SuperAdminUserMenu
          name={name}
          onLogout={onLogout}
          container={portal}
          trigger={
            <Button
              variant="ghost"
              className="h-11 max-w-52 gap-2 rounded-xl px-2"
              aria-label={`Abrir menu de ${name}`}
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden min-w-0 text-left sm:block">
                <span className="block truncate text-sm">{name}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Superadmin
                </span>
              </span>
              <ChevronDown className="hidden size-4 sm:block" aria-hidden="true" />
            </Button>
          }
        />
      </div>
      <div
        ref={setPortal}
        data-slot="super-admin-user-menu-portal"
        className="pointer-events-none absolute inset-0 [&_[data-slot=dropdown-menu-content]]:pointer-events-auto"
      />
    </header>
  );
}
