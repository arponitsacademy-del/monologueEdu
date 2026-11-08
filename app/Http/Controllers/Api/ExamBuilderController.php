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
}
