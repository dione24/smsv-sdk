# SMSv Python SDK

Python integration guide for the SMSV public API.

## Installation

> Le package n'est pas encore publié sur PyPI. Installez depuis GitHub :

```bash
git clone https://github.com/dione24/smsv-sdk.git
pip install ./smsv-sdk/python
```

## Quick Start

Use the public REST API with your app key:

```python
import requests

BASE_URL = "https://smsv.tech/api/v1"
API_KEY = "sp_live_xxx"

response = requests.post(
    f"{BASE_URL}/text",
    headers={
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
    },
    json={
        "to": "+22372830996",
        "message": "Hello from SMSV!",
        "senderId": "YOUR_SENDER_ID",
    },
    timeout=30,
)

print(response.json())
```

## Supported Public Endpoints

- `POST /api/v1/text`
- `POST /api/v1/send`
- `POST /api/v1/image`
- `POST /api/v1/document`
- `POST /api/v1/audio`
- `POST /api/v1/video`
- `POST /api/v1/location`
- `POST /api/v1/template`
- `GET /api/v1/senders`

## Common Patterns

### List valid sender IDs

```python
import requests

response = requests.get(
    "https://smsv.tech/api/v1/senders",
    headers={"X-API-Key": "sp_live_xxx"},
    timeout=30,
)

print(response.json())
```

### Send via the universal endpoint

```python
response = requests.post(
    "https://smsv.tech/api/v1/send",
    headers={
        "X-API-Key": "sp_live_xxx",
        "Content-Type": "application/json",
    },
    json={
        "recipient": "+22372830996",
        "type": "text",
        "text": "Bonjour !",
        "senderId": "YOUR_SENDER_ID",
    },
    timeout=30,
)

print(response.json())
```

### Compatibility alias

For legacy integrations, `accountId` is accepted as an alias for `senderId`.
Use `senderId` for all new integrations.

## Notes

- Use the exact API key copied from the SMSV dashboard in the `X-API-Key` header.
- Common key formats include `sp_live_...` and `sk_...`.
- If your app has one active sender, SMSV can auto-select it.
- If your app has multiple senders, always pass `senderId`.

## License

MIT
