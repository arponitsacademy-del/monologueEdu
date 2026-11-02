<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $digits = preg_replace('/\D+/', '', $search);
            $query->where(function ($q) use ($search, $digits) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");

                if (! empty($digits)) {
                    $q->orWhere('phone', 'like', "%{$digits}%");
                }
            });
        }

        $users = $query->withCount(['enrollments', 'instructedCourses'])
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'user' => $user->load([
                'enrolledCourses:id,title,price,thumbnail',
                'instructedCourses:id,title,price,status',
            ]),
        ]);
    }

    public function changeRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'in:admin,teacher,student'],
        ]);

        $newRole = $validated['role'];
        $oldRole = $user->role;

        if ($oldRole === $newRole) {
            return response()->json(['message' => 'রোল অপরিবর্তিত রয়েছে।']);
        }

        // Prevent demoting the last active admin
        if ($oldRole === User::ROLE_ADMIN && $newRole !== User::ROLE_ADMIN) {
            $activeAdminCount = User::where('role', User::ROLE_ADMIN)
                ->where('status', User::STATUS_ACTIVE)
                ->where('id', '!=', $user->id)
                ->count();

            if ($activeAdminCount === 0) {
                return response()->json([
                    'message' => 'সিস্টেমে অন্তত একজন সক্রিয় অ্যাডমিন থাকা আবশ্যক। এই অ্যাডমিনকে ডিমোট করা যাবে না।',
                ], 422);
            }
        }

        $user->update(['role' => $newRole]);

        AuditLog::log('user_role_changed', 'User', $user->id, ['role' => $oldRole], ['role' => $newRole]);

        return response()->json([
            'message' => "ইউজারের রোল সফলভাবে {$newRole} এ পরিবর্তন করা হয়েছে।",
            'user' => $user->fresh(),
        ]);
    }

    public function toggleStatus(User $user): JsonResponse
    {
        $newStatus = $user->status === User::STATUS_ACTIVE ? User::STATUS_INACTIVE : User::STATUS_ACTIVE;

        // Prevent deactivating the last active admin
        if ($user->isAdmin() && $newStatus === User::STATUS_INACTIVE) {
            $otherActiveAdmins = User::where('role', User::ROLE_ADMIN)
                ->where('status', User::STATUS_ACTIVE)
                ->where('id', '!=', $user->id)
                ->count();

            if ($otherActiveAdmins === 0) {
                return response()->json([
                    'message' => 'একমাত্র সক্রিয় অ্যাডমিন অ্যাকাউন্টটি নিষ্ক্রিয় করা যাবে না।',
                ], 422);
            }
        }

        $oldStatus = $user->status;
        $user->update(['status' => $newStatus]);

        AuditLog::log('user_status_changed', 'User', $user->id, ['status' => $oldStatus], ['status' => $newStatus]);

        return response()->json([
            'message' => 'ইউজার স্ট্যাটাস পরিবর্তন করা হয়েছে।',
            'user' => $user->fresh(),
        ]);
    }
}
