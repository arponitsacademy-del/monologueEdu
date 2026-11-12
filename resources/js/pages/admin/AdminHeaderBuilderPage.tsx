import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import { HeaderSettings, HeaderMenuItem } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { MediaPickerModal } from '../../components/shared/MediaPickerModal';
import { getLocalizedText } from '../../utils/localization';
import {
    Sliders,
    Save,
    CheckCircle2,
    Plus,
    Trash2,
    MoveUp,
    MoveDown,
    ExternalLink,
    Sparkles,
    Image as ImageIcon,
    UploadCloud,
    Loader2,
    Eye,
    Monitor,
    Smartphone,
    RotateCcw,
    Layers,
    Bell,
    Check,
    Palette,
    ChevronDown
} from 'lucide-react';

const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
    sticky: true,
    show_theme_toggle: true,
    show_auth_buttons: true,
    logo_url: null,
    logo_height: 44,
    brand_title: 'Monologue',
    brand_title_en: 'Monologue',
    brand_subtitle: 'Edu',
    brand_subtitle_en: 'Edu',
    announcement_enabled: false,
    announcement_text: '🎉 নতুন ব্যাচে ভর্তি চলছে! ২০% ছাড়ে এখনই এনরোল করুন।',
    announcement_text_en: '🎉 New batch admission open! Enroll now with 20% discount.',
    announcement_link: '/courses',
    announcement_bg: '#0284c7',
    cta_button_enabled: false,
    cta_button_text: 'ফ্রি ক্লাস',
    cta_button_text_en: 'Free Classes',
    cta_button_link: '/courses?type=free',
    menu_items: [
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
    ],
};

export const AdminHeaderBuilderPage: React.FC = () => {
    const { settings, refreshSettings, updateSettingsLocally } = useSettings();

    const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(DEFAULT_HEADER_SETTINGS);
    const [activeTab, setActiveTab] = useState<'branding' | 'menu' | 'announcement' | 'options'>('branding');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const previewLang = 'en';

    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const logoFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (settings?.header_settings) {
            let items = settings.header_settings.menu_items;
            if (!items || items.length === 0 || (items.length === 2 && items[0]?.label === 'Home' && items[1]?.label === 'All Courses')) {
                items = DEFAULT_HEADER_SETTINGS.menu_items;
            }
            setHeaderSettings({
                ...DEFAULT_HEADER_SETTINGS,
                ...settings.header_settings,
                logo_url: settings.header_settings.logo_url ?? settings.logo_url ?? null,
                menu_items: items,
            });
        } else if (settings?.logo_url) {
            setHeaderSettings(prev => ({ ...prev, logo_url: settings.logo_url }));
        }
    }, [settings]);

    const handleUpdate = <K extends keyof HeaderSettings>(key: K, value: HeaderSettings[K]) => {
        setHeaderSettings(prev => {
            const next = { ...prev, [key]: value };
            const syncMap: Record<string, keyof HeaderSettings> = {
                brand_title: 'brand_title_en',
                brand_subtitle: 'brand_subtitle_en',
                announcement_text: 'announcement_text_en',
                cta_button_text: 'cta_button_text_en',
            };
            if (syncMap[key as string] && typeof value === 'string') {
                (next as any)[syncMap[key as string]] = value;
            }
            return next;
        });
    };

    const handleLogoUpload = async (file: File) => {
        setUploadingLogo(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await apiClient.post('/admin/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data?.media?.url) {
                handleUpdate('logo_url', res.data.media.url);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to upload logo file.');
        } finally {
            setUploadingLogo(false);
            if (logoFileInputRef.current) logoFileInputRef.current.value = '';
        }
    };

    // Menu Item Helpers
    const handleAddMenuItem = () => {
        const newItem: HeaderMenuItem = {
            id: Date.now().toString(),
            label: 'নতুন মেনু',
            label_en: 'New Menu',
            url: '/',
            is_external: false,
            highlight: false,
            children: []
        };
        const updated = [...(headerSettings.menu_items || []), newItem];
        handleUpdate('menu_items', updated);
    };

    const handleUpdateMenuItem = (index: number, updates: Partial<HeaderMenuItem>) => {
        const current = [...(headerSettings.menu_items || [])];
        if (current[index]) {
            current[index] = { ...current[index], ...updates };
            handleUpdate('menu_items', current);
        }
    };

    const handleDeleteMenuItem = (index: number) => {
        const current = [...(headerSettings.menu_items || [])];
        current.splice(index, 1);
        handleUpdate('menu_items', current);
    };

    const handleMoveMenuItem = (index: number, direction: 'up' | 'down') => {
        const current = [...(headerSettings.menu_items || [])];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= current.length) return;
        const temp = current[index];
        current[index] = current[targetIndex];
        current[targetIndex] = temp;
        handleUpdate('menu_items', current);
    };

    // Sub-item Helpers
    const handleAddSubMenuItem = (parentIndex: number) => {
        const current = [...(headerSettings.menu_items || [])];
        const parent = current[parentIndex];
        if (!parent) return;

        const newSub = {
            id: Date.now().toString(),
            label: 'নতুন সাব-মেনু',
            label_en: 'New Sub Menu',
            url: parent.url || '/courses',
            is_external: false,
        };

        const existingChildren = parent.children || [];
        current[parentIndex] = {
            ...parent,
            children: [...existingChildren, newSub],
        };
        handleUpdate('menu_items', current);
    };

    const handleUpdateSubMenuItem = (parentIndex: number, subIndex: number, updates: any) => {
        const current = [...(headerSettings.menu_items || [])];
        const parent = current[parentIndex];
        if (!parent || !parent.children) return;

        const children = [...parent.children];
        if (children[subIndex]) {
            children[subIndex] = { ...children[subIndex], ...updates };
            current[parentIndex] = { ...parent, children };
            handleUpdate('menu_items', current);
        }
    };

    const handleDeleteSubMenuItem = (parentIndex: number, subIndex: number) => {
        const current = [...(headerSettings.menu_items || [])];
        const parent = current[parentIndex];
        if (!parent || !parent.children) return;

        const children = [...parent.children];
        children.splice(subIndex, 1);
        current[parentIndex] = { ...parent, children };
        handleUpdate('menu_items', current);
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccessMessage(null);
        try {
            const { data } = await apiClient.put('/admin/website-settings/header', {
                header_settings: headerSettings
            });
            updateSettingsLocally({
                header_settings: headerSettings,
                logo_url: headerSettings.logo_url ?? settings?.logo_url ?? null,
            });
            await refreshSettings();
            setSuccessMessage(data.message || 'Header builder settings saved successfully!');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save header settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefaults = () => {
        if (window.confirm('Are you sure you want to reset header settings to defaults?')) {
            setHeaderSettings(DEFAULT_HEADER_SETTINGS);
        }
    };

    // Localized values for Live Preview based on previewLang toggle
    const previewBrandTitle = getLocalizedText(headerSettings.brand_title, headerSettings.brand_title_en, previewLang) || 'Monologue';
    const previewBrandSubtitle = getLocalizedText(headerSettings.brand_subtitle, headerSettings.brand_subtitle_en, previewLang) || 'Edu';
    const previewAnnouncementText = getLocalizedText(headerSettings.announcement_text, headerSettings.announcement_text_en, previewLang);
    const previewCtaText = getLocalizedText(headerSettings.cta_button_text, headerSettings.cta_button_text_en, previewLang) || 'Free Classes';

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Palette className="w-7 h-7 text-sky-600" />
                        <span>Header Builder</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Customize the website header logo, navigation menu, announcement bar, and layout options
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer"
                        title="Reset to Defaults"
                    >
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                        <span>Reset to Defaults</span>
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{saving ? 'Saving...' : 'Save Header'}</span>
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* LIVE PREVIEW CONTAINER */}
            <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between px-2 gap-3 text-xs font-semibold text-slate-400">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-sky-400" />
                        <span>Live Header Preview</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Device Mode Toggle */}
                        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setPreviewMode('desktop')}
                                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                    previewMode === 'desktop' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Monitor className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Desktop</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewMode('mobile')}
                                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                    previewMode === 'mobile' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Mobile</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Frame */}
                <div className={`mx-auto bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xs border border-slate-200 transition-all duration-200 ${
                    previewMode === 'mobile' ? 'max-w-sm' : 'w-full'
                }`}>
                    {/* Announcement Bar Preview */}
                    {headerSettings.announcement_enabled && (
                        <div
                            style={{ backgroundColor: headerSettings.announcement_bg || '#0284c7' }}
                            className="px-4 py-2 text-white text-xs font-semibold text-center flex items-center justify-center gap-2 truncate"
                        >
                            <span>{previewAnnouncementText}</span>
                            {headerSettings.announcement_link && (
                                <span className="underline text-[11px] font-bold opacity-90 hover:opacity-100">
                                    View Details →
                                </span>
                            )}
                        </div>
                    )}

                    {/* Main Nav Bar Preview */}
                    <div className="px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between border-b border-slate-100 bg-white">
                        {/* Logo Left */}
                        <div className="flex items-center gap-3">
                            {headerSettings.logo_url ? (
                                <img
                                    src={headerSettings.logo_url}
                                    alt="Logo"
                                    style={{ height: `${headerSettings.logo_height || 44}px` }}
                                    className="w-auto object-contain max-w-[160px]"
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                                        M
                                    </div>
                                    <div>
                                        <span className="text-lg font-black text-slate-900 tracking-tight block">
                                            {previewBrandTitle}
                                        </span>
                                        <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block -mt-1">
                                            {previewBrandSubtitle}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Links (Desktop) */}
                        {previewMode === 'desktop' && (
                            <div className="hidden md:flex items-center gap-6">
                                {(headerSettings.menu_items || []).map((item) => {
                                    const localizedLabel = getLocalizedText(item.label, item.label_en, previewLang) || item.label;
                                    const hasSubs = item.children && item.children.length > 0;
                                    return (
                                        <span
                                            key={item.id}
                                            className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 flex items-center gap-1 cursor-default"
                                        >
                                            {item.highlight && <Sparkles className="w-3.5 h-3.5 text-sky-500" />}
                                            <span>{localizedLabel}</span>
                                            {hasSubs && <ChevronDown className="w-3 h-3 text-slate-400" />}
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Actions Right */}
                        <div className="flex items-center gap-2.5">
                            {headerSettings.cta_button_enabled && (
                                <span className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 rounded-xl shadow-xs">
                                    {previewCtaText}
                                </span>
                            )}
                            {headerSettings.show_auth_buttons && (
                                <span className="hidden sm:inline px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl">
                                    Login
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BUILDER TABS & FORM CONTROLS */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 bg-slate-50/60 overflow-x-auto scrollbar-thin">
                    <button
                        type="button"
                        onClick={() => setActiveTab('branding')}
                        className={`px-6 py-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'branding'
                                ? 'border-sky-600 text-sky-600 bg-white'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <ImageIcon className="w-4 h-4" />
                        <span>Logo & Branding</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('menu')}
                        className={`px-6 py-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'menu'
                                ? 'border-sky-600 text-sky-600 bg-white'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        <span>Navigation Menu ({headerSettings.menu_items?.length || 0})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('announcement')}
                        className={`px-6 py-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'announcement'
                                ? 'border-sky-600 text-sky-600 bg-white'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Bell className="w-4 h-4" />
                        <span>Announcement Bar</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('options')}
                        className={`px-6 py-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'options'
                                ? 'border-sky-600 text-sky-600 bg-white'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Sliders className="w-4 h-4" />
                        <span>Buttons & Options</span>
                    </button>
                </div>

                <div className="p-6 sm:p-8">
                    {/* TAB 1: LOGO & BRANDING */}
                    {activeTab === 'branding' && (
                        <div className="space-y-6">
                            {/* Logo Upload Section */}
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                                <h4 className="text-sm font-bold text-slate-900">Website Logo (Header Logo)</h4>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="w-36 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2 shadow-2xs">
                                        {headerSettings.logo_url ? (
                                            <img
                                                src={headerSettings.logo_url}
                                                alt="Logo"
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-[11px] text-slate-400 font-medium">No Logo</span>
                                        )}
                                    </div>

                                    <div className="space-y-3 flex-1 w-full">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <input
                                                type="file"
                                                ref={logoFileInputRef}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleLogoUpload(file);
                                                }}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                disabled={uploadingLogo}
                                                onClick={() => logoFileInputRef.current?.click()}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                            >
                                                {uploadingLogo ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="w-4 h-4" />
                                                        <span>Upload from Device</span>
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setIsMediaModalOpen(true)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
                                            >
                                                <ImageIcon className="w-4 h-4 text-slate-600" />
                                                <span>Choose from Media Library</span>
                                            </button>

                                            {headerSettings.logo_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdate('logo_url', null)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Remove Logo</span>
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            value={headerSettings.logo_url || ''}
                                            onChange={(e) => handleUpdate('logo_url', e.target.value.trim() || null)}
                                            placeholder="Or paste image URL directly"
                                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Logo Height */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Logo Height ({headerSettings.logo_height || 44}px)
                                    </label>
                                    <input
                                        type="range"
                                        min="28"
                                        max="64"
                                        value={headerSettings.logo_height || 44}
                                        onChange={(e) => handleUpdate('logo_height', parseInt(e.target.value) || 44)}
                                        className="w-full cursor-pointer accent-sky-600"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Brand Title
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_title || ''}
                                                onChange={(e) => handleUpdate('brand_title', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="e.g. Monologue"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Brand Title (English)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_title_en || ''}
                                                onChange={(e) => handleUpdate('brand_title_en', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="e.g. Monologue"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Brand Subtitle
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_subtitle || ''}
                                                onChange={(e) => handleUpdate('brand_subtitle', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="e.g. Edu"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Brand Subtitle (English)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_subtitle_en || ''}
                                                onChange={(e) => handleUpdate('brand_subtitle_en', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="e.g. Edu"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: MENU ITEMS BUILDER */}
                    {activeTab === 'menu' && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Navigation Menu Items</h4>
                                    <p className="text-xs text-slate-500">
                                        Configure primary links displayed in the website header.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddMenuItem}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add New Menu Item</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(headerSettings.menu_items || []).map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 transition-all hover:border-slate-300"
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={() => handleMoveMenuItem(idx, 'up')}
                                                    className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                                    title="Move Up"
                                                >
                                                    <MoveUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={idx === (headerSettings.menu_items?.length || 0) - 1}
                                                    onClick={() => handleMoveMenuItem(idx, 'down')}
                                                    className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                                    title="Move Down"
                                                >
                                                    <MoveDown className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">মেনু লেবেল (Menu Label)</label>
                                                    <input
                                                        type="text"
                                                        value={item.label}
                                                        onChange={(e) => handleUpdateMenuItem(idx, { label: e.target.value, label_en: e.target.value })}
                                                        placeholder="যেমন: কোর্সসমূহ"
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">লিংক URL (Link URL)</label>
                                                    <input
                                                        type="text"
                                                        value={item.url}
                                                        onChange={(e) => handleUpdateMenuItem(idx, { url: e.target.value })}
                                                        placeholder="যেমন: /courses"
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start pt-2 sm:pt-0 shrink-0">
                                                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(item.highlight)}
                                                        onChange={(e) => handleUpdateMenuItem(idx, { highlight: e.target.checked })}
                                                        className="w-4 h-4 text-sky-600 rounded"
                                                    />
                                                    <span>✨ হাইলাইট</span>
                                                </label>

                                                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(item.is_external)}
                                                        onChange={(e) => handleUpdateMenuItem(idx, { is_external: e.target.checked })}
                                                        className="w-4 h-4 text-sky-600 rounded"
                                                    />
                                                    <span>এক্সটার্নাল</span>
                                                </label>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMenuItem(idx)}
                                                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                    title="মুছুন"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Submenu Dropdown Items Section */}
                                        <div className="mt-2 pt-3 border-t border-slate-200/80 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                                    <Layers className="w-3.5 h-3.5 text-sky-600" />
                                                    <span>ড্রপডাউন সাব-মেনু লিঙ্ক ({item.children?.length || 0})</span>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSubMenuItem(idx)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-white hover:bg-sky-50 border border-sky-200 rounded-lg cursor-pointer transition shadow-2xs"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    <span>সাব-মেনু যোগ করুন</span>
                                                </button>
                                            </div>

                                            {item.children && item.children.length > 0 && (
                                                <div className="space-y-2 pl-3 border-l-2 border-sky-300">
                                                    {item.children.map((sub, sIdx) => (
                                                        <div key={sub.id || sIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-white rounded-xl border border-slate-200 items-center">
                                                            <div className="sm:col-span-5">
                                                                <input
                                                                    type="text"
                                                                    value={sub.label}
                                                                    onChange={(e) => handleUpdateSubMenuItem(idx, sIdx, { label: e.target.value, label_en: e.target.value })}
                                                                    placeholder="সাব-মেনু লেবেল (যেমন: HSC সাইকেল)"
                                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-sky-500"
                                                                />
                                                            </div>
                                                            <div className="sm:col-span-5">
                                                                <input
                                                                    type="text"
                                                                    value={sub.url}
                                                                    onChange={(e) => handleUpdateSubMenuItem(idx, sIdx, { url: e.target.value })}
                                                                    placeholder="URL (যেমন: /courses)"
                                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500"
                                                                />
                                                            </div>
                                                            <div className="sm:col-span-2 flex items-center justify-end gap-2">
                                                                <label className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold cursor-pointer" title="External link">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={Boolean(sub.is_external)}
                                                                        onChange={(e) => handleUpdateSubMenuItem(idx, sIdx, { is_external: e.target.checked })}
                                                                        className="w-3.5 h-3.5 text-sky-600 rounded"
                                                                    />
                                                                    <span>Ext</span>
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteSubMenuItem(idx, sIdx)}
                                                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                                                                    title="মুছুন"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {(headerSettings.menu_items?.length || 0) === 0 && (
                                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                                        No menu items configured. Click "Add New Menu Item" above.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: ANNOUNCEMENT BAR */}
                    {activeTab === 'announcement' && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-sky-50/50 border border-sky-100">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Enable Top Announcement Bar</h4>
                                    <p className="text-xs text-slate-500">Displays a prominent banner notice at the very top of the header</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(headerSettings.announcement_enabled)}
                                        onChange={(e) => handleUpdate('announcement_enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600" />
                                </label>
                            </div>

                            {headerSettings.announcement_enabled && (
                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Notice Message
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.announcement_text || ''}
                                                onChange={(e) => handleUpdate('announcement_text', e.target.value)}
                                                placeholder="e.g. 🎉 New batch admission open! Enroll now with 20% discount."
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Notice Link URL (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.announcement_link || ''}
                                                onChange={(e) => handleUpdate('announcement_link', e.target.value)}
                                                placeholder="e.g. /courses or https://..."
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Background Color
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={headerSettings.announcement_bg || '#0284c7'}
                                                onChange={(e) => handleUpdate('announcement_bg', e.target.value)}
                                                className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                                            />
                                            <input
                                                type="text"
                                                value={headerSettings.announcement_bg || '#0284c7'}
                                                onChange={(e) => handleUpdate('announcement_bg', e.target.value)}
                                                className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: OPTIONS & BUTTONS */}
                    {activeTab === 'options' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Sticky Header */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Sticky Header</div>
                                        <div className="text-[11px] text-slate-500">Keep header pinned at the top while scrolling</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(headerSettings.sticky)}
                                        onChange={(e) => handleUpdate('sticky', e.target.checked)}
                                        className="w-5 h-5 text-sky-600 rounded"
                                    />
                                </div>

                                {/* Theme Switcher */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Dark/Light Theme Toggle</div>
                                        <div className="text-[11px] text-slate-500">Display theme toggle button in header</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(headerSettings.show_theme_toggle)}
                                        onChange={(e) => handleUpdate('show_theme_toggle', e.target.checked)}
                                        className="w-5 h-5 text-sky-600 rounded"
                                    />
                                </div>

                                {/* Auth Buttons */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Login / Register Buttons</div>
                                        <div className="text-[11px] text-slate-500">Display user account buttons in header</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(headerSettings.show_auth_buttons)}
                                        onChange={(e) => handleUpdate('show_auth_buttons', e.target.checked)}
                                        className="w-5 h-5 text-sky-600 rounded"
                                    />
                                </div>

                                {/* Custom CTA Button */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Custom Action Button (CTA)</div>
                                        <div className="text-[11px] text-slate-500">e.g. "Free Class" or "Enroll Now" button</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(headerSettings.cta_button_enabled)}
                                        onChange={(e) => handleUpdate('cta_button_enabled', e.target.checked)}
                                        className="w-5 h-5 text-sky-600 rounded"
                                    />
                                </div>
                            </div>

                            {headerSettings.cta_button_enabled && (
                                <div className="p-5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-4">
                                    <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider">CTA Button Configuration</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Button Text
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.cta_button_text || ''}
                                                onChange={(e) => handleUpdate('cta_button_text', e.target.value)}
                                                placeholder="e.g. Free Classes"
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Button Link URL
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.cta_button_link || ''}
                                                onChange={(e) => handleUpdate('cta_button_link', e.target.value)}
                                                placeholder="e.g. /courses"
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Media Picker Modal */}
            <MediaPickerModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                filterType="image"
                title="Select Logo Image"
                onSelect={(url) => {
                    handleUpdate('logo_url', url);
                    setIsMediaModalOpen(false);
                }}
            />
        </div>
    );
};