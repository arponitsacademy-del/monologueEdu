<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('website_settings')) {
            $settings = DB::table('website_settings')->first();
            if ($settings) {
                $header = !empty($settings->header_settings) ? json_decode($settings->header_settings, true) : [];
                $footer = !empty($settings->footer_settings) ? json_decode($settings->footer_settings, true) : [];

                if (is_array($header)) {
                    $header['brand_title'] = 'Monologue';
                    $header['brand_subtitle'] = 'Edu';
                }
                if (is_array($footer)) {
                    $footer['brand_title'] = 'Monologue';
                    $footer['brand_subtitle'] = 'Edu';
                    $footer['email'] = 'support@monologueedu.com';
                    $footer['copyright_text'] = '© 2026 Monologue Edu. All rights reserved.';
                }

                DB::table('website_settings')->where('id', $settings->id)->update([
                    'site_name' => 'Monologue Edu',
                    'site_tagline' => 'Premier Online Learning & EdTech Platform',
                    'default_language' => 'en',
                    'contact_email' => 'support@monologueedu.com',
                    'copyright_text' => '© 2026 Monologue Edu. All rights reserved.',
                    'header_settings' => json_encode($header),
                    'footer_settings' => json_encode($footer),
                ]);
            }
        }

        if (Schema::hasTable('pages')) {
            $pages = DB::table('pages')->get();
            foreach ($pages as $p) {
                $updated = false;
                $newMeta = str_replace('Novonex Academy', 'Monologue Edu', $p->meta_title ?? '');
                $rawBlocks = $p->blocks ?? '';
                $newBlocks = str_replace(['Novonex Academy', 'Novonex'], ['Monologue Edu', 'Monologue Edu'], $rawBlocks);

                if ($newMeta !== $p->meta_title || $newBlocks !== $rawBlocks) {
                    DB::table('pages')->where('id', $p->id)->update([
                        'meta_title' => $newMeta,
                        'blocks' => $newBlocks,
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};

