import React, { useState, useEffect } from 'react';
import { apiClient, formatBDT } from '../../api/client';
import { 
    Trash2, 
    RotateCcw, 
    BookOpen, 
    Boxes, 
    ClipboardList, 
    TicketPercent, 
    Search, 
    Loader2, 
    AlertTriangle,
    Layers,
    Calendar,
    Tag
} from 'lucide-react';

type TrashTab = 'courses' | 'bundles' | 'exams' | 'coupons';

export const AdminTrashPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TrashTab>(() => {
        const p = new URLSearchParams(window.location.search);
        const tab = p.get('tab') as TrashTab;
        return ['courses', 'bundles', 'exams', 'coupons'].includes(tab) ? tab : 'courses';
    });

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    useEffect(() => {
        fetchTrashItems();
    }, [activeTab, search]);

    const fetchTrashItems = async () => {
        try {
            setLoading(true);
            let url = '';
            const params: any = { status: 'trashed' };
            if (search.trim()) params.search = search.trim();

            if (activeTab === 'courses') {
                url = '/admin/courses';
            } else if (activeTab === 'bundles') {
                url = '/admin/bundles';
                params.per_page = 50;
            } else if (activeTab === 'exams') {
                url = '/exams';
            } else if (activeTab === 'coupons') {
                url = '/admin/coupons';
            }

            const res = await apiClient.get(url, { params });
            if (activeTab === 'coupons') {
                setItems(res.data.coupons?.data || []);
            } else if (activeTab === 'bundles') {
                const bList = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : (res.data?.bundles || []);
                setItems(bList);
            } else {
                setItems(res.data?.data || []);
            }
        } catch (err) {
            console.error('Failed to load trash items', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: number, title: string) => {
        try {
            setActionLoadingId(id);
            let url = '';
            if (activeTab === 'courses') url = `/admin/courses/${id}/restore`;
            else if (activeTab === 'bundles') url = `/admin/bundles/${id}/restore`;
            else if (activeTab === 'exams') url = `/exams/${id}/restore`;
            else if (activeTab === 'coupons') url = `/admin/coupons/${id}/restore`;

            await apiClient.post(url);
            setItems(prev => prev.filter(item => item.id !== id));
            alert(`"${title}" সফলভাবে পুনরুদ্ধার করা হয়েছে!`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'পুনরুদ্ধার করতে ব্যর্থ হয়েছে।');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleForceDelete = async (id: number, title: string) => {
        if (!window.confirm(`সতর্কতা: আপনি কি নিশ্চিতভাবে "${title}" স্থায়ীভাবে মুছে ফেলতে চান? এটি আর কখনোই পুনরুদ্ধার করা যাবে না!`)) {
            return;
        }

        try {
            setActionLoadingId(id);
            let url = '';
            if (activeTab === 'courses') url = `/admin/courses/${id}/force-delete`;
            else if (activeTab === 'bundles') url = `/admin/bundles/${id}/force-delete`;
            else if (activeTab === 'exams') url = `/exams/${id}/force-delete`;
            else if (activeTab === 'coupons') url = `/admin/coupons/${id}/force-delete`;

            await apiClient.delete(url);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.message || 'স্থায়ীভাবে মুছে ফেলতে ব্যর্থ হয়েছে।');
        } finally {
            setActionLoadingId(null);
        }
    };

    const tabConfig = [
        { id: 'courses' as TrashTab, label: 'কোর্স (Courses)', icon: BookOpen, color: 'text-indigo-600' },
        { id: 'bundles' as TrashTab, label: 'বান্ডেল (Bundles)', icon: Boxes, color: 'text-sky-600' },
        { id: 'exams' as TrashTab, label: 'পরীক্ষা (Exams)', icon: ClipboardList, color: 'text-purple-600' },
        { id: 'coupons' as TrashTab, label: 'কুপন (Coupons)', icon: TicketPercent, color: 'text-emerald-600' },
    ];

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <Trash2 className="w-7 h-7 text-rose-600" />
                        <span>রিসাইকেল বিন / ট্র্যাশ (Recycle Bin)</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        মুছে ফেলা কোর্স, বান্ডেল, পরীক্ষা ও কুপনগুলো এখানে সাময়িকভাবে সংরক্ষিত থাকে। এখান থেকে পুনরুদ্ধার (Restore) অথবা চিরতরে মুছে ফেলতে পারেন।
                    </p>
                </div>
            </div>

            {/* Trash Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                {tabConfig.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSearch('');
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shadow-xs'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ট্র্যাশের আইটেম সার্চ করুন..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500 dark:text-white"
                    />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    মোট পাওয়া গেছে: <span className="font-bold text-slate-800 dark:text-white">{items.length}</span>টি
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="py-4 px-6">আইটেমের বিবরণ</th>
                                <th className="py-4 px-4">মূল্য / তথ্য</th>
                                <th className="py-4 px-4">মুছে ফেলার সময়</th>
                                <th className="py-4 px-6 text-right">পদক্ষেপ (Actions)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
                                            <span>ট্র্যাশ লোড হচ্ছে...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                            <Trash2 className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                            <p className="font-bold text-slate-700 dark:text-slate-300">ট্র্যাশ সম্পূর্ণ খালি!</p>
                                            <p className="text-xs text-slate-500">এই বিভাগে বর্তমানে কোনো মুছে ফেলা আইটেম নেই।</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => {
                                    const title = item.title || item.code || `Item #${item.id}`;
                                    const deletedAt = item.deleted_at ? new Date(item.deleted_at).toLocaleString() : 'N/A';

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                            {/* Details */}
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                                                    {title}
                                                </div>
                                                {item.code && (
                                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold mt-1 inline-block">
                                                        Code: {item.code}
                                                    </span>
                                                )}
                                                {item.short_description && (
                                                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                                        {item.short_description}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Value / Info */}
                                            <td className="py-4 px-4 text-xs">
                                                {activeTab === 'coupons' && (
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {item.discount_type === 'percentage' ? `${item.discount_amount}% OFF` : `${formatBDT(item.discount_amount)} FLAT`}
                                                    </span>
                                                )}
                                                {activeTab === 'courses' && (
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {formatBDT(item.sale_price || item.price)}
                                                    </span>
                                                )}
                                                {activeTab === 'bundles' && (
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {formatBDT(item.sale_price || item.regular_price)}
                                                    </span>
                                                )}
                                                {activeTab === 'exams' && (
                                                    <div className="space-y-0.5 text-[11px] text-slate-500">
                                                        <div>পূর্ণমান: {item.total_marks}</div>
                                                        <div>সময়: {item.duration_minutes} মিনিট</div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Deleted Time */}
                                            <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{deletedAt}</span>
                                                </div>
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="py-4 px-6 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestore(item.id, title)}
                                                        disabled={actionLoadingId === item.id}
                                                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800 disabled:opacity-50"
                                                        title="পুনরুদ্ধার করুন (Restore)"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span>পুনরুদ্ধার</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleForceDelete(item.id, title)}
                                                        disabled={actionLoadingId === item.id}
                                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors cursor-pointer border border-rose-200 dark:border-rose-800 disabled:opacity-50"
                                                        title="স্থায়ীভাবে মুছে ফেলুন (Permanent Delete)"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>স্থায়ী মুছুন</span>
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
