import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import {
    Users,
    Settings,
    DollarSign,
    Clock,
    Percent,
    AlertCircle,
    CheckCircle2,
    Save,
    Loader2,
    CreditCard,
    Award
} from 'lucide-react';

export const AdminAffiliateGeneralSettingsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [formData, setFormData] = useState({
        is_enabled: true,
        cookie_days: 30,
        default_commission_type: 'percentage' as 'percentage' | 'fixed',
        default_commission_amount: 10,
        default_discount_type: 'percentage' as 'percentage' | 'fixed',
        default_discount_amount: 0,
        min_payout_amount: 500,
        require_course_purchase: true,
        terms_notice: '',
    });

    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/admin/affiliate/settings');
            const data = res.data;
            if (data.settings) {
                setFormData({
                    is_enabled: Boolean(data.settings.is_enabled),
                    cookie_days: Number(data.settings.cookie_days || 30),
                    default_commission_type: data.settings.default_commission_type || 'percentage',
                    default_commission_amount: Number(data.settings.default_commission_amount || 10),
                    default_discount_type: data.settings.default_discount_type || 'percentage',
                    default_discount_amount: Number(data.settings.default_discount_amount || 0),
                    min_payout_amount: Number(data.settings.min_payout_amount || 500),
                    require_course_purchase: Boolean(data.settings.require_course_purchase),
                    terms_notice: data.settings.terms_notice || '',
                });
            }
            setStats(data.stats);
        } catch (err: any) {
            console.error('Failed to load affiliate settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAlertMessage(null);
        try {
            setSaving(true);
            const res = await apiClient.put('/admin/affiliate/settings', formData);
            setAlertMessage({ type: 'success', text: res.data.message || 'Settings saved successfully.' });
        } catch (err: any) {
            setAlertMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
                <p className="text-sm">Loading affiliate settings...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <Settings className="w-6 h-6 text-sky-600" />
                    <span>General Affiliate Settings</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Configure cookie validity duration, general default commission rates, and eligibility rules for student affiliates.
                </p>
            </div>

            {/* Quick Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Total Affiliates</p>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{stats.total_affiliates}</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Active Members</p>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{stats.active_affiliates}</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center shrink-0">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Total Commission Paid</p>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">৳{stats.total_commissions_paid}</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Pending Payouts</p>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">৳{stats.pending_payouts}</h3>
                        </div>
                    </div>
                </div>
            )}

            {alertMessage && (
                <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                    alertMessage.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}>
                    {alertMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{alertMessage.text}</span>
                </div>
            )}

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                {/* 1. Main Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Affiliate Program Status</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            When enabled, students can join the affiliate program and earn referral commissions.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_enabled: !formData.is_enabled })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto ${
                            formData.is_enabled
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        <span>{formData.is_enabled ? 'Enabled' : 'Disabled'}</span>
                    </button>
                </div>

                {/* 2. Referral Cookie Duration */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Referral Cookie Validity Period (Days) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative max-w-sm">
                        <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="number"
                            min="1"
                            max="365"
                            required
                            value={formData.cookie_days}
                            onChange={e => setFormData({ ...formData, cookie_days: Number(e.target.value) })}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <p className="text-xs text-slate-500">
                        Number of days within which a student purchase will attribute referral commission to the referrer after clicking the link (e.g. 30 days).
                    </p>
                </div>

                {/* 3. General Commission Rate Settings */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Award className="w-4 h-4 text-sky-600" />
                            <span>Default Commission Rate</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Applied when a specific course does not have a customized affiliate commission set.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Commission Type
                            </label>
                            <select
                                value={formData.default_commission_type}
                                onChange={e => setFormData({ ...formData, default_commission_type: e.target.value as any })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Flat Amount (৳)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Commission Rate / Amount <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                required
                                value={formData.default_commission_amount}
                                onChange={e => setFormData({ ...formData, default_commission_amount: Number(e.target.value) })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. General Buyer Discount Settings */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Percent className="w-4 h-4 text-emerald-600" />
                            <span>Buyer Discount via Referral Link</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Discount received by the purchasing student when buying through an affiliate link.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Discount Type
                            </label>
                            <select
                                value={formData.default_discount_type}
                                onChange={e => setFormData({ ...formData, default_discount_type: e.target.value as any })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Flat Amount (৳)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Discount Amount
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                required
                                value={formData.default_discount_amount}
                                onChange={e => setFormData({ ...formData, default_discount_amount: Number(e.target.value) })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </div>
                </div>

                {/* 5. Eligibility & Payout Threshold */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                            Minimum Payout Amount (৳) <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="50"
                            required
                            value={formData.min_payout_amount}
                            onChange={e => setFormData({ ...formData, min_payout_amount: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Minimum accumulated balance required before an affiliate can request a withdrawal.</p>
                    </div>

                    <div className="flex flex-col justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="text-xs font-bold text-slate-900 dark:text-white">Require Course Purchase</label>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Only students who have purchased at least 1 course can apply to become affiliates.
                            </p>
                        </div>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.require_course_purchase}
                                onChange={e => setFormData({ ...formData, require_course_purchase: e.target.checked })}
                                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Yes, course purchase is mandatory</span>
                        </label>
                    </div>
                </div>

                {/* 6. Terms Notice */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Affiliate Terms & Instructions
                    </label>
                    <textarea
                        rows={3}
                        value={formData.terms_notice}
                        onChange={e => setFormData({ ...formData, terms_notice: e.target.value })}
                        placeholder="Enter instructions, guidelines, and terms for affiliates..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                    />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save Settings</span>
                    </button>
                </div>
            </form>
        </div>
    );
};
