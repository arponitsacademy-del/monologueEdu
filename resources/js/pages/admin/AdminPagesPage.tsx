import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { CustomPage, Category } from '../../types';
import { 
    Layers, 
    Plus, 
    Search, 
    Trash2, 
    ExternalLink, 
    Sparkles, 
    Copy, 
    Check, 
    AlertCircle, 
    FileText, 
    ShieldAlert,
    Eye,
    Sliders,
    RefreshCw,
    FolderCheck,
    Tag,
    BookOpen
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const AdminPagesPage: React.FC = () => {
    const navigate = useNavigate();

    const [pages, setPages] = useState<CustomPage[]>([]);
    const [stats, setStats] = useState({ 
        total: 0, 
        published: 0, 
        draft: 0, 
        category_pages: 0, 
        system_pages: 0 
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pageTypeFilter, setPageTypeFilter] = useState<'all' | 'system' | 'category' | 'custom'>('all');

    // Available categories in DB for category selection
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
    const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([]);
    const [syncingCategories, setSyncingCategories] = useState(false);

    // Create Modal
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [createSlug, setCreateSlug] = useState('');
    const [createTemplate, setCreateTemplate] = useState<'blank' | 'content' | 'home'>('blank');
    const [createStatus, setCreateStatus] = useState<'published' | 'draft'>('draft');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Edit Details Modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [editStatus, setEditStatus] = useState<'published' | 'draft'>('published');
    const [editMetaTitle, setEditMetaTitle] = useState('');
    const [editMetaDesc, setEditMetaDesc] = useState('');
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<CustomPage | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Toast
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fetchCategories = async () => {
        try {
            const res = await apiClient.get('/categories');
            const cats: Category[] = res.data || [];
            setAvailableCategories(cats.filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses'));
        } catch {}
    };

    const fetchPages = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (pageTypeFilter !== 'all') params.type = pageTypeFilter;

            const res = await apiClient.get('/admin/pages', { params });
            setPages(res.data.pages || []);
            setStats(res.data.stats || { 
                total: 0, 
                published: 0, 
                draft: 0, 
                category_pages: 0, 
                system_pages: 0 
            });
        } catch {
            // error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, [search, statusFilter, pageTypeFilter]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSyncCategories = async () => {
        setSyncingCategories(true);
        try {
            const res = await apiClient.post('/admin/pages/sync-categories');
            showToast(res.data?.message || 'All category pages synced successfully!');
            fetchPages();
            fetchCategories();
        } catch {
            showToast('Failed to sync category pages.');
        } finally {
            setSyncingCategories(false);
        }
    };

    // Handle Title change in create to auto-generate slug
    const handleTitleChange = (val: string) => {
        setCreateTitle(val);
        const autoSlug = val
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        setCreateSlug(autoSlug);
    };

    const handleCreatePage = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setCreateError('');
        try {
            const res = await apiClient.post('/admin/pages', {
                title: createTitle,
                slug: createSlug,
                template: createTemplate,
                status: createStatus,
            });
            setCreateModalOpen(false);
            setCreateTitle('');
            setCreateSlug('');
            showToast('New page created successfully!');
            fetchPages();

            if (res.data?.page?.id) {
                navigate(`/admin/pages/${res.data.page.id}/builder`);
            }
        } catch (err: any) {
            setCreateError(err.response?.data?.message || 'Failed to create page.');
        } finally {
            setCreating(false);
        }
    };

    const openEditModal = (page: CustomPage) => {
        setEditingPage(page);
        setEditTitle(page.title);
        setEditSlug(page.slug);
        setEditStatus(page.status);
        setEditMetaTitle(page.meta_title || '');
        setEditMetaDesc(page.meta_description || '');

        // Extract selectedCategorySlugs from course_tabs block
        const tabBlock = (page.blocks || []).find((b: any) => b.type === 'course_tabs');
        if (tabBlock?.settings?.selectedCategorySlugs && Array.isArray(tabBlock.settings.selectedCategorySlugs)) {
            setSelectedCategorySlugs(tabBlock.settings.selectedCategorySlugs);
        } else if (page.slug === 'courses') {
            setSelectedCategorySlugs(availableCategories.map(c => c.slug));
        } else if (page.layout_type === 'category') {
            const catSlug = page.slug.replace(/^category-/, '');
            setSelectedCategorySlugs([catSlug]);
        } else {
            setSelectedCategorySlugs([]);
        }

        setUpdateError('');
        setEditModalOpen(true);
    };

    const toggleCategorySelection = (catSlug: string) => {
        setSelectedCategorySlugs(prev => 
            prev.includes(catSlug)
                ? prev.filter(s => s !== catSlug)
                : [...prev, catSlug]
        );
    };

    const selectAllCategories = () => {
        setSelectedCategorySlugs(availableCategories.map(c => c.slug));
    };

    const clearAllCategories = () => {
        setSelectedCategorySlugs([]);
    };

    const handleUpdateDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPage) return;
        setUpdating(true);
        setUpdateError('');
        try {
            await apiClient.put(`/admin/pages/${editingPage.id}`, {
                title: editTitle,
                slug: editSlug,
                status: editStatus,
                blocks: editingPage.blocks,
                custom_css: editingPage.custom_css,
                meta_title: editMetaTitle,
                meta_description: editMetaDesc,
                selected_categories: selectedCategorySlugs,
            });
            setEditModalOpen(false);
            showToast('Page details and category filters updated successfully.');
            fetchPages();
        } catch (err: any) {
            setUpdateError(err.response?.data?.message || 'Failed to update page.');
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleStatus = async (page: CustomPage) => {
        try {
            await apiClient.post(`/admin/pages/${page.id}/toggle-status`);
            showToast(`'${page.title}' status changed.`);
            fetchPages();
        } catch {
            showToast('Failed to change status.');
        }
    };

    const handleDuplicate = async (page: CustomPage) => {
        try {
            await apiClient.post(`/admin/pages/${page.id}/duplicate`);
            showToast(`'${page.title}' cloned successfully.`);
            fetchPages();
        } catch {
            showToast('Failed to clone page.');
        }
    };

    const confirmDelete = (page: CustomPage) => {
        setPageToDelete(page);
        setDeleteModalOpen(true);
    };

    const handleDeletePage = async () => {
        if (!pageToDelete) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/admin/pages/${pageToDelete.id}`);
            setDeleteModalOpen(false);
            showToast('Page deleted successfully.');
            fetchPages();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete page.');
        } finally {
            setDeleting(false);
        }
    };

    const getPagePublicUrl = (slug: string) => {
        if (slug === 'home') return '/';
        if (slug === 'courses') return '/courses';
        if (slug.startsWith('category-')) {
            const catSlug = slug.replace(/^category-/, '');
            return `/courses?category=${catSlug}`;
        }
        return `/p/${slug}`;
    };

    const isCoursesOrCategoryPage = editingPage?.slug === 'courses' || 
        editingPage?.layout_type === 'category' ||
        (editingPage?.blocks || []).some((b: any) => b.type === 'course_tabs');

    return (
        <div className="space-y-6 pb-12">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-up">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}

            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Layers className="w-7 h-7 text-sky-600" />
                        <span>Pages & Visual Customizer</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Customize homepage, all courses, and category pages with the visual builder.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleSyncCategories}
                        disabled={syncingCategories}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                        title="Sync all database course categories as pages"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingCategories ? 'animate-spin text-sky-600' : 'text-slate-600'}`} />
                        <span>{syncingCategories ? 'Syncing...' : 'Sync Category Pages'}</span>
                    </button>

                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Page</span>
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by page name or slug..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>

                {/* Page Type Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    <button
                        onClick={() => setPageTypeFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            pageTypeFilter === 'all'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        All Pages ({stats.total})
                    </button>
                    <button
                        onClick={() => setPageTypeFilter('system')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            pageTypeFilter === 'system'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        System Pages ({stats.system_pages || 0})
                    </button>
                    <button
                        onClick={() => setPageTypeFilter('category')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            pageTypeFilter === 'category'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        Category Pages ({stats.category_pages || 0})
                    </button>
                    <button
                        onClick={() => setPageTypeFilter('custom')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            pageTypeFilter === 'custom'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        Custom Pages
                    </button>
                </div>
            </div>

            {/* Pages Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <span className="text-sm">Loading pages...</span>
                    </div>
                ) : pages.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 space-y-3">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                        <p className="font-bold text-base text-slate-700">No pages found</p>
                        <p className="text-xs text-slate-400">Click the sync button above to import category pages.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Page Name & Slug</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Blocks</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pages.map((page) => {
                                    const publicUrl = getPagePublicUrl(page.slug);
                                    const isCatPage = page.layout_type === 'category' || page.slug.startsWith('category-');
                                    return (
                                        <tr key={page.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 text-base">
                                                                {page.title}
                                                            </span>
                                                            {page.is_system && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                                                    System Page
                                                                </span>
                                                            )}
                                                            {isCatPage && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                                                    Category Page
                                                                </span>
                                                            )}
                                                        </div>
                                                        <a
                                                            href={publicUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 hover:underline mt-0.5"
                                                        >
                                                            <span>{publicUrl}</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                    page.is_system 
                                                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                                        : isCatPage
                                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {page.is_system ? 'System' : isCatPage ? 'Category' : 'Custom'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(page)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                                        page.status === 'published'
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                                    }`}
                                                    title="Click to toggle status"
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        page.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`} />
                                                    <span>{page.status === 'published' ? 'Published' : 'Draft'}</span>
                                                </button>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                    {Array.isArray(page.blocks) ? page.blocks.length : 0} blocks
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Primary Builder Button */}
                                                    <Link
                                                        to={`/admin/pages/${page.id}/builder`}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-xs hover:from-sky-700 hover:to-indigo-700 shadow-sm shadow-sky-600/30 transition-all cursor-pointer"
                                                        title="Open Visual Builder"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        <span>Builder</span>
                                                    </Link>

                                                    {/* Edit Settings */}
                                                    <button
                                                        onClick={() => openEditModal(page)}
                                                        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                                        title="Edit page details and categories"
                                                    >
                                                        <Sliders className="w-4 h-4" />
                                                    </button>

                                                    {/* Clone */}
                                                    <button
                                                        onClick={() => handleDuplicate(page)}
                                                        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                                        title="Clone / Duplicate"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete (disabled for system pages) */}
                                                    {!page.is_system ? (
                                                        <button
                                                            onClick={() => confirmDelete(page)}
                                                            className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                                            title="Delete page"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <span 
                                                            className="p-2 rounded-xl text-slate-300 cursor-not-allowed" 
                                                            title="System pages cannot be deleted"
                                                        >
                                                            <Trash2 className="w-4 h-4 opacity-40" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Page Modal */}
            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Create New Page"
                maxWidth="md"
            >
                <form onSubmit={handleCreatePage} className="space-y-4">
                    {createError && (
                        <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{createError}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Page Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={createTitle}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="e.g. Physics Special Batch"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            URL Slug <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-3 text-xs font-mono text-slate-400">/p/</span>
                            <input
                                type="text"
                                required
                                value={createSlug}
                                onChange={(e) => setCreateSlug(e.target.value)}
                                placeholder="physics-special"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Use lowercase letters, numbers, and hyphens (-) only.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Starter Template
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setCreateTemplate('blank')}
                                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                                    createTemplate === 'blank'
                                        ? 'border-sky-500 bg-sky-50/50 text-sky-900 ring-2 ring-sky-500/20'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                <div className="font-bold text-xs mb-0.5">Blank Page</div>
                                <div className="text-[11px] text-slate-500">Add widgets from scratch</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCreateTemplate('content')}
                                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                                    createTemplate === 'content'
                                        ? 'border-sky-500 bg-sky-50/50 text-sky-900 ring-2 ring-sky-500/20'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                <div className="font-bold text-xs mb-0.5">Content / Policy</div>
                                <div className="text-[11px] text-slate-500">Banner and text blocks</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCreateTemplate('home')}
                                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                                    createTemplate === 'home'
                                        ? 'border-sky-500 bg-sky-50/50 text-sky-900 ring-2 ring-sky-500/20'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                <div className="font-bold text-xs mb-0.5">Homepage Template</div>
                                <div className="text-[11px] text-slate-500">Hero, courses, and features</div>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Status
                        </label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                <input
                                    type="radio"
                                    name="createStatus"
                                    value="draft"
                                    checked={createStatus === 'draft'}
                                    onChange={() => setCreateStatus('draft')}
                                    className="text-sky-600 focus:ring-sky-500"
                                />
                                <span>Draft</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                <input
                                    type="radio"
                                    name="createStatus"
                                    value="published"
                                    checked={createStatus === 'published'}
                                    onChange={() => setCreateStatus('published')}
                                    className="text-sky-600 focus:ring-sky-500"
                                />
                                <span>Published</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(false)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-6 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 shadow-md shadow-sky-600/30 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {creating ? 'Creating...' : 'Create & Open Builder'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Details & Category Selection Modal */}
            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Page Details & Category Filters"
                maxWidth="lg"
            >
                <form onSubmit={handleUpdateDetails} className="space-y-4">
                    {updateError && (
                        <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{updateError}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Page Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                URL Slug
                            </label>
                            <input
                                type="text"
                                required
                                disabled={editingPage?.is_system && ['home', 'courses'].includes(editingPage?.slug || '')}
                                value={editSlug}
                                onChange={(e) => setEditSlug(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white disabled:opacity-60"
                            />
                            {editingPage?.is_system && ['home', 'courses'].includes(editingPage?.slug || '') && (
                                <p className="text-[11px] text-amber-600 mt-1">System page slug cannot be modified.</p>
                            )}
                        </div>
                    </div>

                    {/* Category Selector Section for Courses / Category Pages */}
                    {isCoursesOrCategoryPage && (
                        <div className="p-4 bg-gradient-to-br from-sky-50 to-indigo-50/60 rounded-2xl border border-sky-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-sky-600" />
                                    <label className="block text-xs font-bold text-slate-800">
                                        Categories to Show in Tabs
                                    </label>
                                </div>
                                <div className="flex items-center gap-2 text-[11px]">
                                    <button
                                        type="button"
                                        onClick={selectAllCategories}
                                        className="text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-slate-300">•</span>
                                    <button
                                        type="button"
                                        onClick={clearAllCategories}
                                        className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Choose which categories to display in the tab bar.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-52 overflow-y-auto scrollbar-thin">
                                {availableCategories.map((cat) => {
                                    const isChecked = selectedCategorySlugs.includes(cat.slug);
                                    return (
                                        <label
                                            key={cat.id}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                                isChecked
                                                    ? 'bg-white border-sky-500 text-sky-900 shadow-xs ring-2 ring-sky-500/20'
                                                    : 'bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleCategorySelection(cat.slug)}
                                                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                                            />
                                            <div className="flex-1 truncate">
                                                <span>{cat.name}</span>
                                                <span className="block text-[10px] font-mono text-slate-400 truncate">{cat.slug}</span>
                                            </div>
                                            {cat.courses_count !== undefined && cat.courses_count > 0 && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    {cat.courses_count} course(s)
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Status
                            </label>
                            <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as any)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Meta Title (SEO)
                            </label>
                            <input
                                type="text"
                                value={editMetaTitle}
                                onChange={(e) => setEditMetaTitle(e.target.value)}
                                placeholder="Title shown in search engines"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Meta Description (SEO)
                        </label>
                        <textarea
                            rows={3}
                            value={editMetaDesc}
                            onChange={(e) => setEditMetaDesc(e.target.value)}
                            placeholder="Brief page summary..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setEditModalOpen(false)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={updating}
                            className="px-6 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 shadow-md shadow-sky-600/30 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {updating ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Confirm Page Deletion"
                maxWidth="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete the page <span className="font-bold text-slate-900">"{pageToDelete?.title}"</span>? All design blocks and content will be permanently lost.
                    </p>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeletePage}
                            disabled={deleting}
                            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md shadow-rose-600/30 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {deleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};