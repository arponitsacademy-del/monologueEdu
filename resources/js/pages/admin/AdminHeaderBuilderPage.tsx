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
    Palette
} from 'lucide-react';

const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
    sticky: true,
    show_theme_toggle: true,
    show_auth_buttons: true,
    logo_url: null,
    logo_height: 44,
    brand_title: 'Novonex',
    brand_title_en: 'Novonex',
    brand_subtitle: 'Academy',
    brand_subtitle_en: 'Academy',
    announcement_enabled: false,
    announcement_text: '🎉 নতুন ব্যাচে ভর্তি চলছে! ২০% ছাড়ে এখনই এনরোল করুন।',
    announcement_text_en: '🎉 New batch admission open! Enroll now with 20% discount.',
    announcement_link: '/courses',
    announcement_bg: '#0284c7',
    cta_button_enabled: false,
    cta_button_text: 'ফ্রি ক্লাস দেখুন',
    cta_button_text_en: 'Free Classes',
    cta_button_link: '/courses',
    menu_items: [
        { id: '1', label: 'হোম', label_en: 'Home', url: '/', is_external: false, highlight: false },
        { id: '2', label: 'সকল কোর্স', label_en: 'All Courses', url: '/courses', is_external: false, highlight: true },
    ]
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
            setHeaderSettings({
                ...DEFAULT_HEADER_SETTINGS,
                ...settings.header_settings,
                logo_url: settings.header_settings.logo_url ?? settings.logo_url ?? null,
            });
        } else if (settings?.logo_url) {
            setHeaderSettings(prev => ({ ...prev, logo_url: settings.logo_url }));
        }
    }, [settings]);

    const handleUpdate = <K extends keyof HeaderSettings>(key: K, value: HeaderSettings[K]) => {
        setHeaderSettings(prev => ({
            ...prev,
            [key]: value
        }));
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
            alert(err.response?.data?.message || 'লোগো ফাইল আপলোড করতে সমস্যা হয়েছে।');
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
            label_en: '',
            url: '/',
            is_external: false,
            highlight: false
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
            setSuccessMessage(data.message || 'হেডার বিল্ডার সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'সংরক্ষণ করতে সমস্যা হয়েছে।');
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefaults = () => {
        if (window.confirm('আপনি কি নিশ্চিত যে হেডার সেটিংস ডিফল্ট মানে রিসেট করতে চান?')) {
            setHeaderSettings(DEFAULT_HEADER_SETTINGS);
        }
    };

    // Localized values for Live Preview based on previewLang toggle
    const previewBrandTitle = getLocalizedText(headerSettings.brand_title, headerSettings.brand_title_en, previewLang) || 'Novonex';
    const previewBrandSubtitle = getLocalizedText(headerSettings.brand_subtitle, headerSettings.brand_subtitle_en, previewLang) || 'Academy';
    const previewAnnouncementText = getLocalizedText(headerSettings.announcement_text, headerSettings.announcement_text_en, previewLang);
    const previewCtaText = getLocalizedText(headerSettings.cta_button_text, headerSettings.cta_button_text_en, previewLang) || (previewLang === 'en' ? 'Enroll Now' : 'ভর্তি হন');

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Palette className="w-7 h-7 text-sky-600" />
                        <span>হেডার বিল্ডার (Header Builder)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        ওয়েবসাইটের মূল হেডারের লোগো, নেভিগেশন মেনু, নোটিশ বার ও দ্বিভাষিক (বাংলা ও English) ক্যাপশন কাস্টমাইজ করুন
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer"
                        title="ডিফল্ট রিসেট"
                    >
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                        <span>ডিফল্ট রিসেট</span>
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'হেডার সংরক্ষণ করুন'}</span>
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
                        <span>লাইভ হেডার প্রিভিউ (Live Header Preview)</span>
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
                                <span className="hidden sm:inline">ডেস্কটপ</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewMode('mobile')}
                                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                    previewMode === 'mobile' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">মোবাইল</span>
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
                                    {previewLang === 'en' ? 'View Details →' : 'বিস্তারিত দেখুন →'}
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
                                        N
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
                                    return (
                                        <span
                                            key={item.id}
                                            className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 flex items-center gap-1 cursor-default"
                                        >
                                            {item.highlight && <Sparkles className="w-3.5 h-3.5 text-sky-500" />}
                                            <span>{localizedLabel}</span>
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
                        <span>লোগো ও ব্র্যান্ডিং</span>
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
                        <span>নেভিগেশন মেনু আইটেম ({headerSettings.menu_items?.length || 0})</span>
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
                        <span>টপ নোটিশ বার</span>
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
                        <span>বাটন ও অতিরিক্ত অপশন</span>
                    </button>
                </div>

                <div className="p-6 sm:p-8">
                    {/* TAB 1: LOGO & BRANDING */}
                    {activeTab === 'branding' && (
                        <div className="space-y-6">
                            {/* Logo Upload Section */}
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                                <h4 className="text-sm font-bold text-slate-900">ওয়েবসাইট লোগো (Header Logo)</h4>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="w-36 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2 shadow-2xs">
                                        {headerSettings.logo_url ? (
                                            <img
                                                src={headerSettings.logo_url}
                                                alt="Logo"
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-[11px] text-slate-400 font-medium">লোগো নেই</span>
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
                                                        <span>আপলোড হচ্ছে...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="w-4 h-4" />
                                                        <span>ডিভাইস থেকে আপলোড</span>
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setIsMediaModalOpen(true)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
                                            >
                                                <ImageIcon className="w-4 h-4 text-slate-600" />
                                                <span>মিডিয়া লাইব্রেরি থেকে বাছুন</span>
                                            </button>

                                            {headerSettings.logo_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdate('logo_url', null)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>লোগো মুছুন</span>
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            value={headerSettings.logo_url || ''}
                                            onChange={(e) => handleUpdate('logo_url', e.target.value.trim() || null)}
                                            placeholder="অথবা সরাসরি ছবির URL পেস্ট করুন"
                                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Logo Height */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        লোগোর উচ্চতা / সাইজ ({headerSettings.logo_height || 44}px)
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
                                                ফলব্যাক ব্র্যান্ড নাম (বাংলা/মূল)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_title || ''}
                                                onChange={(e) => handleUpdate('brand_title', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="যেমন: Novonex"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                ব্র্যান্ড নাম (English Mode)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_title_en || ''}
                                                onChange={(e) => handleUpdate('brand_title_en', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="e.g. Novonex"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                সাবটাইটেল (বাংলা/মূল)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_subtitle || ''}
                                                onChange={(e) => handleUpdate('brand_subtitle', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="যেমন: Academy"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                সাবটাইটেল (English Mode)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_subtitle_en || ''}
                                                onChange={(e) => handleUpdate('brand_subtitle_en', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="e.g. Academy"
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
                                    <h4 className="text-sm font-bold text-slate-900">নেভিগেশন মেনু আইটেমসমূহ</h4>
                                    <p className="text-xs text-slate-500">
                                        বাংলা ও ইংরেজি উভয় ভাষার জন্য আলাদা ক্যাপশন দিন (ইংরেজি ফাঁকা রাখলে মূল লেখাটিই উভয় ভাষায় প্রদর্শিত হবে)
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddMenuItem}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>নতুন মেনু যুক্ত করুন</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(headerSettings.menu_items || []).map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-all hover:border-slate-300"
                                    >
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                disabled={idx === 0}
                                                onClick={() => handleMoveMenuItem(idx, 'up')}
                                                className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                                title="উপরে নিন"
                                            >
                                                <MoveUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={idx === (headerSettings.menu_items?.length || 0) - 1}
                                                onClick={() => handleMoveMenuItem(idx, 'down')}
                                                className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                                title="নিচে নিন"
                                            >
                                                <MoveDown className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">মেনুর নাম (বাংলা/মূল)</label>
                                                <input
                                                    type="text"
                                                    value={item.label}
                                                    onChange={(e) => handleUpdateMenuItem(idx, { label: e.target.value })}
                                                    placeholder="যেমন: সকল কোর্স"
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">English Mode Label (ঐচ্ছিক)</label>
                                                <input
                                                    type="text"
                                                    value={item.label_en || ''}
                                                    onChange={(e) => handleUpdateMenuItem(idx, { label_en: e.target.value })}
                                                    placeholder="e.g. All Courses"
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">লিঙ্ক URL</label>
                                                <input
                                                    type="text"
                                                    value={item.url}
                                                    onChange={(e) => handleUpdateMenuItem(idx, { url: e.target.value })}
                                                    placeholder="যেমন: /courses"
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start pt-2 sm:pt-0">
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
                                                <span>নতুন ট্যাব</span>
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteMenuItem(idx)}
                                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                title="মুছে ফেলুন"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {(headerSettings.menu_items?.length || 0) === 0 && (
                                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                                        কোনো মেনু আইটেম যুক্ত করা নেই। উপরে "নতুন মেনু যুক্ত করুন" বাটনে ক্লিক করুন।
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
                                    <h4 className="text-sm font-bold text-slate-900">টপ অ্যানাউন্সমেন্ট / নোটিশ বার চালু করুন</h4>
                                    <p className="text-xs text-slate-500">হেডারের একদম উপরে গুরুত্বপূর্ণ অফার বা নোটিশ প্রদর্শনের জন্য</p>
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
                                                নোটিশের বার্তা (বাংলা/মূল)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.announcement_text || ''}
                                                onChange={(e) => handleUpdate('announcement_text', e.target.value)}
                                                placeholder="যেমন: 🎉 নতুন ব্যাচে ভর্তি চলছে! ২০% ছাড়ে এখনই এনরোল করুন।"
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Notice Message (English Mode - ঐচ্ছিক)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.announcement_text_en || ''}
                                                onChange={(e) => handleUpdate('announcement_text_en', e.target.value)}
                                                placeholder="e.g. 🎉 Admission open for new batch! 20% discount."
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                নোটিশের লিঙ্ক URL (ঐচ্ছিক)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.announcement_link || ''}
                                                onChange={(e) => handleUpdate('announcement_link', e.target.value)}
                                                placeholder="যেমন: /courses বা https://..."
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                ব্যাকগ্রাউন্ড কালার
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
                                        <div className="text-xs font-bold text-slate-900">স্টিকি হেডার (Sticky Header)</div>
                                        <div className="text-[11px] text-slate-500">স্ক্রল করার সময় হেডার উপরে আটকে থাকবে</div>
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
                                        <div className="text-xs font-bold text-slate-900">ডার্ক/লাইট থিম সুইচ বাটন</div>
                                        <div className="text-[11px] text-slate-500">হেডারে থিম পরিবর্তন করার বাটন দেখাবে</div>
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
                                        <div className="text-xs font-bold text-slate-900">লগইন / রেজিস্টার বাটন</div>
                                        <div className="text-[11px] text-slate-500">শিক্ষার্থী লগইন বাটন হেডারে প্রদর্শিত হবে</div>
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
                                        <div className="text-xs font-bold text-slate-900">কাস্টম অ্যাকশন বাটন (CTA)</div>
                                        <div className="text-[11px] text-slate-500">যেমন: "ফ্রি ক্লাস" বা "ভর্তি আবেদন" বাটন</div>
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
                                    <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider">CTA বাটন কনফিগারেশন</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                বাটনের টেক্সট (বাংলা/মূল)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.cta_button_text || ''}
                                                onChange={(e) => handleUpdate('cta_button_text', e.target.value)}
                                                placeholder="যেমন: ফ্রি ক্লাস দেখুন"
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Button Text (English Mode)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.cta_button_text_en || ''}
                                                onChange={(e) => handleUpdate('cta_button_text_en', e.target.value)}
                                                placeholder="e.g. Free Classes"
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                বাটনের লিঙ্ক URL
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.cta_button_link || ''}
                                                onChange={(e) => handleUpdate('cta_button_link', e.target.value)}
                                                placeholder="যেমন: /courses"
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
                title="লোগোর জন্য ছবি বাছাই করুন"
                onSelect={(url) => {
                    handleUpdate('logo_url', url);
                    setIsMediaModalOpen(false);
                }}
            />
        </div>
    );
};
