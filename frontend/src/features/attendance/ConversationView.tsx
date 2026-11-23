import {
  ArrowLeft,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  MapPin,
  Phone,
  Send,
  UserRoundCheck,
} from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';

import type { ConversationDetail, ConversationMessage } from '@/lib/api';

import { ConversationAvatar } from './ConversationAvatar';

interface ConversationViewProps {
  conversation: ConversationDetail | null;
  currentUserId: string;
  isLoading: boolean;
  isBusy: boolean;
  error: string | null;
  onRetry?: () => void;
  onBackToList: () => void;
  onAssume: () => Promise<void>;
  onReturnToBot: () => Promise<void>;
  onComplete: () => Promise<void>;
  onReopen: () => Promise<void>;
  onSend: (text: string) => Promise<boolean>;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('pt-BR'))
    .join('');
}

function formatMessageTime(timestamp: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  if (message.sender === 'system') {
    return (
      <li className="flex justify-center py-1">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[var(--dashboard-surface)] px-3 py-1.5 text-[11px] text-[var(--dashboard-muted)] shadow-sm">
          <CheckCircle2 aria-hidden="true" className="size-3.5" />
          {message.text}
          <time dateTime={message.createdAt}>
            {formatMessageTime(message.createdAt)}
          </time>
        </p>
      </li>
    );
  }

  const isCustomer = message.sender === 'customer';
  const senderLabel =
    message.sender === 'customer'
      ? 'Cliente'
      : message.sender === 'bot'
        ? 'Civix · Assistente'
        : 'Atendente';

  return (
    <li className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
      <article
        className={`max-w-[min(82%,38rem)] rounded-2xl px-3.5 py-2.5 shadow-sm sm:px-4 ${
          isCustomer
            ? 'rounded-tl-md border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] text-[var(--dashboard-text)]'
            : message.sender === 'bot'
              ? 'rounded-tr-md border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-bg)] text-[var(--dashboard-text)]'
              : 'rounded-tr-md bg-[var(--dashboard-accent)] text-white'
        }`}
      >
        <p
          className={`mb-1 text-[10px] font-semibold ${
            isCustomer
              ? 'text-[var(--dashboard-muted)]'
              : message.sender === 'bot'
                ? 'text-[var(--dashboard-warning-text)]'
                : 'text-white/75'
          }`}
        >
          {senderLabel}
        </p>
        <p className="whitespace-pre-wrap break-words text-[13px] leading-5">
          {message.text}
        </p>
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            isCustomer
              ? 'text-[var(--dashboard-subtle)]'
              : message.sender === 'bot'
                ? 'text-[var(--dashboard-muted)]'
                : 'text-white/65'
          }`}
        >
          <time dateTime={message.createdAt}>
            {formatMessageTime(message.createdAt)}
          </time>
          {!isCustomer && <Check aria-hidden="true" className="size-3" />}
        </div>
      </article>
    </li>
  );
}

export function ConversationView({
  conversation,
  currentUserId,
  isLoading,
  isBusy,
  error,
  onRetry,
  onBackToList,
  onAssume,
  onReturnToBot,
  onComplete,
  onReopen,
  onSend,
}: ConversationViewProps) {
  const [draft, setDraft] = useState('');
  const isCompleted = conversation?.status === 'completed';
  const isAssignedToCurrentUser =
    conversation?.assignee.type === 'agent' &&
    conversation.assignee.id === currentUserId;
  const canAssume =
    conversation?.status === 'pending' &&
    (conversation.assignee.type === 'bot' || conversation.assignee.type === 'none');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();

    if (isBusy || !text || !conversation || isCompleted || !isAssignedToCurrentUser) {
      return;
    }

    if (await onSend(text)) {
      setDraft('');
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const assigneeLabel =
    conversation?.assignee.type === 'agent'
      ? `Com ${conversation.assignee.name}`
      : conversation?.assignee.type === 'bot'
        ? 'Com o assistente Civix'
        : 'Sem responsável';

  return (
    <section
      aria-label={
        conversation
          ? `Conversa com ${conversation.customer.name}`
          : 'Detalhes da conversa'
      }
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--dashboard-bg)]"
    >
      {conversation && (
        <header className="border-b border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              aria-label="Voltar para a lista de conversas"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--dashboard-muted)] transition hover:bg-[var(--dashboard-bg)] hover:text-[var(--dashboard-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--dashboard-accent)] lg:hidden"
              onClick={onBackToList}
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
            </button>
            <ConversationAvatar
              color="bg-[var(--dashboard-accent)]"
              initials={getInitials(conversation.customer.name)}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="truncate font-[family-name:var(--font-display)] text-base font-semibold text-[var(--dashboard-text)]">
                  {conversation.customer.name}
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    conversation.status === 'completed'
                      ? 'bg-[var(--dashboard-bg)] text-[var(--dashboard-muted)]'
                      : conversation.status === 'in_progress'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {conversation.status === 'completed'
                    ? 'Resolvida'
                    : conversation.status === 'in_progress'
                      ? 'Em atendimento'
                      : 'Pendente'}
                </span>
                {conversation.attention && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Precisa de atenção
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-[var(--dashboard-muted)]">
                {conversation.company.name}
              </p>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              {isCompleted ? (
                <button
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-3 text-xs font-semibold text-[var(--dashboard-text)] transition hover:bg-[var(--dashboard-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isBusy}
                  onClick={() => void onReopen()}
                  type="button"
                >
                  Reabrir
                </button>
              ) : canAssume ? (
                <button
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[var(--dashboard-accent)] px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isBusy}
                  onClick={() => void onAssume()}
                  type="button"
                >
                  <UserRoundCheck aria-hidden="true" className="size-4" />
                  Assumir atendimento
                </button>
              ) : isAssignedToCurrentUser ? (
                <button
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-3 text-xs font-semibold text-[var(--dashboard-text)] transition hover:bg-[var(--dashboard-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isBusy}
                  onClick={() => void onReturnToBot()}
                  type="button"
                >
                  <Bot aria-hidden="true" className="size-4" />
                  Devolver ao bot
                </button>
              ) : null}
              {!isCompleted && isAssignedToCurrentUser && (
                <button
                  aria-label="Finalizar atendimento"
                  className="grid size-9 place-items-center rounded-lg text-[var(--dashboard-muted)] transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--dashboard-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isBusy}
                  onClick={() => void onComplete()}
                  title="Finalizar atendimento"
                  type="button"
                >
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--dashboard-border)] pt-3 text-[11px] text-[var(--dashboard-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Building2 aria-hidden="true" className="size-3.5" />
              {conversation.company.name}
            </span>
            {conversation.customer.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-3.5" />
                {conversation.customer.location}
              </span>
            )}
            {conversation.customer.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone aria-hidden="true" className="size-3.5" />
                {conversation.customer.phone}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">{assigneeLabel}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
            {isCompleted ? (
              <button
                className="min-h-9 rounded-lg border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-3 text-xs font-semibold text-[var(--dashboard-text)] disabled:opacity-50"
                disabled={isBusy}
                onClick={() => void onReopen()}
                type="button"
              >
                Reabrir atendimento
              </button>
            ) : canAssume ? (
              <button
                className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[var(--dashboard-accent)] px-3 text-xs font-semibold text-white disabled:opacity-50"
                disabled={isBusy}
                onClick={() => void onAssume()}
                type="button"
              >
                <UserRoundCheck aria-hidden="true" className="size-4" />
                Assumir atendimento
              </button>
            ) : isAssignedToCurrentUser ? (
              <>
                <button
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-3 text-xs font-semibold text-[var(--dashboard-text)] disabled:opacity-50"
                  disabled={isBusy}
                  onClick={() => void onReturnToBot()}
                  type="button"
                >
                  <Bot aria-hidden="true" className="size-4" />
                  Devolver ao bot
                </button>
                <button
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-3 text-xs font-semibold text-[var(--dashboard-text)] disabled:opacity-50"
                  disabled={isBusy}
                  onClick={() => void onComplete()}
                  type="button"
                >
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                  Finalizar
                </button>
              </>
            ) : null}
          </div>
        </header>
      )}

      {error && (
        <div
          className="m-4 rounded-lg border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-bg)] p-3"
          role="alert"
        >
          <p className="text-sm text-[var(--dashboard-warning-text)]">{error}</p>
          {onRetry && (
            <button
              className="mt-2 text-xs font-semibold text-[var(--dashboard-warning-text)] underline underline-offset-2"
              onClick={onRetry}
              type="button"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid flex-1 place-items-center p-6">
          <p aria-live="polite" className="text-sm text-[var(--dashboard-muted)]">
            Carregando conversa…
          </p>
        </div>
      ) : conversation ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
            <ol
              aria-label="Histórico de mensagens"
              aria-live="polite"
              className="mt-auto space-y-3"
              role="log"
            >
              {conversation.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </ol>
            {conversation.messages.length === 0 && (
              <p className="my-auto text-center text-sm text-[var(--dashboard-muted)]">
                Esta conversa ainda não tem mensagens.
              </p>
            )}
          </div>

          <footer className="border-t border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-3 py-3 sm:px-6">
            {isCompleted ? (
              <p className="flex items-center justify-center gap-2 py-2 text-xs text-[var(--dashboard-muted)]">
                <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-600" />
                Atendimento finalizado. Reabra para continuar a conversa.
              </p>
            ) : isAssignedToCurrentUser ? (
              <form
                className="flex items-end gap-2 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-bg)] p-2 focus-within:border-[var(--dashboard-accent)] focus-within:ring-2 focus-within:ring-[var(--dashboard-accent-soft)]"
                onSubmit={(event) => void handleSubmit(event)}
              >
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Digite uma mensagem</span>
                  <textarea
                    className="max-h-28 min-h-9 w-full resize-none bg-transparent px-2 py-2 text-sm leading-5 text-[var(--dashboard-text)] outline-none placeholder:text-[var(--dashboard-subtle)]"
                    disabled={isBusy}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreva uma mensagem..."
                    rows={1}
                    value={draft}
                  />
                </label>
                <button
                  aria-label="Enviar mensagem"
                  className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--dashboard-accent)] text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dashboard-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!draft.trim() || isBusy}
                  type="submit"
                >
                  <Send aria-hidden="true" className="size-4" />
                </button>
              </form>
            ) : (
              <p className="py-2 text-center text-xs text-[var(--dashboard-muted)]">
                Assuma este atendimento para responder.
              </p>
            )}
            {!isCompleted && isAssignedToCurrentUser && (
              <p className="mt-2 text-center text-[10px] text-[var(--dashboard-subtle)]">
                Enter para enviar · Shift + Enter para nova linha
              </p>
            )}
          </footer>
        </>
      ) : (
        !error && (
          <div className="grid flex-1 place-items-center p-6">
            <p className="text-sm text-[var(--dashboard-muted)]">
              Selecione uma conversa para ver o histórico.
            </p>
          </div>
        )
      )}
    </section>
  );
}
