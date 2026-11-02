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
            className={`transition-all duration-200 relative z-30 ${
                isDragging
                    ? isActive
                        ? 'py-4 my-2'
                        : 'py-2 my-1'
                    : 'py-1 my-0'
            }`}
        >
            {isDragging ? (
                <div
                    className={`flex items-center justify-center rounded-xl border-2 border-dashed transition-all pointer-events-none ${
                        isActive
                            ? 'h-16 bg-sky-500/20 border-sky-500 text-sky-600 scale-[1.01] shadow-lg ring-4 ring-sky-500/20'
                            : 'h-7 bg-sky-50/50 border-sky-300 text-sky-500/70'
                    }`}
                >
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <Plus className={`w-4 h-4 ${isActive ? 'animate-bounce text-sky-600' : ''}`} />
                        <span>{isActive ? 'এখানে ড্রপ করুন (Drop Here)' : 'ড্রপ জোন'}</span>
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
                        <span>এখানে উইজেট যোগ করুন</span>
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
        } catch {}
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
            showToast('ডিজাইন সফলভাবে সংরক্ষিত হয়েছে!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'সংরক্ষণে সমস্যা হয়েছে।');
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
                        badge: 'নতুন ব্যাচে ভর্তি চলছে',
                        titlePart1: 'সেরা শিক্ষকদের সাথে',
                        titleHighlight: 'সহজ ও আকর্ষণীয়ভাবে',
                        titlePart2: 'পড়াশোনা ও পরীক্ষার প্রস্তুতি',
                        subtitle: 'আপনার পড়াশোনার যেকোনো ডাউট সমাধান ও সম্পূর্ণ গাইডলাইন নিয়ে আমরা আছি পাশে।',
                        browseCoursesBtn: 'সকল কোর্স দেখুন',
                        browseCoursesLink: '/courses',
                        startFreeClassBtn: 'ফ্রি ক্লাস শুরু করুন',
                        startFreeClassLink: '/courses',
                        trust1: '১০,০০০+ শিক্ষার্থী',
                        trust2: 'লাইফটাইম এক্সেস',
                        trust3: '২৪/৭ ডাউট সলভ',
                        cardBadge: 'লাইভ স্ট্যাটাস',
                        physicsTitle: 'এইচএসসি পদার্থবিজ্ঞান',
                        physicsSub: 'ভিডিও ও অধ্যায়ভিত্তিক নোট',
                        teachersTitle: 'অভিজ্ঞ শিক্ষক মণ্ডলী',
                        teachersSub: 'টপ বিশ্ববিদ্যালয় শিক্ষক',
                        studyMatTitle: 'স্টাডি ম্যাটেরিয়াল',
                        studyMatSub: 'হ্যান্ডনোট ও মডেল টেস্ট',
                        joinTodayBtn: 'আজই জয়েন করুন',
                    }
                };
                break;

            case 'course_tabs':
                newBlock = {
                    id: newBlockId,
                    type: 'course_tabs',
                    title: 'Course Tabs & Grid',
                    settings: {
                        headingTag: 'কোর্সসমূহ',
                        headingTitle: 'জনপ্রিয় প্রিমিয়াম ও স্পেশাল কোর্স',
                        viewAllText: 'সকল কোর্স',
                        viewAllLink: '/courses',
                        limit: 12,
                        showAllTab: true,
                        allTabLabel: 'সকল কোর্স',
                        dynamicCategories: false,
                        selectedCategorySlugs: dbCategories
                            .filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses')
                            .map(c => c.slug),
                        tabs: [
                            { id: 'tab_all', label: 'সকল কোর্স', type: 'category', categorySlug: 'all' },
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
                        html: '<div class="p-8 text-center bg-sky-50 rounded-2xl border border-sky-200">\n  <h2 class="text-2xl font-bold text-sky-900 mb-2">কাস্টম HTML উইজেট</h2>\n  <p class="text-slate-600">এখানে আপনি নিজের পছন্দমতো যেকোনো HTML কোড এবং নিচে CSS লিখে ডিজাইন করতে পারেন।</p>\n</div>',
                        css: '/* কাস্টম CSS কোড */\n',
                    }
                };
                break;

            case 'features':
                newBlock = {
                    id: newBlockId,
                    type: 'features',
                    title: 'Why Choose Us',
                    settings: {
                        sectionTag: 'আমাদের বিশেষত্ব',
                        sectionTitle: 'কেন Novonex Academy সেরা?',
                        sectionSub: 'আমরা শুধুমাত্র ভিডিও দিই না, নিশ্চিত করি প্রতিটি বিষয়ের গভীর ধারণা।',
                        items: [
                            { id: '1', icon: 'Award', title: 'অভিজ্ঞ শিক্ষক', desc: 'শীর্ষ বিশ্ববিদ্যালয়ের শিক্ষকগণের সরাসরি তত্ত্বাবধানে প্রস্তুত লেকচার।' },
                            { id: '2', icon: 'HelpCircle', title: 'ডাউট সলভিং', desc: 'প্রতিটি ক্লাসের নিচে সরাসরি প্রশ্ন করার সুযোগ।' },
                            { id: '3', icon: 'Clock', title: 'মোবাইল ফ্রেন্ডলি', desc: 'স্বচ্ছন্দে যেকোনো ডিভাইস থেকে ক্লাস করার সুবিধা।' },
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
                        badge: 'ভর্তি চলছে',
                        title: 'আজই যুক্ত হোন আপনার স্বপ্নের লক্ষ্যপূরণে',
                        subtitle: 'বাংলাদেশের সেরা অনলাইন এডুকেশন প্ল্যাটফর্মে হাজারো শিক্ষার্থীর সাথে পড়াশোনা শুরু করুন।',
                        buttonText: 'কোর্সসমূহ দেখুন',
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
                        content: '<h2>এখানে আপনার শিরোনাম লিখুন</h2>\n<p>এখানে বিস্তারিত প্যারাগ্রাফ বা বিষয়বস্তু লিখুন। আপনি যেকোনো ফরম্যাট বা বুলেট পয়েন্ট ব্যবহার করতে পারেন।</p>'
                    }
                };
                break;

            case 'video_embed':
                newBlock = {
                    id: newBlockId,
                    type: 'video_embed',
                    title: 'Video Embed',
                    settings: {
                        title: 'আমাদের পরিচিতি ভিডিও',
                        subtitle: 'Novonex Academy কিভাবে কাজ করে তা বিস্তারিত দেখুন',
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
                            { label: 'সন্তুষ্ট শিক্ষার্থী', value: '১০,০০০+' },
                            { label: 'রেকর্ডেড লেকচার', value: '৫০০+' },
                            { label: 'কোর্সসমূহ', value: '২০+' },
                            { label: 'সফলতার হার', value: '৯৮%' },
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
        showToast('উইজেট যোগ করা হয়েছে');
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
            showToast('নতুন উইজেট ড্রপ করে বসানো হয়েছে!');
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
            showToast('ব্লকের অবস্থান ড্রপ করে পরিবর্তন করা হয়েছে!');
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
        showToast('উইজেট ডুপ্লিকেট করা হয়েছে');
    };

    const handleDeleteBlock = (index: number) => {
        if (!confirm('আপনি কি এই উইজেটটি মুছে ফেলতে চান?')) return;
        const newBlocks = [...blocks];
        const [removed] = newBlocks.splice(index, 1);
        setBlocks(newBlocks);
        if (selectedBlockId === removed.id) {
            setSelectedBlockId(newBlocks[0]?.id || null);
        }
        showToast('উইজেট মুছে ফেলা হয়েছে');
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
                    <div className="text-sm font-bold">ভিজ্যুয়াল বিল্ডার লোড হচ্ছে...</div>
                </div>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="p-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h2 className="text-xl font-bold">পেজ পাওয়া যায়নি</h2>
                <Link to="/admin/pages" className="inline-block px-4 py-2 bg-sky-600 text-white rounded-xl text-sm">
                    পেজ তালিকায় ফিরে যান
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
                        title="পেজ তালিকায় ফিরে যান"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>

                    <div className="h-5 w-px bg-slate-800" />

                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{page.title}</span>
                        <span className="text-xs text-slate-400 font-mono">({publicUrl})</span>
                        {page.is_system && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                সিস্টেম পেজ
                            </span>
                        )}
                    </div>
                </div>

                {/* Center: Responsive Viewport Switcher */}
                <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setDeviceView('desktop')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            deviceView === 'desktop' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="ডেস্কটপ ভিউ (Desktop 100%)"
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setDeviceView('tablet')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            deviceView === 'tablet' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="ট্যাবলেট ভিউ (Tablet 768px)"
                    >
                        <Tablet className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setDeviceView('mobile')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            deviceView === 'mobile' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="মোবাইল ভিউ (Mobile 375px)"
                    >
                        <Smartphone className="w-4 h-4" />
                    </button>
                </div>

                {/* Right: Status, Preview & Save */}
                <div className="flex items-center gap-3">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            status === 'published' 
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' 
                                : 'bg-amber-950/60 text-amber-400 border-amber-800/80'
                        }`}
                    >
                        <option value="published" className="bg-slate-900 text-white">প্রকাশিত (Published)</option>
                        <option value="draft" className="bg-slate-900 text-white">ড্রাফট (Draft)</option>
                    </select>

                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/60 transition-colors"
                        title="নতুন ট্যাবে প্রিভিউ দেখুন"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>প্রিভিউ</span>
                    </a>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন (Ctrl+S)'}</span>
                    </button>
                </div>
            </header>

            {/* ---------------- MAIN WORKSPACE ---------------- */}
            <div className="flex-1 flex overflow-hidden">
                {/* ---------------- LEFT SIDEBAR PANEL ---------------- */}
                <aside 
                    className={`${
                        sidebarOpen ? 'w-[380px]' : 'w-0'
                    } transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden z-20`}
                >
                    {/* Sidebar Tabs */}
                    <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1.5 shrink-0">
                        <button
                            onClick={() => setActiveSidebarTab('widgets')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                activeSidebarTab === 'widgets'
                                    ? 'bg-sky-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>উইজেটস</span>
                        </button>
                        <button
                            onClick={() => setActiveSidebarTab('inspector')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                activeSidebarTab === 'inspector'
                                    ? 'bg-sky-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>সেটিংস / এডিটর</span>
                        </button>
                        <button
                            onClick={() => setActiveSidebarTab('css')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                activeSidebarTab === 'css'
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
                                    <span>যেকোনো উইজেট <strong>টেনে এনে (Drag & Drop)</strong> ক্যানভাসে ছাড়ুন, অথবা ক্লিক করুন।</span>
                                </div>

                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    উইজেটস তালিকা (Widgets)
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
                                            <div className="text-[10px] text-slate-400">র কোড ও নিজস্ব ডিজাইন</div>
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
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">কোর্স ট্যাব ও গ্রিড</div>
                                            <div className="text-[10px] text-slate-400">ক্যাটাগরি বা কাস্টম ট্যাব</div>
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
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">হিরো ব্যানার (Hero)</div>
                                            <div className="text-[10px] text-slate-400">টাইটেল, বাটন ও কার্ড</div>
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
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">ফিচার গ্রিড (Why Us)</div>
                                            <div className="text-[10px] text-slate-400">আইকন ও বিশেষত্ব কার্ড</div>
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
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">CTA ব্যানার</div>
                                            <div className="text-[10px] text-slate-400">হাই ইমপ্যাক্ট অফার বক্স</div>
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
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">কনটেন্ট / পলিসি টেক্সট</div>
                                            <div className="text-[10px] text-slate-400">হেডিং ও অনুচ্ছেদ</div>
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
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">ভিডিও এম্বেড</div>
                                            <div className="text-[10px] text-slate-400">ইউটিউব বা ভিমিও প্লেয়ার</div>
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
                                            <div className="text-xs font-bold text-white group-hover:text-sky-400">পরিসংখ্যান (Stats)</div>
                                            <div className="text-[10px] text-slate-400">কাউন্টার ও মেট্রিক বক্স</div>
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
                                        <p className="text-xs font-bold">ক্যানভাস থেকে যেকোনো উইজেটে ক্লিক করুন</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                                                    উইজেট টাইপ: {selectedBlock.type}
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
                                                    <label className="block text-slate-400 font-bold mb-1">হেডিং ট্যাগ (Tag)</label>
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.settings.headingTag || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('headingTag', e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1">মূল শিরোনাম (Title)</label>
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.settings.headingTitle || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('headingTitle', e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1">কোর্স সংখ্যা প্রদর্শন লিমিট</label>
                                                    <input
                                                        type="number"
                                                        value={selectedBlock.settings.limit || 12}
                                                        onChange={(e) => handleUpdateSelectedSettings('limit', parseInt(e.target.value) || 12)}
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                    />
                                                </div>

                                                {/* CATEGORY SELECTION IN BUILDER (Core User Request!) */}
                                                <div className="pt-2 border-t border-slate-800 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="block text-slate-300 font-bold">
                                                            প্রদর্শিত ক্যাটাগরি ফিল্টার (Categories to Show)
                                                        </label>
                                                        <div className="flex items-center gap-2 text-[10px]">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const validCats = dbCategories.filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses');
                                                                    const allSlugs = validCats.map(c => c.slug);
                                                                    const newTabs = [
                                                                        { id: 'tab_all', label: selectedBlock.settings.allTabLabel || 'সকল কোর্স', type: 'category' as const, categorySlug: 'all' },
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
                                                                সব সিলেক্ট
                                                            </button>
                                                            <span className="text-slate-600">•</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleUpdateSelectedSettings('selectedCategorySlugs', []);
                                                                    handleUpdateSelectedSettings('tabs', [
                                                                        { id: 'tab_all', label: selectedBlock.settings.allTabLabel || 'সকল কোর্স', type: 'category' as const, categorySlug: 'all' }
                                                                    ]);
                                                                }}
                                                                className="text-slate-400 hover:text-slate-300 cursor-pointer"
                                                            >
                                                                ক্লিয়ার
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className="text-[11px] text-slate-400">
                                                        নিচে যেসব ক্যাটাগরিতে টিক চিহ্ন দেবেন, শুধুমাত্র সেগুলোই পেজের ট্যাবে শো করবে।
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
                                                                        className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                                                                            isChecked
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
                                                                                    label: 'সকল কোর্স',
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
                                                                                {cat.courses_count} কোর্স
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                );
                                                            })}
                                                    </div>
                                                </div>

                                                {/* TABS CONFIGURATION (Core Request!) */}
                                                <div className="pt-2 border-t border-slate-800 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="block text-slate-300 font-bold">ট্যাবসমূহ পরিচালনা ও কাস্টমাইজেশন</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const currentTabs: CourseTabItem[] = selectedBlock.settings.tabs || [];
                                                                const newTab: CourseTabItem = {
                                                                    id: `tab_${Date.now()}`,
                                                                    label: 'নতুন ট্যাব',
                                                                    type: 'category',
                                                                    categorySlug: 'all',
                                                                };
                                                                handleUpdateSelectedSettings('tabs', [...currentTabs, newTab]);
                                                            }}
                                                            className="px-2.5 py-1 bg-sky-600/80 hover:bg-sky-600 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                                                        >
                                                            + ট্যাব যোগ করুন
                                                        </button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {(selectedBlock.settings.tabs || []).map((tab: CourseTabItem, tabIdx: number) => (
                                                            <div key={tab.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold text-white text-[11px]">ট্যাব #{tabIdx + 1}</span>
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

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="block text-slate-400 text-[10px] mb-1">ট্যাবের নাম (বাংলা)</label>
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
                                                                        <label className="block text-slate-400 text-[10px] mb-1">Tab Label (English - ঐচ্ছিক)</label>
                                                                        <input
                                                                            type="text"
                                                                            value={(tab as any).label_en || ''}
                                                                            onChange={(e) => {
                                                                                const updated = [...selectedBlock.settings.tabs];
                                                                                (updated[tabIdx] as any).label_en = e.target.value;
                                                                                handleUpdateSelectedSettings('tabs', updated);
                                                                            }}
                                                                            placeholder="ঐচ্ছিক"
                                                                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-slate-400 text-[10px] mb-1">ট্যাবের ধরন (Tab Type)</label>
                                                                    <select
                                                                        value={tab.type}
                                                                        onChange={(e) => {
                                                                            const updated = [...selectedBlock.settings.tabs];
                                                                            updated[tabIdx].type = e.target.value as any;
                                                                            handleUpdateSelectedSettings('tabs', updated);
                                                                        }}
                                                                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white font-bold"
                                                                    >
                                                                        <option value="category">কোর্স ক্যাটাগরি (Category Courses)</option>
                                                                        <option value="html">কাস্টম HTML উইজেট (Custom HTML)</option>
                                                                    </select>
                                                                </div>

                                                                {tab.type === 'category' ? (
                                                                    <div>
                                                                        <label className="block text-slate-400 text-[10px] mb-1">কোন ক্যাটাগরি দেখাবেন?</label>
                                                                        <select
                                                                            value={tab.categorySlug || 'all'}
                                                                            onChange={(e) => {
                                                                                const updated = [...selectedBlock.settings.tabs];
                                                                                updated[tabIdx].categorySlug = e.target.value;
                                                                                handleUpdateSelectedSettings('tabs', updated);
                                                                            }}
                                                                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white font-bold"
                                                                        >
                                                                            <option value="all">সকল কোর্স (All Courses)</option>
                                                                            {dbCategories.map(cat => (
                                                                                <option key={cat.id} value={cat.slug}>{cat.name} ({cat.slug})</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        <label className="block text-slate-400 text-[10px]">এই ট্যাবের জন্য কাস্টম HTML কোড</label>
                                                                        <textarea
                                                                            rows={4}
                                                                            value={tab.htmlContent || ''}
                                                                            onChange={(e) => {
                                                                                const updated = [...selectedBlock.settings.tabs];
                                                                                updated[tabIdx].htmlContent = e.target.value;
                                                                                handleUpdateSelectedSettings('tabs', updated);
                                                                            }}
                                                                            placeholder="<div>আপনার ডিজাইন...</div>"
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
                                                    <label className="block text-slate-400 font-bold mb-1">কন্টেইনার প্রস্থ (Width)</label>
                                                    <select
                                                        value={selectedBlock.settings.containerWidth || 'boxed'}
                                                        onChange={(e) => handleUpdateSelectedSettings('containerWidth', e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                    >
                                                        <option value="boxed">Boxed (মাঝখানে নির্দিষ্ট প্রস্থ)</option>
                                                        <option value="full">Full Width (সম্পূর্ণ স্ক্রিন)</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1">ব্যাকগ্রাউন্ড কালার (HEX বা CSS)</label>
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.settings.bgColor || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('bgColor', e.target.value)}
                                                        placeholder="#ffffff অথবা transparent"
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                                                        <span>HTML কোড</span>
                                                        <span className="text-[10px] text-amber-400">লাইভ রেন্ডার হবে</span>
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
                                                        <span>কাস্টম CSS কোড (Scoped)</span>
                                                        <span className="text-[10px] text-sky-400">স্টাইলিং</span>
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
                                                <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/40 text-[11px] text-sky-300">
                                                    💡 ইংরেজি ফিল্ড ঐচ্ছিক। ফাঁকা রাখলে মূল লেখাটিই বাংলা ও ইংরেজি উভয় মোডে প্রদর্শিত হবে।
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">টপ ব্যাজ (Badge)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.badge || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('badge', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">Badge (English Mode)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.badge_en || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('badge_en', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            placeholder="ঐচ্ছিক"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">টাইটেল ১ম অংশ (বাংলা)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.titlePart1 || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('titlePart1', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">Title Part 1 (English)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.titlePart1_en || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('titlePart1_en', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            placeholder="ঐচ্ছিক"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">রঙিন টেক্সট (বাংলা)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.titleHighlight || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('titleHighlight', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sky-400 font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">Highlight (English)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.titleHighlight_en || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('titleHighlight_en', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sky-400 font-bold"
                                                            placeholder="ঐচ্ছিক"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">টাইটেল ২য় অংশ (বাংলা)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.titlePart2 || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('titlePart2', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">Title Part 2 (English)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.titlePart2_en || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('titlePart2_en', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            placeholder="ঐচ্ছিক"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1">সাবটাইটেল / বিবরণ (বাংলা)</label>
                                                    <textarea
                                                        rows={2}
                                                        value={selectedBlock.settings.subtitle || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('subtitle', e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1">Subtitle (English Mode - ঐচ্ছিক)</label>
                                                    <textarea
                                                        rows={2}
                                                        value={selectedBlock.settings.subtitle_en || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('subtitle_en', e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                        placeholder="ঐচ্ছিক"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">১ম বাটন (বাংলা)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.browseCoursesBtn || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('browseCoursesBtn', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">১ম বাটন (English)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.browseCoursesBtn_en || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('browseCoursesBtn_en', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            placeholder="ঐচ্ছিক"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">১ম বাটন লিংক</label>
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
                                                <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/40 text-[11px] text-sky-300">
                                                    💡 ইংরেজি ফিল্ড ঐচ্ছিক। ফাঁকা রাখলে মূল লেখাটিই উভয় মোডে প্রদর্শিত হবে।
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">শিরোনাম (বাংলা)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.title || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('title', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">Title (English Mode)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.title_en || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('title_en', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            placeholder="ঐচ্ছিক"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">বিবরণ (বাংলা)</label>
                                                        <textarea
                                                            rows={2}
                                                            value={selectedBlock.settings.subtitle || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('subtitle', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">Subtitle (English Mode)</label>
                                                        <textarea
                                                            rows={2}
                                                            value={selectedBlock.settings.subtitle_en || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('subtitle_en', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            placeholder="ঐচ্ছিক"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">বাটন (বাংলা)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.buttonText || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('buttonText', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">Button (English)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.buttonText_en || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('buttonText_en', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            placeholder="ঐচ্ছিক"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">বাটন লিংক</label>
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
                                                    <label className="block text-slate-400 font-bold mb-1">কনটেন্ট HTML</label>
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
                                                    ✨ YouTube লিংক দিলে তা আধুনিক <strong>Plyr.js</strong> প্লেয়ারে প্লে হবে এবং YouTube-এর লিংক বা ব্র্যান্ডিং সম্পূর্ণরূপে গোপন রাখা হবে।
                                                </div>

                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1">ভিডিও লিংক (YouTube / Vimeo / MP4)</label>
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.settings.videoUrl || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('videoUrl', e.target.value)}
                                                        placeholder="https://www.youtube.com/watch?v=... বা https://youtu.be/..."
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">শিরোনাম (বাংলা)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.title || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('title', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">Title (English Mode)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.title_en || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('title_en', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            placeholder="ঐচ্ছিক (ফাঁকা রাখলে মূল শিরোনাম দেখাবে)"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">সাবটাইটেল (বাংলা)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.subtitle || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('subtitle', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1">Subtitle (English Mode)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.subtitle_en || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('subtitle_en', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            placeholder="ঐচ্ছিক"
                                                        />
                                                    </div>
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
                                    এই পুরো পেজের জন্য গ্লোবাল CSS
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    এখানে আপনি যেকোনো কাস্টম CSS ক্লাস ও স্টাইল লিখতে পারেন। এটি লাইভ ক্যানভাস এবং পাবলিশড পেজে স্বয়ংক্রিয়ভাবে কার্যকর হবে।
                                </p>
                                <textarea
                                    rows={16}
                                    value={customCss}
                                    onChange={(e) => setCustomCss(e.target.value)}
                                    placeholder="/* উদাহরণ: */&#10;.custom-title { color: #0284c7; }&#10;section { scroll-margin-top: 80px; }"
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
                    title={sidebarOpen ? 'সাইডবার লুকান' : 'সাইডবার দেখান'}
                >
                    {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
                </button>

                {/* ---------------- CENTER CANVAS AREA ---------------- */}
                <main className="flex-1 bg-slate-950 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
                    {/* Responsive Frame Container */}
                    <div 
                        className={`transition-all duration-300 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800 text-slate-900 ${
                            deviceView === 'desktop' 
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
                                className={`py-32 text-center transition-all m-4 rounded-2xl border-2 border-dashed ${
                                    isDragging && activeDropZoneIndex === 0
                                        ? 'bg-sky-500/20 border-sky-500 ring-4 ring-sky-500/20 text-sky-600 scale-[1.01]'
                                        : 'border-slate-300 text-slate-400'
                                }`}
                            >
                                <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700">
                                    {isDragging ? 'উইজেটটি এখানে ছেড়ে দিন (Drop Here)!' : 'এই পেজে এখনো কোনো উইজেট যোগ করা হয়নি'}
                                </h3>
                                <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                                    বামপাশের "উইজেটস" প্যানেল থেকে যেকোনো উইজেট টেনে এনে (Drag & Drop) এখানে ফেলুন, অথবা ক্লিক করে যোগ করুন।
                                </p>
                                {!isDragging && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddBlock('hero')}
                                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md cursor-pointer hover:bg-sky-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>হিরো ব্যানার যোগ করুন</span>
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
                                                className={`relative group transition-all rounded-xl overflow-hidden cursor-pointer ${
                                                    isBlockBeingDragged
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
                                                        title="টেনে যেকোনো স্থানে ড্রপ করুন (Drag to Reorder)"
                                                    >
                                                        <GripVertical className="w-3.5 h-3.5 text-sky-400" />
                                                        <span className="text-[10px] font-bold">সরান</span>
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
                                                        title="উপরে নিন"
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, 'down'); }}
                                                        disabled={idx === blocks.length - 1}
                                                        className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                                                        title="নিচে নিন"
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
                                                        title="এডিট সেটিংস"
                                                    >
                                                        <Sliders className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(idx); }}
                                                        className="p-1 rounded hover:bg-slate-800 cursor-pointer"
                                                        title="ক্লোন"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(idx); }}
                                                        className="p-1 rounded hover:bg-rose-900/50 text-rose-400 cursor-pointer"
                                                        title="মুছুন"
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
