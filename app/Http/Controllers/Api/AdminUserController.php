<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

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

    /**
     * Create a new user (Student, Teacher, or Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $normalizedPhone = User::normalizePhone($request->input('phone'));

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:student,teacher,admin'],
            'status' => ['nullable', 'in:active,inactive'],
        ], [
            'name.required' => 'ব্যবহারকারীর পুরো নাম আবশ্যক।',
            'phone.required' => 'মোবাইল নম্বর আবশ্যক।',
            'email.required' => 'ইমেইল এড্রেস আবশ্যক।',
            'email.unique' => 'এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হয়েছে।',
            'password.required' => 'পাসওয়ার্ড প্রদান করুন।',
            'password.min' => 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
            'role.required' => 'ব্যবহারকারীর রোল নির্বাচন করুন।',
        ]);

        if (! $normalizedPhone || ! User::isValidPhoneNumber($normalizedPhone)) {
            return response()->json([
                'message' => 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন।',
                'errors' => ['phone' => ['সঠিক বাংলাদেশি মোবাইল নম্বর প্রদান করুন।']],
            ], 422);
        }

        if (User::where('phone', $normalizedPhone)->exists()) {
            return response()->json([
                'message' => 'এই মোবাইল নম্বরটি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে।',
                'errors' => ['phone' => ['এই মোবাইল নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে।']],
            ], 422);
        }

        $user = User::create([
            'name' => trim($validated['name']),
            'phone' => $normalizedPhone,
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => $validated['status'] ?? User::STATUS_ACTIVE,
        ]);

        AuditLog::log('user_created_by_admin', 'User', $user->id, null, [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
        ]);

        return response()->json([
            'message' => 'নতুন ব্যবহারকারী সফলভাবে তৈরি করা হয়েছে।',
            'user' => $user->loadCount(['enrollments', 'instructedCourses']),
        ], 201);
    }

    /**
     * Delete user account
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        // Prevent deleting self
        if ($request->user() && $request->user()->id === $user->id) {
            return response()->json([
                'message' => 'আপনি নিজের অ্যাডমিন অ্যাকাউন্ট নিজে ডিলিট করতে পারবেন না।',
            ], 422);
        }

        // Prevent deleting the last active admin
        if ($user->isAdmin()) {
            $otherActiveAdmins = User::where('role', User::ROLE_ADMIN)
                ->where('status', User::STATUS_ACTIVE)
                ->where('id', '!=', $user->id)
                ->count();

            if ($otherActiveAdmins === 0) {
                return response()->json([
                    'message' => 'সিস্টেমে অন্তত একজন সক্রিয় অ্যাডমিন থাকা আবশ্যক। এই অ্যাডমিন অ্যাকাউন্ট ডিলিট করা যাবে না।',
                ], 422);
            }
        }

        $userId = $user->id;
        $userName = $user->name;
        $userRole = $user->role;

        DB::transaction(function () use ($user) {
            // Nullify legacy instructor foreign key if present
            Course::where('instructor_id', $user->id)->update(['instructor_id' => null]);

            // Detach course instructors many-to-many
            $user->instructedCourses()->detach();

            // Revoke tokens
            $user->tokens()->delete();

            // Delete the user record
            $user->delete();
        });

        AuditLog::log('user_deleted_by_admin', 'User', $userId, [
            'name' => $userName,
            'role' => $userRole,
        ], null);

        return response()->json([
            'message' => 'ব্যবহারকারী অ্যাকাউন্ট সফলভাবে ডিলিট করা হয়েছে।',
        ]);
    }
}
