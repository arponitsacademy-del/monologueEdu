<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminCouponController extends Controller
{
    /**
     * List all coupons with filters and summary analytics
     */
    public function index(Request $request): JsonResponse
    {
        $query = Coupon::with([
            'courses:id,title,price',
            'categories:id,name',
            'restrictedUser:id,name,phone,email',
            'creator:id,name',
        ])->withCount('usages');

        // Search by code or title
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by discount type
        if ($request->filled('discount_type')) {
            $query->where('discount_type', $request->discount_type);
        }

        // Filter by scope type
        if ($request->filled('scope_type')) {
            $query->where('scope_type', $request->scope_type);
        }

        // Filter by user restriction
        if ($request->filled('user_restriction_type')) {
            $query->where('user_restriction_type', $request->user_restriction_type);
        }

        // Filter by status
        if ($request->filled('status')) {
            $status = $request->status;
            $now = Carbon::now();
            if ($status === 'active') {
                $query->where('is_active', true)
                    ->where(function ($q) use ($now) {
                        $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
                    })
                    ->where(function ($q) use ($now) {
                        $q->whereNull('expiry_date')->orWhere('expiry_date', '>=', $now);
                    });
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($status === 'expired') {
                $query->where('expiry_date', '<', $now);
            }
        }

        $perPage = (int) $request->get('per_page', 15);
        $coupons = $query->latest()->paginate($perPage);

        // Calculate top statistics
        $totalCoupons = Coupon::count();
        $now = Carbon::now();
        $activeCoupons = Coupon::where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('expiry_date')->orWhere('expiry_date', '>=', $now);
            })
            ->count();
        $totalRedemptions = (int) Coupon::sum('times_used');
        $totalDiscountGiven = (float) CouponUsage::sum('discount_amount');

        return response()->json([
            'coupons' => $coupons,
            'stats' => [
                'total_coupons' => $totalCoupons,
                'active_coupons' => $activeCoupons,
                'total_redemptions' => $totalRedemptions,
                'total_discount_given' => $totalDiscountGiven,
            ],
        ]);
    }

    /**
     * Create a new coupon
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'discount_type' => ['required', 'in:fixed,percentage'],
            'discount_amount' => ['required', 'numeric', 'min:0.01'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'scope_type' => ['required', 'in:all,course,category'],
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['exists:courses,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['exists:categories,id'],
            'user_restriction_type' => ['required', 'in:all,specific'],
            'restricted_user_id' => [
                'nullable',
                Rule::requiredIf(fn() => $request->user_restriction_type === Coupon::USER_SPECIFIC),
                'exists:users,id',
            ],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['required', 'integer', 'min:1'],
            'start_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_active' => ['boolean'],
        ]);

        $code = strtoupper(trim($validated['code']));

        $coupon = DB::transaction(function () use ($validated, $code, $request) {
            $coupon = Coupon::create([
                'code' => $code,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'discount_type' => $validated['discount_type'],
                'discount_amount' => $validated['discount_amount'],
                'max_discount_amount' => $validated['max_discount_amount'] ?? null,
                'min_order_amount' => $validated['min_order_amount'] ?? null,
                'scope_type' => $validated['scope_type'],
                'user_restriction_type' => $validated['user_restriction_type'],
                'restricted_user_id' => $validated['user_restriction_type'] === Coupon::USER_SPECIFIC ? $validated['restricted_user_id'] : null,
                'usage_limit' => $validated['usage_limit'] ?? null,
                'usage_limit_per_user' => $validated['usage_limit_per_user'] ?? 1,
                'times_used' => 0,
                'start_date' => $validated['start_date'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => $request->user()->id,
            ]);

            // Sync courses if scope is course
            if ($validated['scope_type'] === Coupon::SCOPE_COURSE && !empty($validated['course_ids'])) {
                $coupon->courses()->sync($validated['course_ids']);
            }

            // Sync categories if scope is category
            if ($validated['scope_type'] === Coupon::SCOPE_CATEGORY && !empty($validated['category_ids'])) {
                $coupon->categories()->sync($validated['category_ids']);
            }

            return $coupon;
        });

        return response()->json([
            'message' => 'Coupon created successfully!',
            'coupon' => $coupon->load(['courses:id,title', 'categories:id,name', 'restrictedUser:id,name,phone,email']),
        ], 201);
    }

    /**
     * Show single coupon details
     */
    public function show($id): JsonResponse
    {
        $coupon = Coupon::with([
            'courses:id,title,price',
            'categories:id,name',
            'restrictedUser:id,name,phone,email',
            'creator:id,name',
            'usages' => function ($q) {
                $q->with(['user:id,name,phone,email', 'order:id,order_number'])->latest()->limit(20);
            },
        ])->findOrFail($id);

        return response()->json([
            'coupon' => $coupon,
        ]);
    }

    /**
     * Update an existing coupon
     */
    public function update(Request $request, $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('coupons', 'code')->ignore($coupon->id)],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'discount_type' => ['required', 'in:fixed,percentage'],
            'discount_amount' => ['required', 'numeric', 'min:0.01'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'scope_type' => ['required', 'in:all,course,category'],
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['exists:courses,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['exists:categories,id'],
            'user_restriction_type' => ['required', 'in:all,specific'],
            'restricted_user_id' => [
                'nullable',
                Rule::requiredIf(fn() => $request->user_restriction_type === Coupon::USER_SPECIFIC),
                'exists:users,id',
            ],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['required', 'integer', 'min:1'],
            'start_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_active' => ['boolean'],
        ]);

        $code = strtoupper(trim($validated['code']));

        DB::transaction(function () use ($coupon, $validated, $code) {
            $coupon->update([
                'code' => $code,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'discount_type' => $validated['discount_type'],
                'discount_amount' => $validated['discount_amount'],
                'max_discount_amount' => $validated['max_discount_amount'] ?? null,
                'min_order_amount' => $validated['min_order_amount'] ?? null,
                'scope_type' => $validated['scope_type'],
                'user_restriction_type' => $validated['user_restriction_type'],
                'restricted_user_id' => $validated['user_restriction_type'] === Coupon::USER_SPECIFIC ? $validated['restricted_user_id'] : null,
                'usage_limit' => $validated['usage_limit'] ?? null,
                'usage_limit_per_user' => $validated['usage_limit_per_user'] ?? 1,
                'start_date' => $validated['start_date'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'is_active' => $validated['is_active'] ?? $coupon->is_active,
            ]);

            // Sync courses
            if ($validated['scope_type'] === Coupon::SCOPE_COURSE) {
                $coupon->courses()->sync($validated['course_ids'] ?? []);
            } else {
                $coupon->courses()->detach();
            }

            // Sync categories
            if ($validated['scope_type'] === Coupon::SCOPE_CATEGORY) {
                $coupon->categories()->sync($validated['category_ids'] ?? []);
            } else {
                $coupon->categories()->detach();
            }
        });

        return response()->json([
            'message' => 'Coupon updated successfully!',
            'coupon' => $coupon->fresh(['courses:id,title', 'categories:id,name', 'restrictedUser:id,name,phone,email']),
        ]);
    }

    /**
     * Delete a coupon
     */
    public function destroy($id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json([
            'message' => 'Coupon deleted successfully!',
        ]);
    }

    /**
     * Toggle coupon active / inactive status
     */
    public function toggleStatus($id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->is_active = !$coupon->is_active;
        $coupon->save();

        return response()->json([
            'message' => $coupon->is_active ? 'Coupon activated!' : 'Coupon deactivated!',
            'is_active' => $coupon->is_active,
        ]);
    }

    /**
     * Live search users by phone number, name or email
     * Specifically fulfills searching by phone number to create a targeted user coupon.
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $q = trim($request->get('q', ''));
        if (strlen($q) < 2) {
            return response()->json(['users' => []]);
        }

        $users = User::where(function ($query) use ($q) {
            $query->where('phone', 'like', "%{$q}%")
                  ->orWhere('name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%");
        })
        ->select(['id', 'name', 'phone', 'email', 'role'])
        ->limit(15)
        ->get();

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Fetch courses and categories for modal dropdowns
     */
    public function getCoursesAndCategories(): JsonResponse
    {
        $courses = Course::select(['id', 'title', 'price', 'effective_price', 'category_id'])
            ->where('status', Course::STATUS_PUBLISHED)
            ->latest()
            ->get();

        $categories = Category::select(['id', 'name', 'slug'])
            ->withCount('courses')
            ->get();

        return response()->json([
            'courses' => $courses,
            'categories' => $categories,
        ]);
    }
}
