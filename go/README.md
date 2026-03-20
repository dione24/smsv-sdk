# SMSv SDK — Go (stub)

Package Go officiel : **à venir**. En attendant, appelez l’API REST avec `net/http` :

```go
req, _ := http.NewRequest("POST", apiURL+"/v1/text", bytes.NewReader(bodyJSON))
req.Header.Set("Content-Type", "application/json")
req.Header.Set("X-API-Key", os.Getenv("SMSV_API_KEY"))
resp, err := http.DefaultClient.Do(req)
```

Parité avec le SDK JS : mêmes endpoints (`/v1/text`, `/v1/send`, batch, webhooks). Suivre la doc API sur [smsv.tech](https://smsv.tech).
