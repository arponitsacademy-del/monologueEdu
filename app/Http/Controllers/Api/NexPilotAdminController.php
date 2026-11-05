<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\NexPilot;
use App\Models\NexPilotTopic;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class NexPilotAdminController extends Controller
{
    /**
     * List all NexPilots
     */
    public function index(Request $request): JsonResponse
    {
        $query = NexPilot::with(['course:id,title,slug,price,thumbnail'])
            ->withCount([
                'topics as total_topics_count',
                'theoryTopics as theory_topics_count',
                'practiceTopics as practice_topics_count',
                'studentUsages as students_count'
            ]);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('course', function ($cq) use ($search) {
                      $cq->where('title', 'like', "%{$search}%");
                  });
            });
        }

        $pilots = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json($pilots);
    }

    /**
     * Get courses eligible for a new pilot
     */
    public function getEligibleCourses(): JsonResponse
    {
        // Get all courses that don't already have a pilot (or allow pilot update)
        $courses = Course::select('id', 'title', 'price', 'sale_price', 'status')
            ->with('nexpilot:id,course_id')
            ->orderBy('title')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'title' => $c->title,
                    'price' => (float) $c->effective_price,
                    'status' => $c->status,
                    'has_pilot' => (bool) $c->nexpilot,
                ];
            });

        return response()->json($courses);
    }

    /**
     * Store new NexPilot
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id', 'unique:nexpilots,course_id'],
            'title' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'long_description' => ['nullable', 'string'],
            'max_usd_limit' => ['required', 'numeric', 'min:0.01', 'max:100.00'],
            'openai_model' => ['nullable', 'string', 'max:100'],
            'openai_api_key' => ['nullable', 'string', 'max:500'],
            'system_prompt' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $course = Course::findOrFail($validated['course_id']);
        if (empty($validated['title'])) {
            $validated['title'] = $course->title . ' NexPilot';
        }
        if (empty($validated['openai_model'])) {
            $validated['openai_model'] = 'gpt-4o-mini';
        }

        $pilot = NexPilot::create($validated);

        return response()->json([
            'message' => 'NexPilot সফলভাবে তৈরি করা হয়েছে।',
            'pilot' => $pilot->load('course:id,title,price'),
        ], 201);
    }

    /**
     * Show single NexPilot
     */
    public function show($id): JsonResponse
    {
        $pilot = NexPilot::with(['course:id,title,price,thumbnail'])
            ->withCount(['theoryTopics', 'practiceTopics'])
            ->findOrFail($id);

        return response()->json($pilot);
    }

    /**
     * Update NexPilot
     */
    public function update(Request $request, $id): JsonResponse
    {
        $pilot = NexPilot::findOrFail($id);

        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id', 'unique:nexpilots,course_id,' . $pilot->id],
            'title' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'long_description' => ['nullable', 'string'],
            'max_usd_limit' => ['required', 'numeric', 'min:0.01', 'max:100.00'],
            'openai_model' => ['required', 'string', 'max:100'],
            'openai_api_key' => ['nullable', 'string', 'max:500'],
            'system_prompt' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $pilot->update($validated);

        return response()->json([
            'message' => 'NexPilot সফলভাবে আপডেট করা হয়েছে।',
            'pilot' => $pilot->fresh(['course:id,title,price']),
        ]);
    }

    /**
     * Delete NexPilot
     */
    public function destroy($id): JsonResponse
    {
        $pilot = NexPilot::findOrFail($id);
        $pilot->delete();

        return response()->json([
            'message' => 'NexPilot সফলভাবে মুছে ফেলা হয়েছে।',
        ]);
    }

    /**
     * Get Builder Data (Theory & Practice Topics + Attachments)
     */
    public function getBuilderData($id): JsonResponse
    {
        $pilot = NexPilot::with([
            'course:id,title,slug,price,thumbnail',
            'topics' => function ($q) {
                $q->orderBy('order_index')->orderBy('id');
            }
        ])->findOrFail($id);

        $theoryTopics = $pilot->topics->where('type', 'theory')->values();
        $practiceTopics = $pilot->topics->where('type', 'practice')->values();

        return response()->json([
            'pilot' => [
                'id' => $pilot->id,
                'course_id' => $pilot->course_id,
                'course_title' => $pilot->course->title ?? '',
                'title' => $pilot->title,
                'price' => $pilot->price,
                'max_usd_limit' => $pilot->max_usd_limit,
                'openai_model' => $pilot->openai_model,
                'has_custom_key' => !empty($pilot->openai_api_key),
                'system_prompt' => $pilot->system_prompt,
                'is_active' => $pilot->is_active,
            ],
            'theory_topics' => $theoryTopics,
            'practice_topics' => $practiceTopics,
        ]);
    }

    /**
     * Store new Topic (Theory or Practice)
     */
    public function storeTopic(Request $request, $id): JsonResponse
    {
        $pilot = NexPilot::findOrFail($id);

        $validated = $request->validate([
            'type' => ['required', 'in:theory,practice'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'prompt' => ['required', 'string'],
            'materials_text' => ['nullable', 'string'],
            'attachments' => ['nullable', 'array'],
            'attachments.*.name' => ['required', 'string'],
            'attachments.*.url' => ['required', 'string'],
            'attachments.*.size' => ['nullable'],
            'attachments.*.type' => ['nullable', 'string'],
            'order_index' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);

        if (!isset($validated['order_index'])) {
            $maxOrder = $pilot->topics()->where('type', $validated['type'])->max('order_index') ?? 0;
            $validated['order_index'] = $maxOrder + 1;
        }

        $topic = $pilot->topics()->create($validated);

        return response()->json([
            'message' => ($validated['type'] === 'theory' ? 'থিওরি' : 'প্র্যাকটিস') . ' টপিক সফলভাবে তৈরি হয়েছে।',
            'topic' => $topic,
        ], 201);
    }

    /**
     * Update Topic
     */
    public function updateTopic(Request $request, $topicId): JsonResponse
    {
        $topic = NexPilotTopic::findOrFail($topicId);

        $validated = $request->validate([
            'type' => ['required', 'in:theory,practice'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'prompt' => ['required', 'string'],
            'materials_text' => ['nullable', 'string'],
            'attachments' => ['nullable', 'array'],
            'attachments.*.name' => ['required', 'string'],
            'attachments.*.url' => ['required', 'string'],
            'attachments.*.size' => ['nullable'],
            'attachments.*.type' => ['nullable', 'string'],
            'order_index' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);

        $topic->update($validated);

        return response()->json([
            'message' => 'টপিক সফলভাবে আপডেট করা হয়েছে।',
            'topic' => $topic,
        ]);
    }

    /**
     * Delete Topic
     */
    public function destroyTopic($topicId): JsonResponse
    {
        $topic = NexPilotTopic::findOrFail($topicId);
        $topic->delete();

        return response()->json([
            'message' => 'টপিক সফলভাবে মুছে ফেলা হয়েছে।',
        ]);
    }

    /**
     * Reorder topics
     */
    public function reorderTopics(Request $request, $id): JsonResponse
    {
        $pilot = NexPilot::findOrFail($id);
        $validated = $request->validate([
            'topics' => ['required', 'array'],
            'topics.*.id' => ['required', 'exists:nexpilot_topics,id'],
            'topics.*.order_index' => ['required', 'integer'],
        ]);

        foreach ($validated['topics'] as $item) {
            NexPilotTopic::where('id', $item['id'])
                ->where('nexpilot_id', $pilot->id)
                ->update(['order_index' => $item['order_index']]);
        }

        return response()->json([
            'message' => 'টপিকের ক্রম সফলভাবে সংরক্ষণ করা হয়েছে।',
        ]);
    }

    /**
     * Upload material (slides, pdf, notes, books)
     */
    public function uploadAttachment(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:30720'], // Max 30MB
        ]);

        $file = $request->file('file');
        $fileName = time() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();

        $path = $file->storeAs('nexpilot/materials', $fileName, 'public');
        $url = Storage::disk('public')->url($path);

        return response()->json([
            'name' => $file->getClientOriginalName(),
            'url' => $url,
            'size' => $file->getSize(),
            'type' => $file->getClientMimeType(),
        ]);
    }

    /**
     * Get Global OpenAI Settings
     */
    public function getSettings(): JsonResponse
    {
        $setting = WebsiteSetting::current();
        $openai = $setting->openai_settings ?? [];

        return response()->json([
            'has_api_key' => !empty($openai['api_key']) || !empty(env('OPENAI_API_KEY')),
            'api_key' => $openai['api_key'] ?? '',
            'default_model' => $openai['default_model'] ?? 'gpt-4o-mini',
            'cost_per_1k_input' => $openai['cost_per_1k_input'] ?? 0.00015,
            'cost_per_1k_output' => $openai['cost_per_1k_output'] ?? 0.00060,
        ]);
    }

    /**
     * Update Global OpenAI Settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'api_key' => ['nullable', 'string', 'max:500'],
            'default_model' => ['required', 'string', 'max:100'],
            'cost_per_1k_input' => ['nullable', 'numeric', 'min:0'],
            'cost_per_1k_output' => ['nullable', 'numeric', 'min:0'],
        ]);

        $setting = WebsiteSetting::current();
        $current = $setting->openai_settings ?? [];

        $setting->update([
            'openai_settings' => [
                'api_key' => isset($validated['api_key']) ? trim($validated['api_key']) : ($current['api_key'] ?? ''),
                'default_model' => $validated['default_model'],
                'cost_per_1k_input' => (float) ($validated['cost_per_1k_input'] ?? 0.00015),
                'cost_per_1k_output' => (float) ($validated['cost_per_1k_output'] ?? 0.00060),
            ],
        ]);

        return response()->json([
            'message' => 'OpenAI কনফিগারেশন সফলভাবে সংরক্ষণ করা হয়েছে।',
            'settings' => $setting->fresh()->openai_settings,
        ]);
    }

    /**
     * Test OpenAI Connection
     */
    public function testConnection(Request $request): JsonResponse
    {
        $apiKey = trim($request->input('api_key', ''));
        if (empty($apiKey)) {
            $setting = WebsiteSetting::current();
            $apiKey = $setting->openai_settings['api_key'] ?? env('OPENAI_API_KEY', '');
        }

        if (empty($apiKey)) {
            return response()->json([
                'success' => false,
                'message' => 'কোনো OpenAI API Key পাওয়া যায়নি। অনুগ্রহ করে কী লিখুন।',
            ], 422);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
            ])->timeout(12)->get('https://api.openai.com/v1/models');

            if ($response->successful()) {
                $models = collect($response->json('data', []))->pluck('id')->filter(function ($id) {
                    return str_contains($id, 'gpt');
                })->take(10)->values();

                return response()->json([
                    'success' => true,
                    'message' => 'OpenAI API সংযোগ সফল হয়েছে! মডেল অ্যাক্সেস সচল রয়েছে।',
                    'models' => $models,
                ]);
            }

            $errorMsg = $response->json('error.message') ?? 'OpenAI API সংযোগ ব্যর্থ হয়েছে (Status ' . $response->status() . ')';
            return response()->json([
                'success' => false,
                'message' => $errorMsg,
            ], 422);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'সার্ভার সংযোগে ত্রুটি: ' . $e->getMessage(),
            ], 500);
        }
    }
}

