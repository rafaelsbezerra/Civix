import {
  ArrowLeft,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  CornerUpLeft,
  MapPin,
  Phone,
  Send,
  UserRoundCheck,
} from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';

import { ConversationAvatar } from './ConversationAvatar';
import type { DemoConversation, DemoMessage } from './attendance-demo.types';

interface ConversationThreadProps {
  conversation: DemoConversation;
  onBackToList: () => void;
  onAssume: () => void;
  onReturnToBot: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onSend: (text: string) => void;
}

const statusLabels = {
  pending: 'Aguardando atendimento',
  in_progress: 'Em atendimento',
  completed: 'Atendimento finalizado',
} as const;

function MessageBubble({ message }: { message: DemoMessage }) {
  if (message.sender === 'system') {
    return (
      <li className="flex justify-center py-1">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] text-slate-500 shadow-sm">
          <CheckCircle2 aria-hidden="true" className="size-3.5" />
          {message.text}
          <time>{message.time}</time>
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
        : 'Bia · Atendente';

  return (
    <li className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
      <article
        className={`max-w-[min(82%,38rem)] rounded-2xl px-3.5 py-2.5 shadow-sm sm:px-4 ${
          isCustomer
            ? 'rounded-tl-md border border-slate-200 bg-white text-slate-800'
            : message.sender === 'bot'
              ? 'rounded-tr-md border border-[#e6d7b5] bg-[#f7f1e4] text-slate-800'
              : 'rounded-tr-md bg-[var(--color-civix-navy)] text-white'
        }`}
      >
        <p
          className={`mb-1 text-[10px] font-semibold ${
            isCustomer
              ? 'text-slate-500'
              : message.sender === 'bot'
                ? 'text-[var(--color-civix-gold-accessible)]'
                : 'text-white/70'
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
              ? 'text-slate-400'
              : message.sender === 'bot'
                ? 'text-slate-500'
                : 'text-white/60'
          }`}
        >
          <time>{message.time}</time>
          {!isCustomer && <Check aria-hidden="true" className="size-3" />}
        </div>
      </article>
    </li>
  );
}

export function ConversationThread({
  conversation,
  onBackToList,
  onAssume,
  onReturnToBot,
  onComplete,
  onReopen,
  onSend,
}: ConversationThreadProps) {
  const [draft, setDraft] = useState('');
  const isCompleted = conversation.status === 'completed';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isCompleted) {
      return;
    }

    onSend(message);
    setDraft('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const assigneeLabel =
    conversation.assignee === 'agent'
      ? 'Com a atendente Bia'
      : conversation.assignee === 'bot'
        ? 'Com o assistente Civix'
        : 'Sem responsável';

  return (
    <section
      aria-label={`Conversa com ${conversation.customerName}`}
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f6f7f8]"
    >
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            aria-label="Voltar para a lista de conversas"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-civix-gold-accessible)] lg:hidden"
            onClick={onBackToList}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <ConversationAvatar
            color={conversation.avatarColor}
            initials={conversation.initials}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="truncate font-[family-name:var(--font-display)] text-base font-semibold text-slate-900">
                {conversation.customerName}
              </h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  conversation.status === 'completed'
                    ? 'bg-slate-100 text-slate-600'
                    : conversation.status === 'in_progress'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-800'
                }`}
              >
                {statusLabels[conversation.status]}
              </span>
              {conversation.attention && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  Precisa de atenção
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {conversation.companyName}
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {conversation.status === 'completed' ? (
              <button
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-civix-gold-accessible)]"
                onClick={onReopen}
                type="button"
              >
                Reabrir
              </button>
            ) : conversation.assignee === 'agent' ? (
              <button
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-civix-gold-accessible)]"
                onClick={onReturnToBot}
                type="button"
              >
                <Bot aria-hidden="true" className="size-4" />
                Devolver ao bot
              </button>
            ) : (
              <button
                className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[var(--color-civix-navy)] px-3 text-xs font-semibold text-white transition hover:bg-[#102d46] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-civix-gold-accessible)]"
                onClick={onAssume}
                type="button"
              >
                <UserRoundCheck aria-hidden="true" className="size-4" />
                Assumir atendimento
              </button>
            )}
            {conversation.status !== 'completed' && (
              <button
                aria-label="Finalizar atendimento"
                className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-civix-gold-accessible)]"
                onClick={onComplete}
                title="Finalizar atendimento"
                type="button"
              >
                <CheckCircle2 aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Building2 aria-hidden="true" className="size-3.5" />
            {conversation.companyName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5" />
            {conversation.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Phone aria-hidden="true" className="size-3.5" />
            {conversation.phone}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" className="size-3.5" />
            {assigneeLabel}
          </span>
        </div>

        <div className="mt-3 flex gap-2 sm:hidden">
          {conversation.status === 'completed' ? (
            <button
              className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
              onClick={onReopen}
              type="button"
            >
              Reabrir atendimento
            </button>
          ) : conversation.assignee === 'agent' ? (
            <button
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
              onClick={onReturnToBot}
              type="button"
            >
              <Bot aria-hidden="true" className="size-4" />
              Devolver ao bot
            </button>
          ) : (
            <button
              className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[var(--color-civix-navy)] px-3 text-xs font-semibold text-white"
              onClick={onAssume}
              type="button"
            >
              <UserRoundCheck aria-hidden="true" className="size-4" />
              Assumir atendimento
            </button>
          )}
          {conversation.status !== 'completed' && (
            <button
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
              onClick={onComplete}
              type="button"
            >
              <CheckCircle2 aria-hidden="true" className="size-4" />
              Finalizar
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
        <p className="mx-auto mb-4 rounded-full bg-white/80 px-3 py-1 text-[10px] font-medium text-slate-400 shadow-sm">
          Hoje · histórico fictício para demonstração
        </p>
        <ol
          aria-label="Histórico de mensagens"
          className="mt-auto space-y-3"
          role="log"
        >
          {conversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </ol>
      </div>

      <footer className="border-t border-slate-200 bg-white px-3 py-3 sm:px-6">
        {isCompleted ? (
          <p className="flex items-center justify-center gap-2 py-2 text-xs text-slate-500">
            <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-600" />
            Atendimento finalizado. Reabra para continuar a conversa.
          </p>
        ) : (
          <form
            className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-[var(--color-civix-gold-accessible)] focus-within:ring-2 focus-within:ring-[rgba(154,101,0,0.12)]"
            onSubmit={handleSubmit}
          >
            <label className="min-w-0 flex-1">
              <span className="sr-only">Digite uma mensagem</span>
              <textarea
                className="max-h-28 min-h-9 w-full resize-none bg-transparent px-2 py-2 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escreva uma mensagem..."
                rows={1}
                value={draft}
              />
            </label>
            <button
              aria-label="Enviar mensagem"
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--color-civix-navy)] text-white transition hover:bg-[#102d46] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-civix-gold-accessible)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!draft.trim()}
              type="submit"
            >
              <Send aria-hidden="true" className="size-4" />
            </button>
          </form>
        )}
        {!isCompleted && (
          <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400">
            <CornerUpLeft aria-hidden="true" className="size-3" />
            Enter para enviar · Shift + Enter para nova linha
          </p>
        )}
      </footer>
    </section>
  );
}
