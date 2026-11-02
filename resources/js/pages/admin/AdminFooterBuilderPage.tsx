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
    brand_title: 'Novonex',
    brand_title_en: 'Novonex',
    brand_subtitle: 'Academy',
    brand_subtitle_en: 'Academy',
    description: 'বাংলাদেশের অন্যতম শীর্ষস্থানীয় অনলাইন লার্নিং প্ল্যাটফর্ম। ঘরে বসেই দেশের সেরা শিক্ষকদের সাথে নাও সম্পূর্ণ প্রস্তুতি।',
    description_en: "Bangladesh's leading online education platform. Prepare for exams with top mentors from BUET and Dhaka University.",
    badge_text: '১০০% বিশ্বস্ত লার্নিং প্ল্যাটফর্ম',
    badge_text_en: '100% Trusted Learning Platform',
    show_badge: true,
    column_2_title: 'দ্রুত লিঙ্কসমূহ',
    column_2_title_en: 'Quick Links',
    column_2_links: [
        { id: '1', label: 'হোম', label_en: 'Home', url: '/' },
        { id: '2', label: 'সকল কোর্স', label_en: 'All Courses', url: '/courses' },
        { id: '3', label: 'পদার্থবিজ্ঞান কোর্সসমূহ', label_en: 'Physics Courses', url: '/courses?category=hsc-physics' },
        { id: '4', label: 'ভর্তি প্রস্তুতি কোর্সসমূহ', label_en: 'Admission Preparation', url: '/courses?category=admission' },
    ],
    column_3_title: 'জনপ্রিয় বিষয়সমূহ',
    column_3_title_en: 'Popular Subjects',
    column_3_links: [
        { id: '1', label: 'পদার্থবিজ্ঞান', label_en: 'HSC Physics', url: '/courses?category=hsc-physics' },
        { id: '2', label: 'রসায়ন', label_en: 'HSC Chemistry', url: '/courses?category=chemistry' },
        { id: '3', label: 'উচ্চতর গণিত', label_en: 'Higher Math', url: '/courses?category=math' },
        { id: '4', label: 'ভর্তি প্রস্তুতি', label_en: 'Admission Prep', url: '/courses?category=admission' },
    ],
    column_4_title: 'যোগাযোগ',
    column_4_title_en: 'Contact Us',
    phone: '+880 1700 000000',
    phone_hours: 'সকাল ১০টা - রাত ১০টা (শনি - বৃহস্পতি)',
    phone_hours_en: '10 AM - 10 PM (Sat - Thu)',
    email: 'support@novonex.edu.bd',
    address: 'Dhaka, Bangladesh',
    address_en: 'Dhaka, Bangladesh',
    social_links: [
        { id: '1', platform: 'facebook', url: 'https://facebook.com' },
        { id: '2', platform: 'youtube', url: 'https://youtube.com' },
    ],
    copyright_text: '© 2026 Novonex Academy. সর্বস্বত্ব সংরক্ষিত।',
    copyright_text_en: '© 2026 Novonex Academy. All rights reserved.',
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
                brand_title: settings.footer_settings.brand_title || settings.site_name || 'Novonex',
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
        const newLink: FooterLink = { id: Date.now().toString(), label: 'নতুন লিঙ্ক', label_en: '', url: '/' };
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
        const newLink: FooterLink = { id: Date.now().toString(), label: 'নতুন লিঙ্ক', label_en: '', url: '/' };
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
            setSuccessMessage(data.message || 'ফুটার বিল্ডার সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'সংরক্ষণ করতে সমস্যা হয়েছে।');
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefaults = () => {
        if (window.confirm('আপনি কি নিশ্চিত যে ফুটার সেটিংস ডিফল্ট মানে রিসেট করতে চান?')) {
            setFooterSettings(DEFAULT_FOOTER_SETTINGS);
        }
    };

    // Live preview localized helpers based on previewLang
    const previewBrandTitle = getLocalizedText(footerSettings.brand_title, footerSettings.brand_title_en, previewLang) || 'Novonex';
    const previewBrandSubtitle = getLocalizedText(footerSettings.brand_subtitle, footerSettings.brand_subtitle_en, previewLang) || 'Academy';
    const previewDescription = getLocalizedText(footerSettings.description, footerSettings.description_en, previewLang);
    const previewBadgeText = getLocalizedText(footerSettings.badge_text, footerSettings.badge_text_en, previewLang);
    const previewCol2Title = getLocalizedText(footerSettings.column_2_title, footerSettings.column_2_title_en, previewLang) || (previewLang === 'en' ? 'Quick Links' : 'দ্রুত লিঙ্কসমূহ');
    const previewCol3Title = getLocalizedText(footerSettings.column_3_title, footerSettings.column_3_title_en, previewLang) || (previewLang === 'en' ? 'Popular Subjects' : 'জনপ্রিয় বিষয়সমূহ');
    const previewCol4Title = getLocalizedText(footerSettings.column_4_title, footerSettings.column_4_title_en, previewLang) || (previewLang === 'en' ? 'Contact Us' : 'যোগাযোগ');
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
                        <span>ফুটার বিল্ডার (Footer Builder)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        ওয়েবসাইটের মূল ফুটার সেকশনের কন্টেন্ট, লিঙ্ক, সামাজিক যোগাযোগ ও দ্বিভাষিক (বাংলা ও English) ক্যাপশন কাস্টমাইজ করুন
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
                        <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'ফুটার সংরক্ষণ করুন'}</span>
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
                        <span>লাইভ ফুটার প্রিভিউ (Live Footer Preview)</span>
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
                                        {getLocalizedText(link.label, link.label_en, previewLang) || link.label}
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
                                        {getLocalizedText(link.label, link.label_en, previewLang) || link.label}
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
                        <span>১. ব্র্যান্ড ও বিবরণ</span>
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
                        <span>২. দ্রুত লিঙ্কসমূহ</span>
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
                        <span>৩. বিষয় ও কোর্স লিঙ্ক</span>
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
                        <span>৪. যোগাযোগ ও সোশ্যাল</span>
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
                        <span>৫. ফুটার ও লিগ্যাল নোটিশ</span>
                    </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    {/* TAB 1: BRAND & INTRO */}
                    {activeTab === 'col1' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        ব্র্যান্ড শিরোনাম (বাংলা/মূল)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.brand_title || ''}
                                        onChange={(e) => handleUpdate('brand_title', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                        placeholder="যেমন: Novonex"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Brand Title (English Mode - ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.brand_title_en || ''}
                                        onChange={(e) => handleUpdate('brand_title_en', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                                        placeholder="e.g. Novonex"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        সাব-টাইটেল / এক্সটেনশন (বাংলা/মূল)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.brand_subtitle || ''}
                                        onChange={(e) => handleUpdate('brand_subtitle', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-sky-600"
                                        placeholder="যেমন: Academy"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Brand Subtitle (English Mode - ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.brand_subtitle_en || ''}
                                        onChange={(e) => handleUpdate('brand_subtitle_en', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-sky-600"
                                        placeholder="e.g. Academy"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        সংক্ষিপ্ত বিবরণ (বাংলা/মূল)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={footerSettings.description || ''}
                                        onChange={(e) => handleUpdate('description', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium leading-relaxed"
                                        placeholder="ফুটারের পরিচিতি বিবরণ লিখুন..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Description (English Mode - ঐচ্ছিক)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={footerSettings.description_en || ''}
                                        onChange={(e) => handleUpdate('description_en', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium leading-relaxed"
                                        placeholder="Write English description (leaves blank to use main description in all modes)..."
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">ট্রাস্ট ব্যাজ (Trust Badge)</div>
                                        <div className="text-[11px] text-slate-500">ব্র্যান্ডের নিচে বিশ্বস্ততা প্রকাশক ব্যাজ</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(footerSettings.show_badge)}
                                        onChange={(e) => handleUpdate('show_badge', e.target.checked)}
                                        className="w-5 h-5 text-sky-600 rounded"
                                    />
                                </div>
                                {footerSettings.show_badge && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">ব্যাজ টেক্সট (বাংলা/মূল)</label>
                                            <input
                                                type="text"
                                                value={footerSettings.badge_text || ''}
                                                onChange={(e) => handleUpdate('badge_text', e.target.value)}
                                                placeholder="যেমন: ১০০% বিশ্বস্ত লার্নিং প্ল্যাটফর্ম"
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Badge Text (English Mode - ঐচ্ছিক)</label>
                                            <input
                                                type="text"
                                                value={footerSettings.badge_text_en || ''}
                                                onChange={(e) => handleUpdate('badge_text_en', e.target.value)}
                                                placeholder="e.g. 100% Trusted Learning Platform"
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: COLUMN 2 QUICK LINKS */}
                    {activeTab === 'col2' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        কলামের শিরোনাম (বাংলা/মূল)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.column_2_title || ''}
                                        onChange={(e) => handleUpdate('column_2_title', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                        placeholder="যেমন: দ্রুত লিঙ্কসমূহ"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Column 2 Title (English Mode - ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.column_2_title_en || ''}
                                        onChange={(e) => handleUpdate('column_2_title_en', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                                        placeholder="e.g. Quick Links"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">লিঙ্কসমূহ</h4>
                                <button
                                    type="button"
                                    onClick={handleAddCol2Link}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>লিঙ্ক যোগ করুন</span>
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                {(footerSettings.column_2_links || []).map((link, idx) => (
                                    <div key={link.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl items-center">
                                        <div className="sm:col-span-4">
                                            <input
                                                type="text"
                                                value={link.label}
                                                onChange={(e) => handleUpdateCol2Link(idx, { label: e.target.value })}
                                                placeholder="লিঙ্কের নাম (বাংলা)"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                                            />
                                        </div>
                                        <div className="sm:col-span-4">
                                            <input
                                                type="text"
                                                value={link.label_en || ''}
                                                onChange={(e) => handleUpdateCol2Link(idx, { label_en: e.target.value })}
                                                placeholder="English Label (ঐচ্ছিক)"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
                                            <input
                                                type="text"
                                                value={link.url}
                                                onChange={(e) => handleUpdateCol2Link(idx, { url: e.target.value })}
                                                placeholder="URL (যেমন: /courses)"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCol2Link(idx)}
                                                className="p-1.5 text-rose-500 hover:text-rose-700"
                                                title="মুছুন"
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        কলামের শিরোনাম (বাংলা/মূল)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.column_3_title || ''}
                                        onChange={(e) => handleUpdate('column_3_title', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                        placeholder="যেমন: জনপ্রিয় বিষয়সমূহ"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Column 3 Title (English Mode - ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.column_3_title_en || ''}
                                        onChange={(e) => handleUpdate('column_3_title_en', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                                        placeholder="e.g. Popular Subjects"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">লিঙ্কসমূহ</h4>
                                <button
                                    type="button"
                                    onClick={handleAddCol3Link}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>লিঙ্ক যোগ করুন</span>
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                {(footerSettings.column_3_links || []).map((link, idx) => (
                                    <div key={link.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl items-center">
                                        <div className="sm:col-span-4">
                                            <input
                                                type="text"
                                                value={link.label}
                                                onChange={(e) => handleUpdateCol3Link(idx, { label: e.target.value })}
                                                placeholder="লিঙ্কের নাম (বাংলা)"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                                            />
                                        </div>
                                        <div className="sm:col-span-4">
                                            <input
                                                type="text"
                                                value={link.label_en || ''}
                                                onChange={(e) => handleUpdateCol3Link(idx, { label_en: e.target.value })}
                                                placeholder="English Label (ঐচ্ছিক)"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
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
                                                title="মুছুন"
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        যোগাযোগ কলাম শিরোনাম (বাংলা/মূল)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.column_4_title || ''}
                                        onChange={(e) => handleUpdate('column_4_title', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                        placeholder="যেমন: যোগাযোগ"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Column 4 Title (English Mode - ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.column_4_title_en || ''}
                                        onChange={(e) => handleUpdate('column_4_title_en', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                                        placeholder="e.g. Contact Us"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        হটলাইন / ফোন নম্বর
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
                                        কল করার সময়সীমা (বাংলা/মূল)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.phone_hours || ''}
                                        onChange={(e) => handleUpdate('phone_hours', e.target.value)}
                                        placeholder="যেমন: সকাল ১০টা - রাত ১০টা"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Phone Hours (English Mode - ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.phone_hours_en || ''}
                                        onChange={(e) => handleUpdate('phone_hours_en', e.target.value)}
                                        placeholder="e.g. 10 AM - 10 PM (Sat - Thu)"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        সাপোর্ট ইমেইল
                                    </label>
                                    <input
                                        type="email"
                                        value={footerSettings.email || ''}
                                        onChange={(e) => handleUpdate('email', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                        placeholder="support@novonex.edu.bd"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        অফিস ঠিকানা (বাংলা/মূল)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.address || ''}
                                        onChange={(e) => handleUpdate('address', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                        placeholder="যেমন: ঢাকা, বাংলাদেশ"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Office Address (English Mode - ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="text"
                                        value={footerSettings.address_en || ''}
                                        onChange={(e) => handleUpdate('address_en', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                        placeholder="e.g. Dhaka, Bangladesh"
                                    />
                                </div>
                            </div>

                            {/* Social Media Links */}
                            <div className="pt-2 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Share2 className="w-3.5 h-3.5 text-sky-600" />
                                        <span>সোশ্যাল মিডিয়া লিঙ্কসমূহ</span>
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={handleAddSocialLink}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>সোশ্যাল নেটওয়ার্ক যোগ করুন</span>
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
                                                placeholder="প্রোফাইল বা পেইজ লিঙ্ক (https://...)"
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
                                            ফুটার ও লিগ্যাল নোটিশ (Footer & Legal Notice)
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            ওয়েবসাইটের একদম নিচের কপিরাইট বার্তা ও ক্রেডিট বাংলা এবং ইংরেজি মোডের জন্য কনফিগার করুন
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                ফুটার কপিরাইট টেক্সট (বাংলা/মূল)
                                            </label>
                                            <input
                                                type="text"
                                                value={footerSettings.copyright_text || ''}
                                                onChange={(e) => handleUpdate('copyright_text', e.target.value)}
                                                placeholder="© 2026 Novonex Academy. সর্বস্বত্ব সংরক্ষিত।"
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                            />
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                যেমন: © ২০২৬ নভনেক্স একাডেমি। সর্বস্বত্ব সংরক্ষিত।
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Copyright Text (English Mode - ঐচ্ছিক)
                                            </label>
                                            <input
                                                type="text"
                                                value={footerSettings.copyright_text_en || ''}
                                                onChange={(e) => handleUpdate('copyright_text_en', e.target.value)}
                                                placeholder="e.g. © 2026 Novonex Academy. All rights reserved."
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                            />
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                ফাঁকা রাখলে ইংরেজি মোডেও মূল কপিরাইটটি দেখাবে
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                বটম ক্রেডিট / সেকেন্ডারি টেক্সট (বাংলা/মূল)
                                            </label>
                                            <input
                                                type="text"
                                                value={footerSettings.bottom_credit || ''}
                                                onChange={(e) => handleUpdate('bottom_credit', e.target.value)}
                                                placeholder="যেমন: শিক্ষার্থীদের জন্য ❤️ দিয়ে তৈরি"
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Bottom Credit (English Mode - ঐচ্ছিক)
                                            </label>
                                            <input
                                                type="text"
                                                value={footerSettings.bottom_credit_en || ''}
                                                onChange={(e) => handleUpdate('bottom_credit_en', e.target.value)}
                                                placeholder="e.g. Crafted with ❤️ for passionate learners"
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
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
                                            ফুটার ব্যাকগ্রাউন্ড ও স্টাইল (Footer Styling)
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            ফুটার সেকশনের মূল ব্যাকগ্রাউন্ড কালার নির্বাচন করুন
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        ফুটার ব্যাকগ্রাউন্ড কালার
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
                                            কালার প্রিভিউ
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
