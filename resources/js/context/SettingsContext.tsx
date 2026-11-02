import React, { createContext, useContext, useState, useEffect } from 'react';
import { WebsiteSetting } from '../types';
import { apiClient } from '../api/client';

interface SettingsContextType {
    settings: WebsiteSetting | null;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    updateSettingsLocally: (newSettings: Partial<WebsiteSetting>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<WebsiteSetting | null>(() => {
        if (typeof window !== 'undefined' && (window as any).__INITIAL_SETTINGS__) {
            return (window as any).__INITIAL_SETTINGS__;
        }
        try {
            const cached = localStorage.getItem('novonex_settings_cache');
            if (cached) return JSON.parse(cached);
        } catch (_) {}
        return null;
    });
    const [loading, setLoading] = useState<boolean>(() => !settings);

    const refreshSettings = async () => {
        try {
            const { data } = await apiClient.get('/settings');
            setSettings(data);
            try {
                localStorage.setItem('novonex_settings_cache', JSON.stringify(data));
            } catch (_) {}
        } catch (err) {
            console.error('Failed to load website settings', err);
        } finally {
            setLoading(false);
        }
    };

    const updateSettingsLocally = (newSettings: Partial<WebsiteSetting>) => {
        setSettings(prev => {
            const next = prev ? { ...prev, ...newSettings } : (newSettings as WebsiteSetting);
            try {
                localStorage.setItem('novonex_settings_cache', JSON.stringify(next));
            } catch (_) {}
            return next;
        });
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    // Dynamically synchronize favicon with document head
    useEffect(() => {
        const faviconUrl = settings?.favicon_url;
        if (faviconUrl) {
            let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = faviconUrl;

            // Also update apple-touch-icon and shortcut icon if present
            let appleIcon = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
            if (appleIcon) {
                appleIcon.href = faviconUrl;
            }
            let shortcutIcon = document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
            if (shortcutIcon) {
                shortcutIcon.href = faviconUrl;
            }
        }
    }, [settings?.favicon_url]);

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings, updateSettingsLocally }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
