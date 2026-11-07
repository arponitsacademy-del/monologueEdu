import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher';
import { apiClient } from '../api/client';
import { AppNotification } from '../types';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    ShoppingCart,
    BarChart3,
    MessageSquare,
    Settings,
    LogOut,
    Bell,
    Menu,
    X,
    ChevronRight,
    ChevronDown,
    MessageSquareText,
    Shield,
    GraduationCap,
    CheckCheck,
    ExternalLink,
    Image as ImageIcon,
    Layers,
    Palette,
    CreditCard,
    Bot,
    Sparkles,
    ClipboardList,
    Share2
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { settings } = useSettings();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
        '/admin/sms': true,
        '/admin/appearance': true,
        '/admin/payments': true,
        '/admin/nexpilot': true,
        '/admin/exams': true,
        '/teacher/exams': true,
    });

    const toggleSubmenu = (path: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setExpandedMenus(prev => ({
            ...prev,
            [path]: !prev[path],
        }));
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // 30s polling
        return () => clearInterval(interval);
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data } = await apiClient.get('/notifications');
            setNotifications(data.data || []);
            const unreadRes = await apiClient.get('/notifications/unread-count');
            setUnreadCount(unreadRes.data.unread_count || 0);
        } catch {
            // silent fail
        }
    };

    const markAllRead = async () => {
        try {
            await apiClient.post('/notifications/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
        } catch {}
    };

    const handleNotifClick = async (notif: AppNotification) => {
        if (!notif.read_at) {
            try {
                await apiClient.post(`/notifications/${notif.id}/read`);
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch {}
        }
        setNotifDropdownOpen(false);
        if (notif.data.link) {
            navigate(notif.data.link);
        }
    };

    if (!user) return null;

    // Navigation links per role
    const getNavLinks = () => {
        if (user.role === 'admin') {
            return [
                { title: t.sidebar.dashboard, path: '/admin', icon: LayoutDashboard },
                { title: t.sidebar.media, path: '/admin/media', icon: ImageIcon },
                { 
                    title: t.sidebar.courses, 
                    path: '/admin/courses', 
                    icon: BookOpen,
                    children: [
                        { title: t.sidebar.createCourse, path: '/admin/courses/create' },
                        { title: t.sidebar.courseManagement, path: '/admin/courses' },
                        { title: t.sidebar.courseCategories, path: '/admin/courses/categories' },
                    ]
                },
                { 
                    title: 'NexPilot', 
                    path: '/admin/nexpilot', 
                    icon: Bot,
                    children: [
                        { title: 'New Pilot', path: '/admin/nexpilot/new' },
                        { title: 'All Pilots', path: '/admin/nexpilot' },
                        { title: 'AI Model Configuration', path: '/admin/nexpilot/ai-configuration' },
                    ]
                },
                { 
                    title: t.sidebar.examManagement || 'Exam Management', 
                    path: '/admin/exams', 
                    icon: ClipboardList,
                    children: [
                        { title: t.sidebar.createExam || 'Create New Exam', path: '/admin/exams/create' },
                        { title: t.sidebar.allExams || 'All Exams', path: '/admin/exams' },
                    ]
                },
                { title: t.sidebar.pages || 'Pages', path: '/admin/pages', icon: Layers },
                { 
                    title: t.sidebar.appearance, 
                    path: '/admin/appearance', 
                    icon: Palette,
                    children: [
                        { title: t.sidebar.appearanceGeneral || 'General', path: '/admin/appearance/general' },
                        { title: t.sidebar.headerBuilder, path: '/admin/appearance/header' },
                        { title: t.sidebar.footerBuilder, path: '/admin/appearance/footer' },
                    ]
                },
                { title: t.sidebar.orders, path: '/admin/orders', icon: ShoppingCart },
                { 
                    title: 'Affiliate', 
                    path: '/admin/affiliate', 
                    icon: Share2,
                    children: [
                        { title: 'General Settings', path: '/admin/affiliate/settings' },
                        { title: 'Course Commissions', path: '/admin/affiliate/courses' },
                        { title: 'Affiliates & Payouts', path: '/admin/affiliate/members' },
                    ]
                },
                { 
                    title: t.sidebar.payments, 
                    path: '/admin/payments', 
                    icon: CreditCard,
                    children: [
                        { title: t.sidebar.manualPayment, path: '/admin/payments/manual' },
                    ]
                },
                { title: t.sidebar.analytics, path: '/admin/analytics', icon: BarChart3 },
                { 
                    title: t.sidebar.sms, 
                    path: '/admin/sms', 
                    icon: MessageSquareText,
                    children: [
                        { title: t.sidebar.smsConfig, path: '/admin/sms' },
                        { title: t.sidebar.smsMarketing, path: '/admin/sms-marketing' },
                    ]
                },
                { title: t.sidebar.users, path: '/admin/users', icon: Users },
                { title: t.sidebar.settings, path: '/admin/settings', icon: Settings },
            ];
        }
        if (user.role === 'teacher') {
            return [
                { title: t.sidebar.dashboard, path: '/teacher', icon: LayoutDashboard },
                { title: t.sidebar.myCourses, path: '/teacher/courses', icon: BookOpen },
                { 
                    title: t.sidebar.examManagement || 'Exam Management', 
                    path: '/teacher/exams', 
                    icon: ClipboardList,
                    children: [
                        { title: t.sidebar.createExam || 'Create New Exam', path: '/teacher/exams/create' },
                        { title: t.sidebar.allExams || 'All Exams', path: '/teacher/exams' },
                    ]
                },
                { title: t.sidebar.studentQuestions, path: '/teacher/questions', icon: MessageSquare },
            ];
        }
        // Student
        return [
            { title: t.sidebar.dashboard, path: '/student', icon: LayoutDashboard },
            { title: t.sidebar.myCourses, path: '/student/my-courses', icon: BookOpen },
            { title: 'আমার পরীক্ষাসমূহ', path: '/student/exams', icon: ClipboardList },
            { title: t.sidebar.myOrders, path: '/student/orders', icon: ShoppingCart },
            { title: 'Affiliate Program', path: '/student/affiliate', icon: Share2 },
        ];
    };

    const navLinks = getNavLinks();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-150">
            {/* Desktop Left Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-slate-800 text-slate-300 select-none shrink-0">
                <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/80">
                    <Link to="/" className="flex items-center gap-3">
                        {settings?.logo_url ? (
                            <img
                                src={settings.logo_url}
                                alt={settings.site_name || 'Novonex Academy'}
                                className="h-9 w-auto max-w-[170px] object-contain"
                            />
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-xl font-black text-white tracking-tight">
                                        {settings?.site_name ? settings.site_name.split(' ')[0] : 'Novonex'}
                                    </span>
                                    <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest -mt-1">
                                        {user.role === 'admin' ? t.nav.adminPanel : user.role === 'teacher' ? t.nav.instructorPortal : t.nav.studentHub}
                                    </span>
                                </div>
                            </>
                        )}
                    </Link>
                </div>

                <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    {navLinks.map((item) => {
                        const Icon = item.icon;
                        const hasChildren = Boolean(item.children && item.children.length > 0);
                        const isChildActive = hasChildren && (
                            item.children?.some(c => location.pathname === c.path) ||
                            (item.path !== '/admin' && location.pathname.startsWith(item.path))
                        );
                        const isActive = (!hasChildren && (location.pathname === item.path || 
                            (item.path !== '/admin' && item.path !== '/teacher' && item.path !== '/student' && location.pathname.startsWith(item.path)))) || isChildActive;
                        const isExpanded = expandedMenus[item.path] ?? isChildActive;

                        return (
                            <div key={item.path} className="space-y-1">
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        onClick={() => toggleSubmenu(item.path)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                                            isActive
                                                ? 'bg-slate-800/80 text-sky-400'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5" />
                                            <span>{item.title}</span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 opacity-80" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 opacity-50" />
                                        )}
                                    </button>
                                ) : (
                                    <Link
                                        to={item.path}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                                            isActive
                                                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5" />
                                            <span>{item.title}</span>
                                        </div>
                                        {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                                    </Link>
                                )}

                                {hasChildren && isExpanded && (
                                    <div className="pl-6 pt-1 space-y-1">
                                        {item.children?.map(child => {
                                            const isSelected = location.pathname === child.path || (
                                                child.path === '/admin/courses' && 
                                                location.pathname.startsWith('/admin/courses') && 
                                                location.pathname !== '/admin/courses/create' && 
                                                location.pathname !== '/admin/courses/categories'
                                            );
                                            return (
                                                <Link
                                                    key={child.path}
                                                    to={child.path}
                                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                                        isSelected
                                                            ? 'bg-sky-600 text-white shadow-sm'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-500'}`} />
                                                    <span>{child.title}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Bottom User Box */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 truncate">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-sm border border-sky-500/30">
                                {user.name.charAt(0)}
                            </div>
                            <div className="truncate">
                                <div className="text-sm font-bold text-white truncate">{user.name}</div>
                                <div className="text-xs text-slate-400 capitalize flex items-center gap-1">
                                    {user.role === 'admin' ? <Shield className="w-3 h-3 text-amber-400" /> : <GraduationCap className="w-3 h-3 text-sky-400" />}
                                    {user.role}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            title={t.sidebar.logout}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs transition-colors duration-150">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                            {user.role === 'admin' ? 'অ্যাডমিন কন্ট্রোল সেন্টার' : user.role === 'teacher' ? 'শিক্ষক ড্যাশবোর্ড' : 'শিক্ষার্থী ড্যাশবোর্ড'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            to="/"
                            target="_blank"
                            className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span>মূল ওয়েবসাইট</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {notifDropdownOpen && (
                                <div 
                                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                    onMouseLeave={() => setNotifDropdownOpen(false)}
                                >
                                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">নোটিফিকেশনসমূহ</h4>
                                            {unreadCount > 0 && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-full">
                                                    {unreadCount} নতুন
                                                </span>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                                            >
                                                <CheckCheck className="w-3.5 h-3.5" />
                                                সব পঠিত করুন
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/80">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-sm text-slate-400">
                                                কোনো নতুন নোটিফিকেশন নেই।
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => handleNotifClick(n)}
                                                    className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                                                        !n.read_at ? 'bg-sky-50/40 dark:bg-sky-950/40 font-medium' : ''
                                                    }`}
                                                >
                                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-0.5">
                                                        {n.data.title || 'বিজ্ঞপ্তি'}
                                                    </div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                                                        {n.data.message}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-1">
                                                        {new Date(n.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Theme Switcher in Dashboard Topbar */}
                        <ThemeSwitcher variant="pill" className="hidden sm:inline-flex" />
                        <ThemeSwitcher variant="compact" className="sm:hidden" />

                        {/* Topbar User Avatar */}
                        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold flex items-center justify-center text-sm shadow-xs border border-transparent dark:border-slate-700">
                                {user.name.charAt(0)}
                            </div>
                            <div className="hidden sm:block text-left">
                                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{user.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Page Outlet */}
                <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Sidebar Drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    <div 
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="relative w-72 max-w-[80%] bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
                        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800">
                            <span className="text-xl font-black text-white">Novonex</span>
                            <div className="flex items-center gap-2">
                                <ThemeSwitcher variant="compact" />
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                            {navLinks.map((item) => {
                                const Icon = item.icon;
                                const hasChildren = Boolean(item.children && item.children.length > 0);
                                const isChildActive = hasChildren && (
                                    item.children?.some(c => location.pathname === c.path) ||
                                    (item.path !== '/admin' && location.pathname.startsWith(item.path))
                                );
                                const isExpanded = expandedMenus[item.path] ?? isChildActive;

                                return (
                                    <div key={item.path} className="space-y-1">
                                        {hasChildren ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSubmenu(item.path)}
                                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm text-slate-400 hover:text-white hover:bg-slate-800"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="w-5 h-5" />
                                                        <span>{item.title}</span>
                                                    </div>
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4 opacity-80" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 opacity-50" />
                                                    )}
                                                </button>
                                                {isExpanded && (
                                                    <div className="pl-6 pt-1 space-y-1">
                                                        {item.children?.map(child => {
                                                            const isSelected = location.pathname === child.path || (
                                                                child.path === '/admin/courses' && 
                                                                location.pathname.startsWith('/admin/courses') && 
                                                                location.pathname !== '/admin/courses/create' && 
                                                                location.pathname !== '/admin/courses/categories'
                                                            );
                                                            return (
                                                                <Link
                                                                    key={child.path}
                                                                    to={child.path}
                                                                    onClick={() => setSidebarOpen(false)}
                                                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                                                                        isSelected
                                                                            ? 'bg-sky-600 text-white'
                                                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                                    }`}
                                                                >
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                                                    <span>{child.title}</span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <Link
                                                to={item.path}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
                                                    location.pathname === item.path
                                                        ? 'bg-sky-600 text-white'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span>{item.title}</span>
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 border-t border-slate-800">
                            <button
                                onClick={() => {
                                    setSidebarOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 font-semibold text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>লগআউট</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
