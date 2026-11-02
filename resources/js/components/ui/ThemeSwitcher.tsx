import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeSwitcherProps {
    variant?: 'pill' | 'compact' | 'segmented';
    className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
    variant = 'compact',
    className = '',
}) => {
    const { theme, resolvedTheme, isDark, setTheme, toggleTheme } = useTheme();
    const { t } = useLanguage();

    if (variant === 'compact') {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? t.theme.switchToLight : t.theme.switchToDark}
                aria-label={isDark ? t.theme.switchToLight : t.theme.switchToDark}
                className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer select-none focus:outline-hidden focus:ring-2 focus:ring-sky-500/50 ${
                    isDark
                        ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 hover:text-amber-300 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-sky-600 shadow-2xs'
                } ${className}`}
            >
                {isDark ? (
                    <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
                ) : (
                    <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 hover:-rotate-12" />
                )}
            </button>
        );
    }

    if (variant === 'segmented') {
        return (
            <div
                className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs select-none ${className}`}
                role="group"
                aria-label={t.theme.theme}
            >
                <button
                    type="button"
                    onClick={() => setTheme('light')}
                    title={t.theme.light}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        theme === 'light'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-200/60 dark:ring-slate-700'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.theme.light}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    title={t.theme.dark}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        theme === 'dark'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <Moon className="w-3.5 h-3.5 text-sky-200" />
                    <span>{t.theme.dark}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setTheme('system')}
                    title={t.theme.system}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        theme === 'system'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-200/60 dark:ring-slate-700'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>{t.theme.system}</span>
                </button>
            </div>
        );
    }

    // Default 'pill' segmented switch: [ ☀️ Light | 🌙 Dark ]
    return (
        <div
            className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs select-none ${className}`}
            role="group"
            aria-label={t.theme.theme}
        >
            <button
                type="button"
                onClick={() => setTheme('light')}
                title={t.theme.light}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    resolvedTheme === 'light'
                        ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/60'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.theme.light}</span>
            </button>
            <button
                type="button"
                onClick={() => setTheme('dark')}
                title={t.theme.dark}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    resolvedTheme === 'dark'
                        ? 'bg-slate-900 text-white shadow-xs ring-1 ring-slate-700'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>{t.theme.dark}</span>
            </button>
        </div>
    );
};
