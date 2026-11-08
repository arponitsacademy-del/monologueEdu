<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\User;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AiExamQuestionController extends Controller
{
    /**
     * Authorize user to build exam
     */
    protected function authorizeExam(User $user, Exam $exam): void
    {
        if ($user->role === User::ROLE_ADMIN) {
            return;
        }

        if ($user->role === User::ROLE_TEACHER) {
            if ($exam->created_by === $user->id) {
                return;
            }

            if ($exam->course_id) {
                $isInstructor = Course::where('id', $exam->course_id)
                    ->where(function ($q) use ($user) {
                        $q->where('instructor_id', $user->id)
                          ->orWhereHas('instructors', fn($iq) => $iq->where('users.id', $user->id));
                    })
                    ->exists();

                if ($isInstructor) {
                    return;
                }
            }
        }

        abort(403, 'Unauthorized to manage questions for this exam.');
    }

    /**
     * Generate exam questions using OpenAI
     */
    public function generateQuestions(Request $request, Exam $exam): JsonResponse
    {
        $this->authorizeExam($request->user(), $exam);

        $validated = $request->validate([
            'prompt' => ['nullable', 'string', 'max:5000'],
            'question_types' => ['nullable', 'array'],
            'question_types.*' => ['string', 'in:single_choice,multiple_choice,fill_in_the_blank,written_paper'],
            'count' => ['nullable', 'integer', 'min:1', 'max:30'],
            'difficulty' => ['nullable', 'string', 'in:easy,medium,hard,mixed'],
            'marks_per_question' => ['nullable', 'numeric', 'min:0.5', 'max:100'],
            'reference_text' => ['nullable', 'string', 'max:50000'],
            'media_urls' => ['nullable', 'array'],
            'media_urls.*' => ['string'],
            'existing_approved_questions' => ['nullable', 'array'],
        ]);

        $setting = WebsiteSetting::current();
        $openai = $setting->openai_settings ?? [];
        $apiKey = $openai['api_key'] ?? env('OPENAI_API_KEY', '');
        $model = $openai['default_model'] ?? 'gpt-4o-mini';

        if (empty($apiKey)) {
            return response()->json([
                'message' => 'OpenAI API Key is not configured yet. Please configure your API key in AI -> AI Configuration menu first.',
            ], 422);
        }

        $count = (int) ($validated['count'] ?? 5);
        $types = !empty($validated['question_types']) ? $validated['question_types'] : ['single_choice', 'multiple_choice', 'fill_in_the_blank'];
        $difficulty = $validated['difficulty'] ?? 'medium';
        $marks = (float) ($validated['marks_per_question'] ?? 1);
        $customPrompt = trim($validated['prompt'] ?? '');
        $referenceText = trim($validated['reference_text'] ?? '');
        $mediaUrls = $validated['media_urls'] ?? [];
        $existingApproved = $validated['existing_approved_questions'] ?? [];

        // Extract text from media if available
        $extractedMediaText = '';
        $imageUrls = [];

        foreach ($mediaUrls as $url) {
            $pathInfo = pathinfo(parse_url($url, PHP_URL_PATH) ?? '');
            $extension = strtolower($pathInfo['extension'] ?? '');

            if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
                $imageUrls[] = $url;
            } elseif ($extension === 'pdf') {
                $pdfText = $this->extractTextFromPdfUrl($url);
                if (!empty($pdfText)) {
                    $extractedMediaText .= "\n--- Content extracted from PDF ({$pathInfo['basename']}) ---\n" . mb_substr($pdfText, 0, 15000);
                }
            } elseif (in_array($extension, ['txt', 'md', 'json', 'csv'])) {
                $rawContent = $this->readTextFileFromUrl($url);
                if (!empty($rawContent)) {
                    $extractedMediaText .= "\n--- Document Reference ({$pathInfo['basename']}) ---\n" . mb_substr($rawContent, 0, 15000);
                }
            }
        }

        $combinedReference = trim($referenceText . "\n" . $extractedMediaText);

        // Build system and user prompt
        $typesListStr = implode(', ', $types);
        $systemMessage = "You are an expert exam question creator for \"Monologue Edu\", an advanced educational platform.
Your task is to generate exactly {$count} high-quality, academically rigorous examination questions based strictly on the instructions and provided reference material.

CRITICAL RULES:
1. Output format: You MUST return a single JSON object with exactly one top-level key: \"questions\".
2. Allowed question types for this request: [{$typesListStr}].
3. For \"single_choice\": Provide exactly 4 options with ids \"1\", \"2\", \"3\", \"4\". \"correct_answers\" MUST be an array with exactly one id string (e.g. [\"2\"]).
4. For \"multiple_choice\": Provide exactly 4 options with ids \"1\", \"2\", \"3\", \"4\". \"correct_answers\" MUST be an array with 2 or more id strings (e.g. [\"1\", \"3\"]).
5. For \"fill_in_the_blank\": The \"question_text\" MUST contain \"____\" (four underscores) or \"[blank]\" indicating the missing word or phrase. \"correct_answers\" MUST be an array of accepted text answers/synonyms (e.g. [\"Mitochondria\", \"mitochondrion\"]). \"options\" MUST be null.
6. For \"written_paper\": Provide a deep theoretical or mathematical problem. \"options\" MUST be null, \"correct_answers\" MUST be null. The \"explanation\" MUST contain a step-by-step model solution and grading rubric.
7. Math & Formulas: Use standard LaTeX / KaTeX enclosed in dollar signs for mathematical, chemical or scientific formulas (e.g. \$E = mc^2\$, \$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\$, \$H_2O\$).
8. Ensure clear, educational explanations for every single question in \"explanation\".
9. Set \"marks\" to {$marks} for each question.";

        $userInstruction = "Please generate {$count} exam questions.
Difficulty level: {$difficulty}.
Allowed question types: {$typesListStr}.
Exam context / Title: \"{$exam->title}\".
Marks per question: {$marks}.";

        if (!empty($customPrompt)) {
            $userInstruction .= "\n\nSpecific Teacher Prompt / Instructions:\n{$customPrompt}";
        }

        if (!empty($combinedReference)) {
            $userInstruction .= "\n\nReference Study Material / Book Content:\n" . mb_substr($combinedReference, 0, 25000);
        }

        if (!empty($existingApproved)) {
            $avoidList = [];
            foreach ($existingApproved as $ea) {
                if (!empty($ea['question_text'])) {
                    $avoidList[] = '- ' . Str::limit($ea['question_text'], 120);
                }
            }
            if (!empty($avoidList)) {
                $userInstruction .= "\n\nNote: The following questions were already created and approved. DO NOT repeat them or make similar questions; generate brand new questions:\n" . implode("\n", array_slice($avoidList, 0, 15));
            }
        }

        // Build messages payload
        $messages = [
            ['role' => 'system', 'content' => $systemMessage],
        ];

        // If vision model and images are present, include image_url blocks
        if (!empty($imageUrls) && (str_contains($model, '4o') || str_contains($model, 'vision'))) {
            $userContent = [
                ['type' => 'text', 'text' => $userInstruction],
            ];
            foreach (array_slice($imageUrls, 0, 4) as $imgUrl) {
                $userContent[] = [
                    'type' => 'image_url',
                    'image_url' => ['url' => $imgUrl, 'detail' => 'high'],
                ];
            }
            $messages[] = ['role' => 'user', 'content' => $userContent];
        } else {
            $messages[] = ['role' => 'user', 'content' => $userInstruction];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->timeout(90)->post('https://api.openai.com/v1/chat/completions', [
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0.7,
                'response_format' => ['type' => 'json_object'],
            ]);

            if (!$response->successful()) {
                $err = $response->json('error.message') ?? $response->body();
                Log::error("OpenAI Question Generation Error: {$err}");
                return response()->json([
                    'message' => "OpenAI API error: {$err}",
                ], 422);
            }

            $rawContent = $response->json('choices.0.message.content');
            $decoded = json_decode($rawContent, true);

            $rawQuestions = $decoded['questions'] ?? (is_array($decoded) ? $decoded : []);

            $formattedQuestions = [];
            foreach ($rawQuestions as $idx => $q) {
                if (empty($q['question_text'])) {
                    continue;
                }

                $qType = $q['question_type'] ?? 'single_choice';
                if (!in_array($qType, ['single_choice', 'multiple_choice', 'fill_in_the_blank', 'written_paper'])) {
                    $qType = 'single_choice';
                }

                $options = null;
                $correctAnswers = null;

                if ($qType === 'single_choice' || $qType === 'multiple_choice') {
                    $opts = $q['options'] ?? [];
                    $options = [];
                    foreach ($opts as $oIdx => $opt) {
                        $id = (string) ($opt['id'] ?? ($oIdx + 1));
                        $text = (string) ($opt['text'] ?? ($opt['option'] ?? ''));
                        if (!empty(trim($text))) {
                            $options[] = ['id' => $id, 'text' => $text];
                        }
                    }

                    // Fallback to at least 4 dummy options if malformed
                    if (count($options) < 2) {
                        $options = [
                            ['id' => '1', 'text' => 'Option A'],
                            ['id' => '2', 'text' => 'Option B'],
                            ['id' => '3', 'text' => 'Option C'],
                            ['id' => '4', 'text' => 'Option D'],
                        ];
                    }

                    $correctAnswers = collect($q['correct_answers'] ?? ['1'])->map(fn($v) => (string)$v)->values()->toArray();
                    if (empty($correctAnswers)) {
                        $correctAnswers = ['1'];
                    }
                } elseif ($qType === 'fill_in_the_blank') {
                    $correctAnswers = is_array($q['correct_answers'] ?? null)
                        ? array_values(array_filter($q['correct_answers']))
                        : [trim((string)($q['correct_answers'] ?? 'Answer'))];

                    if (empty($correctAnswers)) {
                        $correctAnswers = ['Correct Answer'];
                    }
                }

                $formattedQuestions[] = [
                    'id' => 'ai_' . time() . '_' . $idx . '_' . Str::random(4),
                    'question_text' => (string) $q['question_text'],
                    'question_type' => $qType,
                    'marks' => (float) ($q['marks'] ?? $marks),
                    'explanation' => (string) ($q['explanation'] ?? ''),
                    'options' => $options,
                    'correct_answers' => $correctAnswers,
                    'attachment_url' => null,
                ];
            }

            return response()->json([
                'success' => true,
                'count' => count($formattedQuestions),
                'questions' => $formattedQuestions,
                'model_used' => $model,
            ]);

        } catch (\Throwable $e) {
            Log::error('AI Question Generation Exception: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'message' => 'Failed to generate questions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Batch import approved questions into the Exam
     */
    public function importQuestions(Request $request, Exam $exam): JsonResponse
    {
        $this->authorizeExam($request->user(), $exam);

        $validated = $request->validate([
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.question_type' => ['required', 'string', 'in:single_choice,multiple_choice,fill_in_the_blank,written_paper'],
            'questions.*.marks' => ['required', 'numeric', 'min:0.1'],
            'questions.*.explanation' => ['nullable', 'string'],
            'questions.*.attachment_url' => ['nullable', 'string'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*.id' => ['required_with:questions.*.options', 'string'],
            'questions.*.options.*.text' => ['required_with:questions.*.options', 'string'],
            'questions.*.correct_answers' => ['nullable', 'array'],
        ]);

        $maxOrder = (int) $exam->questions()->max('order');
        $createdQuestions = [];

        foreach ($validated['questions'] as $qData) {
            $maxOrder++;

            $question = $exam->questions()->create([
                'question_text' => $qData['question_text'],
                'question_type' => $qData['question_type'],
                'marks' => (float) $qData['marks'],
                'explanation' => $qData['explanation'] ?? null,
                'attachment_url' => $qData['attachment_url'] ?? null,
                'options' => in_array($qData['question_type'], ['written_paper', 'fill_in_the_blank']) ? null : ($qData['options'] ?? null),
                'correct_answers' => $qData['question_type'] === 'written_paper' ? null : ($qData['correct_answers'] ?? null),
                'order' => $maxOrder,
            ]);

            $createdQuestions[] = $question;
        }

        $exam->recalculateTotalMarks();

        return response()->json([
            'message' => count($createdQuestions) . ' questions imported successfully into exam!',
            'count' => count($createdQuestions),
            'questions' => $createdQuestions,
            'exam_total_marks' => $exam->fresh()->total_marks,
        ]);
    }

    /**
     * Helper to read text from URL
     */
    protected function readTextFileFromUrl(string $url): string
    {
        try {
            if (str_starts_with($url, '/storage/') || str_contains($url, '/storage/')) {
                $path = str_replace(url('/storage/'), '', $url);
                $path = ltrim($path, '/');
                $localPath = storage_path('app/public/' . $path);
                if (file_exists($localPath)) {
                    return file_get_contents($localPath) ?: '';
                }
            }

            $resp = Http::timeout(10)->get($url);
            if ($resp->successful()) {
                return $resp->body();
            }
        } catch (\Throwable $e) {}

        return '';
    }

    /**
     * Basic stream text extraction for PDF
     */
    protected function extractTextFromPdfUrl(string $url): string
    {
        try {
            $content = '';
            if (str_starts_with($url, '/storage/') || str_contains($url, '/storage/')) {
                $path = str_replace(url('/storage/'), '', $url);
                $path = ltrim($path, '/');
                $localPath = storage_path('app/public/' . $path);
                if (file_exists($localPath)) {
                    $content = file_get_contents($localPath) ?: '';
                }
            }

            if (empty($content)) {
                $resp = Http::timeout(15)->get($url);
                if ($resp->successful()) {
                    $content = $resp->body();
                }
            }

            if (empty($content)) {
                return '';
            }

            // Extract plain text streams
            $text = '';
            if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $content, $matches)) {
                foreach ($matches[1] as $stream) {
                    $decompressed = @gzuncompress($stream);
                    if ($decompressed !== false) {
                        $stream = $decompressed;
                    }
                    if (preg_match_all('/\((.*?)\)\s*Tj/s', $stream, $tjs)) {
                        $text .= implode(' ', $tjs[1]) . ' ';
                    } elseif (preg_match_all('/\[(.*?)\]\s*TJ/s', $stream, $tjs)) {
                        foreach ($tjs[1] as $arrayStr) {
                            if (preg_match_all('/\((.*?)\)/', $arrayStr, $inner)) {
                                $text .= implode('', $inner[1]) . ' ';
                            }
                        }
                    }
                }
            }

            // Clean up text
            $text = preg_replace('/[^\x20-\x7E\r\n\t]/', ' ', $text);
            $text = preg_replace('/\s+/', ' ', $text);

            return trim($text);
        } catch (\Throwable $e) {
            return '';
        }
    }
}
