import { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';

import type {
  ConversationDetail,
  ConversationMessage,
  ConversationStatus,
  ConversationStatusCounts,
  SessionProfile,
} from '@/lib/api';

import { ConversationInbox } from './ConversationInbox';
import { ConversationView } from './ConversationView';

type ConversationFilter = ConversationStatus | 'all';

const PREVIEW_SESSION: SessionProfile = {
  user: {
    id: 'preview-attendant',
    name: 'Bia Costa',
    email: 'bia@example.test',
    role: 'atendente',
    companyId: 'preview-company',
  },
  permissions: {
    uploadCompanyCover: false,
  },
};

const PREVIEW_USER_ID = String(PREVIEW_SESSION.user.id);

const PREVIEW_CONVERSATIONS: ConversationDetail[] = [
  {
    id: 'preview-conversation-mariana',
    customer: {
      name: 'Mariana Costa',
      phone: '(11) 0000-0001',
      location: 'São Paulo, SP',
    },
    company: {
      name: 'Lume Interiores',
    },
    status: 'in_progress',
    assignee: {
      type: 'agent',
      id: PREVIEW_USER_ID,
      name: PREVIEW_SESSION.user.name,
    },
    attention: false,
    unreadCount: 0,
    updatedAt: '2026-11-23T12:10:00.000Z',
    lastMessage: {
      id: 'preview-message-mariana-3',
      sender: 'customer',
      text: 'Tenho 2,40 m de largura. Vocês conseguem fazer sob medida?',
      createdAt: '2026-11-23T12:10:00.000Z',
    },
    messages: [
      {
        id: 'preview-message-mariana-1',
        sender: 'customer',
        text: 'Olá! Estou procurando um painel para a sala.',
        createdAt: '2026-11-23T11:50:00.000Z',
      },
      {
        id: 'preview-message-mariana-2',
        sender: 'agent',
        text: 'Olá, Mariana! Consigo ajudar. Qual é a largura aproximada da parede?',
        createdAt: '2026-11-23T12:00:00.000Z',
      },
      {
        id: 'preview-message-mariana-3',
        sender: 'customer',
        text: 'Tenho 2,40 m de largura. Vocês conseguem fazer sob medida?',
        createdAt: '2026-11-23T12:10:00.000Z',
      },
    ],
  },
  {
    id: 'preview-conversation-joao',
    customer: {
      name: 'João Pedroso',
      phone: '(11) 0000-0002',
      location: 'Campinas, SP',
    },
    company: {
      name: 'Lume Interiores',
    },
    status: 'pending',
    assignee: {
      type: 'bot',
    },
    attention: true,
    unreadCount: 2,
    updatedAt: '2026-11-23T12:05:00.000Z',
    lastMessage: {
      id: 'preview-message-joao-2',
      sender: 'customer',
      text: 'Preciso de ajuda para escolher o acabamento.',
      createdAt: '2026-11-23T12:05:00.000Z',
    },
    messages: [
      {
        id: 'preview-message-joao-1',
        sender: 'customer',
        text: 'Olá! Vi um modelo no catálogo e queria tirar uma dúvida.',
        createdAt: '2026-11-23T11:58:00.000Z',
      },
      {
        id: 'preview-message-joao-2',
        sender: 'customer',
        text: 'Preciso de ajuda para escolher o acabamento.',
        createdAt: '2026-11-23T12:05:00.000Z',
      },
    ],
  },
  {
    id: 'preview-conversation-livia',
    customer: {
      name: 'Lívia Martins',
      phone: '(11) 0000-0003',
      location: 'Santo André, SP',
    },
    company: {
      name: 'Lume Interiores',
    },
    status: 'pending',
    assignee: {
      type: 'none',
    },
    attention: false,
    unreadCount: 1,
    updatedAt: '2026-11-23T11:42:00.000Z',
    lastMessage: {
      id: 'preview-message-livia-1',
      sender: 'customer',
      text: 'Vocês têm disponibilidade para uma visita nesta semana?',
      createdAt: '2026-11-23T11:42:00.000Z',
    },
    messages: [
      {
        id: 'preview-message-livia-1',
        sender: 'customer',
        text: 'Vocês têm disponibilidade para uma visita nesta semana?',
        createdAt: '2026-11-23T11:42:00.000Z',
      },
    ],
  },
  {
    id: 'preview-conversation-lucas',
    customer: {
      name: 'Lucas Mendes',
      phone: '(11) 0000-0004',
      location: 'São Paulo, SP',
    },
    company: {
      name: 'Lume Interiores',
    },
    status: 'completed',
    assignee: {
      type: 'agent',
      id: PREVIEW_USER_ID,
      name: PREVIEW_SESSION.user.name,
    },
    attention: false,
    unreadCount: 0,
    updatedAt: '2026-11-22T18:35:00.000Z',
    lastMessage: {
      id: 'preview-message-lucas-2',
      sender: 'agent',
      text: 'Combinado, Lucas. Ficamos à disposição!',
      createdAt: '2026-11-22T18:35:00.000Z',
    },
    messages: [
      {
        id: 'preview-message-lucas-1',
        sender: 'customer',
        text: 'Recebi o orçamento. Obrigado pela atenção.',
        createdAt: '2026-11-22T18:30:00.000Z',
      },
      {
        id: 'preview-message-lucas-2',
        sender: 'agent',
        text: 'Combinado, Lucas. Ficamos à disposição!',
        createdAt: '2026-11-22T18:35:00.000Z',
      },
    ],
  },
];

function getStatusCounts(
  conversations: ConversationDetail[],
): ConversationStatusCounts {
  return conversations.reduce<ConversationStatusCounts>(
    (counts, conversation) => {
      counts.all += 1;
      counts[conversation.status] += 1;
      return counts;
    },
    {
      all: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
    },
  );
}

export function AttendancePreviewSession() {
  return <Outlet context={PREVIEW_SESSION} />;
}

export default function AttendancePreviewPage() {
  const [conversations, setConversations] = useState(PREVIEW_CONVERSATIONS);
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(
    PREVIEW_CONVERSATIONS[0]?.id ?? null,
  );
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);

  const searchedConversations = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('pt-BR');

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      [
        conversation.customer.name,
        conversation.customer.phone,
        conversation.customer.location,
        conversation.company.name,
        conversation.lastMessage?.text,
      ]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase('pt-BR').includes(query)),
    );
  }, [conversations, searchTerm]);

  const statusCounts = useMemo(
    () => getStatusCounts(searchedConversations),
    [searchedConversations],
  );

  const filteredConversations =
    filter === 'all'
      ? searchedConversations
      : searchedConversations.filter((conversation) => conversation.status === filter);
  const selectedConversation =
    filteredConversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ??
    filteredConversations[0] ??
    null;

  function updateSelectedConversation(
    update: (conversation: ConversationDetail) => ConversationDetail,
  ) {
    if (!selectedConversation) {
      return;
    }

    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.id === selectedConversation.id
          ? update(conversation)
          : conversation,
      ),
    );
  }

  function handleAssignment(action: 'assume' | 'return_to_bot'): Promise<void> {
    updateSelectedConversation((conversation) => ({
      ...conversation,
      status: action === 'assume' ? 'in_progress' : 'pending',
      assignee:
        action === 'assume'
          ? {
              type: 'agent',
              id: PREVIEW_USER_ID,
              name: PREVIEW_SESSION.user.name,
            }
          : { type: 'bot' },
      unreadCount: action === 'assume' ? 0 : conversation.unreadCount,
      updatedAt: new Date().toISOString(),
    }));

    return Promise.resolve();
  }

  function handleStatusChange(
    status: Extract<ConversationStatus, 'pending' | 'completed'>,
  ): Promise<void> {
    updateSelectedConversation((conversation) => ({
      ...conversation,
      status,
      assignee: status === 'pending' ? { type: 'bot' } : conversation.assignee,
      updatedAt: new Date().toISOString(),
    }));

    return Promise.resolve();
  }

  function handleSendMessage(text: string): Promise<boolean> {
    if (!selectedConversation) {
      return Promise.resolve(false);
    }

    const message: ConversationMessage = {
      id: `preview-message-${Date.now()}`,
      sender: 'agent',
      text,
      createdAt: new Date().toISOString(),
    };

    updateSelectedConversation((conversation) => ({
      ...conversation,
      lastMessage: message,
      updatedAt: message.createdAt,
      unreadCount: 0,
      messages: [...conversation.messages, message],
    }));

    return Promise.resolve(true);
  }

  function handleSelectConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    setIsMobileConversationOpen(true);
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col">
      <aside
        aria-label="Prévia local"
        className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        role="note"
      >
        <strong>Prévia local:</strong> dados fictícios. As ações ficam apenas nesta
        página; nada é salvo nem enviado à API.
      </aside>

      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--dashboard-accent-text)]">
            Painel do atendente
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--dashboard-text)] sm:text-3xl">
            Conversas
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--dashboard-muted)]">
            Visualize a lista, o histórico e as ações previstas para o atendimento.
          </p>
        </div>
        <p className="text-xs text-[var(--dashboard-subtle)]">
          Atendimento vinculado à sua empresa
        </p>
      </header>

      <div
        className="mt-5 grid min-h-[520px] flex-1 overflow-hidden rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] shadow-sm lg:grid-cols-[320px_minmax(0,1fr)]"
        data-testid="attendance-preview-workspace"
      >
        <div
          className={`h-full min-h-0 min-w-0 ${
            isMobileConversationOpen ? 'hidden' : 'flex'
          } border-r border-[var(--dashboard-border)] lg:flex`}
        >
          <ConversationInbox
            conversations={filteredConversations}
            error={null}
            filter={filter}
            isLoading={false}
            onFilterChange={setFilter}
            onRetry={() => setConversations(PREVIEW_CONVERSATIONS)}
            onSearchChange={setSearchTerm}
            onSelectConversation={handleSelectConversation}
            searchTerm={searchTerm}
            selectedConversationId={selectedConversation?.id ?? null}
            statusCounts={statusCounts}
            total={filteredConversations.length}
          />
        </div>

        <div
          className={`h-full min-h-0 min-w-0 ${
            isMobileConversationOpen ? 'flex' : 'hidden'
          } lg:flex`}
        >
          <ConversationView
            conversation={selectedConversation}
            currentUserId={PREVIEW_USER_ID}
            error={null}
            isBusy={false}
            isLoading={false}
            onAssume={() => handleAssignment('assume')}
            onBackToList={() => setIsMobileConversationOpen(false)}
            onComplete={() => handleStatusChange('completed')}
            onReopen={() => handleStatusChange('pending')}
            onReturnToBot={() => handleAssignment('return_to_bot')}
            onSend={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
}
