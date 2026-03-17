export type AuthConfig = {
  apiKey?: string;
  bearerToken?: string;
};

export type ClientConfig = AuthConfig & {
  baseUrl?: string;
  timeoutMs?: number;
  retries?: number;
  retryBaseMs?: number;
  fetcher?: typeof fetch;
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
