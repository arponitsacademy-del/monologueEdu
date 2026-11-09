import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { apiClient } from '../api/client';
import { AppNotification } from '../types';
import {
    Home,
    BookOpen,
    Calendar,
    ClipboardList,
    Trophy,
    ShoppingCart,
    Share2,
    PhoneCall,
    LogOut,
    Search,
    Bell,
    Menu,
    X,
    ExternalLink,
    ChevronDown,
    GraduationCap,
    CheckCheck,
    Loader2,
    Settings
} from 'lucide-react';

export const StudentDashboardLayout: React.FC = () => {
    const { user, logout, isLoading } = useAuth();
    const { t } = useLanguage();
    const { settings } = useSettings();
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [logoError, setLogoError] = useState(false);

    const headerSettings = settings?.header_settings;
    const logoUrl = headerSettings?.logo_url ?? settings?.logo_url;
    const supportPhone = settings?.support_phone || '01305726485';

    useEffect(() => {
        if (!user) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

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

    const handleNotificationClick = async (n: any) => {
        try {
            if (!n.read_at) {
                await apiClient.post(`/notifications/${n.id}/read`);
                setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch {}
        setNotifDropdownOpen(false);
        const targetLink = n.data?.link || n.link;
        if (targetLink) {
            navigate(targetLink);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-500">লোড হচ্ছে...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const menuItems = [
        {
            title: 'হোম',
            path: '/student',
            icon: Home,
            exact: true
        },
        {
            title: 'আমার কোর্স',
            path: '/student/my-courses',
            icon: BookOpen
        },
        {
            title: 'রুটিন',
            path: '/student#routine',
            icon: Calendar,
            isAction: true,
            action: () => {
                if (location.pathname !== '/student') {
                    navigate('/student#routine');
                } else {
                    const el = document.getElementById('student-routine-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        },
        {
            title: 'পরীক্ষা',
            path: '/student/exams',
            icon: ClipboardList
        },
        {
            title: 'লিডারবোর্ড',
            path: '/student/exams?tab=leaderboard',
            icon: Trophy
        },
        {
            title: 'অর্ডারসমূহ',
            path: '/student/orders',
            icon: ShoppingCart
        },
        {
            title: 'রেফারেন্স',
            path: '/student/affiliate',
            icon: Share2
        },
        {
            title: 'প্রোফাইল ও সেটিংস',
            path: '/student/profile',
            icon: Settings
        }
    ];

    const isCurrentActive = (item: typeof menuItems[0]) => {
        if (item.exact) {
            return location.pathname === item.path && !location.hash;
        }
        if (item.isAction) {
            return location.hash === '#routine';
        }
        return location.pathname.startsWith(item.path.split('?')[0]);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased selection:bg-sky-500 selection:text-white">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Floating Left Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 h-screen z-50 transition-all duration-300 ease-in-out p-3 sm:p-4 shrink-0 ${
                    sidebarOpen ? 'left-0' : '-left-80 lg:left-0'
                }`}
            >
                <div className="w-64 h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between p-4 sm:p-5 overflow-y-auto">
                    {/* Top: Logo & Nav items */}
                    <div className="space-y-6">
                        {/* Brand Logo Header */}
                        <div className="flex items-center justify-between px-1">
                            <Link to="/" className="flex items-center gap-2 group">
                                {logoUrl && !logoError ? (
                                    <img
                                        src={logoUrl}
                                        alt={settings?.site_name || 'Monologue Edu'}
                                        onError={() => setLogoError(true)}
                                        className="h-9 w-auto max-w-[140px] object-contain group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-xs">
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                        <span className="font-extrabold text-base tracking-tight text-slate-900">
                                            {settings?.site_name || 'Monologue'}
                                        </span>
                                    </div>
                                )}
                            </Link>

                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation Menu */}
                        <nav className="space-y-1.5 pt-2">
                            {menuItems.map((item) => {
                                const active = isCurrentActive(item);
                                const Icon = item.icon;

                                if (item.isAction) {
                                    return (
                                        <button
                                            key={item.title}
                                            type="button"
                                            onClick={() => {
                                                setSidebarOpen(false);
                                                item.action();
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all text-left cursor-pointer ${
                                                active
                                                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/25'
                                                    : 'text-slate-600 hover:text-sky-600 hover:bg-sky-50/80'
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                                            <span>{item.title}</span>
                                        </button>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.title}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
                                            active
                                                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/25'
                                                : 'text-slate-600 hover:text-sky-600 hover:bg-sky-50/80'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                                        <span>{item.title}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Bottom Support & User Info */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        {/* Support Card */}
                        <div className="bg-sky-50/80 rounded-2xl p-3 border border-sky-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white text-sky-600 shadow-2xs flex items-center justify-center shrink-0">
                                <PhoneCall className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                                <span className="text-[10px] font-bold text-slate-500 block leading-tight">সাহায্য প্রয়োজন?</span>
                                <a
                                    href={`tel:${supportPhone}`}
                                    className="text-xs font-extrabold text-sky-700 hover:underline truncate block"
                                >
                                    {supportPhone}
                                </a>
                            </div>
                        </div>

                        {/* User logout row */}
                        <div className="flex items-center justify-between px-1">
                            <Link
                                to="/student/profile"
                                className="flex items-center gap-2 truncate hover:opacity-80 transition-opacity group"
                                title="প্রোফাইল ও সেটিংস"
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-slate-700 truncate max-w-[120px] group-hover:text-sky-600">
                                    {user.name.split(' ')[0]}
                                </span>
                            </Link>
                            <button
                                type="button"
                                onClick={logout}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                title="লগআউট"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-5 lg:p-6 lg:pl-0">
                {/* Topbar Header */}
                <header className="flex items-center justify-between gap-3 mb-6">
                    {/* Left: Mobile hamburger + Search Bar */}
                    <div className="flex items-center gap-3 flex-1 max-w-xl">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                            aria-label="Toggle Menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="কী খুঁজছেন?"
                                    className="w-full bg-white rounded-full pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200/80 shadow-2xs focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                                />
                            </div>
                        </form>
                    </div>

                    {/* Right: Academic Pill, Notifications, Profile Avatar */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Academic Category Pill */}
                        <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                            <span>এইচএসসি</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-sky-600 shadow-2xs transition-colors relative cursor-pointer"
                                aria-label="Notifications"
                            >
                                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {notifDropdownOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                    onMouseLeave={() => setNotifDropdownOpen(false)}
                                >
                                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800">নোটিফিকেশনসমূহ</span>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="text-[10px] font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <CheckCheck className="w-3 h-3" />
                                                <span>পড়েছি চিহ্নিত করুন</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-slate-400">
                                                কোনো নতুন নোটিফিকেশন নেই
                                            </div>
                                        ) : (
                                            notifications.slice(0, 8).map((n) => (
                                                <div 
                                                    key={n.id} 
                                                    onClick={() => handleNotificationClick(n)}
                                                    className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                                                        !n.read_at ? 'bg-sky-50/50' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-1">
                                                        <p className="text-xs font-bold text-slate-800 line-clamp-1">
                                                            {n.data?.title || n.title || 'বিজ্ঞপ্তি'}
                                                        </p>
                                                        {!n.read_at && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                                        {n.data?.message || n.message}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Student Profile Avatar */}
                        <Link
                            to="/student/profile"
                            title="প্রোফাইল ও সেটিংস"
                            className="flex items-center gap-2 group cursor-pointer"
                        >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-600 to-sky-600 p-0.5 shadow-2xs group-hover:scale-105 transition-transform">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-black text-xs sm:text-sm text-sky-700">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Subpage Content */}
                <main className="flex-1 pb-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
