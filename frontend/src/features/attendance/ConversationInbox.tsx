import { AlertCircle, CheckCheck, Search } from 'lucide-react';

import type {
  ConversationStatus,
  ConversationStatusCounts,
  ConversationSummary,
} from '@/lib/api';

import { ConversationAvatar } from './ConversationAvatar';

type ConversationFilter = ConversationStatus | 'all';

interface ConversationInboxProps {
  conversations: ConversationSummary[];
  selectedConversationId: string | null;
  filter: ConversationFilter;
  searchTerm: string;
  total: number;
  statusCounts: ConversationStatusCounts;
  isLoading: boolean;
  error: string | null;
  onFilterChange: (filter: ConversationFilter) => void;
  onSearchChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onRetry: () => void;
}

const filters: { id: ConversationFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'in_progress', label: 'Em atendimento' },
  { id: 'completed', label: 'Resolvidas' },
];

const statusLabels: Record<ConversationStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em atendimento',
  completed: 'Resolvida',
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('pt-BR'))
    .join('');
}

function getActivityTime(timestamp: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function getMessagePreview(conversation: ConversationSummary): string {
  const message = conversation.lastMessage;
  if (!message) {
    return 'Nenhuma mensagem';
  }

  if (message.sender === 'bot') {
    return `Civix: ${message.text}`;
  }

  if (message.sender === 'agent') {
    return `Você: ${message.text}`;
  }

  return message.text;
}

export function ConversationInbox({
  conversations,
  selectedConversationId,
  filter,
  searchTerm,
  total,
  statusCounts,
  isLoading,
  error,
  onFilterChange,
  onSearchChange,
  onSelectConversation,
  onRetry,
}: ConversationInboxProps) {
  return (
    <section
      aria-label="Lista de conversas"
      className="flex min-h-0 w-full min-w-0 flex-col bg-[var(--dashboard-surface)]"
    >
      <div className="border-b border-[var(--dashboard-border)] px-4 pb-4 pt-5 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dashboard-text)]">
              Conversas
            </h2>
            <p className="mt-1 text-xs text-[var(--dashboard-muted)]">
              {total} atendimentos
            </p>
          </div>
          <span
            aria-label={`${total} conversas`}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--dashboard-accent)] text-xs font-bold text-white"
          >
            {total}
          </span>
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">Pesquisar clientes</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--dashboard-subtle)]"
          />
          <input
            className="h-10 w-full rounded-lg border border-[var(--dashboard-border)] bg-[var(--dashboard-bg)] pl-9 pr-3 text-sm text-[var(--dashboard-text)] outline-none transition placeholder:text-[var(--dashboard-subtle)] focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-accent-soft)]"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar conversas"
            type="search"
            value={searchTerm}
          />
        </label>

        <div
          aria-label="Filtrar conversas por status"
          className="mt-3 flex flex-wrap gap-1.5"
          role="group"
        >
          {filters.map(({ id, label }) => {
            const count = statusCounts[id];

            return (
              <button
                aria-pressed={filter === id}
                className={`min-h-8 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dashboard-accent)] ${
                  filter === id
                    ? 'border-[var(--dashboard-accent)] bg-[var(--dashboard-accent)] text-white'
                    : 'border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] text-[var(--dashboard-muted)] hover:bg-[var(--dashboard-bg)] hover:text-[var(--dashboard-text)]'
                }`}
                key={id}
                onClick={() => onFilterChange(id)}
                type="button"
              >
                {label}
                <span className="ml-1 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          className="m-4 rounded-lg border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-bg)] p-3"
          role="alert"
        >
          <p className="flex items-start gap-2 text-xs leading-5 text-[var(--dashboard-warning-text)]">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
          <button
            className="mt-2 text-xs font-semibold text-[var(--dashboard-warning-text)] underline underline-offset-2"
            onClick={onRetry}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <ul
        aria-busy={isLoading}
        className="min-h-0 flex-1 divide-y divide-[var(--dashboard-border)] overflow-y-auto"
      >
        {conversations.map((conversation) => {
          const isSelected = conversation.id === selectedConversationId;
          const statusLabel = statusLabels[conversation.status];

          return (
            <li key={conversation.id}>
              <button
                aria-current={isSelected ? 'true' : undefined}
                aria-label={`${conversation.customer.name}, ${statusLabel}${
                  conversation.unreadCount > 0
                    ? `, ${conversation.unreadCount} mensagens não lidas`
                    : ''
                }`}
                className={`flex min-h-[84px] w-full items-start gap-3 border-l-[3px] px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--dashboard-accent)] sm:px-5 ${
                  isSelected
                    ? 'border-l-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)]'
                    : 'border-l-transparent hover:bg-[var(--dashboard-bg)]'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
                type="button"
              >
                <ConversationAvatar
                  color="bg-[var(--dashboard-accent)]"
                  initials={getInitials(conversation.customer.name)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-[var(--dashboard-text)]">
                      {conversation.customer.name}
                    </span>
                    <time
                      className="shrink-0 text-[11px] text-[var(--dashboard-subtle)]"
                      dateTime={conversation.updatedAt}
                    >
                      {getActivityTime(conversation.updatedAt)}
                    </time>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--dashboard-muted)]">
                    {conversation.company.name}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate text-xs text-[var(--dashboard-muted)]">
                      {conversation.lastMessage?.sender !== 'customer' && (
                        <CheckCheck
                          aria-hidden="true"
                          className="mr-1 inline size-3.5 text-[var(--dashboard-subtle)]"
                        />
                      )}
                      {getMessagePreview(conversation)}
                    </span>
                    {conversation.attention && (
                      <AlertCircle
                        aria-label="Precisa de atenção"
                        className="size-3.5 shrink-0 text-amber-600"
                      />
                    )}
                    {conversation.unreadCount > 0 && (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--dashboard-accent)] text-[10px] font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="sr-only">{statusLabel}</span>
                </span>
              </button>
            </li>
          );
        })}

        {!isLoading && !error && conversations.length === 0 && (
          <li className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-[var(--dashboard-text)]">
              Nenhuma conversa encontrada
            </p>
            <p className="mt-1 text-xs text-[var(--dashboard-muted)]">
              Tente outro nome ou filtro.
            </p>
          </li>
        )}

        {isLoading && conversations.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-[var(--dashboard-muted)]">
            Carregando conversas…
          </li>
        )}
      </ul>
    </section>
  );
}
