export type ConversationStatus = 'pending' | 'in_progress' | 'completed';
export type ConversationAssignee = 'bot' | 'agent' | 'none';
export type MessageSender = 'customer' | 'bot' | 'agent' | 'system';

export interface DemoMessage {
  id: string;
  sender: MessageSender;
  text: string;
  time: string;
}

export interface DemoConversation {
  id: string;
  customerName: string;
  initials: string;
  companyName: string;
  location: string;
  phone: string;
  avatarColor: string;
  status: ConversationStatus;
  assignee: ConversationAssignee;
  attention: boolean;
  unreadCount: number;
  updatedAt: number;
  messages: DemoMessage[];
}
