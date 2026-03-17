# SMSV Laravel SDK (PHP)

Official Laravel 12 compatible SDK for SMSV (WhatsApp gateway). Provides typed helpers for Apps, Senders (Meta Cloud + Baileys), Contacts, Templates, Campaigns, Notifications, and webhook verification.

## Installation

> Le package n'est pas encore publié sur Packagist. Installez depuis GitHub :

```bash
git clone https://github.com/dione24/smsv-sdk.git

# Dans votre composer.json, ajoutez :
# "repositories": [{ "type": "path", "url": "/chemin/vers/smsv-sdk/php-laravel" }]

composer require sahelpay/smsv-laravel @dev
php artisan vendor:publish --provider="SahelPay\\Smsv\\SmsvServiceProvider" --tag=config
```

## Configuration
`config/smsv.php` (env variables):
- `SMSV_BASE_URL` (default `http://localhost:3001/api`)
- `SMSV_API_KEY` (recommended for server-to-server)
- `SMSV_BEARER_TOKEN` (optional for dashboard/JWT flows)
- `SMSV_TIMEOUT`, `SMSV_RETRIES`, `SMSV_RETRY_BASE_MS`

## Quickstart
```php
use SahelPay\Smsv\SmsvClient;

$smsv = new SmsvClient([
    'base_url' => 'https://smsv.tech/api',
    'api_key' => env('SMSV_API_KEY'),
]);

// Create Meta sender (BYO)
$sender = $smsv->createMetaSender($appId, [
    'phoneNumber' => '+22370000000',
    'metaPhoneNumberId' => '123456789',
    'accessToken' => 'EAAB...',
    'wabaId' => 'WABA_ID',
    'isDefault' => true,
]);

// Send text message (uses default sender if not specified)
$smsv->sendText('+22370000000', 'Hello from SMSV!');

// Recommended when your app has multiple senders
$smsv->sendText(
    '+22370000000',
    'Hello from specific sender!',
    'd6841101-d08b-4ed2-8703-d2f12f40d847'
);

// Send template with sender
$smsv->sendTemplateDirect(
    '+22370000000',
    'hello_world',
    ['name' => 'Awa'],
    'fr',
    'd6841101-d08b-4ed2-8703-d2f12f40d847'
);
```

## Key Methods (selection)
- Apps: `listApps`, `createApp`, `getApp`, `updateApp`.
- Meta senders: `createMetaSender`, `testMetaSender`, `refreshMetaToken`, `syncMetaTemplates`, `listMetaTemplates`, `sendMetaTest`.
- Baileys QR: `initBaileysSender`, `getBaileysQr`, `getBaileysStatus`, `disconnectBaileys`, `reconnectBaileys`, `listBaileysGroups`.
- Contacts: `listContacts`, `createContact`, `importContacts`, `updateContact`, `tagContact`, `optInOutContact`.
- Templates: `listTemplates`, `previewTemplate`, `syncTemplates`, `sendTemplateMessage`, `apiKeyListTemplates`, `apiKeySendTemplate`.
- Campaigns (API key): `apiKeyCreateCampaign`, `apiKeySendCampaign`, `apiKeyPauseCampaign`, `apiKeyResumeCampaign`, `apiKeyCampaignStats`.
- Notifications: `sendNotification`, `sendMessage`, `sendText`, `sendTemplateDirect`.
- Webhooks: `verifyMetaWebhook($rawBody, $signature, $appSecret)`.

## Error Handling
- Throws `SmsvApiException` with:
  - `getStatusCode()`
  - `getPayload()` (decoded JSON)
  - `getRateLimit()` (limit/remaining/reset)
  - `getRetryAfter()` (seconds)
- For new integrations, prefer `senderId`. The HTTP API also accepts `accountId` as a compatibility alias.

## Examples
See `../../EXAMPLES/php` for runnable snippets (campaigns, senders, contacts, webhooks).

## Testing
```bash
composer install
composer test
```
