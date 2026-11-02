import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { SmsSetting } from '../../types';
import { 
    MessageSquareText, 
    Key, 
    Save, 
    Send, 
    CheckCircle2, 
    AlertCircle, 
    ShieldCheck, 
    Clock, 
    RefreshCw,
    Sliders
} from 'lucide-react';

export const AdminSmsPage: React.FC = () => {
    const [settings, setSettings] = useState<SmsSetting | null>(null);
    const [apiToken, setApiToken] = useState('');
    const [senderId, setSenderId] = useState('');
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [otpEnabled, setOtpEnabled] = useState(false);
    const [otpExpiration, setOtpExpiration] = useState(5);
    const [otpCooldown, setOtpCooldown] = useState(60);

    const [testPhone, setTestPhone] = useState('');
    const [testResult, setTestResult] = useState<string | null>(null);
    const [sendingTest, setSendingTest] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await apiClient.get('/admin/sms-settings');
            setSettings(data);
            setSenderId(data.sender_id || '');
            setSmsEnabled(data.sms_enabled);
            setOtpEnabled(data.otp_enabled);
            setOtpExpiration(data.otp_expiration_minutes || 5);
            setOtpCooldown(data.otp_resend_cooldown_seconds || 60);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await apiClient.put('/admin/sms-settings', {
                api_token: apiToken || undefined,
                sender_id: senderId,
                sms_enabled: smsEnabled,
                otp_enabled: otpEnabled,
                otp_expiration_minutes: otpExpiration,
                otp_resend_cooldown_seconds: otpCooldown,
            });
            setSettings(prev => prev ? { ...prev, ...data.settings } : data.settings);
            setApiToken('');
            alert(data.message);
        } catch (err: any) {
            alert(err.response?.data?.message || 'সেটিংস সেভ করতে সমস্যা হয়েছে।');
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestSms = async () => {
        if (!testPhone) {
            alert('মোবাইল নম্বর লিখুন');
            return;
        }

        setSendingTest(true);
        setTestResult(null);
        try {
            const { data } = await apiClient.post('/admin/sms-settings/test', {
                phone: testPhone,
            });
            setTestResult(data.message);
            fetchSettings();
        } catch (err: any) {
            setTestResult(err.response?.data?.message || 'টেস্ট এসএমএস পাঠাতে ব্যর্থ হয়েছে।');
        } finally {
            setSendingTest(false);
        }
    };

    if (loading || !settings) {
        return <div className="p-12 text-center text-slate-400">এসএমএস সেটিংস লোড হচ্ছে...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            
            {/* Top Navigation Tabs: Configuration vs Marketing */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-2">
                <div className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 text-white shadow-sm flex items-center justify-center gap-2">
                    <Sliders className="w-4 h-4 text-white" />
                    <span>এসএমএস কনফিগারেশন (Configuration)</span>
                </div>
                <Link
                    to="/admin/sms-marketing"
                    className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-2 transition"
                >
                    <Send className="w-4 h-4 text-slate-500" />
                    <span>এসএমএস মার্কেটিং ও বাল্ক সেন্ডার (Marketing)</span>
                </Link>
            </div>

            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">GreenWeb এসএমএস গেটওয়ে কনফিগারেশন</h2>
                <p className="text-xs text-slate-500 mt-0.5">অফিসিয়াল গ্রিনওয়েব এসএমএস এপিআই ও রেজিস্ট্রেশন ওটিপি ভেরিফিকেশন ম্যানেজমেন্ট</p>
            </div>

            {/* Provider Notice */}
            <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-sky-600 text-white rounded-xl shrink-0 mt-0.5">
                    <MessageSquareText className="w-5 h-5" />
                </div>
                <div className="text-xs text-sky-900 space-y-1">
                    <h4 className="font-bold text-sm">প্রোভাইডার: GreenWeb Bangladesh (greenweb.com.bd)</h4>
                    <p className="text-sky-800/80 leading-relaxed">
                        লারাভেল ব্যাকএন্ডে অফিসিয়াল GreenWeb API আর্কিটেকচার যুক্ত করা হয়েছে। এপিআই টোকেন ডাটাবেজে এনক্রিপ্ট করে সুরক্ষিত রাখা হয় এবং ফ্রন্টএন্ডে কখনও উন্মুক্ত করা হয় না।
                    </p>
                </div>
            </div>

            {/* Settings Form */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <form onSubmit={handleSaveSettings} className="space-y-6">
                    {/* API Token */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            GreenWeb API Token (এপিআই টোকেন) *
                        </label>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={apiToken}
                                onChange={(e) => setApiToken(e.target.value)}
                                placeholder={settings.api_token_masked || 'আপনার GreenWeb API টোকেন লিখুন'}
                                className="w-full px-4 py-3 font-mono bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                            {settings.has_token && (
                                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    বর্তমান টোকেন সংরক্ষিত আছে: {settings.api_token_masked}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Sender ID */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            সেন্ডার আইডি / মাস্কিং নাম (ঐচ্ছিক)
                        </label>
                        <input
                            type="text"
                            value={senderId}
                            onChange={(e) => setSenderId(e.target.value)}
                            placeholder="যেমন: Novonex (অনুমোদিত হলে)"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                        {/* SMS Enabled */}
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={smsEnabled}
                                onChange={(e) => setSmsEnabled(e.target.checked)}
                                className="w-5 h-5 mt-0.5 text-sky-600 rounded border-slate-300"
                            />
                            <div>
                                <span className="block text-xs font-bold text-slate-800">এসএমএস গেটওয়ে সক্রিয় (SMS Enabled)</span>
                                <span className="text-[11px] text-slate-500">অন থাকলে গ্রাহকের নম্বরে মেসেজ পাঠানো হবে</span>
                            </div>
                        </label>

                        {/* OTP Verification Enabled */}
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={otpEnabled}
                                onChange={(e) => setOtpEnabled(e.target.checked)}
                                className="w-5 h-5 mt-0.5 text-sky-600 rounded border-slate-300"
                            />
                            <div>
                                <span className="block text-xs font-bold text-slate-800">মোবাইল নম্বর ওটিপি যাচাইকরণ (Strict Mobile OTP Verification)</span>
                                <span className="text-[11px] text-slate-500">অন থাকলে মোবাইল নম্বর ওটিপি দিয়ে ভেরিফাই ছাড়া অ্যাকাউন্ট খোলা যাবে না। যাচাই সফল হলে সরাসরি সক্রিয় অ্যাকাউন্ট তৈরি হবে, কোনো নিষ্ক্রিয় অ্যাকাউন্ট খোলা হবে না।</span>
                            </div>
                        </label>
                    </div>

                    {/* OTP Expiration & Cooldown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                ওটিপির মেয়াদ (Expiration Minutes)
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={60}
                                required
                                value={otpExpiration}
                                onChange={(e) => setOtpExpiration(parseInt(e.target.value, 10))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                পুনরায় ওটিপি চাওয়ার বিরতি (Resend Cooldown Seconds)
                            </label>
                            <input
                                type="number"
                                min={10}
                                max={300}
                                required
                                value={otpCooldown}
                                onChange={(e) => setOtpCooldown(parseInt(e.target.value, 10))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'কনফিগারেশন সংরক্ষণ করুন'}</span>
                    </button>
                </form>
            </div>

            {/* Test Connection / SMS Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">টেস্ট এসএমএস টেস্ট করুন</h3>
                <p className="text-xs text-slate-500">
                    আপনার মোবাইল নম্বর লিখে টেস্ট মেসেজ পাঠিয়ে GreenWeb গেটওয়ের সংযোগ পরীক্ষা করুন।
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="017xxxxxxxx"
                        className="w-full sm:max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                        onClick={handleSendTestSms}
                        disabled={sendingTest}
                        className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingTest ? 'পাঠানো হচ্ছে...' : 'টেস্ট মেসেজ পাঠান'}</span>
                    </button>
                </div>

                {testResult && (
                    <div className="p-3 rounded-xl bg-slate-100 text-slate-800 font-mono text-xs">
                        ফলাফল: {testResult}
                    </div>
                )}
            </div>

            {/* Recent SMS Delivery Logs */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">সাম্প্রতিক এসএমএস লগ (Delivery Audit Logs)</h3>
                    <button onClick={fetchSettings} className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>রিফ্রেশ</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="py-3 px-4 rounded-l-lg">মোবাইল</th>
                                <th className="py-3 px-4">মেসেজ</th>
                                <th className="py-3 px-4">স্ট্যাটাস</th>
                                <th className="py-3 px-4 rounded-r-lg">তারিখ ও সময়</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {settings.recent_logs && settings.recent_logs.length > 0 ? (
                                settings.recent_logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/60">
                                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.phone}</td>
                                        <td className="py-3 px-4 max-w-xs truncate">{log.message}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                log.status === 'sent' 
                                                    ? 'bg-emerald-100 text-emerald-800' 
                                                    : log.status === 'simulated'
                                                    ? 'bg-sky-100 text-sky-800'
                                                    : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-400">
                                            {new Date(log.created_at).toLocaleString('bn-BD')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center text-slate-400">কোনো লগ নেই।</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
