<?php

namespace App\Policies;

use App\Models\Lesson;
use App\Models\User;

class LessonPolicy
{
    public function view(?User $user, Lesson $lesson): bool
    {
        if ($lesson->is_preview) {
            return true;
        }

        if (! $user) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTeacher() && $lesson->course->isAssignedTeacher($user->id)) {
            return true;
        }

        return $user->isEnrolledIn($lesson->course_id);
    }

    public function manage(User $user, Lesson $lesson): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isTeacher() && $lesson->course->isAssignedTeacher($user->id);
    }
}
