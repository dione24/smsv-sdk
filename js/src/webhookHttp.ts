/**
 * Framework-agnostic HTTP helpers for webhook verification.
 * Use from Express, Fastify, Next.js Route Handlers, etc. with the **raw** JSON string body.
 */

import {
  parsePartnerWebhook,
  parseSmsvAppWebhook,
  verifyPartnerWebhookSecretHeader,
  verifyPartnerWebhookSignature,
  verifySmsvAppWebhookSignature,
} from "./webhooks";

export type HeaderGetter = (name: string) => string | undefined;

/** Minimal request shape (Express/Fastify-compatible). */
export interface WebhookRequestLike {
  /** Express: `req.get` */
  get?: (name: string) => string | undefined;
  header?: HeaderGetter;
  headers?: Record<string, string | string[] | undefined>;
}

function getHeader(req: WebhookRequestLike, name: string): string | undefined {
  const lower = name.toLowerCase();
  if (req.get) {
    const v = req.get(lower) ?? req.get(name);
    if (v) return v;
  }
  if (req.header) {
    return req.header(lower) ?? req.header(name);
  }
  const h = req.headers?.[lower] ?? req.headers?.[name];
  if (Array.isArray(h)) return h[0];
  return h;
}

export type VerifyPartnerWebhookHttpResult =
  | { ok: true; payload: ReturnType<typeof parsePartnerWebhook> }
  | { ok: false; status: number; error: string };

/**
 * Verify Partner webhook and parse JSON body.
 * - `rawBody`: exact request body string (important if you use HMAC mode).
 * - `auth`:
 *   - `x-webhook-secret` — SMSv Partner Cloud default: header `X-Webhook-Secret` equals your webhook secret.
 *   - `hmac-body` — HMAC-SHA256 hex digest of `rawBody` (e.g. custom integrations); header default `x-webhook-signature`.
 */
export function verifyAndParsePartnerWebhookHttp(opts: {
  rawBody: string;
  req: WebhookRequestLike;
  secret: string;
  auth?: "x-webhook-secret" | "hmac-body";
  signatureHeader?: string;
}): VerifyPartnerWebhookHttpResult {
  const auth = opts.auth ?? "hmac-body";
  if (auth === "x-webhook-secret") {
    const headerVal = getHeader(opts.req, "x-webhook-secret");
    if (!verifyPartnerWebhookSecretHeader(headerVal, opts.secret)) {
      return { ok: false, status: 401, error: "Invalid or missing X-Webhook-Secret" };
    }
  } else {
    const sigHeader = opts.signatureHeader ?? "x-webhook-signature";
    const signature = getHeader(opts.req, sigHeader);
    if (!signature) {
      return { ok: false, status: 401, error: `Missing ${sigHeader}` };
    }
    if (!verifyPartnerWebhookSignature(opts.rawBody, signature, opts.secret)) {
      return { ok: false, status: 401, error: "Invalid signature" };
    }
  }
  try {
    const json = JSON.parse(opts.rawBody) as unknown;
    const payload = parsePartnerWebhook(json);
    return { ok: true, payload };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON or payload";
    return { ok: false, status: 400, error: msg };
  }
}

export type VerifySmsvAppWebhookHttpResult =
  | { ok: true; payload: ReturnType<typeof parseSmsvAppWebhook> }
  | { ok: false; status: number; error: string };

/**
 * Verify SMSv app developer webhook (`X-SMSV-Signature`) and parse JSON body.
 */
export function verifyAndParseSmsvAppWebhookHttp(opts: {
  rawBody: string;
  req: WebhookRequestLike;
  secret: string;
  toleranceSeconds?: number;
}): VerifySmsvAppWebhookHttpResult {
  const signatureHeader = getHeader(opts.req, "x-smsv-signature");
  if (!signatureHeader) {
    return { ok: false, status: 401, error: "Missing X-SMSV-Signature" };
  }
  const valid = verifySmsvAppWebhookSignature({
    rawBody: opts.rawBody,
    signatureHeader,
    secret: opts.secret,
    toleranceSeconds: opts.toleranceSeconds,
  });
  if (!valid) {
    return { ok: false, status: 401, error: "Invalid signature or stale timestamp" };
  }
  try {
    const json = JSON.parse(opts.rawBody) as unknown;
    const payload = parseSmsvAppWebhook(json);
    return { ok: true, payload };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON or payload";
    return { ok: false, status: 400, error: msg };
  }
}
