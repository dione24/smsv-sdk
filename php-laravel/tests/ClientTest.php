<?php

use PHPUnit\Framework\TestCase;
use SahelPay\Smsv\SmsvClient;

class ClientTest extends TestCase
{
    public function test_can_instantiate_client_with_defaults(): void
    {
        $client = new SmsvClient();
        $this->assertInstanceOf(SmsvClient::class, $client);
    }

    public function test_can_override_config(): void
    {
        $client = new SmsvClient([
            'base_url' => 'https://api.example.com',
            'api_key' => 'test',
            'timeout' => 5,
            'retries' => ['enabled' => false],
        ]);

        $this->assertInstanceOf(SmsvClient::class, $client);
    }
}
