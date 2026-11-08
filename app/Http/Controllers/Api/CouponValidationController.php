<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponValidationController extends Controller
{
    /**
     * Validate a coupon code for a given course and user
     */
    public function validateCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string'],
            'course_id' => ['required', 'exists:courses,id'],
        ]);

        $code = strtoupper(trim($validated['code']));
        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid coupon code.',
            ], 404);
        }

        $user = $request->user();
        $course = Course::with('categories')->findOrFail($validated['course_id']);
        $coursePrice = (float) $course->effective_price;

        $result = $coupon->validateForCheckout($user, $course, $coursePrice);

        if (!$result['valid']) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }
}
