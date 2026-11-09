<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseBundle;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\User;
use App\Notifications\StudentAnnouncementNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class AnnouncementController extends Controller
{
    /**
     * Get available courses and bundles for announcement target selection
     */
    public function options(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();

        // 1. Determine Courses
        if ($isAdmin) {
            $courses = Course::select('id', 'title', 'slug', 'thumbnail')
                ->latest()
                ->get();
        } else {
            // Teacher's assigned courses
            $courses = Course::where(function ($q) use ($user) {
                $q->where('instructor_id', $user->id)
                    ->orWhereHas('instructors', function ($iq) use ($user) {
                        $iq->where('users.id', $user->id);
                    });
            })
                ->select('id', 'title', 'slug', 'thumbnail')
                ->latest()
                ->get();
        }

        // Attach bundle associations & student count for each course
        $coursesData = $courses->map(function ($c) {
            // Direct enrolled students
            $directCount = Enrollment::where('course_id', $c->id)
                ->where('status', Enrollment::STATUS_ACTIVE)
                ->distinct('user_id')
                ->count('user_id');

            // Bundles containing this course
            $bundleIds = DB::table('bundle_courses')
                ->where('course_id', $c->id)
                ->pluck('bundle_id');

            $bundlesContaining = CourseBundle::whereIn('id', $bundleIds)
                ->select('id', 'title')
                ->get();

            // Students who purchased any of these bundles
            $bundleStudentCount = 0;
            if ($bundleIds->isNotEmpty()) {
                $bundleStudentCount = Order::whereIn('bundle_id', $bundleIds)
                    ->where('status', Order::STATUS_COMPLETED)
                    ->distinct('user_id')
                    ->count('user_id');
            }

            // Total unique approximate students
            $directStudentIds = Enrollment::where('course_id', $c->id)
                ->where('status', Enrollment::STATUS_ACTIVE)
                ->pluck('user_id')
                ->toArray();

            $bundleStudentIds = $bundleIds->isNotEmpty()
                ? Order::whereIn('bundle_id', $bundleIds)
                    ->where('status', Order::STATUS_COMPLETED)
                    ->pluck('user_id')
                    ->toArray()
                : [];

            $totalUniqueCount = count(array_unique(array_merge($directStudentIds, $bundleStudentIds)));

            return [
                'id' => $c->id,
                'title' => $c->title,
                'slug' => $c->slug,
                'thumbnail' => $c->thumbnail,
                'direct_students_count' => $directCount,
                'bundle_students_count' => $bundleStudentCount,
                'total_reach_count' => $totalUniqueCount,
                'included_in_bundles' => $bundlesContaining,
            ];
        });

        // 2. Determine Bundles
        if ($isAdmin) {
            $bundles = CourseBundle::select('id', 'title', 'slug', 'thumbnail')
                ->latest()
                ->get();
        } else {
            $teacherCourseIds = $courses->pluck('id')->toArray();
            $bundles = CourseBundle::whereHas('courses', function ($q) use ($teacherCourseIds) {
                $q->whereIn('courses.id', $teacherCourseIds);
            })
                ->select('id', 'title', 'slug', 'thumbnail')
                ->latest()
                ->get();
        }

        $bundlesData = $bundles->map(function ($b) {
            $bundleOrderStudents = Order::where('bundle_id', $b->id)
                ->where('status', Order::STATUS_COMPLETED)
                ->pluck('user_id')
                ->toArray();

            $courseIds = DB::table('bundle_courses')
                ->where('bundle_id', $b->id)
                ->pluck('course_id')
                ->toArray();

            $courseStudents = Enrollment::whereIn('course_id', $courseIds)
                ->where('status', Enrollment::STATUS_ACTIVE)
                ->pluck('user_id')
                ->toArray();

            $totalReach = count(array_unique(array_merge($bundleOrderStudents, $courseStudents)));

            return [
                'id' => $b->id,
                'title' => $b->title,
                'slug' => $b->slug,
                'thumbnail' => $b->thumbnail,
                'total_reach_count' => $totalReach,
                'courses_count' => count($courseIds),
            ];
        });

        return response()->json([
            'is_admin' => $isAdmin,
            'courses' => $coursesData,
            'bundles' => $bundlesData,
            'total_students_count' => $isAdmin ? User::where('role', User::ROLE_STUDENT)->count() : 0,
        ]);
    }

    /**
     * Send notification / announcement to course or bundle students
     */
    public function notifyStudents(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();

        $validated = $request->validate([
            'target_type' => ['required', 'string', 'in:course,bundle,all'],
            'target_id' => ['nullable', 'integer'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'link' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validated['target_type'] === 'all' && ! $isAdmin) {
            return response()->json([
                'message' => 'শুধুমাত্র অ্যাডমিন সকল শিক্ষার্থীকে নোটিফিকেশন পাঠাতে পারেন।',
            ], 403);
        }

        $recipientUserIds = [];
        $targetTitle = '';
        $extraBundleInfo = '';

        if ($validated['target_type'] === 'course') {
            if (empty($validated['target_id'])) {
                return response()->json(['message' => 'কোর্স নির্বাচন করুন।'], 422);
            }

            $course = Course::findOrFail($validated['target_id']);

            // Teacher permission check
            if (! $isAdmin && ! $course->isAssignedTeacher($user->id)) {
                return response()->json(['message' => 'আপনি এই কোর্সের শিক্ষক নন।'], 403);
            }

            $targetTitle = $course->title;

            // 1. Direct enrolled students of this course
            $directStudentIds = Enrollment::where('course_id', $course->id)
                ->where('status', Enrollment::STATUS_ACTIVE)
                ->pluck('user_id')
                ->toArray();

            // 2. All bundles containing this course
            $bundleIds = DB::table('bundle_courses')
                ->where('course_id', $course->id)
                ->pluck('bundle_id')
                ->toArray();

            $bundleStudentIds = [];
            if (! empty($bundleIds)) {
                $bundles = CourseBundle::whereIn('id', $bundleIds)->get();
                $bundleNames = $bundles->pluck('title')->toArray();
                if (! empty($bundleNames)) {
                    $extraBundleInfo = 'যুক্ত বান্ডেল: ' . implode(', ', $bundleNames);
                }

                $bundleStudentIds = Order::whereIn('bundle_id', $bundleIds)
                    ->where('status', Order::STATUS_COMPLETED)
                    ->pluck('user_id')
                    ->toArray();
            }

            $recipientUserIds = array_values(array_unique(array_merge($directStudentIds, $bundleStudentIds)));
        } elseif ($validated['target_type'] === 'bundle') {
            if (empty($validated['target_id'])) {
                return response()->json(['message' => 'বান্ডেল নির্বাচন করুন।'], 422);
            }

            $bundle = CourseBundle::findOrFail($validated['target_id']);

            // Teacher permission check: bundle must include at least one course taught by teacher
            if (! $isAdmin) {
                $teacherCourseIds = Course::where(function ($q) use ($user) {
                    $q->where('instructor_id', $user->id)
                        ->orWhereHas('instructors', function ($iq) use ($user) {
                            $iq->where('users.id', $user->id);
                        });
                })->pluck('id')->toArray();

                $bundleHasTeacherCourse = DB::table('bundle_courses')
                    ->where('bundle_id', $bundle->id)
                    ->whereIn('course_id', $teacherCourseIds)
                    ->exists();

                if (! $bundleHasTeacherCourse) {
                    return response()->json(['message' => 'এই বান্ডেলে আপনার কোনো কোর্স অন্তর্ভুক্ত নেই।'], 403);
                }
            }

            $targetTitle = $bundle->title;

            // Students who purchased the bundle
            $bundleStudentIds = Order::where('bundle_id', $bundle->id)
                ->where('status', Order::STATUS_COMPLETED)
                ->pluck('user_id')
                ->toArray();

            // Students enrolled in courses of this bundle
            $courseIds = DB::table('bundle_courses')
                ->where('bundle_id', $bundle->id)
                ->pluck('course_id')
                ->toArray();

            $courseStudentIds = Enrollment::whereIn('course_id', $courseIds)
                ->where('status', Enrollment::STATUS_ACTIVE)
                ->pluck('user_id')
                ->toArray();

            $recipientUserIds = array_values(array_unique(array_merge($bundleStudentIds, $courseStudentIds)));
        } else {
            // All students
            $targetTitle = 'সকল শিক্ষার্থী';
            $recipientUserIds = User::where('role', User::ROLE_STUDENT)->pluck('id')->toArray();
        }

        if (empty($recipientUserIds)) {
            return response()->json([
                'message' => 'এই সিলেকশনে বর্তমানে কোনো সক্রিয় শিক্ষার্থী খুঁজে পাওয়া যায়নি।',
            ], 422);
        }

        // Send notifications
        $students = User::whereIn('id', $recipientUserIds)->get();

        $notification = new StudentAnnouncementNotification(
            title: $validated['title'],
            message: $validated['message'],
            link: $validated['link'] ?: '/student',
            senderName: $user->name,
            targetType: $validated['target_type'],
            targetTitle: $targetTitle
        );

        Notification::send($students, $notification);

        return response()->json([
            'success' => true,
            'message' => "সফলভাবে মোট {$students->count()} জন শিক্ষার্থীর কাছে নোটিফিকেশন পাঠানো হয়েছে।",
            'recipients_count' => $students->count(),
            'target_title' => $targetTitle,
            'extra_info' => $extraBundleInfo,
        ]);
    }

    /**
     * Get recent announcement history
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();

        // Query the latest notifications of type StudentAnnouncementNotification
        $notifications = DB::table('notifications')
            ->where('type', StudentAnnouncementNotification::class)
            ->latest('created_at')
            ->take(100)
            ->get();

        // Group by distinct title + created_at minute to reconstruct announcement batches
        $grouped = [];
        foreach ($notifications as $n) {
            $data = json_decode($n->data, true);
            $key = ($data['title'] ?? '') . '_' . substr($n->created_at, 0, 16);

            if (! isset($grouped[$key])) {
                // If not admin, filter by sender name
                if (! $isAdmin && isset($data['sender_name']) && $data['sender_name'] !== $user->name) {
                    continue;
                }

                $grouped[$key] = [
                    'id' => $n->id,
                    'title' => $data['title'] ?? 'Notice',
                    'message' => $data['message'] ?? '',
                    'link' => $data['link'] ?? '',
                    'sender_name' => $data['sender_name'] ?? 'Admin',
                    'target_type' => $data['target_type'] ?? 'course',
                    'target_title' => $data['target_title'] ?? '',
                    'created_at' => $n->created_at,
                    'recipients_count' => 1,
                ];
            } else {
                $grouped[$key]['recipients_count']++;
            }
        }

        return response()->json([
            'history' => array_values(array_slice($grouped, 0, 20)),
        ]);
    }
}

