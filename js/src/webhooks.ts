/**
 * Type-safe parsing and verification for SMSv webhooks.
 *
 * - **Partner webhooks**: POST to your `webhookUrl` with `X-Webhook-Secret` (and optionally HMAC body verification via {@link verifyPartnerWebhookSignature}).
 * - **App developer webhooks**: POST from SMSv worker with `X-SMSV-Signature`, `X-SMSV-Timestamp`, etc.
 */

import crypto from "crypto";

// ---------------------------------------------------------------------------
// Partner webhook events (dot.case, Partner / Baileys cloud delivery)
// ---------------------------------------------------------------------------

export const PARTNER_WEBHOOK_EVENTS = [
  "sender.created",
  "sender.connected",
  "sender.disconnected",
  "sender.deleted",
  "message.sent",
  "message.delivered",
  "message.read",
  "message.failed",
  "message.received",
] as const;

export type PartnerWebhookEventName = (typeof PARTNER_WEBHOOK_EVENTS)[number];

/** Documented partner envelope: event + tenant + payload bag */
export interface PartnerWebhookEnvelope {
  event: PartnerWebhookEventName;
  timestamp: string;
  externalOrgId: string;
  data: Record<string, unknown>;
}

/**
 * Cloud Mode inbound message shape (see SMSv `whatsapp-web.service` → `deliverPartnerWebhook`).
 * Uses `appId` (SMSv app id) instead of `externalOrgId`.
 */
export interface PartnerWebhookMessageReceivedCloud {
  event: "message.received";
  appId: string;
  from: string;
  type: string;
  content: string;
  mediaUrl?: string;
  timestamp: string;
}

/** Connector Mode inbound shape (`partner-connector.service` forward). */
export interface PartnerWebhookMessageReceivedConnector {
  event: "message.received";
  sessionId: string;
  from: string;
  type: string;
  content: Record<string, unknown> | string;
  mediaUrl?: string;
  timestamp: string;
}

export type PartnerWebhookParsed =
  | PartnerWebhookEnvelope
  | PartnerWebhookMessageReceivedCloud
  | PartnerWebhookMessageReceivedConnector;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isPartnerEventName(e: string): e is PartnerWebhookEventName {
  return (PARTNER_WEBHOOK_EVENTS as readonly string[]).includes(e);
}

/**
 * Parse a partner webhook body and return a discriminated union when the shape is recognized.
 * Throws if `event` is missing or unknown, or if the payload does not match any supported shape.
 */
export function parsePartnerWebhook(body: unknown): PartnerWebhookParsed {
  if (!isRecord(body)) {
    throw new Error("Invalid partner webhook: expected JSON object");
  }
  const event = body.event;
  if (typeof event !== "string") {
    throw new Error('Invalid partner webhook: "event" must be a string');
  }
  if (!isPartnerEventName(event)) {
    throw new Error(`Invalid partner webhook: unknown event "${event}"`);
  }

  if (event === "message.received") {
    if (typeof body.appId === "string" && typeof body.from === "string" && typeof body.timestamp === "string") {
      return body as unknown as PartnerWebhookMessageReceivedCloud;
    }
    if (typeof body.sessionId === "string" && typeof body.from === "string" && typeof body.timestamp === "string") {
      return body as unknown as PartnerWebhookMessageReceivedConnector;
    }
  }

  if (
    typeof body.timestamp === "string" &&
    typeof body.externalOrgId === "string" &&
    isRecord(body.data)
  ) {
    return body as unknown as PartnerWebhookEnvelope;
  }

  throw new Error(
    `Invalid partner webhook: unrecognized payload for event "${event}" (expected envelope with externalOrgId+data, or message.received with appId or sessionId)`,
  );
}

/**
 * Lenient parse: ensures object + string `event` only. Use type guards to narrow.
 */
export function parsePartnerWebhookLoose(body: unknown): Record<string, unknown> & { event: string } {
  if (!isRecord(body) || typeof body.event !== "string") {
    throw new Error('Invalid partner webhook: expected object with string "event"');
  }
  return body as Record<string, unknown> & { event: string };
}

export function isPartnerWebhookMessageReceivedCloud(w: unknown): w is PartnerWebhookMessageReceivedCloud {
  if (!isRecord(w)) return false;
  return (
    w.event === "message.received" &&
    typeof w.appId === "string" &&
    typeof w.from === "string" &&
    typeof w.timestamp === "string"
  );
}

export function isPartnerWebhookMessageReceivedConnector(
  w: unknown,
): w is PartnerWebhookMessageReceivedConnector {
  if (!isRecord(w)) return false;
  return (
    w.event === "message.received" &&
    typeof w.sessionId === "string" &&
    typeof w.from === "string" &&
    typeof w.timestamp === "string"
  );
}

export function isPartnerWebhookEnvelope(w: unknown): w is PartnerWebhookEnvelope {
  if (!isRecord(w) || typeof w.event !== "string" || !isPartnerEventName(w.event)) return false;
  return typeof w.timestamp === "string" && typeof w.externalOrgId === "string" && isRecord(w.data);
}

/**
 * HMAC-SHA256 hex digest of raw body, same algorithm as {@link SmsvPartnerClient.verifyWebhook}.
 */
export function verifyPartnerWebhookSignature(rawBody: string, signatureHex: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHex, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Cloud Mode partner delivery sends the shared secret in `X-Webhook-Secret` (not an HMAC of the body).
 * Use this when verifying inbound webhooks from SMSv Partner Cloud without a separate signature header.
 */
export function verifyPartnerWebhookSecretHeader(
  secretHeaderValue: string | undefined,
  expectedSecret: string,
): boolean {
  if (!secretHeaderValue || !expectedSecret) return false;
  if (secretHeaderValue.length !== expectedSecret.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(secretHeaderValue, "utf8"),
      Buffer.from(expectedSecret, "utf8"),
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// App developer webhooks (SMSv dashboard → endpoint), Stripe-like signature
// ---------------------------------------------------------------------------

export const SMSV_APP_WEBHOOK_TYPES = [
  "message.sent",
  "message.delivered",
  "message.read",
  "message.failed",
  "message.received",
  "campaign.started",
  "campaign.completed",
  "campaign.paused",
  "contact.created",
  "contact.updated",
  "contact.opted.out",
  "order.created",
  "order.confirmed",
  "order.shipped",
  "order.delivered",
] as const;

export type SmsvAppWebhookType = (typeof SMSV_APP_WEBHOOK_TYPES)[number];

export interface SmsvAppWebhookEnvelope {
  id: string;
  type: SmsvAppWebhookType;
  created: string;
  livemode?: boolean;
  data: Record<string, unknown>;
}

function isSmsvAppWebhookType(t: string): t is SmsvAppWebhookType {
  return (SMSV_APP_WEBHOOK_TYPES as readonly string[]).includes(t);
}

/**
 * Parse body of POST from SMSv app webhook delivery (`id`, `type`, `created`, `data`).
 */
export function parseSmsvAppWebhook(body: unknown): SmsvAppWebhookEnvelope {
  if (!isRecord(body)) {
    throw new Error("Invalid SMSv app webhook: expected JSON object");
  }
  if (typeof body.id !== "string" || typeof body.type !== "string" || typeof body.created !== "string") {
    throw new Error('Invalid SMSv app webhook: require string "id", "type", "created"');
  }
  if (!isSmsvAppWebhookType(body.type)) {
    throw new Error(`Invalid SMSv app webhook: unknown type "${body.type}"`);
  }
  if (!isRecord(body.data)) {
    throw new Error('Invalid SMSv app webhook: "data" must be an object');
  }
  return body as unknown as SmsvAppWebhookEnvelope;
}

export type ParsedSmsvSignatureHeader = { timestampSec: number; v1: string };

/**
 * Parse `X-SMSV-Signature` header value: `t=<unix>,v1=<hex>`.
 */
export function parseSmsvSignatureHeader(header: string): ParsedSmsvSignatureHeader | null {
  const parts = header.split(",").map((p) => p.trim());
  let timestampSec = NaN;
  let v1 = "";
  for (const p of parts) {
    if (p.startsWith("t=")) timestampSec = Number.parseInt(p.slice(2), 10);
    if (p.startsWith("v1=")) v1 = p.slice(3);
  }
  if (!Number.isFinite(timestampSec) || !v1) return null;
  return { timestampSec, v1 };
}

/**
 * Verify `X-SMSV-Signature` for the **raw** JSON string body (must match worker signing).
 */
export function verifySmsvAppWebhookSignature(opts: {
  rawBody: string;
  signatureHeader: string;
  secret: string;
  /** Max age of timestamp in seconds (default 300). */
  toleranceSeconds?: number;
}): boolean {
  const parsed = parseSmsvSignatureHeader(opts.signatureHeader);
  if (!parsed) return false;
  const tolerance = opts.toleranceSeconds ?? 300;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.timestampSec) > tolerance) {
    return false;
  }
  const signedPayload = `${parsed.timestampSec}.${opts.rawBody}`;
  const expected = crypto.createHmac("sha256", opts.secret).update(signedPayload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(parsed.v1, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}
