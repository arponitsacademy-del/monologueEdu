import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { CourseBundle } from '../../types';
import { 
    Boxes, 
    Plus, 
    Search, 
    Wrench, 
    Edit, 
    Trash2, 
    BookOpen, 
    Tag, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Loader2,
    Eye,
    Percent
} from 'lucide-react';

export const AdminBundlesPage: React.FC = () => {
    const [bundles, setBundles] = useState<CourseBundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchBundles();
    }, [search, statusFilter]);

    const fetchBundles = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/admin/bundles', {
                params: {
                    search: search || undefined,
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    per_page: 50,
                }
            });
            const bundleList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : (data?.bundles || []);
            setBundles(bundleList);
        } catch (err) {
            console.error('Failed to fetch course bundles:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (bundle: CourseBundle) => {
        if (!confirm(`Are you sure you want to delete bundle "${bundle.title}"? Included courses will not be deleted.`)) {
            return;
        }

        setDeletingId(bundle.id);
        try {
            await apiClient.delete(`/admin/bundles/${bundle.id}`);
            setBundles(prev => prev.filter(b => b.id !== bundle.id));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete course bundle.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Boxes className="w-7 h-7 text-sky-600" />
                        <span>Course Bundles</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Group multiple courses together into packaged bundles with promotional package pricing.
                    </p>
                </div>

                <Link
                    to="/admin/bundles/create"
                    className="self-start sm:self-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New Bundle</span>
                </Link>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search bundles by name..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                    />
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {(['all', 'published', 'draft'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                                statusFilter === tab
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                    <span className="text-sm font-semibold">Loading course bundles...</span>
                </div>
            ) : bundles.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Boxes className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                        <h3 className="text-base font-bold text-slate-900">No Bundles Found</h3>
                        <p className="text-xs text-slate-500">
                            {search ? 'No course bundles matched your search criteria.' : 'Create your first course bundle package to sell multiple courses together with a discount.'}
                        </p>
                    </div>
                    <Link
                        to="/admin/bundles/create"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-sky-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Bundle</span>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bundles.map((bundle) => {
                        const regular = Number(bundle.regular_price) || 0;
                        const sale = Number(bundle.sale_price) || 0;
                        const savings = regular > sale && regular > 0 ? Math.round(((regular - sale) / regular) * 100) : 0;

                        return (
                            <div 
                                key={bundle.id} 
                                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
                            >
                                {/* Thumbnail / Banner */}
                                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                    {bundle.thumbnail ? (
                                        <img 
                                            src={bundle.thumbnail} 
                                            alt={bundle.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-gradient-to-tr from-slate-100 to-sky-50">
                                            <Boxes className="w-8 h-8 text-sky-400" />
                                            <span className="text-[11px] font-semibold">Course Bundle</span>
                                        </div>
                                    )}

                                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs ${
                                            bundle.status === 'published' 
                                                ? 'bg-emerald-600 text-white' 
                                                : 'bg-amber-500 text-white'
                                        }`}>
                                            {bundle.status}
                                        </span>

                                        {savings > 0 && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white shadow-xs flex items-center gap-1">
                                                <Percent className="w-2.5 h-2.5" />
                                                <span>Save {savings}%</span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-xs font-bold flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                                        <span>{bundle.courses?.length || bundle.courses_count || 0} Courses</span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors">
                                            {bundle.title}
                                        </h3>
                                        {bundle.short_description && (
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {bundle.short_description}
                                            </p>
                                        )}

                                        {/* Included Courses Pills */}
                                        {bundle.courses && bundle.courses.length > 0 && (
                                            <div className="pt-2 flex flex-wrap gap-1">
                                                {bundle.courses.slice(0, 3).map(c => (
                                                    <span 
                                                        key={c.id} 
                                                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 truncate max-w-[140px]"
                                                        title={c.title}
                                                    >
                                                        {c.title}
                                                    </span>
                                                ))}
                                                {bundle.courses.length > 3 && (
                                                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">
                                                        +{bundle.courses.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pricing & Footer Actions */}
                                    <div className="pt-3 border-t border-slate-100 space-y-3">
                                        <div className="flex items-baseline justify-between">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-base font-black text-slate-900">
                                                    {formatBDT(sale)}
                                                </span>
                                                {regular > sale && (
                                                    <span className="text-xs text-slate-400 line-through">
                                                        {formatBDT(regular)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <Link
                                                to={`/admin/bundles/${bundle.id}/builder`}
                                                className="py-2 px-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                                title="Open Interactive Realtime Bundle Builder"
                                            >
                                                <Wrench className="w-3.5 h-3.5" />
                                                <span>Builder</span>
                                            </Link>

                                            <Link
                                                to={`/admin/bundles/${bundle.id}/edit`}
                                                className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                                title="Edit Bundle Details"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                                <span>Edit</span>
                                            </Link>

                                            <button
                                                onClick={() => handleDelete(bundle)}
                                                disabled={deletingId === bundle.id}
                                                className="py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                                                title="Delete Bundle"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                            </button>
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

