<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PublicPageController extends Controller
{
    /**
     * Get published page by slug for frontend rendering.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->first();

        // Special fallback for Home page if missing or not created
        if (!$page && $slug === 'home') {
            return response()->json([
                'page' => [
                    'id' => 0,
                    'title' => 'Home Page',
                    'slug' => 'home',
                    'status' => 'published',
                    'layout_type' => 'builder',
                    'blocks' => Page::defaultHomeBlocks(),
                    'custom_css' => '',
                    'is_system' => true,
                ],
            ]);
        }

        // Special fallback for Courses page if missing or not created
        if (!$page && $slug === 'courses') {
            return response()->json([
                'page' => [
                    'id' => 0,
                    'title' => 'সকল কোর্সসমূহ',
                    'slug' => 'courses',
                    'status' => 'published',
                    'layout_type' => 'builder',
                    'blocks' => Page::defaultCoursesBlocks(),
                    'custom_css' => '',
                    'is_system' => true,
                ],
            ]);
        }

        // If not found, try finding by category- prefix or vice-versa
        if (!$page && str_starts_with($slug, 'category-')) {
            $catSlug = substr($slug, 9);
            $cat = \App\Models\Category::where('slug', $catSlug)->first();
            if ($cat) {
                $page = Page::firstOrCreate(
                    ['slug' => $slug],
                    [
                        'title' => $cat->name,
                        'status' => 'published',
                        'layout_type' => 'category',
                        'is_system' => false,
                        'meta_title' => $cat->name . ' - Novonex Academy',
                        'meta_description' => $cat->description ?? ($cat->name . ' বিষয়ের সকল কোর্স।'),
                        'blocks' => Page::defaultCategoryBlocks($cat),
                    ]
                );
            }
        }

        if (!$page) {
            return response()->json([
                'message' => 'পেজটি খুঁজে পাওয়া যায়নি।',
            ], 404);
        }

        // If draft, only allow if user is an admin
        if ($page->status === 'draft') {
            $user = $request->user('sanctum');
            if (!$user || $user->role !== User::ROLE_ADMIN) {
                return response()->json([
                    'message' => 'এই পেজটি বর্তমানে ড্রাফট বা অপ্রকাশিত অবস্থায় রয়েছে।',
                ], 404);
            }
        }

        return response()->json([
            'page' => $page,
        ]);
    }
}
