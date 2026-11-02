<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'status',
        'layout_type',
        'blocks',
        'custom_css',
        'meta_title',
        'meta_description',
        'is_system',
    ];

    protected $casts = [
        'blocks' => 'array',
        'is_system' => 'boolean',
    ];

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Default home page block template matching current design
     */
    public static function defaultHomeBlocks(): array
    {
        return [
            [
                'id' => 'block_hero_1',
                'type' => 'hero',
                'title' => 'Hero Banner Section',
                'settings' => [
                    'badge' => 'Best Preparation, Best Results Guaranteed',
                    'titlePart1' => 'Achieve Your Dreams with',
                    'titleHighlight' => 'Top Instructors',
                    'titlePart2' => 'Get Prepared Now',
                    'subtitle' => 'Master Physics, Chemistry, and Higher Mathematics through interactive video lectures, comprehensive notes, and structured evaluations.',
                    'browseCoursesBtn' => 'Browse Courses',
                    'browseCoursesLink' => '/courses',
                    'startFreeClassBtn' => 'Start Free Class',
                    'startFreeClassLink' => '/courses',
                    'trust1' => '10,000+ Enrolled Students',
                    'trust2' => 'Lifetime Course Access',
                    'trust3' => 'Dedicated Doubt-Solving Support',
                    'cardBadge' => 'Live Course Dashboard',
                    'physicsTitle' => 'HSC Physics Masterclass',
                    'physicsSub' => 'Lecture 24 • Newtonian Mechanics',
                    'teachersTitle' => 'Expert Instructors',
                    'teachersSub' => 'Top Mentors from BUET & DU',
                    'studyMatTitle' => 'Lecture Notes & Materials',
                    'studyMatSub' => 'Downloadable Premium PDF Sheets',
                    'joinTodayBtn' => 'Join Today',
                ]
            ],
            [
                'id' => 'block_course_tabs_1',
                'type' => 'course_tabs',
                'title' => 'Courses Grid & Tabs',
                'settings' => [
                    'headingTag' => 'Popular Courses',
                    'headingTitle' => 'Our Top Courses',
                    'viewAllText' => 'View All Courses',
                    'viewAllLink' => '/courses',
                    'limit' => 12,
                    'tabs' => [
                        [
                            'id' => 'tab_all',
                            'label' => 'All Courses',
                            'type' => 'category',
                            'categorySlug' => 'all',
                        ],
                    ],
                    'dynamicCategories' => true,
                ]
            ],
            [
                'id' => 'block_features_1',
                'type' => 'features',
                'title' => 'Why Choose Us Section',
                'settings' => [
                    'sectionTag' => 'Why Choose Us',
                    'sectionTitle' => 'Why is Novonex Academy the Best?',
                    'sectionSub' => 'We do not just provide video lessons; we ensure in-depth concept clarity for every student.',
                    'items' => [
                        [
                            'id' => 'feat_1',
                            'icon' => 'Award',
                            'title' => 'Expert Faculty',
                            'desc' => 'Every lecture is prepared under the guidance of top university professors and subject-matter experts.',
                        ],
                        [
                            'id' => 'feat_2',
                            'icon' => 'HelpCircle',
                            'title' => 'Lesson Q&A Support',
                            'desc' => 'Ask questions directly under every lesson. Our instructors resolve all your doubts promptly.',
                        ],
                        [
                            'id' => 'feat_3',
                            'icon' => 'Clock',
                            'title' => 'Mobile-Friendly Learning',
                            'desc' => 'Learn smoothly on any device even on low-cost mobile internet, with downloadable study resources.',
                        ],
                    ]
                ]
            ],
        ];
    }

    /**
     * Default courses page block template
     */
    public static function defaultCoursesBlocks(): array
    {
        $categories = Category::whereNotIn('slug', ['free-courses', 'paid-courses'])->get();

        $tabs = [
            [
                'id' => 'tab_all',
                'label' => 'All Courses',
                'type' => 'category',
                'categorySlug' => 'all',
            ]
        ];

        $selectedSlugs = [];
        foreach ($categories as $cat) {
            $selectedSlugs[] = $cat->slug;
            $tabs[] = [
                'id' => 'tab_' . $cat->slug,
                'label' => $cat->name,
                'type' => 'category',
                'categorySlug' => $cat->slug,
            ];
        }

        return [
            [
                'id' => 'block_hero_courses',
                'type' => 'cta_banner',
                'title' => 'Courses Page Banner',
                'settings' => [
                    'badge' => 'Course Catalog & Subjects',
                    'title' => 'All Courses',
                    'subtitle' => 'Choose the right course to achieve your goals. Comprehensive preparation with experienced mentors.',
                    'bgColor' => 'sky',
                    'buttonText' => '',
                    'buttonLink' => '',
                ]
            ],
            [
                'id' => 'block_course_tabs_courses',
                'type' => 'course_tabs',
                'title' => 'Courses Grid & Category Tabs',
                'settings' => [
                    'headingTag' => 'Courses',
                    'headingTitle' => 'All Courses by Category',
                    'limit' => 12,
                    'showAllTab' => true,
                    'allTabLabel' => 'All Courses',
                    'selectedCategorySlugs' => $selectedSlugs,
                    'tabs' => $tabs,
                    'dynamicCategories' => false,
                ]
            ]
        ];
    }

    /**
     * Default blocks for an individual category page
     */
    public static function defaultCategoryBlocks(Category $category): array
    {
        return [
            [
                'id' => 'block_hero_' . $category->slug,
                'type' => 'cta_banner',
                'title' => $category->name . ' Banner',
                'settings' => [
                    'badge' => 'Subject Courses',
                    'title' => $category->name,
                    'subtitle' => $category->description ?? ('Explore all premium live and recorded courses for ' . $category->name . '.'),
                    'bgColor' => 'indigo',
                    'buttonText' => 'View All Courses',
                    'buttonLink' => '/courses',
                ]
            ],
            [
                'id' => 'block_tabs_' . $category->slug,
                'type' => 'course_tabs',
                'title' => $category->name . ' Courses Grid',
                'settings' => [
                    'headingTag' => 'Course Catalog',
                    'headingTitle' => 'Courses in ' . $category->name,
                    'limit' => 12,
                    'showAllTab' => false,
                    'selectedCategorySlugs' => [$category->slug],
                    'tabs' => [
                        [
                            'id' => 'tab_' . $category->slug,
                            'label' => $category->name,
                            'type' => 'category',
                            'categorySlug' => $category->slug,
                        ]
                    ],
                    'dynamicCategories' => false,
                ]
            ]
        ];
    }

    /**
     * Sync all database categories into individual editable pages in the pages list.
     */
    public static function syncCategoryPages(): array
    {
        $categories = Category::whereNotIn('slug', ['free-courses', 'paid-courses'])->get();
        $synced = [];

        foreach ($categories as $category) {
            $slug = 'category-' . $category->slug;
            $page = static::firstOrCreate(
                ['slug' => $slug],
                [
                    'title' => $category->name,
                    'status' => 'published',
                    'layout_type' => 'category',
                    'is_system' => false,
                    'meta_title' => $category->name . ' - Novonex Academy',
                    'meta_description' => $category->description ?? ($category->name . ' courses and materials.'),
                    'blocks' => static::defaultCategoryBlocks($category),
                ]
            );

            $synced[] = $page;
        }

        // Also ensure system Courses page exists
        static::firstOrCreate(
            ['slug' => 'courses'],
            [
                'title' => 'All Courses',
                'status' => 'published',
                'layout_type' => 'builder',
                'is_system' => true,
                'meta_title' => 'All Courses - Novonex Academy',
                'meta_description' => 'Browse all subject-based preparation courses.',
                'blocks' => static::defaultCoursesBlocks(),
            ]
        );

        return $synced;
    }
}
