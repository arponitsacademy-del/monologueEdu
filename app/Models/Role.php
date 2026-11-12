<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'permissions',
        'is_system',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_system' => 'boolean',
    ];

    /**
     * Relationship to users assigned this custom role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'custom_role_id');
    }

    /**
     * Check if this role has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        $perms = $this->permissions ?? [];

        if (in_array('*', $perms, true)) {
            return true;
        }

        if (in_array($permission, $perms, true)) {
            return true;
        }

        // Support module wildcard e.g. "courses.*"
        $parts = explode('.', $permission);
        if (count($parts) > 1 && in_array($parts[0] . '.*', $perms, true)) {
            return true;
        }

        return false;
    }

    /**
     * Check if table exists and self-heal schema if running before migration.
     */
    public static function ensureSchema(): void
    {
        try {
            if (! Schema::hasTable('roles')) {
                Schema::create('roles', function (Blueprint $table) {
                    $table->id();
                    $table->string('name');
                    $table->string('slug')->unique();
                    $table->text('description')->nullable();
                    $table->json('permissions')->nullable();
                    $table->boolean('is_system')->default(false);
                    $table->timestamps();
                });
            }

            if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'custom_role_id')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->unsignedBigInteger('custom_role_id')->nullable()->after('role')->index();
                });
            }
        } catch (\Throwable $e) {
            // Ignore schema creation errors in read-only / unmigrated contexts
        }
    }

    /**
     * Return list of all granular system permissions grouped by module.
     */
    public static function permissionCatalog(): array
    {
        return [
            [
                'module' => 'courses',
                'name' => 'কোর্স ও কারিকুলাম (Courses)',
                'icon' => 'BookOpen',
                'permissions' => [
                    ['key' => 'courses.view', 'label' => 'কোর্স তালিকা দেখা (View Courses)'],
                    ['key' => 'courses.create', 'label' => 'নতুন কোর্স তৈরি (Create Courses)'],
                    ['key' => 'courses.edit', 'label' => 'কোর্স এডিট ও লেকচার ম্যানেজ (Edit Courses & Content)'],
                    ['key' => 'courses.delete', 'label' => 'কোর্স মুছে ফেলা (Delete Courses)'],
                    ['key' => 'courses.categories', 'label' => 'কোর্স ক্যাটাগরি ম্যানেজমেন্ট (Course Categories)'],
                ],
            ],
            [
                'module' => 'bundles',
                'name' => 'কম্বো কোর্স বান্ডেল (Bundles)',
                'icon' => 'Boxes',
                'permissions' => [
                    ['key' => 'bundles.view', 'label' => 'বান্ডেল তালিকা দেখা (View Bundles)'],
                    ['key' => 'bundles.manage', 'label' => 'বান্ডেল তৈরি ও পরিবর্তন (Manage Bundles)'],
                ],
            ],
            [
                'module' => 'exams',
                'name' => 'পরীক্ষা ও মডেল টেস্ট (Exams)',
                'icon' => 'ClipboardList',
                'permissions' => [
                    ['key' => 'exams.view', 'label' => 'পরীক্ষা ও সাবমিশন দেখা (View Exams)'],
                    ['key' => 'exams.create', 'label' => 'নতুন পরীক্ষা তৈরি (Create Exams)'],
                    ['key' => 'exams.edit', 'label' => 'প্রশ্ন তৈরি ও এডিট (Edit Exams & Questions)'],
                    ['key' => 'exams.grade', 'label' => 'খাতা মূল্যায়ন ও রেজাল্ট প্রকাশ (Grade & Submissions)'],
                    ['key' => 'exams.delete', 'label' => 'পরীক্ষা ডিলিট করা (Delete Exams)'],
                ],
            ],
            [
                'module' => 'orders',
                'name' => 'অর্ডার ও এনরোলমেন্ট (Orders)',
                'icon' => 'ShoppingCart',
                'permissions' => [
                    ['key' => 'orders.view', 'label' => 'অর্ডারের তালিকা দেখা (View Orders)'],
                    ['key' => 'orders.manage', 'label' => 'অর্ডার অনুমোদন ও স্ট্যাটাস পরিবর্তন (Manage Orders)'],
                ],
            ],
            [
                'module' => 'payments',
                'name' => 'পেমেন্ট গেটওয়ে (Payments)',
                'icon' => 'CreditCard',
                'permissions' => [
                    ['key' => 'payments.manual', 'label' => 'ম্যানুয়াল পেমেন্ট মেথড পরিচালনা (Manual Gateways)'],
                    ['key' => 'payments.shurjopay', 'label' => 'shurjoPay গেটওয়ে কনফিগারেশন (shurjoPay Integration)'],
                ],
            ],
            [
                'module' => 'users',
                'name' => 'ইউজার ও শিক্ষার্থী ম্যানেজমেন্ট (Users)',
                'icon' => 'Users',
                'permissions' => [
                    ['key' => 'users.view', 'label' => 'সকল ইউজার দেখা (View Users)'],
                    ['key' => 'users.create', 'label' => 'নতুন ইউজার তৈরি (Create New User)'],
                    ['key' => 'users.edit', 'label' => 'ইউজার এডিট ও স্ট্যাটাস টগল (Edit User & Status)'],
                    ['key' => 'roles.manage', 'label' => 'কাস্টম রোল তৈরি ও পারমিশন বরাদ্দ (Manage Custom Roles)'],
                ],
            ],
            [
                'module' => 'marketing',
                'name' => 'মার্কেটিং ও কুপন (Marketing)',
                'icon' => 'TicketPercent',
                'permissions' => [
                    ['key' => 'marketing.coupons', 'label' => 'কুপন জেনারেটর ও অফার (Manage Coupons)'],
                    ['key' => 'marketing.affiliates', 'label' => 'অ্যাফিলিয়েট প্রোগ্রাম (Affiliate Settings)'],
                ],
            ],
            [
                'module' => 'announcements',
                'name' => 'ঘোষণা ও নোটিফিকেশন (Announcements)',
                'icon' => 'Megaphone',
                'permissions' => [
                    ['key' => 'announcements.manage', 'label' => 'শিক্ষার্থীদের নোটিশ পাঠানো (Send Announcements)'],
                ],
            ],
            [
                'module' => 'sms',
                'name' => 'SMS গেটওয়ে ও পুশ (SMS Gateway)',
                'icon' => 'MessageSquareText',
                'permissions' => [
                    ['key' => 'sms.settings', 'label' => 'SMS গেটওয়ে সেটিংস (SMS Config)'],
                    ['key' => 'sms.send', 'label' => 'বাল্ক এসএমএস ও অটো পুশ (Send SMS Campaigns)'],
                ],
            ],
            [
                'module' => 'appearance',
                'name' => 'ওয়েবসাইট ডিজাইন ও পেজ (Appearance & Pages)',
                'icon' => 'Palette',
                'permissions' => [
                    ['key' => 'pages.manage', 'label' => 'পেইজ বিল্ডার ও কন্টেন্ট তৈরি (Page Builder)'],
                    ['key' => 'appearance.manage', 'label' => 'হেডার, ফুটার ও ওয়েবসাইট থিম (Website Appearance)'],
                    ['key' => 'media.manage', 'label' => 'মিডিয়া লাইব্রেরি (Media Library)'],
                ],
            ],
            [
                'module' => 'analytics',
                'name' => 'রিপোর্ট ও অ্যানালিটিক্স (Analytics)',
                'icon' => 'BarChart3',
                'permissions' => [
                    ['key' => 'analytics.view', 'label' => 'বিক্রি ও শিক্ষার্থীর রিপোর্ট দেখা (View Analytics)'],
                ],
            ],
            [
                'module' => 'settings',
                'name' => 'সিস্টেম সেটিংস (Settings)',
                'icon' => 'Settings',
                'permissions' => [
                    ['key' => 'settings.manage', 'label' => 'সাধারণ সিস্টেম সেটিংস পরিবর্তন (Manage Settings)'],
                ],
            ],
        ];
    }
}

