<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamSubmission;
use App\Models\ExamSubmissionAnswer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExamSubmissionController extends Controller
{
    /**
     * Authorize user to evaluate or view all submissions
     */
    protected function authorizeEvaluator(User $user, Exam $exam): void
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

        abort(403, 'Unauthorized to view or evaluate submissions for this exam.');
    }

    /**
     * List all student submissions for an exam (with rankings)
     */
    public function getSubmissions(Request $request, Exam $exam): JsonResponse
    {
        $this->authorizeEvaluator($request->user(), $exam);

        $query = ExamSubmission::where('exam_id', $exam->id)
            ->with(['user:id,name,email,phone', 'evaluator:id,name'])
            ->orderByDesc('obtained_marks')
            ->orderBy('submitted_at');

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->whereHas('user', function ($uq) use ($search) {
                $uq->where('name', 'like', "%{$search}%")
                   ->orWhere('email', 'like', "%{$search}%")
                   ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $submissions = $query->paginate($request->integer('per_page', 20));

        // Attach merit position
        $submissions->getCollection()->transform(function ($sub, $idx) use ($submissions) {
            $currentPage = $submissions->currentPage();
            $perPage = $submissions->perPage();
            $sub->merit_position = (($currentPage - 1) * $perPage) + $idx + 1;
            return $sub;
        });

        // Statistics summary
        $totalSubmissions = ExamSubmission::where('exam_id', $exam->id)->count();
        $evaluatedCount = ExamSubmission::where('exam_id', $exam->id)->where('status', 'evaluated')->count();
        $pendingCount = ExamSubmission::where('exam_id', $exam->id)->where('status', 'submitted')->count();
        $highestMarks = ExamSubmission::where('exam_id', $exam->id)->max('obtained_marks') ?? 0;
        $avgMarks = ExamSubmission::where('exam_id', $exam->id)->avg('obtained_marks') ?? 0;

        return response()->json([
            'exam' => $exam->load('course:id,title,slug'),
            'submissions' => $submissions,
            'stats' => [
                'total_submissions' => $totalSubmissions,
                'evaluated_count' => $evaluatedCount,
                'pending_count' => $pendingCount,
                'highest_marks' => round($highestMarks, 2),
                'average_marks' => round($avgMarks, 2),
            ],
        ]);
    }

    /**
     * Get specific submission details for teacher evaluation
     */
    public function getSubmissionDetails(Request $request, Exam $exam, ExamSubmission $submission): JsonResponse
    {
        $user = $request->user();

        // Student can view their own; Teacher/Admin can view any
        if ($user->role === User::ROLE_STUDENT) {
            if ($submission->user_id !== $user->id) {
                abort(403, 'Unauthorized.');
            }
        } else {
            $this->authorizeEvaluator($user, $exam);
        }

        if ($submission->exam_id !== $exam->id) {
            abort(404, 'Submission does not match exam.');
        }

        $submission->load([
            'user:id,name,email,phone',
            'evaluator:id,name',
            'answers.question',
        ]);

        $submission->merit_position = $submission->getMeritPosition();

        return response()->json([
            'exam' => $exam,
            'submission' => $submission,
        ]);
    }

    /**
     * Teacher / Admin evaluates written paper answers
     */
    public function evaluateSubmission(Request $request, Exam $exam, ExamSubmission $submission): JsonResponse
    {
        $user = $request->user();
        $this->authorizeEvaluator($user, $exam);

        if ($submission->exam_id !== $exam->id) {
            abort(404, 'Submission does not match exam.');
        }

        $validated = $request->validate([
            'evaluation_notes' => ['nullable', 'string'],
            'evaluations' => ['required', 'array'],
            'evaluations.*.answer_id' => ['required', 'integer', 'exists:exam_submission_answers,id'],
            'evaluations.*.marks_obtained' => ['required', 'numeric', 'min:0'],
            'evaluations.*.feedback' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated, $submission, $user) {
            foreach ($validated['evaluations'] as $item) {
                ExamSubmissionAnswer::where('id', $item['answer_id'])
                    ->where('submission_id', $submission->id)
                    ->update([
                        'marks_obtained' => $item['marks_obtained'],
                        'teacher_feedback' => $item['feedback'] ?? null,
                    ]);
            }

            // Recalculate total obtained marks
            $totalMarksObtained = ExamSubmissionAnswer::where('submission_id', $submission->id)->sum('marks_obtained');
            $finalScore = max(0, $totalMarksObtained - $submission->negative_marks_deducted);

            $submission->update([
                'obtained_marks' => $finalScore,
                'status' => ExamSubmission::STATUS_EVALUATED,
                'evaluated_by' => $user->id,
                'evaluation_notes' => $validated['evaluation_notes'] ?? null,
                'evaluated_at' => now(),
            ]);
        });

        $submission->refresh()->load(['user:id,name,email', 'evaluator:id,name', 'answers.question']);
        $submission->merit_position = $submission->getMeritPosition();

        return response()->json([
            'message' => 'Submission evaluated and graded successfully!',
            'submission' => $submission,
        ]);
    }

    /**
     * Student starts or retrieves an exam session
     */
    public function studentStartExam(Request $request, Exam $exam): JsonResponse
    {
        $user = $request->user();

        // Check enrollment if course linked
        if ($exam->course_id) {
            $isEnrolled = Enrollment::where('course_id', $exam->course_id)
                ->where('user_id', $user->id)
                ->exists();

            if (!$isEnrolled && $user->role === User::ROLE_STUDENT) {
                return response()->json(['message' => 'Please enroll in the course to take this exam.'], 403);
            }
        }

        if ($exam->status !== Exam::STATUS_PUBLISHED) {
            return response()->json(['message' => 'This exam is not currently published.'], 400);
        }

        // Check if student already submitted
        $existing = ExamSubmission::where('exam_id', $exam->id)
            ->where('user_id', $user->id)
            ->whereIn('status', [ExamSubmission::STATUS_SUBMITTED, ExamSubmission::STATUS_EVALUATED])
            ->first();

        if ($existing) {
            $existing->merit_position = $existing->getMeritPosition();
            return response()->json([
                'already_submitted' => true,
                'submission' => $existing->load('answers.question'),
                'exam' => $exam->load('course:id,title'),
            ]);
        }

        // Get or create in-progress submission
        $submission = ExamSubmission::firstOrCreate(
            [
                'exam_id' => $exam->id,
                'user_id' => $user->id,
                'status' => ExamSubmission::STATUS_IN_PROGRESS,
            ],
            [
                'started_at' => now(),
                'total_marks' => $exam->total_marks,
                'total_questions' => $exam->questions()->count(),
            ]
        );

        // Fetch questions for student WITHOUT revealing correct_answers
        $questions = $exam->questions()
            ->orderBy('order')
            ->select('id', 'exam_id', 'question_text', 'question_type', 'marks', 'attachment_url', 'options', 'order')
            ->get();

        return response()->json([
            'already_submitted' => false,
            'exam' => $exam->load('course:id,title'),
            'submission' => $submission,
            'questions' => $questions,
        ]);
    }

    /**
     * Student submits exam answers (Auto-grade MCQs + Instant Result & Merit Calculation)
     */
    public function studentSubmitExam(Request $request, Exam $exam): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'answers' => ['present', 'array'],
            'answers.*.question_id' => ['required', 'integer', 'exists:exam_questions,id'],
            'answers.*.student_answer' => ['nullable'], // string or array of option IDs
            'answers.*.attachments' => ['nullable', 'array'], // for written paper photo/pdf
        ]);

        $submission = ExamSubmission::where('exam_id', $exam->id)
            ->where('user_id', $user->id)
            ->where('status', ExamSubmission::STATUS_IN_PROGRESS)
            ->first();

        if (!$submission) {
            // If already submitted, return existing
            $existing = ExamSubmission::where('exam_id', $exam->id)
                ->where('user_id', $user->id)
                ->first();

            if ($existing) {
                $existing->merit_position = $existing->getMeritPosition();
                return response()->json([
                    'message' => 'Exam already submitted.',
                    'submission' => $existing->load('answers.question'),
                ]);
            }

            $submission = ExamSubmission::create([
                'exam_id' => $exam->id,
                'user_id' => $user->id,
                'started_at' => now(),
                'total_marks' => $exam->total_marks,
            ]);
        }

        $allQuestions = $exam->questions()->get()->keyBy('id');

        $totalQuestions = $allQuestions->count();
        $totalAnswered = 0;
        $totalSkipped = 0;
        $totalCorrect = 0;
        $totalWrong = 0;
        $negativeDeduction = 0;
        $autoMarksObtained = 0;
        $hasWrittenPaper = false;

        $answersData = collect($validated['answers'])->keyBy('question_id');

        DB::transaction(function () use (
            $allQuestions,
            $answersData,
            $submission,
            $exam,
            &$totalAnswered,
            &$totalSkipped,
            &$totalCorrect,
            &$totalWrong,
            &$negativeDeduction,
            &$autoMarksObtained,
            &$hasWrittenPaper
        ) {
            // Delete previous answers if any
            $submission->answers()->delete();

            foreach ($allQuestions as $qId => $question) {
                $ansInput = $answersData->get($qId);
                $studentAnswer = $ansInput['student_answer'] ?? null;
                $attachments = $ansInput['attachments'] ?? [];

                if ($question->question_type === ExamQuestion::TYPE_WRITTEN_PAPER) {
                    $hasWrittenPaper = true;
                    $isAnswered = !empty($attachments) || !empty($studentAnswer);

                    if ($isAnswered) {
                        $totalAnswered++;
                    } else {
                        $totalSkipped++;
                    }

                    $submission->answers()->create([
                        'question_id' => $question->id,
                        'student_answer' => is_array($studentAnswer) ? $studentAnswer : ($studentAnswer ? [$studentAnswer] : []),
                        'attachments' => $attachments,
                        'is_correct' => null, // to be evaluated by teacher
                        'marks_obtained' => 0,
                    ]);
                } else {
                    // Single choice or Multiple choice
                    $correctAnswers = collect($question->correct_answers ?? [])->map(fn($v) => (string)$v)->sort()->values()->toArray();
                    $selectedAnswers = is_array($studentAnswer)
                        ? collect($studentAnswer)->map(fn($v) => (string)$v)->sort()->values()->toArray()
                        : ($studentAnswer !== null && $studentAnswer !== '' ? [(string)$studentAnswer] : []);

                    if (empty($selectedAnswers)) {
                        $totalSkipped++;
                        $submission->answers()->create([
                            'question_id' => $question->id,
                            'student_answer' => [],
                            'is_correct' => false,
                            'marks_obtained' => 0,
                        ]);
                    } else {
                        $totalAnswered++;
                        $isCorrect = ($selectedAnswers === $correctAnswers);

                        if ($isCorrect) {
                            $totalCorrect++;
                            $marksForThis = (float) $question->marks;
                            $autoMarksObtained += $marksForThis;
                            $submission->answers()->create([
                                'question_id' => $question->id,
                                'student_answer' => $selectedAnswers,
                                'is_correct' => true,
                                'marks_obtained' => $marksForThis,
                            ]);
                        } else {
                            $totalWrong++;
                            if ($exam->has_negative_marking && $exam->negative_marks > 0) {
                                $negativeDeduction += (float) $exam->negative_marks;
                            }

                            $submission->answers()->create([
                                'question_id' => $question->id,
                                'student_answer' => $selectedAnswers,
                                'is_correct' => false,
                                'marks_obtained' => 0,
                            ]);
                        }
                    }
                }
            }

            $finalObtained = max(0, $autoMarksObtained - $negativeDeduction);

            // If exam has no written questions, it's fully evaluated instantly!
            $status = $hasWrittenPaper ? ExamSubmission::STATUS_SUBMITTED : ExamSubmission::STATUS_EVALUATED;

            $submission->update([
                'submitted_at' => now(),
                'total_marks' => $exam->total_marks,
                'obtained_marks' => $finalObtained,
                'total_questions' => $totalQuestions,
                'total_answered' => $totalAnswered,
                'total_skipped' => $totalSkipped,
                'total_correct' => $totalCorrect,
                'total_wrong' => $totalWrong,
                'negative_marks_deducted' => $negativeDeduction,
                'status' => $status,
                'evaluated_at' => $hasWrittenPaper ? null : now(),
            ]);
        });

        $submission->refresh()->load(['answers.question', 'exam:id,title,total_marks,has_negative_marking,negative_marks']);
        $meritPosition = $submission->getMeritPosition();
        $submission->merit_position = $meritPosition;

        return response()->json([
            'message' => 'Exam submitted successfully!',
            'submission' => $submission,
            'summary' => [
                'obtained_marks' => $submission->obtained_marks,
                'total_marks' => $submission->total_marks,
                'total_questions' => $submission->total_questions,
                'total_answered' => $submission->total_answered,
                'total_skipped' => $submission->total_skipped,
                'total_correct' => $submission->total_correct,
                'total_wrong' => $submission->total_wrong,
                'negative_marks_deducted' => $submission->negative_marks_deducted,
                'merit_position' => $meritPosition,
                'requires_teacher_grading' => $hasWrittenPaper,
            ],
        ]);
    }

    /**
     * Upload photo or PDF for written paper answer
     */
    public function uploadAnswerAttachment(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:25600', 'mimes:jpg,jpeg,png,webp,pdf'],
        ]);

        $file = $request->file('file');
        $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('exam_answers', $fileName, 'public');

        return response()->json([
            'url' => Storage::url($path),
            'file_name' => $file->getClientOriginalName(),
            'file_type' => in_array($file->getClientOriginalExtension(), ['pdf']) ? 'pdf' : 'image',
        ]);
    }
}
