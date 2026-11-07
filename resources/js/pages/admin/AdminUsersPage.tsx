import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { User, UserRole } from '../../types';
import { 
    Users, 
    Search, 
    Shield, 
    GraduationCap, 
    UserCheck, 
    UserX, 
    AlertCircle, 
    Filter,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    UserPlus,
    Trash2,
    Loader2,
    CheckCircle2,
    X,
    Lock,
    Phone,
    Mail,
    User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';

export const AdminUsersPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // URL parameters as initial values
    const querySearch = searchParams.get('search') || '';
    const queryRole = searchParams.get('role') || '';
    const queryStatus = searchParams.get('status') || '';
    const queryPage = parseInt(searchParams.get('page') || '1', 10);

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState(querySearch);
    const [roleFilter, setRoleFilter] = useState(queryRole);
    const [statusFilter, setStatusFilter] = useState(queryStatus);
    const [pagination, setPagination] = useState({
        currentPage: queryPage,
        lastPage: 1,
        total: 0,
        perPage: 15,
    });

    // Role Change Modal
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState<UserRole>('student');
    const [updatingRole, setUpdatingRole] = useState(false);

    // Current logged in admin
    const { user: currentUser } = useAuth();

    // Create User Modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createForm, setCreateForm] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        role: 'student' as UserRole,
        status: 'active' as 'active' | 'inactive',
    });

    // Delete User state
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

    // Keep state in sync with URL searchParams (e.g. when navigating from dashboard or back/forward)
    useEffect(() => {
        setSearch(searchParams.get('search') || '');
        setRoleFilter(searchParams.get('role') || '');
        setStatusFilter(searchParams.get('status') || '');
    }, [searchParams]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            const currentSearch = searchParams.get('search') || '';
            const currentRole = searchParams.get('role') || '';
            const currentStatus = searchParams.get('status') || '';
            const currentPage = parseInt(searchParams.get('page') || '1', 10);

            if (currentSearch) params.append('search', currentSearch);
            if (currentRole) params.append('role', currentRole);
            if (currentStatus) params.append('status', currentStatus);
            if (currentPage > 1) params.append('page', String(currentPage));

            const { data } = await apiClient.get(`/admin/users?${params.toString()}`);

            // Safely parse user list whether paginated or raw array
            const userList: User[] = Array.isArray(data?.data)
                ? data.data
                : (Array.isArray(data) ? data : []);

            setUsers(userList);

            if (data?.current_page !== undefined) {
                setPagination({
                    currentPage: data.current_page,
                    lastPage: data.last_page || 1,
                    total: data.total ?? userList.length,
                    perPage: data.per_page || 15,
                });
            } else {
                setPagination({
                    currentPage: 1,
                    lastPage: 1,
                    total: userList.length,
                    perPage: 15,
                });
            }
        } catch (err: any) {
            console.error('Failed to load users:', err);
            setError(err.response?.data?.message || 'ব্যবহারকারীর তথ্য লোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const applyFilters = (updates: { search?: string; role?: string; status?: string; page?: number }) => {
        const next = new URLSearchParams(searchParams);

        if (updates.search !== undefined) {
            if (updates.search.trim()) next.set('search', updates.search.trim());
            else next.delete('search');
        }
        if (updates.role !== undefined) {
            if (updates.role) next.set('role', updates.role);
            else next.delete('role');
        }
        if (updates.status !== undefined) {
            if (updates.status) next.set('status', updates.status);
            else next.delete('status');
        }
        if (updates.page !== undefined) {
            if (updates.page > 1) next.set('page', String(updates.page));
            else next.delete('page');
        } else {
            next.delete('page');
        }

        setSearchParams(next);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleTabChange = (role: string) => {
        setRoleFilter(role);
        applyFilters({ role, page: 1 });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            applyFilters({ page: newPage });
        }
    };

    const openRoleModal = (u: User) => {
        setSelectedUser(u);
        setNewRole(u.role);
        setRoleModalOpen(true);
    };

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setUpdatingRole(true);
        try {
            const { data } = await apiClient.post(`/admin/users/${selectedUser.id}/role`, {
                role: newRole,
            });
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? data.user : u));
            setRoleModalOpen(false);
            alert(data.message);
        } catch (err: any) {
            alert(err.response?.data?.message || 'রোল পরিবর্তন করতে ব্যর্থ হয়েছে।');
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleToggleStatus = async (userToToggle: User) => {
        const actionName = userToToggle.status === 'active' ? 'নিষ্ক্রিয়' : 'সক্রিয়';
        if (!window.confirm(`আপনি কি নিশ্চিতভাবে এই অ্যাকাউন্টটি ${actionName} করতে চান?`)) return;

        try {
            const { data } = await apiClient.post(`/admin/users/${userToToggle.id}/status`);
            setUsers(prev => prev.map(u => u.id === userToToggle.id ? data.user : u));
        } catch (err: any) {
            alert(err.response?.data?.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        setCreatingUser(true);

        try {
            const { data } = await apiClient.post('/admin/users', createForm);
            setUsers(prev => [data.user, ...prev]);
            setPagination(prev => ({ ...prev, total: prev.total + 1 }));
            setCreateModalOpen(false);
            setCreateForm({
                name: '',
                phone: '',
                email: '',
                password: '',
                role: 'student',
                status: 'active',
            });
            alert(data.message || 'নতুন ব্যবহারকারী সফলভাবে তৈরি করা হয়েছে।');
        } catch (err: any) {
            setCreateError(err.response?.data?.message || 'ব্যবহারকারী তৈরি করতে ব্যর্থ হয়েছে। তথ্যগুলো পুনরায় পরীক্ষা করুন।');
        } finally {
            setCreatingUser(false);
        }
    };

    const handleDeleteUser = async (userToDelete: User) => {
        if (currentUser && currentUser.id === userToDelete.id) {
            alert('আপনি নিজের অ্যাডমিন অ্যাকাউন্ট নিজে ডিলিট করতে পারবেন না।');
            return;
        }

        const roleBangla = userToDelete.role === 'admin' ? 'অ্যাডমিন' : (userToDelete.role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী');
        const confirmMessage = `আপনি কি নিশ্চিতভাবে ${roleBangla} "${userToDelete.name}" (${userToDelete.phone || userToDelete.email}) এর অ্যাকাউন্ট স্থায়ীভাবে ডিলিট করতে চান?\n\nসতর্কতা: এই অ্যাকশনটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না!`;

        if (!window.confirm(confirmMessage)) return;

        setDeletingUserId(userToDelete.id);
        try {
            const { data } = await apiClient.delete(`/admin/users/${userToDelete.id}`);
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
            alert(data.message || 'ইউজার অ্যাকাউন্ট সফলভাবে ডিলিট করা হয়েছে।');
        } catch (err: any) {
            alert(err.response?.data?.message || 'ব্যবহারকারী ডিলিট করতে ব্যর্থ হয়েছে।');
        } finally {
            setDeletingUserId(null);
        }
    };

    const activeRoleTab = searchParams.get('role') || '';

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
                        <Users className="w-7 h-7 text-sky-600 dark:text-sky-400" />
                        <span>ব্যবহারকারী ব্যবস্থাপনা (User Management)</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        সকল শিক্ষার্থী, শিক্ষক ও অ্যাডমিন অ্যাকাউন্ট পরিচালনা, রোল পরিবর্তন ও স্ট্যাটাস নিয়ন্ত্রণ
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={() => {
                            setCreateError(null);
                            setCreateModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>নতুন ইউজার তৈরি করুন</span>
                    </button>
                    <button
                        onClick={() => fetchUsers()}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-500' : ''}`} />
                        <span>রিফ্রেশ</span>
                    </button>
                </div>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                    onClick={() => handleTabChange('')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeRoleTab === ''
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    সকল ইউজার
                </button>
                <button
                    onClick={() => handleTabChange('student')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeRoleTab === 'student'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    শিক্ষার্থী (Students)
                </button>
                <button
                    onClick={() => handleTabChange('teacher')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeRoleTab === 'teacher'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    শিক্ষক (Teachers)
                </button>
                <button
                    onClick={() => handleTabChange('admin')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeRoleTab === 'admin'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    অ্যাডমিন (Admins)
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="নাম, ফোন নম্বর অথবা ইমেইল দিয়ে খুঁজুন..."
                        className="w-full pl-10 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <button
                        type="submit"
                        className="absolute right-2 top-2 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                        খুঁজুন
                    </button>
                </form>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            applyFilters({ role: e.target.value, page: 1 });
                        }}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                        <option value="">সকল রোল (All Roles)</option>
                        <option value="student">শিক্ষার্থী (Student)</option>
                        <option value="teacher">শিক্ষক (Teacher)</option>
                        <option value="admin">অ্যাডমিন (Admin)</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            applyFilters({ status: e.target.value, page: 1 });
                        }}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                        <option value="">সকল স্ট্যাটাস</option>
                        <option value="active">সক্রিয় (Active)</option>
                        <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                    </select>

                    {(search || roleFilter || statusFilter) && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setRoleFilter('');
                                setStatusFilter('');
                                setSearchParams(new URLSearchParams());
                            }}
                            className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer whitespace-nowrap"
                        >
                            রিসেট
                        </button>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between text-rose-800 dark:text-rose-300 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={() => fetchUsers()}
                        className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors"
                    >
                        পুনরায় চেষ্টা করুন
                    </button>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="py-4 px-6">ইউজার</th>
                                <th className="py-4 px-4">মোবাইল নম্বর</th>
                                <th className="py-4 px-4">ইমেইল</th>
                                <th className="py-4 px-4">রোল</th>
                                <th className="py-4 px-4">এনরোলমেন্ট / কোর্স</th>
                                <th className="py-4 px-4">স্ট্যাটাস</th>
                                <th className="py-4 px-4">নিবন্ধনের তারিখ</th>
                                <th className="py-4 px-6 text-right">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400">
                                        <div className="inline-flex items-center gap-2">
                                            <RefreshCw className="w-5 h-5 animate-spin text-sky-500" />
                                            <span>ব্যবহারকারীর তথ্য লোড হচ্ছে...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400">
                                        <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                        <p className="font-semibold">কোনো ইউজার খুঁজে পাওয়া যায়নি।</p>
                                        {(search || roleFilter || statusFilter) && (
                                            <button
                                                onClick={() => {
                                                    setSearch('');
                                                    setRoleFilter('');
                                                    setStatusFilter('');
                                                    setSearchParams(new URLSearchParams());
                                                }}
                                                className="mt-2 text-sky-600 font-bold hover:underline inline-block cursor-pointer"
                                            >
                                                ফিল্টার মুছে সব ইউজার দেখুন
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => {
                                    const initial = (u.name || 'U').charAt(0).toUpperCase();
                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center text-sm shrink-0 border border-sky-200/50 dark:border-sky-800/50">
                                                        {initial}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{u.name || 'অজ্ঞাত ইউজার'}</h4>
                                                        <span className="text-[11px] text-slate-400">ID: #{u.id}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{u.phone || '-'}</td>
                                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{u.email || '-'}</td>

                                            <td className="py-4 px-4">
                                                {u.role === 'admin' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                                                        <Shield className="w-3 h-3" />
                                                        অ্যাডমিন
                                                    </span>
                                                ) : u.role === 'teacher' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                                                        <GraduationCap className="w-3 h-3" />
                                                        শিক্ষক
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                                                        শিক্ষার্থী
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                                                {u.role === 'teacher' ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                                                        <BookOpen className="w-3 h-3" />
                                                        {u.instructed_courses_count || 0} কোর্স
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                                                        <BookOpen className="w-3 h-3" />
                                                        {u.enrollments_count || 0} এনরোলমেন্ট
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4">
                                                {u.status === 'active' ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                                        সক্রিয়
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                                                        নিষ্ক্রিয়
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString('bn-BD') : '-'}
                                            </td>

                                            <td className="py-4 px-6 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => openRoleModal(u)}
                                                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                                    >
                                                        রোল পরিবর্তন
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(u)}
                                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                            u.status === 'active'
                                                                ? 'hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                                                                : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                        title={u.status === 'active' ? 'অ্যাকাউন্ট নিষ্ক্রিয় করুন' : 'অ্যাকাউন্ট সক্রিয় করুন'}
                                                    >
                                                        {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u)}
                                                        disabled={deletingUserId === u.id || (currentUser?.id === u.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title={currentUser?.id === u.id ? 'নিজের অ্যাকাউন্ট ডিলিট করা যাবে না' : 'ইউজার অ্যাকাউন্ট ডিলিট করুন'}
                                                    >
                                                        {deletingUserId === u.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
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

                {/* Pagination Bar */}
                {pagination.total > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <div>
                            মোট <strong className="text-slate-800 dark:text-slate-200 font-mono">{pagination.total}</strong> জন ব্যবহারকারী • পৃষ্ঠা <strong className="text-slate-800 dark:text-slate-200 font-mono">{pagination.currentPage}</strong> / <strong className="text-slate-800 dark:text-slate-200 font-mono">{pagination.lastPage}</strong>
                        </div>

                        {pagination.lastPage > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage <= 1}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                    title="পূর্ববর্তী পৃষ্ঠা"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-semibold px-2">
                                    {pagination.currentPage}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage >= pagination.lastPage}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                    title="পরবর্তী পৃষ্ঠা"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Role Change Modal */}
            <Modal
                isOpen={roleModalOpen}
                onClose={() => setRoleModalOpen(false)}
                title="ইউজারের ভূমিকা / রোল পরিবর্তন"
                maxWidth="sm"
            >
                {selectedUser && (
                    <form onSubmit={handleUpdateRole} className="space-y-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 space-y-1">
                            <p>ইউজার: <strong>{selectedUser.name}</strong></p>
                            <p>মোবাইল: <strong className="font-mono">{selectedUser.phone}</strong></p>
                            <p>বর্তমান রোল: <strong className="capitalize">{selectedUser.role}</strong></p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                নতুন রোল নির্বাচন করুন:
                            </label>
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value as UserRole)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100"
                            >
                                <option value="student">শিক্ষার্থী (Student - শুধুমাত্র কোর্স এনরোল করতে পারবে)</option>
                                <option value="teacher">শিক্ষক (Teacher - নির্ধারিত কোর্সের বিল্ডার ও প্রশ্ন উত্তর পরিচালনা করতে পারবে)</option>
                                <option value="admin">অ্যাডমিন (Admin - সম্পূর্ণ সিস্টেম নিয়ন্ত্রণ)</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={updatingRole}
                                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50 cursor-pointer transition-colors"
                            >
                                {updatingRole ? 'আপডেট হচ্ছে...' : 'রোল পরিবর্তন নিশ্চিত করুন'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
            {/* Create User Modal */}
            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="নতুন ব্যবহারকারী তৈরি করুন"
                maxWidth="md"
            >
                <form onSubmit={handleCreateUser} className="space-y-4">
                    {createError && (
                        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                            <div>{createError}</div>
                        </div>
                    )}

                    {/* Role Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                            ব্যবহারকারীর ভূমিকা (রোল) নির্বাচন করুন:
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setCreateForm({ ...createForm, role: 'student' })}
                                className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                                    createForm.role === 'student'
                                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 shadow-xs'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <span className="block font-bold text-xs">শিক্ষার্থী</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Student</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCreateForm({ ...createForm, role: 'teacher' })}
                                className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                                    createForm.role === 'teacher'
                                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <span className="block font-bold text-xs">শিক্ষক</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Teacher</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCreateForm({ ...createForm, role: 'admin' })}
                                className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                                    createForm.role === 'admin'
                                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-xs'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <span className="block font-bold text-xs">অ্যাডমিন</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Admin</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            {createForm.role === 'student' && 'শিক্ষার্থী: ওয়েবসাইটে কোর্স কিনতে পারবে, লাইভ/রেকর্ডেড ক্লাসে যোগ দিতে পারবে ও পরীক্ষা দিতে পারবে।'}
                            {createForm.role === 'teacher' && 'শিক্ষক: নির্ধারিত কোর্সের কারিকুলাম, প্রশ্ন ব্যাংক তৈরি, পরীক্ষা গ্রহণ ও লিখিত খাতা মূল্যায়ন করতে পারবে।'}
                            {createForm.role === 'admin' && 'অ্যাডমিন: সমগ্র প্ল্যাটফর্ম, আর্থিক লেনদেন, ইউজার ও সেটিংস পরিচালনার পূর্ণ ক্ষমতা থাকবে।'}
                        </p>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                            পুরো নাম (Full Name) *
                        </label>
                        <div className="relative">
                            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                required
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                placeholder="যেমন: আহমেদ হাসান"
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                মোবাইল নম্বর (Phone) *
                            </label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    required
                                    value={createForm.phone}
                                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                    placeholder="017XXXXXXXX"
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                ইমেইল ঠিকানা (Email) *
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    required
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                    placeholder="user@example.com"
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Password & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                পাসওয়ার্ড (Password) *
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                    placeholder="কমপক্ষে ৬ অক্ষরের"
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                অ্যাকাউন্ট স্ট্যাটাস
                            </label>
                            <select
                                value={createForm.status}
                                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="active">সক্রিয় (Active)</option>
                                <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(false)}
                            className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        >
                            বাতিল
                        </button>
                        <button
                            type="submit"
                            disabled={creatingUser}
                            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                            {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            <span>ব্যবহারকারী তৈরি করুন</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
