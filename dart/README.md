# SMSv SDK — Dart / Flutter (stub)

Package pub.dev : **à venir**. Pour Flutter / serveur Dart, utilisez `package:http` :

```dart
final res = await http.post(
  Uri.parse('$apiUrl/v1/text'),
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  },
  body: jsonEncode({'to': to, 'message': text, 'channel': 'whatsapp'}),
);
```

Les types d’événements webhook sont alignés sur le SDK JS (`js/src/webhooks.ts`) pour cohérence mobile ↔ backend.
