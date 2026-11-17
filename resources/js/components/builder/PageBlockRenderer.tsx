import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageBlock, Course, Category, CourseTabItem } from '../../types';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
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
    Code,
    Video,
    Boxes,
    Tag,
    ChevronDown,
    ChevronUp,
    GraduationCap,
    Flame,
    ClipboardList,
    ExternalLink,
    Plus,
    Minus,
    Check
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
    const s = block.settings || {};
    const styleProps: React.CSSProperties = {};
    if (s.bgColor) styleProps.backgroundColor = s.bgColor;
    if (s.textColor) styleProps.color = s.textColor;
    if (typeof s.paddingTop === 'number') styleProps.paddingTop = `${s.paddingTop}px`;
    if (typeof s.paddingBottom === 'number') styleProps.paddingBottom = `${s.paddingBottom}px`;
    if (s.textAlign) styleProps.textAlign = s.textAlign;

    const renderInner = () => {
        switch (block.type) {
            case 'top_announcement':
                return <TopAnnouncementBlock block={block} isBuilder={isBuilder} />;
            case 'hero':
                return <HeroBlock block={block} isBuilder={isBuilder} />;
            case 'heading':
                return <HeadingBlock block={block} isBuilder={isBuilder} />;
            case 'button':
                return <ButtonBlock block={block} isBuilder={isBuilder} />;
            case 'image':
                return <ImageBlock block={block} isBuilder={isBuilder} />;
            case 'divider':
                return <DividerBlock block={block} />;
            case 'spacer':
                return <SpacerBlock block={block} />;
            case 'bundle_showcase':
                return <BundleShowcaseBlock block={block} isBuilder={isBuilder} />;
            case 'course_tabs':
                return <CourseTabsBlock block={block} isBuilder={isBuilder} />;
            case 'teachers_showcase':
                return <TeachersShowcaseBlock block={block} isBuilder={isBuilder} />;
            case 'learning_path':
                return <LearningPathBlock block={block} isBuilder={isBuilder} />;
            case 'testimonials':
                return <TestimonialsBlock block={block} isBuilder={isBuilder} />;
            case 'faq_accordion':
                return <FaqAccordionBlock block={block} isBuilder={isBuilder} />;
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
                    <div className="p-6 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-center text-sm border border-dashed border-slate-300 dark:border-slate-700">
                        Unknown block type: {block.type}
                    </div>
                );
        }
    };

    return (
        <div
            id={s.htmlId || undefined}
            className={`elementor-block-wrapper ${s.customClass || ''}`}
            style={styleProps}
        >
            {s.scopedCss && <style>{s.scopedCss}</style>}
            {renderInner()}
        </div>
    );
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
                            <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-amber-500 bg-clip-text text-transparent">
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
                        <div className="relative mx-auto max-w-md lg:max-w-none bg-gradient-to-tr from-sky-500 via-sky-600 to-amber-500 p-1 rounded-3xl shadow-2xl shadow-sky-500/20">
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
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
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
                                        className="block w-full py-3 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-bold rounded-xl text-sm shadow-md shadow-sky-500/25 transition-all cursor-pointer"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {courses.map((course) => {
                                const thumbUrl = getImageUrl((course as any).thumbnail || course.thumbnail_url);
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
                                                                ? course.instructors[0].name 
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
        : 'from-sky-700 via-sky-600 to-amber-600';

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

/* -------------------------------------------------------------
 * 9. TOP ANNOUNCEMENT RIBBON BLOCK
 * ----------------------------------------------------------- */
const TopAnnouncementBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const badge = getLocalizedText(s.badge, s.badge_en, language) || 'স্পেশাল অফার';
    const text = getLocalizedText(s.text, s.text_en, language) || 'HSC একাডেমিক সাইকেল ও অ্যাডমিশন মাস্টার ব্যাচে স্পেশাল ছাড়ে ভর্তি চলছে!';
    const linkText = getLocalizedText(s.linkText, s.linkText_en, language) || 'সকল কোর্স দেখুন →';
    const linkUrl = s.linkUrl || '/courses';
    const bgGradient = s.bgColor || 'from-sky-700 via-sky-600 to-amber-500';

    return (
        <div className={`bg-gradient-to-r ${bgGradient} text-white text-xs sm:text-sm py-2.5 px-4 font-semibold text-center flex items-center justify-center gap-2 shadow-inner relative z-10`}>
            {badge && (
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
            )}
            <span>{text}</span>
            {linkText && (
                <Link to={linkUrl} className="underline font-bold text-amber-200 hover:text-white transition-colors ml-1 hidden sm:inline">
                    {linkText}
                </Link>
            )}
        </div>
    );
};

/* -------------------------------------------------------------
 * 10. HEADING BLOCK
 * ----------------------------------------------------------- */
const HeadingBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const title = getLocalizedText(s.title, s.title_en, language) || 'Heading Title';
    const subtitle = getLocalizedText(s.subtitle, s.subtitle_en, language);
    const tag = s.tag || 'h2';
    const align = s.align || 'center';
    const size = s.size || '3xl';
    const color = s.color || '';

    const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
    const sizeMap: Record<string, string> = {
        sm: 'text-lg sm:text-xl',
        md: 'text-xl sm:text-2xl',
        lg: 'text-2xl sm:text-3xl',
        xl: 'text-3xl sm:text-4xl',
        '2xl': 'text-4xl sm:text-5xl',
        '3xl': 'text-4xl sm:text-5xl lg:text-6xl',
    };
    const sizeClass = sizeMap[size] || 'text-3xl sm:text-4xl';

    const HeadingTag = tag as keyof JSX.IntrinsicElements;

    return (
        <div className={`py-6 px-4 max-w-7xl mx-auto ${alignClass}`}>
            {subtitle && (
                <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2">
                    {subtitle}
                </div>
            )}
            <HeadingTag className={`font-black tracking-tight text-slate-900 dark:text-white ${sizeClass} ${color}`}>
                {title}
            </HeadingTag>
        </div>
    );
};

/* -------------------------------------------------------------
 * 11. BUTTON BLOCK
 * ----------------------------------------------------------- */
const ButtonBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const text = getLocalizedText(s.text, s.text_en, language) || 'Click Here';
    const link = s.link || '#';
    const align = s.align || 'center';
    const variant = s.variant || 'gradient';
    const size = s.size || 'md';
    const target = s.target || '_self';

    const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
    const sizeClass = size === 'sm' ? 'px-4 py-2 text-xs' : size === 'lg' ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm';

    let variantClass = 'bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 text-white hover:from-sky-600 hover:to-sky-800 shadow-md shadow-sky-600/30';
    if (variant === 'primary') variantClass = 'bg-sky-600 text-white hover:bg-sky-700 shadow-md';
    if (variant === 'secondary') variantClass = 'bg-amber-500 text-white hover:bg-amber-600 shadow-md';
    if (variant === 'outline') variantClass = 'border-2 border-sky-600 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40';
    if (variant === 'dark') variantClass = 'bg-slate-900 text-white hover:bg-slate-800 shadow-md';

    return (
        <div className={`py-4 px-4 max-w-7xl mx-auto flex ${alignClass}`}>
            <Link
                to={link}
                target={target}
                className={`inline-flex items-center gap-2 rounded-xl font-bold transition-all cursor-pointer ${sizeClass} ${variantClass}`}
            >
                <span>{text}</span>
                <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
};

/* -------------------------------------------------------------
 * 12. IMAGE BLOCK
 * ----------------------------------------------------------- */
const ImageBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const s = block.settings || {};
    const url = s.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80';
    const alt = s.alt || 'Image';
    const caption = s.caption;
    const align = s.align || 'center';
    const rounded = s.rounded || '2xl';
    const maxWidth = s.maxWidth || '100%';

    const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
    const roundedClass = rounded === 'full' ? 'rounded-full' : rounded === 'none' ? 'rounded-none' : rounded === 'md' ? 'rounded-md' : 'rounded-2xl';

    return (
        <div className={`py-6 px-4 max-w-7xl mx-auto ${alignClass}`}>
            <div className="inline-block" style={{ maxWidth }}>
                {s.link ? (
                    <Link to={s.link}>
                        <img src={getImageUrl(url)} alt={alt} className={`w-full h-auto shadow-lg border border-slate-200 dark:border-slate-800 ${roundedClass}`} />
                    </Link>
                ) : (
                    <img src={getImageUrl(url)} alt={alt} className={`w-full h-auto shadow-lg border border-slate-200 dark:border-slate-800 ${roundedClass}`} />
                )}
                {caption && <p className="text-xs text-slate-500 mt-2 italic">{caption}</p>}
            </div>
        </div>
    );
};

/* -------------------------------------------------------------
 * 13. DIVIDER BLOCK
 * ----------------------------------------------------------- */
const DividerBlock: React.FC<{ block: PageBlock }> = ({ block }) => {
    const s = block.settings || {};
    const width = s.width || '100%';
    const align = s.align || 'center';
    const style = s.style || 'solid';
    const color = s.color || '#e2e8f0';

    const alignClass = align === 'left' ? 'mr-auto' : align === 'right' ? 'ml-auto' : 'mx-auto';

    return (
        <div className="py-4 px-4 max-w-7xl mx-auto">
            <hr className={alignClass} style={{ width, borderTopStyle: style, borderTopColor: color, borderTopWidth: '1px' }} />
        </div>
    );
};

/* -------------------------------------------------------------
 * 14. SPACER BLOCK
 * ----------------------------------------------------------- */
const SpacerBlock: React.FC<{ block: PageBlock }> = ({ block }) => {
    const s = block.settings || {};
    const height = Number(s.height || 40);
    return <div style={{ height: `${height}px` }} className="w-full" />;
};

/* -------------------------------------------------------------
 * 15. COURSE BUNDLES SHOWCASE BLOCK
 * ----------------------------------------------------------- */
const BundleShowcaseBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || 'স্পেশাল প্যাকেজ';
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || 'জনপ্রিয় কোর্স বান্ডেল ও কম্বো';
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || 'একাধিক কোর্স একসাথে নিয়ে সেভ করুন সর্বোচ্চ ৫০% পর্যন্ত!';
    const limit = Number(s.limit || 4);

    const [bundles, setBundles] = useState<any[]>([]);

    useEffect(() => {
        const fetchBundles = async () => {
            try {
                const res = await apiClient.get('/bundles/featured');
                setBundles((res.data?.bundles || []).slice(0, limit));
            } catch {}
        };
        fetchBundles();
    }, [limit]);

    if (bundles.length === 0) return null;

    return (
        <section className="py-14 sm:py-20 bg-gradient-to-b from-amber-50/40 via-white to-slate-50 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950 border-b border-slate-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                    {sectionTag && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
                            <Boxes className="w-3.5 h-3.5" />
                            <span>{sectionTag}</span>
                        </div>
                    )}
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {sectionTitle}
                    </h2>
                    {sectionSub && (
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                            {sectionSub}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bundles.map((bundle) => {
                        const discount = bundle.regular_price > bundle.sale_price
                            ? Math.round(((bundle.regular_price - bundle.sale_price) / bundle.regular_price) * 100)
                            : 0;

                        return (
                            <div
                                key={bundle.id}
                                className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-200/80 dark:border-amber-900/40 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-amber-400 transition-all duration-200 relative group overflow-hidden"
                            >
                                {discount > 0 && (
                                    <div className="absolute top-4 right-4 bg-rose-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md">
                                        {discount}% ছাড়
                                    </div>
                                )}
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                                        <Boxes className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        {bundle.title}
                                    </h3>
                                    {bundle.short_description && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                                            {bundle.short_description}
                                        </p>
                                    )}

                                    {Array.isArray(bundle.courses) && bundle.courses.length > 0 && (
                                        <div className="space-y-1.5 mb-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                                অন্তর্ভুক্ত কোর্সসমূহ ({bundle.courses.length}টি):
                                            </span>
                                            {bundle.courses.slice(0, 3).map((c: any) => (
                                                <div key={c.id} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    <span className="truncate">{c.title}</span>
                                                </div>
                                            ))}
                                            {bundle.courses.length > 3 && (
                                                <div className="text-[11px] text-amber-600 font-bold pl-5">
                                                    + আরও {bundle.courses.length - 3}টি কোর্স
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-slate-400 line-through">
                                            {formatBDT(bundle.regular_price)}
                                        </div>
                                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                            {formatBDT(bundle.sale_price)}
                                        </div>
                                    </div>
                                    <Link
                                        to={`/checkout/${bundle.slug}?type=bundle`}
                                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/30 flex items-center gap-1.5 transition-all"
                                    >
                                        <span>বান্ডেল কিনুন</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 16. FACULTY & TEACHERS SHOWCASE BLOCK
 * ----------------------------------------------------------- */
const TeachersShowcaseBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || 'মেন্টর প্যানেল';
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || 'দেশসেরা শিক্ষকদের সাথে তোমার প্রস্তুতি';
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || 'বছরজুড়ে যাদের সঠিক দিকনির্দেশনা হাজারো শিক্ষার্থীকে পৌঁছাতে সাহায্য করেছে তাদের স্বপ্নের ক্যাম্পাসে।';
    const limit = Number(s.limit || 8);

    const [teachers, setTeachers] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'ssc' | 'hsc' | 'admission' | 'arts'>('all');

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const res = await apiClient.get('/teachers/featured');
                const list = res.data?.data || res.data?.teachers || [];
                setTeachers(list.slice(0, limit));
            } catch {}
        };
        fetchTeachers();
    }, [limit]);

    if (teachers.length === 0) return null;

    const filtered = teachers.filter((t) => {
        if (filter === 'all') return true;
        const text = `${t.expertise || ''} ${t.designation || ''} ${t.bio || ''}`.toLowerCase();
        if (filter === 'ssc') return text.includes('ssc') || text.includes('নবম') || text.includes('দশম');
        if (filter === 'hsc') return text.includes('hsc') || text.includes('এইচএসসি');
        if (filter === 'admission') return text.includes('admission') || text.includes('ভর্তি') || text.includes('বুয়েট') || text.includes('মেডিকেল');
        if (filter === 'arts') return text.includes('arts') || text.includes('commerce') || text.includes('আর্টস');
        return true;
    });

    return (
        <section className="py-16 sm:py-24 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                    {sectionTag && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>{sectionTag}</span>
                        </div>
                    )}
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {sectionTitle}
                    </h2>
                    {sectionSub && (
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                            {sectionSub}
                        </p>
                    )}

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                        {[
                            { key: 'all', label: 'সকল মেন্টর' },
                            { key: 'hsc', label: 'এইচএসসি (HSC)' },
                            { key: 'admission', label: 'এডমিশন' },
                            { key: 'ssc', label: 'এসএসসি (SSC)' },
                        ].map((btn) => (
                            <button
                                key={btn.key}
                                type="button"
                                onClick={() => setFilter(btn.key as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    filter === btn.key
                                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filtered.map((t) => (
                        <div
                            key={t.id}
                            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 text-center shadow-sm hover:shadow-lg hover:border-sky-300 transition-all group"
                        >
                            <div className="relative w-28 h-28 mx-auto mb-4 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-sky-100 dark:border-sky-900/40">
                                {t.photo_url ? (
                                    <img src={getImageUrl(t.photo_url)} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sky-500 font-black text-2xl">
                                        {t.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-0.5 group-hover:text-sky-600 transition-colors">
                                {t.name}
                            </h3>
                            <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                                {t.designation || 'শিক্ষক ও মেন্টর'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                {t.institution || 'Monologue Edu'}
                            </p>
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <Link
                                    to={`/teachers/${t.id}`}
                                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center justify-center gap-1"
                                >
                                    <span>প্রোফাইল দেখুন</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 17. LEARNING PATH / METHODOLOGY BLOCK
 * ----------------------------------------------------------- */
const LearningPathBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || 'লার্নিং মেথডোলজি';
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || '৪ ধাপে শতভাগ প্রস্তুতি নিশ্চিত করার বৈজ্ঞানিক পদ্ধতি';
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || 'পরিকল্পিত উপায়ে কনসেপ্ট ক্লিয়ারিং থেকে পরীক্ষা জয়ের সম্পূর্ণ পথপ্রদর্শক।';

    const defaultSteps = [
        { id: '1', num: '০১', title: 'বেসিক ও কনসেপ্ট ক্লিয়ারিং', desc: 'প্রতিটি থিওরি অ্যানিমেশন ও বাস্তব উদাহরণের সাহায্যে সুস্পষ্টভাবে ব্যাখ্যা।' },
        { id: '2', num: '০২', title: 'টপিকভিত্তিক গাণিতিক প্র্যাকটিস', desc: 'বোর্ড ও শীর্ষ কলেজগুলোর বিগত বছরের প্রশ্নগুলোর পূর্ণাঙ্গ সমাধান।' },
        { id: '3', num: '০৩', title: '২৪/৭ AI ডাউট সলভিং', desc: 'পড়ালেখার যেকোনো সময় আটকে গেলে তাৎক্ষণিক সমাধানের নিশ্চয়তা।' },
        { id: '4', num: '০৪', title: 'লাইভ মডেল টেস্ট ও র‍্যাঙ্কিং', desc: 'টাইমারসহ রিয়েল এক্সাম এনভায়রনমেন্টে পরীক্ষা দিয়ে আত্মবিশ্বাস যাচাই।' },
    ];
    const steps = s.steps || defaultSteps;

    return (
        <section className="py-16 sm:py-24 bg-gradient-to-b from-sky-50/50 via-white to-slate-50 dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950 border-b border-slate-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
                    {sectionTag && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
                            <Flame className="w-3.5 h-3.5 text-amber-500" />
                            <span>{sectionTag}</span>
                        </div>
                    )}
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {sectionTitle}
                    </h2>
                    {sectionSub && (
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                            {sectionSub}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((st: any, idx: number) => (
                        <div
                            key={st.id || idx}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-sky-300 transition-all relative overflow-hidden"
                        >
                            <div className="text-4xl font-black text-sky-500/20 dark:text-sky-400/20 mb-3">
                                {st.num || `0${idx + 1}`}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                {st.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {st.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 18. TESTIMONIALS / STUDENT REVIEWS BLOCK
 * ----------------------------------------------------------- */
const TestimonialsBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || 'শিক্ষার্থীদের মতামত';
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || 'সাফল্যের গল্পগুলো শুনুন শিক্ষার্থীদের মুখেই';
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || 'আমাদের শিক্ষার্থীদের সাফল্যের অনুভূতি ও বাস্তব অভিজ্ঞতা।';

    const defaultItems = [
        {
            id: '1',
            name: 'তানভীর আহমেদ',
            role: 'বুয়েট \'২৩ ব্যাচ',
            rating: 5,
            quote: 'মনোলগ এডুর ফিজিক্স ও ম্যাথ ক্লাসগুলো আমার কনসেপ্ট পুরো পাল্টে দিয়েছে। বিশেষ করে ডাউট সলভিং সিস্টেম অতুলনীয়!'
        },
        {
            id: '2',
            name: 'সাদিয়া আফরিন',
            role: 'ঢাকা মেডিকেল কলেজ',
            rating: 5,
            quote: 'অনলাইন এক্সাম সিস্টেমটা একদম রিয়েল পরীক্ষার ফিল দেয়। মেরিট পজিশন দেখে নিজের ভুলগুলো সহজে শুধরে নিয়েছি।'
        },
        {
            id: '3',
            name: 'ফারহান কবির',
            role: 'নটর ডেম কলেজ, GPA 5',
            rating: 5,
            quote: 'লেকচার শিটগুলো এতটাই গোছানো যে বাড়তি কোনো বইয়ের সাহায্য ছাড়াই সম্পূর্ণ রিভিশন সম্ভব হয়েছে।'
        },
    ];
    const items = s.items || defaultItems;

    return (
        <section className="py-16 sm:py-24 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
                    {sectionTag && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{sectionTag}</span>
                        </div>
                    )}
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {sectionTitle}
                    </h2>
                    {sectionSub && (
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                            {sectionSub}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {items.map((item: any, idx: number) => (
                        <div
                            key={item.id || idx}
                            className="bg-slate-50 dark:bg-slate-900 p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-1 text-amber-400">
                                    {[...Array(item.rating || 5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                    "{item.quote}"
                                </p>
                            </div>
                            <div className="pt-5 mt-5 border-t border-slate-200/60 dark:border-slate-800">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                    {item.name}
                                </h4>
                                <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold">
                                    {item.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 19. FAQ ACCORDION BLOCK
 * ----------------------------------------------------------- */
const FaqAccordionBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || 'সচরাচর জিজ্ঞাসা';
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || 'সাধারণ কিছু প্রশ্নের উত্তর';
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || 'কোর্স ভর্তি, ক্লাস ও পরীক্ষা সংক্রান্ত প্রয়োজনীয় তথ্য।';

    const defaultFaqs = [
        {
            id: '1',
            q: 'মনোলগ এডু (Monologue Edu)-তে কোর্স কীভাবে কিনব বা ভর্তি হব?',
            a: 'যেকোনো কোর্সের কার্ডে থাকা "কোর্সটি কিনুন" বাটনে ক্লিক করুন। এরপর বিকাশ, নগদ বা রকেটের মাধ্যমে পেমেন্ট করে TrxID সাবমিট করলেই খুব দ্রুত আপনার কোর্স এনরোলমেন্ট সক্রিয় হয়ে যাবে।'
        },
        {
            id: '2',
            q: 'লাইভ ক্লাস ছাড়াও কি রেকর্ডেড ক্লাস ও লেকচার শিট পাওয়া যাবে?',
            a: 'হ্যাঁ, প্রতিটি লাইভ ক্লাসের পর তা স্বয়ংক্রিয়ভাবে ফুল HD রেকর্ডেড আর্কাইভে জমা হয় যা পরীক্ষার শেষ দিন পর্যন্ত যতবার ইচ্ছা রিভিশন দেওয়া যায়। সাথে চ্যাপ্টারভিত্তিক প্র্যাকটিস শিট ও লেকচার নোট দেওয়া হয়।'
        },
        {
            id: '3',
            q: 'NexPilot AI ডাউট সলভার কীভাবে পড়ালেখায় সাহায্য করে?',
            a: 'NexPilot হলো সম্পূর্ণ কারিকুলাম-সংযুক্ত ২৪/৭ এআই টিউটর। ক্লাসের পড়ালেখা, সূত্রের ব্যাখ্যা বা কোনো গাণিতিক সমস্যায় আটকে গেলে যেকোনো সময় চ্যাট করে সেকেন্ডের মধ্যে কনসেপ্ট ক্লিয়ার করা যায়।'
        },
        {
            id: '4',
            q: 'অনলাইন মডেল টেস্ট ও মেরিট পজিশন কীভাবে কাজ করে?',
            a: 'পরীক্ষাগুলো বাস্তব বোর্ড ও ভর্তি পরীক্ষার মতো নেগেটিভ মার্কিংসহ টাইমারভিত্তিক নেওয়া হয়। সাবমিট করার সাথে সাথে মূল্যায়ন, সঠিক উত্তরের ব্যাখ্যা এবং র‍্যাঙ্কিং দেখতে পাবেন।'
        },
    ];
    const items = s.items || defaultFaqs;
    const [openIdx, setOpenIdx] = useState<number | null>(0);

    return (
        <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                    {sectionTag && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
                            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                            <span>{sectionTag}</span>
                        </div>
                    )}
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {sectionTitle}
                    </h2>
                    {sectionSub && (
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                            {sectionSub}
                        </p>
                    )}
                </div>

                <div className="space-y-3.5">
                    {items.map((faq: any, idx: number) => {
                        const isOpen = openIdx === idx;
                        return (
                            <div
                                key={faq.id || idx}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer hover:text-sky-600 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform ${
                                        isOpen ? 'bg-sky-100 text-sky-600 rotate-180 dark:bg-sky-950' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                    }`}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
