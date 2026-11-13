import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
import { Course, Category, CustomPage } from '../../types';
import { PageBlockRenderer } from '../../components/builder/PageBlockRenderer';
import { useLanguage } from '../../context/LanguageContext';
import { Search, BookOpen, Layers, Sparkles, X, ChevronRight, CheckCircle2, Video, Users } from 'lucide-react';

export const CoursesPage: React.FC = () => {
    const { t, language } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [pageConfig, setPageConfig] = useState<CustomPage | null>(null);
    const [loading, setLoading] = useState(true);

    const activeCategory = searchParams.get('category') || '';
    const activeSearch = searchParams.get('search') || '';

    // Fetch page settings from visual page builder/admin page edit
    useEffect(() => {
        const fetchPageAndCategories = async () => {
            try {
                const [catsRes, pageRes] = await Promise.allSettled([
                    apiClient.get('/categories'),
                    apiClient.get('/pages/courses'),
                ]);

                let allCats: Category[] = [];
                if (catsRes.status === 'fulfilled') {
                    allCats = catsRes.value.data || [];
                }

                // Filter out pseudo categories 'free-courses' & 'paid-courses'
                let validCats = allCats.filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses');

                if (pageRes.status === 'fulfilled' && pageRes.value.data?.page) {
                    const page = pageRes.value.data.page;
                    setPageConfig(page);

                    // Check if page builder has course_tabs block with selectedCategorySlugs
                    const tabBlock = (page.blocks || []).find((b: any) => b.type === 'course_tabs');
                    if (tabBlock?.settings?.selectedCategorySlugs && Array.isArray(tabBlock.settings.selectedCategorySlugs)) {
                        const selectedSlugs: string[] = tabBlock.settings.selectedCategorySlugs;
                        if (selectedSlugs.length > 0) {
                            validCats = validCats.filter(c => selectedSlugs.includes(c.slug));
                        }
                    }
                }

                setCategories(validCats);
            } catch {
                // handle error
            }
        };

        fetchPageAndCategories();
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [activeCategory, activeSearch]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeCategory) params.append('category', activeCategory);
            if (activeSearch) params.append('search', activeSearch);

            const { data } = await apiClient.get(`/courses?${params.toString()}`);
            setCourses(data.data || []);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const q = formData.get('q') as string;
        const newParams = new URLSearchParams(searchParams);
        if (q) newParams.set('search', q);
        else newParams.delete('search');
        setSearchParams(newParams);
    };

    const handleSelectCategory = (categorySlug: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (!categorySlug || categorySlug === 'all') {
            newParams.delete('category');
        } else {
            newParams.set('category', categorySlug);
        }
        setSearchParams(newParams);
    };

    // If page is fully customized with custom blocks (beyond standard grid), render builder view
    const isCustomizedInBuilder = pageConfig && 
        Array.isArray(pageConfig.blocks) && 
        pageConfig.blocks.length > 0 &&
        pageConfig.blocks.some(b => b.type !== 'course_tabs');

    if (isCustomizedInBuilder && pageConfig) {
        return (
            <div className="space-y-0">
                {pageConfig.custom_css && <style>{pageConfig.custom_css}</style>}
                {pageConfig.blocks.map(block => (
                    <PageBlockRenderer key={block.id} block={block} isBuilder={false} />
                ))}
            </div>
        );
    }

    const currentCategoryObj = categories.find(c => c.slug === activeCategory);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/80 dark:border-slate-800 pb-8">
                <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Course Catalog</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {currentCategoryObj ? currentCategoryObj.name : t.courses.allTab}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {currentCategoryObj?.description || 'Choose the right course to achieve your goals. Comprehensive preparation with top instructors.'}
                    </p>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full">
                    <input
                        type="text"
                        name="q"
                        defaultValue={activeSearch}
                        placeholder={t.courses.searchPlaceholder}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                </form>
            </div>

            {/* Category Filter Tabs */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-sky-500" />
                        <span>{t.courses.filterByCategory}</span>
                    </span>
                    {activeCategory && (
                        <button
                            type="button"
                            onClick={() => handleSelectCategory('all')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Reset Filter</span>
                        </button>
                    )}
                </div>

                {/* Horizontally Scrollable Category Pill Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {/* All Courses Tab */}
                    <button
                        type="button"
                        onClick={() => handleSelectCategory('all')}
                        className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                            activeCategory === ''
                                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-500/20'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-2xs'
                        }`}
                    >
                        <span>{t.courses.allTab}</span>
                    </button>

                    {/* Educational Categories Selected in Builder/Page Edit */}
                    {categories.map((cat) => {
                        const isSelected = activeCategory === cat.slug;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleSelectCategory(cat.slug)}
                                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                                    isSelected
                                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-500/20'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-2xs'
                                }`}
                            >
                                <span>{cat.name}</span>
                                {cat.courses_count !== undefined && cat.courses_count > 0 && (
                                    <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}
                                    >
                                        {cat.courses_count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Courses Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse space-y-4">
                            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                    <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                        No Courses Found
                    </h3>
                    <p className="text-xs text-slate-400">
                        There are currently no courses in this category or matching your search.
                    </p>
                    {activeCategory && (
                        <button
                            type="button"
                            onClick={() => handleSelectCategory('all')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-sky-700 transition-colors cursor-pointer"
                        >
                            <span>{t.courses.viewAll}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {courses.map((course) => {
                        const thumbUrl = getImageUrl(course.thumbnail || (course as any).thumbnail_url);
                        return (
                            <div
                                key={course.id}
                                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-2xl hover:border-sky-400 dark:hover:border-sky-500 transition-all flex flex-col overflow-hidden relative"
                            >
                                {/* Thumbnail Header */}
                                <Link to={`/courses/${course.slug}`} className="block relative aspect-video bg-slate-900 overflow-hidden cursor-pointer group/thumb">
                                    {thumbUrl ? (
                                        <img
                                            src={thumbUrl}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 group-hover/thumb:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLElement).style.display = 'none';
                                                const fallback = (e.currentTarget.parentElement?.querySelector('.fallback-thumb') as HTMLElement);
                                                if (fallback) fallback.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className={`fallback-thumb w-full h-full ${thumbUrl ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-tr from-slate-800 to-sky-950 text-white`}>
                                        <BookOpen className="w-12 h-12 text-sky-400 opacity-60" />
                                    </div>

                                    {/* Discount Badge */}
                                    {course.discount_percent && course.discount_percent > 0 ? (
                                        <span className="absolute top-3 right-3 px-3 py-1 text-xs font-black bg-rose-600 text-white rounded-xl shadow-md">
                                            {course.discount_percent}% ছাড়
                                        </span>
                                    ) : course.price === 0 ? (
                                        <span className="absolute top-3 right-3 px-3 py-1 text-xs font-black bg-emerald-600 text-white rounded-xl shadow-md">
                                            ফ্রি কোর্স
                                        </span>
                                    ) : null}

                                    {/* Category Pill on image */}
                                    {course.categories && course.categories.length > 0 && (
                                        <span className="absolute bottom-3 left-3 px-2.5 py-1 text-[11px] font-bold bg-black/70 backdrop-blur-xs text-white rounded-lg">
                                            {course.categories[0].name}
                                        </span>
                                    )}
                                </Link>

                                {/* Content Body */}
                                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Video className="w-3.5 h-3.5 text-sky-500" />
                                                <span>{course.lessons_count || 0} টি ক্লাস</span>
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-sky-500" />
                                                <span>{course.enrollments_count || 0} জন শিক্ষার্থী</span>
                                            </span>
                                        </div>

                                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 transition-colors line-clamp-2">
                                            <Link
                                                to={`/courses/${course.slug}`}
                                                className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                                            >
                                                {course.title}
                                            </Link>
                                        </h3>

                                        {/* Course feature checklist */}
                                        <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-300">
                                            {((course.features && Array.isArray(course.features) && course.features.length > 0)
                                                ? course.features.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
                                                : [
                                                    'লাইভ ও ফুল HD রেকর্ডেড ক্লাস আর্কাইভ',
                                                    'চ্যাপ্টারভিত্তিক লেকচার শিট ও প্রশ্নব্যাংক',
                                                    'NexPilot AI ২৪/৭ ইনস্ট্যান্ট ডাউট সলভার',
                                                ]
                                            ).slice(0, 4).map((feat: string, fIdx: number) => (
                                                <div key={fIdx} className="flex items-start gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span className="line-clamp-1 leading-tight">{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pricing & Instructor Row */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-medium text-slate-500 truncate mr-2">
                                                ইন্সট্রাক্টর: <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {course.instructors && course.instructors.length > 0 
                                                        ? course.instructors.map(i => i.name).join(', ') 
                                                        : (course.instructor?.name || 'অভিজ্ঞ মেন্টর')}
                                                </span>
                                            </div>

                                            <div className="text-right shrink-0">
                                                {course.price === 0 ? (
                                                    <span className="text-lg font-black text-emerald-600">ফ্রি</span>
                                                ) : (
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-xl font-black text-sky-600 dark:text-sky-400">
                                                            {formatBDT(
                                                                course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price)
                                                                    ? Number(course.sale_price)
                                                                    : (course.effective_price ?? Number(course.price))
                                                             )}
                                                        </span>
                                                        {course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price) && (
                                                            <span className="text-xs text-slate-400 line-through">
                                                                {formatBDT(course.price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <Link
                                                to={`/courses/${course.slug}`}
                                                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 text-center transition-all cursor-pointer"
                                            >
                                                বিস্তারিত দেখুন
                                            </Link>
                                            <Link
                                                to={`/checkout/${course.slug}`}
                                                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 font-bold text-xs text-white text-center transition-all shadow-md shadow-sky-500/20 cursor-pointer"
                                            >
                                                কোর্সটি কিনুন
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
