<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCategoryController extends Controller
{
    /**
     * List all categories with associated courses count.
     */
    public function index(): JsonResponse
    {
        $categories = Category::withCount('courses')
            ->latest('id')
            ->get();

        return response()->json($categories);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $baseSlug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['name']);
        if (empty($baseSlug)) {
            $baseSlug = 'cat-' . time();
        }

        $slug = $baseSlug;
        $counter = 1;
        while (Category::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
        ]);

        AuditLog::log('category_created', 'Category', $category->id, null, $category->toArray());

        // Automatically create editable category page in page list
        if (!in_array($category->slug, ['free-courses', 'paid-courses'])) {
            Page::firstOrCreate(
                ['slug' => 'category-' . $category->slug],
                [
                    'title' => $category->name,
                    'status' => 'published',
                    'layout_type' => 'category',
                    'is_system' => false,
                    'meta_title' => $category->name . ' - Novonex Academy',
                    'meta_description' => $category->description ?? ($category->name . ' বিষয়ের সকল কোর্স।'),
                    'blocks' => Page::defaultCategoryBlocks($category),
                ]
            );
        }

        $category->courses_count = 0;

        return response()->json([
            'message' => 'ক্যাটাগরি সফলভাবে তৈরি হয়েছে।',
            'category' => $category,
        ], 201);
    }

    /**
     * Update an existing category.
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $oldValues = $category->toArray();

        $slug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : $category->slug;
        if ($slug !== $category->slug) {
            $baseSlug = $slug;
            $counter = 1;
            while (Category::where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
        }

        $oldCatSlug = $category->slug;

        $category->update([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
        ]);

        // Sync with corresponding page
        $catPage = Page::where('slug', 'category-' . $oldCatSlug)->orWhere('slug', 'category-' . $slug)->first();
        if ($catPage) {
            $catPage->update([
                'title' => $category->name,
                'slug' => 'category-' . $slug,
                'meta_title' => $category->name . ' - Novonex Academy',
            ]);
        }

        AuditLog::log('category_updated', 'Category', $category->id, $oldValues, $category->toArray());

        return response()->json([
            'message' => 'ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে।',
            'category' => $category->loadCount('courses'),
        ]);
    }

    /**
     * Delete a category and detach its associations.
     */
    public function destroy(Category $category): JsonResponse
    {
        $oldValues = $category->toArray();

        // Detach all courses associated with this category
        $category->courses()->detach();
        $slug = $category->slug;
        $category->delete();

        // Remove category page from page list if not modified as system
        Page::where('slug', 'category-' . $slug)->where('is_system', false)->delete();

        AuditLog::log('category_deleted', 'Category', $category->id, $oldValues, null);

        return response()->json([
            'message' => 'ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে।',
        ]);
    }
}
