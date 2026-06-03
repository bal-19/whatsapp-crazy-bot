export type BotStatus = 'connected' | 'disconnected' | 'connecting';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type LogLevel = 'info' | 'warn' | 'error';
export type ToneStyle = 'pedas' | 'wholesome' | 'absurd' | 'custom';

export interface BotConfig {
  system_prompt: string;
  bot_name: string;
  is_active: boolean;
  ignore_groups: boolean;
  tone_style: ToneStyle;
}

export interface BotStatusResponse {
  status: BotStatus;
  uptime_seconds: number;
  total_messages_today: number;
  queue_size: number;
}

export interface Contact {
  id: string;
  name: string | null;
  is_blocked: boolean;
  created_at: string;
  last_seen: string | null;
}

export interface Message {
  id: string;
  contact_id: string;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  ai_model: string | null;
  tokens_used: number | null;
  latency_ms: number | null;
  created_at: string;
}

export interface ConversationSummary {
  contact_id: string;
  contact_name: string | null;
  last_message: string;
  last_message_at: string;
  message_count: number;
  avg_response_time_ms: number | null;
}

export interface ConversationDetail {
  contact: Pick<Contact, 'id' | 'name'>;
  messages: Message[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface AnalyticsSummary {
  messages_today: number;
  messages_this_week: number;
  active_contacts_today: number;
  avg_response_time_ms: number;
  gemini_errors_today: number;
}

export interface SystemLog {
  id: number;
  level: LogLevel;
  message: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface TestPromptRequest {
  message: string;
  config?: Partial<BotConfig>;
}

export interface TestPromptResponse {
  reply: string;
  latency_ms: number;
}
