<?php

namespace SahelPay\Smsv;

use Illuminate\Support\ServiceProvider;

class SmsvServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/smsv.php', 'smsv');

        $this->app->singleton(SmsvClient::class, function ($app) {
            return new SmsvClient(config('smsv'));
        });

        $this->app->alias(SmsvClient::class, 'smsv');
    }

    public function boot()
    {
        $this->publishes([
            __DIR__ . '/../config/smsv.php' => config_path('smsv.php'),
        ], 'config');
    }
}
