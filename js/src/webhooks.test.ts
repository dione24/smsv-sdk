import crypto from "crypto";
import { describe, expect, it } from "vitest";
import {
  isPartnerWebhookEnvelope,
  parsePartnerWebhook,
  parsePartnerWebhookLoose,
  parseSmsvAppWebhook,
  parseSmsvSignatureHeader,
  verifyPartnerWebhookSecretHeader,
  verifyPartnerWebhookSignature,
  verifySmsvAppWebhookSignature,
} from "./webhooks";

describe("parsePartnerWebhook", () => {
  it("parses Cloud Mode message.received", () => {
    const body = {
      event: "message.received",
      appId: "app_1",
      from: "+22370000000",
      type: "text",
      content: "hi",
      timestamp: "2025-01-01T00:00:00.000Z",
    };
    const p = parsePartnerWebhook(body);
    expect(p.event).toBe("message.received");
    if (p.event === "message.received" && "appId" in p) {
      expect(p.appId).toBe("app_1");
    }
  });

  it("parses Connector Mode message.received", () => {
    const body = {
      event: "message.received",
      sessionId: "sess_1",
      from: "+22370000000",
      type: "text",
      content: { text: "x" },
      timestamp: "2025-01-01T00:00:00.000Z",
    };
    const p = parsePartnerWebhook(body);
    expect(p.event).toBe("message.received");
    if (p.event === "message.received" && "sessionId" in p) {
      expect(p.sessionId).toBe("sess_1");
    }
  });

  it("parses canonical envelope", () => {
    const body = {
      event: "message.sent",
      timestamp: "2025-01-01T00:00:00.000Z",
      externalOrgId: "org_1",
      data: { messageId: "m1" },
    };
    const p = parsePartnerWebhook(body);
    expect(p).toMatchObject({ event: "message.sent", externalOrgId: "org_1" });
  });

  it("rejects unknown event", () => {
    expect(() => parsePartnerWebhook({ event: "unknown" })).toThrow(/unknown event/);
  });
});

describe("parsePartnerWebhookLoose + guards", () => {
  it("parses loose and narrows with envelope guard", () => {
    const w = parsePartnerWebhookLoose({
      event: "message.delivered",
      timestamp: "t",
      externalOrgId: "o",
      data: {},
    });
    expect(isPartnerWebhookEnvelope(w)).toBe(true);
  });
});

describe("parseSmsvAppWebhook", () => {
  it("parses valid envelope", () => {
    const e = parseSmsvAppWebhook({
      id: "evt_1",
      type: "message.sent",
      created: "2025-01-01T00:00:00.000Z",
      data: { messageId: "m1" },
    });
    expect(e.type).toBe("message.sent");
  });
});

describe("verifySmsvAppWebhookSignature", () => {
  it("accepts valid signature", () => {
    const rawBody = JSON.stringify({
      id: "evt_1",
      type: "message.sent",
      created: "2025-01-01T00:00:00.000Z",
      data: {},
    });
    const secret = "whsec_test";
    const timestampSec = Math.floor(Date.now() / 1000);
    const v1 = crypto.createHmac("sha256", secret).update(`${timestampSec}.${rawBody}`).digest("hex");
    const header = `t=${timestampSec},v1=${v1}`;
    expect(
      verifySmsvAppWebhookSignature({
        rawBody,
        signatureHeader: header,
        secret,
        toleranceSeconds: 600,
      }),
    ).toBe(true);
  });
});

describe("verifyPartnerWebhookSecretHeader", () => {
  it("compares secret with timing-safe equality", () => {
    expect(verifyPartnerWebhookSecretHeader("whsec_a", "whsec_a")).toBe(true);
    expect(verifyPartnerWebhookSecretHeader("whsec_a", "whsec_b")).toBe(false);
    expect(verifyPartnerWebhookSecretHeader(undefined, "x")).toBe(false);
  });
});

describe("verifyPartnerWebhookSignature", () => {
  it("matches HMAC hex of raw body", () => {
    const raw = '{"a":1}';
    const secret = "sec";
    const sig = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    expect(verifyPartnerWebhookSignature(raw, sig, secret)).toBe(true);
    expect(verifyPartnerWebhookSignature(raw, "deadbeef", secret)).toBe(false);
  });
});

describe("parseSmsvSignatureHeader", () => {
  it("parses t and v1", () => {
    expect(parseSmsvSignatureHeader("t=123,v1=abc")).toEqual({ timestampSec: 123, v1: "abc" });
    expect(parseSmsvSignatureHeader("invalid")).toBeNull();
  });
});
