import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
import { getLocalizedText } from '../../utils/localization';
import { 
    BookOpen, 
    Menu, 
    X, 
    User as UserIcon, 
    LayoutDashboard, 
    LogOut, 
    Bell, 
    ChevronDown,
    Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const { t, language } = useLanguage();
    const { settings, loading } = useSettings();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [logoError, setLogoError] = useState(false);

    const headerSettings = settings?.header_settings;
    const logoUrl = headerSettings?.logo_url ?? settings?.logo_url;
    const logoHeight = headerSettings?.logo_height || 44;

    const brandTitle = getLocalizedText(
        headerSettings?.brand_title,
        headerSettings?.brand_title_en,
        language
    ) || (settings?.site_name ? settings.site_name.split(' ')[0] : 'Novonex');

    const brandSubtitle = getLocalizedText(
        headerSettings?.brand_subtitle,
        headerSettings?.brand_subtitle_en,
        language
    ) || (settings?.site_name && settings.site_name.split(' ').length > 1
        ? settings.site_name.split(' ').slice(1).join(' ')
        : 'Academy');

    const announcementText = getLocalizedText(
        headerSettings?.announcement_text,
        headerSettings?.announcement_text_en,
        language
    );

    const ctaText = getLocalizedText(
        headerSettings?.cta_button_text,
        headerSettings?.cta_button_text_en,
        language
    ) || (language === 'en' ? 'Enroll Now' : 'ভর্তি হন');

    const rawMenuItems = headerSettings?.menu_items && headerSettings.menu_items.length > 0
        ? headerSettings.menu_items
        : [
            { id: '1', label: t.nav.home, url: '/', is_external: false, highlight: false },
            { id: '2', label: t.nav.allCourses, url: '/courses', is_external: false, highlight: true }
        ];

    const menuItems = rawMenuItems.map((item) => ({
        ...item,
        label: getLocalizedText(item.label, item.label_en, language) || item.label,
    }));

    useEffect(() => {
        setLogoError(false);
    }, [logoUrl]);

    const getDashboardPath = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin';
        if (user.role === 'teacher') return '/teacher';
        return '/student';
    };

    return (
        <header className={`${headerSettings?.sticky !== false ? 'sticky top-0' : 'relative'} z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-xs transition-colors duration-150`}>
            {/* Optional Announcement Notice Bar */}
            {headerSettings?.announcement_enabled && (
                <div
                    style={{ backgroundColor: headerSettings.announcement_bg || '#0284c7' }}
                    className="px-4 py-2 text-white text-xs sm:text-sm font-semibold text-center flex items-center justify-center gap-2"
                >
                    <span>{announcementText}</span>
                    {headerSettings.announcement_link && (
                        <a
                            href={headerSettings.announcement_link}
                            className="underline font-bold hover:opacity-90 inline-flex items-center gap-1 text-xs"
                        >
                            <span>{language === 'en' ? 'View Details' : 'বিস্তারিত দেখুন'}</span>
                            <span>→</span>
                        </a>
                    )}
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-3 group shrink-0 min-h-[44px]">
                        {logoUrl && !logoError ? (
                            <img
                                src={logoUrl}
                                alt={settings?.site_name || 'Novonex Academy'}
                                onError={() => setLogoError(true)}
                                style={{ height: `${logoHeight}px` }}
                                className="w-auto max-w-[170px] sm:max-w-[220px] object-contain group-hover:scale-105 transition-transform"
                            />
                        ) : loading ? (
                            <div style={{ height: `${logoHeight}px`, width: '130px' }} className="shrink-0" />
                        ) : (
                            <>
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 dark:from-white dark:via-sky-200 dark:to-white bg-clip-text text-transparent">
                                        {brandTitle}
                                    </span>
                                    <span className="block text-[11px] font-semibold text-sky-600 dark:text-sky-400 tracking-wider uppercase -mt-1">
                                        {brandSubtitle}
                                    </span>
                                </div>
                            </>
                        )}
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        {menuItems.map((item) => (
                            item.is_external ? (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5"
                                >
                                    {item.highlight && <Sparkles className="w-4 h-4 text-sky-500" />}
                                    <span>{item.label}</span>
                                </a>
                            ) : (
                                <Link
                                    key={item.id}
                                    to={item.url}
                                    className="text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5"
                                >
                                    {item.highlight && <Sparkles className="w-4 h-4 text-sky-500" />}
                                    <span>{item.label}</span>
                                </Link>
                            )
                        ))}
                    </nav>

                    {/* Right Action Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Custom CTA Button */}
                        {headerSettings?.cta_button_enabled && (
                            <a
                                href={headerSettings.cta_button_link || '/courses'}
                                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition"
                            >
                                {ctaText}
                            </a>
                        )}

                        {/* Theme Switcher */}
                        {headerSettings?.show_theme_toggle !== false && (
                            <ThemeSwitcher variant="compact" />
                        )}

                        {headerSettings?.show_auth_buttons !== false && (
                            user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center text-sm">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                                {user.name}
                                            </div>
                                            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                                                {user.role === 'admin' ? t.nav.adminPanel : user.role === 'teacher' ? t.nav.instructorPortal : t.nav.studentHub}
                                            </div>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </button>

                                    {userDropdownOpen && (
                                        <div 
                                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                            onMouseLeave={() => setUserDropdownOpen(false)}
                                        >
                                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                                                <p className="text-xs font-medium text-slate-400">Signed in as:</p>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.phone}</p>
                                            </div>
                                            <Link
                                                to={getDashboardPath()}
                                                onClick={() => setUserDropdownOpen(false)}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                                            >
                                                <LayoutDashboard className="w-4 h-4" />
                                                {t.nav.dashboard}
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setUserDropdownOpen(false);
                                                    logout();
                                                }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                {t.nav.logout}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link
                                        to="/login"
                                        className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                                    >
                                        {t.nav.login}
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-6 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 hover:shadow-lg hover:shadow-sky-600/30 transition-all transform active:scale-95"
                                    >
                                        {t.nav.register}
                                    </Link>
                                </div>
                            )
                        )}
                    </div>

                    {/* Mobile Controls & Hamburger Button */}
                    <div className="flex md:hidden items-center gap-2">
                        {headerSettings?.show_theme_toggle !== false && (
                            <ThemeSwitcher variant="compact" />
                        )}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
                    {headerSettings?.show_theme_toggle !== false && (
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.theme.theme}:</span>
                            <ThemeSwitcher variant="pill" />
                        </div>
                    )}

                    {menuItems.map((item) => (
                        item.is_external ? (
                            <a
                                key={item.id}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-between px-3 py-2 text-base font-semibold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <span>{item.label}</span>
                                {item.highlight && <Sparkles className="w-4 h-4 text-sky-500" />}
                            </a>
                        ) : (
                            <Link
                                key={item.id}
                                to={item.url}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-between px-3 py-2 text-base font-semibold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <span>{item.label}</span>
                                {item.highlight && <Sparkles className="w-4 h-4 text-sky-500" />}
                            </Link>
                        )
                    ))}

                    {headerSettings?.show_auth_buttons !== false && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            {user ? (
                                <>
                                    <Link
                                        to={getDashboardPath()}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block w-full py-2.5 text-center font-bold text-white bg-sky-600 rounded-xl shadow-sm"
                                    >
                                        {t.nav.dashboard} ({user.name})
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            logout();
                                        }}
                                        className="block w-full py-2.5 text-center font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl cursor-pointer"
                                    >
                                        {t.nav.logout}
                                    </button>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="py-2.5 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl"
                                    >
                                        {t.nav.login}
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="py-2.5 text-center font-bold text-white bg-sky-600 rounded-xl shadow-sm"
                                    >
                                        {t.nav.register}
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};
