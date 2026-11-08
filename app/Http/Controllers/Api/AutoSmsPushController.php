<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CoursePurchaseSmsSetting;
use App\Models\CourseSmsTemplate;
use App\Services\GreenWebSmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutoSmsPushController extends Controller
{
    public function getSettings(): JsonResponse
    {
        try {
            if (! \Illuminate\Support\Facades\Schema::hasTable('course_purchase_sms_settings')) {
                \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
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
            $courseTemplates = CourseSmsTemplate::with('course:id,title,price,slug')
                ->latest()
                ->get();
        } catch (\Throwable $e) {
            $courseTemplates = [];
        }

        $courses = Course::select('id', 'title', 'price', 'status')
            ->orderBy('title')
            ->get();

        return response()->json([
            'setting' => $setting,
            'course_templates' => $courseTemplates,
            'courses' => $courses,
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
            'course_id' => ['required', 'exists:courses,id'],
            'template' => ['required', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $template = CourseSmsTemplate::updateOrCreate(
            ['course_id' => $validated['course_id']],
            [
                'template' => $validated['template'],
                'is_active' => $validated['is_active'] ?? true,
            ]
        );

        $template->load('course:id,title,price,slug');

        return response()->json([
            'message' => 'Course-specific SMS template saved successfully.',
            'template' => $template,
        ]);
    }

    public function deleteCourseTemplate(CourseSmsTemplate $template): JsonResponse
    {
        $template->delete();

        return response()->json([
            'message' => 'Course-specific SMS template removed. Default general SMS will now be used.',
        ]);
    }

    public function sendTestSms(Request $request, GreenWebSmsService $smsService): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'template' => ['required', 'string', 'max:500'],
            'course_id' => ['nullable', 'exists:courses,id'],
        ]);

        $courseTitle = 'Sample Course';
        if (! empty($validated['course_id'])) {
            $course = Course::find($validated['course_id']);
            if ($course) {
                $courseTitle = $course->title;
            }
        }

        $rendered = str_replace(
            ['{student_name}', '{course_title}', '{order_id}', '{amount}', '{site_name}', '{login_url}'],
            ['Test Student', $courseTitle, 'ORD-9988', '৳1,500.00', 'Monologue Edu', url('/login')],
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

