<?php

namespace App\Services;

use App\Models\SmsLog;
use App\Models\SmsSetting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GreenWebSmsService
{
    protected ?string $token;
    protected bool $enabled;

    public function __construct()
    {
        $settings = SmsSetting::current();
        $this->token = $settings->api_token;
        $this->enabled = (bool) $settings->sms_enabled;
    }

    public function isConfigured(): bool
    {
        return ! empty($this->token);
    }

    public function isEnabled(): bool
    {
        return $this->enabled && $this->isConfigured();
    }

    /**
     * Send SMS to a Bangladeshi mobile number.
     *
     * @return array [success => bool, status => string, message => string]
     */
    public function sendSms(string $phone, string $message, string $type = 'transactional', ?int $campaignId = null): array
    {
        $normalizedPhone = User::normalizePhone($phone);
        if (! $normalizedPhone || ! User::isValidPhoneNumber($normalizedPhone)) {
            return [
                'success' => false,
                'status' => 'invalid_number',
                'message' => 'Invalid Bangladeshi phone number.',
            ];
        }

        // GreenWeb standard recipient format: 8801XXXXXXXXX or 01XXXXXXXXX
        $recipient = ltrim($normalizedPhone, '+');

        if (! $this->isEnabled()) {
            // Simulated / Mock mode
            SmsLog::create([
                'campaign_id' => $campaignId,
                'phone' => $normalizedPhone,
                'message' => $message,
                'status' => 'simulated',
                'type' => $type,
                'response_payload' => json_encode(['note' => 'SMS gateway is disabled or in simulation mode']),
                'created_at' => now(),
            ]);

            return [
                'success' => true,
                'status' => 'simulated',
                'message' => 'SMS simulated successfully (gateway disabled).',
            ];
        }

        try {
            $response = Http::timeout(10)->asForm()->post('http://api.greenweb.com.bd/api.php', [
                'token' => $this->token,
                'to' => $recipient,
                'message' => $message,
            ]);

            $responseBody = $response->body();
            $isSuccess = $response->successful() && ! str_contains(strtolower($responseBody), 'error');

            SmsLog::create([
                'campaign_id' => $campaignId,
                'phone' => $normalizedPhone,
                'message' => $message,
                'status' => $isSuccess ? 'sent' : 'failed',
                'type' => $type,
                'response_payload' => substr($responseBody, 0, 500),
                'created_at' => now(),
            ]);

            return [
                'success' => $isSuccess,
                'status' => $isSuccess ? 'sent' : 'failed',
                'message' => $responseBody,
            ];
        } catch (\Throwable $e) {
            Log::error('GreenWeb SMS Error: ' . $e->getMessage());

            SmsLog::create([
                'campaign_id' => $campaignId,
                'phone' => $normalizedPhone,
                'message' => $message,
                'status' => 'failed',
                'type' => $type,
                'response_payload' => json_encode(['error' => $e->getMessage()]),
                'created_at' => now(),
            ]);

            return [
                'success' => false,
                'status' => 'error',
                'message' => 'Failed to reach SMS provider.',
            ];
        }
    }

    /**
     * Check account balance from GreenWeb.
     */
    public function checkBalance(): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'message' => 'API token not configured.',
                'balance' => null,
            ];
        }

        try {
            $response = Http::timeout(8)->get('http://api.greenweb.com.bd/g_api.php', [
                'token' => $this->token,
                'balance' => 'true',
            ]);

            return [
                'success' => $response->successful(),
                'message' => $response->body(),
                'balance' => $response->body(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'balance' => null,
            ];
        }
    }
}
