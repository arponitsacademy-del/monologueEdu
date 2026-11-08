<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherPublicController extends Controller
{
    /**
     * Get featured teachers list for homepage carousel
     */
    public function getFeaturedTeachers(): JsonResponse
    {
        $teachers = User::where('role', User::ROLE_TEACHER)
            ->where('status', User::STATUS_ACTIVE)
            ->with(['teacherProfile'])
            ->withCount(['instructedCourses' => function ($q) {
                $q->where('status', Course::STATUS_PUBLISHED);
            }])
            ->get()
            ->map(function ($teacher) {
                $profile = $teacher->teacherProfile;
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'designation' => $profile?->designation ?? 'Instructor',
                    'institution' => $profile?->institution ?? 'Monologue Edu Faculty',
                    'photo_url' => $profile?->photo_url,
                    'bio' => $profile?->bio,
                    'is_featured' => $profile?->is_featured ?? true,
                    'courses_count' => $teacher->instructed_courses_count,
                ];
            });

        return response()->json([
            'data' => $teachers,
            'teachers' => $teachers,
        ]);
    }

    /**
     * Get single teacher public profile and their courses
     */
    public function getTeacherProfile(int $id): JsonResponse
    {
        $teacher = User::where('id', $id)
            ->where('role', User::ROLE_TEACHER)
            ->with(['teacherProfile'])
            ->firstOrFail();

        // Get all courses taught by this teacher (both via pivot and instructor_id)
        $courses = Course::where('status', Course::STATUS_PUBLISHED)
            ->where(function ($q) use ($teacher) {
                $q->where('instructor_id', $teacher->id)
                  ->orWhereHas('instructors', fn($iq) => $iq->where('users.id', $teacher->id));
            })
            ->select('id', 'title', 'slug', 'thumbnail', 'short_description', 'price', 'sale_price', 'status')
            ->withCount(['enrollments', 'lessons'])
            ->latest()
            ->get();

        $profile = $teacher->teacherProfile;

        return response()->json([
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'designation' => $profile?->designation ?? 'Instructor',
                'institution' => $profile?->institution ?? 'Monologue Edu Faculty',
                'photo_url' => $profile?->photo_url,
                'bio' => $profile?->bio,
                'expertise' => $profile?->expertise,
                'social_links' => $profile?->social_links ?? [],
                'courses_count' => $courses->count(),
                'total_students' => $courses->sum('enrollments_count'),
            ],
            'courses' => $courses,
        ]);
    }
}
