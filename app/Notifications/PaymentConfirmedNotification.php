<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentConfirmedNotification extends Notification
{
    use Queueable;

    public function __construct(public Order $order)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $course = $this->order->course;

        return [
            'type' => 'payment_confirmed',
            'title' => 'পেমেন্ট সফল ও এনরোলমেন্ট নিশ্চিত',
            'message' => "আপনার {$course->title} কোর্সের পেমেন্ট অনুমোদিত হয়েছে। এখন ক্লাস শুরু করতে পারেন!",
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'link' => "/student/my-courses",
        ];
    }
}
