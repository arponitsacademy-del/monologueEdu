import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { MediaPickerModal } from '../../components/shared/MediaPickerModal';
import {
    Sparkles,
    Save,
    CheckCircle2,
    UploadCloud,
    Image as ImageIcon,
    Trash2,
    Loader2,
    RotateCcw,
    Globe,
    Lock,
    ExternalLink,
    Palette,
    Info,
    Check,
    Laptop,
    Maximize2,
    X,
    Plus,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';

export const AdminAppearanceGeneralPage: React.FC = () => {
    const { t } = useLanguage();
    const { settings, refreshSettings, updateSettingsLocally } = useSettings();

    // Form state
    const [faviconUrl, setFaviconUrl] = useState<string>('');
    const [siteName, setSiteName] = useState<string>('');
    const [siteTagline, setSiteTagline] = useState<string>('');
    const [primaryColor, setPrimaryColor] = useState<string>('#0ea5e9');
    const [secondaryColor, setSecondaryColor] = useState<string>('#0f172a');

    // UI state
    const [saving, setSaving] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [browserStyle, setBrowserStyle] = useState<'mac' | 'windows'>('mac');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Populate from settings on mount or settings load
    useEffect(() => {
        if (settings) {
            setFaviconUrl(settings.favicon_url || '');
            setSiteName(settings.site_name || 'Novonex Academy');
            setSiteTagline(settings.site_tagline || 'Premier Online Learning & EdTech Platform');
            setPrimaryColor(settings.primary_color || '#0ea5e9');
            setSecondaryColor(settings.secondary_color || '#0f172a');
        }
    }, [settings]);

    // Handle direct file upload
    const handleFaviconUpload = async (file: File) => {
        if (!file) return;

        // Validation for size (< 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('ফাইল সাইজ ১০ মেগাবাইটের কম হতে হবে।');
            return;
        }

        setUploadingFavicon(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await apiClient.post('/admin/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data && res.data.media && res.data.media.url) {
                const uploadedUrl = res.data.media.url;
                setFaviconUrl(uploadedUrl);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'ফ্যাভিকন ফাইল আপলোড করতে সমস্যা হয়েছে।');
        } finally {
            setUploadingFavicon(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Handle Save
    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        setSuccessMessage(null);

        try {
            const payload = {
                favicon_url: faviconUrl.trim() || null,
                site_name: siteName.trim() || 'Novonex Academy',
                site_tagline: siteTagline.trim() || '',
                primary_color: primaryColor,
                secondary_color: secondaryColor,
            };

            const { data } = await apiClient.put('/admin/website-settings', payload);

            updateSettingsLocally(payload);
            await refreshSettings();

            // Also dynamically update active browser favicon tag
            if (payload.favicon_url) {
                let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }
                link.href = payload.favicon_url;
            }

            setSuccessMessage(data.message || t.appearanceGeneral.successMsg);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে।');
        } finally {
            setSaving(false);
        }
    };

    // Reset to defaults
    const handleResetDefaults = () => {
        if (confirm('আপনি কি ডিফল্ট ফ্যাভিকন ও সাইট সেটিংস রিসেট করতে চান?')) {
            setFaviconUrl('');
            setSiteName('Novonex Academy');
            setSiteTagline("বাংলাদেশ'র প্রিমিয়াম এডটেক প্ল্যাটফর্ম");
            setPrimaryColor('#0ea5e9');
            setSecondaryColor('#0f172a');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {t.appearanceGeneral.title}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {t.appearanceGeneral.subtitle}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                        title={t.appearanceGeneral.resetDefaults}
                    >
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                        <span>{t.appearanceGeneral.resetDefaults}</span>
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSave()}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{saving ? t.appearanceGeneral.savingBtn : t.appearanceGeneral.saveBtn}</span>
                    </button>
                </div>
            </div>

            {/* Success Alert */}
            {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* ============================================================ */}
            {/* LIVE BROWSER TAB SIMULATOR (Real-Time Visual Representation) */}
            {/* ============================================================ */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-400" />
                        <span className="text-white font-bold">{t.appearanceGeneral.tabPreviewTitle}</span>
                        <span className="hidden sm:inline text-slate-400">({t.appearanceGeneral.tabPreviewSubtitle})</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setBrowserStyle('mac')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                browserStyle === 'mac' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <span>macOS</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setBrowserStyle('windows')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                browserStyle === 'windows' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <span>Windows</span>
                        </button>
                    </div>
                </div>

                {/* Mock Browser Window */}
                <div className="bg-slate-800/95 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl">
                    {/* Browser Window Controls & Tab Bar */}
                    <div className="bg-slate-950/70 px-4 pt-3 flex items-center gap-3 border-b border-slate-800">
                        {/* OS Window Buttons */}
                        {browserStyle === 'mac' ? (
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block"></span>
                                <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block"></span>
                                <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block"></span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-slate-400 text-[11px] mr-2">
                                <Laptop className="w-3.5 h-3.5" />
                            </div>
                        )}

                        {/* Tabs Row */}
                        <div className="flex items-end gap-1 overflow-x-auto no-scrollbar flex-1">
                            {/* Active Tab (User's Website) */}
                            <div className="bg-slate-800 text-slate-100 px-3.5 py-2 rounded-t-xl flex items-center gap-2.5 max-w-xs sm:max-w-sm border-t border-x border-slate-700 shadow-xs relative group cursor-default">
                                {/* Favicon Preview inside tab */}
                                <div className="w-4 h-4 shrink-0 flex items-center justify-center overflow-hidden rounded-xs">
                                    {faviconUrl ? (
                                        <img
                                            src={faviconUrl}
                                            alt="Favicon"
                                            className="w-4 h-4 object-contain"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                                    )}
                                </div>
                                <span className="text-xs font-semibold truncate">
                                    {siteName || 'Novonex Academy'} {siteTagline ? `| ${siteTagline}` : ''}
                                </span>
                                <button type="button" className="text-slate-400 hover:text-white ml-auto">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Inactive Tab Example */}
                            <div className="px-3 py-2 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-2 rounded-t-xl transition hidden sm:flex">
                                <span className="w-3 h-3 rounded-full bg-slate-700 inline-block"></span>
                                <span className="truncate max-w-[100px]">ড্যাশবোর্ড - Novonex</span>
                            </div>

                            {/* New Tab Button */}
                            <button
                                type="button"
                                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                                title="নতুন ট্যাব"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Windows Window Controls */}
                        {browserStyle === 'windows' && (
                            <div className="flex items-center gap-3 text-slate-400 text-xs ml-auto pr-1">
                                <span className="cursor-pointer hover:text-white">−</span>
                                <span className="cursor-pointer hover:text-white">□</span>
                                <span className="cursor-pointer hover:text-rose-400">✕</span>
                            </div>
                        )}
                    </div>

                    {/* Browser Address Bar */}
                    <div className="bg-slate-900/90 px-4 py-2 flex items-center gap-3 border-b border-slate-800 text-xs text-slate-400">
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="cursor-pointer hover:text-slate-300">←</span>
                            <span className="cursor-pointer hover:text-slate-300">→</span>
                            <RefreshCw className="w-3 h-3 cursor-pointer hover:text-slate-300" />
                        </div>

                        {/* URL Box */}
                        <div className="flex-1 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="text-emerald-400 font-medium">https://</span>
                            <span className="text-slate-100 font-bold">novonex.edu.bd</span>
                            <span className="text-slate-500">/</span>
                            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <ShieldCheck className="w-3 h-3" />
                                <span>SSL সুরক্ষিত</span>
                            </span>
                        </div>
                    </div>

                    {/* Mock Page Content Under Browser Bar */}
                    <div className="p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-center space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                            <span>লাইভ প্রিভিউ সক্রিয়: ব্রাউজারের ট্যাবে আপনার ফ্যাভিকনটি এভাবেই প্রদর্শিত হবে</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-200">
                            {siteName || 'Novonex Academy'}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                            {siteTagline || "বাংলাদেশ'র প্রিমিয়াম এডটেক প্ল্যাটফর্ম"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* FAVICON UPLOAD & CONFIGURATION CARD */}
            {/* ============================================================ */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                {t.appearanceGeneral.faviconTitle}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {t.appearanceGeneral.faviconSubtitle}
                            </p>
                        </div>
                    </div>

                    {faviconUrl ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.appearanceGeneral.activeBadge}</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 self-start sm:self-auto">
                            <Info className="w-3.5 h-3.5" />
                            <span>{t.appearanceGeneral.defaultBadge}</span>
                        </span>
                    )}
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/x-icon,image/png,image/svg+xml,image/webp,image/jpeg,.ico,.png,.svg,.webp"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            handleFaviconUpload(e.target.files[0]);
                        }
                    }}
                />

                {/* Favicon Previews & Action Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Favicon Preview Boxes (Multiple Sizes) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span>বিভিন্ন সাইজে প্রিভিউ (Multi-Size Previews):</span>
                                <span className="text-[10px] text-slate-400">1:1 Square</span>
                            </div>

                            {/* Transparent Grid Pattern Preview Box */}
                            <div className="grid grid-cols-4 gap-3">
                                {/* 16x16 px Standard Tab */}
                                <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:6px_6px] bg-slate-100 border border-slate-200 overflow-hidden"
                                    >
                                        {faviconUrl ? (
                                            <img
                                                src={faviconUrl}
                                                alt="16x16"
                                                className="w-4 h-4 object-contain"
                                            />
                                        ) : (
                                            <Globe className="w-4 h-4 text-slate-400" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600">16 × 16</span>
                                    <span className="text-[9px] text-slate-400">ট্যাব</span>
                                </div>

                                {/* 32x32 px Retina / Taskbar */}
                                <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:6px_6px] bg-slate-100 border border-slate-200 overflow-hidden"
                                    >
                                        {faviconUrl ? (
                                            <img
                                                src={faviconUrl}
                                                alt="32x32"
                                                className="w-8 h-8 object-contain"
                                            />
                                        ) : (
                                            <Globe className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600">32 × 32</span>
                                    <span className="text-[9px] text-slate-400">রেটিনা</span>
                                </div>

                                {/* 48x48 px Bookmark / Shortcut */}
                                <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:6px_6px] bg-slate-100 border border-slate-200 overflow-hidden"
                                    >
                                        {faviconUrl ? (
                                            <img
                                                src={faviconUrl}
                                                alt="48x48"
                                                className="w-9 h-9 object-contain"
                                            />
                                        ) : (
                                            <Globe className="w-7 h-7 text-slate-400" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600">48 × 48</span>
                                    <span className="text-[9px] text-slate-400">বুকমার্ক</span>
                                </div>

                                {/* 64x64 px High-Res */}
                                <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:6px_6px] bg-slate-100 border border-slate-200 overflow-hidden"
                                    >
                                        {faviconUrl ? (
                                            <img
                                                src={faviconUrl}
                                                alt="64x64"
                                                className="w-10 h-10 object-contain"
                                            />
                                        ) : (
                                            <Globe className="w-8 h-8 text-slate-400" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600">64 × 64</span>
                                    <span className="text-[9px] text-slate-400">অ্যাপ আইকন</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions, Upload, and URL input */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-700">
                                ফ্যাভিকন নির্বাচন করুন (Upload or Pick Favicon):
                            </label>

                            <div className="flex flex-wrap gap-2.5">
                                <button
                                    type="button"
                                    disabled={uploadingFavicon}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {uploadingFavicon ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{t.appearanceGeneral.uploadingFavicon}</span>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-4 h-4" />
                                            <span>{t.appearanceGeneral.uploadFaviconBtn}</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsMediaModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
                                >
                                    <ImageIcon className="w-4 h-4 text-slate-600" />
                                    <span>{t.appearanceGeneral.chooseMediaBtn}</span>
                                </button>

                                {faviconUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setFaviconUrl('')}
                                        className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition cursor-pointer"
                                        title={t.appearanceGeneral.removeFaviconBtn}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>{t.appearanceGeneral.removeFaviconBtn}</span>
                                    </button>
                                )}
                            </div>

                            <div className="pt-1">
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                    অথবা সরাসরি ইমেজ URL পেস্ট করুন:
                                </label>
                                <input
                                    type="text"
                                    value={faviconUrl}
                                    onChange={(e) => setFaviconUrl(e.target.value.trim())}
                                    placeholder={t.appearanceGeneral.faviconUrlPlaceholder}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                />
                            </div>
                        </div>

                        {/* Recommendation alert box */}
                        <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3 text-sky-900 text-xs leading-relaxed">
                            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold block text-sky-950 mb-0.5">
                                    {t.appearanceGeneral.recommendationTitle}
                                </span>
                                <span>{t.appearanceGeneral.recommendationText}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* SITE IDENTITY & BRAND COLORS */}
            {/* ============================================================ */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        <Palette className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            {t.appearanceGeneral.siteIdentityTitle}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {t.appearanceGeneral.siteIdentitySubtitle}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t.appearanceGeneral.siteName} *
                        </label>
                        <input
                            type="text"
                            required
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                            placeholder="যেমন: Novonex Academy"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">ব্রাউজার ট্যাবে সাইটের প্রধান শিরোনাম হিসেবে দেখা যাবে</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t.appearanceGeneral.tagline}
                        </label>
                        <input
                            type="text"
                            value={siteTagline}
                            onChange={(e) => setSiteTagline(e.target.value)}
                            placeholder="যেমন: Bangladesh's Premier EdTech Platform"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">ট্যাবের টাইটেলে সাইটের নামের পাশে প্রদর্শিত হবে</p>
                    </div>
                </div>

                {/* Brand Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t.appearanceGeneral.primaryColor}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-2xs"
                            />
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs uppercase"
                            />
                            <div
                                style={{ backgroundColor: primaryColor }}
                                className="h-8 px-3 rounded-lg text-white text-[11px] font-bold flex items-center shadow-xs"
                            >
                                বাটন প্রিভিউ
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t.appearanceGeneral.secondaryColor}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-2xs"
                            />
                            <input
                                type="text"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs uppercase"
                            />
                            <div
                                style={{ backgroundColor: secondaryColor }}
                                className="h-8 px-3 rounded-lg text-white text-[11px] font-bold flex items-center shadow-xs"
                            >
                                ফুটার ব্যাকগ্রাউন্ড
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-2 flex justify-end">
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSave()}
                        className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{saving ? t.appearanceGeneral.savingBtn : t.appearanceGeneral.saveBtn}</span>
                    </button>
                </div>
            </div>

            {/* Media Picker Modal */}
            <MediaPickerModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                filterType="image"
                title="ফ্যাভিকনের জন্য ছবি বাছাই করুন"
                onSelect={(url) => {
                    setFaviconUrl(url);
                    setIsMediaModalOpen(false);
                }}
            />
        </div>
    );
};
