# SMSv SDKs

Official SDKs for the [SMSv](https://smsv.tech) WhatsApp Business Platform — send messages, manage contacts, run campaigns, and integrate WhatsApp into your SaaS products.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Packages

| Package | Language | Status |
|---------|----------|--------|
| [`@sahelpay/smsv`](./js) | JavaScript / TypeScript | ✅ Ready |
| [`smsv`](./python) | Python 3.8+ | ✅ Ready |
| [`sahelpay/smsv-laravel`](./php-laravel) | PHP 8.2+ / Laravel 12+ | ✅ Ready |

> **Note**: Les SDKs ne sont pas encore publiés sur npm/PyPI/Packagist. Installez-les depuis ce repo GitHub (voir ci-dessous).

## Installation

```bash
git clone https://github.com/dione24/smsv-sdk.git
```

### JavaScript / TypeScript

```bash
cd smsv-sdk/js
npm install && npm run build

# Puis dans votre projet :
npm install /chemin/vers/smsv-sdk/js
```

### Python

```bash
pip install ./smsv-sdk/python
```

### PHP / Laravel

```bash
# Dans votre composer.json, ajoutez :
# "repositories": [{ "type": "path", "url": "/chemin/vers/smsv-sdk/php-laravel" }]
composer require sahelpay/smsv-laravel @dev
php artisan vendor:publish --provider="SahelPay\\Smsv\\SmsvServiceProvider" --tag=config
```

## Two Integration Modes

SMSv supports two authentication layers depending on your use case:

### Standard API — for your own app

Authenticate with an **API Key** (`X-API-Key: sp_live_xxx`) to send messages, manage contacts, and run campaigns from your own SMSv account.

```typescript
import { SmsvClient } from "@sahelpay/smsv";

const client = new SmsvClient({
  apiKey: "sp_live_xxx",
  baseUrl: "https://smsv.tech/api",
});

await client.sendText({
  to: "+22370000000",
  message: "Hello from SMSv!",
});
```

```python
from smsv import SMSvClient

client = SMSvClient(api_key="sp_live_xxx")
client.messages.send_text(to="+22370000000", message="Hello from SMSv!")
```

```php
use SahelPay\Smsv\SmsvClient;

$client = new SmsvClient(['apiKey' => 'sp_live_xxx']);
$client->sendText('+22370000000', 'Hello from SMSv!');
```

### Partner API — for multi-tenant SaaS

Authenticate with a **Partner Key** (`X-Partner-Key: pk_cloud_xxx`) to let each of your customers connect their own WhatsApp number and send messages through your platform.

```typescript
import { SmsvPartnerClient } from "@sahelpay/smsv";

const partner = new SmsvPartnerClient({
  partnerKey: "pk_cloud_xxxxx",
});

// Create a WhatsApp sender for your customer
const sender = await partner.createSender({
  externalOrgId: "customer_123",
  displayName: "Customer Corp",
});

// Get QR code for customer to scan
const { qrCode } = await partner.getQRCode("customer_123");

// Send a message on behalf of your customer
await partner.sendMessage({
  externalOrgId: "customer_123",
  to: "+22370000000",
  text: "Your invoice #1234 is ready!",
});
```

```python
from smsv import SMSvPartnerClient

partner = SMSvPartnerClient(partner_key="pk_cloud_xxxxx")

partner.create_sender("customer_123", display_name="Customer Corp")
qr = partner.get_qr_code("customer_123")
partner.send_message("customer_123", to="+22370000000", text="Invoice ready!")
```

```php
use SahelPay\Smsv\SmsvPartnerClient;

$partner = new SmsvPartnerClient(['partner_key' => 'pk_cloud_xxxxx']);

$partner->createSender('customer_123', 'Customer Corp');
$qr = $partner->getQRCode('customer_123');
$partner->sendDocument([
    'externalOrgId' => 'customer_123',
    'to' => '+22370000000',
    'documentUrl' => 'https://example.com/invoice.pdf',
    'filename' => 'Invoice-001.pdf',
]);
```

## API Coverage

| Feature | Standard API | Partner API |
|---------|:---:|:---:|
| Send text / image / document / audio / video | ✅ | ✅ |
| Contacts (CRUD, import) | ✅ | — |
| Campaigns (create, send, pause, stats) | ✅ | — |
| Templates (list, create, send) | ✅ | — |
| Batch messaging | ✅ | — |
| Sender management (create, QR, status, reconnect) | — | ✅ |
| Webhooks (signature verification) | ✅ | ✅ |
| Media upload | ✅ | — |

## Full Documentation

- **API Reference**: [smsv.tech/docs/partner-api](https://smsv.tech/docs/partner-api)
- **JavaScript SDK**: [js/README.md](./js/README.md)
- **Python SDK**: [python/README.md](./python/README.md)
- **PHP/Laravel SDK**: [php-laravel/README.md](./php-laravel/README.md)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)

## Webhooks

All SDKs include helpers for verifying webhook signatures:

```typescript
// JavaScript
const isValid = client.verifyWebhook(body, signature, secret);
```

```python
# Python
is_valid = SMSvPartnerClient.verify_webhook(payload, signature, secret)
```

```php
// PHP
$isValid = SmsvPartnerClient::verifyWebhook($payload, $signature, $secret);
```

## Contributing

We welcome contributions! Please open an issue or PR on this repository.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m "feat: add my feature"`)
4. Push and open a PR

## License

MIT — see [LICENSE](./LICENSE) for details.

## Support

- **Documentation**: https://smsv.tech/docs/partner-api
- **Email**: support@smsv.tech
- **Issues**: https://github.com/dione24/smsv-sdk/issues
