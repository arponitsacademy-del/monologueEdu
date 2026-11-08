<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\AffiliateCommission;
use App\Models\AffiliateProfile;
use App\Models\AffiliateSetting;
use App\Models\Course;
use App\Models\CourseAffiliateSetting;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Notifications\PaymentConfirmedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'include_nexpilot' => ['nullable', 'boolean'],
            'payment_method' => ['required', 'string', 'in:manual_bkash,manual_nagad,manual_rocket,bank,manual'],
            'transaction_ref' => ['required', 'string', 'max:100'],
            'sender_phone' => ['required', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:500'],
            'affiliate_code' => ['nullable', 'string', 'max:50'],
        ]);

        $user = auth()->user();
        $course = Course::with('nexpilot')->findOrFail($validated['course_id']);

        if ($course->status !== Course::STATUS_PUBLISHED) {
            abort(404, 'Course is not available for purchase.');
        }

        if ($user->isEnrolledIn($course->id)) {
            return response()->json([
                'message' => 'You are already enrolled in this course.',
            ], 422);
        }

        // Prevent duplicate pending orders with same transaction reference
        if (Payment::where('transaction_ref', $validated['transaction_ref'])->exists()) {
            return response()->json([
                'message' => 'This transaction reference has already been used for another order.',
                'errors' => ['transaction_ref' => ['This transaction ID is already registered.']],
            ], 422);
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

        // Check and apply affiliate discount
        $affiliateProfile = null;
        $affiliateDiscount = 0.0;
        if (!empty($validated['affiliate_code'])) {
            $affiliateProfile = AffiliateProfile::where('affiliate_code', $validated['affiliate_code'])
                ->where('status', AffiliateProfile::STATUS_ACTIVE)
                ->first();

            // Self-referral protection: cannot refer oneself
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
        $finalAmount = $courseFinalAmount + $nexpilotPrice;

        $order = DB::transaction(function () use ($user, $course, $validated, $price, $discountAmount, $affiliateDiscount, $affiliateProfile, $finalAmount, $includeNexPilot, $nexpilotId, $nexpilotPrice) {
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $user->id,
                'affiliate_id' => $affiliateProfile ? $affiliateProfile->id : null,
                'affiliate_code' => $affiliateProfile ? $affiliateProfile->affiliate_code : null,
                'course_id' => $course->id,
                'original_price' => $price,
                'discount_amount' => $discountAmount,
                'affiliate_discount' => $affiliateDiscount,
                'final_amount' => $finalAmount,
                'has_nexpilot' => $nexpilotPrice > 0 || ($includeNexPilot && $nexpilotId),
                'nexpilot_id' => $nexpilotId,
                'nexpilot_price' => $nexpilotPrice,
                'payment_status' => Order::PAYMENT_PENDING,
                'order_status' => Order::ORDER_PROCESSING,
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'course_id' => $course->id,
                'price' => $finalAmount,
            ]);

            Payment::create([
                'order_id' => $order->id,
                'transaction_ref' => $validated['transaction_ref'],
                'sender_phone' => $validated['sender_phone'],
                'amount' => $finalAmount,
                'payment_method' => $validated['payment_method'],
                'status' => Payment::STATUS_PENDING,
            ]);

            return $order;
        });

        return response()->json([
            'message' => 'Order placed successfully. Enrollment will be activated upon payment verification.',
            'order' => $order->load(['course', 'latestPayment']),
        ], 201);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()
            ->with(['course', 'latestPayment'])
            ->latest()
            ->paginate(10);

        return response()->json($orders);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Order::query()
            ->with(['user:id,name,phone,email', 'course:id,title,price', 'latestPayment']);

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        $orders = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json($orders);
    }

    public function confirmPayment(Request $request, Order $order): JsonResponse
    {
        if ($order->payment_status === Order::PAYMENT_PAID) {
            return response()->json([
                'message' => 'Payment for this order has already been verified.',
            ], 422);
        }

        DB::transaction(function () use ($order) {
            $order->update([
                'payment_status' => Order::PAYMENT_PAID,
                'order_status' => Order::ORDER_COMPLETED,
            ]);

            if ($order->latestPayment) {
                $order->latestPayment->update([
                    'status' => Payment::STATUS_APPROVED,
                    'verified_by' => auth()->id(),
                    'verified_at' => now(),
                ]);
            }

            // Create or update enrollment
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

            // Audit log
            AuditLog::log('payment_confirmed', 'Order', $order->id, null, [
                'order_number' => $order->order_number,
                'amount' => $order->final_amount,
                'confirmed_by' => auth()->id(),
            ]);

            // Affiliate commission crediting
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

                    if ($commType === 'percentage') {
                        $commAmount = round(($order->final_amount * $commRate) / 100, 2);
                    } else {
                        $commAmount = (float) $commRate;
                    }

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

            // Notify student
            $order->user->notify(new PaymentConfirmedNotification($order));

            // Dispatch Course Purchase Auto SMS Push
            try {
                app(\App\Services\CoursePurchaseSmsService::class)->sendPurchaseSms($order);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Auto SMS Push on payment confirmation failed: ' . $e->getMessage());
            }
        });

        return response()->json([
            'message' => 'Payment has been verified successfully and student enrollment is active.',
            'order' => $order->fresh(['user', 'course', 'latestPayment']),
        ]);
    }

    public function rejectPayment(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($order, $validated) {
            $order->update([
                'payment_status' => Order::PAYMENT_FAILED,
                'order_status' => Order::ORDER_CANCELLED,
                'notes' => $validated['reason'] ?? 'Payment verification failed.',
            ]);

            if ($order->latestPayment) {
                $order->latestPayment->update([
                    'status' => Payment::STATUS_REJECTED,
                    'verified_by' => auth()->id(),
                    'verified_at' => now(),
                    'notes' => $validated['reason'] ?? null,
                ]);
            }

            AuditLog::log('payment_rejected', 'Order', $order->id, null, ['reason' => $validated['reason'] ?? null]);
        });

        return response()->json([
            'message' => 'Payment has been rejected.',
            'order' => $order->fresh(['user', 'course', 'latestPayment']),
        ]);
    }
}
