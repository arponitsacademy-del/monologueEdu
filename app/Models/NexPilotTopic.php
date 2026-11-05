<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NexPilotTopic extends Model
{
    use HasFactory;

    protected $table = 'nexpilot_topics';

    protected $fillable = [
        'nexpilot_id',
        'type',
        'title',
        'description',
        'prompt',
        'materials_text',
        'attachments',
        'order_index',
        'is_active',
    ];

    protected $casts = [
        'attachments' => 'array',
        'order_index' => 'integer',
        'is_active' => 'boolean',
    ];

    public function pilot(): BelongsTo
    {
        return $this->belongsTo(NexPilot::class, 'nexpilot_id');
    }

    public function chatMessages(): HasMany
    {
        return $this->hasMany(NexPilotChatMessage::class, 'nexpilot_topic_id')->oldest();
    }
}

