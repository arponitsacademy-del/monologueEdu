<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\User;

class CoursePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(?User $user, Course $course): bool
    {
        if ($course->status === Course::STATUS_PUBLISHED) {
            return true;
        }

        if (! $user) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return $user->isTeacher() && $course->isAssignedTeacher($user->id);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Course $course): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isTeacher() && $course->isAssignedTeacher($user->id);
    }

    public function delete(User $user, Course $course): bool
    {
        return $user->isAdmin();
    }

    public function publish(User $user, Course $course): bool
    {
        return $user->isAdmin();
    }

    public function manageContent(User $user, Course $course): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isTeacher() && $course->isAssignedTeacher($user->id);
    }
}
