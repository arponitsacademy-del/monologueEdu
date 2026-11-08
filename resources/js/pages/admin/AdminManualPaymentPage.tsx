import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { ManualPaymentSettings, ManualPaymentGatewayConfig, ManualPaymentType } from '../../types';
import {
    CreditCard,
    Save,
    CheckCircle2,
    AlertCircle,
    Copy,
    Check,
    RotateCcw,
    Smartphone,
    ArrowRight,
    Eye,
    ShieldCheck,
    CheckCircle,
    XCircle
} from 'lucide-react';

type GatewayKey = 'bkash' | 'nagad' | 'rocket';

interface GatewayMeta {
    key: GatewayKey;
    title: string;
    titleEn: string;
    brandColor: string;
    brandBg: string;
    borderColor: string;
    activeBorder: string;
    textColor: string;
    badgeBg: string;
    badgeText: string;
}

const GATEWAYS: GatewayMeta[] = [
    {
        key: 'bkash',
        title: 'bKash',
        titleEn: 'bKash',
        brandColor: '#e2136e',
        brandBg: 'bg-pink-500/10 dark:bg-pink-500/20',
        borderColor: 'border-pink-200 dark:border-pink-900/50',
        activeBorder: 'border-pink-500',
        textColor: 'text-pink-600 dark:text-pink-400',
        badgeBg: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
        badgeText: 'text-pink-700 dark:text-pink-300',
    },
    {
        key: 'nagad',
        title: 'Nagad',
        titleEn: 'Nagad',
        brandColor: '#f7941d',
        brandBg: 'bg-orange-500/10 dark:bg-orange-500/20',
        borderColor: 'border-orange-200 dark:border-orange-900/50',
        activeBorder: 'border-orange-500',
        textColor: 'text-orange-600 dark:text-orange-400',
        badgeBg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        badgeText: 'text-orange-700 dark:text-orange-300',
    },
    {
        key: 'rocket',
        title: 'Rocket',
        titleEn: 'Rocket',
        brandColor: '#8c3494',
        brandBg: 'bg-purple-500/10 dark:bg-purple-500/20',
        borderColor: 'border-purple-200 dark:border-purple-900/50',
        activeBorder: 'border-purple-500',
        textColor: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        badgeText: 'text-purple-700 dark:text-purple-300',
    },
];

const DEFAULT_SETTINGS: ManualPaymentSettings = {
    bkash: {
        enabled: true,
        name: 'bKash',
        account_number: '01700000000',
        type: 'send_money',
        instructions: 'Open your bKash app or dial *247# to Send Money to the recipient number. Enter the TrxID below after payment.',
        instructions_en: 'Open your bKash app or dial *247# to Send Money to the recipient number. Enter the TrxID below after payment.',
    },
    nagad: {
        enabled: true,
        name: 'Nagad',
        account_number: '01700000000',
        type: 'send_money',
        instructions: 'Open your Nagad app or dial *167# to Send Money to the recipient number. Enter the TrxID below after payment.',
        instructions_en: 'Open your Nagad app or dial *167# to Send Money to the recipient number. Enter the TrxID below after payment.',
    },
    rocket: {
        enabled: true,
        name: 'Rocket',
        account_number: '01700000000',
        type: 'send_money',
        instructions: 'Open your Rocket app or dial *322# to Send Money to the recipient number. Enter the TrxID below after payment.',
        instructions_en: 'Open your Rocket app or dial *322# to Send Money to the recipient number. Enter the TrxID below after payment.',
    },
};

export const AdminManualPaymentPage: React.FC = () => {
    const { language } = useLanguage();
    const { refreshSettings, updateSettingsLocally } = useSettings();

    const [activeTab, setActiveTab] = useState<GatewayKey>('bkash');
    const [configs, setConfigs] = useState<ManualPaymentSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copiedPreview, setCopiedPreview] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await apiClient.get('/settings');
            if (data.manual_payment_settings) {
                setConfigs({
                    bkash: { ...DEFAULT_SETTINGS.bkash, ...(data.manual_payment_settings.bkash || {}) },
                    nagad: { ...DEFAULT_SETTINGS.nagad, ...(data.manual_payment_settings.nagad || {}) },
                    rocket: { ...DEFAULT_SETTINGS.rocket, ...(data.manual_payment_settings.rocket || {}) },
                });
            }
        } catch (err) {
            console.error('Failed to load manual payment settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateConfig = (gateway: GatewayKey, updates: Partial<ManualPaymentGatewayConfig>) => {
        setConfigs(prev => ({
            ...prev,
            [gateway]: {
                ...prev[gateway],
                ...updates,
            },
        }));
    };

    const handleResetGatewayToDefault = (gateway: GatewayKey) => {
        if (!window.confirm(`Reset ${gateway} settings to default template?`)) {
            return;
        }
        setConfigs(prev => ({
            ...prev,
            [gateway]: { ...DEFAULT_SETTINGS[gateway] },
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            const payload = {
                manual_payment_settings: configs,
            };

            const { data } = await apiClient.put('/admin/website-settings/manual-payment', payload);
            updateSettingsLocally(payload);
            await refreshSettings();

            setSuccessMessage(data.message || 'Manual payment settings saved successfully!');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const activeConfig = configs[activeTab];
    const currentMeta = GATEWAYS.find(g => g.key === activeTab)!;

    const getTypeLabel = (type: ManualPaymentType) => {
        switch (type) {
            case 'send_money':
                return 'Send Money (Personal)';
            case 'payment':
                return 'Payment (Merchant)';
            case 'cash_out':
                return 'Cash Out (Agent)';
            default:
                return type;
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 font-semibold">
                Loading manual payment settings...
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Manual Payment Settings
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                        Configure bKash, Nagad, and Rocket account numbers, transaction types (Send Money, Payment, Cash Out), and student instructions shown during course checkout.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-sky-600/25 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
                </button>
            </div>

            {/* Notifications */}
            {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2.5 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold">{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2.5 shadow-xs">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="font-semibold">{errorMessage}</span>
                </div>
            )}

            {/* Overview / Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {GATEWAYS.map(gw => {
                    const cfg = configs[gw.key];
                    const isTabActive = activeTab === gw.key;
                    return (
                        <div
                            key={gw.key}
                            onClick={() => setActiveTab(gw.key)}
                            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-900 relative overflow-hidden ${
                                isTabActive
                                    ? `${gw.activeBorder} shadow-md`
                                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="font-black text-lg text-slate-900 dark:text-white">
                                        {gw.titleEn}
                                    </span>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${gw.badgeBg}`}>
                                        {gw.title}
                                    </span>
                                </div>
                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                    cfg.enabled
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                    {cfg.enabled ? (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            <span>Active</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-3.5 h-3.5" />
                                            <span>Disabled</span>
                                        </>
                                    )}
                                </span>
                            </div>

                            <div className="space-y-1 text-xs">
                                <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                    <span>Number:</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                                        {cfg.account_number || '---'}
                                    </span>
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                    <span>Type:</span>
                                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                                        {getTypeLabel(cfg.type)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Gateway Configuration & Live Preview Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Controls Column */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl ${currentMeta.brandBg} flex items-center justify-center font-black text-xl ${currentMeta.textColor}`}>
                                {currentMeta.titleEn.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    {currentMeta.titleEn} Configuration
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Set up gateway details and transaction rules
                                </p>
                            </div>
                        </div>

                        {/* Reset Gateway Button */}
                        <button
                            type="button"
                            onClick={() => handleResetGatewayToDefault(activeTab)}
                            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-xs font-semibold flex items-center gap-1"
                            title="Reset to Default Template"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Reset</span>
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Status Toggle Switch */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                            <div>
                                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Enable this Gateway in Checkout</span>
                                </label>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    When disabled, students will not see this payment option during checkout.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleUpdateConfig(activeTab, { enabled: !activeConfig.enabled })}
                                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                    activeConfig.enabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        activeConfig.enabled ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Account Number Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                {currentMeta.titleEn} Account / Recipient Number
                                <span className="text-rose-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={activeConfig.account_number}
                                    onChange={(e) => handleUpdateConfig(activeTab, { account_number: e.target.value })}
                                    placeholder="017xxxxxxxx"
                                    className="w-full pl-11 pr-4 py-3 font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900"
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                                Students will send money/make payment to this specific phone number.
                            </p>
                        </div>

                        {/* Transaction Type Radio Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                                Transaction / Account Type
                                <span className="text-rose-500 ml-1">*</span>
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    {
                                        type: 'send_money' as ManualPaymentType,
                                        label: 'Send Money',
                                        sub: 'Personal Number',
                                        icon: '💸'
                                    },
                                    {
                                        type: 'payment' as ManualPaymentType,
                                        label: 'Payment',
                                        sub: 'Merchant Account',
                                        icon: '💳'
                                    },
                                    {
                                        type: 'cash_out' as ManualPaymentType,
                                        label: 'Cash Out',
                                        sub: 'Agent Number',
                                        icon: '🏧'
                                    },
                                ].map((option) => {
                                    const isSelected = activeConfig.type === option.type;
                                    return (
                                        <button
                                            key={option.type}
                                            type="button"
                                            onClick={() => handleUpdateConfig(activeTab, { type: option.type })}
                                            className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                                                isSelected
                                                    ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 shadow-xs'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xl">{option.icon}</span>
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                    isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-300 dark:border-slate-600'
                                                }`}>
                                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </div>
                                            </div>
                                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                                                {option.label}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                {option.sub}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step-by-step Instructions */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                Step-by-step Instructions
                            </label>
                            <textarea
                                rows={3}
                                value={activeConfig.instructions || ''}
                                onChange={(e) => handleUpdateConfig(activeTab, { instructions: e.target.value, instructions_en: e.target.value })}
                                placeholder="e.g. Open your bKash app and select Send Money to the account number..."
                                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 leading-relaxed"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                <Save className="w-4 h-4" />
                                <span>{saving ? 'Saving changes...' : 'Save Settings'}</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Live Checkout Simulator / Preview Column */}
                <div className="lg:col-span-5 space-y-4 sticky top-28">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-sky-500" />
                            Student Checkout Live Simulator
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            Real-time Preview
                        </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                Payment Method Preview
                            </h4>
                            <span className="text-[11px] text-slate-400">Checkout.tsx</span>
                        </div>

                        {/* Payment Selector Simulator */}
                        <div className="grid grid-cols-3 gap-2">
                            {GATEWAYS.map(gw => {
                                const cfg = configs[gw.key];
                                const isSelected = activeTab === gw.key;
                                return (
                                    <div
                                        key={gw.key}
                                        onClick={() => setActiveTab(gw.key)}
                                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                                            isSelected
                                                ? `${gw.activeBorder} ${gw.brandBg} shadow-xs`
                                                : 'border-slate-200 dark:border-slate-800 opacity-60'
                                        }`}
                                    >
                                        <span className={`block font-black text-sm ${gw.textColor}`}>{gw.titleEn}</span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block truncate">
                                            {cfg.type === 'payment' 
                                                ? 'Payment'
                                                : cfg.type === 'cash_out' 
                                                    ? 'Cash Out'
                                                    : 'Send Money'
                                            }
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Instructional Box Simulator */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                <span>
                                    Payment Instructions ({currentMeta.titleEn}):
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(activeConfig.account_number);
                                        setCopiedPreview(true);
                                        setTimeout(() => setCopiedPreview(false), 2000);
                                    }}
                                    className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                                >
                                    {copiedPreview ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedPreview ? 'Copied' : 'Copy Number'}</span>
                                </button>
                            </div>

                            <p className="leading-relaxed">
                                {activeConfig.instructions || activeConfig.instructions_en || `1. Open your ${currentMeta.titleEn} app and select ${activeConfig.type === 'payment' ? 'Payment' : activeConfig.type === 'cash_out' ? 'Cash Out' : 'Send Money'}.`}
                            </p>

                            <div className="pt-1 flex items-center gap-2">
                                <span className="text-slate-500 dark:text-slate-400">
                                    Recipient Number:
                                </span>
                                <strong className="font-mono text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                                    {activeConfig.account_number || '017xxxxxxxx'}
                                </strong>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    ({activeConfig.type === 'payment' ? 'Merchant' : activeConfig.type === 'cash_out' ? 'Agent' : 'Personal'})
                                </span>
                            </div>

                            <p className="pt-1 text-slate-500 dark:text-slate-400 text-[11px]">
                                Enter the TrxID below after successful transfer.
                            </p>
                        </div>

                        {/* Dummy Input Simulator */}
                        <div className="space-y-3 opacity-75 pointer-events-none select-none">
                            <div>
                                <div className="text-[11px] font-bold text-slate-500 mb-1">Sender Mobile Number</div>
                                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 flex items-center text-xs text-slate-400">
                                    017xxxxxxxx
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold text-slate-500 mb-1">Transaction ID (TrxID)</div>
                                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 flex items-center text-xs text-slate-400 font-mono">
                                    9J3K8LQZ
                                </div>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                                Note: This preview dynamically mirrors what students see on the checkout page when this payment method is chosen.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};