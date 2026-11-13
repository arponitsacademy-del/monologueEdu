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
    CheckCheck,
    ExternalLink,
    ChevronRight
} from 'lucide-react';
import { HeaderMenuItem } from '../../types';

const DEFAULT_NAV_ITEMS: HeaderMenuItem[] = [
    {
        id: '1',
        label: 'হোম',
        label_en: 'Home',
        url: '/',
        is_external: false,
        highlight: false,
    },
    {
        id: '2',
        label: 'কোর্সসমূহ',
        label_en: 'Courses',
        url: '/courses',
        is_external: false,
        highlight: false,
        children: [
            { id: '2-1', label: 'সকল কোর্সসমূহ', label_en: 'All Courses', url: '/courses' },
            { id: '2-2', label: 'HSC একাডেমিক সাইকেল', label_en: 'HSC Academic Cycle', url: '/courses' },
            { id: '2-3', label: 'ইঞ্জিনিয়ারিং ও ভার্সিটি ভর্তি', label_en: 'Engineering & Varsity Admission', url: '/courses' },
            { id: '2-4', label: 'ফ্রি ট্রায়াল ক্লাস', label_en: 'Free Trial Classes', url: '/courses?type=free' },
        ],
    },
    {
        id: '3',
        label: 'বইসমূহ ও বান্ডেল',
        label_en: 'Books & Bundles',
        url: '/courses',
        is_external: false,
        highlight: false,
        children: [
            { id: '3-1', label: 'কম্বো কোর্স বান্ডেল', label_en: 'Combo Course Bundles', url: '/courses' },
            { id: '3-2', label: 'লেকচার শিট ও নোটবুক', label_en: 'Lecture Sheets & Notes', url: '/courses' },
        ],
    },
    {
        id: '4',
        label: 'ফ্রি রিসোর্স',
        label_en: 'Free Resources',
        url: '/courses?type=free',
        is_external: false,
        highlight: false,
    },
    {
        id: '5',
        label: 'যোগাযোগ',
        label_en: 'Contact Us',
        url: '/p/contact',
        is_external: false,
        highlight: false,
    },
    {
        id: '6',
        label: 'ই-বুক ও এক্সাম',
        label_en: 'E-Books & Exams',
        url: '/student/exams',
        is_external: false,
        highlight: true,
    },
];

export const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const { t, language } = useLanguage();
    const { settings, loading } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
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

    const announcementText = getLocalizedText(
        headerSettings?.announcement_text,
        headerSettings?.announcement_text_en,
        language
    );

    const ctaButtonText = getLocalizedText(
        headerSettings?.cta_button_text,
        headerSettings?.cta_button_text_en,
        language
    );

    const menuItems: HeaderMenuItem[] = (headerSettings?.menu_items && headerSettings.menu_items.length > 0)
        ? headerSettings.menu_items
        : DEFAULT_NAV_ITEMS;

    useEffect(() => {
        setLogoError(false);
    }, [logoUrl]);

    // Close dropdowns on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setOpenDropdownId(null);
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
        <div className={`${headerSettings?.sticky !== false ? 'sticky top-0' : 'relative'} z-50`}>
            {/* Announcement Top Banner */}
            {headerSettings?.announcement_enabled && announcementText && (
                <div
                    style={{ backgroundColor: headerSettings.announcement_bg || '#0284c7' }}
                    className="w-full text-white text-xs font-semibold py-1.5 px-4 text-center shadow-xs transition-colors"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
                        <span>{announcementText}</span>
                        {headerSettings.announcement_link && (
                            headerSettings.announcement_link.startsWith('http') ? (
                                <a
                                    href={headerSettings.announcement_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline font-bold text-[11px] opacity-90 hover:opacity-100 inline-flex items-center gap-0.5 ml-1"
                                >
                                    <span>বিস্তারিত দেখুন</span>
                                    <ChevronRight className="w-3 h-3" />
                                </a>
                            ) : (
                                <Link
                                    to={headerSettings.announcement_link}
                                    className="underline font-bold text-[11px] opacity-90 hover:opacity-100 inline-flex items-center gap-0.5 ml-1"
                                >
                                    <span>বিস্তারিত দেখুন</span>
                                    <ChevronRight className="w-3 h-3" />
                                </Link>
                            )
                        )}
                    </div>
                </div>
            )}

            <header className="py-2 sm:py-3.5 px-3 sm:px-6 lg:px-8 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md transition-all">
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
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white text-sky-700 shadow-md flex items-center justify-center font-black group-hover:rotate-6 transition-transform">
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

                {/* Center Dynamic Navigation Menu Items (Bondi Pathshala Style) */}
                <nav className="hidden lg:flex items-center gap-1 sm:gap-1.5 relative z-10 px-2">
                    {menuItems.map((item) => {
                        const hasChildren = Boolean(item.children && item.children.length > 0);
                        const isCurrentActive = location.pathname === item.url && !hasChildren;
                        const isOpen = openDropdownId === item.id;
                        const itemLabel = getLocalizedText(item.label, item.label_en, language) || item.label;

                        if (hasChildren) {
                            return (
                                <div
                                    key={item.id}
                                    className="relative"
                                    onMouseEnter={() => setOpenDropdownId(item.id)}
                                    onMouseLeave={() => setOpenDropdownId(null)}
                                >
                                    <Link
                                        to={item.url}
                                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm transition-colors ${
                                            isOpen || (location.pathname.startsWith(item.url) && item.url !== '/')
                                                ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-slate-800'
                                                : 'text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {item.url.includes('course') ? (
                                            <GraduationCap className="w-4 h-4 text-sky-500" />
                                        ) : item.label.includes('বই') || item.label.toLowerCase().includes('book') ? (
                                            <BookOpen className="w-4 h-4 text-amber-500" />
                                        ) : (
                                            <Sparkles className="w-4 h-4 text-sky-500" />
                                        )}
                                        <span>{itemLabel}</span>
                                        {item.highlight && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                    </Link>

                                    {/* Dropdown Menu */}
                                    {isOpen && (
                                        <div className="absolute left-0 mt-1 min-w-[220px] w-max max-w-xs bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                            {item.children!.map((sub) => {
                                                const subLabel = getLocalizedText(sub.label, sub.label_en, language) || sub.label;
                                                return sub.is_external || sub.url.startsWith('http') ? (
                                                    <a
                                                        key={sub.id}
                                                        href={sub.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                                            <span>{subLabel}</span>
                                                        </div>
                                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                                    </a>
                                                ) : (
                                                    <Link
                                                        key={sub.id}
                                                        to={sub.url}
                                                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 transition-colors"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                                        <span>{subLabel}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        if (item.is_external || item.url.startsWith('http')) {
                            return (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                                        item.highlight ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-extrabold' : ''
                                    }`}
                                >
                                    <span>{itemLabel}</span>
                                    {item.highlight && <Sparkles className="w-3 h-3 text-amber-500" />}
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                            );
                        }

                        return (
                            <Link
                                key={item.id}
                                to={item.url}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition-all ${
                                    isCurrentActive
                                        ? 'bg-sky-100/90 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 shadow-2xs font-extrabold'
                                        : item.highlight
                                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 font-bold'
                                            : 'text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                {item.url === '/' && <Home className={`w-4 h-4 ${isCurrentActive ? 'text-sky-600 fill-sky-600' : 'text-slate-400'}`} />}
                                {item.url.includes('contact') && <Users className="w-4 h-4 text-purple-500" />}
                                {item.url.includes('free') && <FileText className="w-4 h-4 text-emerald-500" />}
                                {item.url.includes('exam') && <ClipboardList className="w-4 h-4 text-sky-500" />}
                                <span>{itemLabel}</span>
                                {item.highlight && <Sparkles className="w-3 h-3 text-amber-500" />}
                            </Link>
                        );
                    })}
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

                    {/* Optional Custom Header CTA Button */}
                    {headerSettings?.cta_button_enabled && ctaButtonText && (
                        headerSettings.cta_button_link?.startsWith('http') ? (
                            <a
                                href={headerSettings.cta_button_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 transition-colors shadow-2xs hidden md:inline-flex items-center gap-1"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                                <span>{ctaButtonText}</span>
                            </a>
                        ) : (
                            <Link
                                to={headerSettings.cta_button_link || '/courses'}
                                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 transition-colors shadow-2xs hidden md:inline-flex items-center gap-1"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                                <span>{ctaButtonText}</span>
                            </Link>
                        )
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
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center">
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
                    {menuItems.map((item) => {
                        const itemLabel = getLocalizedText(item.label, item.label_en, language) || item.label;
                        const hasChildren = Boolean(item.children && item.children.length > 0);

                        return (
                            <div key={item.id} className="space-y-1">
                                {item.is_external || item.url.startsWith('http') ? (
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-sky-600" />
                                            <span>{itemLabel}</span>
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                    </a>
                                ) : (
                                    <Link
                                        to={item.url}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600"
                                    >
                                        <div className="flex items-center gap-2">
                                            {item.url === '/' ? (
                                                <Home className="w-4 h-4 text-sky-600" />
                                            ) : item.url.includes('course') ? (
                                                <GraduationCap className="w-4 h-4 text-sky-500" />
                                            ) : item.url.includes('contact') ? (
                                                <Users className="w-4 h-4 text-amber-500" />
                                            ) : (
                                                <Sparkles className="w-4 h-4 text-sky-600" />
                                            )}
                                            <span>{itemLabel}</span>
                                        </div>
                                        {item.highlight && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-extrabold">NEW</span>
                                        )}
                                    </Link>
                                )}

                                {/* Sub-items if any */}
                                {hasChildren && (
                                    <div className="pl-6 space-y-1 border-l-2 border-sky-100 dark:border-slate-800 ml-4 my-1">
                                        {item.children!.map((sub) => {
                                            const subLabel = getLocalizedText(sub.label, sub.label_en, language) || sub.label;
                                            return sub.is_external || sub.url.startsWith('http') ? (
                                                <a
                                                    key={sub.id}
                                                    href={sub.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600"
                                                >
                                                    <span>• {subLabel}</span>
                                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                                </a>
                                            ) : (
                                                <Link
                                                    key={sub.id}
                                                    to={sub.url}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="block px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600"
                                                >
                                                    • {subLabel}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        {user ? (
                            <div className="flex items-center gap-2 w-full">
                                <Link
                                    to={getDashboardPath()}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex-1 py-2.5 text-center font-bold text-white bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 rounded-full text-xs shadow-md shadow-sky-500/25 flex items-center justify-center gap-1.5 transition-colors"
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
    </div>
    );
};
