<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExamBuilderController extends Controller
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

        abort(403, 'Unauthorized to access this exam builder.');
    }

    /**
     * Get all questions for an exam
     */
    public function getQuestions(Request $request, Exam $exam): JsonResponse
    {
        $this->authorizeExam($request->user(), $exam);

        $questions = $exam->questions()->orderBy('order')->get();

        return response()->json([
            'exam' => $exam->load('course:id,title,slug'),
            'questions' => $questions,
        ]);
    }

    /**
     * Store new Question
     */
    public function storeQuestion(Request $request, Exam $exam): JsonResponse
    {
        $this->authorizeExam($request->user(), $exam);

        $validated = $request->validate([
            'question_text' => ['required', 'string'],
            'question_type' => ['required', 'in:single_choice,multiple_choice,written_paper,fill_in_the_blank'],
            'marks' => ['required', 'numeric', 'min:0.1'],
            'negative_marks' => ['nullable', 'numeric', 'min:0'],
            'attachment_url' => ['nullable', 'string'],
            'explanation' => ['nullable', 'string'],
            'order' => ['nullable', 'integer'],
            'options' => ['nullable', 'array'],
            'options.*.id' => ['required_with:options', 'string'],
            'options.*.text' => ['required_with:options', 'string'],
            'correct_answers' => ['nullable', 'array'],
        ]);

        // Default order
        if (!isset($validated['order'])) {
            $validated['order'] = $exam->questions()->max('order') + 1;
        }

        $question = $exam->questions()->create($validated);

        // Recalculate total exam marks
        $exam->recalculateTotalMarks();

        return response()->json([
            'message' => 'Question added successfully!',
            'data' => $question,
            'exam_total_marks' => $exam->fresh()->total_marks,
        ], 201);
    }

    /**
     * Update existing Question
     */
    public function updateQuestion(Request $request, Exam $exam, ExamQuestion $question): JsonResponse
    {
        $this->authorizeExam($request->user(), $exam);

        if ($question->exam_id !== $exam->id) {
            abort(404, 'Question does not belong to this exam.');
        }

        $validated = $request->validate([
            'question_text' => ['required', 'string'],
            'question_type' => ['required', 'in:single_choice,multiple_choice,written_paper,fill_in_the_blank'],
            'marks' => ['required', 'numeric', 'min:0.1'],
            'negative_marks' => ['nullable', 'numeric', 'min:0'],
            'attachment_url' => ['nullable', 'string'],
            'explanation' => ['nullable', 'string'],
            'order' => ['nullable', 'integer'],
            'options' => ['nullable', 'array'],
            'options.*.id' => ['required_with:options', 'string'],
            'options.*.text' => ['required_with:options', 'string'],
            'correct_answers' => ['nullable', 'array'],
        ]);

        $question->update($validated);
        $exam->recalculateTotalMarks();

        return response()->json([
            'message' => 'Question updated successfully!',
            'data' => $question,
            'exam_total_marks' => $exam->fresh()->total_marks,
        ]);
    }

    /**
     * Delete Question
     */
    public function deleteQuestion(Request $request, Exam $exam, ExamQuestion $question): JsonResponse
    {
        $this->authorizeExam($request->user(), $exam);

        if ($question->exam_id !== $exam->id) {
            abort(404, 'Question does not belong to this exam.');
        }

        $question->delete();
        $exam->recalculateTotalMarks();

        return response()->json([
            'message' => 'Question deleted successfully.',
            'exam_total_marks' => $exam->fresh()->total_marks,
        ]);
    }

    /**
     * Reorder Questions
     */
    public function reorderQuestions(Request $request, Exam $exam): JsonResponse
    {
        $this->authorizeExam($request->user(), $exam);

        $request->validate([
            'question_ids' => ['required', 'array'],
            'question_ids.*' => ['integer', 'exists:exam_questions,id'],
        ]);

        foreach ($request->question_ids as $index => $id) {
            $exam->questions()->where('id', $id)->update(['order' => $index + 1]);
        }

        return response()->json(['message' => 'Questions reordered successfully.']);
    }

    /**
     * Upload Question Attachment (Image/Diagram/PDF)
     */
    public function uploadAttachment(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:20480', 'mimes:jpg,jpeg,png,webp,gif,pdf'],
        ]);

        $file = $request->file('file');
        $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('exam_attachments', $fileName, 'public');

        return response()->json([
            'url' => Storage::url($path),
            'file_name' => $file->getClientOriginalName(),
        ]);
    }

    /**
     * Download CSV Template for Question Import
     */
    public function downloadCsvTemplate(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="exam_questions_template.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM so Excel opens Bengali / Unicode characters properly
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // CSV Header
            fputcsv($handle, [
                'question_text',
                'question_type',
                'mark',
                'negative_mark',
                'option_a',
                'option_b',
                'option_c',
                'option_d',
                'option_e',
                'correct_answer',
                'explanation'
            ]);

            // Sample Row 1: Single Choice MCQ
            fputcsv($handle, [
                'বাংলাদেশের রাজধানী কোথায়?',
                'single_choice',
                '1',
                '0.25',
                'ঢাকা',
                'চট্টগ্রাম',
                'খুলনা',
                'রাজশাহী',
                '',
                'A',
                'বাংলাদেশের রাজধানী ও প্রধান প্রশাসনিক কেন্দ্র হলো ঢাকা।'
            ]);

            // Sample Row 2: Multiple Choice MCQ
            fputcsv($handle, [
                'নিচের কোনগুলো মৌলিক সংখ্যা (Prime Number)?',
                'multiple_choice',
                '2',
                '0.5',
                '2',
                '3',
                '4',
                '6',
                '',
                'A,B',
                '২ এবং ৩ হলো মৌলিক সংখ্যা।'
            ]);

            // Sample Row 3: Written Question
            fputcsv($handle, [
                'আলোর প্রতিসরণ কাকে বলে? চিত্রসহ ব্যাখ্যা করো।',
                'written_paper',
                '5',
                '0',
                '',
                '',
                '',
                '',
                '',
                '',
                'আলো এক স্বচ্ছ মাধ্যম থেকে অন্য স্বচ্ছ মাধ্যমে প্রবেশের সময় দিক পরিবর্তনকে আলোর প্রতিসরণ বলে।'
            ]);

            // Sample Row 4: Fill in the blank
            fputcsv($handle, [
                'সূর্য একটি _____।',
                'fill_in_the_blank',
                '1',
                '0',
                '',
                '',
                '',
                '',
                '',
                'নক্ষত্র',
                'সূর্য একটি মাঝারি আকারের উজ্জ্বল নক্ষত্র।'
            ]);

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Import questions from CSV file
     */
    public function importCsv(Request $request, Exam $exam): JsonResponse
    {
        $this->authorizeExam($request->user(), $exam);

        $request->validate([
            'file' => ['required', 'file', 'max:10240'], // 10MB
        ]);

        $file = $request->file('file');
        $realPath = $file->getRealPath();

        if (!file_exists($realPath) || !is_readable($realPath)) {
            return response()->json(['message' => 'ফাইলটি পড়তে সমস্যা হয়েছে। আবার চেষ্টা করুন।'], 422);
        }

        $handle = fopen($realPath, 'r');
        if (!$handle) {
            return response()->json(['message' => 'CSV ফাইলটি ওপেন করা সম্ভব হয়নি।'], 422);
        }

        // Read header
        $header = fgetcsv($handle);
        if (!$header || empty($header)) {
            fclose($handle);
            return response()->json(['message' => 'CSV ফাইলটি খালি অথবা হেডার সঠিক নয়।'], 422);
        }

        // Strip UTF-8 BOM from the first column if present
        $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);

        // Normalize header keys: lowercase, trim, remove quotes and replace spaces/hyphens with underscore
        $normalizedHeader = [];
        foreach ($header as $colIdx => $colName) {
            $cleaned = strtolower(trim((string) $colName));
            $cleaned = str_replace([' ', '-', '.'], '_', $cleaned);
            $normalizedHeader[$cleaned] = $colIdx;
        }

        // Helper to find column index from aliases
        $findCol = function (array $aliases) use ($normalizedHeader) {
            foreach ($aliases as $alias) {
                if (isset($normalizedHeader[$alias])) {
                    return $normalizedHeader[$alias];
                }
            }
            return null;
        };

        $colQuestionText = $findCol(['question_text', 'question', 'title', 'prompt', 'text', 'প্রশ্ন']);
        $colQuestionType = $findCol(['question_type', 'type', 'q_type', 'ধরণ']);
        $colMark = $findCol(['mark', 'marks', 'point', 'points', 'মান', 'নম্বর']);
        $colNegativeMark = $findCol(['negative_mark', 'negative_marks', 'neg_mark', 'negative', 'নেগেটিভ_মার্ক']);
        $colExplanation = $findCol(['explanation', 'solution', 'note', 'ব্যাখ্যা']);
        $colCorrectAnswer = $findCol(['correct_answer', 'correct_answers', 'correct', 'answer', 'সঠিক_উত্তর', 'উত্তর']);

        $colOptA = $findCol(['option_a', 'opt_a', 'a', 'option_1', 'অপশন_ক', 'ক']);
        $colOptB = $findCol(['option_b', 'opt_b', 'b', 'option_2', 'অপশন_খ', 'খ']);
        $colOptC = $findCol(['option_c', 'opt_c', 'c', 'option_3', 'অপশন_গ', 'গ']);
        $colOptD = $findCol(['option_d', 'opt_d', 'd', 'option_4', 'অপশন_ঘ', 'ঘ']);
        $colOptE = $findCol(['option_e', 'opt_e', 'e', 'option_5', 'অপশন_ঙ', 'ঙ']);

        if ($colQuestionText === null) {
            fclose($handle);
            return response()->json([
                'message' => 'CSV ফাইলে "question_text" কলাম পাওয়া যায়নি। অনুগ্রহ করে টেমপ্লেট ফাইল অনুযায়ী হেডার দিন।'
            ], 422);
        }

        $imported = [];
        $skipped = 0;
        $errors = [];
        $rowNumber = 1;
        $maxOrder = (int) $exam->questions()->max('order');

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;

            // Skip empty rows
            if (empty(array_filter($row, fn($val) => trim((string)$val) !== ''))) {
                continue;
            }

            $qText = isset($row[$colQuestionText]) ? trim((string)$row[$colQuestionText]) : '';
            if ($qText === '') {
                $skipped++;
                $errors[] = "Row {$rowNumber}: Question text empty";
                continue;
            }

            // Options
            $rawOpts = [];
            $optCols = [$colOptA, $colOptB, $colOptC, $colOptD, $colOptE];
            foreach ($optCols as $idx => $optCol) {
                if ($optCol !== null && isset($row[$optCol]) && trim((string)$row[$optCol]) !== '') {
                    $rawOpts[] = [
                        'id' => (string) (count($rawOpts) + 1),
                        'text' => trim((string)$row[$optCol]),
                    ];
                }
            }

            // Question Type
            $qType = 'single_choice';
            if ($colQuestionType !== null && isset($row[$colQuestionType]) && trim((string)$row[$colQuestionType]) !== '') {
                $rawType = strtolower(trim((string)$row[$colQuestionType]));
                if (in_array($rawType, ['single_choice', 'single', 'mcq', 'single_mcq', 'এক_উত্তর'])) {
                    $qType = 'single_choice';
                } elseif (in_array($rawType, ['multiple_choice', 'multiple', 'multi', 'multi_mcq', 'বহু_উত্তর'])) {
                    $qType = 'multiple_choice';
                } elseif (in_array($rawType, ['written_paper', 'written', 'creative', 'রচনামূলক', 'লিখিত'])) {
                    $qType = 'written_paper';
                } elseif (in_array($rawType, ['fill_in_the_blank', 'blank', 'fill_blanks', 'শূণ্যস্থান'])) {
                    $qType = 'fill_in_the_blank';
                }
            } else {
                // Auto detect: if options exist -> single_choice, else written_paper
                $qType = count($rawOpts) > 0 ? 'single_choice' : 'written_paper';
            }

            // Marks
            $mark = 1.0;
            if ($colMark !== null && isset($row[$colMark]) && is_numeric(trim((string)$row[$colMark]))) {
                $mark = max(0.1, (float) trim((string)$row[$colMark]));
            }

            // Negative Mark
            $negativeMark = 0.0;
            if ($colNegativeMark !== null && isset($row[$colNegativeMark]) && is_numeric(trim((string)$row[$colNegativeMark]))) {
                $negativeMark = max(0.0, (float) trim((string)$row[$colNegativeMark]));
            }

            // Explanation
            $explanation = ($colExplanation !== null && isset($row[$colExplanation])) ? trim((string)$row[$colExplanation]) : null;

            // Correct Answers
            $correctAnswers = [];
            $rawCorrect = ($colCorrectAnswer !== null && isset($row[$colCorrectAnswer])) ? trim((string)$row[$colCorrectAnswer]) : '';

            if ($qType === 'written_paper') {
                $correctAnswers = [];
            } elseif ($qType === 'fill_in_the_blank') {
                if ($rawCorrect !== '') {
                    $correctAnswers = [ $rawCorrect ];
                }
            } else {
                // MCQ: map A/B/C/D or 1/2/3/4 or exact text
                if ($rawCorrect !== '') {
                    // Split multiple answers by comma, pipe, slash, or space
                    $parts = preg_split('/[,\|\/]+/', $rawCorrect);
                    foreach ($parts as $p) {
                        $p = trim((string)$p);
                        if ($p === '') continue;

                        $letterUpper = strtoupper($p);
                        if (in_array($letterUpper, ['A', 'B', 'C', 'D', 'E'])) {
                            $mappedId = (string) (ord($letterUpper) - ord('A') + 1);
                            $correctAnswers[] = $mappedId;
                        } elseif (is_numeric($p)) {
                            $correctAnswers[] = (string) (int) $p;
                        } else {
                            // Try matching option text
                            foreach ($rawOpts as $opt) {
                                if (strcasecmp($opt['text'], $p) === 0) {
                                    $correctAnswers[] = $opt['id'];
                                    break;
                                }
                            }
                        }
                    }
                }

                // Default if still empty for single_choice
                if (empty($correctAnswers) && count($rawOpts) > 0) {
                    $correctAnswers = ['1'];
                }
            }

            $maxOrder++;
            $createdQuestion = $exam->questions()->create([
                'question_text' => $qText,
                'question_type' => $qType,
                'marks' => $mark,
                'negative_marks' => $negativeMark,
                'options' => count($rawOpts) > 0 ? $rawOpts : null,
                'correct_answers' => !empty($correctAnswers) ? array_values(array_unique($correctAnswers)) : null,
                'explanation' => $explanation,
                'order' => $maxOrder,
            ]);

            $imported[] = $createdQuestion;
        }

        fclose($handle);

        // Recalculate exam total marks
        $exam->recalculateTotalMarks();

        return response()->json([
            'message' => count($imported) > 0 
                ? "সফলভাবে " . count($imported) . " টি প্রশ্ন ইম্পোর্ট করা হয়েছে!" 
                : "কোনো প্রশ্ন ইম্পোর্ট করা যায়নি। ফাইলটি চেক করুন।",
            'imported_count' => count($imported),
            'skipped_count' => $skipped,
            'errors' => $errors,
            'exam_total_marks' => $exam->fresh()->total_marks,
            'questions' => $exam->questions()->orderBy('order')->get(),
        ]);
    }
}
