import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
    Settings, 
    Save, 
    CheckCircle2, 
    Mail, 
    Phone, 
    Loader2 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';

export const AdminSettingsPage: React.FC = () => {
    const { t } = useLanguage();
    const { refreshSettings, updateSettingsLocally } = useSettings();

    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await apiClient.get('/settings');
            setContactEmail(data.contact_email || '');
            setContactPhone(data.contact_phone || '');
        } catch {
            // handle error
        } finally {
            setLoading(false);
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

            const { data } = await apiClient.put('/admin/website-settings', updatePayload);
            updateSettingsLocally(updatePayload);
            await refreshSettings();

            setSuccessMessage(data.message || t.settings.successMsg);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400 font-semibold">{t.common.loading}</div>;
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
                                    placeholder="support@novonex.edu.bd"
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
    );
};
