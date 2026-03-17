<?php

return [
    /*
    |--------------------------------------------------------------------------
    | SMSV Base URL
    |--------------------------------------------------------------------------
    |
    | Default to local dev API. Override via env: SMSV_BASE_URL
    |
    */
    'base_url' => env('SMSV_BASE_URL', 'http://localhost:3001/api'),

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    |
    | Provide either an API Key (server-to-server) or a Bearer token for user
    | authenticated flows. You can set these per-client at runtime as well.
    |
    */
    'api_key' => env('SMSV_API_KEY'),
    'bearer_token' => env('SMSV_BEARER_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | HTTP Client
    |--------------------------------------------------------------------------
    |
    | Timeout in seconds and retry policy for transient failures (network/5xx).
    |
    */
    'timeout' => env('SMSV_TIMEOUT', 10),
    'retries' => [
        'enabled' => env('SMSV_RETRIES_ENABLED', true),
        'max_attempts' => env('SMSV_RETRIES', 3),
        'base_delay_ms' => env('SMSV_RETRY_BASE_MS', 200),
    ],

    /*
    |--------------------------------------------------------------------------
    | Idempotency
    |--------------------------------------------------------------------------
    |
    | Provide a default idempotency key prefix to help deduplicate requests
    | when the API adds explicit support.
    |
    */
    'idempotency_prefix' => env('SMSV_IDEMPOTENCY_PREFIX', 'smsv-'),
];
