<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NexPilot extends Model
{
    use HasFactory;

    protected $table = 'nexpilots';

    protected $fillable = [
        'course_id',
        'title',
        'price',
        'short_description',
        'long_description',
        'max_usd_limit',
        'openai_model',
        'openai_api_key',
        'system_prompt',
        'is_active',
    ];

    protected $casts = [
        'price' => 'float',
        'max_usd_limit' => 'float',
        'is_active' => 'boolean',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function topics(): HasMany
    {
        return $this->hasMany(NexPilotTopic::class, 'nexpilot_id')->orderBy('order_index');
    }

    public function theoryTopics(): HasMany
    {
        return $this->topics()->where('type', 'theory');
    }

    public function practiceTopics(): HasMany
    {
        return $this->topics()->where('type', 'practice');
    }

    public function studentUsages(): HasMany
    {
        return $this->hasMany(NexPilotStudentUsage::class, 'nexpilot_id');
    }

    /**
     * Resolve effective OpenAI API Key (Pilot override or Global Website Setting or ENV)
     */
    public function getEffectiveApiKey(): ?string
    {
        if (!empty($this->openai_api_key)) {
            return trim($this->openai_api_key);
        }

        $setting = WebsiteSetting::current();
        $globalKey = $setting->openai_settings['api_key'] ?? null;
        if (!empty($globalKey)) {
            return trim($globalKey);
        }

        return env('OPENAI_API_KEY');
    }

    /**
     * Resolve effective OpenAI Model
     */
    public function getEffectiveModel(): string
    {
        if (!empty($this->openai_model)) {
            return $this->openai_model;
        }

        $setting = WebsiteSetting::current();
        return $setting->openai_settings['default_model'] ?? 'gpt-4o-mini';
    }
}

