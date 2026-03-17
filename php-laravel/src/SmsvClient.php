<?php

namespace SahelPay\Smsv;

use Illuminate\Support\Str;

class SmsvClient
{
    private HttpClient $http;
    private string $idempotencyPrefix;

    public function __construct(array $config = [])
    {
        $this->http = new HttpClient($config);
        $this->idempotencyPrefix = $config['idempotency_prefix'] ?? 'smsv-';
    }

    // ---- Apps ----
    public function listApps(): array
    {
        return $this->http->request('GET', '/apps');
    }

    public function createApp(array $payload): array
    {
        return $this->http->request('POST', '/apps', ['json' => $payload]);
    }

    public function getApp(string $appId): array
    {
        return $this->http->request('GET', "/apps/{$appId}");
    }

    public function updateApp(string $appId, array $payload): array
    {
        return $this->http->request('PATCH', "/apps/{$appId}", ['json' => $payload]);
    }

    // ---- Senders: Meta Cloud (BYO) ----
    public function createMetaSender(string $appId, array $payload): array
    {
        return $this->http->request('POST', "/apps/{$appId}/senders/meta", ['json' => $payload]);
    }

    public function testMetaSender(string $appId, string $senderId, array $payload = []): array
    {
        return $this->http->request('POST', "/apps/{$appId}/senders/meta/{$senderId}/test", ['json' => $payload]);
    }

    public function refreshMetaToken(string $appId, string $senderId, string $accessToken): array
    {
        return $this->http->request('POST', "/apps/{$appId}/senders/meta/{$senderId}/refresh-token", ['json' => ['accessToken' => $accessToken]]);
    }

    public function syncMetaTemplates(string $appId, string $senderId): array
    {
        return $this->http->request('POST', "/apps/{$appId}/senders/meta/{$senderId}/sync-templates");
    }

    public function listMetaTemplates(string $appId, string $senderId): array
    {
        return $this->http->request('GET', "/apps/{$appId}/senders/meta/{$senderId}/templates");
    }

    public function sendMetaTest(string $appId, string $senderId, array $payload): array
    {
        return $this->http->request('POST', "/apps/{$appId}/senders/meta/{$senderId}/send-test", ['json' => $payload]);
    }

    // ---- Senders: Baileys QR ----
    public function initBaileysSender(string $appId, array $payload): array
    {
        return $this->http->request('POST', "/apps/{$appId}/senders/baileys/init", ['json' => $payload]);
    }

    public function getBaileysQr(string $appId, string $senderId): array
    {
        return $this->http->request('GET', "/apps/{$appId}/senders/baileys/{$senderId}/qr");
    }

    public function getBaileysStatus(string $appId, string $senderId): array
    {
        return $this->http->request('GET', "/apps/{$appId}/senders/baileys/{$senderId}/status");
    }

    public function disconnectBaileys(string $appId, string $senderId): array
    {
        return $this->http->request('DELETE', "/apps/{$appId}/senders/baileys/{$senderId}/disconnect");
    }

    public function reconnectBaileys(string $appId, string $senderId): array
    {
        return $this->http->request('POST', "/apps/{$appId}/senders/baileys/{$senderId}/reconnect");
    }

    public function listBaileysGroups(string $appId, string $senderId): array
    {
        return $this->http->request('GET', "/apps/{$appId}/senders/baileys/{$senderId}/groups");
    }

    // ---- Contacts ----
    public function listContacts(string $appId, array $query = []): array
    {
        return $this->http->request('GET', "/apps/{$appId}/contacts", ['query' => $query]);
    }

    public function createContact(string $appId, array $payload): array
    {
        return $this->http->request('POST', "/apps/{$appId}/contacts", ['json' => $payload]);
    }

    public function importContacts(string $appId, array $contacts): array
    {
        return $this->http->request('POST', "/apps/{$appId}/contacts/import", ['json' => ['contacts' => $contacts]]);
    }

    public function updateContact(string $appId, string $contactId, array $payload): array
    {
        return $this->http->request('PUT', "/apps/{$appId}/contacts/{$contactId}", ['json' => $payload]);
    }

    public function tagContact(string $appId, string $contactId, array $tags): array
    {
        return $this->http->request('POST', "/apps/{$appId}/contacts/{$contactId}/tags", ['json' => ['tags' => $tags]]);
    }

    public function optInOutContact(string $appId, string $contactId, array $payload): array
    {
        return $this->http->request('POST', "/apps/{$appId}/contacts/{$contactId}/consent", ['json' => $payload]);
    }

    // ---- Templates ----
    public function listTemplates(string $appId): array
    {
        return $this->http->request('GET', "/apps/{$appId}/templates");
    }

    public function previewTemplate(string $appId, string $templateId, array $query = []): array
    {
        return $this->http->request('GET', "/apps/{$appId}/templates/{$templateId}/preview", ['query' => $query]);
    }

    public function syncTemplates(string $appId): array
    {
        return $this->http->request('POST', "/apps/{$appId}/templates/sync");
    }

    public function sendTemplateMessage(string $appId, array $payload): array
    {
        return $this->http->request('POST', "/apps/{$appId}/internal-templates/send", ['json' => $payload]);
    }

    public function apiKeyListTemplates(array $query = []): array
    {
        return $this->http->request('GET', "/templates", ['query' => $query]);
    }

    public function apiKeySendTemplate(array $payload): array
    {
        return $this->http->request('POST', "/messages/template", ['json' => $payload]);
    }

    // ---- Campaigns (API key surface) ----
    public function apiKeyListCampaigns(array $query = []): array
    {
        return $this->http->request('GET', "/v1/campaigns", ['query' => $query]);
    }

    public function apiKeyCreateCampaign(array $payload): array
    {
        return $this->http->request('POST', "/v1/campaigns", ['json' => $payload]);
    }

    public function apiKeyUpdateCampaign(string $campaignId, array $payload): array
    {
        return $this->http->request('PUT', "/v1/campaigns/{$campaignId}", ['json' => $payload]);
    }

    public function apiKeySendCampaign(string $campaignId): array
    {
        return $this->http->request('POST', "/v1/campaigns/{$campaignId}/send");
    }

    public function apiKeyPauseCampaign(string $campaignId): array
    {
        return $this->http->request('POST', "/v1/campaigns/{$campaignId}/pause");
    }

    public function apiKeyResumeCampaign(string $campaignId): array
    {
        return $this->http->request('POST', "/v1/campaigns/{$campaignId}/resume");
    }

    public function apiKeyCampaignStats(string $campaignId): array
    {
        return $this->http->request('GET', "/v1/campaigns/{$campaignId}/stats");
    }

    // ---- Notifications / Messages (API key) ----
    public function sendNotification(array $payload): array
    {
        return $this->http->request('POST', "/v1/notify", [
            'json' => $payload,
            'idempotencyKey' => $this->buildIdempotencyKey('notify'),
        ]);
    }

    public function sendMessage(array $payload): array
    {
        return $this->http->request('POST', "/v1/send", [
            'json' => $payload,
            'idempotencyKey' => $this->buildIdempotencyKey('message'),
        ]);
    }

    /**
     * Send a text message via WhatsApp or SMS
     *
     * @param string $to Recipient phone number (E.164 format)
     * @param string $message Message content
     * @param string|null $senderId Optional sender ID (get from listSenders)
     * @param string|null $channel Channel: "whatsapp" (default), "sms", or "auto"
     * @param string|null $scheduledAt Optional ISO date for scheduled sending
     *
     * @example WhatsApp (default)
     * $client->sendText('+22372830996', 'Hello!');
     *
     * @example SMS
     * $client->sendText('+22372830996', 'Code: 1234', null, 'sms');
     *
     * @example Auto (WhatsApp first, fallback to SMS)
     * $client->sendText('+22372830996', 'Hello!', null, 'auto');
     */
    public function sendText(
        string $to,
        string $message,
        ?string $senderId = null,
        ?string $channel = null,
        ?string $scheduledAt = null
    ): array {
        $body = array_filter([
            'to' => $to,
            'message' => $message,
            'senderId' => $senderId,
            'channel' => $channel,
            'scheduledAt' => $scheduledAt,
        ], fn($v) => $v !== null);

        return $this->http->request('POST', "/v1/text", [
            'json' => $body,
            'idempotencyKey' => $this->buildIdempotencyKey('text'),
        ]);
    }

    /**
     * Send SMS directly (shortcut for sendText with channel: "sms")
     *
     * @param string $to Recipient phone number (E.164 format)
     * @param string $message Message content (max 1600 chars, 160 per segment)
     * @param string|null $senderId Optional SMS Gateway sender ID
     * @param string|null $scheduledAt Optional ISO date for scheduled sending
     */
    public function sendSms(
        string $to,
        string $message,
        ?string $senderId = null,
        ?string $scheduledAt = null
    ): array {
        return $this->sendText($to, $message, $senderId, 'sms', $scheduledAt);
    }

    /**
     * List available senders (WhatsApp + SMS)
     * Returns all active senders for the authenticated app
     */
    public function listSenders(): array
    {
        return $this->http->request('GET', "/v1/senders");
    }

    public function sendTemplateDirect(string $to, string $template, array $variables = [], ?string $language = null, ?string $senderId = null): array
    {
        $body = array_filter([
            'to' => $to,
            'template' => $template,
            'language' => $language ?? 'en_US',
            'variables' => $variables,
            'senderId' => $senderId,
        ], fn($v) => $v !== null && $v !== []);

        return $this->http->request('POST', "/v1/template", [
            'json' => $body,
            'idempotencyKey' => $this->buildIdempotencyKey('template'),
        ]);
    }

    // ---- Webhooks ----
    public function verifyMetaWebhook(string $rawBody, string $signatureHeader, string $appSecret): bool
    {
        $expected = hash_hmac('sha256', $rawBody, $appSecret);
        $provided = str_replace('sha256=', '', $signatureHeader);
        return hash_equals($expected, $provided);
    }

    private function buildIdempotencyKey(string $prefix): string
    {
        return $this->idempotencyPrefix . $prefix . '-' . Str::orderedUuid()->toString();
    }
}