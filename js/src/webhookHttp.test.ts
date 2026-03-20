import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { verifyAndParsePartnerWebhookHttp, verifyAndParseSmsvAppWebhookHttp } from "./webhookHttp";

describe("verifyAndParsePartnerWebhookHttp", () => {
  it("accepts X-Webhook-Secret mode (SMSv Cloud)", () => {
    const secret = "whsec_test";
    const rawBody = JSON.stringify({
      event: "message.received",
      appId: "app_1",
      from: "+22370000000",
      type: "text",
      content: "hi",
      timestamp: "2025-01-01T00:00:00.000Z",
    });
    const result = verifyAndParsePartnerWebhookHttp({
      rawBody,
      secret,
      auth: "x-webhook-secret",
      req: { get: (n) => (n.toLowerCase() === "x-webhook-secret" ? secret : undefined) },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.event).toBe("message.received");
    }
  });
});

describe("verifyAndParseSmsvAppWebhookHttp", () => {
  it("verifies signature and parses", () => {
    const secret = "whsec_abcd";
    const rawBody = JSON.stringify({
      id: "evt_1",
      type: "message.delivered",
      created: "2025-01-01T00:00:00.000Z",
      data: { messageId: "m1" },
    });
    const timestampSec = Math.floor(Date.now() / 1000);
    const v1 = crypto.createHmac("sha256", secret).update(`${timestampSec}.${rawBody}`).digest("hex");
    const result = verifyAndParseSmsvAppWebhookHttp({
      rawBody,
      secret,
      toleranceSeconds: 600,
      req: { get: (n) => (n.toLowerCase() === "x-smsv-signature" ? `t=${timestampSec},v1=${v1}` : undefined) },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.type).toBe("message.delivered");
    }
  });
});
