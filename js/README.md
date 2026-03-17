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
- **Templates**: `listTemplates`, `previewTemplate`, `syncTemplates`, `sendTemplateMessage`, `apiKeyListTemplates`, `apiKeySendTemplate`
- **Campaigns (API key)**: `apiKeyCreateCampaign`, `apiKeySendCampaign`, `apiKeyPauseCampaign`, `apiKeyResumeCampaign`, `apiKeyCampaignStats`
- **Messaging**: `sendNotification`, `sendMessage`, `sendText`, `sendTemplateDirect`
- **Webhooks**: `verifyMetaSignature(rawBody, signature, appSecret)`

## Error handling
- Network/5xx/429 automatically retried (configurable).
- Errors include `status`, `payload`, and `rateLimit` hints when available.
- Use `senderId` for new integrations. `accountId` is accepted by the HTTP API as a compatibility alias.

## Examples
See `../../EXAMPLES/js` for runnable snippets.

## Scripts
```bash
npm run build   # tsup build (cjs+esm+dts)
npm test        # vitest
npm run lint    # tsc --noEmit
```
