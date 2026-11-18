import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { CustomPage, PageBlock, BlockType, CourseTabItem, Category } from '../../types';
import { PageBlockRenderer } from '../../components/builder/PageBlockRenderer';
import {
    ArrowLeft,
    Save,
    Eye,
    Monitor,
    Tablet,
    Smartphone,
    Plus,
    Sliders,
    Layers,
    Trash2,
    Copy,
    ChevronUp,
    ChevronDown,
    Code,
    Check,
    Sparkles,
    BookOpen,
    Award,
    HelpCircle,
    Zap,
    Video,
    BarChart3,
    FileText,
    PanelLeftClose,
    PanelLeftOpen,
    ExternalLink,
    AlertCircle,
    GripVertical,
    Search,
    Type,
    Image as ImageIcon,
    MousePointerClick,
    Minus,
    MoveVertical,
    GraduationCap,
    Flame,
    MessageSquare,
    Star,
    Boxes,
    RefreshCw,
    Palette
} from 'lucide-react';

/* -------------------------------------------------------------
 * DropZone Component for Drag and Drop Target Slots
 * ----------------------------------------------------------- */
interface DropZoneProps {
    index: number;
    isDragging: boolean;
    isActive: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onQuickAdd?: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({
    isDragging,
    isActive,
    onDragOver,
    onDragLeave,
    onDrop,
    onQuickAdd,
}) => {
    return (
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`transition-all duration-200 relative z-30 ${isDragging
                ? isActive
                    ? 'py-4 my-2'
                    : 'py-2 my-1'
                : 'py-1 my-0'
                }`}
        >
            {isDragging ? (
                <div
                    className={`flex items-center justify-center rounded-xl border-2 border-dashed transition-all pointer-events-none ${isActive
                        ? 'h-16 bg-sky-500/20 border-sky-500 text-sky-600 scale-[1.01] shadow-lg ring-4 ring-sky-500/20'
                        : 'h-7 bg-sky-50/50 border-sky-300 text-sky-500/70'
                        }`}
                >
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <Plus className={`w-4 h-4 ${isActive ? 'animate-bounce text-sky-600' : ''}`} />
                        <span>{isActive ? 'Drop Here' : 'Drop Zone'}</span>
                    </div>
                </div>
            ) : onQuickAdd ? (
                <div className="opacity-0 hover:opacity-100 transition-opacity flex justify-center -my-2.5">
                    <button
                        type="button"
                        onClick={onQuickAdd}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] rounded-full shadow-md flex items-center gap-1 cursor-pointer"
                    >
                        <Plus className="w-3 h-3" />
                        <span>Add Widget Here</span>
                    </button>
                </div>
            ) : null}
        </div>
    );
};

/* -------------------------------------------------------------
 * ELEMENTOR PRO WIDGET CATALOG DEFINITION
 * ----------------------------------------------------------- */
interface WidgetDef {
    type: BlockType;
    name: string;
    description: string;
    category: 'Basic' | 'Pro & Marketing' | 'Monologue LMS';
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
}

const WIDGET_CATALOG: WidgetDef[] = [
    // --- BASIC ---
    {
        type: 'heading',
        name: 'Heading',
        description: 'Eye-catching titles & headlines',
        category: 'Basic',
        icon: Type,
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-400',
    },
    {
        type: 'rich_text',
        name: 'Text Editor',
        description: 'Rich paragraphs & policies',
        category: 'Basic',
        icon: FileText,
        iconBg: 'bg-purple-500/20',
        iconColor: 'text-purple-400',
    },
    {
        type: 'button',
        name: 'Button',
        description: 'Call to action button',
        category: 'Basic',
        icon: MousePointerClick,
        iconBg: 'bg-sky-500/20',
        iconColor: 'text-sky-400',
    },
    {
        type: 'image',
        name: 'Image Banner',
        description: 'Responsive images & banners',
        category: 'Basic',
        icon: ImageIcon,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
    },
    {
        type: 'video_embed',
        name: 'Video (Plyr)',
        description: 'Clean video player (YouTube/Vimeo)',
        category: 'Basic',
        icon: Video,
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
    },
    {
        type: 'divider',
        name: 'Divider Line',
        description: 'Horizontal separator line',
        category: 'Basic',
        icon: Minus,
        iconBg: 'bg-slate-700/40',
        iconColor: 'text-slate-300',
    },
    {
        type: 'spacer',
        name: 'Spacer',
        description: 'Vertical whitespace gap',
        category: 'Basic',
        icon: MoveVertical,
        iconBg: 'bg-slate-700/40',
        iconColor: 'text-slate-300',
    },
    // --- PRO & MARKETING ---
    {
        type: 'hero',
        name: 'Hero Banner',
        description: 'Headline, dual CTAs & trust badges',
        category: 'Pro & Marketing',
        icon: Sparkles,
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
    },
    {
        type: 'top_announcement',
        name: 'Campaign Ribbon',
        description: 'Top notice & announcement bar',
        category: 'Pro & Marketing',
        icon: Flame,
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
    },
    {
        type: 'features',
        name: 'Why Choose Us',
        description: 'Feature value cards',
        category: 'Pro & Marketing',
        icon: Award,
        iconBg: 'bg-teal-500/20',
        iconColor: 'text-teal-400',
    },
    {
        type: 'cta_banner',
        name: 'CTA Banner',
        description: 'Conversion banner with button',
        category: 'Pro & Marketing',
        icon: Zap,
        iconBg: 'bg-rose-500/20',
        iconColor: 'text-rose-400',
    },
    {
        type: 'stats_counter',
        name: 'Stats Counter',
        description: 'Animated numbers & metrics',
        category: 'Pro & Marketing',
        icon: BarChart3,
        iconBg: 'bg-cyan-500/20',
        iconColor: 'text-cyan-400',
    },
    {
        type: 'learning_path',
        name: 'Learning Path',
        description: 'Step-by-step preparation flow',
        category: 'Pro & Marketing',
        icon: Layers,
        iconBg: 'bg-violet-500/20',
        iconColor: 'text-violet-400',
    },
    {
        type: 'testimonials',
        name: 'Testimonials',
        description: 'Student quotes & rating reviews',
        category: 'Pro & Marketing',
        icon: MessageSquare,
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
    },
    {
        type: 'faq_accordion',
        name: 'FAQ Accordion',
        description: 'Expandable Q&A accordion',
        category: 'Pro & Marketing',
        icon: HelpCircle,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
    },
    // --- MONOLOGUE LMS ---
    {
        type: 'course_tabs',
        name: 'Course Tabs & Grid',
        description: 'Category filter tabs & live course cards',
        category: 'Monologue LMS',
        icon: BookOpen,
        iconBg: 'bg-sky-500/20',
        iconColor: 'text-sky-400',
    },
    {
        type: 'bundle_showcase',
        name: 'Course Bundles',
        description: 'Combo package showcase grid',
        category: 'Monologue LMS',
        icon: Boxes,
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-400',
    },
    {
        type: 'teachers_showcase',
        name: 'Faculty Mentors',
        description: 'Teacher profiles & university tags',
        category: 'Monologue LMS',
        icon: GraduationCap,
        iconBg: 'bg-orange-500/20',
        iconColor: 'text-orange-400',
    },
    {
        type: 'html_widget',
        name: 'Custom HTML/CSS',
        description: 'Embed arbitrary code & styles',
        category: 'Monologue LMS',
        icon: Code,
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
    },
];

export const AdminPageBuilderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [page, setPage] = useState<CustomPage | null>(null);
    const [blocks, setBlocks] = useState<PageBlock[]>([]);
    const [customCss, setCustomCss] = useState<string>('');
    const [status, setStatus] = useState<'published' | 'draft'>('published');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Drag & Drop States
    const [isDragging, setIsDragging] = useState(false);
    const [draggedWidgetType, setDraggedWidgetType] = useState<BlockType | null>(null);
    const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
    const [activeDropZoneIndex, setActiveDropZoneIndex] = useState<number | null>(null);

    // Categories list for course tab selector
    const [dbCategories, setDbCategories] = useState<Category[]>([]);

    // Device preview: desktop (100%), tablet (768px), mobile (375px)
    const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    // Canvas scroll ref & smooth scroll helpers
    const mainCanvasRef = useRef<HTMLElement>(null);

    const scrollToBottom = () => {
        if (mainCanvasRef.current) {
            mainCanvasRef.current.scrollTo({
                top: mainCanvasRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    const scrollToTop = () => {
        if (mainCanvasRef.current) {
            mainCanvasRef.current.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        }
    };

    // Sidebar state: 'widgets' | 'inspector' | 'css'
    const [activeSidebarTab, setActiveSidebarTab] = useState<'widgets' | 'inspector' | 'css'>('widgets');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Selected block for editing
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    // Widget search in elements panel
    const [widgetSearch, setWidgetSearch] = useState('');

    // Resetting state
    const [resetting, setResetting] = useState(false);

    // Inspector 3 sub-tabs: 'content' | 'style' | 'advanced'
    const [inspectorSubTab, setInspectorSubTab] = useState<'content' | 'style' | 'advanced'>('content');

    const handleResetTemplate = async () => {
        if (!page) return;
        if (!confirm('Are you sure you want to reset all sections to the default template? Any custom modifications will be replaced with standard sections.')) return;
        setResetting(true);
        try {
            const { data } = await apiClient.post(`/admin/pages/${page.id}/reset-template`);
            setBlocks(data.page.blocks || []);
            showToast(data.message || 'Sections reset to default template!');
            if (data.page.blocks && data.page.blocks.length > 0) {
                setSelectedBlockId(data.page.blocks[0].id);
            }
        } catch {
            showToast('Failed to reset template');
        } finally {
            setResetting(false);
        }
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        fetchPage();
        fetchCategories();
    }, [id]);

    const fetchCategories = async () => {
        try {
            const { data } = await apiClient.get('/categories');
            setDbCategories(data || []);
        } catch { }
    };

    const fetchPage = async () => {
        try {
            const { data } = await apiClient.get(`/admin/pages/${id}`);
            const p = data.page;
            setPage(p);
            setBlocks(Array.isArray(p.blocks) ? p.blocks : []);
            setCustomCss(p.custom_css || '');
            setStatus(p.status || 'published');
            if (p.blocks && p.blocks.length > 0) {
                setSelectedBlockId(p.blocks[0].id);
            }
        } catch (err) {
            // error
        } finally {
            setLoading(false);
        }
    };

    // Keyboard shortcut Ctrl + S to save
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [page, blocks, customCss, status]);

    const handleSave = async () => {
        if (!page) return;
        setSaving(true);
        try {
            await apiClient.put(`/admin/pages/${page.id}`, {
                title: page.title,
                slug: page.slug,
                status: status,
                blocks: blocks,
                custom_css: customCss,
                meta_title: page.meta_title,
                meta_description: page.meta_description,
            });
            showToast('Design saved successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save design.');
        } finally {
            setSaving(false);
        }
    };

    /* -------------------------------------------------------------
     * BLOCK ACTIONS
     * ----------------------------------------------------------- */
    const handleAddBlock = (type: BlockType, insertIndex?: number) => {
        const newBlockId = `block_${type}_${Date.now()}`;
        let newBlock: PageBlock;

        switch (type) {
            case 'hero':
                newBlock = {
                    id: newBlockId,
                    type: 'hero',
                    title: 'Hero Banner',
                    settings: {
                        badge: 'Admissions Open for New Batch',
                        titlePart1: 'Learn with Top Educators',
                        titleHighlight: 'Easily and Effectively',
                        titlePart2: 'Study & Exam Preparation',
                        subtitle: 'Comprehensive guidelines and round-the-clock doubt solving to help you succeed in exams.',
                        browseCoursesBtn: 'Browse All Courses',
                        browseCoursesLink: '/courses',
                        startFreeClassBtn: 'Start Free Class',
                        startFreeClassLink: '/courses',
                        trust1: '10,000+ Students',
                        trust2: 'Lifetime Access',
                        trust3: '24/7 Doubt Solving',
                        cardBadge: 'Live Status',
                        physicsTitle: 'HSC Physics',
                        physicsSub: 'Video & Chapter-wise Notes',
                        teachersTitle: 'Experienced Faculty',
                        teachersSub: 'Top University Educators',
                        studyMatTitle: 'Study Materials',
                        studyMatSub: 'Handnotes & Model Tests',
                        joinTodayBtn: 'Join Today',
                    }
                };
                break;

            case 'course_tabs':
                newBlock = {
                    id: newBlockId,
                    type: 'course_tabs',
                    title: 'Course Tabs & Grid',
                    settings: {
                        headingTag: 'Courses',
                        headingTitle: 'Popular Premium & Special Courses',
                        viewAllText: 'All Courses',
                        viewAllLink: '/courses',
                        limit: 12,
                        showAllTab: true,
                        allTabLabel: 'All Courses',
                        dynamicCategories: false,
                        selectedCategorySlugs: dbCategories
                            .filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses')
                            .map(c => c.slug),
                        tabs: [
                            { id: 'tab_all', label: 'All Courses', type: 'category', categorySlug: 'all' },
                            ...dbCategories
                                .filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses')
                                .slice(0, 5)
                                .map(c => ({
                                    id: `tab_${c.slug}`,
                                    label: c.name,
                                    type: 'category' as const,
                                    categorySlug: c.slug,
                                }))
                        ]
                    }
                };
                break;

            case 'html_widget':
                newBlock = {
                    id: newBlockId,
                    type: 'html_widget',
                    title: 'Custom HTML & CSS',
                    settings: {
                        containerWidth: 'boxed',
                        bgColor: '#ffffff',
                        html: '<div class="p-8 text-center bg-sky-50 rounded-2xl border border-sky-200">\n  <h2 class="text-2xl font-bold text-sky-900 mb-2">Custom HTML Widget</h2>\n  <p class="text-slate-600">You can add your custom HTML code and styling here.</p>\n</div>',
                        css: '/* Custom scoped CSS */\n',
                    }
                };
                break;

            case 'features':
                newBlock = {
                    id: newBlockId,
                    type: 'features',
                    title: 'Why Choose Us',
                    settings: {
                        sectionTag: 'Our Highlights',
                        sectionTitle: 'Why Choose Monologue Edu?',
                        sectionSub: 'We don\'t just deliver videos; we build conceptual mastery.',
                        items: [
                            { id: '1', icon: 'Award', title: 'Expert Faculty', desc: 'Lectures prepared under direct supervision of top university professors.' },
                            { id: '2', icon: 'HelpCircle', title: 'Dedicated Doubt Solving', desc: 'Ask questions directly beneath every lecture video.' },
                            { id: '3', icon: 'Clock', title: 'Mobile Friendly', desc: 'Smooth learning experience across phone, tablet, and PC.' },
                        ]
                    }
                };
                break;

            case 'cta_banner':
                newBlock = {
                    id: newBlockId,
                    type: 'cta_banner',
                    title: 'Call to Action Banner',
                    settings: {
                        badge: 'Enrollment Open',
                        title: 'Join Today to Achieve Your Dream Goal',
                        subtitle: 'Study alongside thousands of motivated learners on Bangladesh\'s premier education platform.',
                        buttonText: 'Explore Courses',
                        buttonLink: '/courses',
                        bgColor: 'sky',
                    }
                };
                break;

            case 'rich_text':
                newBlock = {
                    id: newBlockId,
                    type: 'rich_text',
                    title: 'Rich Content / Policy',
                    settings: {
                        content: '<h2>Write your heading here</h2>\n<p>Write your detailed article, terms, or policy guidelines here. Supports rich formatting and lists.</p>'
                    }
                };
                break;

            case 'video_embed':
                newBlock = {
                    id: newBlockId,
                    type: 'video_embed',
                    title: 'Video Embed',
                    settings: {
                        title: 'Introduction to Our Platform',
                        subtitle: 'See how Monologue Edu helps students excel',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    }
                };
                break;

            case 'stats_counter':
                newBlock = {
                    id: newBlockId,
                    type: 'stats_counter',
                    title: 'Stats Counter',
                    settings: {
                        stats: [
                            { label: 'Enrolled Students', value: '10,000+' },
                            { label: 'Video Lessons', value: '500+' },
                            { label: 'Total Courses', value: '20+' },
                            { label: 'Success Rate', value: '98%' },
                        ]
                    }
                };
                break;

            case 'top_announcement':
                newBlock = {
                    id: newBlockId,
                    type: 'top_announcement',
                    title: 'Campaign Ribbon',
                    settings: {
                        badge: 'স্পেশাল অফার',
                        text: 'HSC একাডেমিক সাইকেল ও অ্যাডমিশন মাস্টার ব্যাচে স্পেশাল ছাড়ে ভর্তি চলছে!',
                        linkText: 'সকল কোর্স দেখুন →',
                        linkUrl: '/courses',
                        bgColor: 'from-sky-700 via-sky-600 to-amber-500',
                    }
                };
                break;

            case 'heading':
                newBlock = {
                    id: newBlockId,
                    type: 'heading',
                    title: 'Heading',
                    settings: {
                        title: 'Your Headline Title Here',
                        subtitle: 'Category or Tagline',
                        tag: 'h2',
                        align: 'center',
                        size: '3xl',
                        color: '',
                    }
                };
                break;

            case 'button':
                newBlock = {
                    id: newBlockId,
                    type: 'button',
                    title: 'Call to Action Button',
                    settings: {
                        text: 'কোর্সগুলো দেখুন',
                        link: '/courses',
                        variant: 'gradient',
                        size: 'md',
                        align: 'center',
                        target: '_self',
                    }
                };
                break;

            case 'image':
                newBlock = {
                    id: newBlockId,
                    type: 'image',
                    title: 'Image Banner',
                    settings: {
                        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
                        alt: 'Banner image',
                        link: '',
                        caption: '',
                        rounded: '2xl',
                        align: 'center',
                        maxWidth: '100%',
                    }
                };
                break;

            case 'divider':
                newBlock = {
                    id: newBlockId,
                    type: 'divider',
                    title: 'Divider Line',
                    settings: {
                        width: '100%',
                        align: 'center',
                        style: 'solid',
                        color: '#e2e8f0',
                    }
                };
                break;

            case 'spacer':
                newBlock = {
                    id: newBlockId,
                    type: 'spacer',
                    title: 'Vertical Spacer',
                    settings: {
                        height: 40,
                    }
                };
                break;

            case 'bundle_showcase':
                newBlock = {
                    id: newBlockId,
                    type: 'bundle_showcase',
                    title: 'Course Bundles',
                    settings: {
                        sectionTag: 'স্পেশাল প্যাকেজ',
                        sectionTitle: 'জনপ্রিয় কোর্স বান্ডেল ও কম্বো',
                        sectionSub: 'একাধিক কোর্স একসাথে নিয়ে সেভ করুন সর্বোচ্চ ৫০% পর্যন্ত!',
                        limit: 4,
                    }
                };
                break;

            case 'teachers_showcase':
                newBlock = {
                    id: newBlockId,
                    type: 'teachers_showcase',
                    title: 'Faculty Mentors',
                    settings: {
                        sectionTag: 'মেন্টর প্যানেল',
                        sectionTitle: 'দেশসেরা শিক্ষকদের সাথে তোমার প্রস্তুতি',
                        sectionSub: 'বছরজুড়ে যাদের সঠিক দিকনির্দেশনা হাজারো শিক্ষার্থীকে পৌঁছাতে সাহায্য করেছে তাদের স্বপ্নের ক্যাম্পাসে।',
                        limit: 8,
                    }
                };
                break;

            case 'learning_path':
                newBlock = {
                    id: newBlockId,
                    type: 'learning_path',
                    title: 'Learning Path',
                    settings: {
                        sectionTag: 'লার্নিং মেথডোলজি',
                        sectionTitle: '৪ ধাপে শতভাগ প্রস্তুতি নিশ্চিত করার বৈজ্ঞানিক পদ্ধতি',
                        sectionSub: 'পরিকল্পিত উপায়ে কনসেপ্ট ক্লিয়ারিং থেকে পরীক্ষা জয়ের সম্পূর্ণ পথপ্রদর্শক।',
                        steps: [
                            { id: '1', num: '০১', title: 'বেসিক ও কনসেপ্ট ক্লিয়ারিং', desc: 'প্রতিটি থিওরি অ্যানিমেশন ও বাস্তব উদাহরণের সাহায্যে সুস্পষ্টভাবে ব্যাখ্যা।' },
                            { id: '2', num: '০২', title: 'টপিকভিত্তিক গাণিতিক প্র্যাকটিস', desc: 'বোর্ড ও শীর্ষ কলেজগুলোর বিগত বছরের প্রশ্নগুলোর পূর্ণাঙ্গ সমাধান।' },
                            { id: '3', num: '০৩', title: '২৪/৭ AI ডাউট সলভিং', desc: 'পড়ালেখার যেকোনো সময় আটকে গেলে তাৎক্ষণিক সমাধানের নিশ্চয়তা।' },
                            { id: '4', num: '০৪', title: 'লাইভ মডেল টেস্ট ও র‍্যাঙ্কিং', desc: 'টাইমারসহ রিয়েল এক্সাম এনভায়রনমেন্টে পরীক্ষা দিয়ে আত্মবিশ্বাস যাচাই।' },
                        ]
                    }
                };
                break;

            case 'testimonials':
                newBlock = {
                    id: newBlockId,
                    type: 'testimonials',
                    title: 'Student Testimonials',
                    settings: {
                        sectionTag: 'শিক্ষার্থীদের মতামত',
                        sectionTitle: 'সাফল্যের গল্পগুলো শুনুন শিক্ষার্থীদের মুখেই',
                        sectionSub: 'আমাদের শিক্ষার্থীদের সাফল্যের অনুভূতি ও বাস্তব অভিজ্ঞতা।',
                        items: [
                            { id: '1', name: 'তানভীর আহমেদ', role: 'বুয়েট \'২৩ ব্যাচ', rating: 5, quote: 'মনোলগ এডুর ফিজিক্স ও ম্যাথ ক্লাসগুলো আমার কনসেপ্ট পুরো পাল্টে দিয়েছে। বিশেষ করে ডাউট সলভিং সিস্টেম অতুলনীয়!' },
                            { id: '2', name: 'সাদিয়া আফরিন', role: 'ঢাকা মেডিকেল কলেজ', rating: 5, quote: 'অনলাইন এক্সাম সিস্টেমটা একদম রিয়েল পরীক্ষার ফিল দেয়। মেরিট পজিশন দেখে নিজের ভুলগুলো সহজে শুধরে নিয়েছি।' },
                            { id: '3', name: 'ফারহান কবির', role: 'নটর ডেম কলেজ, GPA 5', rating: 5, quote: 'লেকচার শিটগুলো এতটাই গোছানো যে বাড়তি কোনো বইয়ের সাহায্য ছাড়াই সম্পূর্ণ রিভিশন সম্ভব হয়েছে।' },
                        ]
                    }
                };
                break;

            case 'faq_accordion':
                newBlock = {
                    id: newBlockId,
                    type: 'faq_accordion',
                    title: 'FAQ Accordion',
                    settings: {
                        sectionTag: 'সচরাচর জিজ্ঞাসা',
                        sectionTitle: 'সাধারণ কিছু প্রশ্নের উত্তর',
                        sectionSub: 'কোর্স ভর্তি, ক্লাস ও পরীক্ষা সংক্রান্ত প্রয়োজনীয় তথ্য।',
                        items: [
                            { id: '1', q: 'মনোলগ এডু (Monologue Edu)-তে কোর্স কীভাবে কিনব বা ভর্তি হব?', a: 'যেকোনো কোর্সের কার্ডে থাকা "কোর্সটি কিনুন" বাটনে ক্লিক করুন। এরপর বিকাশ, নগদ বা রকেটের মাধ্যমে পেমেন্ট করে TrxID সাবমিট করলেই কোর্স সক্রিয় হবে।' },
                            { id: '2', q: 'লাইভ ক্লাস ছাড়াও কি রেকর্ডেড ক্লাস ও লেকচার শিট পাওয়া যাবে?', a: 'হ্যাঁ, প্রতিটি লাইভ ক্লাসের পর তা স্বয়ংক্রিয়ভাবে ফুল HD রেকর্ডেড আর্কাইভে জমা হয় যা পরীক্ষার শেষ দিন পর্যন্ত যতবার ইচ্ছা রিভিশন দেওয়া যায়।' },
                            { id: '3', q: 'NexPilot AI ডাউট সলভার কীভাবে পড়ালেখায় সাহায্য করে?', a: 'NexPilot হলো সম্পূর্ণ কারিকুলাম-সংযুক্ত ২৪/৭ এআই টিউটর। ক্লাসের পড়ালেখা বা সূত্রে আটকে গেলে সেকেন্ডের মধ্যে সমাধান পাওয়া যায়।' },
                        ]
                    }
                };
                break;
        }

        const newBlocks = [...blocks];
        if (typeof insertIndex === 'number') {
            newBlocks.splice(insertIndex, 0, newBlock);
        } else {
            newBlocks.push(newBlock);
        }
        setBlocks(newBlocks);
        setSelectedBlockId(newBlock.id);
        setActiveSidebarTab('inspector');
        showToast('Widget added');
    };

    /* Drag & Drop Event Handlers */
    const handleWidgetDragStart = (e: React.DragEvent, type: BlockType) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'widget', widgetType: type }));
        e.dataTransfer.effectAllowed = 'copy';
        setIsDragging(true);
        setDraggedWidgetType(type);
    };

    const handleBlockDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'block', blockIndex: index }));
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
        setDraggedBlockIndex(index);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDraggedWidgetType(null);
        setDraggedBlockIndex(null);
        setActiveDropZoneIndex(null);
    };

    const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = draggedWidgetType ? 'copy' : 'move';
        if (activeDropZoneIndex !== targetIndex) {
            setActiveDropZoneIndex(targetIndex);
        }
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedWidgetType) {
            handleAddBlock(draggedWidgetType, targetIndex);
            showToast('New widget placed!');
        } else if (draggedBlockIndex !== null) {
            if (draggedBlockIndex === targetIndex || draggedBlockIndex === targetIndex - 1) {
                handleDragEnd();
                return;
            }
            const newBlocks = [...blocks];
            const [moved] = newBlocks.splice(draggedBlockIndex, 1);
            const insertAt = draggedBlockIndex < targetIndex ? targetIndex - 1 : targetIndex;
            newBlocks.splice(insertAt, 0, moved);
            setBlocks(newBlocks);
            setSelectedBlockId(moved.id);
            showToast('Block position reordered!');
        }
        handleDragEnd();
    };

    const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === blocks.length - 1) return;

        const newBlocks = [...blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const [moved] = newBlocks.splice(index, 1);
        newBlocks.splice(targetIndex, 0, moved);
        setBlocks(newBlocks);
    };

    const handleDuplicateBlock = (index: number) => {
        const source = blocks[index];
        const clone: PageBlock = {
            ...JSON.parse(JSON.stringify(source)),
            id: `block_${source.type}_${Date.now()}`,
            title: `${source.title} (Copy)`,
        };
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, clone);
        setBlocks(newBlocks);
        setSelectedBlockId(clone.id);
        showToast('Widget duplicated');
    };

    const handleDeleteBlock = (index: number) => {
        if (!confirm('Are you sure you want to delete this widget?')) return;
        const newBlocks = [...blocks];
        const [removed] = newBlocks.splice(index, 1);
        setBlocks(newBlocks);
        if (selectedBlockId === removed.id) {
            setSelectedBlockId(newBlocks[0]?.id || null);
        }
        showToast('Widget deleted');
    };

    const handleUpdateSelectedSettings = (key: string, value: any) => {
        if (!selectedBlockId) return;
        setBlocks(prev => prev.map(b => {
            if (b.id !== selectedBlockId) return b;
            return {
                ...b,
                settings: {
                    ...b.settings,
                    [key]: value,
                }
            };
        }));
    };

    const selectedBlock = blocks.find(b => b.id === selectedBlockId);

    const publicUrl = page ? (page.slug === 'home' ? '/' : `/p/${page.slug}`) : '/';

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="text-sm font-bold">Loading visual builder...</div>
                </div>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="p-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h2 className="text-xl font-bold">Page not found</h2>
                <Link to="/admin/pages" className="inline-block px-4 py-2 bg-sky-600 text-white rounded-xl text-sm">
                    Back to pages list
                </Link>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
            {/* Global Page Custom CSS Injection */}
            {customCss && <style>{customCss}</style>}

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-20 right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-up">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}

            {/* ---------------- TOP BUILDER HEADER ---------------- */}
            <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 select-none">
                {/* Left: Back & Page Title */}
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/pages"
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Back to pages list"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>

                    <div className="h-5 w-px bg-slate-800" />

                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{page.title}</span>
                        <span className="text-xs text-slate-400 font-mono">({publicUrl})</span>
                        {page.is_system && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                System Page
                            </span>
                        )}
                    </div>
                </div>

                {/* Center: Responsive Viewport Switcher */}
                <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setDeviceView('desktop')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${deviceView === 'desktop' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        title="Desktop View (100%)"
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setDeviceView('tablet')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${deviceView === 'tablet' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        title="Tablet View (768px)"
                    >
                        <Tablet className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setDeviceView('mobile')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${deviceView === 'mobile' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        title="Mobile View (375px)"
                    >
                        <Smartphone className="w-4 h-4" />
                    </button>
                </div>

                {/* Right: Status, Preview & Save */}
                <div className="flex items-center gap-2.5">
                    {(page?.slug === 'home' || page?.slug === 'courses' || page?.is_system) && (
                        <button
                            type="button"
                            onClick={handleResetTemplate}
                            disabled={resetting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 text-xs font-bold border border-slate-700/60 hover:border-rose-800/60 transition-colors cursor-pointer"
                            title="Reset all sections to default layout"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-rose-400' : ''}`} />
                            <span>{resetting ? 'Resetting...' : 'Reset Template'}</span>
                        </button>
                    )}

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${status === 'published'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                            : 'bg-amber-950/60 text-amber-400 border-amber-800/80'
                            }`}
                    >
                        <option value="published" className="bg-slate-900 text-white">Published</option>
                        <option value="draft" className="bg-slate-900 text-white">Draft</option>
                    </select>

                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/60 transition-colors"
                        title="Preview in new tab"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview</span>
                    </a>

                    <button
                        type="button"
                        onClick={scrollToBottom}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-bold border border-slate-700/60 transition-colors cursor-pointer"
                        title="Scroll to bottom of canvas"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Scroll Down</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? 'Saving...' : 'Save (Ctrl+S)'}</span>
                    </button>
                </div>
            </header>

            {/* ---------------- MAIN WORKSPACE ---------------- */}
            <div className="flex-1 flex overflow-hidden min-h-0 h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)]">
                {/* ---------------- LEFT SIDEBAR PANEL ---------------- */}
                <aside
                    className={`${sidebarOpen ? 'w-[380px]' : 'w-0'
                        } transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden z-20 min-h-0`}
                >
                    {/* Sidebar Tabs */}
                    <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1.5 shrink-0">
                        <button
                            onClick={() => setActiveSidebarTab('widgets')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeSidebarTab === 'widgets'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Widgets</span>
                        </button>
                        <button
                            onClick={() => setActiveSidebarTab('inspector')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeSidebarTab === 'inspector'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Settings</span>
                        </button>
                        <button
                            onClick={() => setActiveSidebarTab('css')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeSidebarTab === 'css'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <Code className="w-3.5 h-3.5" />
                            <span>Page CSS</span>
                        </button>
                    </div>

                    {/* Sidebar Tab Content */}
                    <div className="flex-1 builder-sidebar-scroll p-4 space-y-4">
                        {/* TAB 1: WIDGETS DRAWER */}
                        {activeSidebarTab === 'widgets' && (
                            <div className="space-y-4">
                                {/* Search Input */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={widgetSearch}
                                        onChange={(e) => setWidgetSearch(e.target.value)}
                                        placeholder="Search widgets (e.g. Hero, Bundles, Button)..."
                                        className="w-full pl-8 pr-7 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                                    />
                                    {widgetSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setWidgetSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer w-4 h-4 flex items-center justify-center rounded-full bg-slate-800"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                <div className="p-2.5 bg-sky-950/50 border border-sky-800/60 rounded-xl text-[11px] text-sky-300 flex items-center gap-2">
                                    <GripVertical className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />
                                    <span><strong>Drag & Drop</strong> any widget onto canvas or click to append.</span>
                                </div>

                                {widgetSearch.trim() !== '' ? (
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Search Results ({WIDGET_CATALOG.filter(w => w.name.toLowerCase().includes(widgetSearch.toLowerCase()) || w.description.toLowerCase().includes(widgetSearch.toLowerCase())).length})
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {WIDGET_CATALOG.filter(w => w.name.toLowerCase().includes(widgetSearch.toLowerCase()) || w.description.toLowerCase().includes(widgetSearch.toLowerCase())).map((widget) => {
                                                const Icon = widget.icon;
                                                return (
                                                    <button
                                                        key={widget.type}
                                                        draggable={true}
                                                        onDragStart={(e) => handleWidgetDragStart(e, widget.type)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={() => handleAddBlock(widget.type)}
                                                        className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                                    >
                                                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                                        <div className={`w-7 h-7 rounded-lg ${widget.iconBg} ${widget.iconColor} flex items-center justify-center`}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-white group-hover:text-sky-400 truncate">{widget.name}</div>
                                                            <div className="text-[10px] text-slate-400 line-clamp-1">{widget.description}</div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    (['Basic', 'Pro & Marketing', 'Monologue LMS'] as const).map(category => {
                                        const categoryWidgets = WIDGET_CATALOG.filter(w => w.category === category);
                                        return (
                                            <div key={category} className="space-y-2 pt-1">
                                                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-1">
                                                    <span>{category}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                                                        {categoryWidgets.length}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {categoryWidgets.map((widget) => {
                                                        const Icon = widget.icon;
                                                        return (
                                                            <button
                                                                key={widget.type}
                                                                draggable={true}
                                                                onDragStart={(e) => handleWidgetDragStart(e, widget.type)}
                                                                onDragEnd={handleDragEnd}
                                                                onClick={() => handleAddBlock(widget.type)}
                                                                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                                            >
                                                                <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                                                <div className={`w-7 h-7 rounded-lg ${widget.iconBg} ${widget.iconColor} flex items-center justify-center`}>
                                                                    <Icon className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-bold text-white group-hover:text-sky-400 truncate">{widget.name}</div>
                                                                    <div className="text-[10px] text-slate-400 line-clamp-1">{widget.description}</div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* TAB 2: INSPECTOR / SETTINGS */}
                        {activeSidebarTab === 'inspector' && (
                            <div className="space-y-4">
                                {!selectedBlock ? (
                                    <div className="p-8 text-center text-slate-500 space-y-2">
                                        <Sliders className="w-8 h-8 text-slate-600 mx-auto" />
                                        <p className="text-xs font-bold">Click any widget on the canvas to configure</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Element Header */}
                                        <div className="pb-3 border-b border-slate-800 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-mono">
                                                    {selectedBlock.type}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-500 truncate max-w-[130px]">{selectedBlock.id}</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={selectedBlock.title || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? { ...b, title: val } : b));
                                                }}
                                                className="w-full bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:outline-none transition-colors"
                                                title="Rename section for easy organization"
                                            />
                                        </div>

                                        {/* Elementor Pro 3-Tab Inspector Bar */}
                                        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                                            <button
                                                type="button"
                                                onClick={() => setInspectorSubTab('content')}
                                                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${inspectorSubTab === 'content'
                                                    ? 'bg-sky-600 text-white shadow-xs'
                                                    : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                <span>Content</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInspectorSubTab('style')}
                                                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${inspectorSubTab === 'style'
                                                    ? 'bg-sky-600 text-white shadow-xs'
                                                    : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                <Palette className="w-3.5 h-3.5" />
                                                <span>Style</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInspectorSubTab('advanced')}
                                                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${inspectorSubTab === 'advanced'
                                                    ? 'bg-sky-600 text-white shadow-xs'
                                                    : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                <Code className="w-3.5 h-3.5" />
                                                <span>Advanced</span>
                                            </button>
                                        </div>

                                        {/* SUBTAB 1: CONTENT */}
                                        {inspectorSubTab === 'content' && (
                                            <div className="space-y-4">
                                                {/* --- 1. TOP ANNOUNCEMENT --- */}
                                                {selectedBlock.type === 'top_announcement' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Badge Text</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.badge || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('badge', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Message Text</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.text || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('text', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Link Text</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.linkText || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('linkText', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Link URL</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.linkUrl || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('linkUrl', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Background Gradient Class</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.bgColor || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('bgColor', e.target.value)}
                                                                placeholder="e.g. from-sky-700 via-sky-600 to-amber-500"
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 2. HERO BANNER --- */}
                                                {selectedBlock.type === 'hero' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Top Badge</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.badge || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('badge', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Title Part 1</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.titlePart1 || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('titlePart1', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Highlighted Text</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.titleHighlight || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('titleHighlight', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sky-400 font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Title Part 2</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.titlePart2 || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('titlePart2', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.subtitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('subtitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Primary Button</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.browseCoursesBtn || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('browseCoursesBtn', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Primary Link</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.browseCoursesLink || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('browseCoursesLink', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Secondary Button</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.startFreeClassBtn || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('startFreeClassBtn', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Secondary Link</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.startFreeClassLink || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('startFreeClassLink', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="pt-2 border-t border-slate-800 space-y-2">
                                                            <span className="text-[10px] font-bold uppercase text-slate-400">Trust Metrics</span>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.trust1 || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('trust1', e.target.value)}
                                                                placeholder="Trust 1 (e.g. 10,000+ Students)"
                                                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.trust2 || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('trust2', e.target.value)}
                                                                placeholder="Trust 2 (e.g. Lifetime Access)"
                                                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.trust3 || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('trust3', e.target.value)}
                                                                placeholder="Trust 3 (e.g. 24/7 Doubt Solving)"
                                                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 3. HEADING WIDGET --- */}
                                                {selectedBlock.type === 'heading' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Heading Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.title || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('title', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle / Tagline</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.subtitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('subtitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">HTML Tag</label>
                                                                <select
                                                                    value={selectedBlock.settings.tag || 'h2'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('tag', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                                >
                                                                    <option value="h1">H1</option>
                                                                    <option value="h2">H2</option>
                                                                    <option value="h3">H3</option>
                                                                    <option value="h4">H4</option>
                                                                    <option value="h5">H5</option>
                                                                    <option value="h6">H6</option>
                                                                    <option value="p">P (Paragraph)</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Size</label>
                                                                <select
                                                                    value={selectedBlock.settings.size || '3xl'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('size', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                                >
                                                                    <option value="sm">Small</option>
                                                                    <option value="md">Medium</option>
                                                                    <option value="lg">Large</option>
                                                                    <option value="xl">XL</option>
                                                                    <option value="2xl">2XL</option>
                                                                    <option value="3xl">3XL</option>
                                                                    <option value="4xl">4XL</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Alignment</label>
                                                                <select
                                                                    value={selectedBlock.settings.align || 'center'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('align', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="left">Left</option>
                                                                    <option value="center">Center</option>
                                                                    <option value="right">Right</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Color (optional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.color || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('color', e.target.value)}
                                                                    placeholder="#0284c7 or empty"
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 4. BUTTON WIDGET --- */}
                                                {selectedBlock.type === 'button' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Button Text</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.text || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('text', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Link URL</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.link || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('link', e.target.value)}
                                                                placeholder="/courses or https://..."
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Style Variant</label>
                                                                <select
                                                                    value={selectedBlock.settings.variant || 'gradient'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('variant', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                                >
                                                                    <option value="gradient">Sky Gradient</option>
                                                                    <option value="solid">Solid Sky</option>
                                                                    <option value="outline">Outline</option>
                                                                    <option value="dark">Dark Slate</option>
                                                                    <option value="light">Light White</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Size</label>
                                                                <select
                                                                    value={selectedBlock.settings.size || 'md'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('size', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                                >
                                                                    <option value="sm">Small</option>
                                                                    <option value="md">Medium</option>
                                                                    <option value="lg">Large</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Alignment</label>
                                                                <select
                                                                    value={selectedBlock.settings.align || 'center'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('align', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="left">Left</option>
                                                                    <option value="center">Center</option>
                                                                    <option value="right">Right</option>
                                                                    <option value="full">Full Width</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Open in New Tab</label>
                                                                <select
                                                                    value={selectedBlock.settings.target || '_self'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('target', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="_self">Same Tab (_self)</option>
                                                                    <option value="_blank">New Tab (_blank)</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 5. IMAGE WIDGET --- */}
                                                {selectedBlock.type === 'image' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Image URL</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.imageUrl || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('imageUrl', e.target.value)}
                                                                placeholder="https://... or /storage/..."
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                            />
                                                        </div>
                                                        {selectedBlock.settings.imageUrl && (
                                                            <div className="h-28 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                                                                <img
                                                                    src={selectedBlock.settings.imageUrl}
                                                                    alt="Preview"
                                                                    className="max-h-full max-w-full object-contain"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Alt Text</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.alt || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('alt', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Click Link (optional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.link || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('link', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Border Radius</label>
                                                                <select
                                                                    value={selectedBlock.settings.rounded || '2xl'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('rounded', e.target.value)}
                                                                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="none">None</option>
                                                                    <option value="md">Rounded MD</option>
                                                                    <option value="lg">Rounded LG</option>
                                                                    <option value="xl">Rounded XL</option>
                                                                    <option value="2xl">Rounded 2XL</option>
                                                                    <option value="full">Circle / Full</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Align</label>
                                                                <select
                                                                    value={selectedBlock.settings.align || 'center'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('align', e.target.value)}
                                                                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="left">Left</option>
                                                                    <option value="center">Center</option>
                                                                    <option value="right">Right</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Max Width</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.maxWidth || '100%'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('maxWidth', e.target.value)}
                                                                    placeholder="100% or 600px"
                                                                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Image Caption (optional)</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.caption || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('caption', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 6. DIVIDER WIDGET --- */}
                                                {selectedBlock.type === 'divider' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Style</label>
                                                                <select
                                                                    value={selectedBlock.settings.style || 'solid'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('style', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="solid">Solid</option>
                                                                    <option value="dashed">Dashed</option>
                                                                    <option value="dotted">Dotted</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Width</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.width || '100%'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('width', e.target.value)}
                                                                    placeholder="100% or 80px"
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Color</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.color || '#e2e8f0'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('color', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Align</label>
                                                                <select
                                                                    value={selectedBlock.settings.align || 'center'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('align', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="left">Left</option>
                                                                    <option value="center">Center</option>
                                                                    <option value="right">Right</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 7. SPACER WIDGET --- */}
                                                {selectedBlock.type === 'spacer' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="block text-slate-400 font-bold">Height (pixels)</label>
                                                                <span className="text-sky-400 font-bold">{selectedBlock.settings.height || 40}px</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="10"
                                                                max="200"
                                                                value={selectedBlock.settings.height || 40}
                                                                onChange={(e) => handleUpdateSelectedSettings('height', parseInt(e.target.value) || 40)}
                                                                className="w-full accent-sky-500 cursor-pointer"
                                                            />
                                                            <input
                                                                type="number"
                                                                value={selectedBlock.settings.height || 40}
                                                                onChange={(e) => handleUpdateSelectedSettings('height', parseInt(e.target.value) || 40)}
                                                                className="w-full mt-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 8. COURSE BUNDLES --- */}
                                                {selectedBlock.type === 'bundle_showcase' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Display Limit</label>
                                                            <input
                                                                type="number"
                                                                value={selectedBlock.settings.limit || 4}
                                                                onChange={(e) => handleUpdateSelectedSettings('limit', parseInt(e.target.value) || 4)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 9. TEACHERS SHOWCASE --- */}
                                                {selectedBlock.type === 'teachers_showcase' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Display Limit</label>
                                                            <input
                                                                type="number"
                                                                value={selectedBlock.settings.limit || 8}
                                                                onChange={(e) => handleUpdateSelectedSettings('limit', parseInt(e.target.value) || 8)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 10. LEARNING PATH --- */}
                                                {selectedBlock.type === 'learning_path' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>

                                                        {/* Steps Manager */}
                                                        <div className="pt-2 border-t border-slate-800 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-slate-300">Methodology Steps</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const steps = selectedBlock.settings.steps || [];
                                                                        const newStep = {
                                                                            id: String(Date.now()),
                                                                            num: `০${steps.length + 1}`,
                                                                            title: 'নতুন ধাপের শিরোনাম',
                                                                            desc: 'ধাপের বিস্তারিত বিবরণ লিখুন।'
                                                                        };
                                                                        handleUpdateSelectedSettings('steps', [...steps, newStep]);
                                                                    }}
                                                                    className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px]"
                                                                >
                                                                    + Add Step
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2 max-h-56 builder-sidebar-scroll pr-1">
                                                                {(selectedBlock.settings.steps || []).map((step: any, sIdx: number) => (
                                                                    <div key={step.id || sIdx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <input
                                                                                type="text"
                                                                                value={step.num || ''}
                                                                                onChange={(e) => {
                                                                                    const steps = [...(selectedBlock.settings.steps || [])];
                                                                                    steps[sIdx] = { ...steps[sIdx], num: e.target.value };
                                                                                    handleUpdateSelectedSettings('steps', steps);
                                                                                }}
                                                                                className="w-14 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sky-400 font-bold text-center"
                                                                                placeholder="০১"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const steps = [...(selectedBlock.settings.steps || [])];
                                                                                    steps.splice(sIdx, 1);
                                                                                    handleUpdateSelectedSettings('steps', steps);
                                                                                }}
                                                                                className="text-rose-400 hover:text-rose-300 p-1"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={step.title || ''}
                                                                            onChange={(e) => {
                                                                                const steps = [...(selectedBlock.settings.steps || [])];
                                                                                steps[sIdx] = { ...steps[sIdx], title: e.target.value };
                                                                                handleUpdateSelectedSettings('steps', steps);
                                                                            }}
                                                                            placeholder="Step Title"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-bold"
                                                                        />
                                                                        <textarea
                                                                            rows={2}
                                                                            value={step.desc || ''}
                                                                            onChange={(e) => {
                                                                                const steps = [...(selectedBlock.settings.steps || [])];
                                                                                steps[sIdx] = { ...steps[sIdx], desc: e.target.value };
                                                                                handleUpdateSelectedSettings('steps', steps);
                                                                            }}
                                                                            placeholder="Step Description"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300 text-[11px]"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 11. TESTIMONIALS --- */}
                                                {selectedBlock.type === 'testimonials' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>

                                                        {/* Testimonial Items Manager */}
                                                        <div className="pt-2 border-t border-slate-800 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-slate-300">Reviews & Quotes</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const items = selectedBlock.settings.items || [];
                                                                        const newItem = {
                                                                            id: String(Date.now()),
                                                                            name: 'শিক্ষার্থীর নাম',
                                                                            role: 'ব্যাচ / কলেজ',
                                                                            rating: 5,
                                                                            quote: 'মনোলগ এডুর সাথে পড়ার অভিজ্ঞতা অসাধারণ!'
                                                                        };
                                                                        handleUpdateSelectedSettings('items', [...items, newItem]);
                                                                    }}
                                                                    className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px]"
                                                                >
                                                                    + Add Review
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2 max-h-56 builder-sidebar-scroll pr-1">
                                                                {(selectedBlock.settings.items || []).map((item: any, iIdx: number) => (
                                                                    <div key={item.id || iIdx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-bold text-sky-400 text-[10px]">Review #{iIdx + 1}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const items = [...(selectedBlock.settings.items || [])];
                                                                                    items.splice(iIdx, 1);
                                                                                    handleUpdateSelectedSettings('items', items);
                                                                                }}
                                                                                className="text-rose-400 hover:text-rose-300 p-1"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-1.5">
                                                                            <input
                                                                                type="text"
                                                                                value={item.name || ''}
                                                                                onChange={(e) => {
                                                                                    const items = [...(selectedBlock.settings.items || [])];
                                                                                    items[iIdx] = { ...items[iIdx], name: e.target.value };
                                                                                    handleUpdateSelectedSettings('items', items);
                                                                                }}
                                                                                placeholder="Student Name"
                                                                                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-bold"
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                value={item.role || ''}
                                                                                onChange={(e) => {
                                                                                    const items = [...(selectedBlock.settings.items || [])];
                                                                                    items[iIdx] = { ...items[iIdx], role: e.target.value };
                                                                                    handleUpdateSelectedSettings('items', items);
                                                                                }}
                                                                                placeholder="Role / Institution"
                                                                                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300"
                                                                            />
                                                                        </div>
                                                                        <textarea
                                                                            rows={2}
                                                                            value={item.quote || ''}
                                                                            onChange={(e) => {
                                                                                const items = [...(selectedBlock.settings.items || [])];
                                                                                items[iIdx] = { ...items[iIdx], quote: e.target.value };
                                                                                handleUpdateSelectedSettings('items', items);
                                                                            }}
                                                                            placeholder="Student Quote"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300 text-[11px]"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 12. FAQ ACCORDION --- */}
                                                {selectedBlock.type === 'faq_accordion' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>

                                                        {/* FAQ Items Manager */}
                                                        <div className="pt-2 border-t border-slate-800 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-slate-300">Questions & Answers</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const items = selectedBlock.settings.items || [];
                                                                        const newItem = {
                                                                            id: String(Date.now()),
                                                                            q: 'আপনার নতুন প্রশ্ন লিখুন?',
                                                                            a: 'এখানে প্রশ্নের উত্তর সুস্পষ্টভাবে লিখুন।'
                                                                        };
                                                                        handleUpdateSelectedSettings('items', [...items, newItem]);
                                                                    }}
                                                                    className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px]"
                                                                >
                                                                    + Add FAQ
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2 max-h-56 builder-sidebar-scroll pr-1">
                                                                {(selectedBlock.settings.items || []).map((faq: any, fIdx: number) => (
                                                                    <div key={faq.id || fIdx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-bold text-sky-400 text-[10px]">Q#{fIdx + 1}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const items = [...(selectedBlock.settings.items || [])];
                                                                                    items.splice(fIdx, 1);
                                                                                    handleUpdateSelectedSettings('items', items);
                                                                                }}
                                                                                className="text-rose-400 hover:text-rose-300 p-1"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={faq.q || ''}
                                                                            onChange={(e) => {
                                                                                const items = [...(selectedBlock.settings.items || [])];
                                                                                items[fIdx] = { ...items[fIdx], q: e.target.value };
                                                                                handleUpdateSelectedSettings('items', items);
                                                                            }}
                                                                            placeholder="Question"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-bold"
                                                                        />
                                                                        <textarea
                                                                            rows={2}
                                                                            value={faq.a || ''}
                                                                            onChange={(e) => {
                                                                                const items = [...(selectedBlock.settings.items || [])];
                                                                                items[fIdx] = { ...items[fIdx], a: e.target.value };
                                                                                handleUpdateSelectedSettings('items', items);
                                                                            }}
                                                                            placeholder="Answer"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300 text-[11px]"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 13. FEATURES (WHY CHOOSE US) --- */}
                                                {selectedBlock.type === 'features' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>

                                                        {/* Feature Cards Manager */}
                                                        <div className="pt-2 border-t border-slate-800 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-slate-300">Feature Cards</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const items = selectedBlock.settings.items || [];
                                                                        const newItem = {
                                                                            id: String(Date.now()),
                                                                            icon: 'Award',
                                                                            title: 'নতুন সুবিধা',
                                                                            desc: 'সুবিধার বিস্তারিত বিবরণ লিখুন।'
                                                                        };
                                                                        handleUpdateSelectedSettings('items', [...items, newItem]);
                                                                    }}
                                                                    className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px]"
                                                                >
                                                                    + Add Card
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2 max-h-56 builder-sidebar-scroll pr-1">
                                                                {(selectedBlock.settings.items || []).map((feat: any, idx: number) => (
                                                                    <div key={feat.id || idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-bold text-sky-400 text-[10px]">Card #{idx + 1}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const items = [...(selectedBlock.settings.items || [])];
                                                                                    items.splice(idx, 1);
                                                                                    handleUpdateSelectedSettings('items', items);
                                                                                }}
                                                                                className="text-rose-400 hover:text-rose-300 p-1"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={feat.title || ''}
                                                                            onChange={(e) => {
                                                                                const items = [...(selectedBlock.settings.items || [])];
                                                                                items[idx] = { ...items[idx], title: e.target.value };
                                                                                handleUpdateSelectedSettings('items', items);
                                                                            }}
                                                                            placeholder="Card Title"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-bold"
                                                                        />
                                                                        <textarea
                                                                            rows={2}
                                                                            value={feat.desc || ''}
                                                                            onChange={(e) => {
                                                                                const items = [...(selectedBlock.settings.items || [])];
                                                                                items[idx] = { ...items[idx], desc: e.target.value };
                                                                                handleUpdateSelectedSettings('items', items);
                                                                            }}
                                                                            placeholder="Card Description"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300 text-[11px]"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 14. STATS COUNTER --- */}
                                                {selectedBlock.type === 'stats_counter' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-slate-300">Metrics Counters</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const stats = selectedBlock.settings.stats || [];
                                                                    handleUpdateSelectedSettings('stats', [
                                                                        ...stats,
                                                                        { label: 'Metric Name', value: '100+' }
                                                                    ]);
                                                                }}
                                                                className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px]"
                                                            >
                                                                + Add Metric
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2 max-h-56 builder-sidebar-scroll pr-1">
                                                            {(selectedBlock.settings.stats || []).map((stat: any, sIdx: number) => (
                                                                <div key={sIdx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-bold text-sky-400 text-[10px]">Counter #{sIdx + 1}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const stats = [...(selectedBlock.settings.stats || [])];
                                                                                stats.splice(sIdx, 1);
                                                                                handleUpdateSelectedSettings('stats', stats);
                                                                            }}
                                                                            className="text-rose-400 hover:text-rose-300 p-1"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={stat.value || ''}
                                                                            onChange={(e) => {
                                                                                const stats = [...(selectedBlock.settings.stats || [])];
                                                                                stats[sIdx] = { ...stats[sIdx], value: e.target.value };
                                                                                handleUpdateSelectedSettings('stats', stats);
                                                                            }}
                                                                            placeholder="Value (e.g. 10,000+)"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sky-400 font-bold"
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={stat.label || ''}
                                                                            onChange={(e) => {
                                                                                const stats = [...(selectedBlock.settings.stats || [])];
                                                                                stats[sIdx] = { ...stats[sIdx], label: e.target.value };
                                                                                handleUpdateSelectedSettings('stats', stats);
                                                                            }}
                                                                            placeholder="Label (e.g. Students)"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 15. CTA BANNER --- */}
                                                {selectedBlock.type === 'cta_banner' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Badge</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.badge || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('badge', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Headline</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.title || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('title', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.subtitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('subtitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Button Text</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.buttonText || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('buttonText', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Button Link</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.buttonLink || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('buttonLink', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Color Theme</label>
                                                            <select
                                                                value={selectedBlock.settings.bgColor || 'sky'}
                                                                onChange={(e) => handleUpdateSelectedSettings('bgColor', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            >
                                                                <option value="sky">Sky Blue</option>
                                                                <option value="indigo">Deep Indigo</option>
                                                                <option value="emerald">Emerald Green</option>
                                                                <option value="rose">Rose Red</option>
                                                                <option value="amber">Warm Amber</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 16. RICH TEXT --- */}
                                                {selectedBlock.type === 'rich_text' && (
                                                    <div className="space-y-3 text-xs">
                                                        <label className="block text-slate-400 font-bold mb-1 flex items-center justify-between">
                                                            <span>Content HTML</span>
                                                            <span className="text-[10px] text-amber-400">Supports HTML</span>
                                                        </label>
                                                        <textarea
                                                            rows={12}
                                                            value={selectedBlock.settings.content || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('content', e.target.value)}
                                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs leading-relaxed"
                                                        />
                                                    </div>
                                                )}

                                                {/* --- 17. VIDEO EMBED --- */}
                                                {selectedBlock.type === 'video_embed' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
                                                            ✨ Modern Plyr.js player with hidden branding and full controls.
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Video URL (YouTube / Vimeo / MP4)</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.videoUrl || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('videoUrl', e.target.value)}
                                                                placeholder="https://www.youtube.com/watch?v=..."
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.title || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('title', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.subtitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('subtitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 18. COURSE TABS --- */}
                                                {selectedBlock.type === 'course_tabs' && (
                                                    <div className="space-y-4 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Heading Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.headingTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('headingTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.headingTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('headingTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Course Display Limit</label>
                                                            <input
                                                                type="number"
                                                                value={selectedBlock.settings.limit || 12}
                                                                onChange={(e) => handleUpdateSelectedSettings('limit', parseInt(e.target.value) || 12)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>

                                                        {/* Category Selection in Builder */}
                                                        <div className="pt-2 border-t border-slate-800 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <label className="block text-slate-300 font-bold">Categories to Show</label>
                                                                <div className="flex items-center gap-2 text-[10px]">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const validCats = dbCategories.filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses');
                                                                            const allSlugs = validCats.map(c => c.slug);
                                                                            const newTabs = [
                                                                                { id: 'tab_all', label: selectedBlock.settings.allTabLabel || 'All Courses', type: 'category' as const, categorySlug: 'all' },
                                                                                ...validCats.map(c => ({
                                                                                    id: `tab_${c.slug}`,
                                                                                    label: c.name,
                                                                                    type: 'category' as const,
                                                                                    categorySlug: c.slug,
                                                                                }))
                                                                            ];
                                                                            handleUpdateSelectedSettings('selectedCategorySlugs', allSlugs);
                                                                            handleUpdateSelectedSettings('tabs', newTabs);
                                                                        }}
                                                                        className="text-sky-400 hover:text-sky-300 font-bold cursor-pointer"
                                                                    >
                                                                        Select All
                                                                    </button>
                                                                    <span className="text-slate-600">•</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleUpdateSelectedSettings('selectedCategorySlugs', []);
                                                                            handleUpdateSelectedSettings('tabs', [
                                                                                { id: 'tab_all', label: selectedBlock.settings.allTabLabel || 'All Courses', type: 'category' as const, categorySlug: 'all' }
                                                                            ]);
                                                                        }}
                                                                        className="text-slate-400 hover:text-slate-300 cursor-pointer"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1.5 max-h-48 builder-sidebar-scroll pr-1">
                                                                {dbCategories
                                                                    .filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses')
                                                                    .map(cat => {
                                                                        const currentSlugs: string[] = selectedBlock.settings.selectedCategorySlugs ||
                                                                            (selectedBlock.settings.tabs || [])
                                                                                .filter((t: CourseTabItem) => t.type === 'category' && t.categorySlug !== 'all')
                                                                                .map((t: CourseTabItem) => t.categorySlug as string);
                                                                        const isChecked = currentSlugs.includes(cat.slug);

                                                                        return (
                                                                            <label
                                                                                key={cat.id}
                                                                                className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${isChecked
                                                                                    ? 'bg-sky-950/40 border-sky-600 text-sky-200'
                                                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                                                                    }`}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isChecked}
                                                                                    onChange={() => {
                                                                                        const newSlugs = isChecked
                                                                                            ? currentSlugs.filter(s => s !== cat.slug)
                                                                                            : [...currentSlugs, cat.slug];

                                                                                        handleUpdateSelectedSettings('selectedCategorySlugs', newSlugs);

                                                                                        const currentTabs: CourseTabItem[] = selectedBlock.settings.tabs || [];
                                                                                        const allTab = currentTabs.find(t => t.categorySlug === 'all') || {
                                                                                            id: 'tab_all',
                                                                                            label: 'All Courses',
                                                                                            type: 'category' as const,
                                                                                            categorySlug: 'all',
                                                                                        };
                                                                                        const customHtmlTabs = currentTabs.filter(t => t.type === 'html');

                                                                                        const updatedCatTabs = dbCategories
                                                                                            .filter(c => newSlugs.includes(c.slug))
                                                                                            .map(c => {
                                                                                                const existing = currentTabs.find(t => t.categorySlug === c.slug);
                                                                                                return existing || {
                                                                                                    id: `tab_${c.slug}`,
                                                                                                    label: c.name,
                                                                                                    type: 'category' as const,
                                                                                                    categorySlug: c.slug,
                                                                                                };
                                                                                            });

                                                                                        handleUpdateSelectedSettings('tabs', [allTab, ...updatedCatTabs, ...customHtmlTabs]);
                                                                                    }}
                                                                                    className="rounded text-sky-500 focus:ring-sky-500"
                                                                                />
                                                                                <span className="truncate flex-1">{cat.name}</span>
                                                                                {cat.courses_count !== undefined && (
                                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                                                                        {cat.courses_count} course(s)
                                                                                    </span>
                                                                                )}
                                                                            </label>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>

                                                        {/* Tabs Configuration */}
                                                        <div className="pt-2 border-t border-slate-800 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <label className="block text-slate-300 font-bold">Manage Tabs</label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentTabs: CourseTabItem[] = selectedBlock.settings.tabs || [];
                                                                        const newTab: CourseTabItem = {
                                                                            id: `tab_${Date.now()}`,
                                                                            label: 'New Tab',
                                                                            type: 'category',
                                                                            categorySlug: 'all',
                                                                        };
                                                                        handleUpdateSelectedSettings('tabs', [...currentTabs, newTab]);
                                                                    }}
                                                                    className="px-2.5 py-1 bg-sky-600/80 hover:bg-sky-600 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                                                                >
                                                                    + Add Tab
                                                                </button>
                                                            </div>

                                                            <div className="space-y-3">
                                                                {(selectedBlock.settings.tabs || []).map((tab: CourseTabItem, tabIdx: number) => (
                                                                    <div key={tab.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-bold text-white text-[11px]">Tab #{tabIdx + 1}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const updated = [...selectedBlock.settings.tabs];
                                                                                    updated.splice(tabIdx, 1);
                                                                                    handleUpdateSelectedSettings('tabs', updated);
                                                                                }}
                                                                                className="text-rose-400 hover:text-rose-300"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>

                                                                        <div>
                                                                            <label className="block text-slate-400 text-[10px] mb-1">Tab Label</label>
                                                                            <input
                                                                                type="text"
                                                                                value={tab.label}
                                                                                onChange={(e) => {
                                                                                    const updated = [...selectedBlock.settings.tabs];
                                                                                    updated[tabIdx].label = e.target.value;
                                                                                    handleUpdateSelectedSettings('tabs', updated);
                                                                                }}
                                                                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label className="block text-slate-400 text-[10px] mb-1">Tab Type</label>
                                                                            <select
                                                                                value={tab.type}
                                                                                onChange={(e) => {
                                                                                    const updated = [...selectedBlock.settings.tabs];
                                                                                    updated[tabIdx].type = e.target.value as any;
                                                                                    handleUpdateSelectedSettings('tabs', updated);
                                                                                }}
                                                                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white font-bold"
                                                                            >
                                                                                <option value="category">Category Courses</option>
                                                                                <option value="html">Custom HTML Widget</option>
                                                                            </select>
                                                                        </div>

                                                                        {tab.type === 'category' ? (
                                                                            <div>
                                                                                <label className="block text-slate-400 text-[10px] mb-1">Category</label>
                                                                                <select
                                                                                    value={tab.categorySlug || 'all'}
                                                                                    onChange={(e) => {
                                                                                        const updated = [...selectedBlock.settings.tabs];
                                                                                        updated[tabIdx].categorySlug = e.target.value;
                                                                                        handleUpdateSelectedSettings('tabs', updated);
                                                                                    }}
                                                                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white font-bold"
                                                                                >
                                                                                    <option value="all">All Courses</option>
                                                                                    {dbCategories.map(cat => (
                                                                                        <option key={cat.id} value={cat.slug}>{cat.name} ({cat.slug})</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-2">
                                                                                <label className="block text-slate-400 text-[10px]">Custom HTML Code for this Tab</label>
                                                                                <textarea
                                                                                    rows={4}
                                                                                    value={tab.htmlContent || ''}
                                                                                    onChange={(e) => {
                                                                                        const updated = [...selectedBlock.settings.tabs];
                                                                                        updated[tabIdx].htmlContent = e.target.value;
                                                                                        handleUpdateSelectedSettings('tabs', updated);
                                                                                    }}
                                                                                    placeholder="<div>Custom content...</div>"
                                                                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white font-mono text-[11px]"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 19. HTML WIDGET --- */}
                                                {selectedBlock.type === 'html_widget' && (
                                                    <div className="space-y-4 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Container Width</label>
                                                            <select
                                                                value={selectedBlock.settings.containerWidth || 'boxed'}
                                                                onChange={(e) => handleUpdateSelectedSettings('containerWidth', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            >
                                                                <option value="boxed">Boxed (Centered Container)</option>
                                                                <option value="full">Full Width (100% Screen)</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Background Color</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.bgColor || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('bgColor', e.target.value)}
                                                                placeholder="#ffffff or transparent"
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                                                                <span>HTML Code</span>
                                                                <span className="text-[10px] text-amber-400">Live Rendered</span>
                                                            </label>
                                                            <textarea
                                                                rows={10}
                                                                value={selectedBlock.settings.html || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('html', e.target.value)}
                                                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono text-xs leading-relaxed focus:border-sky-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                                                                <span>Custom Scoped CSS</span>
                                                                <span className="text-[10px] text-sky-400">Styling</span>
                                                            </label>
                                                            <textarea
                                                                rows={6}
                                                                value={selectedBlock.settings.css || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('css', e.target.value)}
                                                                placeholder=".my-class { border-radius: 12px; }"
                                                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sky-300 font-mono text-xs leading-relaxed focus:border-sky-500"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* SUBTAB 2: STYLE */}
                                        {inspectorSubTab === 'style' && (
                                            <div className="space-y-4 text-xs">
                                                {/* Alignment */}
                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5">Alignment</label>
                                                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                                        {(['left', 'center', 'right'] as const).map(align => (
                                                            <button
                                                                key={align}
                                                                type="button"
                                                                onClick={() => handleUpdateSelectedSettings('textAlign', align)}
                                                                className={`py-1.5 capitalize rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedBlock.settings.textAlign === align
                                                                    ? 'bg-sky-600 text-white shadow-xs'
                                                                    : 'text-slate-400 hover:text-white'
                                                                    }`}
                                                            >
                                                                {align}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Background Color */}
                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5">Background Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={selectedBlock.settings.bgColor || '#ffffff'}
                                                            onChange={(e) => handleUpdateSelectedSettings('bgColor', e.target.value)}
                                                            className="w-8 h-8 rounded-lg bg-transparent border border-slate-700 cursor-pointer shrink-0"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.bgColor || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('bgColor', e.target.value)}
                                                            placeholder="#ffffff or transparent"
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Text Color */}
                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5">Text Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={selectedBlock.settings.textColor || '#0f172a'}
                                                            onChange={(e) => handleUpdateSelectedSettings('textColor', e.target.value)}
                                                            className="w-8 h-8 rounded-lg bg-transparent border border-slate-700 cursor-pointer shrink-0"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.textColor || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('textColor', e.target.value)}
                                                            placeholder="#0f172a or inherit"
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Padding Top & Bottom */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1.5">Padding Top (px)</label>
                                                        <input
                                                            type="number"
                                                            value={selectedBlock.settings.paddingTop ?? ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('paddingTop', e.target.value === '' ? undefined : parseInt(e.target.value))}
                                                            placeholder="e.g. 48"
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1.5">Padding Bottom (px)</label>
                                                        <input
                                                            type="number"
                                                            value={selectedBlock.settings.paddingBottom ?? ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('paddingBottom', e.target.value === '' ? undefined : parseInt(e.target.value))}
                                                            placeholder="e.g. 48"
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* SUBTAB 3: ADVANCED */}
                                        {inspectorSubTab === 'advanced' && (
                                            <div className="space-y-4 text-xs">
                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5">CSS Class Name</label>
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.settings.customClass || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('customClass', e.target.value)}
                                                        placeholder="my-custom-section"
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5">HTML Anchor / ID</label>
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.settings.htmlId || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('htmlId', e.target.value)}
                                                        placeholder="e.g. about-us"
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5 flex items-center justify-between">
                                                        <span>Scoped Widget CSS</span>
                                                        <span className="text-[10px] text-sky-400">Elementor Style</span>
                                                    </label>
                                                    <p className="text-[11px] text-slate-500 mb-2">
                                                        CSS written here applies only to this specific widget instance.
                                                    </p>
                                                    <textarea
                                                        rows={8}
                                                        value={selectedBlock.settings.scopedCss || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('scopedCss', e.target.value)}
                                                        placeholder={`/* Scoped CSS example: */\n.elementor-block-wrapper h2 { color: #0284c7; }`}
                                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sky-300 font-mono text-xs leading-relaxed focus:border-sky-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: PAGE GLOBAL CSS */}
                        {activeSidebarTab === 'css' && (
                            <div className="space-y-4 text-xs">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Global CSS for this Page
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Write any custom CSS rules here. They will automatically apply to both the live canvas and the published page.
                                </p>
                                <textarea
                                    rows={16}
                                    value={customCss}
                                    onChange={(e) => setCustomCss(e.target.value)}
                                    placeholder="/* Example: */&#10;.custom-title { color: #0284c7; }&#10;section { scroll-margin-top: 80px; }"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sky-400 font-mono text-xs leading-relaxed focus:border-sky-500"
                                />
                            </div>
                        )}
                    </div>
                </aside>

                {/* Sidebar Toggle Handle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="self-center -ml-3 z-30 w-6 h-12 bg-slate-800 hover:bg-sky-600 text-slate-400 hover:text-white rounded-r-lg border border-l-0 border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                >
                    {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
                </button>

                {/* ---------------- CENTER CANVAS AREA ---------------- */}
                <main
                    ref={mainCanvasRef}
                    tabIndex={0}
                    className="flex-1 min-h-0 h-full max-h-full bg-slate-950 builder-canvas-scroll p-4 sm:p-6 pb-64 flex flex-col items-center relative outline-none"
                >
                    {/* Responsive Frame Container */}
                    <div
                        className={`transition-all duration-300 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800 text-slate-900 ${deviceView === 'desktop'
                            ? 'w-full max-w-[1280px]'
                            : deviceView === 'tablet'
                                ? 'w-[768px]'
                                : 'w-[375px]'
                            }`}
                        style={{ minHeight: '800px' }}
                    >
                        {blocks.length === 0 ? (
                            <div
                                onDragOver={(e) => handleDragOver(e, 0)}
                                onDragLeave={() => setActiveDropZoneIndex(null)}
                                onDrop={(e) => handleDrop(e, 0)}
                                className={`py-32 text-center transition-all m-4 rounded-2xl border-2 border-dashed ${isDragging && activeDropZoneIndex === 0
                                    ? 'bg-sky-500/20 border-sky-500 ring-4 ring-sky-500/20 text-sky-600 scale-[1.01]'
                                    : 'border-slate-300 text-slate-400'
                                    }`}
                            >
                                <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700">
                                    {isDragging ? 'Drop widget here!' : 'No widgets added to this page yet'}
                                </h3>
                                <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                                    Drag and drop any widget from the left panel here, or click to add.
                                </p>
                                {!isDragging && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddBlock('hero')}
                                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md cursor-pointer hover:bg-sky-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Add Hero Banner</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="p-3 space-y-0">
                                {/* Drop Zone at Top (index 0) */}
                                <DropZone
                                    index={0}
                                    isDragging={isDragging}
                                    isActive={activeDropZoneIndex === 0}
                                    onDragOver={(e) => handleDragOver(e, 0)}
                                    onDragLeave={() => setActiveDropZoneIndex(null)}
                                    onDrop={(e) => handleDrop(e, 0)}
                                    onQuickAdd={() => handleAddBlock('html_widget', 0)}
                                />

                                {blocks.map((block, idx) => {
                                    const isSelected = selectedBlockId === block.id;
                                    const isBlockBeingDragged = draggedBlockIndex === idx;

                                    return (
                                        <React.Fragment key={block.id}>
                                            <div
                                                onClick={() => {
                                                    setSelectedBlockId(block.id);
                                                    setActiveSidebarTab('inspector');
                                                }}
                                                className={`relative group transition-all rounded-xl cursor-pointer ${isBlockBeingDragged
                                                    ? 'opacity-40 border-2 border-dashed border-sky-500 scale-[0.98]'
                                                    : isSelected
                                                        ? 'ring-3 ring-sky-500 ring-inset shadow-md'
                                                        : 'hover:outline hover:outline-2 hover:outline-sky-400/60'
                                                    }`}
                                            >
                                                {/* Hover / Active Block Toolbar */}
                                                <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-slate-900/95 backdrop-blur-xs text-white p-1 rounded-xl shadow-lg border border-slate-700 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    {/* Drag to Reorder Handle */}
                                                    <div
                                                        draggable={true}
                                                        onDragStart={(e) => handleBlockDragStart(e, idx)}
                                                        onDragEnd={handleDragEnd}
                                                        className="px-2 py-1 flex items-center gap-1 text-slate-300 hover:text-white cursor-grab active:cursor-grabbing rounded hover:bg-slate-800"
                                                        title="Drag to reorder"
                                                    >
                                                        <GripVertical className="w-3.5 h-3.5 text-sky-400" />
                                                        <span className="text-[10px] font-bold">Move</span>
                                                    </div>

                                                    <div className="h-3 w-px bg-slate-700" />

                                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                                                        {block.type}
                                                    </span>

                                                    <div className="h-3 w-px bg-slate-700" />

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, 'up'); }}
                                                        disabled={idx === 0}
                                                        className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                                                        title="Move Up"
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, 'down'); }}
                                                        disabled={idx === blocks.length - 1}
                                                        className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                                                        title="Move Down"
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedBlockId(block.id);
                                                            setActiveSidebarTab('inspector');
                                                        }}
                                                        className="p-1 rounded hover:bg-slate-800 cursor-pointer text-sky-400"
                                                        title="Edit Settings"
                                                    >
                                                        <Sliders className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(idx); }}
                                                        className="p-1 rounded hover:bg-slate-800 cursor-pointer"
                                                        title="Clone"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(idx); }}
                                                        className="p-1 rounded hover:bg-rose-900/50 text-rose-400 cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Live Rendered Block Content */}
                                                <PageBlockRenderer block={block} isBuilder={true} />
                                            </div>

                                            {/* Drop Zone after this block (index idx + 1) */}
                                            <DropZone
                                                index={idx + 1}
                                                isDragging={isDragging}
                                                isActive={activeDropZoneIndex === idx + 1}
                                                onDragOver={(e) => handleDragOver(e, idx + 1)}
                                                onDragLeave={() => setActiveDropZoneIndex(null)}
                                                onDrop={(e) => handleDrop(e, idx + 1)}
                                                onQuickAdd={() => handleAddBlock('html_widget', idx + 1)}
                                            />
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Floating Quick Navigation & Scroll Controller */}
                    <div className="fixed bottom-6 right-8 z-40 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl">
                        <button
                            type="button"
                            onClick={scrollToTop}
                            className="px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                            title="Scroll to Top (উপরে উঠুন)"
                        >
                            <ChevronUp className="w-4 h-4 text-sky-400" />
                            <span className="hidden sm:inline">Top</span>
                        </button>
                        <div className="w-px h-4 bg-slate-700" />
                        <span className="text-[11px] font-bold text-slate-400 px-1.5 hidden md:inline">
                            {blocks.length} Sections
                        </span>
                        <div className="w-px h-4 bg-slate-700 hidden md:block" />
                        <button
                            type="button"
                            onClick={scrollToBottom}
                            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-md shadow-sky-600/30"
                            title="Scroll to Bottom (নিচে নামুন)"
                        >
                            <ChevronDown className="w-4 h-4 animate-bounce" />
                            <span>Bottom</span>
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};