<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\AffiliateCommission;
use App\Models\AffiliateProfile;
use App\Models\AffiliateSetting;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Course;
use App\Models\CourseAffiliateSetting;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\WebsiteSetting;
use App\Notifications\PaymentConfirmedNotification;
use App\Services\CoursePurchaseSmsService;
use App\Services\ShurjopayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ShurjopayController extends Controller
{
    /**
     * Get shurjoPay settings for admin.
     */
    public function getSettings(): JsonResponse
    {
        $settings = ShurjopayService::getSettings();
        return response()->json($settings);
    }

    /**
     * Update shurjoPay settings from admin panel.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'environment' => ['required', 'string', 'in:sandbox,live'],
            'live_api_url' => ['required', 'string', 'max:255'],
            'live_username' => ['required', 'string', 'max:255'],
            'live_password' => ['nullable', 'string', 'max:255'],
            'live_prefix' => ['required', 'string', 'max:20'],
            'sandbox_api_url' => ['required', 'string', 'max:255'],
            'sandbox_username' => ['required', 'string', 'max:255'],
            'sandbox_password' => ['nullable', 'string', 'max:255'],
            'sandbox_prefix' => ['required', 'string', 'max:20'],
            'display_name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $setting = WebsiteSetting::current();
        $currentShurjo = $setting->shurjopay_settings ?? WebsiteSetting::defaultShurjopaySettings();

        // Preserve existing passwords if empty in request
        if (empty($validated['live_password']) && !empty($currentShurjo['live_password'])) {
            $validated['live_password'] = $currentShurjo['live_password'];
        }
        if (empty($validated['sandbox_password']) && !empty($currentShurjo['sandbox_password'])) {
            $validated['sandbox_password'] = $currentShurjo['sandbox_password'];
        }

        $setting->update([
            'shurjopay_settings' => $validated,
        ]);

        AuditLog::log('shurjopay_settings_updated', 'WebsiteSetting', $setting->id, null, [
            'environment' => $validated['environment'],
            'enabled' => $validated['enabled'],
            'live_username' => $validated['live_username'],
            'sandbox_username' => $validated['sandbox_username'],
        ]);

        return response()->json([
            'message' => 'shurjoPay সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।',
            'settings' => $setting->fresh()->shurjopay_settings,
        ]);
    }

    /**
     * Test connection with shurjoPay gateway.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $params = $request->only([
            'environment',
            'live_api_url',
            'live_username',
            'live_password',
            'live_prefix',
            'sandbox_api_url',
            'sandbox_username',
            'sandbox_password',
            'sandbox_prefix',
        ]);

        $result = ShurjopayService::testConnection($params);

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Initiate online payment checkout with shurjoPay.
     */
    public function initiate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'include_nexpilot' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
            'affiliate_code' => ['nullable', 'string', 'max:50'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
        ]);

        $user = auth()->user();
        $course = Course::with('nexpilot')->findOrFail($validated['course_id']);

        if ($course->status !== Course::STATUS_PUBLISHED) {
            return response()->json(['message' => 'Course is not available for purchase.'], 404);
        }

        if ($user->isEnrolledIn($course->id)) {
            return response()->json(['message' => 'You are already enrolled in this course.'], 422);
        }

        $includeNexPilot = (bool) ($validated['include_nexpilot'] ?? false);
        $nexpilot = $course->nexpilot;
        $nexpilotPrice = 0.0;
        $nexpilotId = null;
        if ($includeNexPilot && $nexpilot && $nexpilot->is_active) {
            $nexpilotPrice = (float) $nexpilot->price;
            $nexpilotId = $nexpilot->id;
        }

        $price = (float) $course->price;
        $courseFinalAmount = (float) $course->effective_price;
        $discountAmount = max(0, $price - $courseFinalAmount);

        // Check affiliate discount
        $affiliateProfile = null;
        $affiliateDiscount = 0.0;
        if (!empty($validated['affiliate_code'])) {
            $affiliateProfile = AffiliateProfile::where('affiliate_code', $validated['affiliate_code'])
                ->where('status', AffiliateProfile::STATUS_ACTIVE)
                ->first();

            if ($affiliateProfile && $affiliateProfile->user_id !== $user->id) {
                $courseSetting = CourseAffiliateSetting::where('course_id', $course->id)->first();
                $genSetting = AffiliateSetting::current();

                $discountType = $courseSetting && $courseSetting->is_active
                    ? $courseSetting->discount_type
                    : $genSetting->default_discount_type;

                $discountRate = $courseSetting && $courseSetting->is_active
                    ? (float) $courseSetting->discount_amount
                    : (float) $genSetting->default_discount_amount;

                if ($discountType === 'percentage') {
                    $affiliateDiscount = round(($courseFinalAmount * $discountRate) / 100, 2);
                } else {
                    $affiliateDiscount = min($courseFinalAmount, $discountRate);
                }
            } else {
                $affiliateProfile = null;
            }
        }

        $courseFinalAmount = max(0, $courseFinalAmount - $affiliateDiscount);

        // Check coupon discount
        $coupon = null;
        $couponDiscount = 0.0;
        if (!empty($validated['coupon_code'])) {
            $code = strtoupper(trim($validated['coupon_code']));
            $coupon = Coupon::where('code', $code)->first();

            if (!$coupon) {
                return response()->json([
                    'message' => 'The coupon code provided is invalid.',
                    'errors' => ['coupon_code' => ['Invalid coupon code.']],
                ], 422);
            }

            $validation = $coupon->validateForCheckout($user, $course, $courseFinalAmount);
            if (!$validation['valid']) {
                return response()->json([
                    'message' => $validation['message'],
                    'errors' => ['coupon_code' => [$validation['message']]],
                ], 422);
            }

            $couponDiscount = (float) $validation['calculated_discount'];
            $courseFinalAmount = max(0, $courseFinalAmount - $couponDiscount);
        }

        $finalAmount = $courseFinalAmount + $nexpilotPrice;

        // Create order and pending payment
        $order = DB::transaction(function () use ($user, $course, $validated, $price, $discountAmount, $affiliateDiscount, $affiliateProfile, $coupon, $couponDiscount, $finalAmount, $includeNexPilot, $nexpilotId, $nexpilotPrice) {
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $user->id,
                'affiliate_id' => $affiliateProfile ? $affiliateProfile->id : null,
                'affiliate_code' => $affiliateProfile ? $affiliateProfile->affiliate_code : null,
                'course_id' => $course->id,
                'original_price' => $price,
                'discount_amount' => $discountAmount,
                'affiliate_discount' => $affiliateDiscount,
                'coupon_id' => $coupon ? $coupon->id : null,
                'coupon_code' => $coupon ? $coupon->code : null,
                'coupon_discount' => $couponDiscount,
                'final_amount' => $finalAmount,
                'has_nexpilot' => $nexpilotPrice > 0 || ($includeNexPilot && $nexpilotId),
                'nexpilot_id' => $nexpilotId,
                'nexpilot_price' => $nexpilotPrice,
                'payment_status' => Order::PAYMENT_PENDING,
                'order_status' => Order::ORDER_PROCESSING,
                'payment_method' => 'shurjopay',
                'notes' => $validated['notes'] ?? 'Online payment via shurjoPay',
            ]);

            if ($coupon) {
                CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'discount_amount' => $couponDiscount,
                ]);
                $coupon->increment('times_used');
            }

            OrderItem::create([
                'order_id' => $order->id,
                'course_id' => $course->id,
                'price' => $finalAmount,
            ]);

            Payment::create([
                'order_id' => $order->id,
                'transaction_ref' => 'PENDING_' . $order->order_number,
                'sender_phone' => $user->phone ?? '01700000000',
                'amount' => $finalAmount,
                'payment_method' => 'shurjopay',
                'status' => Payment::STATUS_PENDING,
                'notes' => 'Awaiting shurjoPay gateway payment',
            ]);

            return $order;
        });

        // Call shurjoPay initiate
        $payResult = ShurjopayService::initiatePayment($order, $user, $request->ip() ?: '127.0.0.1');

        if (!$payResult['success']) {
            return response()->json([
                'message' => $payResult['message'] ?? 'Could not initialize online payment gateway.',
            ], 422);
        }

        // Save shurjoPay order reference to Payment and Order
        if ($payment = $order->payments()->first()) {
            $payment->update([
                'transaction_ref' => $payResult['sp_order_id'],
            ]);
        }

        $order->update([
            'notes' => 'shurjoPay Order ID: ' . $payResult['sp_order_id'],
        ]);

        return response()->json([
            'success' => true,
            'checkout_url' => $payResult['checkout_url'],
            'order_number' => $order->order_number,
            'sp_order_id' => $payResult['sp_order_id'],
        ]);
    }

    /**
     * Handle return / callback from shurjoPay redirect.
     */
    public function callback(Request $request): RedirectResponse
    {
        $spOrderId = $request->input('order_id')
            ?? $request->input('sp_order_id')
            ?? $request->input('customer_order_id');

        Log::info('shurjoPay callback received', [
            'all' => $request->all(),
            'spOrderId' => $spOrderId,
        ]);

        if (empty($spOrderId)) {
            return redirect('/courses?payment=failed&reason=invalid_callback');
        }

        $verify = ShurjopayService::verifyPayment($spOrderId);

        // Find the matching Order
        $order = null;
        if (!empty($verify['value1'])) {
            $order = Order::with(['user', 'course', 'latestPayment', 'affiliateProfile'])->find($verify['value1']);
        }

        if (!$order && !empty($verify['value2'])) {
            $order = Order::with(['user', 'course', 'latestPayment', 'affiliateProfile'])
                ->where('order_number', $verify['value2'])
                ->first();
        }

        if (!$order) {
            $payment = Payment::where('transaction_ref', $spOrderId)->first();
            if ($payment) {
                $order = Order::with(['user', 'course', 'latestPayment', 'affiliateProfile'])->find($payment->order_id);
            }
        }

        if (!$order && !empty($verify['customer_order_id'])) {
            $payment = Payment::where('transaction_ref', $verify['customer_order_id'])->first();
            if ($payment) {
                $order = Order::with(['user', 'course', 'latestPayment', 'affiliateProfile'])->find($payment->order_id);
            }
        }

        // If order not found, fallback to order-status with generic failed
        if (!$order) {
            Log::error('shurjoPay callback order not found', ['spOrderId' => $spOrderId, 'verify' => $verify]);
            return redirect('/?payment=failed&reason=order_not_found');
        }

        // Handle verified success
        if ($verify['success'] && $verify['verified']) {
            if ($order->payment_status !== Order::PAYMENT_PAID) {
                DB::transaction(function () use ($order, $verify, $spOrderId) {
                    $order->update([
                        'payment_status' => Order::PAYMENT_PAID,
                        'order_status' => Order::ORDER_COMPLETED,
                    ]);

                    $payment = $order->payments()->latest()->first();
                    $bankTrx = $verify['bank_trx_id'] ?? $spOrderId;
                    $methodName = $verify['method'] ?? 'shurjopay';

                    if ($payment) {
                        $payment->update([
                            'status' => Payment::STATUS_APPROVED,
                            'transaction_ref' => $bankTrx,
                            'verified_at' => now(),
                            'notes' => "Verified via shurjoPay. Method: {$methodName}. Trx: {$bankTrx}",
                        ]);
                    }

                    // Activate enrollment
                    Enrollment::updateOrCreate(
                        [
                            'user_id' => $order->user_id,
                            'course_id' => $order->course_id,
                        ],
                        [
                            'order_id' => $order->id,
                            'status' => Enrollment::STATUS_ACTIVE,
                            'has_nexpilot' => (bool) $order->has_nexpilot,
                            'nexpilot_id' => $order->nexpilot_id,
                            'enrolled_at' => now(),
                        ]
                    );

                    // Credit affiliate commission if applicable
                    if ($order->affiliate_id && $order->affiliateProfile) {
                        $affiliate = $order->affiliateProfile;
                        if ($affiliate->status === AffiliateProfile::STATUS_ACTIVE && $affiliate->user_id !== $order->user_id) {
                            $courseSetting = CourseAffiliateSetting::where('course_id', $order->course_id)->first();
                            $genSetting = AffiliateSetting::current();

                            $commType = $courseSetting && $courseSetting->is_active
                                ? $courseSetting->commission_type
                                : $genSetting->default_commission_type;

                            $commRate = $courseSetting && $courseSetting->is_active
                                ? (float) $courseSetting->commission_amount
                                : (float) $genSetting->default_commission_amount;

                            $commAmount = $commType === 'percentage'
                                ? round(($order->final_amount * $commRate) / 100, 2)
                                : (float) $commRate;

                            if ($commAmount > 0) {
                                AffiliateCommission::firstOrCreate(
                                    [
                                        'order_id' => $order->id,
                                        'affiliate_id' => $affiliate->id,
                                    ],
                                    [
                                        'course_id' => $order->course_id,
                                        'buyer_id' => $order->user_id,
                                        'order_amount' => $order->final_amount,
                                        'discount_given' => $order->affiliate_discount ?? 0,
                                        'commission_type' => $commType,
                                        'commission_rate' => $commRate,
                                        'commission_amount' => $commAmount,
                                        'status' => AffiliateCommission::STATUS_APPROVED,
                                    ]
                                );

                                $affiliate->balance += $commAmount;
                                $affiliate->total_earned += $commAmount;
                                $affiliate->save();
                            }
                        }
                    }

                    // Log audit
                    AuditLog::log('shurjopay_payment_confirmed', 'Order', $order->id, null, [
                        'order_number' => $order->order_number,
                        'amount' => $order->final_amount,
                        'bank_trx_id' => $bankTrx,
                        'method' => $methodName,
                    ]);

                    // Notify student
                    try {
                        $order->user->notify(new PaymentConfirmedNotification($order));
                    } catch (\Throwable $e) {
                        Log::error('Notification failed: ' . $e->getMessage());
                    }

                    // Auto SMS push
                    try {
                        app(CoursePurchaseSmsService::class)->sendPurchaseSms($order);
                    } catch (\Throwable $e) {
                        Log::error('Auto SMS Push failed: ' . $e->getMessage());
                    }
                });
            }

            $trx = urlencode($verify['bank_trx_id'] ?? $spOrderId);
            return redirect("/order-status/{$order->order_number}?status=success&trx_id={$trx}");
        }

        // If verification failed
        if ($order->payment_status !== Order::PAYMENT_PAID) {
            $order->update([
                'payment_status' => Order::PAYMENT_FAILED,
                'order_status' => Order::ORDER_CANCELLED,
            ]);
            if ($payment = $order->payments()->latest()->first()) {
                $payment->update([
                    'status' => Payment::STATUS_REJECTED,
                    'notes' => $verify['message'] ?? 'shurjoPay payment verification failed',
                ]);
            }
        }

        $errMsg = urlencode($verify['message'] ?? 'পেমেন্ট সম্পন্ন হতে ব্যর্থ হয়েছে বা বাতিল করা হয়েছে।');
        return redirect("/order-status/{$order->order_number}?status=failed&message={$errMsg}");
    }

    /**
     * Handle payment cancellation redirect from shurjoPay.
     */
    public function cancel(Request $request): RedirectResponse
    {
        $orderId = $request->input('order_id');
        $orderNumber = $request->input('order_number');

        $order = null;
        if ($orderId) {
            $order = Order::find($orderId);
        } elseif ($orderNumber) {
            $order = Order::where('order_number', $orderNumber)->first();
        }

        if ($order && $order->payment_status === Order::PAYMENT_PENDING) {
            $order->update([
                'payment_status' => Order::PAYMENT_CANCELLED,
                'order_status' => Order::ORDER_CANCELLED,
                'notes' => 'Payment cancelled by user on shurjoPay gateway.',
            ]);

            if ($payment = $order->payments()->latest()->first()) {
                $payment->update([
                    'status' => Payment::STATUS_REJECTED,
                    'notes' => 'Cancelled by user',
                ]);
            }

            return redirect("/order-status/{$order->order_number}?status=cancelled");
        }

        return redirect('/courses?payment=cancelled');
    }
}
