<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAccessKeyController extends Controller
{
    /**
     * Get courses with enrolled student count for Access Key view
     */
    public function courses(Request $request): JsonResponse
    {
        $query = Course::select(['id', 'title', 'slug', 'thumbnail', 'price', 'status'])
            ->withCount(['enrollments' => function ($q) {
                $q->where('status', Enrollment::STATUS_ACTIVE);
            }]);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where('title', 'like', "%{$search}%");
        }

        $courses = $query->latest()->get();

        return response()->json([
            'courses' => $courses,
        ]);
    }

    /**
     * Get students and their access keys for a specific course
     */
    public function courseStudents(Request $request, $courseId): JsonResponse
    {
        $course = Course::findOrFail($courseId);

        $query = Enrollment::with(['user:id,name,phone,email,registration_number,status'])
            ->where('course_id', $course->id)
            ->where('status', Enrollment::STATUS_ACTIVE);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('access_key', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('registration_number', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = (int) $request->get('per_page', 50);
        $paginated = $query->latest('enrolled_at')->paginate($perPage);

        // Ensure every enrolled student record has an access_key generated
        $students = collect($paginated->items())->map(function ($enrollment) {
            $key = $enrollment->getOrGenerateAccessKey();
            return [
                'enrollment_id' => $enrollment->id,
                'user_id' => $enrollment->user_id,
                'user' => $enrollment->user,
                'access_key' => $key,
                'enrolled_at' => $enrollment->enrolled_at ? $enrollment->enrolled_at->toIso8601String() : null,
                'status' => $enrollment->status,
            ];
        });

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail,
                'total_enrolled' => $course->enrollments()->where('status', Enrollment::STATUS_ACTIVE)->count(),
            ],
            'students' => $students,
            'pagination' => [
                'total' => $paginated->total(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
            ],
        ]);
    }

    /**
     * Direct verification by pasting an Access Key
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'key' => ['required', 'string'],
        ]);

        $key = trim($request->input('key'));

        $enrollment = Enrollment::with([
            'user:id,name,phone,email,registration_number,status',
            'course:id,title,slug,thumbnail',
        ])
        ->where('access_key', $key)
        ->first();

        if (!$enrollment) {
            return response()->json([
                'found' => false,
                'message' => 'প্রদত্ত অ্যাক্সেস কি (Access Key) দিয়ে কোনো স্টুডেন্ট পাওয়া যায়নি।',
            ], 404);
        }

        return response()->json([
            'found' => true,
            'enrollment_id' => $enrollment->id,
            'access_key' => $enrollment->access_key,
            'user' => $enrollment->user,
            'course' => $enrollment->course,
            'status' => $enrollment->status,
            'enrolled_at' => $enrollment->enrolled_at ? $enrollment->enrolled_at->toIso8601String() : null,
        ]);
    }

    /**
     * Regenerate access key for a specific enrollment
     */
    public function regenerate($enrollmentId): JsonResponse
    {
        $enrollment = Enrollment::with(['user:id,name', 'course:id,title'])->findOrFail($enrollmentId);

        $newKey = Enrollment::generateUniqueAccessKey();
        $enrollment->update(['access_key' => $newKey]);

        return response()->json([
            'message' => 'অ্যাক্সেস কি সফলভাবে রি-জেনারেট করা হয়েছে!',
            'access_key' => $newKey,
        ]);
    }
}
