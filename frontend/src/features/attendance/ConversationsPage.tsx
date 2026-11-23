import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import {
  ApiError,
  getConversation,
  getConversationMessages,
  listConversations,
  sendConversationMessage,
  updateConversationAssignment,
  updateConversationStatus,
  type ConversationDetail,
  type ConversationListResult,
  type ConversationMessage,
  type ConversationStatus,
  type ConversationStatusCounts,
  type ConversationSummary,
  type SessionProfile,
} from '@/lib/api';

import { ConversationInbox } from './ConversationInbox';
import { ConversationView } from './ConversationView';

type ConversationFilter = ConversationStatus | 'all';
type ConversationAction = 'assignment' | 'status' | 'message';

interface ConversationListSnapshot {
  key: string;
  result?: ConversationListResult;
  error?: string;
}

interface ConversationDetailSnapshot {
  key: string;
  conversation?: ConversationDetail;
  error?: string;
}

const emptyStatusCounts: ConversationStatusCounts = {
  all: 0,
  pending: 0,
  in_progress: 0,
  completed: 0,
};

function getPublicError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
}

function getConversationDetail(
  summary: ConversationSummary,
  messages: ConversationMessage[],
): ConversationDetail {
  return {
    ...summary,
    messages,
  };
}

export default function ConversationsPage() {
  const session = useOutletContext<SessionProfile>();
  const currentUserId = String(session.user.id);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    null,
  );
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ConversationAction | null>(null);
  const [listVersion, setListVersion] = useState(0);
  const [conversationVersion, setConversationVersion] = useState(0);
  const [listSnapshot, setListSnapshot] = useState<ConversationListSnapshot>();
  const [detailSnapshot, setDetailSnapshot] = useState<ConversationDetailSnapshot>();
  const listKey = JSON.stringify([filter, debouncedSearchTerm, listVersion]);
  const detailKey = JSON.stringify([selectedConversationId, conversationVersion]);
  const conversations = listSnapshot?.result?.conversations ?? [];
  const total = listSnapshot?.result?.total ?? 0;
  const statusCounts = listSnapshot?.result?.statusCounts ?? emptyStatusCounts;
  const selectedConversation =
    detailSnapshot?.key === detailKey ? (detailSnapshot.conversation ?? null) : null;
  const listError = listSnapshot?.key === listKey ? (listSnapshot.error ?? null) : null;
  const conversationError =
    detailSnapshot?.key === detailKey ? (detailSnapshot.error ?? null) : null;
  const isListLoading = listSnapshot?.key !== listKey;
  const isConversationLoading =
    selectedConversationId !== null && detailSnapshot?.key !== detailKey;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();

    listConversations({
      status: filter,
      query: debouncedSearchTerm,
      signal: controller.signal,
    })
      .then((result: ConversationListResult) => {
        setListSnapshot({ key: listKey, result });
        setSelectedConversationId((currentId) => {
          if (
            currentId &&
            result.conversations.some((conversation) => conversation.id === currentId)
          ) {
            return currentId;
          }

          return result.conversations[0]?.id ?? null;
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setListSnapshot((currentSnapshot) => ({
          key: listKey,
          result: currentSnapshot?.result,
          error: getPublicError(error),
        }));
      });

    return () => {
      controller.abort();
    };
  }, [filter, debouncedSearchTerm, listVersion, listKey]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const controller = new AbortController();

    Promise.all([
      getConversation(selectedConversationId, controller.signal),
      getConversationMessages(selectedConversationId, controller.signal),
    ])
      .then(([conversation, messages]) => {
        setDetailSnapshot({
          key: detailKey,
          conversation: getConversationDetail(conversation, messages),
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setDetailSnapshot({
          key: detailKey,
          error: getPublicError(error),
        });
      });

    return () => {
      controller.abort();
    };
  }, [selectedConversationId, conversationVersion, detailKey]);

  function updateConversationInList(updatedConversation: ConversationSummary) {
    setListSnapshot((currentSnapshot) => {
      if (!currentSnapshot?.result) {
        return currentSnapshot;
      }

      return {
        ...currentSnapshot,
        result: {
          ...currentSnapshot.result,
          conversations: currentSnapshot.result.conversations.map((conversation) =>
            conversation.id === updatedConversation.id
              ? updatedConversation
              : conversation,
          ),
        },
      };
    });

    setDetailSnapshot((currentSnapshot) => {
      if (
        currentSnapshot?.key !== detailKey ||
        !currentSnapshot.conversation ||
        currentSnapshot.conversation.id !== updatedConversation.id
      ) {
        return currentSnapshot;
      }

      return {
        ...currentSnapshot,
        conversation: {
          ...updatedConversation,
          messages: currentSnapshot.conversation.messages,
        },
      };
    });
  }

  async function handleAssignment(action: 'assume' | 'return_to_bot'): Promise<void> {
    if (!selectedConversationId) {
      return;
    }

    setActiveAction('assignment');
    setActionError(null);

    try {
      const updatedConversation = await updateConversationAssignment(
        selectedConversationId,
        action,
      );
      updateConversationInList(updatedConversation);
      setListVersion((version) => version + 1);
      setConversationVersion((version) => version + 1);
    } catch (error: unknown) {
      setActionError(getPublicError(error));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleStatusChange(
    status: Extract<ConversationStatus, 'pending' | 'completed'>,
  ): Promise<void> {
    if (!selectedConversationId) {
      return;
    }

    setActiveAction('status');
    setActionError(null);

    try {
      const updatedConversation = await updateConversationStatus(
        selectedConversationId,
        status,
      );
      updateConversationInList(updatedConversation);
      setListVersion((version) => version + 1);
      setConversationVersion((version) => version + 1);
    } catch (error: unknown) {
      setActionError(getPublicError(error));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSendMessage(text: string): Promise<boolean> {
    if (!selectedConversationId || !selectedConversation) {
      return false;
    }

    setActiveAction('message');
    setActionError(null);

    try {
      const message = await sendConversationMessage(selectedConversationId, text);
      const updatedConversation: ConversationDetail = {
        ...selectedConversation,
        lastMessage: message,
        updatedAt: message.createdAt,
        unreadCount: 0,
        messages: [...selectedConversation.messages, message],
      };

      setDetailSnapshot({
        key: detailKey,
        conversation: updatedConversation,
      });
      updateConversationInList(updatedConversation);
      setListVersion((version) => version + 1);
      return true;
    } catch (error: unknown) {
      setActionError(getPublicError(error));
      return false;
    } finally {
      setActiveAction(null);
    }
  }

  function handleSelectConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    setIsMobileConversationOpen(true);
    setActionError(null);
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--dashboard-accent-text)]">
            Painel do atendente
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--dashboard-text)] sm:text-3xl">
            Conversas
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--dashboard-muted)]">
            Consulte e responda os atendimentos disponíveis para você.
          </p>
        </div>
        <p className="text-xs text-[var(--dashboard-subtle)]">
          Atendimento vinculado à sua empresa
        </p>
      </header>

      <div
        className="mt-5 grid min-h-[520px] flex-1 overflow-hidden rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] shadow-sm lg:grid-cols-[320px_minmax(0,1fr)]"
        data-testid="attendance-workspace"
      >
        <div
          className={`h-full min-h-0 min-w-0 ${
            isMobileConversationOpen ? 'hidden' : 'flex'
          } border-r border-[var(--dashboard-border)] lg:flex`}
        >
          <ConversationInbox
            conversations={conversations}
            error={listError}
            filter={filter}
            isLoading={isListLoading}
            onFilterChange={setFilter}
            onRetry={() => setListVersion((version) => version + 1)}
            onSearchChange={setSearchTerm}
            onSelectConversation={handleSelectConversation}
            searchTerm={searchTerm}
            selectedConversationId={selectedConversationId}
            statusCounts={statusCounts}
            total={total}
          />
        </div>

        <div
          className={`h-full min-h-0 min-w-0 ${
            isMobileConversationOpen ? 'flex' : 'hidden'
          } lg:flex`}
        >
          <ConversationView
            conversation={selectedConversation}
            currentUserId={currentUserId}
            error={actionError ?? conversationError}
            isBusy={activeAction !== null}
            isLoading={isConversationLoading}
            onRetry={
              conversationError
                ? () => setConversationVersion((version) => version + 1)
                : undefined
            }
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
