import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
    ChevronUp,
    Sliders,
    User as UserIcon,
    Phone,
    TrendingUp,
    FolderKanban,
    RotateCcw
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
    deleted_at?: string | null;
}

interface CouponStats {
    total_coupons: number;
    active_coupons: number;
    total_redemptions: number;
    total_discount_given: number;
    trashed_coupons?: number;
}

interface AdminCouponsPageProps {
    autoOpenCreate?: boolean;
}

export const AdminCouponsPage: React.FC<AdminCouponsPageProps> = ({ autoOpenCreate }) => {
    const location = useLocation();
    const [coupons, setCoupons] = useState<CouponItem[]>([]);
    const [stats, setStats] = useState<CouponStats>({
        total_coupons: 0,
        active_coupons: 0,
        total_redemptions: 0,
        total_discount_given: 0,
        trashed_coupons: 0,
    });
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [discountTypeFilter, setDiscountTypeFilter] = useState('');
    const [scopeFilter, setScopeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('status') || '';
    });
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

    // Search filter terms for courses and categories in modal
    const [courseSearchTerm, setCourseSearchTerm] = useState('');
    const [categorySearchTerm, setCategorySearchTerm] = useState('');

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
        usage_limit_per_user: '' as string | number,
        start_date: '',
        expiry_date: '',
        is_active: true,
    });

    // Advance accordion state in modal
    const [showAdvanced, setShowAdvanced] = useState(false);

    // User live search state
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<UserOption[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

    // Filtered courses and categories for modal
    const filteredCourses = useMemo(() => {
        if (!courseSearchTerm.trim()) return allCourses;
        const q = courseSearchTerm.toLowerCase();
        return allCourses.filter(c => c.title.toLowerCase().includes(q));
    }, [allCourses, courseSearchTerm]);

    const selectedCoursesList = useMemo(() => {
        const fromAll = allCourses.filter(c => formData.course_ids.includes(c.id));
        if (editingCoupon && editingCoupon.courses) {
            const missing = editingCoupon.courses.filter(c => 
                formData.course_ids.includes(c.id) && !fromAll.some(a => a.id === c.id)
            );
            return [...fromAll, ...missing];
        }
        return fromAll;
    }, [allCourses, formData.course_ids, editingCoupon]);

    const filteredCategories = useMemo(() => {
        if (!categorySearchTerm.trim()) return allCategories;
        const q = categorySearchTerm.toLowerCase();
        return allCategories.filter(cat => cat.name.toLowerCase().includes(q));
    }, [allCategories, categorySearchTerm]);

    const selectedCategoriesList = useMemo(() => {
        const fromAll = allCategories.filter(cat => formData.category_ids.includes(cat.id));
        if (editingCoupon && editingCoupon.categories) {
            const missing = editingCoupon.categories.filter(cat => 
                formData.category_ids.includes(cat.id) && !fromAll.some(a => a.id === cat.id)
            );
            return [...fromAll, ...missing];
        }
        return fromAll;
    }, [allCategories, formData.category_ids, editingCoupon]);

    useEffect(() => {
        fetchCoupons();
        fetchCoursesAndCategories();
    }, [page, discountTypeFilter, scopeFilter, statusFilter]);

    useEffect(() => {
        if (autoOpenCreate || location.pathname.endsWith('/create') || location.search.includes('action=create')) {
            handleOpenCreateModal();
        }
    }, [autoOpenCreate, location.pathname, location.search]);

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
        if (!window.confirm(`আপনি কি কুপন "${coupon.code}" ট্র্যাশে পাঠাতে চান? পরবর্তীতে ট্র্যাশ থেকে এটি যেকোনো সময় পুনরুদ্ধার করা যাবে।`)) return;

        try {
            await apiClient.delete(`/admin/coupons/${coupon.id}`);
            setCoupons(prev => prev.filter(c => c.id !== coupon.id));
            setStats(prev => ({
                ...prev,
                total_coupons: Math.max(0, prev.total_coupons - 1),
                active_coupons: coupon.is_active ? Math.max(0, prev.active_coupons - 1) : prev.active_coupons,
                trashed_coupons: (prev.trashed_coupons || 0) + 1,
            }));
        } catch (err) {
            alert('Failed to delete coupon.');
        }
    };

    const handleRestoreCoupon = async (coupon: CouponItem) => {
        try {
            await apiClient.post(`/admin/coupons/${coupon.id}/restore`);
            setCoupons(prev => prev.filter(c => c.id !== coupon.id));
            setStats(prev => ({
                ...prev,
                total_coupons: prev.total_coupons + 1,
                trashed_coupons: Math.max(0, (prev.trashed_coupons || 1) - 1),
            }));
            alert(`কুপন "${coupon.code}" সফলভাবে পুনরুদ্ধার করা হয়েছে!`);
        } catch (err) {
            alert('Failed to restore coupon.');
        }
    };

    const handleForceDeleteCoupon = async (coupon: CouponItem) => {
        if (!window.confirm(`সতর্কতা: আপনি কি নিশ্চিতভাবে কুপন "${coupon.code}" স্থায়ীভাবে মুছে ফেলতে চান? এটি আর কখনোই পুনরুদ্ধার করা যাবে না!`)) return;

        try {
            await apiClient.delete(`/admin/coupons/${coupon.id}/force-delete`);
            setCoupons(prev => prev.filter(c => c.id !== coupon.id));
            setStats(prev => ({
                ...prev,
                trashed_coupons: Math.max(0, (prev.trashed_coupons || 1) - 1),
            }));
        } catch (err) {
            alert('Failed to permanently delete coupon.');
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
        setShowAdvanced(false);
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
            usage_limit_per_user: '',
            start_date: '',
            expiry_date: '',
            is_active: true,
        });
        setSelectedUser(null);
        setUserSearchTerm('');
        setUserSearchResults([]);
        setCourseSearchTerm('');
        setCategorySearchTerm('');
        setFormError(null);
        setModalOpen(true);
    };

    const handleOpenEditModal = (coupon: CouponItem) => {
        setEditingCoupon(coupon);
        const hasAdvancedSettings = Boolean(
            coupon.scope_type !== 'all' ||
            coupon.user_restriction_type !== 'all' ||
            coupon.usage_limit ||
            coupon.start_date ||
            coupon.expiry_date ||
            coupon.max_discount_amount ||
            coupon.min_order_amount ||
            coupon.description ||
            (coupon.title && coupon.title !== coupon.code)
        );
        setShowAdvanced(hasAdvancedSettings);
        setFormData({
            code: coupon.code,
            title: coupon.title || '',
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
            usage_limit_per_user: coupon.usage_limit_per_user || '',
            start_date: coupon.start_date ? coupon.start_date.substring(0, 16) : '',
            expiry_date: coupon.expiry_date ? coupon.expiry_date.substring(0, 16) : '',
            is_active: coupon.is_active,
        });
        setSelectedUser(coupon.restricted_user || null);
        setUserSearchTerm('');
        setUserSearchResults([]);
        setCourseSearchTerm('');
        setCategorySearchTerm('');
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
            const cleanCode = formData.code.trim().toUpperCase();
            const payload: any = {
                code: cleanCode,
                title: formData.title.trim() || cleanCode,
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
                usage_limit_per_user: formData.usage_limit_per_user ? Number(formData.usage_limit_per_user) : null,
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
                        className={`px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 ${
                            statusFilter === 'trashed'
                                ? 'border-rose-400 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                    >
                        <option value="">All Status (সকল সক্রিয়)</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="expired">Expired</option>
                        <option value="trashed">🗑️ ট্র্যাশ / Trash ({stats.trashed_coupons || 0})</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => {
                            setStatusFilter(prev => prev === 'trashed' ? '' : 'trashed');
                            setPage(1);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            statusFilter === 'trashed'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                        title="Trash / রিসাইকেল বিন"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>{statusFilter === 'trashed' ? 'সব কুপনে ফিরুন' : `ট্র্যাশ (${stats.trashed_coupons || 0})`}</span>
                    </button>

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

            {/* Trash Mode Notice */}
            {statusFilter === 'trashed' && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-semibold">
                            ট্র্যাশ মোড (Trash Bin): এখানে মুছে ফেলা কুপন সংরক্ষিত রয়েছে। আপনি কুপন পুনরুদ্ধার (Restore) করতে পারেন অথবা ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে পারেন।
                        </span>
                    </div>
                </div>
            )}

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
                                                {coupon.title && coupon.title !== coupon.code && (
                                                    <div className="font-bold text-slate-900 dark:text-white mt-1">
                                                        {coupon.title}
                                                    </div>
                                                )}
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
                                            <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                                                {statusFilter === 'trashed' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestoreCoupon(coupon)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer"
                                                            title="পুনরুদ্ধার করুন (Restore)"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                            <span>পুনরুদ্ধার</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleForceDeleteCoupon(coupon)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg transition-colors cursor-pointer"
                                                            title="স্থায়ীভাবে মুছুন (Permanent Delete)"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>স্থায়ী মুছুন</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
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
                                                    </>
                                                )}
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

                            {/* 1. Primary: Coupon Code */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                    Coupon Code <span className="text-rose-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g. DISCOUNT20 or EID500"
                                        className="w-full px-3.5 py-2.5 uppercase font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={generateRandomCode}
                                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                                        title="Auto generate code"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Generate</span>
                                    </button>
                                </div>
                            </div>

                            {/* 2. Primary: Discount Type Dropdown & Discount Amount */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Discount Type <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.discount_type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value as 'fixed' | 'percentage' }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 dark:text-white cursor-pointer"
                                    >
                                        <option value="fixed">Flat Discount (Fixed ৳)</option>
                                        <option value="percentage">Percentage Discount (%)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        {formData.discount_type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (৳)'} <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        max={formData.discount_type === 'percentage' ? '100' : undefined}
                                        value={formData.discount_amount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                                        placeholder={formData.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Default settings banner */}
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>এই কুপনটি স্বয়ংক্রিয়ভাবে সব কোর্সের জন্য প্রযোজ্য এবং ব্যবহারের কোনো সীমা থাকবে না (আনলিমিটেড)।</span>
                            </div>

                            {/* 3. Advance Toggle Button */}
                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer shadow-xs"
                                >
                                    <span className="flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-indigo-600" />
                                        <span>Advance (অ্যাডভান্সড অপশন)</span>
                                    </span>
                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-normal">
                                        <span>{showAdvanced ? 'হাইড করুন' : 'ক্লিক করে বাকি কাজ করুন'}</span>
                                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </div>
                                </button>
                            </div>

                            {/* 4. Advanced Section (Collapsible) */}
                            {showAdvanced && (
                                <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                                    {/* Caps & Minimums */}
                                    {formData.discount_type === 'percentage' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                                সর্বোচ্চ ছাড়ের সীমা / Max Discount Cap (৳)
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={formData.max_discount_amount}
                                                onChange={(e) => setFormData(prev => ({ ...prev, max_discount_amount: e.target.value }))}
                                                placeholder="ফাঁকা রাখলে আনলিমিটেড (Unlimited)"
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                            ন্যূনতম কোর্সের মূল্য / Min Course Price (৳)
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            min="0"
                                            value={formData.min_order_amount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: e.target.value }))}
                                            placeholder="ফাঁকা রাখলে কোনো ন্যূনতম মূল্য প্রযোজ্য নয় (No Minimum Limit)"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all shadow-sm"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">কোর্স বা কার্টের মোট মূল্য এই টাকার সমান বা বেশি হলে তবেই কুপনটি প্রযোজ্য হবে।</p>
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
                                            <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                                        <span>কোর্স নির্বাচন করুন (Select Courses):</span>
                                                    </label>
                                                    <span className="text-[11px] text-slate-400">
                                                        {formData.course_ids.length > 0 ? `${formData.course_ids.length}টি নির্বাচিত` : 'কোনোটি নির্বাচিত নয়'}
                                                    </span>
                                                </div>

                                                {/* Selected Courses Chips */}
                                                {selectedCoursesList.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                                        <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 mr-1">
                                                            নির্বাচিত:
                                                        </span>
                                                        {selectedCoursesList.map(c => (
                                                            <span
                                                                key={c.id}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-850 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                                                            >
                                                                <span className="max-w-[200px] truncate">{c.title}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData(prev => ({ ...prev, course_ids: prev.course_ids.filter(id => id !== c.id) }))}
                                                                    className="text-slate-400 hover:text-rose-600 rounded p-0.5 transition-colors cursor-pointer"
                                                                    title="মুছে ফেলুন"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, course_ids: [] }))}
                                                            className="text-[10px] text-rose-500 hover:underline ml-auto cursor-pointer"
                                                        >
                                                            সব মুছুন
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Search Bar */}
                                                <div className="relative">
                                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={courseSearchTerm}
                                                        onChange={(e) => setCourseSearchTerm(e.target.value)}
                                                        placeholder="কোর্সের নাম লিখে সার্চ করুন (যেমনঃ Physics, HSC, Math...)"
                                                        className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                                    />
                                                    {courseSearchTerm && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setCourseSearchTerm('')}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                                            title="Clear search"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Filtered Courses List */}
                                                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-1 bg-white dark:bg-slate-850">
                                                    {filteredCourses.length > 0 ? (
                                                        filteredCourses.map(course => {
                                                            const checked = formData.course_ids.includes(course.id);
                                                            return (
                                                                <div
                                                                    key={course.id}
                                                                    onClick={() => {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            course_ids: checked
                                                                                ? prev.course_ids.filter(id => id !== course.id)
                                                                                : [...prev.course_ids, course.id]
                                                                        }));
                                                                    }}
                                                                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                                                        checked
                                                                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => {}}
                                                                        className="rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                                                                    />
                                                                    <span className="font-semibold flex-1 leading-snug">{course.title}</span>
                                                                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">{formatBDT(course.price)}</span>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="text-center py-4 text-xs text-slate-400">
                                                            "{courseSearchTerm}" দিয়ে কোনো কোর্স পাওয়া যায়নি
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Multi-select categories */}
                                        {formData.scope_type === 'category' && (
                                            <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                        <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                                                        <span>ক্যাটেগরি নির্বাচন করুন (Select Categories):</span>
                                                    </label>
                                                    <span className="text-[11px] text-slate-400">
                                                        {formData.category_ids.length > 0 ? `${formData.category_ids.length}টি নির্বাচিত` : 'কোনোটি নির্বাচিত নয়'}
                                                    </span>
                                                </div>

                                                {/* Selected Categories Chips */}
                                                {selectedCategoriesList.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/50">
                                                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 mr-1">
                                                            নির্বাচিত:
                                                        </span>
                                                        {selectedCategoriesList.map(cat => (
                                                            <span
                                                                key={cat.id}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-850 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-800 shadow-2xs"
                                                            >
                                                                <span className="max-w-[200px] truncate">{cat.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData(prev => ({ ...prev, category_ids: prev.category_ids.filter(id => id !== cat.id) }))}
                                                                    className="text-slate-400 hover:text-rose-600 rounded p-0.5 transition-colors cursor-pointer"
                                                                    title="মুছে ফেলুন"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, category_ids: [] }))}
                                                            className="text-[10px] text-rose-500 hover:underline ml-auto cursor-pointer"
                                                        >
                                                            সব মুছুন
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Search Bar */}
                                                <div className="relative">
                                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={categorySearchTerm}
                                                        onChange={(e) => setCategorySearchTerm(e.target.value)}
                                                        placeholder="ক্যাটেগরির নাম লিখে সার্চ করুন..."
                                                        className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                                    />
                                                    {categorySearchTerm && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setCategorySearchTerm('')}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                                            title="Clear search"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Filtered Categories List */}
                                                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-1 bg-white dark:bg-slate-850">
                                                    {filteredCategories.length > 0 ? (
                                                        filteredCategories.map(cat => {
                                                            const checked = formData.category_ids.includes(cat.id);
                                                            return (
                                                                <div
                                                                    key={cat.id}
                                                                    onClick={() => {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            category_ids: checked
                                                                                ? prev.category_ids.filter(id => id !== cat.id)
                                                                                : [...prev.category_ids, cat.id]
                                                                        }));
                                                                    }}
                                                                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                                                        checked
                                                                            ? 'bg-amber-50/90 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => {}}
                                                                        className="rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                                                                    />
                                                                    <span className="font-semibold flex-1 leading-snug">{cat.name}</span>
                                                                    {cat.courses_count !== undefined && (
                                                                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">({cat.courses_count} courses)</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="text-center py-4 text-xs text-slate-400">
                                                            "{categorySearchTerm}" দিয়ে কোনো ক্যাটেগরি পাওয়া যায়নি
                                                        </div>
                                                    )}
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
                                                Uses Per Student
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.usage_limit_per_user}
                                                onChange={(e) => setFormData(prev => ({ ...prev, usage_limit_per_user: e.target.value }))}
                                                placeholder="Leave blank for Unlimited"
                                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
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
                                </div>
                            )}

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

