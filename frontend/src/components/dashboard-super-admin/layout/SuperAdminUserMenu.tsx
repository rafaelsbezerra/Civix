import type { ReactElement } from 'react';
import { CircleUserRound, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Adaptado do bloco @shadcn-space/dropdown-menu-01 para as ações existentes.
export function SuperAdminUserMenu({
  name,
  trigger,
  container,
  onLogout,
}: {
  name: string;
  trigger: ReactElement;
  container: HTMLElement | null;
  onLogout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent
        container={container}
        align="end"
        sideOffset={8}
        className="w-64 max-w-[calc(100vw-2rem)] rounded-2xl p-2"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-2 py-3">
            <Avatar className="size-10">
              <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-popover-foreground">
                {name}
              </span>
              <span className="block text-xs text-muted-foreground">Superadmin</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<Link to="/dashboard/super-admin/settings/profile" />}
            className="min-h-11 cursor-pointer gap-2 rounded-xl p-2"
          >
            <CircleUserRound aria-hidden="true" />
            Meu perfil
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          variant="destructive"
          className="min-h-11 cursor-pointer gap-2 rounded-xl p-2"
        >
          <LogOut aria-hidden="true" />
          Sair da conta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
