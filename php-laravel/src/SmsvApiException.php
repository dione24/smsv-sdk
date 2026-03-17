<?php

namespace SahelPay\Smsv;

use Exception;

class SmsvApiException extends Exception
{
    private int $statusCode;
    private $payload;
    private array $rateLimit;
    private int $retryAfter;

    public function __construct(string $message, int $statusCode = 0, $payload = null, array $rateLimit = [], int $retryAfter = 0)
    {
        parent::__construct($message, $statusCode);
        $this->statusCode = $statusCode;
        $this->payload = $payload;
        $this->rateLimit = $rateLimit;
        $this->retryAfter = $retryAfter;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getPayload()
    {
        return $this->payload;
    }

    public function getRateLimit(): array
    {
        return $this->rateLimit;
    }

    public function getRetryAfter(): int
    {
        return $this->retryAfter;
    }
}
