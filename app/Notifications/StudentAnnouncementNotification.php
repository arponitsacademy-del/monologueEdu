<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StudentAnnouncementNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $message,
        public ?string $link = null,
        public ?string $senderName = null,
        public ?string $targetType = null, // 'course' | 'bundle' | 'all'
        public ?string $targetTitle = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'announcement',
            'title' => $this->title,
            'message' => $this->message,
            'link' => $this->link ?: '/student',
            'sender_name' => $this->senderName,
            'target_type' => $this->targetType,
            'target_title' => $this->targetTitle,
            'created_at' => now()->toIso8601String(),
        ];
    }
}

