import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
    Settings, 
    Save, 
    CheckCircle2, 
    Mail, 
    Phone, 
    Loader2,
    ShieldCheck,
    Key,
    Eye,
    EyeOff,
    ExternalLink,
    AlertCircle,
    Video,
    Sparkles,
    Check
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';

export const AdminSettingsPage: React.FC = () => {
    const { t } = useLanguage();
    const { refreshSettings, updateSettingsLocally } = useSettings();

    // Contact settings
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    // VdoCipher Configuration
    const [vdoEnabled, setVdoEnabled] = useState(false);
    const [vdoSecret, setVdoSecret] = useState('');
    const [vdoWatermark, setVdoWatermark] = useState(true);
    const [vdoHasSecret, setVdoHasSecret] = useState(false);
    const [vdoShowSecret, setVdoShowSecret] = useState(false);
    const [vdoTesting, setVdoTesting] = useState(false);
    const [vdoTestResult, setVdoTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [vdoSaving, setVdoSaving] = useState(false);
    const [vdoSuccessMsg, setVdoSuccessMsg] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const [genRes, vdoRes] = await Promise.all([
                apiClient.get('/settings'),
                apiClient.get('/admin/vdocipher/settings').catch(() => ({ data: null }))
            ]);

            setContactEmail(genRes.data.contact_email || '');
            setContactPhone(genRes.data.contact_phone || '');

            if (vdoRes?.data) {
                setVdoEnabled(Boolean(vdoRes.data.enabled));
                setVdoWatermark(vdoRes.data.watermark_enabled ?? true);
                setVdoSecret(vdoRes.data.api_secret || '');
                setVdoHasSecret(Boolean(vdoRes.data.has_api_secret));
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTestVdoCipher = async () => {
        setVdoTesting(true);
        setVdoTestResult(null);
        try {
            const { data } = await apiClient.post('/admin/vdocipher/test-connection', {
                api_secret: vdoSecret
            });
            setVdoTestResult({
                success: Boolean(data.success),
                message: data.message || (data.success ? 'Connection successful!' : 'Connection failed.')
            });
            if (data.success) {
                setVdoHasSecret(true);
            }
        } catch (err: any) {
            setVdoTestResult({
                success: false,
                message: err.response?.data?.message || 'Connection failed. Please verify that your API Secret Key is correct.'
            });
        } finally {
            setVdoTesting(false);
        }
    };

    const handleSaveVdoCipher = async () => {
        setVdoSaving(true);
        setVdoSuccessMsg(null);
        setVdoTestResult(null);
        try {
            const { data } = await apiClient.put('/admin/vdocipher/settings', {
                enabled: vdoEnabled,
                api_secret: vdoSecret,
                watermark_enabled: vdoWatermark,
            });
            if (data.success !== false) {
                setVdoHasSecret(Boolean(data.settings?.has_api_secret ?? true));
                setVdoSuccessMsg(data.message || 'VdoCipher configuration saved successfully!');
                setTimeout(() => setVdoSuccessMsg(null), 4000);
            } else {
                setVdoTestResult({
                    success: false,
                    message: data.message || 'Failed to save settings.'
                });
            }
        } catch (err: any) {
            setVdoTestResult({
                success: false,
                message: err.response?.data?.message || 'Failed to save VdoCipher settings.'
            });
        } finally {
            setVdoSaving(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage(null);
        try {
            const updatePayload = {
                default_language: 'en',
                contact_email: contactEmail,
                contact_phone: contactPhone,
            };

            const genRes = await apiClient.put('/admin/website-settings', updatePayload);
            
            // Also update vdocipher if configured
            try {
                await apiClient.put('/admin/vdocipher/settings', {
                    enabled: vdoEnabled,
                    api_secret: vdoSecret,
                    watermark_enabled: vdoWatermark,
                });
            } catch (_) {}

            updateSettingsLocally(updatePayload);
            await refreshSettings();

            setSuccessMessage(genRes.data.message || t.settings.successMsg);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            setSuccessMessage(null);
            alert(err.response?.data?.message || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                <span className="text-sm font-semibold">{t.common.loading}</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Settings className="w-7 h-7 text-sky-600" />
                        <span>{t.settings.title}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">{t.settings.subtitle}</p>
                </div>
            </div>

            {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            <div className="space-y-8">
                {/* VdoCipher Configuration Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-indigo-100 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <span>VdoCipher Configuration</span>
                                    <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                                        DRM Video Hosting
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Configure VdoCipher DRM and dynamic student watermarks to prevent course video piracy
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0">
                            {vdoHasSecret ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Active Configuration</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span>Secret Key Required</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {vdoSuccessMsg && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{vdoSuccessMsg}</span>
                        </div>
                    )}

                    {vdoTestResult && (
                        <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in ${
                            vdoTestResult.success 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                            {vdoTestResult.success ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <span>{vdoTestResult.message}</span>
                        </div>
                    )}

                    <div className="space-y-5">
                        {/* Enable VdoCipher DRM Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                            <div className="space-y-0.5">
                                <label className="text-sm font-bold text-slate-800 cursor-pointer">
                                    Enable VdoCipher DRM Integration
                                </label>
                                <p className="text-xs text-slate-500">
                                    When enabled, directly upload videos with client compression to VdoCipher in the course builder
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={vdoEnabled}
                                    onChange={(e) => setVdoEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* VdoCipher API Secret Key */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>VdoCipher API Secret Key *</span>
                                </label>
                                <a
                                    href="https://dashboard.vdocipher.com/page/settings/apikeys"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                    <span>Get from VdoCipher Dashboard</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>

                            <div className="relative">
                                <input
                                    type={vdoShowSecret ? 'text' : 'password'}
                                    value={vdoSecret}
                                    onChange={(e) => setVdoSecret(e.target.value)}
                                    placeholder="Paste your VdoCipher API Secret Key..."
                                    className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setVdoShowSecret(!vdoShowSecret)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                    title={vdoShowSecret ? 'Hide' : 'Show'}
                                >
                                    {vdoShowSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                This secret key is used for direct cloud uploads and DRM OTP playback generation.
                            </p>
                        </div>

                        {/* Dynamic Student Watermark Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                            <div className="space-y-0.5">
                                <label className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <span>Dynamic Student Watermark</span>
                                </label>
                                <p className="text-xs text-slate-500">
                                    Displays the student's name and mobile number moving across the video to deter screen recording
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={vdoWatermark}
                                    onChange={(e) => setVdoWatermark(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Action Buttons for VdoCipher */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleTestVdoCipher}
                                disabled={vdoTesting || !vdoSecret}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {vdoTesting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                        <span>Testing connection...</span>
                                    </>
                                ) : (
                                    <>
                                        <Video className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Test Connection</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveVdoCipher}
                                disabled={vdoSaving}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {vdoSaving ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Save VdoCipher Settings</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* General Settings Form */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-8">
                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Contact & Support Info Card */}
                        <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-5">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-200/60">
                                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">{t.settings.contactTitle}</h3>
                                    <p className="text-xs text-slate-500">{t.settings.contactSubtitle}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{t.settings.supportEmail}</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        placeholder="support@monologueedu.com"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{t.settings.contactPhone}</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        placeholder="+880 1700 000000"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{saving ? t.settings.savingBtn : t.settings.saveBtn}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};