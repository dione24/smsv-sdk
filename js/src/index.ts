import { HttpClient } from "./httpClient";
import type { ClientConfig, MessagePayload, TemplateSendPayload, CampaignPayload } from "./types";
import crypto from "crypto";

// Re-export Partner API client
export {
  SmsvPartnerClient,
  PartnerApiError,
  createCloudClient,
  createConnectorClient,
} from "./partner";

export type {
  PartnerClientConfig,
  CreateSenderParams,
  Sender,
  SenderStatus,
  QRCodeResponse,
  StatusResponse,
  SendMessageParams,
  SendDocumentParams,
  SendImageParams,
  MessageResponse,
  ConnectorCommand,
  ConnectorHeartbeatParams,
  PendingMessage,
  WebhookEvent,
  WebhookPayload,
} from "./partner";

export class SmsvClient {
  private http: HttpClient;
  private idempotencyPrefix: string;

  constructor(config: ClientConfig = {}) {
    this.http = new HttpClient(config);
    this.idempotencyPrefix = "smsv-";
  }

  // Apps
  listApps() {
    return this.http.request("GET", "/apps");
  }
  createApp(payload: Record<string, any>) {
    return this.http.request("POST", "/apps", { body: JSON.stringify(payload) });
  }
  getApp(id: string) {
    return this.http.request("GET", `/apps/${id}`);
  }
  updateApp(id: string, payload: Record<string, any>) {
    return this.http.request("PATCH", `/apps/${id}`, { body: JSON.stringify(payload) });
  }
  deleteApp(id: string) {
    return this.http.request("DELETE", `/apps/${id}`);
  }
  getAppStats(id: string) {
    return this.http.request("GET", `/apps/${id}/stats`);
  }
  regenerateAppKey(id: string) {
    return this.http.request("POST", `/apps/${id}/regenerate-key`);
  }

  // Meta Cloud BYO
  createMetaSender(appId: string, payload: Record<string, any>) {
    return this.http.request("POST", `/apps/${appId}/senders/meta`, { body: JSON.stringify(payload) });
  }
  testMetaSender(appId: string, senderId: string, payload: Record<string, any> = {}) {
    return this.http.request("POST", `/apps/${appId}/senders/meta/${senderId}/test`, { body: JSON.stringify(payload) });
  }
  refreshMetaToken(appId: string, senderId: string, accessToken: string) {
    return this.http.request("POST", `/apps/${appId}/senders/meta/${senderId}/refresh-token`, {
      body: JSON.stringify({ accessToken }),
    });
  }
  syncMetaTemplates(appId: string, senderId: string) {
    return this.http.request("POST", `/apps/${appId}/senders/meta/${senderId}/sync-templates`);
  }
  listMetaTemplates(appId: string, senderId: string) {
    return this.http.request("GET", `/apps/${appId}/senders/meta/${senderId}/templates`);
  }
  sendMetaTest(appId: string, senderId: string, payload: Record<string, any>) {
    return this.http.request("POST", `/apps/${appId}/senders/meta/${senderId}/send-test`, {
      body: JSON.stringify(payload),
    });
  }

  // Baileys
  initBaileysSender(appId: string, payload: Record<string, any>) {
    return this.http.request("POST", `/apps/${appId}/senders/baileys/init`, { body: JSON.stringify(payload) });
  }
  getBaileysQr(appId: string, senderId: string) {
    return this.http.request("GET", `/apps/${appId}/senders/baileys/${senderId}/qr`);
  }
  getBaileysStatus(appId: string, senderId: string) {
    return this.http.request("GET", `/apps/${appId}/senders/baileys/${senderId}/status`);
  }
  disconnectBaileys(appId: string, senderId: string) {
    return this.http.request("DELETE", `/apps/${appId}/senders/baileys/${senderId}/disconnect`);
  }
  reconnectBaileys(appId: string, senderId: string) {
    return this.http.request("POST", `/apps/${appId}/senders/baileys/${senderId}/reconnect`);
  }
  listBaileysGroups(appId: string, senderId: string) {
    return this.http.request("GET", `/apps/${appId}/senders/baileys/${senderId}/groups`);
  }

  // Contacts
  listContacts(appId: string, query: Record<string, any> = {}) {
    return this.http.request("GET", `/apps/${appId}/contacts`, { query });
  }
  getContact(appId: string, contactId: string) {
    return this.http.request("GET", `/apps/${appId}/contacts/${contactId}`);
  }
  createContact(appId: string, payload: Record<string, any>) {
    return this.http.request("POST", `/apps/${appId}/contacts`, { body: JSON.stringify(payload) });
  }
  importContacts(appId: string, contacts: Record<string, any>[]) {
    return this.http.request("POST", `/apps/${appId}/contacts/import`, { body: JSON.stringify({ contacts }) });
  }
  updateContact(appId: string, contactId: string, payload: Record<string, any>) {
    return this.http.request("PUT", `/apps/${appId}/contacts/${contactId}`, { body: JSON.stringify(payload) });
  }
  deleteContact(appId: string, contactId: string) {
    return this.http.request("DELETE", `/apps/${appId}/contacts/${contactId}`);
  }
  bulkDeleteContacts(appId: string, contactIds: string[]) {
    return this.http.request("POST", `/apps/${appId}/contacts/bulk-delete`, { body: JSON.stringify({ ids: contactIds }) });
  }
  getContactStats(appId: string) {
    return this.http.request("GET", `/apps/${appId}/contacts/stats`);
  }
  getContactTags(appId: string) {
    return this.http.request("GET", `/apps/${appId}/contacts/tags`);
  }
  tagContact(appId: string, contactId: string, tags: string[]) {
    return this.http.request("POST", `/apps/${appId}/contacts/${contactId}/tags`, { body: JSON.stringify({ tags }) });
  }
  untagContact(appId: string, contactId: string, tags: string[]) {
    return this.http.request("DELETE", `/apps/${appId}/contacts/${contactId}/tags`, { body: JSON.stringify({ tags }) });
  }
  updateConsent(appId: string, contactId: string, payload: Record<string, any>) {
    return this.http.request("POST", `/apps/${appId}/contacts/${contactId}/consent`, { body: JSON.stringify(payload) });
  }

  // Messages
  listMessages(appId: string, query: Record<string, any> = {}) {
    return this.http.request("GET", `/messages`, { query: { appId, ...query } });
  }
  getMessage(messageId: string) {
    return this.http.request("GET", `/messages/${messageId}`);
  }

  // Templates
  listTemplates(appId: string) {
    return this.http.request("GET", `/apps/${appId}/templates`);
  }
  previewTemplate(appId: string, templateId: string, query: Record<string, any> = {}) {
    return this.http.request("GET", `/apps/${appId}/templates/${templateId}/preview`, { query });
  }
  syncTemplates(appId: string) {
    return this.http.request("POST", `/apps/${appId}/templates/sync`);
  }
  sendTemplateMessage(appId: string, payload: Record<string, any>) {
    return this.http.request("POST", `/apps/${appId}/internal-templates/send`, { body: JSON.stringify(payload) });
  }
  apiKeyListTemplates(query: Record<string, any> = {}) {
    return this.http.request("GET", "/templates", { query });
  }
  apiKeySendTemplate(payload: TemplateSendPayload) {
    return this.http.request("POST", "/messages/template", {
      body: JSON.stringify(payload),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("template") },
    });
  }

  // Campaigns (API key)
  apiKeyListCampaigns(query: Record<string, any> = {}) {
    return this.http.request("GET", "/v1/campaigns", { query });
  }
  apiKeyGetCampaign(id: string) {
    return this.http.request("GET", `/v1/campaigns/${id}`);
  }
  apiKeyCreateCampaign(payload: CampaignPayload) {
    return this.http.request("POST", "/v1/campaigns", {
      body: JSON.stringify(payload),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("campaign") },
    });
  }
  apiKeyUpdateCampaign(id: string, payload: Partial<CampaignPayload>) {
    return this.http.request("PUT", `/v1/campaigns/${id}`, { body: JSON.stringify(payload) });
  }
  apiKeyDeleteCampaign(id: string) {
    return this.http.request("DELETE", `/v1/campaigns/${id}`);
  }
  apiKeySendCampaign(id: string) {
    return this.http.request("POST", `/v1/campaigns/${id}/send`);
  }
  apiKeyPauseCampaign(id: string) {
    return this.http.request("POST", `/v1/campaigns/${id}/pause`);
  }
  apiKeyResumeCampaign(id: string) {
    return this.http.request("POST", `/v1/campaigns/${id}/resume`);
  }
  apiKeyCancelCampaign(id: string) {
    return this.http.request("POST", `/v1/campaigns/${id}/cancel`);
  }
  apiKeyCampaignStats(id: string) {
    return this.http.request("GET", `/v1/campaigns/${id}/stats`);
  }
  apiKeyCampaignRecipients(id: string, query: Record<string, any> = {}) {
    return this.http.request("GET", `/v1/campaigns/${id}/recipients`, { query });
  }

  // Messaging (API key)
  sendNotification(payload: Record<string, any>) {
    return this.http.request("POST", "/v1/notify", {
      body: JSON.stringify(payload),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("notify") },
    });
  }
  sendMessage(payload: MessagePayload) {
    return this.http.request("POST", "/v1/send", {
      body: JSON.stringify(payload),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("message") },
    });
  }

  /**
   * Send a text message via WhatsApp or SMS
   * @param params.to - Recipient phone number (E.164 format)
   * @param params.message - Message content
   * @param params.senderId - Optional sender ID (get from listSenders)
   * @param params.channel - Channel: "whatsapp" (default), "sms", or "auto"
   * @param params.scheduledAt - Optional ISO date for scheduled sending
   * 
   * @example WhatsApp (default)
   * client.sendText({ to: "+22372830996", message: "Hello!" })
   * 
   * @example SMS
   * client.sendText({ to: "+22372830996", message: "Code: 1234", channel: "sms" })
   * 
   * @example Auto (WhatsApp first, fallback to SMS)
   * client.sendText({ to: "+22372830996", message: "Hello!", channel: "auto" })
   */
  sendText(params: { 
    to: string; 
    message: string; 
    senderId?: string;
    channel?: "whatsapp" | "sms" | "auto";
    scheduledAt?: string;
  }) {
    return this.http.request("POST", "/v1/text", {
      body: JSON.stringify(params),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("text") },
    });
  }

  /**
   * Send SMS directly (shortcut for sendText with channel: "sms")
   * @param params.to - Recipient phone number (E.164 format)
   * @param params.message - Message content (max 1600 chars, 160 per segment)
   * @param params.senderId - Optional SMS Gateway sender ID
   * @param params.scheduledAt - Optional ISO date for scheduled sending
   */
  sendSms(params: { 
    to: string; 
    message: string; 
    senderId?: string;
    scheduledAt?: string;
  }) {
    return this.http.request("POST", "/v1/text", {
      body: JSON.stringify({ ...params, channel: "sms" }),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("sms") },
    });
  }

  /**
   * List available senders (WhatsApp + SMS)
   * Returns all active senders for the authenticated app
   */
  listSenders() {
    return this.http.request("GET", "/v1/senders");
  }
  sendImage(params: { to: string; url: string; caption?: string; senderId?: string }) {
    return this.http.request("POST", "/v1/image", {
      body: JSON.stringify(params),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("image") },
    });
  }
  sendDocument(params: { to: string; url: string; filename?: string; caption?: string; senderId?: string }) {
    return this.http.request("POST", "/v1/document", {
      body: JSON.stringify(params),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("document") },
    });
  }
  sendAudio(params: { to: string; url: string; senderId?: string }) {
    return this.http.request("POST", "/v1/audio", {
      body: JSON.stringify(params),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("audio") },
    });
  }
  sendVideo(params: { to: string; url: string; caption?: string; senderId?: string }) {
    return this.http.request("POST", "/v1/video", {
      body: JSON.stringify(params),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("video") },
    });
  }
  sendLocation(params: { to: string; latitude: number; longitude: number; name?: string; address?: string; senderId?: string }) {
    return this.http.request("POST", "/v1/location", {
      body: JSON.stringify(params),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("location") },
    });
  }
  sendTemplateDirect(payload: TemplateSendPayload) {
    return this.http.request("POST", "/v1/template", {
      body: JSON.stringify(payload),
      headers: { "Idempotency-Key": this.buildIdempotencyKey("template") },
    });
  }

  // Webhooks
  verifyMetaSignature(rawBody: string, signature: string, appSecret: string) {
    const provided = signature.replace("sha256=", "");
    const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
  }

  private buildIdempotencyKey(label: string) {
    return `${this.idempotencyPrefix}${label}-${crypto.randomUUID()}`;
  }
}

export * from "./types";
