export type AuthConfig = {
  apiKey?: string;
  bearerToken?: string;
};

export type HttpHookContext = {
  method: string;
  /** Path relatif à `baseUrl` (ex. `v1/messages`) avec query string si présente */
  path: string;
};

export type HttpResponseHookContext = HttpHookContext & {
  status: number;
  ms: number;
};

export type ClientConfig = AuthConfig & {
  baseUrl?: string;
  timeoutMs?: number;
  retries?: number;
  retryBaseMs?: number;
  fetcher?: typeof fetch;
  /** Hooks optionnels pour logs structurés, métriques ou OpenTelemetry (wrappez côté app). */
  onRequest?: (ctx: HttpHookContext) => void;
  onResponse?: (ctx: HttpResponseHookContext) => void;
  onError?: (ctx: HttpHookContext & { error: unknown }) => void;
};

export interface RateLimitInfo {
  limit?: number;
  remaining?: number;
  reset?: number;
  retryAfter?: number;
}

export interface SmsvError extends Error {
  status?: number;
  payload?: any;
  rateLimit?: RateLimitInfo;
}

export type MessagePayload = {
  recipient?: string;
  to?: string;
  type?: "text" | "image" | "document" | "audio" | "video" | "sticker" | "location" | "contact" | "interactive";
  senderId?: string;
  message?: string;
  text?: string;
  template?: string;
  templateLanguage?: string;
  variables?: Record<string, string>;
  url?: string;
  caption?: string;
};

export type TemplateSendPayload = {
  to: string;
  template: string;
  language?: string;
  variables?: Record<string, string>;
  senderId?: string;
};

export type CampaignPayload = {
  name: string;
  messageContent?: string;
  templateId?: string;
  internalTemplateSlug?: string;
  mediaUrl?: string;
  segmentTags?: string[];
  scheduledAt?: string;
};

/** POST /v1/batch — aligns with SMSv `BatchMessageDto` */
export type BatchMessageType = "text" | "template" | "image" | "document";

export type BatchMessageInput = {
  to: string;
  type: BatchMessageType;
  message?: string;
  template?: string;
  language?: string;
  variables?: Record<string, string>;
  mediaUrl?: string;
  caption?: string;
  filename?: string;
  senderId?: string;
};

export type BatchSendResult = {
  batchId: string;
  accepted: number;
  rejected: number;
  total: number;
  errors?: Array<{ index: number; to: string; error: string }>;
};

export type BatchStatusStats = {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
};

export type BatchStatusMessageRow = {
  id: string;
  to: string;
  status: string;
  error?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
};

export type BatchStatusResult = {
  batchId: string;
  stats: BatchStatusStats;
  messages: BatchStatusMessageRow[];
};

/** POST /apps/:appId/flows — aligns with SMSv `CreateFlowDto` */
export type FlowTriggerType =
  | "KEYWORD"
  | "ANY_MESSAGE"
  | "WEBHOOK"
  | "SCHEDULE"
  | "CONTACT_EVENT";

export type CreateFlowPayload = {
  name: string;
  description?: string;
  triggerType: FlowTriggerType;
  triggerConfig?: Record<string, unknown>;
  nodes?: unknown[];
  edges?: unknown[];
  viewport?: { x: number; y: number; zoom: number };
};

export type UpdateFlowPayload = Partial<CreateFlowPayload> & { isActive?: boolean };

export type InstallFlowStarterPackPayload = {
  activate?: boolean;
  webhookUrl?: string;
};
