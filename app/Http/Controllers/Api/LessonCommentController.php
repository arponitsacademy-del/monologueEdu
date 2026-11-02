<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonComment;
use App\Notifications\CommentReplyNotification;
use App\Notifications\NewLessonCommentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonCommentController extends Controller
{
    public function index(Lesson $lesson): JsonResponse
    {
        $comments = $lesson->comments()
            ->with(['user:id,name,role', 'replies.user:id,name,role'])
            ->latest()
            ->get();

        return response()->json($comments);
    }

    public function store(Request $request, Lesson $lesson): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
        ]);

        $user = auth()->user();

        $comment = $lesson->allComments()->create([
            'user_id' => $user->id,
            'content' => $validated['content'],
            'parent_id' => null,
        ]);

        // Notify assigned teachers of this course
        $course = $lesson->course;
        $teachers = $course->instructors()->get();

        // Also notify legacy instructor if exists and not duplicate
        if ($course->instructor && ! $teachers->contains('id', $course->instructor->id)) {
            $teachers->push($course->instructor);
        }

        foreach ($teachers as $teacher) {
            if ($teacher->id !== $user->id) {
                $teacher->notify(new NewLessonCommentNotification($comment));
            }
        }

        return response()->json([
            'message' => 'আপনার প্রশ্ন/মন্তব্য প্রকাশিত হয়েছে।',
            'comment' => $comment->load('user:id,name,role', 'replies'),
        ], 201);
    }

    public function reply(Request $request, LessonComment $comment): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
        ]);

        $user = auth()->user();

        // Determine parent id (prevent nesting deeper than 1 level)
        $parentId = $comment->parent_id ?? $comment->id;

        $reply = LessonComment::create([
            'lesson_id' => $comment->lesson_id,
            'user_id' => $user->id,
            'parent_id' => $parentId,
            'content' => $validated['content'],
        ]);

        // If replied to someone else's comment, send notification
        $parentComment = LessonComment::find($parentId);
        if ($parentComment && $parentComment->user_id !== $user->id) {
            $parentComment->user->notify(new CommentReplyNotification($reply));
        }

        return response()->json([
            'message' => 'উত্তর সফলভাবে যোগ করা হয়েছে।',
            'reply' => $reply->load('user:id,name,role'),
        ], 201);
    }
}
