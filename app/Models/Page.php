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
                'id' => 'block_ribbon_1',
                'type' => 'top_announcement',
                'title' => 'Top Campaign Ribbon',
                'settings' => [
                    'badge' => 'স্পেশাল অফার',
                    'text' => 'HSC একাডেমিক সাইকেল ও অ্যাডমিশন মাস্টার ব্যাচে স্পেশাল ছাড়ে ভর্তি চলছে!',
                    'linkText' => 'সকল কোর্স দেখুন →',
                    'linkUrl' => '/courses',
                    'bgColor' => 'from-sky-700 via-sky-600 to-amber-500',
                ]
            ],
            [
                'id' => 'block_hero_1',
                'type' => 'hero',
                'title' => 'Hero Banner Section',
                'settings' => [
                    'badge' => 'বাংলাদেশের আধুনিকতম অনলাইন লার্নিং প্ল্যাটফর্ম',
                    'titlePart1' => 'স্বপ্ন যেখানে বাস্তব হয়,',
                    'titleHighlight' => 'কনসেপ্ট ক্লিয়ারিং থেকে',
                    'titlePart2' => 'অ্যাডমিশন জয়!',
                    'subtitle' => 'অভিজ্ঞ মেন্টরদের লাইভ ও ফুল HD রেকর্ডেড ক্লাস, অধ্যায়ভিত্তিক লেকচার শিট, 24/7 NexPilot AI ডাউট সলভিং এবং রিয়েল টাইম মডেল টেস্টের মাধ্যমে প্রস্তুতি নাও ১০০% আত্মবিশ্বাসে।',
                    'browseCoursesBtn' => 'কোর্সগুলো ঘুরে দেখুন',
                    'browseCoursesLink' => '/courses',
                    'startFreeClassBtn' => 'অনলাইন এক্সাম দিন',
                    'startFreeClassLink' => '/student/exams',
                    'trust1' => '৫০,০০০+ সক্রিয় শিক্ষার্থী',
                    'trust2' => '১০০+ ফ্ল্যাগশিপ কোর্স',
                    'trust3' => '২৪/৭ এআই ডাউট সলভার',
                    'cardBadge' => 'Live Academy Status',
                    'physicsTitle' => 'HSC পদার্থবিজ্ঞান ১ম ও ২য় পত্র',
                    'physicsSub' => 'চ্যাপ্টারভিত্তিক সম্পূর্ণ গাণিতিক বিশ্লেষণ',
                    'teachersTitle' => 'বুয়েট ও ঢাবির শীর্ষ শিক্ষক',
                    'teachersSub' => 'সরাসরি অভিজ্ঞ মেন্টরশিপ',
                    'studyMatTitle' => 'প্রিমিয়াম হ্যান্ডনোট ও প্রশ্নব্যাংক',
                    'studyMatSub' => 'ডাউনলোডযোগ্য প্রিন্টেবল শিট',
                    'joinTodayBtn' => 'আজই যুক্ত হন',
                ]
            ],
            [
                'id' => 'block_features_1',
                'type' => 'features',
                'title' => 'Why Choose Us Section',
                'settings' => [
                    'sectionTag' => 'আমাদের বিশেষত্ব',
                    'sectionTitle' => 'কেন মনোলগ এডু শিক্ষার্থীদের প্রথম পছন্দ?',
                    'sectionSub' => 'শুধু মুখস্থ বিদ্যা নয়, প্রতিটি টপিকের গভীর কনসেপ্ট এবং বাস্তবসম্মত ট্রিকস শিখিয়ে আমরা শিক্ষার্থীদের শীর্ষে পৌঁছে দিই।',
                    'items' => [
                        [
                            'id' => 'feat_1',
                            'icon' => 'Award',
                            'title' => 'শীর্ষ বিশ্ববিদ্যালয়ের শিক্ষক',
                            'desc' => 'বুয়েট, ঢাকা বিশ্ববিদ্যালয় ও বিভিন্ন মেডিকেল কলেজের অভিজ্ঞ শিক্ষকদের সরাসরি তত্ত্বাবধানে ক্লাস।'
                        ],
                        [
                            'id' => 'feat_2',
                            'icon' => 'Zap',
                            'title' => 'NexPilot AI ডাউট সলভার',
                            'desc' => 'যেকোনো প্রশ্নের ছবি তুলে পাঠাও বা টাইপ করো, সেকেন্ডের মধ্যে সম্পূর্ণ নির্ভুল সমাধান।'
                        ],
                        [
                            'id' => 'feat_3',
                            'icon' => 'HelpCircle',
                            'title' => 'অধ্যায়ভিত্তিক ডাউট বক্স',
                            'desc' => 'প্রতিটি ভিডিও লেকচারের নিচে প্রশ্ন করার সুযোগ, মেন্টররা সরাসরি উত্তর দিয়ে থাকেন।'
                        ],
                        [
                            'id' => 'feat_4',
                            'icon' => 'ShieldCheck',
                            'title' => 'রিয়েলটাইম মেরিট পজিশন',
                            'desc' => 'নেগেটিভ মার্কিংসহ বোর্ড স্ট্যান্ডার্ড অনলাইন মডেল টেস্ট এবং দেশসেরা শিক্ষার্থীদের সাথে র‍্যাঙ্কিং।'
                        ]
                    ]
                ]
            ],
            [
                'id' => 'block_bundle_1',
                'type' => 'bundle_showcase',
                'title' => 'Course Bundles Section',
                'settings' => [
                    'sectionTag' => 'স্পেশাল প্যাকেজ',
                    'sectionTitle' => 'জনপ্রিয় কোর্স বান্ডেল ও কম্বো',
                    'sectionSub' => 'একাধিক কোর্স একসাথে নিয়ে সেভ করুন সর্বোচ্চ ৫০% পর্যন্ত!',
                    'limit' => 4,
                ]
            ],
            [
                'id' => 'block_course_tabs_1',
                'type' => 'course_tabs',
                'title' => 'Courses Grid & Tabs',
                'settings' => [
                    'headingTag' => 'জনপ্রিয় কোর্সসমূহ',
                    'headingTitle' => 'আমাদের ফ্ল্যাগশিপ একাডেমিক ও অ্যাডমিশন কোর্স',
                    'viewAllText' => 'সকল কোর্স দেখুন',
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
                'id' => 'block_stats_1',
                'type' => 'stats_counter',
                'title' => 'Stats & Counter',
                'settings' => [
                    'stats' => [
                        ['label' => 'সক্রিয় শিক্ষার্থী', 'value' => '৫০,০০০+'],
                        ['label' => 'প্রিমিয়াম কোর্স', 'value' => '১০০+'],
                        ['label' => 'এইচডি ভিডিও ক্লাস', 'value' => '৫,০০০+'],
                        ['label' => 'সাফল্যের হার', 'value' => '৯৮%'],
                    ]
                ]
            ],
            [
                'id' => 'block_teachers_1',
                'type' => 'teachers_showcase',
                'title' => 'Faculty & Mentors Section',
                'settings' => [
                    'sectionTag' => 'মেন্টর প্যানেল',
                    'sectionTitle' => 'দেশসেরা শিক্ষকদের সাথে তোমার প্রস্তুতি',
                    'sectionSub' => 'বছরজুড়ে যাদের সঠিক দিকনির্দেশনা হাজারো শিক্ষার্থীকে পৌঁছাতে সাহায্য করেছে তাদের স্বপ্নের ক্যাম্পাসে।',
                    'limit' => 8,
                ]
            ],
            [
                'id' => 'block_learning_path_1',
                'type' => 'learning_path',
                'title' => 'Learning Methodology Section',
                'settings' => [
                    'sectionTag' => 'লার্নিং মেথডোলজি',
                    'sectionTitle' => '৪ ধাপে শতভাগ প্রস্তুতি নিশ্চিত করার বৈজ্ঞানিক পদ্ধতি',
                    'sectionSub' => 'পরিকল্পিত উপায়ে কনসেপ্ট ক্লিয়ারিং থেকে পরীক্ষা জয়ের সম্পূর্ণ পথপ্রদর্শক।',
                    'steps' => [
                        ['id' => 'step_1', 'num' => '০১', 'title' => 'বেসিক ও কনসেপ্ট ক্লিয়ারিং', 'desc' => 'প্রতিটি থিওরি অ্যানিমেশন ও বাস্তব উদাহরণের সাহায্যে সুস্পষ্টভাবে ব্যাখ্যা।'],
                        ['id' => 'step_2', 'num' => '০২', 'title' => 'টপিকভিত্তিক গাণিতিক প্র্যাকটিস', 'desc' => 'বোর্ড ও শীর্ষ কলেজগুলোর বিগত বছরের প্রশ্নগুলোর পূর্ণাঙ্গ সমাধান।'],
                        ['id' => 'step_3', 'num' => '০৩', 'title' => '২৪/৭ AI ডাউট সলভিং', 'desc' => 'পড়ালেখার যেকোনো সময় আটকে গেলে তাৎক্ষণিক সমাধানের নিশ্চয়তা।'],
                        ['id' => 'step_4', 'num' => '০৪', 'title' => 'লাইভ মডেল টেস্ট ও র‍্যাঙ্কিং', 'desc' => 'টাইমারসহ রিয়েল এক্সাম এনভায়রনমেন্টে পরীক্ষা দিয়ে আত্মবিশ্বাস যাচাই।'],
                    ]
                ]
            ],
            [
                'id' => 'block_testimonials_1',
                'type' => 'testimonials',
                'title' => 'Student Reviews & Testimonials',
                'settings' => [
                    'sectionTag' => 'শিক্ষার্থীদের মতামত',
                    'sectionTitle' => 'সাফল্যের গল্পগুলো শুনুন শিক্ষার্থীদের মুখেই',
                    'sectionSub' => 'আমাদের শিক্ষার্থীদের সাফল্যের অনুভূতি ও বাস্তব অভিজ্ঞতা।',
                    'items' => [
                        [
                            'id' => 'test_1',
                            'name' => 'তানভীর আহমেদ',
                            'role' => 'বুয়েট \'২৩ ব্যাচ',
                            'rating' => 5,
                            'avatar' => '',
                            'quote' => 'মনোলগ এডুর ফিজিক্স ও ম্যাথ ক্লাসগুলো আমার কনসেপ্ট পুরো পাল্টে দিয়েছে। বিশেষ করে ডাউট সলভিং সিস্টেম অতুলনীয়!'
                        ],
                        [
                            'id' => 'test_2',
                            'name' => 'সাদিয়া আফরিন',
                            'role' => 'ঢাকা মেডিকেল কলেজ',
                            'rating' => 5,
                            'avatar' => '',
                            'quote' => 'অনলাইন এক্সাম সিস্টেমটা একদম রিয়েল পরীক্ষার ফিল দেয়। মেরিট পজিশন দেখে নিজের ভুলগুলো সহজে শুধরে নিয়েছি।'
                        ],
                        [
                            'id' => 'test_3',
                            'name' => 'ফারহান কবির',
                            'role' => 'নটর ডেম কলেজ, GPA 5',
                            'rating' => 5,
                            'avatar' => '',
                            'quote' => 'লেকচার শিটগুলো এতটাই গোছানো যে বাড়তি কোনো বইয়ের সাহায্য ছাড়াই সম্পূর্ণ রিভিশন সম্ভব হয়েছে।'
                        ],
                    ]
                ]
            ],
            [
                'id' => 'block_faq_1',
                'type' => 'faq_accordion',
                'title' => 'FAQ Accordion Section',
                'settings' => [
                    'sectionTag' => 'সচরাচর জিজ্ঞাসা',
                    'sectionTitle' => 'সাধারণ কিছু প্রশ্নের উত্তর',
                    'sectionSub' => 'কোর্স ভর্তি, ক্লাস ও পরীক্ষা সংক্রান্ত প্রয়োজনীয় তথ্য।',
                    'items' => [
                        [
                            'id' => 'faq_1',
                            'q' => 'মনোলগ এডু (Monologue Edu)-তে কোর্স কীভাবে কিনব বা ভর্তি হব?',
                            'a' => 'যেকোনো কোর্সের কার্ডে থাকা "কোর্সটি কিনুন" বাটনে ক্লিক করুন। এরপর বিকাশ, নগদ বা রকেটের মাধ্যমে পেমেন্ট করে TrxID সাবমিট করলেই খুব দ্রুত আপনার কোর্স এনরোলমেন্ট সক্রিয় হয়ে যাবে।'
                        ],
                        [
                            'id' => 'faq_2',
                            'q' => 'লাইভ ক্লাস ছাড়াও কি রেকর্ডেড ক্লাস ও লেকচার শিট পাওয়া যাবে?',
                            'a' => 'হ্যাঁ, প্রতিটি লাইভ ক্লাসের পর তা স্বয়ংক্রিয়ভাবে ফুল HD রেকর্ডেড আর্কাইভে জমা হয় যা পরীক্ষার শেষ দিন পর্যন্ত যতবার ইচ্ছা রিভিশন দেওয়া যায়। সাথে চ্যাপ্টারভিত্তিক প্র্যাকটিস শিট ও লেকচার নোট দেওয়া হয়।'
                        ],
                        [
                            'id' => 'faq_3',
                            'q' => 'NexPilot AI ডাউট সলভার কীভাবে পড়ালেখায় সাহায্য করে?',
                            'a' => 'NexPilot হলো সম্পূর্ণ কারিকুলাম-সংযুক্ত ২৪/৭ এআই টিউটর। ক্লাসের পড়ালেখা, সূত্রের ব্যাখ্যা বা কোনো গাণিতিক সমস্যায় আটকে গেলে যেকোনো সময় চ্যাট করে সেকেন্ডের মধ্যে কনসেপ্ট ক্লিয়ার করা যায়।'
                        ],
                        [
                            'id' => 'faq_4',
                            'q' => 'অনলাইন মডেল টেস্ট ও মেরিট পজিশন কীভাবে কাজ করে?',
                            'a' => 'পরীক্ষাগুলো বাস্তব বোর্ড ও ভর্তি পরীক্ষার মতো নেগেটিভ মার্কিংসহ টাইমারভিত্তিক নেওয়া হয়। সাবমিট করার সাথে সাথে মূল্যায়ন, সঠিক উত্তরের ব্যাখ্যা এবং র‍্যাঙ্কিং দেখতে পাবেন।'
                        ],
                        [
                            'id' => 'faq_5',
                            'q' => 'কোর্স কিনলে কি মোবাইল ও কম্পিউটার উভয় ডিভাইসে করা যাবে?',
                            'a' => 'অবশ্যই! আমাদের প্ল্যাটফর্ম যেকোনো স্মার্টফোন, ট্যাবলেট এবং ল্যাপটপ/পিসিতে অত্যন্ত দ্রুত ও স্মুথলি কাজ করে।'
                        ]
                    ]
                ]
            ],
            [
                'id' => 'block_cta_1',
                'type' => 'cta_banner',
                'title' => 'Bottom CTA Banner',
                'settings' => [
                    'badge' => 'অ্যাডমিশন ওপেন',
                    'title' => 'আজই যোগ দিন দেশের সেরা অনলাইন লার্নিং প্ল্যাটফর্মে',
                    'subtitle' => 'তোমার স্বপ্ন পূরণে আমরা আছি প্রতিটি পদক্ষেপে। এখনই যেকোনো কোর্সে ভর্তি হয়ে শুরু করো প্রস্তুতি।',
                    'buttonText' => 'কোর্সগুলো ঘুরে দেখুন',
                    'buttonLink' => '/courses',
                    'bgColor' => 'sky',
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
                    'meta_title' => $category->name . ' - Monologue Edu',
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
                'meta_title' => 'All Courses - Monologue Edu',
                'meta_description' => 'Browse all subject-based preparation courses.',
                'blocks' => static::defaultCoursesBlocks(),
            ]
        );

        return $synced;
    }
}
