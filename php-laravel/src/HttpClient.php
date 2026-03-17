<?php

namespace SahelPay\Smsv;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Exception\RequestException;
use Psr\Http\Message\ResponseInterface;

class HttpClient
{
    private GuzzleClient $client;
    private string $baseUrl;
    private ?string $apiKey;
    private ?string $bearerToken;
    private int $timeout;
    private bool $retriesEnabled;
    private int $retryAttempts;
    private int $retryBaseDelayMs;

    public function __construct(array $config)
    {
        $this->baseUrl = rtrim($config['base_url'] ?? 'http://localhost:3001/api', '/');
        $this->apiKey = $config['api_key'] ?? null;
        $this->bearerToken = $config['bearer_token'] ?? null;
        $this->timeout = (int)($config['timeout'] ?? 10);
        $this->retriesEnabled = (bool)($config['retries']['enabled'] ?? true);
        $this->retryAttempts = (int)($config['retries']['max_attempts'] ?? 3);
        $this->retryBaseDelayMs = (int)($config['retries']['base_delay_ms'] ?? 200);

        $this->client = new GuzzleClient([
            'timeout' => $this->timeout,
            'http_errors' => false,
        ]);
    }

    /**
    * @throws SmsvApiException
    */
    public function request(string $method, string $path, array $options = []): array
    {
        $url = $this->baseUrl . '/' . ltrim($path, '/');
        $headers = $options['headers'] ?? [];

        if (!empty($this->apiKey)) {
            $headers['X-API-Key'] = $this->apiKey;
        }
        if (!empty($this->bearerToken)) {
            $headers['Authorization'] = 'Bearer ' . $this->bearerToken;
        }
        if (!empty($options['idempotencyKey'])) {
            $headers['Idempotency-Key'] = $options['idempotencyKey'];
        }

        $payload = [];
        if (isset($options['json'])) {
            $payload['json'] = $options['json'];
        }
        if (isset($options['query'])) {
            $payload['query'] = $options['query'];
        }
        if (isset($options['multipart'])) {
            $payload['multipart'] = $options['multipart'];
        }

        $attempts = 0;
        $lastException = null;

        while (true) {
            try {
                /** @var ResponseInterface $response */
                $response = $this->client->request($method, $url, array_merge($payload, [
                    'headers' => $headers,
                ]));

                $status = $response->getStatusCode();
                $body = (string)$response->getBody();
                $data = json_decode($body, true);

                if ($status >= 200 && $status < 300) {
                    return $data ?? [];
                }

                $retryAfter = (int)($response->getHeaderLine('Retry-After') ?: 0);
                $rateHeaders = [
                    'limit' => $response->getHeaderLine('X-RateLimit-Limit'),
                    'remaining' => $response->getHeaderLine('X-RateLimit-Remaining'),
                    'reset' => $response->getHeaderLine('X-RateLimit-Reset'),
                ];

                if ($this->shouldRetry($status, $attempts)) {
                    $this->sleepBackoff($attempts, $retryAfter);
                    $attempts++;
                    continue;
                }

                throw new SmsvApiException(
                    $data['message'] ?? $data['error'] ?? 'SMSV API error',
                    $status,
                    $data,
                    $rateHeaders,
                    $retryAfter
                );
            } catch (RequestException $e) {
                $lastException = $e;
                if ($this->shouldRetry(0, $attempts)) {
                    $this->sleepBackoff($attempts, 0);
                    $attempts++;
                    continue;
                }
                throw new SmsvApiException($e->getMessage(), 0, null);
            }
        }
    }

    private function shouldRetry(int $status, int $attempts): bool
    {
        if (!$this->retriesEnabled) {
            return false;
        }
        if ($attempts >= $this->retryAttempts) {
            return false;
        }
        return $status === 0 || ($status >= 500) || $status === 429;
    }

    private function sleepBackoff(int $attempts, int $retryAfterHeader): void
    {
        if ($retryAfterHeader > 0) {
            sleep($retryAfterHeader);
            return;
        }

        $delayMs = ($this->retryBaseDelayMs) * max(1, $attempts + 1);
        usleep($delayMs * 1000);
    }
}
