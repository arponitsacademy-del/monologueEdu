import React, { useState, useEffect } from 'react';
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
    GripVertical
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

    // Sidebar state: 'widgets' | 'inspector' | 'css'
    const [activeSidebarTab, setActiveSidebarTab] = useState<'widgets' | 'inspector' | 'css'>('widgets');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Selected block for editing
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

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
                <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-up">
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
                <div className="flex items-center gap-3">
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
            <div className="flex-1 flex overflow-hidden">
                {/* ---------------- LEFT SIDEBAR PANEL ---------------- */}
                <aside
                    className={`${sidebarOpen ? 'w-[380px]' : 'w-0'
                        } transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden z-20`}
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
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                        {/* TAB 1: WIDGETS DRAWER */}
                        {activeSidebarTab === 'widgets' && (
                            <div className="space-y-4">
                                <div className="p-3 bg-sky-950/60 border border-sky-800/80 rounded-xl text-[11px] text-sky-300 flex items-center gap-2.5">
                                    <GripVertical className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
                                    <span><strong>Drag & Drop</strong> any widget onto the canvas, or click to append.</span>
                                </div>

                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Available Widgets
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        draggable={true}
                                        onDragStart={(e) => handleWidgetDragStart(e, 'html_widget')}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleAddBlock('html_widget')}
                                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                    >
                                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                            <Code className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">Custom HTML/CSS</div>
                                            <div className="text-[10px] text-slate-400">Raw code & custom design</div>
                                        </div>
                                    </button>

                                    <button
                                        draggable={true}
                                        onDragStart={(e) => handleWidgetDragStart(e, 'course_tabs')}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleAddBlock('course_tabs')}
                                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                    >
                                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                        <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">Course Tabs & Grid</div>
                                            <div className="text-[10px] text-slate-400">Category or custom tabs</div>
                                        </div>
                                    </button>

                                    <button
                                        draggable={true}
                                        onDragStart={(e) => handleWidgetDragStart(e, 'hero')}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleAddBlock('hero')}
                                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                    >
                                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">Hero Banner</div>
                                            <div className="text-[10px] text-slate-400">Title, buttons & cards</div>
                                        </div>
                                    </button>

                                    <button
                                        draggable={true}
                                        onDragStart={(e) => handleWidgetDragStart(e, 'features')}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleAddBlock('features')}
                                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                    >
                                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                            <Award className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">Why Choose Us</div>
                                            <div className="text-[10px] text-slate-400">Features & value points</div>
                                        </div>
                                    </button>

                                    <button
                                        draggable={true}
                                        onDragStart={(e) => handleWidgetDragStart(e, 'cta_banner')}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleAddBlock('cta_banner')}
                                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                    >
                                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                        <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">CTA Banner</div>
                                            <div className="text-[10px] text-slate-400">High-impact conversion box</div>
                                        </div>
                                    </button>

                                    <button
                                        draggable={true}
                                        onDragStart={(e) => handleWidgetDragStart(e, 'rich_text')}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleAddBlock('rich_text')}
                                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                    >
                                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">Content / Policy</div>
                                            <div className="text-[10px] text-slate-400">Headings & rich paragraphs</div>
                                        </div>
                                    </button>

                                    <button
                                        draggable={true}
                                        onDragStart={(e) => handleWidgetDragStart(e, 'video_embed')}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleAddBlock('video_embed')}
                                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                    >
                                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                        <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                                            <Video className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">Video Embed</div>
                                            <div className="text-[10px] text-slate-400">YouTube or Vimeo player</div>
                                        </div>
                                    </button>

                                    <button
                                        draggable={true}
                                        onDragStart={(e) => handleWidgetDragStart(e, 'stats_counter')}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleAddBlock('stats_counter')}
                                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                    >
                                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                        <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                                            <BarChart3 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">Stats Counter</div>
                                            <div className="text-[10px] text-slate-400">Animated metric counters</div>
                                        </div>
                                    </button>
                                </div>
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
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                                                    Widget Type: {selectedBlock.type}
                                                </span>
                                                <h3 className="font-bold text-sm text-white">{selectedBlock.title}</h3>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-500">{selectedBlock.id}</span>
                                        </div>

                                        {/* Dynamic Inspector Fields according to Block Type */}

                                        {/* --- 1. COURSE TABS SETTINGS --- */}
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

                                                {/* CATEGORY SELECTION IN BUILDER */}
                                                <div className="pt-2 border-t border-slate-800 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="block text-slate-300 font-bold">
                                                            Categories to Show
                                                        </label>
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

                                                    <p className="text-[11px] text-slate-400">
                                                        Only selected categories will appear in the tabs.
                                                    </p>

                                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
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

                                                                                // Auto rebuild tabs
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

                                                {/* TABS CONFIGURATION */}
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

                                        {/* --- 2. CUSTOM HTML WIDGET SETTINGS --- */}
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
                                                    <label className="block text-slate-400 font-bold mb-1">Background Color (HEX or CSS)</label>
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

                                        {/* --- 3. HERO SETTINGS --- */}
                                        {selectedBlock.type === 'hero' && (
                                            <div className="space-y-4 text-xs">
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
                                                    <label className="block text-slate-400 font-bold mb-1">Subtitle / Description</label>
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
                                                        <label className="block text-slate-400 font-bold mb-1">Button Link</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.browseCoursesLink || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('browseCoursesLink', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* --- 4. CTA BANNER SETTINGS --- */}
                                        {selectedBlock.type === 'cta_banner' && (
                                            <div className="space-y-4 text-xs">
                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1">Title</label>
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
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
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
                                            </div>
                                        )}

                                        {/* --- 5. RICH TEXT SETTINGS --- */}
                                        {selectedBlock.type === 'rich_text' && (
                                            <div className="space-y-4 text-xs">
                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1">Content HTML</label>
                                                    <textarea
                                                        rows={10}
                                                        value={selectedBlock.settings.content || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('content', e.target.value)}
                                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs leading-relaxed"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* --- 6. VIDEO EMBED SETTINGS --- */}
                                        {selectedBlock.type === 'video_embed' && (
                                            <div className="space-y-4 text-xs">
                                                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
                                                    ✨ YouTube links play inside modern Plyr.js with clean interface and hidden branding.
                                                </div>

                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1">Video URL (YouTube / Vimeo / MP4)</label>
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.settings.videoUrl || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('videoUrl', e.target.value)}
                                                        placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
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
                <main className="flex-1 bg-slate-950 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
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
                                                draggable={true}
                                                onDragStart={(e) => handleBlockDragStart(e, idx)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => {
                                                    setSelectedBlockId(block.id);
                                                    setActiveSidebarTab('inspector');
                                                }}
                                                className={`relative group transition-all rounded-xl overflow-hidden cursor-pointer ${isBlockBeingDragged
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
                </main>
            </div>
        </div>
    );
};