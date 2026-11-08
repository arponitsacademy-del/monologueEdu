import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { Course, Category, CustomPage } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { PageBlockRenderer } from '../../components/builder/PageBlockRenderer';
import { 
    Sparkles, 
    BookOpen, 
    CheckCircle2, 
    Users, 
    PlayCircle, 
    ArrowRight, 
    Award, 
    Clock, 
    HelpCircle, 
    Star,
    GraduationCap,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

interface FeaturedTeacher {
    id: number;
    name: string;
    email?: string;
    designation: string;
    institution: string;
    photo_url?: string | null;
    bio?: string | null;
    courses_count: number;
}

export const HomePage: React.FC = () => {
    const { t } = useLanguage();
    const [customPage, setCustomPage] = useState<CustomPage | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [teachers, setTeachers] = useState<FeaturedTeacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [teachersLoading, setTeachersLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: -340, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: 340, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        // Initial fetch: all categories, initial courses, custom home page blocks, and featured teachers
        const fetchData = async () => {
            try {
                const [coursesRes, catsRes, pageRes, teachersRes] = await Promise.allSettled([
                    apiClient.get('/courses?per_page=12'),
                    apiClient.get('/categories'),
                    apiClient.get('/pages/home'),
                    apiClient.get('/teachers/featured'),
                ]);

                if (coursesRes.status === 'fulfilled') {
                    setCourses(coursesRes.value.data.data || []);
                }
                if (catsRes.status === 'fulfilled') {
                    setCategories(catsRes.value.data || []);
                }
                if (pageRes.status === 'fulfilled' && pageRes.value.data?.page) {
                    setCustomPage(pageRes.value.data.page);
                }
                if (teachersRes.status === 'fulfilled') {
                    const teacherList = teachersRes.value.data?.data || teachersRes.value.data?.teachers || [];
                    setTeachers(teacherList);
                }
            } catch {
                // handle error
            } finally {
                setLoading(false);
                setTeachersLoading(false);
            }
        };
        fetchData();
    }, []);

    // Smooth auto-scroll for Teacher carousel (left-to-right flow)
    useEffect(() => {
        if (teachers.length <= 1 || isPaused) return;
        const interval = setInterval(() => {
            if (!carouselRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
            if (scrollLeft + clientWidth >= scrollWidth - 15) {
                carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                carouselRef.current.scrollBy({ left: 340, behavior: 'smooth' });
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [teachers, isPaused]);

    const handleCategoryClick = async (slug: string) => {
        if (activeCategory === slug) return;
        setActiveCategory(slug);
        setCoursesLoading(true);
        try {
            const url = slug === 'all' 
                ? '/courses?per_page=12' 
                : `/courses?per_page=12&category=${encodeURIComponent(slug)}`;
            const res = await apiClient.get(url);
            setCourses(res.data.data || []);
        } catch {
            // handle error
        } finally {
            setCoursesLoading(false);
        }
    };

    // If customized in the Visual Page Builder, dynamically render custom blocks
    if (customPage && Array.isArray(customPage.blocks) && customPage.blocks.length > 0) {
        return (
            <div className="space-y-0">
                {customPage.custom_css && <style>{customPage.custom_css}</style>}
                {customPage.blocks.map(block => (
                    <PageBlockRenderer key={block.id} block={block} isBuilder={false} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-20 pb-20">
            {/* Hero Section (Phyhunt Inspired) */}
            <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pt-16 pb-24 border-b border-slate-100 dark:border-slate-800 transition-colors duration-150">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Left Text */}
                        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs sm:text-sm font-bold tracking-wide">
                                <Sparkles className="w-4 h-4 text-sky-600 animate-pulse" />
                                <span>{t.hero.badge}</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.2] tracking-tight">
                                {t.hero.titlePart1} <br />
                                <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                                    {t.hero.titleHighlight}
                                </span> <br />
                                {t.hero.titlePart2}
                            </h1>

                            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                {t.hero.subtitle}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                                <Link
                                    to="/courses"
                                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-sky-600 text-white font-bold text-base shadow-lg shadow-sky-600/30 hover:bg-sky-700 hover:shadow-xl hover:shadow-sky-600/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    <span>{t.hero.browseCourses}</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    to="/courses?type=free"
                                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-base hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                                >
                                    <PlayCircle className="w-5 h-5 text-emerald-600" />
                                    <span>{t.hero.startFreeClass}</span>
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200/60 dark:border-slate-800">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {t.hero.trustStudents}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {t.hero.trustLifetime}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {t.hero.trustDoubts}
                                </span>
                            </div>
                        </div>

                        {/* Right Visual Card */}
                        <div className="lg:col-span-5 relative">
                            <div className="relative mx-auto max-w-md lg:max-w-none bg-gradient-to-tr from-sky-600 via-indigo-600 to-indigo-800 p-1 rounded-3xl shadow-2xl shadow-sky-500/20">
                                <div className="bg-slate-900 rounded-[22px] p-6 text-white space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400">{t.hero.liveCardTitle}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                                                <BookOpen className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{t.hero.physicsTitle}</h4>
                                                <p className="text-xs text-slate-400">{t.hero.physicsSub}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{t.hero.teachersTitle}</h4>
                                                <p className="text-xs text-slate-400">{t.hero.teachersSub}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{t.hero.studyMatTitle}</h4>
                                                <p className="text-xs text-slate-400">{t.hero.studyMatSub}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 text-center">
                                        <Link
                                            to="/register"
                                            className="block w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold rounded-xl text-sm shadow-md hover:opacity-95 transition-opacity cursor-pointer"
                                        >
                                            {t.hero.joinToday}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Courses Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-widest mb-2">
                            <Sparkles className="w-4 h-4" />
                            {t.courses.headingTag}
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {t.courses.headingTitle}
                        </h2>
                    </div>
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                    >
                        <span>{t.courses.viewAll}</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Dynamic Category Navigation Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
                    <button
                        onClick={() => handleCategoryClick('all')}
                        className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                            activeCategory === 'all'
                                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-2xs'
                        }`}
                    >
                        {t.courses.allTab}
                    </button>
                    {categories.map((cat) => {
                        const isSelected = activeCategory === cat.slug;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                    isSelected
                                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-2xs'
                                }`}
                            >
                                <span>{cat.name}</span>
                                {cat.courses_count !== undefined && cat.courses_count > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                    }`}>
                                        {cat.courses_count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {loading || coursesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse space-y-4">
                                <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-2">
                        <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="font-semibold">{t.courses.emptyCourses}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-sky-300 dark:hover:border-sky-500 transition-all flex flex-col overflow-hidden"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-950 text-white">
                                            <BookOpen className="w-12 h-12 text-sky-400 opacity-60" />
                                        </div>
                                    )}
                                    {/* Discount Badge */}
                                    {course.discount_percent && course.discount_percent > 0 ? (
                                        <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-black bg-rose-500 text-white rounded-lg shadow-md">
                                            {course.discount_percent}% {t.courses.off}
                                        </span>
                                    ) : course.price === 0 ? (
                                        <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-black bg-emerald-500 text-white rounded-lg shadow-md">
                                            {t.courses.free}
                                        </span>
                                    ) : null}
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        {/* Multi-Category Badges */}
                                        {course.categories && course.categories.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {course.categories.map((c) => (
                                                    <span 
                                                        key={c.id} 
                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/60"
                                                    >
                                                        {c.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <span>{course.lessons_count || 0} {t.courses.lessonsCount}</span>
                                            <span>•</span>
                                            <span>{course.enrollments_count || 0} {t.courses.studentsCount}</span>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2">
                                            {course.title}
                                        </h3>

                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {course.short_description || 'Comprehensive curriculum aligned with national syllabus.'}
                                        </p>
                                    </div>

                                    {/* Instructor info */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate mr-2">
                                            {t.courses.instructor}: <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {course.instructors && course.instructors.length > 0 
                                                    ? course.instructors.map(i => i.name).join(', ') 
                                                    : (course.instructor?.name || 'Faculty Member')}
                                            </span>
                                        </div>

                                        <div className="text-right shrink-0">
                                            {course.price === 0 ? (
                                                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{t.courses.free}</span>
                                            ) : (
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-lg font-black text-slate-900 dark:text-white">
                                                        {formatBDT(course.effective_price || course.price)}
                                                    </span>
                                                    {course.sale_price && course.sale_price < course.price && (
                                                        <span className="text-xs text-slate-400 line-through">
                                                            {formatBDT(course.price)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Link
                                        to={`/courses/${course.slug}`}
                                        className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-sky-600 group-hover:text-white font-bold text-sm text-slate-700 dark:text-slate-200 text-center transition-all shadow-xs cursor-pointer"
                                    >
                                        {t.courses.viewDetails}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Teachers Carousel Section (Left-to-Right Carousel) */}
            {(teachers.length > 0 || teachersLoading) && (
                <section className="relative py-16 bg-gradient-to-b from-white via-sky-50/40 to-white dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 border-y border-slate-100 dark:border-slate-800/80 transition-colors">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Section Header with Carousel Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-xs font-bold tracking-wide uppercase mb-2">
                                    <GraduationCap className="w-4 h-4 text-sky-600" />
                                    <span>Faculty & Instructors</span>
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Learn with the Best Instructors
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                                    Achieve academic excellence with experienced educators and mentors from premier institutions.
                                </p>
                            </div>

                            {/* Carousel Arrow Controls */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <button
                                    onClick={scrollLeft}
                                    aria-label="Previous teachers"
                                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 hover:border-sky-300 dark:hover:border-sky-700 hover:text-sky-600 dark:hover:text-sky-400 transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={scrollRight}
                                    aria-label="Next teachers"
                                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 hover:border-sky-300 dark:hover:border-sky-700 hover:text-sky-600 dark:hover:text-sky-400 transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Carousel Scroll Container */}
                        {teachersLoading ? (
                            <div className="flex gap-6 overflow-hidden py-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="w-[280px] sm:w-[320px] shrink-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 animate-pulse space-y-4"
                                    >
                                        <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 mx-auto" />
                                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 mx-auto" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2 mx-auto" />
                                        <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl w-full mt-4" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                ref={carouselRef}
                                onMouseEnter={() => setIsPaused(true)}
                                onMouseLeave={() => setIsPaused(false)}
                                className="flex gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-none"
                                style={{ scrollSnapType: 'x mandatory' }}
                            >
                                {teachers.map((teacher) => (
                                    <div
                                        key={teacher.id}
                                        style={{ scrollSnapAlign: 'start' }}
                                        className="w-[280px] sm:w-[320px] shrink-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-xl hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                                    >
                                        {/* Subtle top color gradient accent */}
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />

                                        <div className="space-y-4">
                                            {/* Photo & Initial */}
                                            <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-tr from-sky-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 p-1 shadow-md group-hover:scale-105 transition-transform duration-300">
                                                {teacher.photo_url ? (
                                                    <img
                                                        src={teacher.photo_url}
                                                        alt={teacher.name}
                                                        className="w-full h-full object-cover rounded-[14px]"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                        }}
                                                    />
                                                ) : null}
                                                {(!teacher.photo_url) && (
                                                    <div className="w-full h-full rounded-[14px] bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-black text-3xl">
                                                        {(teacher.name || 'T').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Name & Designation */}
                                            <div className="text-center space-y-1.5">
                                                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                                                    {teacher.name}
                                                </h3>

                                                {/* Designation */}
                                                <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-900/60 line-clamp-1">
                                                    {teacher.designation || 'Instructor'}
                                                </div>

                                                {/* Institution / Education */}
                                                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
                                                    <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                                                    <span className="line-clamp-1">{teacher.institution || 'Monologue Edu'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer: Courses count & View Profile Link */}
                                        <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 font-medium">Courses</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {teacher.courses_count || 0} Courses
                                                </span>
                                            </div>

                                            <Link
                                                to={`/teachers/${teacher.id}`}
                                                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-sky-600 group-hover:text-white font-bold text-xs text-slate-700 dark:text-slate-200 text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                                            >
                                                <span>View Profile & Courses</span>
                                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Why Choose Us Section */}
            <section className="bg-slate-900 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-sky-400">{t.features.sectionTag}</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t.features.sectionTitle}</h2>
                        <p className="text-slate-400 text-sm sm:text-base">
                            {t.features.sectionSub}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700/60 space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                                <Award className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold">{t.features.feature1Title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {t.features.feature1Desc}
                            </p>
                        </div>

                        <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700/60 space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <HelpCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold">{t.features.feature2Title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {t.features.feature2Desc}
                            </p>
                        </div>

                        <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700/60 space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold">{t.features.feature3Title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {t.features.feature3Desc}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
