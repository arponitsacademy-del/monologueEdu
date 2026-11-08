<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseBundle;
use App\Models\CoursePurchaseSmsSetting;
use App\Models\CourseSmsTemplate;
use App\Services\GreenWebSmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

class AutoSmsPushController extends Controller
{
    public function getSettings(): JsonResponse
    {
        try {
            if (! Schema::hasTable('course_purchase_sms_settings') || 
                ! Schema::hasTable('course_sms_templates') || 
                ! Schema::hasColumn('course_sms_templates', 'bundle_id')) {
                Artisan::call('migrate', ['--force' => true]);
            }
        } catch (\Throwable $e) {}

        try {
            $setting = CoursePurchaseSmsSetting::current();
        } catch (\Throwable $e) {
            $setting = (object) [
                'enabled' => true,
                'general_template' => "Dear {student_name}, thank you for purchasing \"{course_title}\" at Monologue Edu! Log in to start learning: {login_url}",
            ];
        }

        try {
            $courseTemplates = CourseSmsTemplate::with([
                'course:id,title,price,slug',
                'bundle:id,title,regular_price,sale_price,slug',
            ])
            ->latest()
            ->get();
        } catch (\Throwable $e) {
            $courseTemplates = [];
        }

        $courses = Course::select('id', 'title', 'price', 'status')
            ->orderBy('title')
            ->get();

        $bundles = CourseBundle::select('id', 'title', 'regular_price', 'sale_price', 'status')
            ->withCount('courses')
            ->orderBy('title')
            ->get();

        return response()->json([
            'setting' => $setting,
            'course_templates' => $courseTemplates,
            'courses' => $courses,
            'bundles' => $bundles,
        ]);
    }

    public function updateGeneralSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'general_template' => ['required', 'string', 'max:500'],
        ]);

        $setting = CoursePurchaseSmsSetting::current();
        $setting->update($validated);

        return response()->json([
            'message' => 'General Auto SMS Push settings updated successfully.',
            'setting' => $setting,
        ]);
    }

    public function saveCourseTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', 'in:course,bundle'],
            'course_id' => ['nullable', 'required_if:type,course', 'exists:courses,id'],
            'bundle_id' => ['nullable', 'required_if:type,bundle', 'exists:course_bundles,id'],
            'template' => ['required', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $type = $validated['type'] ?? (! empty($validated['bundle_id']) ? 'bundle' : 'course');

        if ($type === 'bundle') {
            $template = CourseSmsTemplate::updateOrCreate(
                [
                    'type' => 'bundle',
                    'bundle_id' => $validated['bundle_id'],
                ],
                [
                    'course_id' => null,
                    'template' => $validated['template'],
                    'is_active' => $validated['is_active'] ?? true,
                ]
            );
        } else {
            $template = CourseSmsTemplate::updateOrCreate(
                [
                    'type' => 'course',
                    'course_id' => $validated['course_id'],
                ],
                [
                    'bundle_id' => null,
                    'template' => $validated['template'],
                    'is_active' => $validated['is_active'] ?? true,
                ]
            );
        }

        $template->load([
            'course:id,title,price,slug',
            'bundle:id,title,regular_price,sale_price,slug',
        ]);

        return response()->json([
            'message' => ($type === 'bundle' ? 'Bundle' : 'Course') . '-specific SMS template saved successfully.',
            'template' => $template,
        ]);
    }

    public function deleteCourseTemplate(CourseSmsTemplate $template): JsonResponse
    {
        $itemType = $template->type === 'bundle' ? 'Bundle' : 'Course';
        $template->delete();

        return response()->json([
            'message' => "{$itemType}-specific SMS template removed. Default general SMS will now be used.",
        ]);
    }

    public function sendTestSms(Request $request, GreenWebSmsService $smsService): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'template' => ['required', 'string', 'max:500'],
            'type' => ['nullable', 'in:course,bundle'],
            'course_id' => ['nullable', 'exists:courses,id'],
            'bundle_id' => ['nullable', 'exists:course_bundles,id'],
        ]);

        $courseTitle = 'Sample Course';
        $bundleTitle = 'Sample Course Bundle';

        if (! empty($validated['course_id'])) {
            $course = Course::find($validated['course_id']);
            if ($course) {
                $courseTitle = $course->title;
            }
        }

        if (! empty($validated['bundle_id'])) {
            $bundle = CourseBundle::find($validated['bundle_id']);
            if ($bundle) {
                $bundleTitle = $bundle->title;
            }
        }

        $rendered = str_replace(
            ['{student_name}', '{course_title}', '{bundle_title}', '{order_id}', '{amount}', '{site_name}', '{login_url}'],
            ['Test Student', $courseTitle, $bundleTitle, 'ORD-9988', '৳1,500.00', 'Monologue Edu', url('/login')],
            $validated['template']
        );

        $result = $smsService->sendSms($validated['phone'], $rendered, 'test_auto_push');

        return response()->json([
            'message' => $result['message'] ?? 'Test SMS processed.',
            'rendered_message' => $rendered,
            'result' => $result,
        ]);
    }
}
