<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\NexPilot;
use App\Models\NexPilotChatMessage;
use App\Models\NexPilotStudentUsage;
use App\Models\NexPilotTopic;
use App\Models\Order;
use App\Models\Payment;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NexPilotStudentController extends Controller
{
    /**
     * Get NexPilot Hub data for a student enrolled in a course
     */
    public function getPilotForCourse(Request $request, $courseId): JsonResponse
    {
        $user = $request->user();
        $course = Course::findOrFail($courseId);

        $pilot = NexPilot::with([
            'topics' => function ($q) {
                $q->where('is_active', true)->orderBy('order_index')->orderBy('id');
            }
        ])->where('course_id', $course->id)->where('is_active', true)->first();

        if (!$pilot) {
            return response()->json([
                'has_access' => false,
                'message' => 'এই কোর্সের জন্য বর্তমানে কোনো সক্রিয় NexPilot প্রস্তুত নেই। শীঘ্রই যুক্ত হবে।',
            ], 404);
        }

        // Check enrollment & NexPilot permission
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->first();

        $hasAccess = (bool) (
            $user->isAdmin() ||
            $user->isTeacher() ||
            ($enrollment && ((float)$pilot->price <= 0 || $enrollment->has_nexpilot))
        );

        if (!$hasAccess) {
            return response()->json([
                'has_access' => false,
                'message' => 'এই কোর্সের জন্য NexPilot AI আনলক করা নেই। কোর্স ড্যাশবোর্ড থেকে আনলক করুন।',
            ], 403);
        }

        // Retrieve or initialize student usage record
        $usage = NexPilotStudentUsage::firstOrCreate(
            [
                'user_id' => $user->id,
                'nexpilot_id' => $pilot->id,
            ],
            [
                'enrollment_id' => $enrollment ? $enrollment->id : null,
                'prompt_tokens' => 0,
                'completion_tokens' => 0,
                'total_tokens' => 0,
                'total_usd_spent' => 0.000000,
                'is_blocked' => false,
            ]
        );

        $maxLimit = (float) $pilot->max_usd_limit;
        $usdSpent = (float) $usage->total_usd_spent;
        $remainingUsd = max(0, $maxLimit - $usdSpent);
        $isBlocked = $usdSpent >= $maxLimit;

        $theoryTopics = $pilot->topics->where('type', 'theory')->values()->map(function ($t) {
            return [
                'id' => $t->id,
                'type' => $t->type,
                'title' => $t->title,
                'description' => $t->description,
                'order_index' => $t->order_index,
                'attachments' => $t->attachments,
            ];
        });

        $practiceTopics = $pilot->topics->where('type', 'practice')->values()->map(function ($t) {
            return [
                'id' => $t->id,
                'type' => $t->type,
                'title' => $t->title,
                'description' => $t->description,
                'order_index' => $t->order_index,
                'attachments' => $t->attachments,
            ];
        });

        return response()->json([
            'has_access' => true,
            'pilot' => [
                'id' => $pilot->id,
                'title' => $pilot->title,
                'course_id' => $course->id,
                'course_title' => $course->title,
                'course_slug' => $course->slug,
                'max_usd_limit' => $maxLimit,
            ],
            'usage' => [
                'total_usd_spent' => round($usdSpent, 4),
                'max_usd_limit' => round($maxLimit, 4),
                'remaining_usd' => round($remainingUsd, 4),
                'is_blocked' => $isBlocked,
                'total_tokens' => $usage->total_tokens,
            ],
            'theory_topics' => $theoryTopics,
            'practice_topics' => $practiceTopics,
        ]);
    }

    /**
     * Get Chat History for a Topic
     */
    public function getTopicChatHistory(Request $request, $topicId): JsonResponse
    {
        $user = $request->user();
        $topic = NexPilotTopic::with('pilot')->findOrFail($topicId);

        // Access check
        $hasAccess = (bool) (
            $user->isAdmin() ||
            $user->isTeacher() ||
            ((float)$topic->pilot->price <= 0 && Enrollment::where('user_id', $user->id)->where('course_id', $topic->pilot->course_id)->where('status', Enrollment::STATUS_ACTIVE)->exists()) ||
            Enrollment::where('user_id', $user->id)
                ->where('course_id', $topic->pilot->course_id)
                ->where('status', Enrollment::STATUS_ACTIVE)
                ->where('has_nexpilot', true)
                ->exists()
        );

        if (!$hasAccess) {
            return response()->json(['message' => 'অ্যাক্সেস অনুমোদিত নয়।'], 403);
        }

        $messages = NexPilotChatMessage::where('user_id', $user->id)
            ->where('nexpilot_topic_id', $topic->id)
            ->orderBy('id', 'asc')
            ->select('id', 'role', 'content', 'created_at')
            ->get();

        return response()->json([
            'topic' => [
                'id' => $topic->id,
                'type' => $topic->type,
                'title' => $topic->title,
                'description' => $topic->description,
                'attachments' => $topic->attachments,
            ],
            'messages' => $messages,
        ]);
    }

    /**
     * Send Message to AI Chatbot (Theory or Practice)
     */
    public function sendMessage(Request $request, $topicId): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:3000'],
        ]);

        $user = $request->user();
        $topic = NexPilotTopic::with('pilot.course')->findOrFail($topicId);
        $pilot = $topic->pilot;

        // Access check
        $hasAccess = (bool) (
            $user->isAdmin() ||
            $user->isTeacher() ||
            ((float)$pilot->price <= 0 && Enrollment::where('user_id', $user->id)->where('course_id', $pilot->course_id)->where('status', Enrollment::STATUS_ACTIVE)->exists()) ||
            Enrollment::where('user_id', $user->id)
                ->where('course_id', $pilot->course_id)
                ->where('status', Enrollment::STATUS_ACTIVE)
                ->where('has_nexpilot', true)
                ->exists()
        );

        if (!$hasAccess) {
            return response()->json(['message' => 'অ্যাক্সেস অনুমোদিত নয়।'], 403);
        }

        // Check student usage & dollar limit
        $usage = NexPilotStudentUsage::firstOrCreate(
            [
                'user_id' => $user->id,
                'nexpilot_id' => $pilot->id,
            ],
            [
                'prompt_tokens' => 0,
                'completion_tokens' => 0,
                'total_tokens' => 0,
                'total_usd_spent' => 0.000000,
                'is_blocked' => false,
            ]
        );

        $maxLimit = (float) $pilot->max_usd_limit;
        if (!$user->isAdmin() && (float) $usage->total_usd_spent >= $maxLimit) {
            $usage->update(['is_blocked' => true]);
            return response()->json([
                'message' => "আপনার নির্ধারিত NexPilot ব্যালেন্স (\${$maxLimit}) শেষ হয়ে গেছে। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।",
                'is_limit_reached' => true,
            ], 403);
        }

        // Resolve OpenAI API Key & Model
        $apiKey = $pilot->getEffectiveApiKey();
        if (empty($apiKey)) {
            return response()->json([
                'message' => 'সিস্টেমে OpenAI API Key কনফিগার করা নেই। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।',
            ], 500);
        }

        $model = $pilot->getEffectiveModel();

        // Build System Prompt according to Theory vs Practice
        $courseTitle = $pilot->course->title ?? 'Novonex Course';
        $topicTitle = $topic->title;
        $customPrompt = trim($topic->prompt ?? '');
        $materialsText = trim($topic->materials_text ?? '');
        $globalPrompt = trim($pilot->system_prompt ?? '');

        if ($topic->type === 'theory') {
            $systemInstruction = "You are \"NexPilot\", an elite, supportive, and engaging AI educator for Novonex Academy. You are teaching students enrolled in the course: \"{$courseTitle}\".\n"
                . "You are conducting an interactive theory class on the specific topic: \"{$topicTitle}\".\n\n";

            if (!empty($globalPrompt)) {
                $systemInstruction .= "GLOBAL COURSE GUIDELINES:\n{$globalPrompt}\n\n";
            }
            if (!empty($customPrompt)) {
                $systemInstruction .= "TEACHER'S TOPIC INSTRUCTIONS (HOW TO TEACH):\n{$customPrompt}\n\n";
            }
            if (!empty($materialsText)) {
                $systemInstruction .= "REFERENCE NOTES & THEORY CONTENT:\n{$materialsText}\n\n";
            }

            $systemInstruction .= "TEACHING RULES:\n"
                . "1. Teach clearly step-by-step. Keep explanations engaging and structured with markdown.\n"
                . "2. Use intuitive real-world examples, diagrams, bullet points, or analogies.\n"
                . "3. Use LaTeX math notation for formulas ($...$ for inline, $$...$$ for display blocks).\n"
                . "4. Match the student's language. If the student writes in Bengali/Banglish, respond warmly in natural, fluent Bengali.\n"
                . "5. After explaining a core concept, ask a quick question to verify understanding before moving to the next part.";
        } else {
            // Practice mode
            $systemInstruction = "You are \"NexPilot Practice Coach\", an interactive AI problem-solving mentor for Novonex Academy. You are coaching students enrolled in: \"{$courseTitle}\".\n"
                . "You are guiding the student through practice problems for the topic: \"{$topicTitle}\".\n\n";

            if (!empty($globalPrompt)) {
                $systemInstruction .= "GLOBAL PRACTICE GUIDELINES:\n{$globalPrompt}\n\n";
            }
            if (!empty($customPrompt)) {
                $systemInstruction .= "TEACHER'S PRACTICE INSTRUCTIONS (HOW TO COACH & TEST):\n{$customPrompt}\n\n";
            }
            if (!empty($materialsText)) {
                $systemInstruction .= "REFERENCE PROBLEM SETS & SOLUTIONS:\n{$materialsText}\n\n";
            }

            $systemInstruction .= "PRACTICE COACHING RULES:\n"
                . "1. Present ONE problem at a time. Never give multiple questions at once.\n"
                . "2. Ask the student to solve it and share their answer, approach, or step.\n"
                . "3. When the student attempts an answer:\n"
                . "   - If correct: Congratulate them warmly, highlight the correct method, and present the next problem.\n"
                . "   - If there is a mistake: Gently identify the step with the error without revealing the full answer, and give a helpful hint.\n"
                . "   - If the student says they don't know, cannot solve, or asks for hints: Give a gentle guiding hint first.\n"
                . "   - If the student repeatedly struggles or explicitly asks for the solution: Provide the complete, clean, step-by-step solution, explain the underlying formula/concept, and then ask if they would like to try a similar problem.\n"
                . "4. Use LaTeX math ($...$) for formulas and equations.\n"
                . "5. Communicate warmly in natural Bengali (or English if the student initiates in English).";
        }

        // Fetch recent conversation history (last 12 messages)
        $pastMessages = NexPilotChatMessage::where('user_id', $user->id)
            ->where('nexpilot_topic_id', $topic->id)
            ->orderBy('id', 'desc')
            ->take(12)
            ->get()
            ->reverse();

        $openAiMessages = [];
        $openAiMessages[] = [
            'role' => 'system',
            'content' => $systemInstruction,
        ];

        foreach ($pastMessages as $pm) {
            $openAiMessages[] = [
                'role' => $pm->role === 'assistant' ? 'assistant' : 'user',
                'content' => $pm->content,
            ];
        }

        // Add current user message
        $userText = trim($validated['message']);
        $openAiMessages[] = [
            'role' => 'user',
            'content' => $userText,
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->timeout(45)->post('https://api.openai.com/v1/chat/completions', [
                'model' => $model,
                'messages' => $openAiMessages,
                'temperature' => 0.7,
                'max_tokens' => 1500,
            ]);

            if (!$response->successful()) {
                $errorMsg = $response->json('error.message') ?? 'OpenAI API ত্রুটি (Status ' . $response->status() . ')';
                Log::error('OpenAI NexPilot Error: ' . $errorMsg, ['response' => $response->body()]);
                return response()->json([
                    'message' => 'AI মডেলের সাথে সংযোগে সমস্যা হয়েছে: ' . $errorMsg,
                ], 502);
            }

            $respData = $response->json();
            $assistantReply = $respData['choices'][0]['message']['content'] ?? 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।';
            $usageData = $respData['usage'] ?? [];
            $promptTokens = (int) ($usageData['prompt_tokens'] ?? 0);
            $completionTokens = (int) ($usageData['completion_tokens'] ?? 0);
            $totalTokens = (int) ($usageData['total_tokens'] ?? ($promptTokens + $completionTokens));

            // Token pricing calculation
            $setting = WebsiteSetting::current();
            $openaiConfig = $setting->openai_settings ?? [];
            $costPer1kInput = (float) ($openaiConfig['cost_per_1k_input'] ?? 0.00015);
            $costPer1kOutput = (float) ($openaiConfig['cost_per_1k_output'] ?? 0.00060);

            // Rate adjustments for premium models
            if (str_contains($model, 'gpt-4o') && !str_contains($model, 'mini')) {
                $costPer1kInput = 0.00250;
                $costPer1kOutput = 0.01000;
            }

            $costUsd = (($promptTokens / 1000) * $costPer1kInput) + (($completionTokens / 1000) * $costPer1kOutput);

            // Persist User Message
            NexPilotChatMessage::create([
                'user_id' => $user->id,
                'nexpilot_topic_id' => $topic->id,
                'role' => 'user',
                'content' => $userText,
                'prompt_tokens' => $promptTokens,
                'completion_tokens' => 0,
                'usd_cost' => 0,
            ]);

            // Persist Assistant Message
            $savedAssistant = NexPilotChatMessage::create([
                'user_id' => $user->id,
                'nexpilot_topic_id' => $topic->id,
                'role' => 'assistant',
                'content' => $assistantReply,
                'prompt_tokens' => 0,
                'completion_tokens' => $completionTokens,
                'usd_cost' => $costUsd,
            ]);

            // Update student usage
            $usage->increment('prompt_tokens', $promptTokens);
            $usage->increment('completion_tokens', $completionTokens);
            $usage->increment('total_tokens', $totalTokens);
            $newTotalUsd = (float) $usage->total_usd_spent + $costUsd;
            $usage->total_usd_spent = $newTotalUsd;
            if ($newTotalUsd >= $maxLimit) {
                $usage->is_blocked = true;
            }
            $usage->save();

            $remainingUsd = max(0, $maxLimit - $newTotalUsd);

            return response()->json([
                'message' => [
                    'id' => $savedAssistant->id,
                    'role' => 'assistant',
                    'content' => $assistantReply,
                    'created_at' => $savedAssistant->created_at->toIso8601String(),
                ],
                'usage' => [
                    'total_usd_spent' => round($newTotalUsd, 4),
                    'remaining_usd' => round($remainingUsd, 4),
                    'max_usd_limit' => round($maxLimit, 4),
                    'is_blocked' => $newTotalUsd >= $maxLimit,
                    'last_turn_tokens' => $totalTokens,
                    'last_turn_cost_usd' => round($costUsd, 6),
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error('NexPilot sendMessage Exception: ' . $e->getMessage());
            return response()->json([
                'message' => 'সার্ভার প্রক্রিয়াকরণে সমস্যা হয়েছে: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Unlock NexPilot for an enrolled student
     */
    public function unlockPilotForEnrolledCourse(Request $request, $courseId): JsonResponse
    {
        $user = $request->user();
        $course = Course::findOrFail($courseId);
        $pilot = NexPilot::where('course_id', $course->id)->where('is_active', true)->firstOrFail();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->first();

        if (!$enrollment) {
            return response()->json([
                'message' => 'আপনাকে প্রথমে এই কোর্সে এনরোল করতে হবে।',
            ], 422);
        }

        // Free pilot or admin/teacher immediately activates
        if ((float) $pilot->price <= 0 || $user->isAdmin()) {
            $enrollment->update([
                'has_nexpilot' => true,
                'nexpilot_id' => $pilot->id,
            ]);

            return response()->json([
                'success' => true,
                'is_free' => true,
                'message' => 'NexPilot AI সফলভাবে আপনার কোর্সে সক্রিয় করা হয়েছে!',
                'redirect_url' => "/student/courses/{$course->id}/nexpilot",
            ]);
        }

        // Paid pilot via manual payment details
        $validated = $request->validate([
            'payment_method' => ['required', 'string'],
            'transaction_ref' => ['required', 'string'],
            'sender_phone' => ['required', 'string'],
        ]);

        if (Payment::where('transaction_ref', $validated['transaction_ref'])->exists()) {
            return response()->json([
                'message' => 'এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহৃত হয়েছে।',
            ], 422);
        }

        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'user_id' => $user->id,
            'course_id' => $course->id,
            'original_price' => (float) $pilot->price,
            'discount_amount' => 0,
            'final_amount' => (float) $pilot->price,
            'has_nexpilot' => true,
            'nexpilot_id' => $pilot->id,
            'nexpilot_price' => (float) $pilot->price,
            'payment_status' => Order::PAYMENT_PENDING,
            'order_status' => Order::ORDER_PROCESSING,
            'payment_method' => $validated['payment_method'],
            'notes' => 'NexPilot AI Add-on for Enrolled Student',
        ]);

        Payment::create([
            'order_id' => $order->id,
            'transaction_ref' => $validated['transaction_ref'],
            'sender_phone' => $validated['sender_phone'],
            'amount' => (float) $pilot->price,
            'payment_method' => $validated['payment_method'],
            'status' => Payment::STATUS_PENDING,
        ]);

        return response()->json([
            'success' => true,
            'requires_approval' => true,
            'message' => 'NexPilot পেমেন্ট সাবমিট হয়েছে। অ্যাডমিন পেমেন্ট যাচাই করলে স্বয়ংক্রিয়ভাবে সক্রিয় হবে।',
        ]);
    }
}

