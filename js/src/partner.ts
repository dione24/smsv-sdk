/**
 * SMSv Partner API Client
 * 
 * Allows third-party applications to integrate WhatsApp messaging for their users
 * without requiring them to create a separate SMSv account.
 * 
 * Two modes available:
 * - Cloud Mode (pk_cloud_xxx): SMSv hosts WhatsApp instances
 * - Self-Hosted Mode (pk_connector_xxx): Partner hosts via Connector
 * 
 * @see https://docs.smsv.tech/partner-api
 */

import crypto from "crypto";

// ============================================================================
// Types
// ============================================================================

export interface PartnerClientConfig {
  /** Partner API key (pk_cloud_xxx or pk_connector_xxx) */
  partnerKey: string;
  /** API base URL (default: https://api.smsv.tech) */
  apiUrl?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

export interface CreateSenderParams {
  /** Unique ID in your system (e.g., user_123, org_456) */
  externalOrgId: string;
  /** Display name for the WhatsApp connection */
  displayName?: string;
}

export interface Sender {
  id: string;
  externalOrgId: string;
  displayName: string | null;
  status: SenderStatus;
  phoneNumber: string | null;
  connectedAt: string | null;
  messagesCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

export type SenderStatus =
  | "initializing"
  | "qr_ready"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface QRCodeResponse {
  status: SenderStatus;
  qrCode: string | null;
  expiresIn: number;
}

export interface StatusResponse {
  externalOrgId: string;
  status: SenderStatus;
  phoneNumber: string | null;
  connectedAt: string | null;
}

export interface SendMessageParams {
  /** External organization ID */
  externalOrgId: string;
  /** Recipient phone number (international format: +22370000000) */
  to: string;
  /** Message text */
  text: string;
}

export interface SendDocumentParams {
  /** External organization ID */
  externalOrgId: string;
  /** Recipient phone number (international format) */
  to: string;
  /** Public URL of the document */
  documentUrl: string;
  /** Filename to display */
  filename: string;
  /** Optional caption */
  caption?: string;
}

export interface SendImageParams {
  /** External organization ID */
  externalOrgId: string;
  /** Recipient phone number (international format) */
  to: string;
  /** Public URL of the image */
  imageUrl: string;
  /** Optional caption */
  caption?: string;
}

export interface MessageResponse {
  success: boolean;
  messageId?: string;
  status: "queued" | "sent" | "failed";
  error?: string;
}

// Connector Mode Types
export interface ConnectorCommand {
  id: string;
  type: "CREATE_SESSION" | "DELETE_SESSION" | "RESTART_SESSION" | "SEND_MESSAGE";
  externalOrgId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface ConnectorHeartbeatParams {
  activeSessions: string[];
  connectorVersion: string;
}

export interface PendingMessage {
  id: string;
  externalOrgId: string;
  to: string;
  type: "text" | "document" | "image";
  content: Record<string, unknown>;
  createdAt: string;
}

// Webhook Types
export type WebhookEvent =
  | "sender.created"
  | "sender.connected"
  | "sender.disconnected"
  | "sender.deleted"
  | "message.sent"
  | "message.delivered"
  | "message.read"
  | "message.failed"
  | "message.received";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  externalOrgId: string;
  data: Record<string, unknown>;
}

// ============================================================================
// Partner Client - Cloud Mode
// ============================================================================

/**
 * SMSv Partner Client for Cloud Mode
 * 
 * Use this client when SMSv hosts the WhatsApp instances (pk_cloud_xxx key).
 * 
 * @example
 * ```typescript
 * const client = new SmsvPartnerClient({
 *   partnerKey: 'pk_cloud_xxxxx'
 * });
 * 
 * // Create sender for your user
 * const sender = await client.createSender({
 *   externalOrgId: 'user_123',
 *   displayName: 'User Company'
 * });
 * 
 * // Get QR code
 * const { qrCode, status } = await client.getQRCode('user_123');
 * 
 * // Send message
 * await client.sendMessage({
 *   externalOrgId: 'user_123',
 *   to: '+22370000000',
 *   text: 'Hello!'
 * });
 * ```
 */
export class SmsvPartnerClient {
  private partnerKey: string;
  private apiUrl: string;
  private timeout: number;

  constructor(config: PartnerClientConfig) {
    if (!config.partnerKey) {
      throw new Error("Partner API key is required");
    }
    this.partnerKey = config.partnerKey;
    this.apiUrl = config.apiUrl || "https://api.smsv.tech";
    this.timeout = config.timeout || 30000;
  }

  private get isCloudMode(): boolean {
    return this.partnerKey.startsWith("pk_cloud_");
  }

  private get isConnectorMode(): boolean {
    return this.partnerKey.startsWith("pk_connector_");
  }

  private get basePath(): string {
    return this.isCloudMode
      ? "/v1/partner/cloud"
      : "/v1/partner/connector";
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.apiUrl}${this.basePath}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Partner-Key": this.partnerKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new PartnerApiError(
          error.message || `HTTP ${response.status}`,
          response.status,
          error.code
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof PartnerApiError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new PartnerApiError("Request timeout", 408, "TIMEOUT");
      }
      throw new PartnerApiError(
        error instanceof Error ? error.message : "Network error",
        0,
        "NETWORK_ERROR"
      );
    }
  }

  // =========================================================================
  // Cloud Mode - Sender Management
  // =========================================================================

  /**
   * Create a new WhatsApp sender for an organization
   */
  async createSender(params: CreateSenderParams): Promise<Sender> {
    this.assertCloudMode();
    return this.request<Sender>("POST", "/senders", params);
  }

  /**
   * Get sender details by external organization ID
   */
  async getSender(externalOrgId: string): Promise<Sender> {
    this.assertCloudMode();
    return this.request<Sender>("GET", `/senders/${encodeURIComponent(externalOrgId)}`);
  }

  /**
   * Get QR code for WhatsApp connection
   * Poll this endpoint until status is "connected"
   */
  async getQRCode(externalOrgId: string): Promise<QRCodeResponse> {
    this.assertCloudMode();
    return this.request<QRCodeResponse>(
      "GET",
      `/senders/${encodeURIComponent(externalOrgId)}/qr`
    );
  }

  /**
   * Get current connection status
   */
  async getStatus(externalOrgId: string): Promise<StatusResponse> {
    this.assertCloudMode();
    return this.request<StatusResponse>(
      "GET",
      `/senders/${encodeURIComponent(externalOrgId)}/status`
    );
  }

  /**
   * Force reconnection of a disconnected sender
   */
  async reconnectSender(externalOrgId: string): Promise<{ success: boolean }> {
    this.assertCloudMode();
    return this.request<{ success: boolean }>(
      "POST",
      `/senders/${encodeURIComponent(externalOrgId)}/reconnect`
    );
  }

  /**
   * Delete a sender and disconnect WhatsApp
   */
  async deleteSender(externalOrgId: string): Promise<{ success: boolean }> {
    this.assertCloudMode();
    return this.request<{ success: boolean }>(
      "DELETE",
      `/senders/${encodeURIComponent(externalOrgId)}`
    );
  }

  // =========================================================================
  // Cloud Mode - Messaging
  // =========================================================================

  /**
   * Send a text message
   */
  async sendMessage(params: SendMessageParams): Promise<MessageResponse> {
    this.assertCloudMode();
    return this.request<MessageResponse>("POST", "/messages/send", params);
  }

  /**
   * Send a document (PDF, Excel, etc.)
   */
  async sendDocument(params: SendDocumentParams): Promise<MessageResponse> {
    this.assertCloudMode();
    return this.request<MessageResponse>("POST", "/messages/send-document", params);
  }

  /**
   * Send an image
   */
  async sendImage(params: SendImageParams): Promise<MessageResponse> {
    this.assertCloudMode();
    return this.request<MessageResponse>("POST", "/messages/send-image", params);
  }

  // =========================================================================
  // Connector Mode - For Self-Hosted Partners
  // =========================================================================

  /**
   * Register the connector with SMSv Cloud
   */
  async registerConnector(params: { connectorVersion: string; hostname?: string }): Promise<{
    partnerId: string;
    existingSessions: string[];
  }> {
    this.assertConnectorMode();
    return this.request("POST", "/register", params);
  }

  /**
   * Get pending commands for the connector to execute
   */
  async getCommands(): Promise<{ commands: ConnectorCommand[] }> {
    this.assertConnectorMode();
    return this.request("GET", "/commands");
  }

  /**
   * Acknowledge command execution
   */
  async acknowledgeCommand(params: {
    commandId: string;
    status: "completed" | "failed";
    result?: Record<string, unknown>;
    error?: string;
  }): Promise<{ success: boolean }> {
    this.assertConnectorMode();
    return this.request("POST", "/commands/ack", params);
  }

  /**
   * Submit QR code generated by the connector
   */
  async submitQRCode(params: {
    externalOrgId: string;
    qrCode: string;
  }): Promise<{ success: boolean }> {
    this.assertConnectorMode();
    return this.request("POST", "/qr", params);
  }

  /**
   * Update session status
   */
  async updateSessionStatus(params: {
    externalOrgId: string;
    status: SenderStatus;
    phoneNumber?: string;
  }): Promise<{ success: boolean }> {
    this.assertConnectorMode();
    return this.request("POST", "/status", params);
  }

  /**
   * Get messages pending to be sent by connector
   */
  async getPendingMessages(): Promise<{ messages: PendingMessage[] }> {
    this.assertConnectorMode();
    return this.request("GET", "/pending");
  }

  /**
   * Report message delivery status
   */
  async reportDelivery(params: {
    messageId: string;
    status: "sent" | "delivered" | "read" | "failed";
    timestamp?: string;
    error?: string;
  }): Promise<{ success: boolean }> {
    this.assertConnectorMode();
    return this.request("POST", "/delivery", params);
  }

  /**
   * Send heartbeat to keep connector alive
   */
  async heartbeat(params: ConnectorHeartbeatParams): Promise<{ success: boolean }> {
    this.assertConnectorMode();
    return this.request("POST", "/heartbeat", params);
  }

  /**
   * Forward incoming message to SMSv Cloud
   */
  async forwardIncomingMessage(params: {
    externalOrgId: string;
    from: string;
    type: "text" | "image" | "document" | "audio" | "video";
    content: Record<string, unknown>;
    timestamp: string;
  }): Promise<{ success: boolean }> {
    this.assertConnectorMode();
    return this.request("POST", "/message", params);
  }

  // =========================================================================
  // Webhook Utilities
  // =========================================================================

  /**
   * Verify webhook signature
   * 
   * @example
   * ```typescript
   * app.post('/webhook', (req, res) => {
   *   const signature = req.headers['x-webhook-signature'];
   *   const isValid = client.verifyWebhook(
   *     JSON.stringify(req.body),
   *     signature,
   *     process.env.WEBHOOK_SECRET
   *   );
   *   if (!isValid) {
   *     return res.status(401).send('Invalid signature');
   *   }
   *   // Process webhook...
   * });
   * ```
   */
  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const expected =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(payload).digest("hex");
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      );
    } catch {
      return false;
    }
  }

  /**
   * Parse webhook payload with type safety
   */
  parseWebhook(body: unknown): WebhookPayload {
    if (typeof body !== "object" || body === null) {
      throw new Error("Invalid webhook payload");
    }
    return body as WebhookPayload;
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private assertCloudMode(): void {
    if (!this.isCloudMode) {
      throw new PartnerApiError(
        "This method requires a Cloud Mode API key (pk_cloud_xxx)",
        400,
        "INVALID_MODE"
      );
    }
  }

  private assertConnectorMode(): void {
    if (!this.isConnectorMode) {
      throw new PartnerApiError(
        "This method requires a Connector Mode API key (pk_connector_xxx)",
        400,
        "INVALID_MODE"
      );
    }
  }
}

// ============================================================================
// Error Class
// ============================================================================

export class PartnerApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "PartnerApiError";
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a Cloud Mode partner client
 */
export function createCloudClient(partnerKey: string, apiUrl?: string): SmsvPartnerClient {
  if (!partnerKey.startsWith("pk_cloud_")) {
    throw new Error("Cloud client requires pk_cloud_xxx key");
  }
  return new SmsvPartnerClient({ partnerKey, apiUrl });
}

/**
 * Create a Connector Mode partner client
 */
export function createConnectorClient(partnerKey: string, apiUrl?: string): SmsvPartnerClient {
  if (!partnerKey.startsWith("pk_connector_")) {
    throw new Error("Connector client requires pk_connector_xxx key");
  }
  return new SmsvPartnerClient({ partnerKey, apiUrl });
}
