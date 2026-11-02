<?php

use App\Models\Category;
use App\Models\Page;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ensure system 'courses' page exists
        Page::firstOrCreate(
            ['slug' => 'courses'],
            [
                'title' => 'সকল কোর্সসমূহ',
                'status' => 'published',
                'layout_type' => 'builder',
                'is_system' => true,
                'meta_title' => 'সকল কোর্সসমূহ - Novonex Academy',
                'meta_description' => 'আপনার লক্ষ্য অর্জনের জন্য উপযুক্ত কোর্সটি বেছে নিন। অভিজ্ঞ শিক্ষকদের সাথে পূর্ণাঙ্গ প্রস্তুতি।',
                'blocks' => Page::defaultCoursesBlocks(),
            ]
        );

        // 2. Sync all categories into pages
        Page::syncCategoryPages();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Page::where('slug', 'courses')->delete();
        Page::where('layout_type', 'category')->delete();
    }
};
