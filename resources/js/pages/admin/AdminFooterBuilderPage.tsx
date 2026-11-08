import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { FooterSettings, FooterLink, FooterSocialLink } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { getLocalizedText } from '../../utils/localization';
import {
    Save,
    CheckCircle2,
    Plus,
    Trash2,
    RotateCcw,
    Palette,
    Eye,
    Layers,
    Phone,
    Mail,
    MapPin,
    ShieldCheck,
    Heart,
    Share2,
    BookOpen,
    FileText,
    Loader2
} from 'lucide-react';

const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
    bg_color: '#0f172a',
    brand_title: 'Monologue',
    brand_title_en: 'Monologue',
    brand_subtitle: 'Edu',
    brand_subtitle_en: 'Edu',
    description: 'Monologue Edu is a premier online education platform dedicated to conceptual clarity, interactive learning, and exam excellence.',
    description_en: 'Monologue Edu is a premier online education platform dedicated to conceptual clarity, interactive learning, and exam excellence.',
    badge_text: '100% Verified Learning Platform',
    badge_text_en: '100% Verified Learning Platform',
    show_badge: true,
    column_2_title: 'Quick Links',
    column_2_title_en: 'Quick Links',
    column_2_links: [
        { id: '1', label: 'Home', label_en: 'Home', url: '/' },
        { id: '2', label: 'All Courses', label_en: 'All Courses', url: '/courses' },
        { id: '3', label: 'Physics Courses', label_en: 'Physics Courses', url: '/courses?category=hsc-physics' },
        { id: '4', label: 'Admission Preparation', label_en: 'Admission Preparation', url: '/courses?category=admission' },
    ],
    column_3_title: 'Popular Subjects',
    column_3_title_en: 'Popular Subjects',
    column_3_links: [
        { id: '1', label: 'HSC Physics', label_en: 'HSC Physics', url: '/courses?category=hsc-physics' },
        { id: '2', label: 'HSC Chemistry', label_en: 'HSC Chemistry', url: '/courses?category=chemistry' },
        { id: '3', label: 'Higher Math', label_en: 'Higher Math', url: '/courses?category=math' },
        { id: '4', label: 'Admission Prep', label_en: 'Admission Prep', url: '/courses?category=admission' },
    ],
    column_4_title: 'Contact Us',
    column_4_title_en: 'Contact Us',
    phone: '+880 1700 000000',
    phone_hours: '10:00 AM - 10:00 PM (Sat - Thu)',
    phone_hours_en: '10:00 AM - 10:00 PM (Sat - Thu)',
    email: 'support@monologueedu.com',
    address: 'Dhaka, Bangladesh',
    address_en: 'Dhaka, Bangladesh',
    social_links: [
        { id: '1', platform: 'facebook', url: 'https://facebook.com' },
        { id: '2', platform: 'youtube', url: 'https://youtube.com' },
    ],
    copyright_text: '© 2026 Monologue Edu. All rights reserved.',
    copyright_text_en: '© 2026 Monologue Edu. All rights reserved.',
    bottom_credit: 'Crafted with ❤️ for passionate learners',
    bottom_credit_en: 'Crafted with ❤️ for passionate learners',
};

export const AdminFooterBuilderPage: React.FC = () => {
    const { settings, refreshSettings, updateSettingsLocally } = useSettings();

    const [footerSettings, setFooterSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);
    const [activeTab, setActiveTab] = useState<'col1' | 'col2' | 'col3' | 'col4' | 'bottom'>('col1');
    const previewLang = 'en';

    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (settings?.footer_settings) {
            setFooterSettings({
                ...DEFAULT_FOOTER_SETTINGS,
                ...settings.footer_settings,
                brand_title: settings.footer_settings.brand_title || settings.site_name || 'Monologue',
                copyright_text: settings.footer_settings.copyright_text || settings.copyright_text || DEFAULT_FOOTER_SETTINGS.copyright_text,
            });
        }
    }, [settings]);

    const handleUpdate = <K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) => {
        setFooterSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Column 2 link handlers
    const handleAddCol2Link = () => {
        const newLink: FooterLink = { id: Date.now().toString(), label: 'New Link', label_en: 'New Link', url: '/' };
        handleUpdate('column_2_links', [...(footerSettings.column_2_links || []), newLink]);
    };

    const handleUpdateCol2Link = (index: number, updates: Partial<FooterLink>) => {
        const list = [...(footerSettings.column_2_links || [])];
        if (list[index]) {
            list[index] = { ...list[index], ...updates };
            handleUpdate('column_2_links', list);
        }
    };

    const handleDeleteCol2Link = (index: number) => {
        const list = [...(footerSettings.column_2_links || [])];
        list.splice(index, 1);
        handleUpdate('column_2_links', list);
    };

    // Column 3 link handlers
    const handleAddCol3Link = () => {
        const newLink: FooterLink = { id: Date.now().toString(), label: 'New Link', label_en: 'New Link', url: '/' };
        handleUpdate('column_3_links', [...(footerSettings.column_3_links || []), newLink]);
    };

    const handleUpdateCol3Link = (index: number, updates: Partial<FooterLink>) => {
        const list = [...(footerSettings.column_3_links || [])];
        if (list[index]) {
            list[index] = { ...list[index], ...updates };
            handleUpdate('column_3_links', list);
        }
    };

    const handleDeleteCol3Link = (index: number) => {
        const list = [...(footerSettings.column_3_links || [])];
        list.splice(index, 1);
        handleUpdate('column_3_links', list);
    };

    // Social link handlers
    const handleAddSocialLink = () => {
        const newSocial: FooterSocialLink = { id: Date.now().toString(), platform: 'facebook', url: 'https://' };
        handleUpdate('social_links', [...(footerSettings.social_links || []), newSocial]);
    };

    const handleUpdateSocialLink = (index: number, updates: Partial<FooterSocialLink>) => {
        const list = [...(footerSettings.social_links || [])];
        if (list[index]) {
            list[index] = { ...list[index], ...updates };
            handleUpdate('social_links', list);
        }
    };

    const handleDeleteSocialLink = (index: number) => {
        const list = [...(footerSettings.social_links || [])];
        list.splice(index, 1);
        handleUpdate('social_links', list);
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccessMessage(null);
        try {
            const { data } = await apiClient.put('/admin/website-settings/footer', {
                footer_settings: footerSettings
            });
            updateSettingsLocally({ 
                footer_settings: footerSettings,
                copyright_text: footerSettings.copyright_text,
            });
            await refreshSettings();
            setSuccessMessage(data.message || 'Footer builder settings saved successfully!');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save footer settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefaults = () => {
        if (window.confirm('Are you sure you want to reset footer settings to default?')) {
            setFooterSettings(DEFAULT_FOOTER_SETTINGS);
        }
    };

    // Live preview localized helpers
    const previewBrandTitle = getLocalizedText(footerSettings.brand_title, footerSettings.brand_title_en, previewLang) || 'Monologue';
    const previewBrandSubtitle = getLocalizedText(footerSettings.brand_subtitle, footerSettings.brand_subtitle_en, previewLang) || 'Edu';
    const previewDescription = getLocalizedText(footerSettings.description, footerSettings.description_en, previewLang);
    const previewBadgeText = getLocalizedText(footerSettings.badge_text, footerSettings.badge_text_en, previewLang);
    const previewCol2Title = getLocalizedText(footerSettings.column_2_title, footerSettings.column_2_title_en, previewLang) || 'Quick Links';
    const previewCol3Title = getLocalizedText(footerSettings.column_3_title, footerSettings.column_3_title_en, previewLang) || 'Popular Subjects';
    const previewCol4Title = getLocalizedText(footerSettings.column_4_title, footerSettings.column_4_title_en, previewLang) || 'Contact Us';
    const previewPhoneHours = getLocalizedText(footerSettings.phone_hours, footerSettings.phone_hours_en, previewLang);
    const previewAddress = getLocalizedText(footerSettings.address, footerSettings.address_en, previewLang);
    const previewCopyright = getLocalizedText(footerSettings.copyright_text, footerSettings.copyright_text_en, previewLang);
    const previewCredit = getLocalizedText(footerSettings.bottom_credit, footerSettings.bottom_credit_en, previewLang);

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Palette className="w-7 h-7 text-sky-600" />
                        <span>Footer Builder</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Customize the website footer layout, branding, quick links, contact info, and legal notice
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
                        <span>{saving ? 'Saving...' : 'Save Footer'}</span>
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
            <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <Eye className="w-4 h-4 text-sky-400" />
                        <span>Live Footer Preview</span>
                    </div>
                </div>

                {/* Actual Footer Preview Box */}
                <div 
                    style={{ backgroundColor: footerSettings.bg_color || '#0f172a' }}
                    className="rounded-2xl p-6 sm:p-8 text-slate-300 border border-slate-800 shadow-inner"
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Col 1 */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <span className="text-xl font-black text-white tracking-tight">
                                    {previewBrandTitle}{' '}
                                    <span className="text-sky-400">{previewBrandSubtitle}</span>
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {previewDescription}
                            </p>
                            {footerSettings.show_badge && (
                                <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>{previewBadgeText}</span>
                                </div>
                            )}
                        </div>

                        {/* Col 2 */}
                        <div className="space-y-3">
                            <h5 className="text-white font-bold text-sm tracking-wide">
                                {previewCol2Title}
                            </h5>
                            <ul className="space-y-2 text-xs text-slate-400">
                                {(footerSettings.column_2_links || []).map((link, idx) => (
                                    <li key={idx} className="hover:text-sky-400">
                                        {link.label}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Col 3 */}
                        <div className="space-y-3">
                            <h5 className="text-white font-bold text-sm tracking-wide">
                                {previewCol3Title}
                            </h5>
                            <ul className="space-y-2 text-xs text-slate-400">
                                {(footerSettings.column_3_links || []).map((link, idx) => (
                                    <li key={idx} className="hover:text-sky-400">
                                        {link.label}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Col 4 */}
                        <div className="space-y-3">
                            <h5 className="text-white font-bold text-sm tracking-wide">
                                {previewCol4Title}
                            </h5>
                            <div className="space-y-2 text-xs text-slate-400">
                                {footerSettings.phone && (
                                    <div className="flex items-start gap-2">
                                        <Phone className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                                        <div>
                                            <span>{footerSettings.phone}</span>
                                            {previewPhoneHours && (
                                                <div className="text-[10px] text-slate-400">{previewPhoneHours}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {footerSettings.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                        <span>{footerSettings.email}</span>
                                    </div>
                                )}
                                {previewAddress && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                        <span>{previewAddress}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar Preview */}
                    <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
                        <div>{previewCopyright}</div>
                        <div className="flex items-center gap-1">
                            {previewCredit}
                        </div>
                    </div>
                </div>
            </div>

            {/* BUILDER TABS & SETTINGS */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                {/* Tabs Bar */}
                <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-1.5 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('col1')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                            activeTab === 'col1'
                                ? 'bg-white text-sky-600 shadow-xs border border-slate-200'
                                : 'text-slate-600 hover:bg-white/60'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        <span>1. Brand & About</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('col2')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                            activeTab === 'col2'
                                ? 'bg-white text-sky-600 shadow-xs border border-slate-200'
                                : 'text-slate-600 hover:bg-white/60'
                        }`}
                    >
                        <span>2. Quick Links</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('col3')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                            activeTab === 'col3'
                                ? 'bg-white text-sky-600 shadow-xs border border-slate-200'
                                : 'text-slate-600 hover:bg-white/60'
                        }`}
                    >
                        <span>3. Subjects & Courses</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('col4')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                            activeTab === 'col4'
                                ? 'bg-white text-sky-600 shadow-xs border border-slate-200'
                                : 'text-slate-600 hover:bg-white/60'
                        }`}
                    >
                        <Phone className="w-4 h-4" />
                        <span>4. Contact & Social</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('bottom')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                            activeTab === 'bottom'
                                ? 'bg-white text-sky-600 shadow-xs border border-slate-200'
                                : 'text-slate-600 hover:bg-white/60'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        <span>5. Legal & Styling</span>
                    </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    {/* TAB 1: BRAND & INTRO */}
                    {activeTab === 'col1' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Brand Title
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.brand_title || ''}
                                        onChange={(e) => handleUpdate('brand_title', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                        placeholder="e.g. Monologue"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Brand Subtitle
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.brand_subtitle || ''}
                                        onChange={(e) => handleUpdate('brand_subtitle', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-sky-600"
                                        placeholder="e.g. Edu"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Short Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={footerSettings.description || ''}
                                    onChange={(e) => handleUpdate('description', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium leading-relaxed"
                                    placeholder="Write footer introduction description..."
                                />
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Trust Badge</div>
                                        <div className="text-[11px] text-slate-500">Display credibility badge beneath brand name</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(footerSettings.show_badge)}
                                        onChange={(e) => handleUpdate('show_badge', e.target.checked)}
                                        className="w-5 h-5 text-sky-600 rounded"
                                    />
                                </div>
                                {footerSettings.show_badge && (
                                    <div className="pt-1">
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Badge Text</label>
                                        <input
                                            type="text"
                                            value={footerSettings.badge_text || ''}
                                            onChange={(e) => handleUpdate('badge_text', e.target.value)}
                                            placeholder="e.g. 100% Verified Learning Platform"
                                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: COLUMN 2 QUICK LINKS */}
                    {activeTab === 'col2' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Column Title
                                </label>
                                <input
                                    type="text"
                                    value={footerSettings.column_2_title || ''}
                                    onChange={(e) => handleUpdate('column_2_title', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                    placeholder="e.g. Quick Links"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Links</h4>
                                <button
                                    type="button"
                                    onClick={handleAddCol2Link}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Link</span>
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                {(footerSettings.column_2_links || []).map((link, idx) => (
                                    <div key={link.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl items-center">
                                        <div className="sm:col-span-6">
                                            <input
                                                type="text"
                                                value={link.label}
                                                onChange={(e) => handleUpdateCol2Link(idx, { label: e.target.value, label_en: e.target.value })}
                                                placeholder="Link Label"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                                            />
                                        </div>
                                        <div className="sm:col-span-5">
                                            <input
                                                type="text"
                                                value={link.url}
                                                onChange={(e) => handleUpdateCol2Link(idx, { url: e.target.value })}
                                                placeholder="URL (e.g. /courses)"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCol2Link(idx)}
                                                className="p-1.5 text-rose-500 hover:text-rose-700"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: COLUMN 3 CATEGORY LINKS */}
                    {activeTab === 'col3' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Column Title
                                </label>
                                <input
                                    type="text"
                                    value={footerSettings.column_3_title || ''}
                                    onChange={(e) => handleUpdate('column_3_title', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                    placeholder="e.g. Popular Subjects"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Links</h4>
                                <button
                                    type="button"
                                    onClick={handleAddCol3Link}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Link</span>
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                {(footerSettings.column_3_links || []).map((link, idx) => (
                                    <div key={link.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl items-center">
                                        <div className="sm:col-span-6">
                                            <input
                                                type="text"
                                                value={link.label}
                                                onChange={(e) => handleUpdateCol3Link(idx, { label: e.target.value, label_en: e.target.value })}
                                                placeholder="Link Label"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                                            />
                                        </div>
                                        <div className="sm:col-span-5">
                                            <input
                                                type="text"
                                                value={link.url}
                                                onChange={(e) => handleUpdateCol3Link(idx, { url: e.target.value })}
                                                placeholder="URL"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCol3Link(idx)}
                                                className="p-1.5 text-rose-500 hover:text-rose-700"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: CONTACT & SOCIAL */}
                    {activeTab === 'col4' && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Contact Column Title
                                </label>
                                <input
                                    type="text"
                                    value={footerSettings.column_4_title || ''}
                                    onChange={(e) => handleUpdate('column_4_title', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                    placeholder="e.g. Contact Us"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Hotline / Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.phone || ''}
                                        onChange={(e) => handleUpdate('phone', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                        placeholder="+880 1700 000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Calling Hours
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.phone_hours || ''}
                                        onChange={(e) => handleUpdate('phone_hours', e.target.value)}
                                        placeholder="e.g. 10:00 AM - 10:00 PM (Sat - Thu)"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Support Email
                                    </label>
                                    <input
                                        type="email"
                                        value={footerSettings.email || ''}
                                        onChange={(e) => handleUpdate('email', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                        placeholder="support@monologueedu.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Office Address
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.address || ''}
                                        onChange={(e) => handleUpdate('address', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                        placeholder="e.g. Dhaka, Bangladesh"
                                    />
                                </div>
                            </div>

                            {/* Social Media Links */}
                            <div className="pt-2 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Share2 className="w-3.5 h-3.5 text-sky-600" />
                                        <span>Social Media Links</span>
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={handleAddSocialLink}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Social Link</span>
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    {(footerSettings.social_links || []).map((soc, idx) => (
                                        <div key={soc.id || idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                            <select
                                                value={soc.platform}
                                                onChange={(e) => handleUpdateSocialLink(idx, { platform: e.target.value })}
                                                className="w-40 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold capitalize"
                                            >
                                                <option value="facebook">Facebook</option>
                                                <option value="youtube">YouTube</option>
                                                <option value="telegram">Telegram</option>
                                                <option value="whatsapp">WhatsApp</option>
                                                <option value="instagram">Instagram</option>
                                                <option value="linkedin">LinkedIn</option>
                                                <option value="twitter">X / Twitter</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={soc.url}
                                                onChange={(e) => handleUpdateSocialLink(idx, { url: e.target.value })}
                                                placeholder="Profile or page URL (https://...)"
                                                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSocialLink(idx)}
                                                className="p-1.5 text-rose-500 hover:text-rose-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: FOOTER & LEGAL NOTICE & STYLE */}
                    {activeTab === 'bottom' && (
                        <div className="space-y-6">
                            {/* Card 1: Footer & Legal Notice */}
                            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
                                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-slate-900">
                                            Footer & Legal Notice
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Configure copyright text and bottom secondary credits.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-1">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Footer Copyright Text
                                        </label>
                                        <input
                                            type="text"
                                            value={footerSettings.copyright_text || ''}
                                            onChange={(e) => handleUpdate('copyright_text', e.target.value)}
                                            placeholder="© 2026 Monologue Edu. All rights reserved."
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Bottom Credit / Secondary Text
                                        </label>
                                        <input
                                            type="text"
                                            value={footerSettings.bottom_credit || ''}
                                            onChange={(e) => handleUpdate('bottom_credit', e.target.value)}
                                            placeholder="e.g. Crafted with ❤️ for passionate learners"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Styling & Background */}
                            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                        <Palette className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-slate-900">
                                            Footer Styling & Background
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Select main background color for footer section
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Footer Background Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={footerSettings.bg_color || '#0f172a'}
                                            onChange={(e) => handleUpdate('bg_color', e.target.value)}
                                            className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-2xs"
                                        />
                                        <input
                                            type="text"
                                            value={footerSettings.bg_color || '#0f172a'}
                                            onChange={(e) => handleUpdate('bg_color', e.target.value)}
                                            className="w-36 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase"
                                        />
                                        <div
                                            style={{ backgroundColor: footerSettings.bg_color || '#0f172a' }}
                                            className="h-8 px-3 rounded-lg text-white text-[11px] font-bold flex items-center border border-slate-700 shadow-xs"
                                        >
                                            Color Preview
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};