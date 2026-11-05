<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Course;
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
        ]);

        $user = auth()->user();
        $course = Course::with('nexpilot')->findOrFail($validated['course_id']);

        if ($course->status !== Course::STATUS_PUBLISHED) {
            abort(404, 'কোর্সটি কেনার জন্য উপলব্ধ নেই।');
        }

        if ($user->isEnrolledIn($course->id)) {
            return response()->json([
                'message' => 'আপনি ইতিমধ্যে এই কোর্সে এনরোল করেছেন।',
            ], 422);
        }

        // Prevent duplicate pending orders with same transaction reference
        if (Payment::where('transaction_ref', $validated['transaction_ref'])->exists()) {
            return response()->json([
                'message' => 'এই ট্রানজেকশন আইডিটি ইতিমধ্যে একটি অর্ডারে ব্যবহার করা হয়েছে।',
                'errors' => ['transaction_ref' => ['এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহৃত হয়েছে।']],
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
        $finalAmount = $courseFinalAmount + $nexpilotPrice;

        $order = DB::transaction(function () use ($user, $course, $validated, $price, $discountAmount, $finalAmount, $includeNexPilot, $nexpilotId, $nexpilotPrice) {
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $user->id,
                'course_id' => $course->id,
                'original_price' => $price,
                'discount_amount' => $discountAmount,
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
            'message' => 'অর্ডার সফলভাবে তৈরি হয়েছে। পেমেন্ট যাচাইয়ের পর এনরোলমেন্ট সক্রিয় হবে।',
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
                'message' => 'এই অর্ডারটির পেমেন্ট আগেই নিশ্চিত করা হয়েছে।',
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

            // Notify student
            $order->user->notify(new PaymentConfirmedNotification($order));
        });

        return response()->json([
            'message' => 'পেমেন্ট সফলভাবে নিশ্চিত করা হয়েছে এবং শিক্ষার্থীর এনরোলমেন্ট সক্রিয় হয়েছে।',
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
                'notes' => $validated['reason'] ?? 'পেমেন্ট যাচাই ব্যর্থ হয়েছে।',
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
            'message' => 'পেমেন্ট বাতিল করা হয়েছে।',
            'order' => $order->fresh(['user', 'course', 'latestPayment']),
        ]);
    }
}
