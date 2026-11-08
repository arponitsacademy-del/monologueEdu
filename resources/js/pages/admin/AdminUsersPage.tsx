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
    User as UserIcon,
    ExternalLink,
    Calendar,
    DollarSign,
    Clock,
    ClipboardList,
    ShoppingCart,
    Share2,
    Award
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
        designation: '',
        institution: '',
        photo_url: '',
        bio: '',
    });

    // Delete User state
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

    // User Details Modal state
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [userDetails, setUserDetails] = useState<any | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'courses' | 'orders' | 'exams' | 'instructed' | 'teacher_profile'>('courses');
    const [savingTeacherProfile, setSavingTeacherProfile] = useState(false);
    const [teacherProfileForm, setTeacherProfileForm] = useState({
        designation: '',
        institution: '',
        photo_url: '',
        bio: '',
        is_featured: true,
    });

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
            setError(err.response?.data?.message || 'Failed to load user information. Please try again.');
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
            alert(data.message || 'User role updated successfully.');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update user role.');
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleToggleStatus = async (userToToggle: User) => {
        const actionName = userToToggle.status === 'active' ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${actionName} this account?`)) return;

        try {
            const { data } = await apiClient.post(`/admin/users/${userToToggle.id}/status`);
            setUsers(prev => prev.map(u => u.id === userToToggle.id ? data.user : u));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update account status.');
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
                designation: '',
                institution: '',
                photo_url: '',
                bio: '',
            });
            alert(data.message || 'New user created successfully.');
        } catch (err: any) {
            setCreateError(err.response?.data?.message || 'Failed to create user. Please verify all inputs.');
        } finally {
            setCreatingUser(false);
        }
    };

    const handleDeleteUser = async (userToDelete: User) => {
        if (currentUser && currentUser.id === userToDelete.id) {
            alert('You cannot delete your own admin account.');
            return;
        }

        const roleLabel = userToDelete.role === 'admin' ? 'Admin' : (userToDelete.role === 'teacher' ? 'Instructor' : 'Student');
        const confirmMessage = `Are you sure you want to permanently delete ${roleLabel} "${userToDelete.name}" (${userToDelete.phone || userToDelete.email})?\n\nWarning: This action cannot be undone!`;

        if (!window.confirm(confirmMessage)) return;

        setDeletingUserId(userToDelete.id);
        try {
            const { data } = await apiClient.delete(`/admin/users/${userToDelete.id}`);
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
            alert(data.message || 'User account deleted successfully.');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete user account.');
        } finally {
            setDeletingUserId(null);
        }
    };

    const handleOpenUserDetails = async (u: User) => {
        setUserDetails(u);
        setDetailsModalOpen(true);
        setLoadingDetails(true);
        setActiveDetailTab(u.role === 'teacher' ? 'teacher_profile' : 'courses');
        setTeacherProfileForm({
            designation: (u as any).teacher_profile?.designation || '',
            institution: (u as any).teacher_profile?.institution || '',
            photo_url: (u as any).teacher_profile?.photo_url || '',
            bio: (u as any).teacher_profile?.bio || '',
            is_featured: (u as any).teacher_profile?.is_featured ?? true,
        });

        try {
            const { data } = await apiClient.get(`/admin/users/${u.id}`);
            setUserDetails(data.user);
            if (data.user.teacher_profile) {
                setTeacherProfileForm({
                    designation: data.user.teacher_profile.designation || '',
                    institution: data.user.teacher_profile.institution || '',
                    photo_url: data.user.teacher_profile.photo_url || '',
                    bio: data.user.teacher_profile.bio || '',
                    is_featured: data.user.teacher_profile.is_featured ?? true,
                });
            }
        } catch (err: any) {
            console.error('Failed to load user details', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSaveTeacherProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userDetails) return;
        setSavingTeacherProfile(true);
        try {
            const { data } = await apiClient.put(`/admin/users/${userDetails.id}/teacher-profile`, teacherProfileForm);
            setUserDetails((prev: any) => ({
                ...prev,
                teacher_profile: data.teacher_profile,
            }));
            setUsers((prev) =>
                prev.map((u) => (u.id === userDetails.id ? { ...u, teacher_profile: data.teacher_profile } : u))
            );
            alert(data.message || 'Instructor profile saved successfully.');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update instructor profile.');
        } finally {
            setSavingTeacherProfile(false);
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
                        <span>User Management</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Manage all student, instructor and administrator accounts, roles and status controls
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
                        <span>Create New User</span>
                    </button>
                    <button
                        onClick={() => fetchUsers()}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-500' : ''}`} />
                        <span>Refresh</span>
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
                    All Users
                </button>
                <button
                    onClick={() => handleTabChange('student')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeRoleTab === 'student'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    Students
                </button>
                <button
                    onClick={() => handleTabChange('teacher')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeRoleTab === 'teacher'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    Instructors
                </button>
                <button
                    onClick={() => handleTabChange('admin')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeRoleTab === 'admin'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    Admins
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, phone or email..."
                        className="w-full pl-10 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <button
                        type="submit"
                        className="absolute right-2 top-2 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                        Search
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
                        <option value="">All Roles</option>
                        <option value="student">Student</option>
                        <option value="teacher">Instructor</option>
                        <option value="admin">Admin</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            applyFilters({ status: e.target.value, page: 1 });
                        }}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
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
                            Reset
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
                        Retry
                    </button>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="py-4 px-6">User</th>
                                <th className="py-4 px-4">Phone Number</th>
                                <th className="py-4 px-4">Email</th>
                                <th className="py-4 px-4">Role</th>
                                <th className="py-4 px-4">Enrollments / Courses</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-4">Joined Date</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400">
                                        <div className="inline-flex items-center gap-2">
                                            <RefreshCw className="w-5 h-5 animate-spin text-sky-500" />
                                            <span>Loading users...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400">
                                        <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                        <p className="font-semibold">No users found.</p>
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
                                                Clear filters to view all users
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
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenUserDetails(u)}
                                                    className="flex items-center gap-3 text-left group cursor-pointer focus:outline-hidden"
                                                    title="Click to view details and enrollments"
                                                >
                                                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center text-sm shrink-0 border border-sky-200/50 dark:border-sky-800/50 group-hover:scale-105 group-hover:border-sky-400 transition-all">
                                                        {initial}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                                                            <span>{u.name || 'Unknown User'}</span>
                                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-sky-500 transition-opacity" />
                                                        </h4>
                                                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                            <span>ID: #{u.id}</span>
                                                            <span>•</span>
                                                            <span className="text-sky-500 font-medium">View Profile</span>
                                                        </span>
                                                    </div>
                                                </button>
                                            </td>

                                            <td className="py-4 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{u.phone || '-'}</td>
                                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{u.email || '-'}</td>

                                            <td className="py-4 px-4">
                                                {u.role === 'admin' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                                                        <Shield className="w-3 h-3" />
                                                        Admin
                                                    </span>
                                                ) : u.role === 'teacher' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                                                        <GraduationCap className="w-3 h-3" />
                                                        Instructor
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                                                        Student
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                                                {u.role === 'teacher' ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                                                        <BookOpen className="w-3 h-3" />
                                                        {u.instructed_courses_count || 0} Courses
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                                                        <BookOpen className="w-3 h-3" />
                                                        {u.enrollments_count || 0} Enrollments
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4">
                                                {u.status === 'active' ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US') : '-'}
                                            </td>

                                            <td className="py-4 px-6 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => openRoleModal(u)}
                                                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                                    >
                                                        Change Role
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(u)}
                                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                            u.status === 'active'
                                                                ? 'hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                                                                : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                        title={u.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                                                    >
                                                        {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u)}
                                                        disabled={deletingUserId === u.id || (currentUser?.id === u.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title={currentUser?.id === u.id ? 'Cannot delete your own account' : 'Delete user account'}
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
                            Total <strong className="text-slate-800 dark:text-slate-200 font-mono">{pagination.total}</strong> users • Page <strong className="text-slate-800 dark:text-slate-200 font-mono">{pagination.currentPage}</strong> of <strong className="text-slate-800 dark:text-slate-200 font-mono">{pagination.lastPage}</strong>
                        </div>

                        {pagination.lastPage > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage <= 1}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                    title="Previous Page"
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
                                    title="Next Page"
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
                title="Change User Role"
                maxWidth="sm"
            >
                {selectedUser && (
                    <form onSubmit={handleUpdateRole} className="space-y-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 space-y-1">
                            <p>User: <strong>{selectedUser.name}</strong></p>
                            <p>Phone: <strong className="font-mono">{selectedUser.phone}</strong></p>
                            <p>Current Role: <strong className="capitalize">{selectedUser.role}</strong></p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                Select New Role:
                            </label>
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value as UserRole)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100"
                            >
                                <option value="student">Student (Can enroll and learn in courses)</option>
                                <option value="teacher">Instructor (Can manage assigned courses, exams & question banks)</option>
                                <option value="admin">Admin (Full administrative access)</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={updatingRole}
                                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50 cursor-pointer transition-colors"
                            >
                                {updatingRole ? 'Updating...' : 'Confirm Role Change'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
            {/* Create User Modal */}
            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Create New User"
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
                            Select User Role:
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
                                <span className="block font-bold text-xs">Student</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Learner</span>
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
                                <span className="block font-bold text-xs">Instructor</span>
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
                                <span className="block font-bold text-xs">Admin</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Manager</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            {createForm.role === 'student' && 'Student: Can purchase and view enrolled courses, participate in exams and community.'}
                            {createForm.role === 'teacher' && 'Instructor: Can build curriculum, manage question banks, conduct and evaluate exams.'}
                            {createForm.role === 'admin' && 'Admin: Has full administrative privilege over finances, content and users.'}
                        </p>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                            Full Name *
                        </label>
                        <div className="relative">
                            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                required
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                placeholder="e.g. John Doe"
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                Phone Number *
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
                                Email Address *
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

                    {/* Teacher Specific Fields */}
                    {createForm.role === 'teacher' && (
                        <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/60 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                                <GraduationCap className="w-4 h-4" />
                                <span>Instructor Profile Details</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Designation
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.designation}
                                        onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                                        placeholder="e.g. Senior Physics Instructor"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Institution / Education
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.institution}
                                        onChange={(e) => setCreateForm({ ...createForm, institution: e.target.value })}
                                        placeholder="e.g. BUET / University of Dhaka"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Profile Photo URL
                                </label>
                                <input
                                    type="url"
                                    value={createForm.photo_url}
                                    onChange={(e) => setCreateForm({ ...createForm, photo_url: e.target.value })}
                                    placeholder="https://example.com/teacher-photo.jpg"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Short Biography (Bio)
                                </label>
                                <textarea
                                    rows={2}
                                    value={createForm.bio}
                                    onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                                    placeholder="Brief background and teaching methodology..."
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 font-medium"
                                />
                            </div>
                        </div>
                    )}

                    {/* Password & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                Password *
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                    placeholder="At least 6 characters"
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                Account Status
                            </label>
                            <select
                                value={createForm.status}
                                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(false)}
                            className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creatingUser}
                            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                            {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            <span>Create User</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* User Details & Enrolled Courses Modal */}
            <Modal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                title="User Profile & Enrolled Courses"
                maxWidth="xl"
            >
                {userDetails && (
                    <div className="space-y-6">
                        {/* Profile Header Card */}
                        <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/20 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xl shadow-md shrink-0">
                                        {(userDetails.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                                                {userDetails.name || 'Unknown User'}
                                            </h3>
                                            <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                ID: #{userDetails.id}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            {userDetails.role === 'admin' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
                                                    <Shield className="w-3 h-3" />
                                                    Admin
                                                </span>
                                            ) : userDetails.role === 'teacher' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60">
                                                    <GraduationCap className="w-3 h-3" />
                                                    Instructor
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60">
                                                    Student
                                                </span>
                                            )}

                                            {userDetails.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                                                    <UserCheck className="w-3 h-3" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60">
                                                    <UserX className="w-3 h-3" />
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-center">
                                    <button
                                        onClick={() => {
                                            openRoleModal(userDetails);
                                        }}
                                        className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
                                    >
                                        Change Role
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleToggleStatus(userDetails);
                                        }}
                                        className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
                                    >
                                        {userDetails.status === 'active' ? 'Deactivate' : 'Activate'}
                                    </button>
                                    {userDetails.role === 'teacher' && (
                                        <a
                                            href={`/teachers/${userDetails.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>Public Profile</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Contact Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <Phone className="w-4 h-4 text-sky-500 shrink-0" />
                                    <div>
                                        <span className="block text-[10px] text-slate-400">Mobile Number</span>
                                        <a href={`tel:${userDetails.phone}`} className="font-mono font-bold hover:underline">
                                            {userDetails.phone || 'Not provided'}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <div>
                                        <span className="block text-[10px] text-slate-400">Email Address</span>
                                        <a href={`mailto:${userDetails.email}`} className="font-semibold truncate max-w-[170px] block hover:underline">
                                            {userDetails.email || 'Not provided'}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                                    <div>
                                        <span className="block text-[10px] text-slate-400">Joined Date</span>
                                        <span className="font-semibold">
                                            {userDetails.created_at ? new Date(userDetails.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            }) : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto scrollbar-none">
                            <button
                                onClick={() => setActiveDetailTab('courses')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    activeDetailTab === 'courses'
                                        ? 'bg-sky-600 text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Enrolled Courses</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    activeDetailTab === 'courses' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                                }`}>
                                    {userDetails.enrolled_courses?.length ?? userDetails.enrollments_count ?? 0}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveDetailTab('orders')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    activeDetailTab === 'orders'
                                        ? 'bg-sky-600 text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Orders & Payments</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    activeDetailTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                                }`}>
                                    {userDetails.orders?.length ?? userDetails.orders_count ?? 0}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveDetailTab('exams')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    activeDetailTab === 'exams'
                                        ? 'bg-sky-600 text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <ClipboardList className="w-3.5 h-3.5" />
                                <span>Exam Results</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    activeDetailTab === 'exams' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                                }`}>
                                    {userDetails.exam_submissions?.length ?? userDetails.exam_submissions_count ?? 0}
                                </span>
                            </button>

                            {userDetails.role === 'teacher' && (
                                <>
                                    <button
                                        onClick={() => setActiveDetailTab('instructed')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                            activeDetailTab === 'instructed'
                                                ? 'bg-purple-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        <span>Teaching Courses</span>
                                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
                                            {userDetails.instructed_courses?.length ?? 0}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => setActiveDetailTab('teacher_profile')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                            activeDetailTab === 'teacher_profile'
                                                ? 'bg-purple-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>Teacher Profile Info</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* TAB 1: ENROLLED COURSES */}
                        {activeDetailTab === 'courses' && (
                            <div className="space-y-3">
                                {loadingDetails ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                                        <Loader2 className="w-7 h-7 animate-spin text-sky-500 mb-2" />
                                        <span className="text-xs font-medium">Loading enrolled courses...</span>
                                    </div>
                                ) : !userDetails.enrolled_courses || userDetails.enrolled_courses.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                        <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No courses enrolled</p>
                                        <p className="text-xs text-slate-400 mt-1">This student has not enrolled in any paid or free courses yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {userDetails.enrolled_courses.map((course: any) => (
                                            <div
                                                key={course.id}
                                                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 shadow-2xs flex flex-col justify-between hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                                        {course.thumbnail ? (
                                                            <img
                                                                src={course.thumbnail}
                                                                alt={course.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                <BookOpen className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm line-clamp-2">
                                                            {course.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">
                                                                ৳{course.sale_price || course.price}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                                {course.pivot?.status === 'active' ? 'Enrolled (Active)' : (course.pivot?.status || 'Active')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-sky-500" />
                                                        Enrolled: {course.pivot?.enrolled_at ? new Date(course.pivot.enrolled_at).toLocaleDateString('en-US') : (course.pivot?.created_at ? new Date(course.pivot.created_at).toLocaleDateString('en-US') : '-')}
                                                    </span>
                                                    <a
                                                        href={`/courses/${course.slug || course.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                                                    >
                                                        <span>Course Page</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: ORDERS & PAYMENTS */}
                        {activeDetailTab === 'orders' && (
                            <div className="space-y-3">
                                {loadingDetails ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                                        <Loader2 className="w-7 h-7 animate-spin text-sky-500 mb-2" />
                                        <span className="text-xs font-medium">Loading orders...</span>
                                    </div>
                                ) : !userDetails.orders || userDetails.orders.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                        <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No orders found</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="py-2.5 px-3">Order #</th>
                                                    <th className="py-2.5 px-3">Course</th>
                                                    <th className="py-2.5 px-3">Amount</th>
                                                    <th className="py-2.5 px-3">Payment Method</th>
                                                    <th className="py-2.5 px-3">Status</th>
                                                    <th className="py-2.5 px-3 text-right">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {userDetails.orders.map((order: any) => (
                                                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                                            {order.order_number}
                                                        </td>
                                                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                                                            {order.course?.title || 'Course'}
                                                        </td>
                                                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                                                            ৳{order.final_amount}
                                                        </td>
                                                        <td className="py-2.5 px-3 uppercase text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                                            {order.payment_method}
                                                        </td>
                                                        <td className="py-2.5 px-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                order.payment_status === 'paid'
                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                            }`}>
                                                                {order.payment_status === 'paid' ? 'Paid' : (order.payment_status || 'Pending')}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right text-slate-400">
                                                            {new Date(order.created_at).toLocaleDateString('en-US')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: EXAM SUBMISSIONS */}
                        {activeDetailTab === 'exams' && (
                            <div className="space-y-3">
                                {loadingDetails ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                                        <Loader2 className="w-7 h-7 animate-spin text-sky-500 mb-2" />
                                        <span className="text-xs font-medium">Loading exam records...</span>
                                    </div>
                                ) : !userDetails.exam_submissions || userDetails.exam_submissions.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                        <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No exam submissions found</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="py-2.5 px-3">Exam Title</th>
                                                    <th className="py-2.5 px-3">Marks Obtained</th>
                                                    <th className="py-2.5 px-3">Correct / Wrong</th>
                                                    <th className="py-2.5 px-3">Status</th>
                                                    <th className="py-2.5 px-3 text-right">Submitted At</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {userDetails.exam_submissions.map((sub: any) => (
                                                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                                            {sub.exam?.title || 'Exam'}
                                                        </td>
                                                        <td className="py-2.5 px-3 font-bold text-emerald-600">
                                                            {sub.obtained_marks} / {sub.total_marks}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                                            <span className="text-emerald-600 font-bold">{sub.total_correct || 0}</span> Correct, <span className="text-rose-600 font-bold">{sub.total_wrong || 0}</span> Wrong
                                                        </td>
                                                        <td className="py-2.5 px-3">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                                                                {sub.status === 'evaluated' ? 'Evaluated' : (sub.status || 'Submitted')}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right text-slate-400">
                                                            {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-US') : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 4: INSTRUCTED COURSES (if teacher) */}
                        {activeDetailTab === 'instructed' && userDetails.role === 'teacher' && (
                            <div className="space-y-3">
                                {!userDetails.instructed_courses || userDetails.instructed_courses.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                        <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Not instructing any courses</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {userDetails.instructed_courses.map((course: any) => (
                                            <div
                                                key={course.id}
                                                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 shadow-2xs flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold shrink-0">
                                                        <BookOpen className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm line-clamp-1">
                                                            {course.title}
                                                        </h4>
                                                        <span className="text-[11px] text-slate-400">Fee: ৳{course.price} • Status: {course.status}</span>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`/courses/${course.slug || course.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 text-slate-400 hover:text-purple-600"
                                                    title="Course Page"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 5: TEACHER PROFILE SETTINGS (if teacher) */}
                        {activeDetailTab === 'teacher_profile' && userDetails.role === 'teacher' && (
                            <form onSubmit={handleSaveTeacherProfile} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-750">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                                Instructor Profile & Homepage Carousel Information
                                            </h4>
                                            <p className="text-[11px] text-slate-400">
                                                The information and photo provided here will be featured in the homepage instructor carousel and the instructor's public profile.
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={`/teachers/${userDetails.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
                                    >
                                        <span>Profile Page</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                            Designation
                                        </label>
                                        <input
                                            type="text"
                                            value={teacherProfileForm.designation}
                                            onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, designation: e.target.value })}
                                            placeholder="e.g. Senior Physics Instructor"
                                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                            Institution / Educational Background
                                        </label>
                                        <input
                                            type="text"
                                            value={teacherProfileForm.institution}
                                            onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, institution: e.target.value })}
                                            placeholder="e.g. BUET (CSE), University of Dhaka"
                                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                        Profile Photo URL
                                    </label>
                                    <div className="flex gap-3 items-center">
                                        {teacherProfileForm.photo_url ? (
                                            <img
                                                src={teacherProfileForm.photo_url}
                                                alt="Preview"
                                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                                onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                {(userDetails.name || 'T').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <input
                                            type="url"
                                            value={teacherProfileForm.photo_url}
                                            onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, photo_url: e.target.value })}
                                            placeholder="https://example.com/teacher-photo.jpg"
                                            className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                        Bio & Summary
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={teacherProfileForm.bio}
                                        onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, bio: e.target.value })}
                                        placeholder="Instructor's experience, teaching methodology, and message to students..."
                                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="is_featured"
                                        checked={teacherProfileForm.is_featured}
                                        onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, is_featured: e.target.checked })}
                                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                                    />
                                    <label htmlFor="is_featured" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                        Feature in Homepage Instructor Carousel
                                    </label>
                                </div>

                                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-750 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={savingTeacherProfile}
                                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                        {savingTeacherProfile ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        <span>Save Information</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
