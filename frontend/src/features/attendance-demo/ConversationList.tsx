import { AlertCircle, CheckCheck, Search } from 'lucide-react';

import { ConversationAvatar } from './ConversationAvatar';
import type { ConversationStatus, DemoConversation } from './attendance-demo.types';

export type ConversationFilter = 'all' | ConversationStatus;

interface ConversationListProps {
  allConversations: DemoConversation[];
  conversations: DemoConversation[];
  selectedConversationId: string;
  filter: ConversationFilter;
  searchTerm: string;
  onFilterChange: (filter: ConversationFilter) => void;
  onSearchChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
}

const filters: { id: ConversationFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'in_progress', label: 'Em atendimento' },
  { id: 'completed', label: 'Finalizadas' },
];

const statusLabels: Record<ConversationStatus, string> = {
  pending: 'Aguardando',
  in_progress: 'Em atendimento',
  completed: 'Finalizada',
};

function getLastMessage(conversation: DemoConversation) {
  return conversation.messages[conversation.messages.length - 1];
}

function getMessagePreview(conversation: DemoConversation): string {
  const message = getLastMessage(conversation);
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

function getActivityTime(timestamp: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export function ConversationList({
  allConversations,
  conversations,
  selectedConversationId,
  filter,
  searchTerm,
  onFilterChange,
  onSearchChange,
  onSelectConversation,
}: ConversationListProps) {
  return (
    <section
      aria-label="Lista de conversas"
      className="flex min-h-0 w-full min-w-0 flex-col bg-white"
    >
      <div className="border-b border-slate-200 px-4 pb-4 pt-5 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-civix-navy)]">
              Conversas
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {allConversations.length} atendimentos na demonstração
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            Bot ativo
          </span>
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">Pesquisar clientes</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-civix-gold-accessible)] focus:bg-white focus:ring-2 focus:ring-[rgba(154,101,0,0.12)]"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nome..."
            type="search"
            value={searchTerm}
          />
        </label>

        <div
          aria-label="Filtrar conversas por status"
          className="mt-4 grid grid-cols-2 gap-1"
          role="group"
        >
          {filters.map(({ id, label }) => {
            const count =
              id === 'all'
                ? allConversations.length
                : allConversations.filter((conversation) => conversation.status === id)
                    .length;

            return (
              <button
                aria-pressed={filter === id}
                className={`min-h-8 rounded-md px-2 text-left text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-civix-gold-accessible)] ${
                  filter === id
                    ? 'bg-[var(--color-civix-navy)] text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                key={id}
                onClick={() => onFilterChange(id)}
                type="button"
              >
                {label}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
        {conversations.map((conversation) => {
          const isSelected = conversation.id === selectedConversationId;
          const lastMessage = getLastMessage(conversation);

          return (
            <li key={conversation.id}>
              <button
                aria-current={isSelected ? 'true' : undefined}
                aria-label={`${conversation.customerName}, ${statusLabels[conversation.status]}${
                  conversation.unreadCount > 0
                    ? `, ${conversation.unreadCount} mensagens não lidas`
                    : ''
                }`}
                className={`flex min-h-[88px] w-full items-start gap-3 border-l-[3px] px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--color-civix-gold-accessible)] sm:px-5 ${
                  isSelected
                    ? 'border-l-[var(--color-civix-gold-accessible)] bg-[#f7f5ef]'
                    : 'border-l-transparent hover:bg-slate-50'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
                type="button"
              >
                <ConversationAvatar
                  color={conversation.avatarColor}
                  initials={conversation.initials}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {conversation.customerName}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {getActivityTime(conversation.updatedAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {conversation.companyName}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                      {lastMessage?.sender === 'customer' ? null : (
                        <CheckCheck
                          aria-hidden="true"
                          className="mr-1 inline size-3.5 text-slate-400"
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
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--color-civix-navy)] text-[10px] font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="sr-only">{statusLabels[conversation.status]}</span>
                </span>
              </button>
            </li>
          );
        })}
        {conversations.length === 0 && (
          <li className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              Nenhuma conversa encontrada
            </p>
            <p className="mt-1 text-xs text-slate-500">Tente outro nome ou filtro.</p>
          </li>
        )}
      </ul>
    </section>
  );
}
