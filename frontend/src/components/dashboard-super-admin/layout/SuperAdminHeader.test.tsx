import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SuperAdminHeader } from './SuperAdminHeader';

function setup(dark = false) {
  const callbacks = { onLogout: vi.fn(), onToggleTheme: vi.fn() };
  render(<MemoryRouter><div className={`super-admin-root${dark ? ' dark' : ''}`} data-theme={dark ? 'dark' : 'light'}>
    <SidebarProvider><SuperAdminHeader title="Empresas" name="Admin Teste" dark={dark} {...callbacks} /></SidebarProvider>
  </div></MemoryRouter>);
  return { user: userEvent.setup(), ...callbacks };
}

describe('Header do superadmin', () => {
  it('abre o menu com perfil e preserva a saída', async () => {
    const { user, onLogout } = setup();
    await user.click(screen.getByRole('button', { name: 'Abrir menu de Admin Teste' }));
    expect(await screen.findByRole('menuitem', { name: 'Meu perfil' })).toHaveAttribute('href', '/dashboard/super-admin/settings/profile');
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    const portal = screen.getByRole('menu').closest('[data-slot="super-admin-user-menu-portal"]');
    expect(portal).not.toBeNull();
    expect(portal).toHaveClass('absolute');
    await user.click(screen.getByRole('menuitem', { name: 'Sair da conta' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('fecha com Escape e devolve foco ao botão do usuário', async () => {
    const { user } = setup();
    const trigger = screen.getByRole('button', { name: 'Abrir menu de Admin Teste' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('preserva o tema e oferece o controle da barra lateral', async () => {
    const { user, onToggleTheme } = setup(true);
    await user.click(screen.getByRole('button', { name: 'Ativar modo claro' }));
    const sidebarTrigger = screen.getByRole('button', { name: 'Alternar menu lateral' });
    await user.click(sidebarTrigger);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
    expect(sidebarTrigger).toHaveAttribute('data-sidebar', 'trigger');
  });
});
