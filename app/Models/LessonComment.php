<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LessonComment extends Model
{
    protected $fillable = [
        'lesson_id',
        'user_id',
        'parent_id',
        'content',
    ];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(LessonComment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(LessonComment::class, 'parent_id')->with('user')->oldest();
    }
}
