import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  getConversation,
  getConversationMessages,
  listConversations,
  sendConversationMessage,
  updateConversationAssignment,
  updateConversationStatus,
  type ConversationMessage,
  type ConversationSummary,
} from '@/lib/api';

import ConversationsPage from './ConversationsPage';

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  getConversation: vi.fn(),
  getConversationMessages: vi.fn(),
  listConversations: vi.fn(),
  sendConversationMessage: vi.fn(),
  updateConversationAssignment: vi.fn(),
  updateConversationStatus: vi.fn(),
}));

const customerMessage: ConversationMessage = {
  id: 'message-customer-1',
  sender: 'customer',
  text: 'Meu pedido ainda não chegou.',
  createdAt: '2026-11-23T12:00:00.000Z',
};

const conversation: ConversationSummary = {
  id: 'conversation-1',
  customer: {
    name: 'João Pedroso',
    phone: '(11) 99999-0000',
    location: 'São Paulo, SP',
  },
  company: {
    name: 'Lume Interiores',
  },
  status: 'pending',
  assignee: {
    type: 'bot',
  },
  attention: false,
  unreadCount: 1,
  updatedAt: '2026-11-23T12:00:00.000Z',
  lastMessage: customerMessage,
};
const assignedConversation: ConversationSummary = {
  ...conversation,
  status: 'in_progress',
  assignee: {
    type: 'agent',
    id: 'attendant-1',
    name: 'Bia',
  },
};

const statusCounts = {
  all: 1,
  pending: 1,
  in_progress: 0,
  completed: 0,
};

function renderConversationsPage() {
  const session = {
    user: {
      id: 'attendant-1',
      name: 'Bia',
      email: 'bia@example.test',
      role: 'atendente' as const,
      companyId: 'company-1',
    },
    permissions: { uploadCompanyCover: false },
  };

  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<Outlet context={session} />} path="/">
          <Route element={<ConversationsPage />} index />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function setupApiMocks() {
  vi.mocked(listConversations).mockResolvedValue({
    conversations: [conversation],
    total: 1,
    statusCounts,
  });
  vi.mocked(getConversation).mockResolvedValue(conversation);
  vi.mocked(getConversationMessages).mockResolvedValue([customerMessage]);
  vi.mocked(sendConversationMessage).mockResolvedValue({
    id: 'message-agent-1',
    sender: 'agent',
    text: 'Vou verificar o seu pedido.',
    createdAt: '2026-11-23T12:05:00.000Z',
  });
  vi.mocked(updateConversationAssignment).mockResolvedValue({
    ...assignedConversation,
  });
  vi.mocked(updateConversationStatus).mockImplementation(async (_id, status) => ({
    ...assignedConversation,
    status,
  }));
}

describe('ConversationsPage', () => {
  beforeEach(() => {
    vi.mocked(getConversation).mockReset();
    vi.mocked(getConversationMessages).mockReset();
    vi.mocked(listConversations).mockReset();
    vi.mocked(sendConversationMessage).mockReset();
    vi.mocked(updateConversationAssignment).mockReset();
    vi.mocked(updateConversationStatus).mockReset();
    setupApiMocks();
  });

  it('loads conversations and their persisted message history from the API', async () => {
    renderConversationsPage();

    await waitFor(() => {
      expect(getConversation).toHaveBeenCalledWith(
        conversation.id,
        expect.any(AbortSignal),
      );
    });
    expect(
      await screen.findByRole('heading', { name: 'João Pedroso' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Meu pedido ainda não chegou.')).not.toHaveLength(0);
    expect(listConversations).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'all', query: '' }),
    );
    expect(getConversationMessages).toHaveBeenCalledWith(
      conversation.id,
      expect.any(AbortSignal),
    );
    expect(
      within(screen.getByRole('region', { name: 'Lista de conversas' })).getByRole(
        'listitem',
      ),
    ).toBeInTheDocument();
  });

  it('sends a reply only through the API and shows it after success', async () => {
    const user = userEvent.setup();
    vi.mocked(getConversation).mockResolvedValue(assignedConversation);
    renderConversationsPage();

    const composer = await screen.findByRole('textbox', {
      name: 'Digite uma mensagem',
    });
    await user.type(composer, 'Vou verificar o seu pedido.');
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

    expect(sendConversationMessage).toHaveBeenCalledWith(
      conversation.id,
      'Vou verificar o seu pedido.',
    );
    expect(await screen.findAllByText('Vou verificar o seu pedido.')).not.toHaveLength(
      0,
    );
  });

  it('does not clear a reply draft or show success when the API rejects it', async () => {
    const user = userEvent.setup();
    vi.mocked(getConversation).mockResolvedValue(assignedConversation);
    vi.mocked(sendConversationMessage).mockRejectedValue(
      new ApiError('Não foi possível enviar a mensagem.', 503),
    );
    renderConversationsPage();

    const composer = await screen.findByRole('textbox', {
      name: 'Digite uma mensagem',
    });
    await user.type(composer, 'Mensagem que falhou');
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível enviar a mensagem.',
    );
    expect(composer).toHaveValue('Mensagem que falhou');
    expect(
      screen
        .getAllByRole('article')
        .some((message) => message.textContent?.includes('Mensagem que falhou')),
    ).toBe(false);
  });

  it('assumes the selected conversation only after the API confirms the change', async () => {
    const user = userEvent.setup();
    vi.mocked(getConversation)
      .mockResolvedValueOnce(conversation)
      .mockResolvedValue(assignedConversation);
    vi.mocked(updateConversationAssignment).mockResolvedValue(assignedConversation);
    renderConversationsPage();

    const assumeButtons = await screen.findAllByRole('button', {
      name: 'Assumir atendimento',
    });
    await user.click(assumeButtons[0]);

    expect(updateConversationAssignment).toHaveBeenCalledWith(
      conversation.id,
      'assume',
    );
    expect(await screen.findByText('Com Bia')).toBeInTheDocument();
  });

  it('returns an assigned conversation to the bot through the API', async () => {
    const user = userEvent.setup();
    vi.mocked(getConversation)
      .mockResolvedValueOnce(assignedConversation)
      .mockResolvedValue(conversation);
    vi.mocked(updateConversationAssignment).mockResolvedValue(conversation);
    renderConversationsPage();

    const returnButtons = await screen.findAllByRole('button', {
      name: 'Devolver ao bot',
    });
    await user.click(returnButtons[0]);

    expect(updateConversationAssignment).toHaveBeenCalledWith(
      conversation.id,
      'return_to_bot',
    );
    expect(await screen.findByText('Com o assistente Civix')).toBeInTheDocument();
    expect(
      await screen.findAllByRole('button', { name: 'Assumir atendimento' }),
    ).not.toHaveLength(0);
  });

  it('finalizes and reopens a conversation only after the API confirms each action', async () => {
    const user = userEvent.setup();
    const completedConversation: ConversationSummary = {
      ...assignedConversation,
      status: 'completed',
    };
    const reopenedConversation: ConversationSummary = {
      ...conversation,
      status: 'pending',
    };
    vi.mocked(getConversation)
      .mockResolvedValueOnce(assignedConversation)
      .mockResolvedValueOnce(completedConversation)
      .mockResolvedValue(reopenedConversation);
    vi.mocked(updateConversationStatus)
      .mockResolvedValueOnce(completedConversation)
      .mockResolvedValueOnce(reopenedConversation);
    renderConversationsPage();

    await user.click(
      await screen.findByRole('button', { name: 'Finalizar atendimento' }),
    );
    expect(
      await screen.findByText(
        'Atendimento finalizado. Reabra para continuar a conversa.',
      ),
    ).toBeInTheDocument();

    const reopenButtons = screen.getAllByRole('button', { name: 'Reabrir' });
    await user.click(reopenButtons[0]);

    expect(updateConversationStatus).toHaveBeenNthCalledWith(
      1,
      conversation.id,
      'completed',
    );
    expect(updateConversationStatus).toHaveBeenNthCalledWith(
      2,
      conversation.id,
      'pending',
    );
    expect(
      await screen.findAllByRole('button', { name: 'Assumir atendimento' }),
    ).not.toHaveLength(0);
  });

  it('shows API failures instead of substituting an empty conversation list', async () => {
    vi.mocked(listConversations).mockRejectedValue(new ApiError('Acesso negado.', 403));
    renderConversationsPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Acesso negado.');
    expect(screen.queryByText('Nenhuma conversa encontrada')).not.toBeInTheDocument();
  });
});
