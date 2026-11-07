import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { ApiError, getSessionProfile } from '../../lib/api';

vi.mock('../../lib/api', async (original) => ({
  ...(await original<typeof import('../../lib/api')>()),
  getSessionProfile: vi.fn(),
}));
const profileMock = vi.mocked(getSessionProfile);
const removeItem = vi.fn();
function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route path="/login" element={<p>Entrar novamente</p>} />
        <Route element={<ProtectedRoute allowedRoles={['admin_empresa']} />}>
          <Route path="/private" element={<p>Área autorizada</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}
describe('Proteção das rotas pelo perfil confirmado no servidor', () => {
  beforeEach(() => {
    profileMock.mockReset();
    removeItem.mockReset();
    vi.stubGlobal('localStorage', { removeItem });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('Permite perfil aprovado após consultar sessão real', async () => {
    profileMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.test',
        role: 'admin_empresa',
        companyId: 'company-1',
      },
      permissions: { uploadCompanyCover: true },
    });
    renderGuard();
    expect(await screen.findByText('Área autorizada')).toBeInTheDocument();
  });
  it('Nega perfil fora da lista permitida', async () => {
    profileMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.test',
        role: 'atendente',
        companyId: 'company-1',
      },
      permissions: { uploadCompanyCover: false },
    });
    renderGuard();
    expect(await screen.findByRole('alert')).toHaveTextContent('Acesso não permitido');
    expect(screen.queryByText('Área autorizada')).not.toBeInTheDocument();
  });
  it('Limpa token expirado e redireciona para login', async () => {
    profileMock.mockRejectedValue(new ApiError('Sessão inválida', 401));
    renderGuard();
    expect(await screen.findByText('Entrar novamente')).toBeInTheDocument();
    expect(removeItem).toHaveBeenCalledWith('token');
  });
  it('Falha de rede não apaga token nem libera conteúdo privado', async () => {
    profileMock.mockRejectedValue(new ApiError('Falha de rede'));
    renderGuard();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível verificar'),
    );
    expect(removeItem).not.toHaveBeenCalled();
    expect(screen.queryByText('Área autorizada')).not.toBeInTheDocument();
  });
  it('Permite repetir a verificação após falha de rede sem liberar conteúdo antes da resposta', async () => {
    profileMock
      .mockRejectedValueOnce(new ApiError('Falha de rede'))
      .mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.test',
          role: 'admin_empresa',
          companyId: 'company-1',
        },
        permissions: { uploadCompanyCover: true },
      });
    renderGuard();
    const retry = await screen.findByRole('button', { name: 'Tentar novamente' });
    expect(screen.queryByText('Área autorizada')).not.toBeInTheDocument();
    fireEvent.click(retry);
    expect(await screen.findByText('Área autorizada')).toBeInTheDocument();
    expect(removeItem).not.toHaveBeenCalled();
    expect(profileMock).toHaveBeenCalledTimes(2);
  });
});
