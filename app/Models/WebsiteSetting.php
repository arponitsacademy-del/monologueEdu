<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteSetting extends Model
{
    protected $fillable = [
        'site_name',
        'site_tagline',
        'default_language',
        'logo_url',
        'favicon_url',
        'contact_email',
        'contact_phone',
        'primary_color',
        'secondary_color',
        'copyright_text',
        'header_settings',
        'footer_settings',
        'manual_payment_settings',
        'vdocipher_settings',
        'openai_settings',
    ];

    protected $casts = [
        'header_settings' => 'array',
        'footer_settings' => 'array',
        'manual_payment_settings' => 'array',
        'vdocipher_settings' => 'array',
        'openai_settings' => 'array',
    ];

    public static function defaultHeaderSettings(): array
    {
        return [
            'sticky' => true,
            'show_theme_toggle' => true,
            'show_auth_buttons' => true,
            'logo_url' => null,
            'logo_height' => 44,
            'brand_title' => 'Monologue',
            'brand_subtitle' => 'Edu',
            'announcement_enabled' => false,
            'announcement_text' => '🎉 New batch admission open! Enroll now with 20% discount.',
            'announcement_link' => '/courses',
            'announcement_bg' => '#0284c7',
            'cta_button_enabled' => false,
            'cta_button_text' => 'Free Classes',
            'cta_button_link' => '/courses',
            'menu_items' => [
                ['id' => '1', 'label' => 'Home', 'url' => '/', 'is_external' => false, 'highlight' => false],
                ['id' => '2', 'label' => 'All Courses', 'url' => '/courses', 'is_external' => false, 'highlight' => true],
            ],
        ];
    }

    public static function defaultFooterSettings(): array
    {
        return [
            'bg_color' => '#0f172a',
            'brand_title' => 'Monologue',
            'brand_subtitle' => 'Edu',
            'description' => 'Bangladesh’s leading online learning platform. Prepare for exams with the best mentors.',
            'badge_text' => '100% Trusted & Quality Online Education',
            'show_badge' => true,
            'column_2_title' => 'Quick Links',
            'column_2_links' => [
                ['id' => '1', 'label' => 'Home', 'url' => '/'],
                ['id' => '2', 'label' => 'All Courses', 'url' => '/courses'],
                ['id' => '3', 'label' => 'Physics Courses', 'url' => '/courses?category=hsc-physics'],
                ['id' => '4', 'label' => 'Admission Preparation', 'url' => '/courses?category=admission'],
            ],
            'column_3_title' => 'Course Categories',
            'column_3_links' => [
                ['id' => '1', 'label' => 'HSC Physics', 'url' => '/courses?category=hsc-physics'],
                ['id' => '2', 'label' => 'HSC Chemistry', 'url' => '/courses?category=chemistry'],
                ['id' => '3', 'label' => 'Higher Mathematics', 'url' => '/courses?category=math'],
                ['id' => '4', 'label' => 'Admission Preparation', 'url' => '/courses?category=admission'],
            ],
            'column_4_title' => 'Contact Us',
            'phone' => '+880 1700 000000',
            'phone_hours' => '10 AM - 10 PM (Sat - Thu)',
            'email' => 'support@monologueedu.com',
            'address' => 'Dhaka, Bangladesh',
            'social_links' => [
                ['id' => '1', 'platform' => 'facebook', 'url' => 'https://facebook.com'],
                ['id' => '2', 'platform' => 'youtube', 'url' => 'https://youtube.com'],
            ],
            'copyright_text' => '© 2026 Monologue Edu. All rights reserved.',
            'bottom_credit' => 'Crafted with ❤️ for passionate learners',
        ];
    }

    public static function defaultManualPaymentSettings(): array
    {
        return [
            'bkash' => [
                'enabled' => true,
                'name' => 'bKash',
                'account_number' => '01700000000',
                'type' => 'send_money', // 'send_money' | 'payment' | 'cash_out'
                'instructions' => 'Open your bKash app or dial *247# to Send Money to the recipient number. Enter the TrxID below after payment.',
                'instructions_en' => 'Open your bKash app or dial *247# to Send Money to the recipient number. Enter the TrxID below after payment.',
            ],
            'nagad' => [
                'enabled' => true,
                'name' => 'Nagad',
                'account_number' => '01700000000',
                'type' => 'send_money', // 'send_money' | 'payment' | 'cash_out'
                'instructions' => 'Open your Nagad app or dial *167# to Send Money to the recipient number. Enter the TrxID below after payment.',
                'instructions_en' => 'Open your Nagad app or dial *167# to Send Money to the recipient number. Enter the TrxID below after payment.',
            ],
            'rocket' => [
                'enabled' => true,
                'name' => 'Rocket',
                'account_number' => '01700000000',
                'type' => 'send_money', // 'send_money' | 'payment' | 'cash_out'
                'instructions' => 'Open your Rocket app or dial *322# to Send Money to the recipient number. Enter the TrxID below after payment.',
                'instructions_en' => 'Open your Rocket app or dial *322# to Send Money to the recipient number. Enter the TrxID below after payment.',
            ],
        ];
    }

    public static function defaultVdocipherSettings(): array
    {
        return [
            'enabled' => false,
            'api_secret' => '',
            'watermark_enabled' => true,
        ];
    }

    public static function defaultOpenaiSettings(): array
    {
        return [
            'api_key' => '',
            'default_model' => 'gpt-4o-mini',
            'cost_per_1k_input' => 0.00015,
            'cost_per_1k_output' => 0.00060,
        ];
    }

    public static function current(): self
    {
        $setting = static::first();
        if (! $setting) {
            $setting = static::create([
                'site_name' => 'Monologue Edu',
                'site_tagline' => 'Premier Online Learning & EdTech Platform',
                'default_language' => 'en',
                'logo_url' => null,
                'favicon_url' => null,
                'contact_email' => 'support@monologueedu.com',
                'contact_phone' => '+880 1700 000000',
                'primary_color' => '#0ea5e9',
                'secondary_color' => '#0f172a',
                'copyright_text' => '© 2026 Monologue Edu. All rights reserved.',
                'header_settings' => static::defaultHeaderSettings(),
                'footer_settings' => static::defaultFooterSettings(),
                'manual_payment_settings' => static::defaultManualPaymentSettings(),
                'openai_settings' => static::defaultOpenaiSettings(),
            ]);
        }

        // Ensure defaults if existing record was created prior to columns
        if ($setting->site_name === 'Novonex Academy') {
            $header = $setting->header_settings ?? [];
            if (isset($header['brand_title']) && $header['brand_title'] === 'Novonex') {
                $header['brand_title'] = 'Monologue';
                $header['brand_subtitle'] = 'Edu';
            }
            $footer = $setting->footer_settings ?? [];
            if (isset($footer['brand_title']) && $footer['brand_title'] === 'Novonex') {
                $footer['brand_title'] = 'Monologue';
                $footer['brand_subtitle'] = 'Edu';
                $footer['email'] = 'support@monologueedu.com';
                $footer['copyright_text'] = '© 2026 Monologue Edu. All rights reserved.';
            }

            $setting->update([
                'site_name' => 'Monologue Edu',
                'site_tagline' => 'Premier Online Learning & EdTech Platform',
                'contact_email' => 'support@monologueedu.com',
                'copyright_text' => '© 2026 Monologue Edu. All rights reserved.',
                'header_settings' => $header,
                'footer_settings' => $footer,
            ]);
        }

        if (empty($setting->header_settings)) {
            $setting->header_settings = static::defaultHeaderSettings();
        }
        if (empty($setting->footer_settings)) {
            $setting->footer_settings = static::defaultFooterSettings();
        }
        if (empty($setting->manual_payment_settings)) {
            $setting->manual_payment_settings = static::defaultManualPaymentSettings();
        }
        if (empty($setting->vdocipher_settings)) {
            $setting->vdocipher_settings = static::defaultVdocipherSettings();
        }
        if (empty($setting->openai_settings)) {
            $setting->openai_settings = static::defaultOpenaiSettings();
        }

        return $setting;
    }
}
