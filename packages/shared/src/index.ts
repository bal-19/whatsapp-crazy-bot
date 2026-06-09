export type BotStatus = "connected" | "disconnected" | "connecting";
export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "sent" | "delivered" | "read" | "failed";
export type LogLevel = "info" | "warn" | "error";
export type ToneStyle = "pedas" | "wholesome" | "absurd" | "helpful" | "custom";
export type DocumentKind = "pdf" | "docx" | "xlsx";
export type OutboxStatus = "pending" | "processing" | "sent" | "failed";

export interface BotConfig {
    system_prompt: string;
    bot_name: string;
    is_active: boolean;
    ignore_groups: boolean;
    tone_style: ToneStyle;
    documents_enabled: boolean;
    allowed_document_formats: DocumentKind[];
}

export interface BotStatusResponse {
    status: BotStatus;
    uptime_seconds: number;
    total_messages_today: number;
    queue_size: number;
    qr_code: string | null;
}

export interface Contact {
    id: string;
    name: string | null;
    is_blocked: boolean;
    created_at: string;
    updated_at?: string;
    last_seen: string | null;
}

export interface WhatsAppGroup {
    group_jid: string;
    display_name: string | null;
    created_at: string;
    updated_at: string;
}

export interface KnowledgeItem {
    id: string;
    title: string;
    question: string;
    answer: string;
    tags: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateKnowledgeItemRequest {
    title: string;
    question: string;
    answer: string;
    tags?: string[];
    is_active?: boolean;
}

export interface UpdateKnowledgeItemRequest {
    title?: string;
    question?: string;
    answer?: string;
    tags?: string[];
    is_active?: boolean;
}

export interface CreateContactRequest {
    id: string;
    name?: string | null;
    is_blocked?: boolean;
    last_seen?: string | null;
}

export interface UpdateContactRequest {
    id?: string;
    name?: string | null;
    is_blocked?: boolean;
    last_seen?: string | null;
}

export interface UpsertWhatsAppGroupRequest {
    group_jid: string;
    display_name?: string | null;
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
    reply_to_message_id: string | null;
    raw_payload: Record<string, unknown> | null;
    message_timestamp: string;
    created_at: string;
}

export interface OutboxMessage {
    id: string;
    contact_id: string;
    delivery_jid: string;
    reply_preview: string;
    status: OutboxStatus;
    attempt_count: number;
    max_attempts: number;
    last_error: string | null;
    next_retry_at: string | null;
    sent_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ConversationSummary {
    contact_id: string;
    contact_name: string | null;
    group_name: string | null;
    last_message: string;
    last_message_at: string;
    message_count: number;
    avg_response_time_ms: number | null;
}

export interface ConversationDetail {
    contact: Pick<Contact, "id" | "name">;
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
    documents_today: number;
    document_failures_today: number;
    avg_document_latency_ms: number;
    documents_by_format: Record<DocumentKind, number>;
    daily_message_volume: {
        date: string;
        label: string;
        messages: number;
    }[];
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

export type DashboardPermission =
    | "dashboard.view"
    | "conversations.view"
    | "contacts.manage"
    | "groups.manage"
    | "config.manage"
    | "analytics.view"
    | "logs.view"
    | "users.manage"
    | "roles.manage"
    | "bot.manage"
    | "maintenance.manage"
    | "*";

export interface Role {
    id: string;
    name: string;
    permissions: DashboardPermission[];
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    username: string;
    email?: string | null;
    is_active: boolean;
    role_id: string | null;
    role_name: string | null;
    permissions: DashboardPermission[];
    last_login_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface AuthUser {
    id: string;
    username: string;
    role_name: string | null;
    permissions: DashboardPermission[];
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

export interface CreateRoleRequest {
    name: string;
    permissions: DashboardPermission[];
}

export interface UpdateRoleRequest {
    name?: string;
    permissions?: DashboardPermission[];
}

export interface CreateUserRequest {
    username: string;
    password: string;
    email?: string | null;
    role_id?: string | null;
    is_active?: boolean;
}

export interface UpdateUserRequest {
    password?: string;
    email?: string | null;
    role_id?: string | null;
    is_active?: boolean;
}

export interface TestPromptRequest {
    message: string;
    config?: Partial<BotConfig>;
}

export interface TestPromptResponse {
    reply: string;
    latency_ms: number;
}
