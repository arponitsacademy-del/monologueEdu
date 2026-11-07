<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCommission;
use App\Models\AffiliatePayout;
use App\Models\AffiliateProfile;
use App\Models\AffiliateSetting;
use App\Models\Course;
use App\Models\CourseAffiliateSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AffiliateAdminController extends Controller
{
    /**
     * Get General Affiliate Settings
     */
    public function getGeneralSettings(): JsonResponse
    {
        $settings = AffiliateSetting::current();

        $stats = [
            'total_affiliates' => AffiliateProfile::count(),
            'active_affiliates' => AffiliateProfile::where('status', 'active')->count(),
            'total_commissions_paid' => (float) AffiliateCommission::where('status', 'approved')->sum('commission_amount'),
            'pending_payouts' => (float) AffiliatePayout::where('status', 'pending')->sum('amount'),
        ];

        return response()->json([
            'settings' => $settings,
            'stats' => $stats,
        ]);
    }

    /**
     * Update General Affiliate Settings
     */
    public function updateGeneralSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_enabled' => ['required', 'boolean'],
            'cookie_days' => ['required', 'integer', 'min:1', 'max:365'],
            'default_commission_type' => ['required', 'in:percentage,fixed'],
            'default_commission_amount' => ['required', 'numeric', 'min:0'],
            'default_discount_type' => ['required', 'in:percentage,fixed'],
            'default_discount_amount' => ['required', 'numeric', 'min:0'],
            'min_payout_amount' => ['required', 'numeric', 'min:0'],
            'require_course_purchase' => ['required', 'boolean'],
            'terms_notice' => ['nullable', 'string'],
        ]);

        $settings = AffiliateSetting::current();
        $settings->update($validated);

        return response()->json([
            'message' => 'সাধারণ অ্যাফিলিয়েট সেটিংস সফলভাবে আপডেট করা হয়েছে।',
            'settings' => $settings,
        ]);
    }

    /**
     * Get Course Specific Affiliate Settings
     */
    public function getCourseSettings(): JsonResponse
    {
        $courses = Course::select('id', 'title', 'price', 'sale_price', 'status')
            ->with('affiliateSetting')
            ->orderBy('title')
            ->get();

        $generalSettings = AffiliateSetting::current();

        return response()->json([
            'courses' => $courses,
            'general_settings' => $generalSettings,
        ]);
    }

    /**
     * Set or update custom affiliate commission & discount for a specific course
     */
    public function updateCourseSetting(Request $request, Course $course): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
            'commission_type' => ['required', 'in:percentage,fixed'],
            'commission_amount' => ['required', 'numeric', 'min:0'],
            'discount_type' => ['required', 'in:percentage,fixed'],
            'discount_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $setting = CourseAffiliateSetting::updateOrCreate(
            ['course_id' => $course->id],
            $validated
        );

        return response()->json([
            'message' => 'কোর্সের অ্যাফিলিয়েট কমিশন ও ডিসকাউন্ট সফলভাবে সংরক্ষিত হয়েছে।',
            'setting' => $setting,
        ]);
    }

    /**
     * Delete course specific override (revert to general defaults)
     */
    public function deleteCourseSetting(Course $course): JsonResponse
    {
        if ($course->affiliateSetting) {
            $course->affiliateSetting->delete();
        }

        return response()->json([
            'message' => 'কোর্সের কাস্টম কমিশন মুছে ফেলা হয়েছে। এখন সাধারণ সেটিংস প্রযোজ্য হবে।',
        ]);
    }

    /**
     * List all affiliates
     */
    public function getAffiliates(Request $request): JsonResponse
    {
        $query = AffiliateProfile::with(['user:id,name,email,phone'])
            ->withCount(['commissions', 'orders']);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('affiliate_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $affiliates = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json($affiliates);
    }

    /**
     * List affiliate commission records
     */
    public function getCommissions(Request $request): JsonResponse
    {
        $query = AffiliateCommission::with([
            'affiliate.user:id,name,email,phone',
            'course:id,title,price',
            'order:id,order_number',
            'buyer:id,name,email,phone',
        ]);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereHas('order', fn($oq) => $oq->where('order_number', 'like', "%{$search}%"))
                  ->orWhereHas('affiliate.user', fn($auq) => $auq->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                  ->orWhereHas('buyer', fn($bq) => $bq->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"));
            });
        }

        $commissions = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json($commissions);
    }

    /**
     * List payout requests
     */
    public function getPayouts(Request $request): JsonResponse
    {
        $query = AffiliatePayout::with(['affiliate.user:id,name,email,phone']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $payouts = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json($payouts);
    }

    /**
     * Process / Update payout status
     */
    public function updatePayoutStatus(Request $request, AffiliatePayout $payout): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'transaction_ref' => ['nullable', 'string', 'max:255'],
            'admin_notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($payout, $validated) {
            $oldStatus = $payout->status;
            $newStatus = $validated['status'];

            $payout->update([
                'status' => $newStatus,
                'transaction_ref' => $validated['transaction_ref'] ?? $payout->transaction_ref,
                'admin_notes' => $validated['admin_notes'] ?? $payout->admin_notes,
                'processed_at' => now(),
            ]);

            $profile = $payout->affiliate;

            if ($oldStatus === AffiliatePayout::STATUS_PENDING) {
                if ($newStatus === AffiliatePayout::STATUS_APPROVED) {
                    $profile->total_withdrawn += $payout->amount;
                    $profile->save();
                } elseif ($newStatus === AffiliatePayout::STATUS_REJECTED) {
                    // Refund held balance back to affiliate
                    $profile->balance += $payout->amount;
                    $profile->save();
                }
            }
        });

        return response()->json([
            'message' => 'পেআউট রিকোয়েস্ট সফলভাবে আপডেট করা হয়েছে।',
            'payout' => $payout->fresh('affiliate.user'),
        ]);
    }
}
