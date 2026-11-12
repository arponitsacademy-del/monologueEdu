import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import { Role, PermissionCatalogModule } from '../../../types';
import {
    Shield,
    Plus,
    Edit2,
    Trash2,
    Users,
    CheckCircle2,
    AlertCircle,
    Lock,
    Search,
    RefreshCw,
    X,
    Check,
    Layers,
    BookOpen,
    Boxes,
    ClipboardList,
    ShoppingCart,
    CreditCard,
    TicketPercent,
    Megaphone,
    MessageSquareText,
    Palette,
    BarChart3,
    Settings,
    Bot,
    Sparkles
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
    BookOpen,
    Boxes,
    ClipboardList,
    ShoppingCart,
    CreditCard,
    Users,
    TicketPercent,
    Megaphone,
    MessageSquareText,
    Palette,
    BarChart3,
    Settings,
    Bot,
    Sparkles,
    Layers,
    Shield,
};

export const AdminRolesPage: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [catalog, setCatalog] = useState<PermissionCatalogModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modal state for Create / Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formName, setFormName] = useState('');
    const [formSlug, setFormSlug] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/admin/roles');
            setRoles(data.roles || []);
            setCatalog(data.permission_catalog || []);
        } catch (err: any) {
            setAlertMessage({
                type: 'error',
                text: err.response?.data?.message || 'রোল লোড করতে সমস্যা হয়েছে।',
            });
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingRole(null);
        setFormName('');
        setFormSlug('');
        setFormDescription('');
        setSelectedPermissions([]);
        setFormError(null);
        setModalOpen(true);
    };

    const openEditModal = (role: Role) => {
        setEditingRole(role);
        setFormName(role.name);
        setFormSlug(role.slug);
        setFormDescription(role.description || '');
        setSelectedPermissions(role.permissions || []);
        setFormError(null);
        setModalOpen(true);
    };

    const handleTogglePermission = (key: string) => {
        setSelectedPermissions(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleToggleModuleAll = (modulePerms: string[]) => {
        const allSelected = modulePerms.every(k => selectedPermissions.includes(k));
        if (allSelected) {
            setSelectedPermissions(prev => prev.filter(k => !modulePerms.includes(k)));
        } else {
            setSelectedPermissions(prev => Array.from(new Set([...prev, ...modulePerms])));
        }
    };

    const handleSelectAllGlobal = () => {
        const allKeys = catalog.flatMap(m => m.permissions.map(p => p.key));
        if (selectedPermissions.length === allKeys.length) {
            setSelectedPermissions([]);
        } else {
            setSelectedPermissions(allKeys);
        }
    };

    const handleSaveRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            setFormError('রোলের নাম প্রদান করুন।');
            return;
        }
        if (selectedPermissions.length === 0) {
            setFormError('অন্তত একটি পারমিশন নির্বাচন করুন।');
            return;
        }

        setSaving(true);
        setFormError(null);

        const payload = {
            name: formName.trim(),
            slug: formSlug.trim() || undefined,
            description: formDescription.trim() || undefined,
            permissions: selectedPermissions,
        };

        try {
            if (editingRole) {
                const { data } = await apiClient.put(`/admin/roles/${editingRole.id}`, payload);
                setAlertMessage({ type: 'success', text: data.message || 'রোল আপডেট হয়েছে!' });
            } else {
                const { data } = await apiClient.post('/admin/roles', payload);
                setAlertMessage({ type: 'success', text: data.message || 'নতুন রোল তৈরি হয়েছে!' });
            }
            setModalOpen(false);
            fetchRoles();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'রোল সংরক্ষণ ব্যর্থ হয়েছে।');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (role: Role) => {
        setRoleToDelete(role);
        setDeleteModalOpen(true);
    };

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;
        setDeleting(true);
        try {
            const { data } = await apiClient.delete(`/admin/roles/${roleToDelete.id}`);
            setAlertMessage({ type: 'success', text: data.message || 'রোল মুছে ফেলা হয়েছে।' });
            setDeleteModalOpen(false);
            setRoleToDelete(null);
            fetchRoles();
        } catch (err: any) {
            setAlertMessage({
                type: 'error',
                text: err.response?.data?.message || 'রোল মুছতে ব্যর্থ হয়েছে।',
            });
            setDeleteModalOpen(false);
        } finally {
            setDeleting(false);
        }
    };

    const allPermissionKeys = catalog.flatMap(m => m.permissions.map(p => p.key));
    const isAllSelected = allPermissionKeys.length > 0 && selectedPermissions.length === allPermissionKeys.length;

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.slug.toLowerCase().includes(search.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                কাস্টম রোল ও পারমিশন কন্ট্রোল
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                প্রতিটি স্টাফ বা মডারেটরের জন্য কাস্টম রোল তৈরি করে নির্দিষ্ট ফিচারের অ্যাক্সেস নির্ধারণ করুন।
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={fetchRoles}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 transition shadow-2xs cursor-pointer"
                        title="রিফ্রেশ করুন"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm shadow-sky-600/30 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>নতুন রোল তৈরি করুন</span>
                    </button>
                </div>
            </div>

            {/* Alert Notification */}
            {alertMessage && (
                <div className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn ${
                    alertMessage.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}>
                    <div className="flex items-center gap-2.5">
                        {alertMessage.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{alertMessage.text}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAlertMessage(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center font-bold">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white block leading-tight">
                            {roles.length}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            মোট কাস্টম রোল
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white block leading-tight">
                            {roles.reduce((acc, r) => acc + (r.users_count || 0), 0)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            নিয়োজিত ইউজার
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-bold">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white block leading-tight">
                            {allPermissionKeys.length}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            মোট পারমিশন পয়েন্ট
                        </span>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="রোলের নাম বা বিবরণ দিয়ে খুঁজুন..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                </div>
            </div>

            {/* Roles Table / Cards */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
                    <p className="text-xs font-semibold">রোলসমূহ লোড হচ্ছে...</p>
                </div>
            ) : filteredRoles.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                        কোনো কাস্টম রোল পাওয়া যায়নি
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        আপনার অ্যাকাডেমির বিভিন্ন কাজের জন্য (যেমন: লাইব্রেরিয়ান, কোর্স ম্যানেজার, অ্যাকাউন্ট্যান্ট) নতুন রোল তৈরি করুন।
                    </p>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>প্রথম রোল তৈরি করুন</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredRoles.map((role) => {
                        const permCount = role.permissions?.length || 0;
                        return (
                            <div
                                key={role.id}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-2xs hover:border-sky-300 dark:hover:border-sky-800 transition group"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center font-bold">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                                    {role.name}
                                                </h3>
                                                <span className="text-[11px] font-mono font-medium text-slate-400 block">
                                                    @{role.slug}
                                                </span>
                                            </div>
                                        </div>

                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            <span>{role.users_count || 0} জন ইউজার</span>
                                        </span>
                                    </div>

                                    {role.description && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                            {role.description}
                                        </p>
                                    )}

                                    {/* Permissions badges */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-bold text-slate-600 dark:text-slate-300">
                                                বরাদ্দকৃত পারমিশন:
                                            </span>
                                            <span className="font-extrabold text-sky-600">
                                                {permCount} টি
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-hidden">
                                            {role.permissions?.slice(0, 4).map((pKey) => {
                                                const found = catalog
                                                    .flatMap(m => m.permissions)
                                                    .find(p => p.key === pKey);
                                                return (
                                                    <span
                                                        key={pKey}
                                                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                    >
                                                        {found?.label ? found.label.split('(')[0].trim() : pKey}
                                                    </span>
                                                );
                                            })}
                                            {permCount > 4 && (
                                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-600">
                                                    +{permCount - 4} টি আরও
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions bottom bar */}
                                <div className="flex items-center justify-end gap-2 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(role)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                    >
                                        <Edit2 className="w-3.5 h-3.5 text-sky-500" />
                                        <span>এডিট</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => confirmDelete(role)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>মুছুন</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: Create / Edit Role */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        {editingRole ? `রোল সম্পাদনা: ${editingRole.name}` : 'নতুন কাস্টম রোল তৈরি করুন'}
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        রোলের নাম এবং অ্যাক্সেসযোগ্য মডিউলের পারমিশন নির্বাচন করুন।
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form Scroll Area */}
                        <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-6 space-y-6">
                            {formError && (
                                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {/* Basic Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        রোলের নাম <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="যেমন: লাইব্রেরিয়ান, কোর্স ম্যানেজার, হিসাবরক্ষক"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        স্লাগ / আইডেন্টিফায়ার (ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="text"
                                        value={formSlug}
                                        onChange={(e) => setFormSlug(e.target.value)}
                                        placeholder="যেমন: librarian (খালি রাখলে স্বয়ংক্রিয় তৈরি হবে)"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        রোলের সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="text"
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="এই রোলটির দায়িত্ব ও উদ্দেশ্য লিখুন..."
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* Permission Selector Header */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-sky-500" />
                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                        মডিউলভিত্তিক পারমিশন নির্বাচন করুন
                                    </h4>
                                    <span className="text-[11px] font-bold text-slate-400">
                                        ({selectedPermissions.length}/{allPermissionKeys.length} টি নির্বাচিত)
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSelectAllGlobal}
                                    className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                                >
                                    {isAllSelected ? 'সব আনচেক করুন' : 'সকল পারমিশন সিলেক্ট করুন'}
                                </button>
                            </div>

                            {/* Permission Modules Accordion / Grid */}
                            <div className="space-y-4">
                                {catalog.map((mod) => {
                                    const IconComponent = ICON_MAP[mod.icon] || Layers;
                                    const modPermKeys = mod.permissions.map(p => p.key);
                                    const modSelectedCount = modPermKeys.filter(k => selectedPermissions.includes(k)).length;
                                    const isModAllSelected = modPermKeys.length > 0 && modSelectedCount === modPermKeys.length;

                                    return (
                                        <div
                                            key={mod.module}
                                            className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-sky-600 flex items-center justify-center shadow-2xs">
                                                        <IconComponent className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                                            {mod.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {modSelectedCount}/{modPermKeys.length} টি সক্রিয়
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleModuleAll(modPermKeys)}
                                                    className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 cursor-pointer"
                                                >
                                                    {isModAllSelected ? 'আনচেক করুন' : 'মডিউলের সব নির্বাচন করুন'}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                                {mod.permissions.map((perm) => {
                                                    const isChecked = selectedPermissions.includes(perm.key);
                                                    return (
                                                        <label
                                                            key={perm.key}
                                                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                                                                isChecked
                                                                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200'
                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handleTogglePermission(perm.key)}
                                                                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                                                            />
                                                            <div className="leading-snug">
                                                                <span className="font-bold block">
                                                                    {perm.label.split('(')[0].trim()}
                                                                </span>
                                                                {perm.label.includes('(') && (
                                                                    <span className="text-[10px] text-slate-400 block font-mono">
                                                                        {perm.label.split('(')[1].replace(')', '')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Modal Footer inside form */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm shadow-sky-600/30 disabled:opacity-60 cursor-pointer"
                                >
                                    {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{editingRole ? 'রোল আপডেট করুন' : 'রোল সংরক্ষণ করুন'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Confirm Delete */}
            {deleteModalOpen && roleToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                আপনি কি নিশ্চিত?
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                কাস্টম রোল <strong>'{roleToDelete.name}'</strong> স্থায়ীভাবে মুছে ফেলা হবে।
                            </p>
                            {(roleToDelete.users_count || 0) > 0 && (
                                <p className="text-xs text-rose-600 font-bold mt-2 bg-rose-50 dark:bg-rose-950/50 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                                    সতর্কতা: এই রোলে বর্তমানে {roleToDelete.users_count} জন ইউজার নিয়োজিত আছে। প্রথমে তাদের রোল পরিবর্তন করুন।
                                </p>
                            )}
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(false)}
                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
                            >
                                বাতিল
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteRole}
                                disabled={deleting || (roleToDelete.users_count || 0) > 0}
                                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                {deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

