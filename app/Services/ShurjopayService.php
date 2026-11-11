<?php

namespace App\Services;

use App\Models\WebsiteSetting;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ShurjopayService
{
    /**
     * Get active shurjoPay settings from WebsiteSetting.
     */
    public static function getSettings(): array
    {
        $defaults = WebsiteSetting::defaultShurjopaySettings();
        try {
            $setting = WebsiteSetting::current();
            $saved = $setting->shurjopay_settings ?? [];
            return array_merge($defaults, is_array($saved) ? $saved : []);
        } catch (\Throwable $e) {
            return $defaults;
        }
    }

    /**
     * Determine active API URL, username, password, and prefix.
     */
    public static function getActiveCredentials(?array $customSettings = null): array
    {
        $settings = $customSettings ?? static::getSettings();
        $isLive = ($settings['environment'] ?? 'live') === 'live';

        $apiUrl = $isLive
            ? ($settings['live_api_url'] ?? 'https://engine.shurjopayment.com')
            : ($settings['sandbox_api_url'] ?? 'https://sandbox.shurjopayment.com');

        $username = $isLive
            ? ($settings['live_username'] ?? '')
            : ($settings['sandbox_username'] ?? '');

        $password = $isLive
            ? ($settings['live_password'] ?? '')
            : ($settings['sandbox_password'] ?? '');

        $prefix = $isLive
            ? ($settings['live_prefix'] ?? 'MLE')
            : ($settings['sandbox_prefix'] ?? 'sp');

        return [
            'is_live' => $isLive,
            'api_url' => rtrim(trim($apiUrl), '/'),
            'username' => trim($username),
            'password' => trim($password),
            'prefix' => trim($prefix ?: 'MLE'),
            'enabled' => (bool) ($settings['enabled'] ?? true),
        ];
    }

    /**
     * Authenticate and get Bearer token from shurjoPay API.
     */
    public static function getToken(?string $apiUrl = null, ?string $username = null, ?string $password = null): array
    {
        if (!$apiUrl || !$username || !$password) {
            $creds = static::getActiveCredentials();
            $apiUrl = $apiUrl ?: $creds['api_url'];
            $username = $username ?: $creds['username'];
            $password = $password ?: $creds['password'];
        }

        $apiUrl = rtrim(trim($apiUrl), '/');
        $endpoint = "{$apiUrl}/api/get_token";

        try {
            $response = Http::timeout(25)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->post($endpoint, [
                    'username' => $username,
                    'password' => $password,
                ]);

            if (!$response->successful()) {
                Log::error('shurjoPay get_token HTTP error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'endpoint' => $endpoint,
                    'username' => $username,
                ]);

                return [
                    'success' => false,
                    'message' => 'shurjoPay server responded with HTTP status ' . $response->status() . ': ' . ($response->json('message') ?? $response->body()),
                ];
            }

            $data = $response->json();

            // Check if token exists
            if (empty($data['token'])) {
                Log::warning('shurjoPay get_token returned no token', ['response' => $data]);
                return [
                    'success' => false,
                    'message' => $data['message'] ?? 'Unable to obtain shurjoPay security token. Please verify credentials.',
                    'data' => $data,
                ];
            }

            return [
                'success' => true,
                'token' => $data['token'],
                'store_id' => $data['store_id'] ?? 1,
                'execute_url' => $data['execute_url'] ?? "{$apiUrl}/api/secret-pay",
                'token_type' => $data['token_type'] ?? 'Bearer',
                'sp_code' => $data['sp_code'] ?? null,
                'message' => $data['message'] ?? 'Token obtained successfully.',
            ];
        } catch (\Throwable $e) {
            Log::error('shurjoPay get_token exception: ' . $e->getMessage(), ['exception' => $e]);
            return [
                'success' => false,
                'message' => 'Connection to shurjoPay failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Test connection to shurjoPay with current or provided parameters.
     */
    public static function testConnection(array $params = []): array
    {
        $settings = static::getSettings();
        if (!empty($params)) {
            $settings = array_merge($settings, $params);
        }

        $creds = static::getActiveCredentials($settings);

        if (empty($creds['username']) || empty($creds['password'])) {
            return [
                'success' => false,
                'message' => 'API Username and Password are required to test connection.',
            ];
        }

        $tokenResult = static::getToken($creds['api_url'], $creds['username'], $creds['password']);

        if ($tokenResult['success']) {
            return [
                'success' => true,
                'environment' => $creds['is_live'] ? 'live' : 'sandbox',
                'api_url' => $creds['api_url'],
                'username' => $creds['username'],
                'store_id' => $tokenResult['store_id'] ?? 1,
                'message' => 'Connection successful! Authenticated with shurjoPay (' . ($creds['is_live'] ? 'Live' : 'Sandbox') . ').',
            ];
        }

        return [
            'success' => false,
            'environment' => $creds['is_live'] ? 'live' : 'sandbox',
            'api_url' => $creds['api_url'],
            'username' => $creds['username'],
            'message' => $tokenResult['message'] ?? 'Authentication failed. Please check your credentials.',
        ];
    }

    /**
     * Initiate a payment via /api/secret-pay and get the checkout redirect URL.
     */
    public static function initiatePayment(Order $order, User $user, string $clientIp = '127.0.0.1'): array
    {
        $creds = static::getActiveCredentials();

        if (!$creds['enabled']) {
            return [
                'success' => false,
                'message' => 'shurjoPay payment gateway is currently disabled by administrator.',
            ];
        }

        $tokenResult = static::getToken($creds['api_url'], $creds['username'], $creds['password']);
        if (!$tokenResult['success']) {
            return [
                'success' => false,
                'message' => 'Payment initialization failed: ' . ($tokenResult['message'] ?? 'Could not authenticate with gateway.'),
            ];
        }

        $token = $tokenResult['token'];
        $storeId = $tokenResult['store_id'] ?? 1;
        $apiUrl = $creds['api_url'];
        $prefix = $creds['prefix'];

        // shurjoPay requires order_id to start with merchant prefix
        $cleanOrderNum = preg_replace('/[^A-Za-z0-9]/', '', $order->order_number);
        $spOrderId = $prefix . '_' . $cleanOrderNum . '_' . Str::random(4);

        $returnUrl = url('/api/payment/shurjopay/callback');
        $cancelUrl = url('/api/payment/shurjopay/cancel?order_id=' . $order->id . '&order_number=' . $order->order_number);

        $payload = [
            'prefix' => $prefix,
            'token' => $token,
            'return_url' => $returnUrl,
            'cancel_url' => $cancelUrl,
            'store_id' => $storeId,
            'amount' => (float) $order->final_amount,
            'order_id' => $spOrderId,
            'currency' => 'BDT',
            'customer_name' => $user->name ?: 'Student',
            'customer_address' => $user->address ?: 'Dhaka, Bangladesh',
            'customer_email' => $user->email ?: ($user->phone . '@monologueedu.com'),
            'customer_phone' => $user->phone ?: '01700000000',
            'customer_city' => 'Dhaka',
            'customer_post_code' => '1200',
            'client_ip' => $clientIp,
            'discount_amount' => 0,
            'disc_percent' => 0,
            'value1' => (string) $order->id,
            'value2' => (string) $order->order_number,
        ];

        try {
            $endpoint = "{$apiUrl}/api/secret-pay";
            $response = Http::timeout(25)
                ->withHeaders([
                    'Authorization' => "Bearer {$token}",
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->post($endpoint, $payload);

            $data = $response->json();

            if (!$response->successful() || empty($data['checkout_url'])) {
                Log::error('shurjoPay secret-pay failed', [
                    'status' => $response->status(),
                    'response' => $data,
                    'payload' => $payload,
                ]);

                return [
                    'success' => false,
                    'message' => $data['message'] ?? 'shurjoPay failed to generate checkout URL. Please try again.',
                    'data' => $data,
                ];
            }

            return [
                'success' => true,
                'checkout_url' => $data['checkout_url'],
                'sp_order_id' => $spOrderId,
                'customer_order_id' => $data['customer_order_id'] ?? $spOrderId,
                'sp_code' => $data['sp_code'] ?? null,
            ];
        } catch (\Throwable $e) {
            Log::error('shurjoPay initiatePayment exception: ' . $e->getMessage(), ['exception' => $e]);
            return [
                'success' => false,
                'message' => 'Error contacting shurjoPay payment gateway: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Verify payment status using shurjoPay /api/verification.
     */
    public static function verifyPayment(string $orderId): array
    {
        $creds = static::getActiveCredentials();
        $tokenResult = static::getToken($creds['api_url'], $creds['username'], $creds['password']);

        if (!$tokenResult['success']) {
            return [
                'success' => false,
                'verified' => false,
                'message' => 'Verification failed: unable to obtain gateway security token.',
            ];
        }

        $token = $tokenResult['token'];
        $apiUrl = $creds['api_url'];
        $endpoint = "{$apiUrl}/api/verification";

        try {
            $response = Http::timeout(25)
                ->withHeaders([
                    'Authorization' => "Bearer {$token}",
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->post($endpoint, [
                    'order_id' => $orderId,
                    'token' => $token,
                ]);

            if (!$response->successful()) {
                Log::error('shurjoPay verification HTTP error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'order_id' => $orderId,
                ]);

                return [
                    'success' => false,
                    'verified' => false,
                    'message' => 'shurjoPay verification HTTP error: ' . $response->status(),
                ];
            }

            $raw = $response->json();
            $data = is_array($raw) && isset($raw[0]) ? $raw[0] : (is_array($raw) ? $raw : []);

            $spCode = (string) ($data['sp_code'] ?? '');
            $txStatus = strtolower((string) ($data['transaction_status'] ?? ''));
            $bankStatus = strtolower((string) ($data['bank_status'] ?? ''));

            $isCompleted = ($spCode === '1000') || ($txStatus === 'completed') || ($bankStatus === 'success');

            if ($isCompleted) {
                return [
                    'success' => true,
                    'verified' => true,
                    'sp_code' => $spCode,
                    'transaction_status' => $data['transaction_status'] ?? 'Completed',
                    'bank_status' => $data['bank_status'] ?? 'Success',
                    'bank_trx_id' => $data['bank_trx_id'] ?? null,
                    'sp_order_id' => $data['order_id'] ?? $orderId,
                    'customer_order_id' => $data['customer_order_id'] ?? null,
                    'amount' => (float) ($data['amount'] ?? 0),
                    'method' => $data['method'] ?? 'shurjopay',
                    'card_holder_name' => $data['card_holder_name'] ?? null,
                    'phone_no' => $data['phone_no'] ?? null,
                    'date_time' => $data['date_time'] ?? null,
                    'value1' => $data['value1'] ?? null,
                    'value2' => $data['value2'] ?? null,
                    'raw' => $data,
                ];
            }

            return [
                'success' => true,
                'verified' => false,
                'sp_code' => $spCode,
                'transaction_status' => $data['transaction_status'] ?? 'Failed',
                'bank_status' => $data['bank_status'] ?? 'Failed',
                'message' => $data['sp_message'] ?? $data['message'] ?? 'Transaction was not successful or has been cancelled.',
                'raw' => $data,
            ];
        } catch (\Throwable $e) {
            Log::error('shurjoPay verifyPayment exception: ' . $e->getMessage(), [
                'order_id' => $orderId,
                'exception' => $e,
            ]);

            return [
                'success' => false,
                'verified' => false,
                'message' => 'shurjoPay verification exception: ' . $e->getMessage(),
            ];
        }
    }
}
