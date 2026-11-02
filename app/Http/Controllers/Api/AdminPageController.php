<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminPageController extends Controller
{
    /**
     * List all pages with search and status filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Page::query()->orderBy('is_system', 'desc')->orderBy('updated_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $type = $request->input('type');
            if ($type === 'system') {
                $query->where('is_system', true);
            } elseif ($type === 'category') {
                $query->where('layout_type', 'category');
            } elseif ($type === 'custom') {
                $query->where('is_system', false)->where('layout_type', '!=', 'category');
            }
        }

        $pages = $query->get();

        return response()->json([
            'pages' => $pages,
            'stats' => [
                'total' => Page::count(),
                'published' => Page::where('status', 'published')->count(),
                'draft' => Page::where('status', 'draft')->count(),
                'category_pages' => Page::where('layout_type', 'category')->count(),
                'system_pages' => Page::where('is_system', true)->count(),
            ],
        ]);
    }

    /**
     * Create a new page.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:pages,slug'],
            'template' => ['nullable', 'string', 'in:blank,content,home'],
            'status' => ['nullable', 'string', 'in:published,draft'],
        ]);

        $slug = !empty($validated['slug']) 
            ? Str::slug($validated['slug']) 
            : Str::slug($validated['title']);

        // Ensure unique slug
        $originalSlug = $slug;
        $counter = 1;
        while (Page::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $template = $validated['template'] ?? 'blank';
        $blocks = [];

        if ($template === 'home') {
            $blocks = Page::defaultHomeBlocks();
        } elseif ($template === 'content') {
            $blocks = [
                [
                    'id' => 'block_hero_' . uniqid(),
                    'type' => 'cta_banner',
                    'title' => 'Page Banner',
                    'settings' => [
                        'badge' => 'Overview',
                        'title' => $validated['title'],
                        'subtitle' => 'Welcome to ' . $validated['title'],
                        'bgColor' => 'sky',
                        'buttonText' => '',
                        'buttonLink' => '',
                    ]
                ],
                [
                    'id' => 'block_text_' . uniqid(),
                    'type' => 'rich_text',
                    'title' => 'Main Content',
                    'settings' => [
                        'content' => "<p>এখানে আপনার পেজের বিস্তারিত বিষয়বস্তু লিখুন...</p>"
                    ]
                ]
            ];
        }

        $page = Page::create([
            'title' => $validated['title'],
            'slug' => $slug,
            'status' => $validated['status'] ?? 'draft',
            'layout_type' => 'builder',
            'blocks' => $blocks,
            'custom_css' => '',
            'is_system' => false,
        ]);

        AuditLog::log('page_created', 'Page', $page->id, null, ['title' => $page->title, 'slug' => $page->slug]);

        return response()->json([
            'message' => 'নতুন পেজ সফলভাবে তৈরি হয়েছে।',
            'page' => $page,
        ], 201);
    }

    /**
     * Get single page details for builder.
     */
    public function show($id): JsonResponse
    {
        $page = Page::findOrFail($id);

        return response()->json([
            'page' => $page,
        ]);
    }

    /**
     * Update page details and visual builder blocks.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $page = Page::findOrFail($id);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:pages,slug,' . $page->id],
            'status' => ['required', 'string', 'in:published,draft'],
            'blocks' => ['nullable', 'array'],
            'custom_css' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:1000'],
        ]);

        // Prevent slug change for system pages
        if ($page->is_system && in_array($page->slug, ['home', 'courses']) && $validated['slug'] !== $page->slug) {
            return response()->json([
                'message' => 'সিস্টেম পেজের স্লাগ পরিবর্তন করা সম্ভব নয়।',
            ], 422);
        }

        $blocks = $validated['blocks'] ?? $page->blocks ?? [];

        // If selected_categories is sent from Page Edit modal
        if ($request->has('selected_categories')) {
            $selectedSlugs = $request->input('selected_categories');
            if (is_array($selectedSlugs)) {
                $categories = \App\Models\Category::whereIn('slug', $selectedSlugs)->get();
                $foundTabBlock = false;

                foreach ($blocks as &$block) {
                    if (($block['type'] ?? '') === 'course_tabs') {
                        $foundTabBlock = true;
                        $block['settings']['selectedCategorySlugs'] = $selectedSlugs;
                        $newTabs = [];
                        if (!isset($block['settings']['showAllTab']) || $block['settings']['showAllTab']) {
                            $newTabs[] = [
                                'id' => 'tab_all',
                                'label' => $block['settings']['allTabLabel'] ?? 'সকল কোর্স',
                                'type' => 'category',
                                'categorySlug' => 'all',
                            ];
                        }
                        foreach ($categories as $cat) {
                            $newTabs[] = [
                                'id' => 'tab_' . $cat->slug,
                                'label' => $cat->name,
                                'type' => 'category',
                                'categorySlug' => $cat->slug,
                            ];
                        }
                        $block['settings']['tabs'] = $newTabs;
                    }
                }

                if (!$foundTabBlock && ($page->slug === 'courses' || $page->layout_type === 'category')) {
                    $blocks = Page::defaultCoursesBlocks();
                    foreach ($blocks as &$b) {
                        if ($b['type'] === 'course_tabs') {
                            $b['settings']['selectedCategorySlugs'] = $selectedSlugs;
                            $newTabs = [
                                [
                                    'id' => 'tab_all',
                                    'label' => 'সকল কোর্স',
                                    'type' => 'category',
                                    'categorySlug' => 'all',
                                ]
                            ];
                            foreach ($categories as $cat) {
                                $newTabs[] = [
                                    'id' => 'tab_' . $cat->slug,
                                    'label' => $cat->name,
                                    'type' => 'category',
                                    'categorySlug' => $cat->slug,
                                ];
                            }
                            $b['settings']['tabs'] = $newTabs;
                        }
                    }
                }
            }
        }

        $oldData = $page->only(['title', 'slug', 'status']);
        $page->update([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['slug']),
            'status' => $validated['status'],
            'blocks' => $blocks,
            'custom_css' => $validated['custom_css'] ?? null,
            'meta_title' => $validated['meta_title'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
        ]);

        AuditLog::log('page_updated', 'Page', $page->id, $oldData, $page->only(['title', 'slug', 'status']));

        return response()->json([
            'message' => 'পেজের পরিবর্তন ও ডিজাইন সফলভাবে সংরক্ষণ করা হয়েছে।',
            'page' => $page,
        ]);
    }

    /**
     * Delete a page (system pages cannot be deleted).
     */
    public function destroy($id): JsonResponse
    {
        $page = Page::findOrFail($id);

        if ($page->is_system) {
            return response()->json([
                'message' => 'সিস্টেম পেজ ডিলিট করা যাবে না। আপনি চাইলে ড্রাফট করে রাখতে পারেন বা এর ডিজাইন পরিবর্তন করতে পারেন।',
            ], 403);
        }

        $title = $page->title;
        $page->delete();

        AuditLog::log('page_deleted', 'Page', $id, ['title' => $title], null);

        return response()->json([
            'message' => "'{$title}' পেজটি সফলভাবে ডিলিট করা হয়েছে।",
        ]);
    }

    /**
     * Fast toggle between published and draft.
     */
    public function toggleStatus($id): JsonResponse
    {
        $page = Page::findOrFail($id);
        $newStatus = $page->status === 'published' ? 'draft' : 'published';
        $page->update(['status' => $newStatus]);

        AuditLog::log('page_status_toggled', 'Page', $page->id, null, ['status' => $newStatus]);

        return response()->json([
            'message' => 'পেজের স্ট্যাটাস আপডেট করা হয়েছে।',
            'page' => $page,
        ]);
    }

    /**
     * Duplicate a page and its builder blocks.
     */
    public function duplicate($id): JsonResponse
    {
        $page = Page::findOrFail($id);

        $newSlug = $page->slug . '-copy-' . time();
        $newPage = Page::create([
            'title' => $page->title . ' (Copy)',
            'slug' => $newSlug,
            'status' => 'draft',
            'layout_type' => $page->layout_type,
            'blocks' => $page->blocks,
            'custom_css' => $page->custom_css,
            'meta_title' => $page->meta_title,
            'meta_description' => $page->meta_description,
            'is_system' => false,
        ]);

        AuditLog::log('page_duplicated', 'Page', $newPage->id, ['original_id' => $id], null);

        return response()->json([
            'message' => 'পেজ সফলভাবে ক্লোন করা হয়েছে।',
            'page' => $newPage,
        ]);
    }

    /**
     * Sync database categories and system pages.
     */
    public function syncCategories(): JsonResponse
    {
        $synced = Page::syncCategoryPages();

        return response()->json([
            'message' => 'সকল কোর্স ও ক্যাটাগরি পেজ সফলভাবে সিঙ্ক করা হয়েছে।',
            'count' => count($synced),
        ]);
    }
}
