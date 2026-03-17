# Changelog - SMSV SDKs

All notable changes to the SMSV SDKs (JavaScript & PHP Laravel) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-01-07

### Added
- **✨ `senderId` Support** - All messaging methods now accept an optional `senderId` parameter to specify which sender/channel to use for sending messages
- Added `senderId` field to `MessagePayload` type (TypeScript SDK)
- Added `senderId` field to `TemplateSendPayload` type (TypeScript SDK)

### Changed
- **BREAKING**: `sendText()` method signature changed in JavaScript SDK:
  - **Before**: `sendText(to: string, message: string)`
  - **After**: `sendText(params: { to: string; message: string; senderId?: string })`
- `sendText()` method in PHP SDK now accepts optional third parameter `?string $senderId = null`
- `sendTemplateDirect()` method in PHP SDK now accepts optional fifth parameter `?string $senderId = null`

### Improved
- Updated README examples to show `senderId` usage
- Better alignment between SDK and API backend capabilities

### Migration Guide

#### JavaScript/TypeScript

**Before (v0.1.0)**:
```typescript
await client.sendText("+22370000000", "Hello!");
```

**After (v0.2.0)**:
```typescript
// Without senderId (uses default sender)
await client.sendText({
  to: "+22370000000",
  message: "Hello!"
});

// With senderId (uses specific sender)
await client.sendText({
  to: "+22370000000",
  message: "Hello!",
  senderId: "d6841101-d08b-4ed2-8703-d2f12f40d847"
});
```

#### PHP Laravel

**Before (v0.1.0)**:
```php
$smsv->sendText('+22370000000', 'Hello!');
```

**After (v0.2.0)**:
```php
// Without senderId (backward compatible)
$smsv->sendText('+22370000000', 'Hello!');

// With senderId (new parameter)
$smsv->sendText(
    '+22370000000',
    'Hello!',
    'd6841101-d08b-4ed2-8703-d2f12f40d847'
);
```

---

## [0.1.0] - 2026-01-06

### Added
- Initial release
- Support for Apps management
- Support for Senders (Meta Cloud + Baileys QR)
- Support for Contacts & Tags
- Support for Templates & Template messages
- Support for Campaigns (API key surface)
- Support for Notifications/Messages
- Webhook verification helpers
- Idempotency key generation
- Automatic retry on rate limits
- TypeScript type definitions (JS SDK)
- Laravel service provider auto-discovery (PHP SDK)

---

## Upgrade Notes

### From 0.1.0 to 0.2.0

1. **JavaScript SDK**: Update all `sendText()` calls to use object syntax
2. **PHP SDK**: Optionally add `senderId` as third parameter to `sendText()` and fifth to `sendTemplateDirect()`
3. Review your sender configuration to leverage multi-sender capabilities
4. Update your imports/dependencies:
   ```bash
   # JavaScript
   npm install @sahelpay/smsv@^0.2.0
   
   # PHP
   composer require sahelpay/smsv-laravel:^0.2.0
   ```

---

## Links

- [JavaScript SDK README](./js/README.md)
- [PHP Laravel SDK README](./php-laravel/README.md)
- [SDK Plan](../SDK_PLAN.md)
- [API Documentation](https://smsv.tech/dashboard/api)
