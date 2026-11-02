<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'campaign_id',
        'phone',
        'message',
        'status',
        'type',
        'response_payload',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function campaign()
    {
        return $this->belongsTo(SmsCampaign::class, 'campaign_id');
    }
}
