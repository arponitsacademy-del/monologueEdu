<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LessonAttachmentController extends Controller
{
    public function upload(Request $request, Lesson $lesson): JsonResponse
    {
        $user = auth()->user();
        if (! $user->isAdmin() && ! $lesson->course->isAssignedTeacher($user->id)) {
            abort(403, 'এই লেসনে ম্যাটেরিয়াল আপলোডের অনুমতি নেই।');
        }

        $request->validate([
            'file' => ['required', 'file', 'max:51200'], // 50MB max
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        $fileSize = $file->getSize();

        // Store in private storage directory
        $path = $file->store('private/attachments');

        $attachment = $lesson->attachments()->create([
            'file_name' => $originalName,
            'file_type' => $extension,
            'file_size' => $fileSize,
            'file_path' => $path,
            'is_private' => true,
        ]);

        return response()->json([
            'message' => 'ফাইল সফলভাবে আপলোড হয়েছে।',
            'attachment' => $attachment,
        ], 201);
    }

    public function delete(LessonAttachment $attachment): JsonResponse
    {
        $user = auth()->user();
        $course = $attachment->lesson->course;
        if (! $user->isAdmin() && ! $course->isAssignedTeacher($user->id)) {
            abort(403, 'এই ম্যাটেরিয়াল মুছে ফেলার অনুমতি নেই।');
        }

        if (Storage::exists($attachment->file_path)) {
            Storage::delete($attachment->file_path);
        }

        $attachment->delete();

        return response()->json([
            'message' => 'ফাইল মুছে ফেলা হয়েছে।',
        ]);
    }

    public function download(LessonAttachment $attachment): StreamedResponse|BinaryFileResponse
    {
        $user = auth()->user();
        $lesson = $attachment->lesson;
        $course = $lesson->course;

        // Verify authorization
        $canAccess = false;
        if ($user->isAdmin()) {
            $canAccess = true;
        } elseif ($user->isTeacher() && $course->isAssignedTeacher($user->id)) {
            $canAccess = true;
        } elseif ($lesson->is_preview) {
            $canAccess = true;
        } elseif ($user->isEnrolledIn($course->id)) {
            $canAccess = true;
        }

        if (! $canAccess) {
            abort(403, 'এই স্টাডি ম্যাটেরিয়াল ডাউনলোড করার জন্য আপনাকে কোর্সে এনরোল থাকতে হবে।');
        }

        if (! Storage::exists($attachment->file_path)) {
            abort(404, 'ফাইলটি স্টোরেজে খুঁজে পাওয়া যায়নি।');
        }

        return Storage::download($attachment->file_path, $attachment->file_name);
    }
}
