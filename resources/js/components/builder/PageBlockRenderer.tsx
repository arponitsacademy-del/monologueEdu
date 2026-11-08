import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageBlock, Course, Category, CourseTabItem } from '../../types';
import { apiClient, formatBDT } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedText } from '../../utils/localization';
import { PlyrVideoPlayer } from '../shared/PlyrVideoPlayer';
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
    ShieldCheck,
    Zap,
    Heart,
    FileText,
    Code
} from 'lucide-react';

interface PageBlockRendererProps {
    block: PageBlock;
    isBuilder?: boolean; // if true, preview mode inside builder
    onSelectBlock?: () => void;
}

export const PageBlockRenderer: React.FC<PageBlockRendererProps> = ({
    block,
    isBuilder = false,
    onSelectBlock,
}) => {
    switch (block.type) {
        case 'hero':
            return <HeroBlock block={block} isBuilder={isBuilder} />;
        case 'course_tabs':
            return <CourseTabsBlock block={block} isBuilder={isBuilder} />;
        case 'html_widget':
            return <HtmlWidgetBlock block={block} isBuilder={isBuilder} />;
        case 'features':
            return <FeaturesBlock block={block} isBuilder={isBuilder} />;
        case 'cta_banner':
            return <CtaBannerBlock block={block} isBuilder={isBuilder} />;
        case 'rich_text':
            return <RichTextBlock block={block} isBuilder={isBuilder} />;
        case 'video_embed':
            return <VideoEmbedBlock block={block} isBuilder={isBuilder} />;
        case 'stats_counter':
            return <StatsCounterBlock block={block} isBuilder={isBuilder} />;
        default:
            return (
                <div className="p-6 bg-slate-100 text-slate-500 rounded-xl text-center text-sm border border-dashed border-slate-300">
                    Unknown block type: {block.type}
                </div>
            );
    }
};

/* -------------------------------------------------------------
 * 1. HERO BLOCK
 * ----------------------------------------------------------- */
const HeroBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { t, language } = useLanguage();
    const s = block.settings || {};

    const badge = getLocalizedText(s.badge, s.badge_en, language) || (language === 'en' ? t.hero.badge : s.badge);
    const titlePart1 = getLocalizedText(s.titlePart1, s.titlePart1_en, language) || t.hero.titlePart1;
    const titleHighlight = getLocalizedText(s.titleHighlight, s.titleHighlight_en, language) || t.hero.titleHighlight;
    const titlePart2 = getLocalizedText(s.titlePart2, s.titlePart2_en, language) || t.hero.titlePart2;
    const subtitle = getLocalizedText(s.subtitle, s.subtitle_en, language) || t.hero.subtitle;
    const browseCoursesBtn = getLocalizedText(s.browseCoursesBtn, s.browseCoursesBtn_en, language) || t.hero.browseCourses;
    const startFreeClassBtn = getLocalizedText(s.startFreeClassBtn, s.startFreeClassBtn_en, language) || t.hero.startFreeClass;
    const trust1 = getLocalizedText(s.trust1, s.trust1_en, language) || t.hero.trustStudents;
    const trust2 = getLocalizedText(s.trust2, s.trust2_en, language) || t.hero.trustLifetime;
    const trust3 = getLocalizedText(s.trust3, s.trust3_en, language) || t.hero.trustDoubts;

    const cardBadge = getLocalizedText(s.cardBadge, s.cardBadge_en, language) || 'Live Academy Status';
    const physicsTitle = getLocalizedText(s.physicsTitle, s.physicsTitle_en, language) || t.hero.physicsTitle;
    const physicsSub = getLocalizedText(s.physicsSub, s.physicsSub_en, language) || t.hero.physicsSub;
    const teachersTitle = getLocalizedText(s.teachersTitle, s.teachersTitle_en, language) || t.hero.teachersTitle;
    const teachersSub = getLocalizedText(s.teachersSub, s.teachersSub_en, language) || t.hero.teachersSub;
    const studyMatTitle = getLocalizedText(s.studyMatTitle, s.studyMatTitle_en, language) || t.hero.studyMatTitle;
    const studyMatSub = getLocalizedText(s.studyMatSub, s.studyMatSub_en, language) || t.hero.studyMatSub;
    const joinTodayBtn = getLocalizedText(s.joinTodayBtn, s.joinTodayBtn_en, language) || t.hero.joinToday;

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pt-16 pb-24 border-b border-slate-100 dark:border-slate-800 transition-colors duration-150">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Text */}
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                        {badge && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs sm:text-sm font-bold tracking-wide">
                                <Sparkles className="w-4 h-4 text-sky-600 animate-pulse" />
                                <span>{badge}</span>
                            </div>
                        )}

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.2] tracking-tight">
                            {titlePart1} <br />
                            <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                                {titleHighlight}
                            </span> <br />
                            {titlePart2}
                        </h1>

                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            {subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                            {browseCoursesBtn && (
                                <Link
                                    to={s.browseCoursesLink || '/courses'}
                                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-sky-600 text-white font-bold text-base shadow-lg shadow-sky-600/30 hover:bg-sky-700 hover:shadow-xl hover:shadow-sky-600/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    <span>{browseCoursesBtn}</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            )}
                            {startFreeClassBtn && (
                                <Link
                                    to={s.startFreeClassLink || '/courses'}
                                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-base hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                                >
                                    <PlayCircle className="w-5 h-5 text-emerald-600" />
                                    <span>{startFreeClassBtn}</span>
                                </Link>
                            )}
                        </div>

                        {/* Trust badges */}
                        <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200/60 dark:border-slate-800">
                            {trust1 && (
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {trust1}
                                </span>
                            )}
                            {trust2 && (
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {trust2}
                                </span>
                            )}
                            {trust3 && (
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {trust3}
                                </span>
                            )}
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
                                    <span className="text-xs font-semibold text-slate-400">{cardBadge}</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{physicsTitle}</h4>
                                            <p className="text-xs text-slate-400">{physicsSub}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{teachersTitle}</h4>
                                            <p className="text-xs text-slate-400">{teachersSub}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                                            <Award className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{studyMatTitle}</h4>
                                            <p className="text-xs text-slate-400">{studyMatSub}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 text-center">
                                    <Link
                                        to="/register"
                                        className="block w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold rounded-xl text-sm shadow-md hover:opacity-95 transition-opacity cursor-pointer"
                                    >
                                        {joinTodayBtn}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 2. COURSE TABS & GRID BLOCK (Supports Category query OR Custom HTML Tab!)
 * ----------------------------------------------------------- */
const CourseTabsBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block, isBuilder }) => {
    const { t, language } = useLanguage();
    const s = block.settings || {};

    const headingTag = getLocalizedText(s.headingTag, s.headingTag_en, language) || t.courses.headingTag;
    const headingTitle = getLocalizedText(s.headingTitle, s.headingTitle_en, language) || t.courses.headingTitle;
    const viewAllText = getLocalizedText(s.viewAllText, s.viewAllText_en, language) || t.courses.viewAll;
    const allTabLabel = getLocalizedText(s.allTabLabel, s.allTabLabel_en, language) || t.courses.allTab;

    const rawTabs: CourseTabItem[] = s.tabs || [
        { id: 'tab_all', label: allTabLabel, type: 'category', categorySlug: 'all' }
    ];

    const configuredTabs = rawTabs.map(tab => ({
        ...tab,
        label: tab.id === 'tab_all' ? allTabLabel : getLocalizedText(tab.label, (tab as any).label_en, language)
    }));

    const [activeTabId, setActiveTabId] = useState<string>(configuredTabs[0]?.id || 'tab_all');
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const activeTab = configuredTabs.find(t => t.id === activeTabId) || configuredTabs[0];

    useEffect(() => {
        // Fetch categories for pill counts or dynamic category display if enabled
        const fetchInitial = async () => {
            try {
                const initialCategory = activeTab?.type === 'category' && activeTab?.categorySlug && activeTab?.categorySlug !== 'all'
                    ? `&category=${encodeURIComponent(activeTab.categorySlug)}`
                    : '';
                const [coursesRes, catsRes] = await Promise.all([
                    apiClient.get(`/courses?per_page=${s.limit || 12}${initialCategory}`),
                    apiClient.get('/categories'),
                ]);
                setCourses(coursesRes.data.data || []);
                const allCats: Category[] = catsRes.data || [];
                // Filter out free-courses and paid-courses pseudo categories
                const filteredCats = allCats.filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses');
                // If selectedCategorySlugs is specified in settings, filter by it
                if (Array.isArray(s.selectedCategorySlugs) && s.selectedCategorySlugs.length > 0) {
                    setCategories(filteredCats.filter(c => s.selectedCategorySlugs.includes(c.slug)));
                } else {
                    setCategories(filteredCats);
                }
            } catch {
                // error handling
            } finally {
                setLoading(false);
            }
        };
        fetchInitial();
    }, [s.limit, s.selectedCategorySlugs]);

    // When tab changes, if it is a category tab, fetch courses for that category
    const handleTabClick = async (tab: CourseTabItem) => {
        setActiveTabId(tab.id);
        if (tab.type === 'category') {
            setLoading(true);
            try {
                const slug = tab.categorySlug || 'all';
                const url = slug === 'all'
                    ? `/courses?per_page=${s.limit || 12}`
                    : `/courses?per_page=${s.limit || 12}&category=${encodeURIComponent(slug)}`;
                const res = await apiClient.get(url);
                setCourses(res.data.data || []);
            } catch {
                // error
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    {headingTag && (
                        <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-widest mb-2">
                            <Sparkles className="w-4 h-4" />
                            <span>{headingTag}</span>
                        </div>
                    )}
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {headingTitle}
                    </h2>
                </div>
                {viewAllText && (
                    <Link
                        to={s.viewAllLink || '/courses'}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                    >
                        <span>{viewAllText}</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                )}
            </div>

            {/* Configured Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin">
                {configuredTabs.map((tab) => {
                    const isSelected = activeTabId === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabClick(tab)}
                            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                                isSelected
                                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-2xs'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {tab.type === 'html' && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                }`}>
                                    HTML
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* If dynamic categories enabled in settings, also show database categories */}
                {s.dynamicCategories && categories.map((cat) => {
                    const isSelected = activeTab?.type === 'category' && activeTab?.categorySlug === cat.slug;
                    return (
                        <button
                            key={`cat_${cat.id}`}
                            type="button"
                            onClick={() => {
                                const customTab: CourseTabItem = {
                                    id: `dyn_cat_${cat.id}`,
                                    label: cat.name,
                                    type: 'category',
                                    categorySlug: cat.slug,
                                };
                                handleTabClick(customTab);
                            }}
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

            {/* TAB CONTENT: EITHER CUSTOM HTML WIDGET OR COURSES GRID */}
            {activeTab?.type === 'html' ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
                    {activeTab.cssContent && (
                        <style>{activeTab.cssContent}</style>
                    )}
                    <div 
                        dangerouslySetInnerHTML={{ 
                            __html: activeTab.htmlContent || `<div class="text-center text-slate-400 py-8">Add custom HTML widget content...</div>` 
                        }} 
                    />
                </div>
            ) : (
                /* Course Cards Grid */
                <div>
                    {loading ? (
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
                                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        {course.thumbnail_url ? (
                                            <img
                                                src={course.thumbnail_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                                                <BookOpen className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                                            {course.categories && course.categories.length > 0 ? (
                                                course.categories.slice(0, 2).map((cat) => (
                                                    <span key={cat.id} className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-600/90 text-white backdrop-blur-xs">
                                                        {cat.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                                                    General
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2 mb-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                                            {course.subtitle || course.description}
                                        </p>

                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div>
                                                {course.is_free ? (
                                                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                                        {t.courses.free}
                                                    </span>
                                                ) : (
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-lg font-black text-slate-900 dark:text-white">
                                                            {formatBDT(course.price)}
                                                        </span>
                                                        {course.strike_price && (
                                                            <span className="text-xs text-slate-400 line-through">
                                                                {formatBDT(course.strike_price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <Link
                                                to={`/courses/${course.slug}`}
                                                className="px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold text-xs hover:bg-sky-600 hover:text-white transition-all cursor-pointer"
                                            >
                                                {t.courses.viewDetails}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

/* -------------------------------------------------------------
 * 3. CUSTOM HTML & CSS WIDGET (Elementor Pro style raw HTML/CSS)
 * ----------------------------------------------------------- */
const HtmlWidgetBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {s.cssContent && (
                <style>{s.cssContent}</style>
            )}
            <div 
                dangerouslySetInnerHTML={{ 
                    __html: s.htmlContent || `<div class="p-8 bg-slate-100 text-slate-400 rounded-2xl text-center text-sm font-mono">Custom HTML/CSS Widget Preview...</div>` 
                }} 
            />
        </section>
    );
};

/* -------------------------------------------------------------
 * 4. FEATURES GRID BLOCK (Why Choose Us)
 * ----------------------------------------------------------- */
const FeaturesBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { t, language } = useLanguage();
    const s = block.settings || {};

    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || t.features.sectionTag;
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || t.features.sectionTitle;
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || t.features.sectionSub;

    const defaultItems = [
        {
            id: '1',
            icon: 'Award',
            title: t.features.feature1Title,
            desc: t.features.feature1Desc,
        },
        {
            id: '2',
            icon: 'HelpCircle',
            title: t.features.feature2Title,
            desc: t.features.feature2Desc,
        },
        {
            id: '3',
            icon: 'Clock',
            title: t.features.feature3Title,
            desc: t.features.feature3Desc,
        },
    ];

    const rawItems = s.items || defaultItems;
    const items = rawItems.map((item: any) => ({
        ...item,
        title: getLocalizedText(item.title, item.title_en, language) || item.title,
        desc: getLocalizedText(item.desc, item.desc_en, language) || item.desc,
    }));

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Award': return <Award className="w-6 h-6" />;
            case 'HelpCircle': return <HelpCircle className="w-6 h-6" />;
            case 'Clock': return <Clock className="w-6 h-6" />;
            case 'Zap': return <Zap className="w-6 h-6" />;
            case 'ShieldCheck': return <ShieldCheck className="w-6 h-6" />;
            case 'Heart': return <Heart className="w-6 h-6" />;
            default: return <Award className="w-6 h-6" />;
        }
    };

    return (
        <section className="bg-slate-900 text-white py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {(sectionTag || sectionTitle) && (
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        {sectionTag && (
                            <span className="text-xs font-bold uppercase tracking-widest text-sky-400">{sectionTag}</span>
                        )}
                        {sectionTitle && (
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{sectionTitle}</h2>
                        )}
                        {sectionSub && (
                            <p className="text-slate-400 text-sm sm:text-base">{sectionSub}</p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {items.map((item: any, idx: number) => (
                        <div key={item.id || idx} className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700/60 space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                                {getIcon(item.icon)}
                            </div>
                            <h3 className="text-xl font-bold">{item.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 5. CTA BANNER BLOCK
 * ----------------------------------------------------------- */
const CtaBannerBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};

    const badge = getLocalizedText(s.badge, s.badge_en, language);
    const title = getLocalizedText(s.title, s.title_en, language) || 'Join Monologue Edu Today';
    const subtitle = getLocalizedText(s.subtitle, s.subtitle_en, language);
    const buttonText = getLocalizedText(s.buttonText, s.buttonText_en, language) || 'Browse Courses';

    const bgGradient = s.bgColor === 'slate'
        ? 'from-slate-900 via-slate-800 to-slate-900'
        : 'from-sky-600 via-indigo-600 to-indigo-800';

    return (
        <section className={`py-16 bg-gradient-to-r ${bgGradient} text-white`}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                {badge && (
                    <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-widest backdrop-blur-xs">
                        {badge}
                    </span>
                )}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                )}
                {buttonText && (
                    <div className="pt-2">
                        <Link
                            to={s.buttonLink || '/courses'}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-base hover:bg-slate-100 shadow-xl transition-all cursor-pointer"
                        >
                            <span>{buttonText}</span>
                            <ArrowRight className="w-5 h-5 text-sky-600" />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 6. RICH TEXT / POLICY CONTENT BLOCK
 * ----------------------------------------------------------- */
const RichTextBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const content = getLocalizedText(s.content, s.content_en, language) || '<p>Add content here...</p>';

    return (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div 
                className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </section>
    );
};

/* -------------------------------------------------------------
 * 7. VIDEO EMBED BLOCK WITH PLYR.JS
 * ----------------------------------------------------------- */
const VideoEmbedBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};

    const title = getLocalizedText(s.title, s.title_en, language);
    const subtitle = getLocalizedText(s.subtitle, s.subtitle_en, language);

    return (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {(title || subtitle) && (
                <div className="text-center mb-8 space-y-2">
                    {title && <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{title}</h2>}
                    {subtitle && <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{subtitle}</p>}
                </div>
            )}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-black">
                {s.videoUrl ? (
                    <PlyrVideoPlayer
                        url={s.videoUrl}
                        title={title || 'Video Player'}
                        className="w-full h-full"
                    />
                ) : (
                    <div className="w-full aspect-video flex flex-col items-center justify-center text-slate-400">
                        <PlayCircle className="w-16 h-16 text-slate-600 mb-2" />
                        <span className="text-sm">
                            Please provide a video link
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 8. STATS COUNTER BLOCK
 * ----------------------------------------------------------- */
const StatsCounterBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};

    const defaultStats = [
        { label: 'Enrolled Students', value: '10,000+' },
        { label: 'Recorded Lectures', value: '500+' },
        { label: 'Total Courses', value: '20+' },
        { label: 'Success Rate', value: '98%' },
    ];

    const rawStats = s.stats || defaultStats;
    const stats = rawStats.map((stat: any) => ({
        value: getLocalizedText(stat.value, stat.value_en, language) || stat.value,
        label: getLocalizedText(stat.label, stat.label_en, language) || stat.label,
    }));

    return (
        <section className="bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {stats.map((stat: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs space-y-1">
                            <div className="text-3xl sm:text-4xl font-black text-sky-600 dark:text-sky-400">{stat.value}</div>
                            <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
