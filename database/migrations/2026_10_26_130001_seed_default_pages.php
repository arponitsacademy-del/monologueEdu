<?php

use App\Models\Page;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Home Page (System protected)
        Page::firstOrCreate(
            ['slug' => 'home'],
            [
                'title' => 'Home Page',
                'status' => 'published',
                'layout_type' => 'builder',
                'is_system' => true,
                'meta_title' => 'Novonex Academy | Best Online Learning Platform in Bangladesh',
                'meta_description' => 'বাংলাদেশের শীর্ষস্থানীয় অনলাইন এডুকেশন প্ল্যাটফর্ম। এইচএসসি ও ভর্তি পরীক্ষার সেরা প্রস্তুতি।',
                'blocks' => Page::defaultHomeBlocks(),
            ]
        );

        // 2. Privacy Policy Page
        Page::firstOrCreate(
            ['slug' => 'privacy-policy'],
            [
                'title' => 'Privacy Policy',
                'status' => 'published',
                'layout_type' => 'builder',
                'is_system' => false,
                'meta_title' => 'Privacy Policy - Novonex Academy',
                'meta_description' => 'Novonex Academy privacy policy and data protection terms.',
                'blocks' => [
                    [
                        'id' => 'block_hero_privacy',
                        'type' => 'cta_banner',
                        'title' => 'Header Banner',
                        'settings' => [
                            'badge' => 'Legal & Terms',
                            'title' => 'Privacy Policy / গোপনীয়তা নীতি',
                            'subtitle' => 'Novonex Academy আপনার ব্যক্তিগত তথ্যের সুরক্ষা নিশ্চিত করতে বদ্ধপরিকর।',
                            'buttonText' => '',
                            'buttonLink' => '',
                            'bgColor' => 'slate',
                        ]
                    ],
                    [
                        'id' => 'block_text_privacy',
                        'type' => 'rich_text',
                        'title' => 'Privacy Content',
                        'settings' => [
                            'content' => "<h2>১. তথ্য সংগ্রহ ও ব্যবহার</h2>\n<p>আমরা শিক্ষার্থীদের নাম, মোবাইল নম্বর এবং ইমেইল সংগ্রহ করি একাউন্ট তৈরি ও কোর্স ব্যবস্থাপনা সংক্রান্ত যোগাযোগের জন্য।</p>\n<h2>২. পেমেন্ট ও নিরাপত্তা</h2>\n<p>সকল পেমেন্ট নিরাপদ ব্যাংকিং ও মোবাইল পেমেন্ট গেটওয়ের মাধ্যমে পরিচালিত হয়। আমরা কোনো ধরনের গোপন পিন বা পাসওয়ার্ড সংরক্ষণ করি না।</p>\n<h2>৩. যোগাযোগ</h2>\n<p>আপনার কোনো প্রশ্ন বা জিজ্ঞাসা থাকলে আমাদের সাপোর্ট টিমের সাথে সরাসরি যোগাযোগ করতে পারেন।</p>"
                        ]
                    ]
                ],
            ]
        );

        // 3. Terms and Conditions
        Page::firstOrCreate(
            ['slug' => 'terms'],
            [
                'title' => 'Terms & Conditions',
                'status' => 'published',
                'layout_type' => 'builder',
                'is_system' => false,
                'meta_title' => 'Terms and Conditions - Novonex Academy',
                'meta_description' => 'Terms and conditions of using Novonex Academy.',
                'blocks' => [
                    [
                        'id' => 'block_hero_terms',
                        'type' => 'cta_banner',
                        'title' => 'Terms Banner',
                        'settings' => [
                            'badge' => 'Rules & Guidelines',
                            'title' => 'Terms & Conditions / শর্তাবলী',
                            'subtitle' => 'Novonex Academy প্ল্যাটফর্মটি ব্যবহারের সকল নিয়ম ও শর্তাবলী।',
                            'buttonText' => '',
                            'buttonLink' => '',
                            'bgColor' => 'sky',
                        ]
                    ],
                    [
                        'id' => 'block_text_terms',
                        'type' => 'rich_text',
                        'title' => 'Terms Content',
                        'settings' => [
                            'content' => "<h2>১. কোর্স এক্সেস ও ব্যবহার বিধি</h2>\n<p>কোর্সের সকল কনটেন্ট ও ভিডিও শুধুমাত্র আপনার ব্যক্তিগত শিক্ষার জন্য। কোনো ভিডিও ডাউনলোড বা অননুমোদিতভাবে শেয়ার করা আইনত দণ্ডনীয়।</p>\n<h2>২. একাউন্ট সততা</h2>\n<p>একজন শিক্ষার্থী একটি একাউন্ট ব্যবহার করবেন। একাধিক ব্যক্তির সাথে লগইন শেয়ার করলে একাউন্ট সাময়িকভাবে স্থগিত হতে পারে।</p>"
                        ]
                    ]
                ],
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Page::whereIn('slug', ['home', 'privacy-policy', 'terms'])->delete();
    }
};
