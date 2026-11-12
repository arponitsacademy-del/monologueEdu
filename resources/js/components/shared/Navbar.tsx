import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
import { getLocalizedText } from '../../utils/localization';
import { apiClient } from '../../api/client';
import { 
    Home,
    GraduationCap, 
    BookOpen, 
    FileText, 
    Users, 
    ClipboardList,
    Search,
    Menu, 
    X, 
    User as UserIcon, 
    LayoutDashboard, 
    LogOut, 
    ChevronDown,
    Sparkles,
    Boxes,
    PhoneCall,
    BookMarked,
    Shield,
    Bell,
    CheckCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const { t, language } = useLanguage();
    const { settings, loading } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
    const [booksDropdownOpen, setBooksDropdownOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [logoError, setLogoError] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

    const headerSettings = settings?.header_settings;
    const logoUrl = headerSettings?.logo_url ?? settings?.logo_url;
    const logoHeight = headerSettings?.logo_height || 42;

    const brandTitle = getLocalizedText(
        headerSettings?.brand_title,
        headerSettings?.brand_title_en,
        language
    ) || (settings?.site_name ? settings.site_name.split(' ')[0] : 'MONOLOGUE');

    const brandSubtitle = getLocalizedText(
        headerSettings?.brand_subtitle,
        headerSettings?.brand_subtitle_en,
        language
    ) || (settings?.site_name && settings.site_name.split(' ').length > 1
        ? settings.site_name.split(' ').slice(1).join(' ')
        : 'EDU');

    useEffect(() => {
        setLogoError(false);
    }, [logoUrl]);

    // Close dropdowns on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setCoursesDropdownOpen(false);
        setBooksDropdownOpen(false);
        setUserDropdownOpen(false);
        setSearchModalOpen(false);
        setNotifDropdownOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!user) return;
        const fetchNotifs = async () => {
            try {
                const { data } = await apiClient.get('/notifications');
                setNotifications(data.data || []);
                const unreadRes = await apiClient.get('/notifications/unread-count');
                setUnreadCount(unreadRes.data.unread_count || 0);
            } catch {}
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, [user]);

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

    const getDashboardPath = () => {
        if (!user) return '/login';
        if (user.role === 'admin' || Boolean(user.custom_role_id || user.custom_role)) return '/admin';
        if (user.role === 'teacher') return '/teacher';
        return '/student';
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchModalOpen(false);
            setSearchQuery('');
        }
    };

    const isHome = location.pathname === '/';

    return (
        <header className={`${headerSettings?.sticky !== false ? 'sticky top-0' : 'relative'} z-50 py-2 sm:py-3.5 px-3 sm:px-6 lg:px-8 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md transition-all`}>
            {/* Bondi Pathshala Style Floating Capsule Navbar */}
            <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-md shadow-sky-500/5 relative overflow-hidden flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2">
                {/* Left Side Organic Wavy Blue Gradient Accent */}
                <svg
                    className="absolute left-0 top-0 bottom-0 h-full w-24 sm:w-36 pointer-events-none select-none -z-0 rounded-l-full overflow-hidden"
                    viewBox="0 0 140 60"
                    preserveAspectRatio="none"
                    fill="none"
                >
                    <path
                        d="M0 0 H55 C80 15, 65 45, 115 60 H0 Z"
                        fill="url(#bpLeftBlueGradient)"
                        opacity="0.95"
                    />
                    <path
                        d="M0 0 H40 C60 18, 50 38, 90 60 H0 Z"
                        fill="#0284c7"
                        opacity="0.45"
                    />
                    <path
                        d="M0 10 C30 5, 45 40, 75 60 H0 Z"
                        fill="#0369a1"
                        opacity="0.3"
                    />
                    <defs>
                        <linearGradient id="bpLeftBlueGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#0284c7" />
                            <stop offset="50%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.85" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Right Side Organic Wavy Orange/Amber Gradient Accent */}
                <svg
                    className="absolute right-0 top-0 bottom-0 h-full w-24 sm:w-40 pointer-events-none select-none -z-0 rounded-r-full overflow-hidden"
                    viewBox="0 0 150 60"
                    preserveAspectRatio="none"
                    fill="none"
                >
                    <path
                        d="M150 0 H80 C50 15, 70 45, 25 60 H150 Z"
                        fill="url(#bpRightOrangeGradient)"
                        opacity="0.95"
                    />
                    <path
                        d="M150 0 H95 C75 18, 85 38, 45 60 H150 Z"
                        fill="#f59e0b"
                        opacity="0.4"
                    />
                    <defs>
                        <linearGradient id="bpRightOrangeGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="55%" stopColor="#fb923c" />
                            <stop offset="100%" stopColor="#ea580c" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Brand Logo (Left) */}
                <div className="relative z-10 pl-2 sm:pl-3 flex items-center shrink-0">
                    <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group">
                        {logoUrl && !logoError ? (
                            <img
                                src={logoUrl}
                                alt={settings?.site_name || 'Monologue Edu'}
                                onError={() => setLogoError(true)}
                                style={{ height: `${logoHeight}px` }}
                                className="w-auto max-w-[140px] sm:max-w-[190px] object-contain group-hover:scale-105 transition-transform drop-shadow-xs"
                            />
                        ) : loading ? (
                            <div style={{ height: `${logoHeight}px`, width: '120px' }} className="shrink-0" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white text-indigo-700 shadow-md flex items-center justify-center font-black group-hover:rotate-6 transition-transform">
                                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                                </div>
                                <div className="flex flex-col leading-none">
                                    <span className="text-base sm:text-xl font-black tracking-tight text-white drop-shadow-xs">
                                        {brandTitle}
                                    </span>
                                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-amber-300 drop-shadow-xs">
                                        {brandSubtitle}
                                    </span>
                                </div>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Center Navigation Menu Items (Bondi Pathshala Style) */}
                <nav className="hidden lg:flex items-center gap-1 sm:gap-1.5 relative z-10 px-2">
                    {/* হোম (Home) - Active Pill Style */}
                    <Link
                        to="/"
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition-all ${
                            isHome
                                ? 'bg-sky-100/90 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 shadow-2xs font-extrabold'
                                : 'text-slate-700 dark:text-slate-200 hover:text-sky-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Home className={`w-4 h-4 ${isHome ? 'text-sky-600 fill-sky-600' : 'text-slate-400'}`} />
                        <span>হোম</span>
                    </Link>

                    {/* কোর্সসমূহ (Courses) with Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => setCoursesDropdownOpen(true)}
                        onMouseLeave={() => setCoursesDropdownOpen(false)}
                    >
                        <Link
                            to="/courses"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <GraduationCap className="w-4 h-4 text-indigo-500" />
                            <span>কোর্সসমূহ</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${coursesDropdownOpen ? 'rotate-180' : ''}`} />
                        </Link>

                        {/* Courses Dropdown Menu */}
                        {coursesDropdownOpen && (
                            <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <Link
                                    to="/courses"
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 transition-colors"
                                >
                                    <Sparkles className="w-4 h-4 text-sky-500" />
                                    <span>সকল কোর্সসমূহ</span>
                                </Link>
                                <Link
                                    to="/courses"
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 transition-colors"
                                >
                                    <BookOpen className="w-4 h-4 text-indigo-500" />
                                    <span>HSC একাডেমিক সাইকেল</span>
                                </Link>
                                <Link
                                    to="/courses"
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 transition-colors"
                                >
                                    <GraduationCap className="w-4 h-4 text-purple-500" />
                                    <span>ইঞ্জিনিয়ারিং ও ভার্সিটি ভর্তি</span>
                                </Link>
                                <Link
                                    to="/courses?type=free"
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-emerald-500" />
                                    <span>ফ্রি ট্রায়াল ক্লাস</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* বইসমূহ / বান্ডেল (Books / Bundles) with Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => setBooksDropdownOpen(true)}
                        onMouseLeave={() => setBooksDropdownOpen(false)}
                    >
                        <Link
                            to="/courses"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <BookOpen className="w-4 h-4 text-sky-500" />
                            <span>বইসমূহ</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${booksDropdownOpen ? 'rotate-180' : ''}`} />
                        </Link>

                        {/* Books / Bundles Dropdown */}
                        {booksDropdownOpen && (
                            <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <Link
                                    to="/courses"
                                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 transition-colors"
                                >
                                    <Boxes className="w-4 h-4 text-amber-500" />
                                    <span>কম্বো কোর্স বান্ডেল</span>
                                </Link>
                                <Link
                                    to="/courses"
                                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-indigo-500" />
                                    <span>লেকচার শিট ও নোটবুক</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* ফ্রি রিসোর্স (Free Resources) */}
                    <Link
                        to="/courses?type=free"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span>ফ্রি রিসোর্স</span>
                    </Link>

                    {/* যোগাযোগ (Contact) */}
                    <Link
                        to="/p/contact"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Users className="w-4 h-4 text-purple-500" />
                        <span>যোগাযোগ</span>
                    </Link>

                    {/* ই-বুক / মডেল টেস্ট (E-book / Exams) */}
                    <Link
                        to="/student/exams"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ClipboardList className="w-4 h-4 text-sky-500" />
                        <span>ই-বুক</span>
                    </Link>
                </nav>

                {/* Right Side Actions (Search, Login & Enroll CTA Buttons) */}
                <div className="relative z-10 flex items-center gap-2 sm:gap-3 pr-1 sm:pr-2 shrink-0">
                    {/* Search Icon Button */}
                    <button
                        type="button"
                        onClick={() => setSearchModalOpen(true)}
                        className="p-2 sm:p-2.5 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                        title="কোর্স খুঁজুন"
                    >
                        <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Theme switcher */}
                    {headerSettings?.show_theme_toggle !== false && (
                        <div className="hidden sm:block">
                            <ThemeSwitcher variant="compact" />
                        </div>
                    )}

                    {/* Authentication and CTA Buttons */}
                    {user ? (
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                    className="p-2 sm:p-2.5 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer relative"
                                    title="নোটিফিকেশনসমূহ"
                                >
                                    <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                                    )}
                                </button>

                                {notifDropdownOpen && (
                                    <div 
                                        className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                        onMouseLeave={() => setNotifDropdownOpen(false)}
                                    >
                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">নোটিফিকেশনসমূহ</span>
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
                                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-slate-400">
                                                    কোনো নতুন নোটিফিকেশন নেই
                                                </div>
                                            ) : (
                                                notifications.slice(0, 8).map((n) => (
                                                    <div 
                                                        key={n.id} 
                                                        onClick={() => handleNotificationClick(n)}
                                                        className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                                                            !n.read_at ? 'bg-sky-50/50 dark:bg-sky-950/40' : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-1">
                                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                                                                {n.data?.title || n.title || 'বিজ্ঞপ্তি'}
                                                            </p>
                                                            {!n.read_at && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                            {n.data?.message || n.message}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Click on User / Admin directly goes to Admin Panel / Dashboard */}
                            <Link
                                to={getDashboardPath()}
                                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white border border-slate-200/90 dark:border-slate-700 shadow-xs hover:border-sky-400 hover:text-sky-600 transition-all cursor-pointer group"
                                title={user.role === 'admin' ? 'অ্যাডমিন প্যানেলে যান' : 'ড্যাশবোর্ডে যান'}
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-extrabold text-xs sm:text-sm hidden sm:inline max-w-[100px] truncate">
                                    {user.name.split(' ')[0]}
                                </span>
                            </Link>

                            {/* Quick Logout Button */}
                            <button
                                type="button"
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors cursor-pointer"
                                title="লগআউট"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* লগইন (Login) Pill Button */}
                            <Link
                                to="/login"
                                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-md shadow-sky-500/25 transition-all transform active:scale-95 cursor-pointer"
                            >
                                লগইন
                            </Link>

                            {/* এখনই শুরু করুন (Get Started) Orange/Amber Pill Button */}
                            <Link
                                to="/courses"
                                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25 transition-all transform active:scale-95 cursor-pointer whitespace-nowrap hidden sm:inline-flex"
                            >
                                এখনই শুরু করুন
                            </Link>
                        </div>
                    )}

                    {/* Mobile Hamburger Button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-slate-700 dark:text-slate-200 hover:text-sky-600 lg:hidden rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer (Bondi Pathshala Style) */}
            {mobileMenuOpen && (
                <div className="lg:hidden mt-2 max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-xl space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <Link
                        to="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600"
                    >
                        <Home className="w-4 h-4 text-sky-600" />
                        <span>হোম</span>
                    </Link>

                    <Link
                        to="/courses"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600"
                    >
                        <GraduationCap className="w-4 h-4 text-indigo-500" />
                        <span>কোর্সসমূহ</span>
                    </Link>

                    <Link
                        to="/courses"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600"
                    >
                        <BookOpen className="w-4 h-4 text-sky-500" />
                        <span>বইসমূহ ও বান্ডেল</span>
                    </Link>

                    <Link
                        to="/courses?type=free"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600"
                    >
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span>ফ্রি রিসোর্স</span>
                    </Link>

                    <Link
                        to="/student/exams"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600"
                    >
                        <ClipboardList className="w-4 h-4 text-purple-500" />
                        <span>ই-বুক ও অনলাইন এক্সাম</span>
                    </Link>

                    <Link
                        to="/p/contact"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600"
                    >
                        <Users className="w-4 h-4 text-amber-500" />
                        <span>যোগাযোগ</span>
                    </Link>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        {user ? (
                            <div className="flex items-center gap-2 w-full">
                                <Link
                                    to={getDashboardPath()}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex-1 py-2.5 text-center font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Shield className="w-4 h-4" />
                                    <span>{user.role === 'admin' ? 'অ্যাডমিন প্যানেল' : `ড্যাশবোর্ড (${user.name.split(' ')[0]})`}</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        logout();
                                    }}
                                    className="p-2.5 text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-full transition-colors cursor-pointer"
                                    title="লগআউট"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="py-2.5 text-center font-bold text-white bg-sky-600 rounded-full text-xs shadow-sm"
                                >
                                    লগইন
                                </Link>
                                <Link
                                    to="/courses"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="py-2.5 text-center font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-xs shadow-sm"
                                >
                                    এখনই শুরু করুন
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Search Modal */}
            {searchModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-sm">
                                <Search className="w-4 h-4 text-sky-600" />
                                <span>কোর্স বা বিষয় খুঁজুন</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSearchModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="mt-4 space-y-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="কোর্সের নাম লিখুন (যেমন: HSC Physics, Math...)"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 dark:text-white"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                            >
                                সার্চ করুন
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </header>
    );
};
