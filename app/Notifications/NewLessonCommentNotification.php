<?php

namespace App\Notifications;

use App\Models\LessonComment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewLessonCommentNotification extends Notification
{
    use Queueable;

    public function __construct(public LessonComment $comment)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $lesson = $this->comment->lesson;
        $course = $lesson->course;
        $student = $this->comment->user;

        return [
            'type' => 'lesson_comment',
            'title' => 'নতুন প্রশ্ন/মন্তব্য',
            'message' => "{$student->name} {$course->title} কোর্সের '{$lesson->title}' ক্লাসে একটি প্রশ্ন করেছেন।",
            'comment_id' => $this->comment->id,
            'lesson_id' => $lesson->id,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'user_name' => $student->name,
            'link' => "/learning/{$course->id}/lessons/{$lesson->id}",
        ];
    }
}
