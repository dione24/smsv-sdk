<?php

namespace SahelPay\Smsv;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;

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
 * @example
 * ```php
 * $client = new SmsvPartnerClient([
 *     'partner_key' => 'pk_cloud_xxxxx',
 * ]);
 * 
 * // Create sender for your user
 * $sender = $client->createSender('user_123', 'User Company');
 * 
 * // Get QR code
 * $qr = $client->getQRCode('user_123');
 * 
 * // Send message
 * $client->sendMessage('user_123', '+22370000000', 'Hello!');
 * ```
 */
class SmsvPartnerClient
{
    private string $partnerKey;
    private string $apiUrl;
    private int $timeout;

    public function __construct(array $config)
    {
        if (empty($config['partner_key'])) {
            throw new \InvalidArgumentException('Partner API key is required');
        }

        $this->partnerKey = $config['partner_key'];
        $this->apiUrl = $config['api_url'] ?? 'https://api.smsv.tech';
        $this->timeout = $config['timeout'] ?? 30;
    }

    // =========================================================================
    // Cloud Mode - Sender Management
    // =========================================================================

    /**
     * Create a new WhatsApp sender for an organization
     */
    public function createSender(string $externalOrgId, ?string $displayName = null): array
    {
        $this->assertCloudMode();
        
        return $this->request('POST', '/senders', array_filter([
            'externalOrgId' => $externalOrgId,
            'displayName' => $displayName,
        ]));
    }

    /**
     * Get sender details by external organization ID
     */
    public function getSender(string $externalOrgId): array
    {
        $this->assertCloudMode();
        
        return $this->request('GET', "/senders/{$externalOrgId}");
    }

    /**
     * Get QR code for WhatsApp connection
     * Poll this endpoint until status is "connected"
     */
    public function getQRCode(string $externalOrgId): array
    {
        $this->assertCloudMode();
        
        return $this->request('GET', "/senders/{$externalOrgId}/qr");
    }

    /**
     * Get current connection status
     */
    public function getStatus(string $externalOrgId): array
    {
        $this->assertCloudMode();
        
        return $this->request('GET', "/senders/{$externalOrgId}/status");
    }

    /**
     * Force reconnection of a disconnected sender
     */
    public function reconnectSender(string $externalOrgId): array
    {
        $this->assertCloudMode();
        
        return $this->request('POST', "/senders/{$externalOrgId}/reconnect");
    }

    /**
     * Delete a sender and disconnect WhatsApp
     */
    public function deleteSender(string $externalOrgId): array
    {
        $this->assertCloudMode();
        
        return $this->request('DELETE', "/senders/{$externalOrgId}");
    }

    // =========================================================================
    // Cloud Mode - Messaging
    // =========================================================================

    /**
     * Send a text message
     */
    public function sendMessage(string $externalOrgId, string $to, string $text): array
    {
        $this->assertCloudMode();
        
        return $this->request('POST', '/messages/send', [
            'externalOrgId' => $externalOrgId,
            'to' => $to,
            'text' => $text,
        ]);
    }

    /**
     * Send a document (PDF, Excel, etc.)
     */
    public function sendDocument(array $params): array
    {
        $this->assertCloudMode();
        
        return $this->request('POST', '/messages/send-document', $params);
    }

    /**
     * Send an image
     */
    public function sendImage(array $params): array
    {
        $this->assertCloudMode();
        
        return $this->request('POST', '/messages/send-image', $params);
    }

    // =========================================================================
    // Connector Mode - For Self-Hosted Partners
    // =========================================================================

    /**
     * Register the connector with SMSv Cloud
     */
    public function registerConnector(string $connectorVersion, ?string $hostname = null): array
    {
        $this->assertConnectorMode();
        
        return $this->request('POST', '/register', array_filter([
            'connectorVersion' => $connectorVersion,
            'hostname' => $hostname,
        ]));
    }

    /**
     * Get pending commands for the connector to execute
     */
    public function getCommands(): array
    {
        $this->assertConnectorMode();
        
        return $this->request('GET', '/commands');
    }

    /**
     * Acknowledge command execution
     */
    public function acknowledgeCommand(string $commandId, string $status, ?array $result = null, ?string $error = null): array
    {
        $this->assertConnectorMode();
        
        return $this->request('POST', '/commands/ack', array_filter([
            'commandId' => $commandId,
            'status' => $status,
            'result' => $result,
            'error' => $error,
        ]));
    }

    /**
     * Submit QR code generated by the connector
     */
    public function submitQRCode(string $externalOrgId, string $qrCode): array
    {
        $this->assertConnectorMode();
        
        return $this->request('POST', '/qr', [
            'externalOrgId' => $externalOrgId,
            'qrCode' => $qrCode,
        ]);
    }

    /**
     * Update session status
     */
    public function updateSessionStatus(string $externalOrgId, string $status, ?string $phoneNumber = null): array
    {
        $this->assertConnectorMode();
        
        return $this->request('POST', '/status', array_filter([
            'externalOrgId' => $externalOrgId,
            'status' => $status,
            'phoneNumber' => $phoneNumber,
        ]));
    }

    /**
     * Get messages pending to be sent by connector
     */
    public function getPendingMessages(): array
    {
        $this->assertConnectorMode();
        
        return $this->request('GET', '/pending');
    }

    /**
     * Report message delivery status
     */
    public function reportDelivery(string $messageId, string $status, ?string $timestamp = null, ?string $error = null): array
    {
        $this->assertConnectorMode();
        
        return $this->request('POST', '/delivery', array_filter([
            'messageId' => $messageId,
            'status' => $status,
            'timestamp' => $timestamp,
            'error' => $error,
        ]));
    }

    /**
     * Send heartbeat to keep connector alive
     */
    public function heartbeat(array $activeSessions, string $connectorVersion): array
    {
        $this->assertConnectorMode();
        
        return $this->request('POST', '/heartbeat', [
            'activeSessions' => $activeSessions,
            'connectorVersion' => $connectorVersion,
        ]);
    }

    /**
     * Forward incoming message to SMSv Cloud
     */
    public function forwardIncomingMessage(array $params): array
    {
        $this->assertConnectorMode();
        
        return $this->request('POST', '/message', $params);
    }

    // =========================================================================
    // Webhook Utilities
    // =========================================================================

    /**
     * Verify webhook signature
     * 
     * @example
     * ```php
     * Route::post('/webhook', function (Request $request) {
     *     $client = new SmsvPartnerClient(['partner_key' => config('smsv.partner_key')]);
     *     
     *     if (!$client->verifyWebhook(
     *         $request->getContent(),
     *         $request->header('X-Webhook-Signature'),
     *         config('smsv.webhook_secret')
     *     )) {
     *         abort(401, 'Invalid signature');
     *     }
     *     
     *     // Process webhook...
     * });
     * ```
     */
    public function verifyWebhook(string $payload, string $signature, string $secret): bool
    {
        $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
        
        return hash_equals($expected, $signature);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function isCloudMode(): bool
    {
        return str_starts_with($this->partnerKey, 'pk_cloud_');
    }

    private function isConnectorMode(): bool
    {
        return str_starts_with($this->partnerKey, 'pk_connector_');
    }

    private function getBasePath(): string
    {
        return $this->isCloudMode()
            ? '/v1/partner/cloud'
            : '/v1/partner/connector';
    }

    private function assertCloudMode(): void
    {
        if (!$this->isCloudMode()) {
            throw new \RuntimeException(
                'This method requires a Cloud Mode API key (pk_cloud_xxx)'
            );
        }
    }

    private function assertConnectorMode(): void
    {
        if (!$this->isConnectorMode()) {
            throw new \RuntimeException(
                'This method requires a Connector Mode API key (pk_connector_xxx)'
            );
        }
    }

    private function request(string $method, string $path, array $data = []): array
    {
        $url = $this->apiUrl . $this->getBasePath() . $path;

        $response = Http::timeout($this->timeout)
            ->withHeaders([
                'X-Partner-Key' => $this->partnerKey,
                'Content-Type' => 'application/json',
            ])
            ->$method($url, $data);

        if (!$response->successful()) {
            $error = $response->json();
            throw new PartnerApiException(
                $error['message'] ?? "HTTP {$response->status()}",
                $response->status(),
                $error['code'] ?? null
            );
        }

        return $response->json();
    }
}

/**
 * Partner API Exception
 */
class PartnerApiException extends \Exception
{
    public ?string $errorCode;

    public function __construct(string $message, int $statusCode, ?string $errorCode = null)
    {
        parent::__construct($message, $statusCode);
        $this->errorCode = $errorCode;
    }
}
