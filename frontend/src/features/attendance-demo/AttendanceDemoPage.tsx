import { ArrowUpRight, Bot, Headset, MessageSquareText, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import logoCivix from '@/assets/civix/logo-civix.png';

import { ConversationList, type ConversationFilter } from './ConversationList';
import { ConversationThread } from './ConversationThread';
import { initialDemoConversations } from './attendance-demo.data';
import type {
  ConversationAssignee,
  DemoConversation,
  DemoMessage,
} from './attendance-demo.types';

function getCurrentTime(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

function createSystemMessage(text: string): DemoMessage {
  return {
    id: `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender: 'system',
    text,
    time: getCurrentTime(),
  };
}

export default function AttendanceDemoPage() {
  const [conversations, setConversations] = useState(initialDemoConversations);
  const [selectedConversationId, setSelectedConversationId] = useState(
    initialDemoConversations[0].id,
  );
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Central de Atendimento | Civix';

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR');

    return conversations
      .filter((conversation) => filter === 'all' || conversation.status === filter)
      .filter(
        (conversation) =>
          !normalizedSearch ||
          conversation.customerName
            .toLocaleLowerCase('pt-BR')
            .includes(normalizedSearch) ||
          conversation.companyName
            .toLocaleLowerCase('pt-BR')
            .includes(normalizedSearch),
      )
      .sort((left, right) => right.updatedAt - left.updatedAt);
  }, [conversations, filter, searchTerm]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ??
    conversations[0];

  function updateConversation(
    conversationId: string,
    update: (conversation: DemoConversation) => DemoConversation,
  ) {
    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.id === conversationId ? update(conversation) : conversation,
      ),
    );
  }

  function addSystemEvent(
    conversationId: string,
    text: string,
    changes: Partial<
      Pick<
        DemoConversation,
        'assignee' | 'status' | 'attention' | 'unreadCount' | 'updatedAt'
      >
    >,
  ) {
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      ...changes,
      updatedAt: Date.now(),
      messages: [...conversation.messages, createSystemMessage(text)],
    }));
  }

  function handleSelectConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    setIsMobileConversationOpen(true);
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      unreadCount: 0,
    }));
  }

  function handleAssign(assignee: ConversationAssignee) {
    if (assignee === 'agent') {
      addSystemEvent(selectedConversation.id, 'Conversa assumida por Bia', {
        assignee: 'agent',
        status: 'in_progress',
        attention: false,
      });
      return;
    }

    addSystemEvent(selectedConversation.id, 'Conversa devolvida ao assistente Civix', {
      assignee: 'bot',
      status: 'pending',
      attention: false,
    });
  }

  function handleComplete() {
    addSystemEvent(selectedConversation.id, 'Atendimento finalizado por Bia', {
      assignee: 'none',
      status: 'completed',
      attention: false,
    });
  }

  function handleReopen() {
    addSystemEvent(
      selectedConversation.id,
      'Atendimento reaberto e devolvido ao assistente Civix',
      {
        assignee: 'bot',
        status: 'pending',
        attention: false,
      },
    );
  }

  function handleSendMessage(text: string) {
    if (selectedConversation.status === 'completed') {
      return;
    }

    const sender = selectedConversation.assignee === 'agent' ? 'agent' : 'bot';
    const message: DemoMessage = {
      id: `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender,
      text,
      time: getCurrentTime(),
    };

    updateConversation(selectedConversation.id, (conversation) => ({
      ...conversation,
      attention: false,
      unreadCount: 0,
      updatedAt: Date.now(),
      messages: [...conversation.messages, message],
    }));
  }

  return (
    <div className="min-h-screen bg-[#f4f6f7] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1720px] items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Link
            aria-label="Civix — voltar ao site"
            className="inline-flex shrink-0 items-center"
            to="/"
          >
            <img
              alt="Civix"
              className="h-7 w-[92px] object-contain"
              height="28"
              src={logoCivix}
              width="92"
            />
          </Link>

          <span aria-hidden="true" className="hidden h-7 w-px bg-slate-200 sm:block" />

          <nav
            aria-label="Navegação principal"
            className="flex min-w-0 flex-1 items-center"
          >
            <a
              aria-current="page"
              className="inline-flex h-16 items-center gap-2 border-b-2 border-[var(--color-civix-gold-accessible)] px-2 text-sm font-semibold text-[var(--color-civix-navy)] sm:px-3"
              href="#central-de-atendimento"
            >
              <MessageSquareText aria-hidden="true" className="size-4" />
              Atendimento
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#f7f5ef] px-3 py-1.5 text-[11px] font-semibold text-[var(--color-civix-gold-accessible)]">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[#9a6500]" />
            <span className="hidden sm:inline">Demonstração interativa</span>
            <span className="sm:hidden">Demo</span>
          </div>
        </div>
      </header>

      <main
        className="mx-auto max-w-[1720px] px-3 pb-5 pt-5 sm:px-6 sm:pt-7 lg:px-8"
        id="central-de-atendimento"
      >
        <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-6 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-civix-gold-accessible)]">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Experiência de demonstração
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--color-civix-navy)] sm:text-3xl">
              Central de atendimento
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
              Acompanhe conversas, assuma atendimentos e responda clientes em um só
              lugar.
            </p>
          </div>
          <div className="flex max-w-xl items-start gap-2.5 rounded-lg border border-[#e7dfce] bg-[#fbf8f0] px-3 py-2.5 text-[11px] leading-4 text-slate-600 sm:max-w-sm">
            <Bot
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[var(--color-civix-gold-accessible)]"
            />
            <p>
              <strong className="font-semibold text-slate-800">
                Ambiente demonstrativo.
              </strong>{' '}
              Os clientes e as mensagens são fictícios. WhatsApp e tempo real ainda não
              estão conectados.
            </p>
          </div>
        </div>

        <div
          className="grid h-[min(730px,calc(100vh-240px))] min-h-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(7,25,42,0.06)] lg:grid-cols-[350px_minmax(0,1fr)]"
          data-testid="attendance-workspace"
        >
          <div
            className={`h-full min-h-0 min-w-0 ${
              isMobileConversationOpen ? 'hidden' : 'flex'
            } border-r border-slate-200 lg:flex`}
          >
            <ConversationList
              allConversations={conversations}
              conversations={filteredConversations}
              filter={filter}
              onFilterChange={setFilter}
              onSearchChange={setSearchTerm}
              onSelectConversation={handleSelectConversation}
              searchTerm={searchTerm}
              selectedConversationId={selectedConversationId}
            />
          </div>

          <div
            className={`h-full min-h-0 min-w-0 ${
              isMobileConversationOpen ? 'flex' : 'hidden'
            } lg:flex`}
          >
            <ConversationThread
              conversation={selectedConversation}
              key={selectedConversation.id}
              onAssume={() => handleAssign('agent')}
              onBackToList={() => setIsMobileConversationOpen(false)}
              onComplete={handleComplete}
              onReopen={handleReopen}
              onReturnToBot={() => handleAssign('bot')}
              onSend={handleSendMessage}
            />
          </div>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <Headset aria-hidden="true" className="size-3.5" />
          Interações realizadas nesta tela são temporárias e não são salvas.
          <ArrowUpRight aria-hidden="true" className="hidden size-3.5 sm:inline" />
        </p>
      </main>
    </div>
  );
}
