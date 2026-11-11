import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ShurjopaySettings } from '../../types';
import {
    CreditCard,
    Save,
    CheckCircle2,
    AlertCircle,
    Copy,
    Check,
    RotateCcw,
    ShieldCheck,
    Zap,
    ExternalLink,
    Eye,
    EyeOff,
    Activity,
    Info,
    RefreshCw,
    Lock
} from 'lucide-react';

const DEFAULT_SHURJOPAY: ShurjopaySettings = {
    enabled: true,
    environment: 'live',
    live_api_url: 'https://engine.shurjopayment.com',
    live_username: 'Monologue Edu',
    live_password: 'FMN4G@wK*!5p',
    live_prefix: 'MLE',
    sandbox_api_url: 'https://sandbox.shurjopayment.com',
    sandbox_username: 'sp_sandbox',
    sandbox_password: 'pyyk97hu&6u6',
    sandbox_prefix: 'sp',
    display_name: 'অনলাইন পেমেন্ট (বিকাশ, নগদ, রকেট, কার্ড)',
    description: 'shurjoPay এর মাধ্যমে বিকাশ, নগদ, রকেট, উপায়, ভিসা, মাস্টারকার্ড বা ইন্টারনেট ব্যাংকিং দিয়ে সাথে সাথে স্বয়ংক্রিয়ভাবে পেমেন্ট সম্পন্ন করুন।',
};

export const AdminShurjopayPage: React.FC = () => {
    const { language } = useLanguage();
    const isBn = language === 'bn';

    const [settings, setSettings] = useState<ShurjopaySettings>(DEFAULT_SHURJOPAY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
        store_id?: number | string;
        environment?: string;
    } | null>(null);

    const [showLivePassword, setShowLivePassword] = useState(false);
    const [showSandboxPassword, setShowSandboxPassword] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/admin/payments/shurjopay');
            if (data && typeof data === 'object') {
                setSettings({ ...DEFAULT_SHURJOPAY, ...data });
            }
        } catch (err: any) {
            console.error('Failed to load shurjoPay settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            const { data } = await apiClient.put('/admin/payments/shurjopay', settings);
            if (data.settings) {
                setSettings(prev => ({ ...prev, ...data.settings }));
            }
            setSuccessMessage(isBn ? 'shurjoPay সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!' : 'shurjoPay settings saved successfully!');
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || (isBn ? 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save settings.'));
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        setErrorMessage(null);

        try {
            const { data } = await apiClient.post('/admin/payments/shurjopay/test-connection', settings);
            setTestResult(data);
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'Connection test failed. Please verify credentials.',
            });
        } finally {
            setTesting(false);
        }
    };

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
    };

    const origin = window.location.origin;
    const callbackUrl = `${origin}/api/payment/shurjopay/callback`;
    const cancelUrl = `${origin}/api/payment/shurjopay/cancel`;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
                    <p className="text-sm font-semibold text-slate-500">
                        {isBn ? 'shurjoPay কনফিগারেশন লোড হচ্ছে...' : 'Loading shurjoPay configuration...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {isBn ? 'shurjoPay গেটওয়ে ইন্টিগ্রেশন' : 'shurjoPay Gateway Integration'}
                                </h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    settings.enabled
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                    {settings.enabled ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Disabled')}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    settings.environment === 'live'
                                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}>
                                    {settings.environment === 'live' ? 'Live Production' : 'Sandbox (Test)'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {isBn 
                                    ? 'বিকাশ, নগদ, রকেট, কার্ড এবং ইন্টারনেট ব্যাংকিংয়ের মাধ্যমে স্বয়ংক্রিয় পেমেন্ট ও এনরোলমেন্ট কনফিগার করুন।'
                                    : 'Configure dynamic shurjoPay online checkout with automatic payment verification and course enrollment.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testing || saving}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs disabled:opacity-60 cursor-pointer"
                    >
                        {testing ? <RefreshCw className="w-4 h-4 animate-spin text-sky-500" /> : <Activity className="w-4 h-4 text-emerald-500" />}
                        <span>{testing ? (isBn ? 'পরীক্ষা করা হচ্ছে...' : 'Testing...') : (isBn ? 'কানেকশন টেস্ট করুন' : 'Test Connection')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm shadow-sky-600/30 disabled:opacity-60 cursor-pointer"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'সেটিংস সংরক্ষণ করুন' : 'Save Changes')}</span>
                    </button>
                </div>
            </div>

            {/* Success / Error Alerts */}
            {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Test Result Banner */}
            {testResult && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-fadeIn ${
                    testResult.success
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                }`}>
                    {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                        <div className="font-bold text-sm">
                            {testResult.success ? 'shurjoPay Connection Successful!' : 'Connection Failed!'}
                        </div>
                        <p>{testResult.message}</p>
                        {testResult.store_id && (
                            <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 font-mono text-[11px] font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                                Store ID: {testResult.store_id}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Section 1: Activation & Environment */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-100 dark:border-slate-800">
                    <Zap className="w-5 h-5 text-sky-500" />
                    <span>{isBn ? 'গেটওয়ে স্ট্যাটাস ও মোড নির্বাচন' : 'Gateway Status & Mode'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Enable Toggle */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                        <div>
                            <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                                {isBn ? 'shurjoPay অনলাইন পেমেন্ট চালু রাখুন' : 'Enable shurjoPay Checkout'}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {isBn ? 'সক্রিয় থাকলে চেকআউটে অনলাইন পেমেন্ট অপশনটি প্রদর্শিত হবে' : 'Allow students to pay via bKash, Nagad, Cards at checkout'}
                            </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    {/* Environment Selector */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                        <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                            {isBn ? 'সক্রিয় পরিবেশ (Environment)' : 'Active Environment'}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, environment: 'live' })}
                                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                                    settings.environment === 'live'
                                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>Live (Production)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, environment: 'sandbox' })}
                                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                                    settings.environment === 'sandbox'
                                        ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <Activity className="w-4 h-4" />
                                <span>Sandbox (Test)</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Display Name & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            {isBn ? 'চেকআউটে প্রদর্শন নাম (Display Name)' : 'Display Name on Checkout'}
                        </label>
                        <input
                            type="text"
                            value={settings.display_name || ''}
                            onChange={(e) => setSettings({ ...settings, display_name: e.target.value })}
                            placeholder="অনলাইন পেমেন্ট (বিকাশ, নগদ, রকেট, কার্ড)"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            {isBn ? 'নির্দেশনা / সাবটাইটেল (Description)' : 'Customer Description'}
                        </label>
                        <input
                            type="text"
                            value={settings.description || ''}
                            onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                            placeholder="বিকাশ, নগদ, রকেট বা কার্ডের মাধ্যমে পেমেন্ট সম্পন্ন করুন"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Live Credentials */}
            <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border shadow-xs space-y-5 transition-all ${
                settings.environment === 'live'
                    ? 'border-sky-300 dark:border-sky-800/80 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 opacity-90'
            }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-base">
                                    {isBn ? 'লাইভ ক্রিডেনশিয়ালস (Live Production API)' : 'Live Credentials (Production API)'}
                                </span>
                                {settings.environment === 'live' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 uppercase">
                                        Currently Active
                                    </span>
                                )}
                            </div>
                            <span className="text-[11px] text-slate-500">
                                {isBn ? 'প্রোডাকশন পেমেন্ট গ্রহণের জন্য আপনার লাইভ একাউন্টের তথ্য' : 'Real payments and settlements processed with these credentials'}
                            </span>
                        </div>
                    </div>

                    <a
                        href="https://admin.shurjopayment.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                    >
                        <span>shurjoPay Merchant Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Live API URL
                        </label>
                        <input
                            type="text"
                            value={settings.live_api_url}
                            onChange={(e) => setSettings({ ...settings, live_api_url: e.target.value })}
                            placeholder="https://engine.shurjopayment.com"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Live API Order Prefix
                        </label>
                        <input
                            type="text"
                            value={settings.live_prefix}
                            onChange={(e) => setSettings({ ...settings, live_prefix: e.target.value })}
                            placeholder="MLE"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Live API Username
                        </label>
                        <input
                            type="text"
                            value={settings.live_username}
                            onChange={(e) => setSettings({ ...settings, live_username: e.target.value })}
                            placeholder="Monologue Edu"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Live API Password
                        </label>
                        <div className="relative">
                            <input
                                type={showLivePassword ? 'text' : 'password'}
                                value={settings.live_password || ''}
                                onChange={(e) => setSettings({ ...settings, live_password: e.target.value })}
                                placeholder="••••••••••••"
                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                            />
                            <button
                                type="button"
                                onClick={() => setShowLivePassword(!showLivePassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                                {showLivePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Sandbox Credentials */}
            <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border shadow-xs space-y-5 transition-all ${
                settings.environment === 'sandbox'
                    ? 'border-amber-300 dark:border-amber-800/80 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 opacity-90'
            }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Activity className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-base">
                                    {isBn ? 'স্যান্ডবক্স ক্রিডেনশিয়ালস (Sandbox Test API)' : 'Sandbox Credentials (Test Mode API)'}
                                </span>
                                {settings.environment === 'sandbox' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 uppercase">
                                        Currently Active
                                    </span>
                                )}
                            </div>
                            <span className="text-[11px] text-slate-500">
                                {isBn ? 'টেস্টিং করার জন্য স্যান্ডবক্স পরিবেশের তথ্য' : 'Use this environment for development and dummy transactions'}
                            </span>
                        </div>
                    </div>

                    <a
                        href="https://sandbox.admin.shurjopayment.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                    >
                        <span>Sandbox Merchant Panel</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Sandbox API URL
                        </label>
                        <input
                            type="text"
                            value={settings.sandbox_api_url}
                            onChange={(e) => setSettings({ ...settings, sandbox_api_url: e.target.value })}
                            placeholder="https://sandbox.shurjopayment.com"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Sandbox API Order Prefix
                        </label>
                        <input
                            type="text"
                            value={settings.sandbox_prefix}
                            onChange={(e) => setSettings({ ...settings, sandbox_prefix: e.target.value })}
                            placeholder="sp"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Sandbox API Username
                        </label>
                        <input
                            type="text"
                            value={settings.sandbox_username}
                            onChange={(e) => setSettings({ ...settings, sandbox_username: e.target.value })}
                            placeholder="sp_sandbox"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Sandbox API Password
                        </label>
                        <div className="relative">
                            <input
                                type={showSandboxPassword ? 'text' : 'password'}
                                value={settings.sandbox_password || ''}
                                onChange={(e) => setSettings({ ...settings, sandbox_password: e.target.value })}
                                placeholder="••••••••••••"
                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSandboxPassword(!showSandboxPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                                {showSandboxPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4: Webhook & Integration URLs */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-100 dark:border-slate-800">
                    <Info className="w-5 h-5 text-indigo-500" />
                    <span>{isBn ? 'রিটার্ন / কলব্যাক ইউআরএল তথ্য' : 'System Return & Callback URLs'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Return / Callback URL (Success / Fail Verification):
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy(callbackUrl, 'cb')}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                            >
                                {copiedKey === 'cb' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedKey === 'cb' ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>
                        <p className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                            {callbackUrl}
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Cancel URL (Payment Cancelled):
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy(cancelUrl, 'cancel')}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                            >
                                {copiedKey === 'cancel' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedKey === 'cancel' ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>
                        <p className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                            {cancelUrl}
                        </p>
                    </div>
                </div>

                {/* Support & Contact Reference */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200">
                    <div className="space-y-0.5">
                        <span className="font-bold block">shurjoPay 24/7 Merchant Support</span>
                        <span>Hotline: +88 01885 022 022 | Email: shurjopay@shurjomukhi.com.bd</span>
                    </div>
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                        Point of Contact: Rahmatan Tasnim (rahmatan@shurjomukhi.com.bd)
                    </div>
                </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing || saving}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs disabled:opacity-60 cursor-pointer"
                >
                    {testing ? <RefreshCw className="w-4 h-4 animate-spin text-sky-500" /> : <Activity className="w-4 h-4 text-emerald-500" />}
                    <span>{testing ? (isBn ? 'পরীক্ষা করা হচ্ছে...' : 'Testing...') : (isBn ? 'কানেকশন টেস্ট করুন' : 'Test Connection')}</span>
                </button>
                <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold transition shadow-md shadow-sky-600/30 disabled:opacity-60 cursor-pointer"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving Changes...') : (isBn ? 'সেটিংস সংরক্ষণ করুন' : 'Save Changes')}</span>
                </button>
            </div>
        </div>
    );
};
