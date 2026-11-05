<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NexPilotChatMessage extends Model
{
    use HasFactory;

    protected $table = 'nexpilot_chat_messages';

    protected $fillable = [
        'user_id',
        'nexpilot_topic_id',
        'session_id',
        'role',
        'content',
        'prompt_tokens',
        'completion_tokens',
        'usd_cost',
    ];

    protected $casts = [
        'prompt_tokens' => 'integer',
        'completion_tokens' => 'integer',
        'usd_cost' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(NexPilotTopic::class, 'nexpilot_topic_id');
    }
}

