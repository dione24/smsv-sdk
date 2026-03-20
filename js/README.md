# SMSV JavaScript/TypeScript SDK

Official SDK for Node.js and browser usage. Covers Apps, Senders (Meta Cloud + Baileys QR), Contacts, Templates, Campaigns, Messaging, and webhook verification.

## Install

> Le package n'est pas encore publié sur npm. Installez depuis GitHub :

```bash
git clone https://github.com/dione24/smsv-sdk.git
cd smsv-sdk/js
npm install && npm run build

# Puis dans votre projet :
npm install /chemin/vers/smsv-sdk/js
```

## Quickstart
```ts
import { SmsvClient } from "@sahelpay/smsv";

const client = new SmsvClient({
  baseUrl: "https://smsv.tech/api",
  apiKey: process.env.SMSV_API_KEY,
});

// Create a BYO Meta sender
await client.createMetaSender(appId, {
  phoneNumber: "+22370000000",
  metaPhoneNumberId: "123456789",
  accessToken: process.env.META_ACCESS_TOKEN!,
  wabaId: "WABA_ID",
  isDefault: true,
});

// List valid sender IDs for this API key
const { items } = await client.listSenders();

// Send a text message (uses default sender if not specified)
await client.sendText({
  to: "+22370000000",
  message: "Hello from SMSV!"
});

// Recommended when your app has multiple senders
await client.sendText({
  to: "+22370000000",
  message: "Hello from specific sender!",
  senderId: items[0].id
});

// Send a template message with sender
await client.sendTemplateDirect({
  to: "+22370000000",
  template: "hello_world",
  language: "fr",
  variables: { name: "Awa" },
  senderId: "d6841101-d08b-4ed2-8703-d2f12f40d847"
});
```

## API Surface (highlights)
- **Apps**: `listApps`, `createApp`, `getApp`, `updateApp`
- **Senders Meta**: `createMetaSender`, `testMetaSender`, `refreshMetaToken`, `syncMetaTemplates`, `listMetaTemplates`, `sendMetaTest`
- **Senders Baileys**: `initBaileysSender`, `getBaileysQr`, `getBaileysStatus`, `disconnectBaileys`, `reconnectBaileys`, `listBaileysGroups`
- **Contacts**: `listContacts`, `createContact`, `importContacts`, `updateContact`, `tagContact`, `updateConsent`
- **Contact sync (CRM)**: `normalizeContactPhone`, `diffContactsByPhone`, `buildImportPayload` (for `importContacts`), `smsvContactsToCrmExport`
- **Flows (automations module)**: `listFlows`, `createFlow`, `updateFlow`, `activateFlow`, `installFlowStarterPack`, `listFlowExecutions`, … (`CreateFlowPayload` type)
- **Local queue / retry**: `withExponentialBackoff`, `LocalSendQueue` (concurrency + FIFO) for wrapping `sendText` / batch sends
- **Templates**: `listTemplates`, `previewTemplate`, `syncTemplates`, `sendTemplateMessage`, `apiKeyListTemplates`, `apiKeySendTemplate`
- **Campaigns (API key)**: `apiKeyCreateCampaign`, `apiKeySendCampaign`, `apiKeyPauseCampaign`, `apiKeyResumeCampaign`, `apiKeyCampaignStats`
- **Batch (API key)**: `sendBatch` (POST `/v1/batch`, max 1000), `getBatchStatus`, `sendBatchAndWait` (poll avec `onProgress` / `isTerminal`), helper `pollBatchStatusUntilTerminal`
- **Messaging**: `sendNotification`, `sendMessage`, `sendText`, `sendTemplateDirect`
- **Webhooks**: `verifyMetaSignature(rawBody, signature, appSecret)` (Meta Cloud)
- **Partner / App webhooks (typed)**:
  - `parsePartnerWebhook`, `parsePartnerWebhookLoose`, guards `isPartnerWebhookEnvelope`, `isPartnerWebhookMessageReceivedCloud`, `isPartnerWebhookMessageReceivedConnector`
  - `verifyPartnerWebhookSignature` (HMAC hex of raw body, same as `SmsvPartnerClient.verifyWebhook`)
  - `parseSmsvAppWebhook`, `verifySmsvAppWebhookSignature` (dashboard webhooks: `X-SMSV-Signature` = `t=...,v1=...`)
  - HTTP helpers: `verifyAndParsePartnerWebhookHttp` (use `auth: "x-webhook-secret"` for SMSv Cloud), `verifyAndParseSmsvAppWebhookHttp` — pass the **raw** JSON string; with Express, use `express.json({ verify: (req, _res, buf) => { (req as any).rawBody = buf.toString(); } })` or `express.raw` on the webhook route.

## Error handling
- Network/5xx/429 automatically retried (configurable).
- Errors include `status`, `payload`, and `rateLimit` hints when available.
- Use `senderId` for new integrations. `accountId` is accepted by the HTTP API as a compatibility alias.

## Examples
See `../../EXAMPLES/js` for runnable snippets.

## CLI (`smsv`)

Après `npm run build`, configurez `SMSV_API_KEY` (ou `SMSV_APP_API_KEY`) et optionnellement `SMSV_BASE_URL` (défaut `https://smsv.tech/api`).

```bash
npx smsv --help
npx smsv send --to +22370000000 --message "Hello"
npx smsv senders
npx smsv campaigns list
npx smsv campaigns stats <campaignId>
npx smsv campaigns send <campaignId>
npx smsv batch --to +22370000000 --message "Batch smoke test"
```

Depuis le repo : `node dist/cli.js send --to +223... -m "Hi"`

## Scripts
```bash
npm run build   # tsup: SDK (cjs+esm+dts) + CLI (esm)
npm test        # vitest
npm run lint    # tsc --noEmit
```
