import React, { useState, useEffect } from 'react';
import { apiClient, formatBDT } from '../../api/client';
import { 
    TicketPercent, 
    Plus, 
    Search, 
    Filter, 
    Copy, 
    Check, 
    Edit2, 
    Trash2, 
    Users, 
    BookOpen, 
    Calendar, 
    AlertCircle, 
    CheckCircle2, 
    Sparkles, 
    X, 
    Loader2, 
    Clock, 
    Tag, 
    ChevronDown, 
    User as UserIcon,
    Phone,
    TrendingUp,
    FolderKanban
} from 'lucide-react';

interface CourseOption {
    id: number;
    title: string;
    price: number;
    effective_price?: number;
    category_id?: number;
}

interface CategoryOption {
    id: number;
    name: string;
    slug: string;
}

interface UserOption {
    id: number;
    name: string;
    phone: string;
    email: string;
    role: string;
}

interface CouponItem {
    id: number;
    code: string;
    title: string;
    description?: string | null;
    discount_type: 'fixed' | 'percentage';
    discount_amount: number;
    max_discount_amount?: number | null;
    min_order_amount?: number | null;
    scope_type: 'all' | 'course' | 'category';
    user_restriction_type: 'all' | 'specific';
    restricted_user_id?: number | null;
    restricted_user?: UserOption | null;
    usage_limit?: number | null;
    usage_limit_per_user: number;
    times_used: number;
    start_date?: string | null;
    expiry_date?: string | null;
    is_active: boolean;
    courses?: { id: number; title: string }[];
    categories?: { id: number; name: string }[];
    usages_count?: number;
    created_at: string;
}

interface CouponStats {
    total_coupons: number;
    active_coupons: number;
    total_redemptions: number;
    total_discount_given: number;
}

export const AdminCouponsPage: React.FC = () => {
    const [coupons, setCoupons] = useState<CouponItem[]>([]);
    const [stats, setStats] = useState<CouponStats>({
        total_coupons: 0,
        active_coupons: 0,
        total_redemptions: 0,
        total_discount_given: 0,
    });
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [discountTypeFilter, setDiscountTypeFilter] = useState('');
    const [scopeFilter, setScopeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Available courses and categories for dropdowns
    const [allCourses, setAllCourses] = useState<CourseOption[]>([]);
    const [allCategories, setAllCategories] = useState<CategoryOption[]>([]);

    // Form fields
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        discount_type: 'fixed' as 'fixed' | 'percentage',
        discount_amount: '' as string | number,
        max_discount_amount: '' as string | number,
        min_order_amount: '' as string | number,
        scope_type: 'all' as 'all' | 'course' | 'category',
        course_ids: [] as number[],
        category_ids: [] as number[],
        user_restriction_type: 'all' as 'all' | 'specific',
        restricted_user_id: null as number | null,
        usage_limit: '' as string | number,
        usage_limit_per_user: 1 as number,
        start_date: '',
        expiry_date: '',
        is_active: true,
    });

    // User live search state
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<UserOption[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

    useEffect(() => {
        fetchCoupons();
        fetchCoursesAndCategories();
    }, [page, discountTypeFilter, scopeFilter, statusFilter]);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const params: any = { page };
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (discountTypeFilter) params.discount_type = discountTypeFilter;
            if (scopeFilter) params.scope_type = scopeFilter;
            if (statusFilter) params.status = statusFilter;

            const res = await apiClient.get('/admin/coupons', { params });
            setCoupons(res.data.coupons.data || []);
            setLastPage(res.data.coupons.last_page || 1);
            if (res.data.stats) {
                setStats(res.data.stats);
            }
        } catch (err) {
            console.error('Failed to load coupons', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCoursesAndCategories = async () => {
        try {
            const res = await apiClient.get('/admin/coupons/courses-and-categories');
            setAllCourses(res.data.courses || []);
            setAllCategories(res.data.categories || []);
        } catch (err) {
            console.error('Failed to load courses & categories', err);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchCoupons();
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleToggleStatus = async (couponId: number) => {
        try {
            const res = await apiClient.post(`/admin/coupons/${couponId}/toggle-status`);
            setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, is_active: res.data.is_active } : c));
        } catch (err) {
            console.error('Failed to toggle coupon status', err);
        }
    };

    const handleDeleteCoupon = async (coupon: CouponItem) => {
        if (!window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;

        try {
            await apiClient.delete(`/admin/coupons/${coupon.id}`);
            setCoupons(prev => prev.filter(c => c.id !== coupon.id));
        } catch (err) {
            alert('Failed to delete coupon.');
        }
    };

    // User search debounced effect
    useEffect(() => {
        if (!userSearchTerm || userSearchTerm.trim().length < 2) {
            setUserSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchingUsers(true);
                const res = await apiClient.get('/admin/coupons/search-users', {
                    params: { q: userSearchTerm.trim() }
                });
                setUserSearchResults(res.data.users || []);
            } catch (err) {
                console.error('User search failed', err);
            } finally {
                setSearchingUsers(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [userSearchTerm]);

    const handleOpenCreateModal = () => {
        setEditingCoupon(null);
        setFormData({
            code: '',
            title: '',
            description: '',
            discount_type: 'fixed',
            discount_amount: '',
            max_discount_amount: '',
            min_order_amount: '',
            scope_type: 'all',
            course_ids: [],
            category_ids: [],
            user_restriction_type: 'all',
            restricted_user_id: null,
            usage_limit: '',
            usage_limit_per_user: 1,
            start_date: '',
            expiry_date: '',
            is_active: true,
        });
        setSelectedUser(null);
        setUserSearchTerm('');
        setUserSearchResults([]);
        setFormError(null);
        setModalOpen(true);
    };

    const handleOpenEditModal = (coupon: CouponItem) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            title: coupon.title,
            description: coupon.description || '',
            discount_type: coupon.discount_type,
            discount_amount: coupon.discount_amount,
            max_discount_amount: coupon.max_discount_amount || '',
            min_order_amount: coupon.min_order_amount || '',
            scope_type: coupon.scope_type,
            course_ids: coupon.courses?.map(c => c.id) || [],
            category_ids: coupon.categories?.map(c => c.id) || [],
            user_restriction_type: coupon.user_restriction_type,
            restricted_user_id: coupon.restricted_user_id || null,
            usage_limit: coupon.usage_limit || '',
            usage_limit_per_user: coupon.usage_limit_per_user || 1,
            start_date: coupon.start_date ? coupon.start_date.substring(0, 16) : '',
            expiry_date: coupon.expiry_date ? coupon.expiry_date.substring(0, 16) : '',
            is_active: coupon.is_active,
        });
        setSelectedUser(coupon.restricted_user || null);
        setUserSearchTerm('');
        setUserSearchResults([]);
        setFormError(null);
        setModalOpen(true);
    };

    const generateRandomCode = () => {
        const prefixes = ['SAVE', 'MONO', 'SPECIAL', 'PROMO', 'OFFER'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const randomNum = Math.floor(100 + Math.random() * 900);
        setFormData(prev => ({ ...prev, code: `${prefix}${randomNum}` }));
    };

    const handleSaveCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!formData.code.trim()) {
            setFormError('Please provide a coupon code.');
            return;
        }

        if (!formData.title.trim()) {
            setFormError('Please provide a coupon title/description.');
            return;
        }

        if (!formData.discount_amount || Number(formData.discount_amount) <= 0) {
            setFormError('Please enter a valid discount amount.');
            return;
        }

        if (formData.user_restriction_type === 'specific' && !formData.restricted_user_id) {
            setFormError('Please search and select a specific student/user.');
            return;
        }

        if (formData.scope_type === 'course' && formData.course_ids.length === 0) {
            setFormError('Please select at least one course.');
            return;
        }

        if (formData.scope_type === 'category' && formData.category_ids.length === 0) {
            setFormError('Please select at least one course category.');
            return;
        }

        try {
            setSaving(true);
            const payload: any = {
                code: formData.code.trim().toUpperCase(),
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                discount_type: formData.discount_type,
                discount_amount: Number(formData.discount_amount),
                max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : null,
                min_order_amount: formData.min_order_amount ? Number(formData.min_order_amount) : null,
                scope_type: formData.scope_type,
                course_ids: formData.scope_type === 'course' ? formData.course_ids : [],
                category_ids: formData.scope_type === 'category' ? formData.category_ids : [],
                user_restriction_type: formData.user_restriction_type,
                restricted_user_id: formData.user_restriction_type === 'specific' ? formData.restricted_user_id : null,
                usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
                usage_limit_per_user: Number(formData.usage_limit_per_user || 1),
                start_date: formData.start_date || null,
                expiry_date: formData.expiry_date || null,
                is_active: formData.is_active,
            };

            if (editingCoupon) {
                await apiClient.put(`/admin/coupons/${editingCoupon.id}`, payload);
            } else {
                await apiClient.post('/admin/coupons', payload);
            }

            setModalOpen(false);
            fetchCoupons();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.code?.[0] || 'Failed to save coupon.';
            setFormError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Marketing & Promotions
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
                        <TicketPercent className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        Discount Coupons
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Create flat (৳) or percentage (%) discount coupons for all courses, specific courses/categories, or target specific individual students by phone number.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 shrink-0 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Create New Coupon
                </button>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Coupons</span>
                        <TicketPercent className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{stats.total_coupons}</p>
                    <p className="text-xs text-slate-500 mt-1">Total created coupons</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">Active Coupons</span>
                        <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{stats.active_coupons}</p>
                    <p className="text-xs text-slate-500 mt-1">Ready for redemption</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">Redemptions</span>
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">{stats.total_redemptions}</p>
                    <p className="text-xs text-slate-500 mt-1">Total times applied by users</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Discounts Given</span>
                        <Tag className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">{formatBDT(stats.total_discount_given)}</p>
                    <p className="text-xs text-slate-500 mt-1">Savings granted to students</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by code or title..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                </form>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Discount Type filter */}
                    <select
                        value={discountTypeFilter}
                        onChange={(e) => {
                            setDiscountTypeFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Types</option>
                        <option value="fixed">Flat Discount (৳)</option>
                        <option value="percentage">Percentage (%)</option>
                    </select>

                    {/* Scope filter */}
                    <select
                        value={scopeFilter}
                        onChange={(e) => {
                            setScopeFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Scopes</option>
                        <option value="all">Open (All Courses)</option>
                        <option value="course">Specific Courses</option>
                        <option value="category">Specific Categories</option>
                    </select>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="expired">Expired</option>
                    </select>

                    <button
                        onClick={() => {
                            setPage(1);
                            fetchCoupons();
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                        Filter
                    </button>
                </div>
            </div>

            {/* Coupons Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                        <span className="text-sm font-medium">Loading coupons...</span>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <TicketPercent className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">No coupons found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            {searchTerm || discountTypeFilter || scopeFilter || statusFilter
                                ? 'No coupons matched your filter criteria. Try adjusting the filters.'
                                : 'You have not created any discount coupons yet. Click below to add your first coupon.'}
                        </p>
                        <button
                            onClick={handleOpenCreateModal}
                            className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" /> Create Coupon
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="px-6 py-3.5">Code & Title</th>
                                    <th className="px-6 py-3.5">Discount</th>
                                    <th className="px-6 py-3.5">Applicable Scope</th>
                                    <th className="px-6 py-3.5">Target Student</th>
                                    <th className="px-6 py-3.5">Usage / Limit</th>
                                    <th className="px-6 py-3.5">Validity</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                {coupons.map((coupon) => {
                                    const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();

                                    return (
                                        <tr key={coupon.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                            {/* Code & Title */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-black text-sm px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-lg select-all">
                                                        {coupon.code}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCode(coupon.code)}
                                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                                                        title="Copy code"
                                                    >
                                                        {copiedCode === coupon.code ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="font-bold text-slate-900 dark:text-white mt-1">
                                                    {coupon.title}
                                                </div>
                                                {coupon.description && (
                                                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                                        {coupon.description}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Discount */}
                                            <td className="px-6 py-4">
                                                {coupon.discount_type === 'percentage' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                        {coupon.discount_amount}% OFF
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        {formatBDT(coupon.discount_amount)} FLAT
                                                    </span>
                                                )}
                                                {coupon.max_discount_amount && (
                                                    <div className="text-[10px] text-slate-400 mt-1">
                                                        Max: {formatBDT(coupon.max_discount_amount)}
                                                    </div>
                                                )}
                                                {coupon.min_order_amount && (
                                                    <div className="text-[10px] text-slate-400">
                                                        Min course: {formatBDT(coupon.min_order_amount)}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Applicable Scope */}
                                            <td className="px-6 py-4">
                                                {coupon.scope_type === 'all' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                                        <Sparkles className="w-3 h-3" /> All Courses
                                                    </span>
                                                )}
                                                {coupon.scope_type === 'course' && (
                                                    <div className="space-y-1">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                            <BookOpen className="w-3 h-3" /> Specific Courses ({coupon.courses?.length || 0})
                                                        </span>
                                                        {coupon.courses && coupon.courses.length > 0 && (
                                                            <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]" title={coupon.courses.map(c => c.title).join(', ')}>
                                                                {coupon.courses.map(c => c.title).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {coupon.scope_type === 'category' && (
                                                    <div className="space-y-1">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                                            <FolderKanban className="w-3 h-3" /> Categories ({coupon.categories?.length || 0})
                                                        </span>
                                                        {coupon.categories && coupon.categories.length > 0 && (
                                                            <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]">
                                                                {coupon.categories.map(c => c.name).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Target Student */}
                                            <td className="px-6 py-4">
                                                {coupon.user_restriction_type === 'specific' && coupon.restricted_user ? (
                                                    <div className="space-y-0.5">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                                            <UserIcon className="w-3 h-3" /> Specific User
                                                        </span>
                                                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                            <span>{coupon.restricted_user.name}</span>
                                                        </div>
                                                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                                                            <Phone className="w-3 h-3 text-slate-400" />
                                                            <span>{coupon.restricted_user.phone}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                        <Users className="w-3 h-3" /> All Registered Students
                                                    </span>
                                                )}
                                            </td>

                                            {/* Usage / Limit */}
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                                    {coupon.times_used} / {coupon.usage_limit ? coupon.usage_limit : '∞'} uses
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    Max {coupon.usage_limit_per_user} per student
                                                </div>
                                            </td>

                                            {/* Validity */}
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {coupon.expiry_date ? (
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1 text-[11px]">
                                                            <Calendar className="w-3 h-3 text-slate-400" />
                                                            <span>Exp: {new Date(coupon.expiry_date).toLocaleDateString()}</span>
                                                        </div>
                                                        {isExpired && (
                                                            <span className="inline-block text-[10px] font-bold text-rose-600">
                                                                Expired
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">No Expiration</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(coupon.id)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                                                        coupon.is_active && !isExpired
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${coupon.is_active && !isExpired ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    {coupon.is_active && !isExpired ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right space-x-1.5">
                                                <button
                                                    onClick={() => handleOpenEditModal(coupon)}
                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Coupon"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCoupon(coupon)}
                                                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete Coupon"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8 border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                    <TicketPercent className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {editingCoupon ? 'Edit Discount Coupon' : 'Create New Discount Coupon'}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Configure discount rules, restrictions and eligibility.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body / Scrollable Form */}
                        <form onSubmit={handleSaveCoupon} className="space-y-5 py-4 overflow-y-auto pr-1">
                            {formError && (
                                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {/* Code & Generator */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Coupon Code <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                            placeholder="e.g. DISCOUNT20"
                                            className="w-full px-3.5 py-2.5 uppercase font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={generateRandomCode}
                                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                                            title="Generate code"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Coupon Title / Promo Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Special Eid Discount"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Discount Type: Flat vs Percentage */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                                    Discount Type <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, discount_type: 'fixed' }))}
                                        className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                            formData.discount_type === 'fixed'
                                                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg ${formData.discount_type === 'fixed' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">Flat Discount (Fixed ৳)</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">Deducts a fixed amount (e.g. ৳500 off)</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, discount_type: 'percentage' }))}
                                        className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                            formData.discount_type === 'percentage'
                                                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg ${formData.discount_type === 'percentage' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                            <TicketPercent className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">Percentage Discount (%)</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">Deducts a percentage (e.g. 20% off)</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Discount Amount & Caps */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        {formData.discount_type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (৳)'} <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={formData.discount_type === 'percentage' ? '100' : undefined}
                                        value={formData.discount_amount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                                        placeholder={formData.discount_type === 'percentage' ? 'e.g. 25' : 'e.g. 500'}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                        required
                                    />
                                </div>

                                {formData.discount_type === 'percentage' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                            Max Discount Cap (৳)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.max_discount_amount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, max_discount_amount: e.target.value }))}
                                            placeholder="e.g. 1000 (Optional)"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Min Course Price (৳)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.min_order_amount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: e.target.value }))}
                                        placeholder="e.g. 1500 (Optional)"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Scope: Open vs Course vs Category */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                                    Applicable Course Scope <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, scope_type: 'all' }))}
                                        className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                            formData.scope_type === 'all'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        Open (All Courses)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, scope_type: 'course' }))}
                                        className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                            formData.scope_type === 'course'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        Specific Course(s)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, scope_type: 'category' }))}
                                        className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                            formData.scope_type === 'category'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        Course Category(ies)
                                    </button>
                                </div>

                                {/* Multi-select courses */}
                                {formData.scope_type === 'course' && (
                                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                            Select Course(s):
                                        </div>
                                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                            {allCourses.map(course => {
                                                const checked = formData.course_ids.includes(course.id);
                                                return (
                                                    <label key={course.id} className="flex items-center gap-2 p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer text-xs">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => {
                                                                if (checked) {
                                                                    setFormData(prev => ({ ...prev, course_ids: prev.course_ids.filter(id => id !== course.id) }));
                                                                } else {
                                                                    setFormData(prev => ({ ...prev, course_ids: [...prev.course_ids, course.id] }));
                                                                }
                                                            }}
                                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{course.title}</span>
                                                        <span className="text-[10px] text-slate-400 ml-auto">{formatBDT(course.price)}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Multi-select categories */}
                                {formData.scope_type === 'category' && (
                                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                            Select Course Category(ies):
                                        </div>
                                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                            {allCategories.map(cat => {
                                                const checked = formData.category_ids.includes(cat.id);
                                                return (
                                                    <label key={cat.id} className="flex items-center gap-2 p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer text-xs">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => {
                                                                if (checked) {
                                                                    setFormData(prev => ({ ...prev, category_ids: prev.category_ids.filter(id => id !== cat.id) }));
                                                                } else {
                                                                    setFormData(prev => ({ ...prev, category_ids: [...prev.category_ids, cat.id] }));
                                                                }
                                                            }}
                                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Restriction: Open vs Specific User (By Phone/Name Search) */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                                    Target Audience / User Restriction <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, user_restriction_type: 'all', restricted_user_id: null }));
                                            setSelectedUser(null);
                                        }}
                                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                            formData.user_restriction_type === 'all'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                                                : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                                        <div>
                                            <div className="text-xs font-bold">Open to All Students</div>
                                            <div className="text-[10px] text-slate-500">Any registered student can use</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, user_restriction_type: 'specific' }))}
                                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                            formData.user_restriction_type === 'specific'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                                                : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <UserIcon className="w-4 h-4 text-rose-600 shrink-0" />
                                        <div>
                                            <div className="text-xs font-bold">Restricted to Specific User</div>
                                            <div className="text-[10px] text-slate-500">Search by student phone number</div>
                                        </div>
                                    </button>
                                </div>

                                {/* User Search input when restricted */}
                                {formData.user_restriction_type === 'specific' && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Search Student by Phone Number, Name or Email:</span>
                                        </div>

                                        {selectedUser ? (
                                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-850 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm">
                                                        {selectedUser.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                            <span>{selectedUser.name}</span>
                                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                                {selectedUser.role}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                            {selectedUser.phone}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">
                                                            {selectedUser.email}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedUser(null);
                                                        setFormData(prev => ({ ...prev, restricted_user_id: null }));
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                                    title="Remove selected student"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="relative">
                                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={userSearchTerm}
                                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                                        placeholder="Type student phone number (e.g. 017...) or name..."
                                                        className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                                    />
                                                    {searchingUsers && (
                                                        <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-600" />
                                                    )}
                                                </div>

                                                {/* Search Results Dropdown */}
                                                {userSearchResults.length > 0 && (
                                                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-100 dark:divide-slate-700">
                                                        {userSearchResults.map(u => (
                                                            <button
                                                                key={u.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedUser(u);
                                                                    setFormData(prev => ({ ...prev, restricted_user_id: u.id }));
                                                                    setUserSearchTerm('');
                                                                    setUserSearchResults([]);
                                                                }}
                                                                className="w-full text-left p-2.5 hover:bg-indigo-50 dark:hover:bg-slate-700/60 flex items-center justify-between transition-colors cursor-pointer"
                                                            >
                                                                <div>
                                                                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                                                                        {u.name}
                                                                    </div>
                                                                    <div className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                                        {u.phone}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] text-slate-400">{u.email}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {userSearchTerm.length >= 2 && !searchingUsers && userSearchResults.length === 0 && (
                                                    <div className="text-xs text-slate-400 mt-1 italic">
                                                        No student found with "{userSearchTerm}".
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Usage Limits */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Total Uses Limit (Overall)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.usage_limit}
                                        onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                                        placeholder="Leave blank for Unlimited"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Uses Per Student <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.usage_limit_per_user}
                                        onChange={(e) => setFormData(prev => ({ ...prev, usage_limit_per_user: Number(e.target.value) }))}
                                        placeholder="Default: 1"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Validity Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Start Date & Time (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Expiry Date & Time (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="coupon_is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                />
                                <label htmlFor="coupon_is_active" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                                    Coupon is Active and available for redemption
                                </label>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                                >
                                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
