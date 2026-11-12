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
    Percent
} from 'lucide-react';

export const AdminBundlesPage: React.FC = () => {
    const [bundles, setBundles] = useState<CourseBundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
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
                    status: statusFilter ? statusFilter : undefined,
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
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Boxes className="w-7 h-7 text-sky-600" />
                        <span>Course Bundles</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Manage all course bundles, promotional package pricing, and bundled courses
                    </p>
                </div>
                <Link
                    to="/admin/bundles/create"
                    className="px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create New Bundle</span>
                </Link>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-md">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search bundles by name..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700"
                    >
                        <option value="">All Statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6">Bundle</th>
                                <th className="py-4 px-4">Included Courses</th>
                                <th className="py-4 px-4">Price</th>
                                <th className="py-4 px-4">Courses Count</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        Loading course bundles...
                                    </td>
                                </tr>
                            ) : bundles.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        No course bundles found.
                                    </td>
                                </tr>
                            ) : (
                                bundles.map((bundle) => {
                                    const regular = Number(bundle.regular_price) || 0;
                                    const sale = Number(bundle.sale_price) || 0;
                                    const savings = regular > sale && regular > 0 ? Math.round(((regular - sale) / regular) * 100) : 0;
                                    const included = bundle.courses || [];

                                    return (
                                        <tr key={bundle.id} className="hover:bg-slate-50/60 transition-colors">
                                            {/* Bundle Info */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-14 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                                                        {bundle.thumbnail ? (
                                                            <img 
                                                                src={bundle.thumbnail} 
                                                                alt={bundle.title} 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white bg-slate-800">
                                                                <Boxes className="w-5 h-5 text-sky-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="max-w-xs">
                                                        <h4 className="font-bold text-slate-900 text-sm truncate">{bundle.title}</h4>
                                                        <span className="text-[11px] text-slate-400 font-mono">/{bundle.slug}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Included Courses */}
                                            <td className="py-4 px-4">
                                                {included.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 max-w-[260px]">
                                                        {included.slice(0, 2).map((c) => (
                                                            <span
                                                                key={c.id}
                                                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 truncate max-w-[130px]"
                                                                title={c.title}
                                                            >
                                                                {c.title}
                                                            </span>
                                                        ))}
                                                        {included.length > 2 && (
                                                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">
                                                                +{included.length - 2} more
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">No courses added yet</span>
                                                )}
                                            </td>

                                            {/* Price */}
                                            <td className="py-4 px-4">
                                                <div>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="font-bold text-slate-900 text-sm">
                                                            {formatBDT(sale || regular)}
                                                        </span>
                                                        {regular > sale && regular > 0 && (
                                                            <span className="text-[11px] text-slate-400 line-through">
                                                                {formatBDT(regular)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {savings > 0 && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-50 text-rose-600 mt-0.5">
                                                            <Percent className="w-2.5 h-2.5" />
                                                            <span>Save {savings}%</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Courses Count */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                                                    <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                                                    <span>{included.length || bundle.courses_count || 0} Courses</span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-4">
                                                {bundle.status === 'published' ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                                        Published
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                                                        Draft
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <Link
                                                        to={`/admin/bundles/${bundle.id}/builder`}
                                                        title="Open Realtime Bundle Builder"
                                                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg flex items-center gap-1 text-xs transition-colors cursor-pointer"
                                                    >
                                                        <Wrench className="w-3.5 h-3.5" />
                                                        <span>Builder</span>
                                                    </Link>
                                                    <Link
                                                        to={`/admin/bundles/${bundle.id}/edit`}
                                                        title="Edit Bundle Details"
                                                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(bundle)}
                                                        disabled={deletingId === bundle.id}
                                                        title="Delete Bundle"
                                                        className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
