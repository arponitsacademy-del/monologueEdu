import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Category } from '../../types';
import { 
    Tag, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    BookOpen, 
    AlertCircle, 
    CheckCircle2, 
    ExternalLink,
    Layers,
    FolderPlus,
    Hash
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const AdminCourseCategoriesPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Create / Edit Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formName, setFormName] = useState('');
    const [formSlug, setFormSlug] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [isCustomSlug, setIsCustomSlug] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Delete state
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/admin/categories');
            setCategories(data || []);
        } catch (err: any) {
            console.error('Failed to load categories', err);
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w -]+/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setFormName('');
        setFormSlug('');
        setFormDescription('');
        setIsCustomSlug(false);
        setFormError(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (cat: Category) => {
        setEditingCategory(cat);
        setFormName(cat.name);
        setFormSlug(cat.slug);
        setFormDescription(cat.description || '');
        setIsCustomSlug(true);
        setFormError(null);
        setModalOpen(true);
    };

    const handleNameChange = (val: string) => {
        setFormName(val);
        if (!isCustomSlug && !editingCategory) {
            setFormSlug(generateSlug(val));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!formName.trim()) {
            setFormError('Category name is required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formName.trim(),
                slug: formSlug.trim() || undefined,
                description: formDescription.trim() || null,
            };

            if (editingCategory) {
                const { data } = await apiClient.put(`/admin/categories/${editingCategory.id}`, payload);
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? data.category : c));
                setSuccessMessage('Category updated successfully!');
            } else {
                const { data } = await apiClient.post('/admin/categories', payload);
                setCategories(prev => [data.category, ...prev]);
                setSuccessMessage('New category created successfully!');
            }

            setModalOpen(false);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to save category.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (cat: Category) => {
        const confirmMsg = cat.courses_count && cat.courses_count > 0
            ? `Warning: "${cat.name}" category is currently linked to ${cat.courses_count} courses. Deleting it will unlink the courses. Are you sure?`
            : `Are you sure you want to delete "${cat.name}" category?`;

        if (!window.confirm(confirmMsg)) return;

        setDeletingId(cat.id);
        try {
            await apiClient.delete(`/admin/categories/${cat.id}`);
            setCategories(prev => prev.filter(c => c.id !== cat.id));
            setSuccessMessage(`"${cat.name}" category deleted successfully.`);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete category.');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.slug.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
    );

    const totalCoursesMapped = categories.reduce((acc, c) => acc + (c.courses_count || 0), 0);
    const activeCategoriesCount = categories.filter(c => (c.courses_count || 0) > 0).length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Tag className="w-7 h-7 text-sky-600" />
                        <span>Course Category Management</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Create and manage course categories including Free Courses, Paid Courses, Academic, or Admission.
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-600 text-white font-bold text-sm shadow-lg shadow-sky-600/30 hover:bg-sky-700 transition-all cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New Category</span>
                </button>
            </div>

            {/* Notification Alert */}
            {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <FolderPlus className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Categories</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">{categories.length}</div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Categories</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">{activeCategoriesCount}</div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Assignments</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">{totalCoursesMapped}</div>
                    </div>
                </div>
            </div>

            {/* Search Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="relative max-w-md w-full">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search category by name or slug..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
            </div>

            {/* Categories Table / Card Grid */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 space-y-3">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-sky-600" />
                        <p className="text-sm font-semibold">Loading categories...</p>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                            <Tag className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">No categories found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            {search ? 'No categories match your search criteria.' : 'No categories created yet. Click the button above to add a category.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-4 px-6">Category Name</th>
                                    <th className="py-4 px-6">URL Slug</th>
                                    <th className="py-4 px-6">Description</th>
                                    <th className="py-4 px-6 text-center">Courses Count</th>
                                    <th className="py-4 px-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                                {filteredCategories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-slate-900 flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                                                <span>{cat.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                                                <Hash className="w-3 h-3 text-slate-400" />
                                                {cat.slug}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 max-w-xs truncate text-xs text-slate-500">
                                            {cat.description || <span className="text-slate-300 italic">No description</span>}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                                (cat.courses_count || 0) > 0 
                                                    ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                <BookOpen className="w-3 h-3" />
                                                {cat.courses_count || 0} Courses
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <a
                                                    href={`/courses?category=${cat.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="View on website"
                                                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleOpenEdit(cat)}
                                                    title="Edit Category"
                                                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat)}
                                                    disabled={deletingId === cat.id}
                                                    title="Delete Category"
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingCategory ? 'Edit Category' : 'Create New Category'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="e.g. Free Courses, Paid Courses, HSC Physics"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                                URL Slug
                            </label>
                            <span className="text-[10px] text-slate-400 font-medium">Lowercase letters, numbers, hyphens</span>
                        </div>
                        <input
                            type="text"
                            value={formSlug}
                            onChange={(e) => {
                                setIsCustomSlug(true);
                                setFormSlug(e.target.value);
                            }}
                            placeholder="e.g. free-courses, hsc-physics"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Brief Description (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Enter a short description of this category..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <span>{saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
