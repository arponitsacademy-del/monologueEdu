<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    /**
     * List media items with pagination, search, and type filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Media::with('user:id,name,email')->latest();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('file_name', 'like', "%{$search}%");
        }

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('file_type', $request->input('type'));
        }

        $perPage = (int) $request->input('per_page', 24);
        $media = $query->paginate($perPage);

        return response()->json($media);
    }

    /**
     * Store a newly uploaded media file.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:51200'], // 50MB max
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType() ?: 'application/octet-stream';
        $fileSize = $file->getSize() ?: 0;

        // Categorize file type
        $imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'bmp', 'ico'];
        $documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip'];
        $videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
        $audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];

        if (str_starts_with($mimeType, 'image/') || in_array($extension, $imageExtensions)) {
            $fileType = 'image';
        } elseif (in_array($extension, $documentExtensions)) {
            $fileType = 'document';
        } elseif (str_starts_with($mimeType, 'video/') || in_array($extension, $videoExtensions)) {
            $fileType = 'video';
        } elseif (str_starts_with($mimeType, 'audio/') || in_array($extension, $audioExtensions)) {
            $fileType = 'audio';
        } else {
            $fileType = 'other';
        }

        // Store in public disk under 'media'
        $path = $file->store('media', 'public');
        $url = asset('storage/' . $path);

        // Also copy directly to public/storage for shared hosting environments where symlink may not exist
        try {
            $destPath = public_path('storage/' . $path);
            $destDir = dirname($destPath);
            if (!file_exists($destDir)) {
                @mkdir($destDir, 0755, true);
            }
            @copy(storage_path('app/public/' . $path), $destPath);
        } catch (\Throwable $e) {
            // ignore if permissions prevent direct copy
        }

        $media = Media::create([
            'user_id' => auth()->id(),
            'file_name' => $originalName,
            'file_path' => $path,
            'file_type' => $fileType,
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'url' => $url,
        ]);

        return response()->json([
            'message' => 'ফাইল সফলভাবে মিডিয়া লাইব্রেরিতে যুক্ত হয়েছে।',
            'media' => $media->load('user:id,name'),
        ], 201);
    }

    /**
     * Delete a media item from storage and database.
     */
    public function destroy(Media $media): JsonResponse
    {
        if (Storage::disk('public')->exists($media->file_path)) {
            Storage::disk('public')->delete($media->file_path);
        }

        try {
            $pubFile = public_path('storage/' . $media->file_path);
            if (file_exists($pubFile)) {
                @unlink($pubFile);
            }
        } catch (\Throwable $e) {
            // ignore
        }

        $media->delete();

        return response()->json([
            'message' => 'ফাইলটি মিডিয়া লাইব্রেরি থেকে মুছে ফেলা হয়েছে।',
        ]);
    }
}
