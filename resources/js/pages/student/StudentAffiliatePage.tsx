import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
    Award,
    DollarSign,
    Share2,
    Copy,
    Check,
    TrendingUp,
    CreditCard,
    ArrowUpRight,
    ExternalLink,
    Lock,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Loader2,
    MousePointerClick,
    Gift,
    HelpCircle,
    X,
    BookOpen,
    Send
} from 'lucide-react';

export const StudentAffiliatePage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [isEligible, setIsEligible] = useState(false);
    const [isAffiliate, setIsAffiliate] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [recentCommissions, setRecentCommissions] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);

    // Course Link Generator
    const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
    const [copiedBase, setCopiedBase] = useState(false);
    const [copiedCourseLink, setCopiedCourseLink] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    // Payout Request Modal
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [requestingPayout, setRequestingPayout] = useState(false);
    const [payoutForm, setPayoutForm] = useState({
        amount: '',
        payment_method: 'bkash',
        account_number: '',
    });

    // Payout Account Edit Modal
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [savingAccount, setSavingAccount] = useState(false);
    const [accountForm, setAccountForm] = useState({
        payout_method: 'bkash',
        payout_account: '',
    });

    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/affiliate/status');
            const data = res.data;
            setIsEligible(data.is_eligible);
            setIsAffiliate(data.is_affiliate);
            setProfile(data.profile);
            setSettings(data.settings);
            setCourses(data.courses || []);
            setRecentCommissions(data.recent_commissions || []);
            setPayouts(data.payouts || []);

            if (data.profile) {
                if (data.profile.payout_method) {
                    setPayoutForm((prev) => ({
                        ...prev,
                        payment_method: data.profile.payout_method,
                        account_number: data.profile.payout_account || '',
                    }));
                    setAccountForm({
                        payout_method: data.profile.payout_method,
                        payout_account: data.profile.payout_account || '',
                    });
                }
            }

            if (data.courses && data.courses.length > 0) {
                setSelectedCourseId(data.courses[0].id);
            }
        } catch (err) {
            console.error('Failed to load affiliate status', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        try {
            setApplying(true);
            const res = await apiClient.post('/affiliate/apply');
            setAlertMessage({ type: 'success', text: res.data.message || 'অভিনন্দন! আপনি সফলভাবে অ্যাফিলিয়েট পার্টনার হিসেবে যুক্ত হয়েছেন।' });
            fetchStatus();
        } catch (err: any) {
            setAlertMessage({ type: 'error', text: err.response?.data?.message || 'যুক্ত হতে সমস্যা হয়েছে।' });
        } finally {
            setApplying(false);
        }
    };

    const handleCopy = (text: string, type: 'base' | 'course' | 'code') => {
        navigator.clipboard.writeText(text);
        if (type === 'base') {
            setCopiedBase(true);
            setTimeout(() => setCopiedBase(false), 2000);
        } else if (type === 'course') {
            setCopiedCourseLink(true);
            setTimeout(() => setCopiedCourseLink(false), 2000);
        } else if (type === 'code') {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const handleUpdateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSavingAccount(true);
            const res = await apiClient.post('/affiliate/payout-account', accountForm);
            setAlertMessage({ type: 'success', text: res.data.message || 'উত্তোলন অ্যাকাউন্ট সংরক্ষিত হয়েছে।' });
            setAccountModalOpen(false);
            fetchStatus();
        } catch (err: any) {
            setAlertMessage({ type: 'error', text: err.response?.data?.message || 'সংরক্ষণ ব্যর্থ হয়েছে।' });
        } finally {
            setSavingAccount(false);
        }
    };

    const handleRequestPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setRequestingPayout(true);
            const res = await apiClient.post('/affiliate/payout-request', {
                amount: parseFloat(payoutForm.amount),
                payment_method: payoutForm.payment_method,
                account_number: payoutForm.account_number,
            });
            setAlertMessage({ type: 'success', text: res.data.message || 'উত্তোলন রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে।' });
            setPayoutModalOpen(false);
            setPayoutForm((prev) => ({ ...prev, amount: '' }));
            fetchStatus();
        } catch (err: any) {
            setAlertMessage({ type: 'error', text: err.response?.data?.message || 'রিকোয়েস্ট ব্যর্থ হয়েছে।' });
        } finally {
            setRequestingPayout(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-16 text-gray-500">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
                <p className="text-sm font-medium">অ্যাফিলিয়েট ড্যাশবোর্ড লোড হচ্ছে...</p>
            </div>
        );
    }

    const currentOrigin = window.location.origin;
    const baseReferralLink = profile ? `${currentOrigin}?ref=${profile.affiliate_code}` : '';

    const selectedCourse = courses.find((c) => c.id === Number(selectedCourseId));
    const courseReferralLink = profile && selectedCourse
        ? `${currentOrigin}/courses/${selectedCourse.slug}?ref=${profile.affiliate_code}`
        : '';

    // Calculate commission details for selected course
    const courseCustomSetting = selectedCourse?.affiliate_setting;
    const isCustom = courseCustomSetting && courseCustomSetting.is_active;
    const currentCommType = isCustom ? courseCustomSetting.commission_type : settings?.default_commission_type;
    const currentCommAmount = isCustom ? courseCustomSetting.commission_amount : settings?.default_commission_amount;
    const currentDiscType = isCustom ? courseCustomSetting.discount_type : settings?.default_discount_type;
    const currentDiscAmount = isCustom ? courseCustomSetting.discount_amount : settings?.default_discount_amount;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-7 w-7 text-indigo-600" />
                    অ্যাফিলিয়েট পার্টনার প্রোগ্রাম
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    মনোলগ এডু-র কোর্সগুলো আপনার বন্ধুদের সাথে শেয়ার করুন এবং প্রতিটি সফল ভর্তিতে আকর্ষণীয় কমিশন উপার্জন করুন!
                </p>
            </div>

            {/* Notification alert */}
            {alertMessage && (
                <div
                    className={`p-4 rounded-xl flex items-center justify-between transition-all ${
                        alertMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {alertMessage.type === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                        )}
                        <span className="font-medium text-sm">{alertMessage.text}</span>
                    </div>
                    <button onClick={() => setAlertMessage(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* CASE 1: NOT ELIGIBLE (No course purchased) */}
            {!isEligible && (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-2xl mx-auto shadow-sm space-y-6">
                    <div className="h-20 w-20 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                        <Lock className="h-10 w-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">অ্যাফিলিয়েট প্রোগ্রাম আনলক করুন</h2>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            মনোলগ এডুর গুণগত মান বজায় রাখতে শুধুমাত্র আমাদের নিয়মিত শিক্ষার্থীরাই অ্যাফিলিয়েট পার্টনার হতে পারেন।
                            আপনি যেকোনো একটি কোর্সে ভর্তি বা কেনার সাথে সাথেই এই প্রোগ্রামটি স্বয়ংক্রিয়ভাবে সক্রিয় হয়ে যাবে।
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100 space-y-3">
                        <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                            <Gift className="h-4 w-4 text-indigo-600" />
                            অ্যাফিলিয়েট হিসেবে আপনি যা পাচ্ছেন:
                        </div>
                        <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
                            <li>প্রতিটি কোর্স বিক্রয়ে আকর্ষণীয় কমিশন (১০% - ২০% বা সমমূল্যের টাকা)।</li>
                            <li>আপনার শেয়ার করা লিংকে ক্লিককারী {settings?.cookie_days || 30} দিনের মধ্যে কোর্স কিনলেই আপনি কমিশন পাবেন।</li>
                            <li>আপনার রেফারেল কোড ব্যবহার করলে আপনার বন্ধুরাও কোর্স ফিতে বিশেষ ছাড় পাবে।</li>
                            <li>বিকাশ, নগদ বা রকেটের মাধ্যমে সরাসরি টাকা উত্তোলনের সুবিধা।</li>
                        </ul>
                    </div>

                    <div>
                        <Link
                            to="/courses"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
                        >
                            <BookOpen className="h-5 w-5" />
                            কোর্সগুলো ব্রাউজ করুন ও ভর্তি হোন
                        </Link>
                    </div>
                </div>
            )}

            {/* CASE 2: ELIGIBLE BUT NOT REGISTERED AS AFFILIATE */}
            {isEligible && !isAffiliate && (
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-2xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            আপনি একজন যোগ্য পার্টনার!
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            মনোলগ এডু অ্যাফিলিয়েট প্রোগ্রামে যোগ দিন
                        </h2>
                        <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
                            আপনি ইতোমধ্যে আমাদের কোর্সের একজন শিক্ষার্থী। এখন আপনার বন্ধুদের রেফার করে ঘরে বসেই বাড়তি অর্থ উপার্জন করার সুযোগ।
                            এক ক্লিকে আপনার নিজস্ব রেফারেল কোড ও ট্র্যাকিং লিংক সংগ্রহ করুন।
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-xs">
                                <DollarSign className="h-5 w-5 text-emerald-400 mb-1" />
                                <div className="text-xs text-indigo-200">কমিশন রেট</div>
                                <div className="text-lg font-bold">
                                    {settings?.default_commission_type === 'percentage'
                                        ? `${settings?.default_commission_amount}% পর্যন্ত`
                                        : `৳${settings?.default_commission_amount} প্রতি বিক্রি`}
                                </div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-xs">
                                <MousePointerClick className="h-5 w-5 text-amber-400 mb-1" />
                                <div className="text-xs text-indigo-200">কুকি মেয়াদ</div>
                                <div className="text-lg font-bold">{settings?.cookie_days || 30} দিন ট্র্যাকিং</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-xs">
                                <CreditCard className="h-5 w-5 text-sky-400 mb-1" />
                                <div className="text-xs text-indigo-200">উত্তোলন</div>
                                <div className="text-lg font-bold">বিকাশ / নগদ</div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleApply}
                                disabled={applying}
                                className="px-8 py-3.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 text-base"
                            >
                                {applying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 text-amber-500" />}
                                এক ক্লিকে অ্যাফিলিয়েট হিসেবে যুক্ত হোন
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CASE 3: ACTIVE AFFILIATE DASHBOARD */}
            {isAffiliate && profile && (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between text-indigo-100">
                                <span className="text-xs font-semibold uppercase tracking-wider">উপলব্ধ ব্যালেন্স</span>
                                <DollarSign className="h-5 w-5 text-white/80" />
                            </div>
                            <p className="text-3xl font-black mt-2">৳{Number(profile.balance).toFixed(2)}</p>
                            <div className="mt-3 pt-3 border-t border-indigo-500/50 flex justify-between items-center">
                                <span className="text-xs text-indigo-200">মিনিমাম উত্তোলন: ৳{settings?.min_payout_amount || 500}</span>
                                <button
                                    onClick={() => setPayoutModalOpen(true)}
                                    disabled={Number(profile.balance) < Number(settings?.min_payout_amount || 500)}
                                    className="px-3 py-1 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                                >
                                    উত্তোলন করুন
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                            <div className="flex items-center justify-between text-gray-500">
                                <span className="text-xs font-semibold uppercase tracking-wider">মোট উপার্জন</span>
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mt-2">৳{Number(profile.total_earned).toFixed(2)}</p>
                            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                সফল কমিশন যুক্ত হয়েছে
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                            <div className="flex items-center justify-between text-gray-500">
                                <span className="text-xs font-semibold uppercase tracking-wider">মোট উত্তোলন সম্পন্ন</span>
                                <CreditCard className="h-5 w-5 text-indigo-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mt-2">৳{Number(profile.total_withdrawn).toFixed(2)}</p>
                            <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                                <span>অ্যাকাউন্ট: {profile.payout_method ? `${profile.payout_method.toUpperCase()} (${profile.payout_account})` : 'সেট করা নেই'}</span>
                                <button
                                    onClick={() => setAccountModalOpen(true)}
                                    className="text-indigo-600 hover:underline font-semibold"
                                >
                                    পরিবর্তন
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                            <div className="flex items-center justify-between text-gray-500">
                                <span className="text-xs font-semibold uppercase tracking-wider">লিংক ক্লিক সংখ্যা</span>
                                <MousePointerClick className="h-5 w-5 text-amber-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{profile.clicks_count || 0}</p>
                            <p className="text-xs text-gray-500 mt-2">
                                কুকি মেয়াদ: <strong className="text-gray-700">{settings?.cookie_days || 30} দিন</strong>
                            </p>
                        </div>
                    </div>

                    {/* Primary Referral Code & Link Box */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Share2 className="h-5 w-5 text-indigo-600" />
                                    আপনার জেনারেল রেফারেল লিংক ও কোড
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    এই লিংক বা কোডটি যেকোনো জায়গায় শেয়ার করুন। ভিজিটর এই লিংকে ক্লিক করে ওয়েবসাইট ব্রাউজ করে কোনো কোর্স কিনলেই আপনার কমিশন জমা হবে।
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">রেফারেল কোড:</span>
                                <div className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 font-mono font-bold text-sm flex items-center gap-1.5">
                                    <span>{profile.affiliate_code}</span>
                                    <button
                                        onClick={() => handleCopy(profile.affiliate_code, 'code')}
                                        className="text-indigo-500 hover:text-indigo-800"
                                        title="কোড কপি করুন"
                                    >
                                        {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* General Link Display */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                readOnly
                                value={baseReferralLink}
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-mono text-gray-700 select-all"
                            />
                            <button
                                onClick={() => handleCopy(baseReferralLink, 'base')}
                                className="shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                {copiedBase ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copiedBase ? 'কপি হয়েছে!' : 'লিংক কপি করুন'}
                            </button>
                        </div>

                        {/* Social Share Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-gray-500">সোশ্যাল মিডিয়ায় শেয়ার করুন:</span>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseReferralLink)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                            >
                                Facebook
                            </a>
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent('মনোলগ এডুর কোর্সে ভর্তি হতে আমার রেফারেল লিংক ব্যবহার করুন: ' + baseReferralLink)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
                            >
                                WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Course Specific Link Generator */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-indigo-600" />
                                নির্দিষ্ট কোর্সের অ্যাফিলিয়েট লিংক তৈরি করুন
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                নির্দিষ্ট কোনো একটি কোর্সের সরাসরি লিংক তৈরি করুন যাতে শিক্ষার্থীরা সরাসরি ওই কোর্সের বিস্তারিত পাতায় যায়।
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-gray-700 block mb-1">কোর্সটি সিলেক্ট করুন</label>
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                                >
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.title} (ফি: ৳{course.sale_price || course.price})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedCourse && (
                                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex flex-col justify-center">
                                    <span className="text-xs text-indigo-700 font-semibold">আপনার কমিশন:</span>
                                    <span className="text-base font-extrabold text-indigo-950">
                                        {currentCommType === 'percentage' ? `${currentCommAmount}%` : `৳${currentCommAmount}`}
                                    </span>
                                    {currentDiscAmount > 0 && (
                                        <span className="text-xs text-emerald-700 font-medium mt-0.5">
                                            ক্রেতা পাবে: {currentDiscType === 'percentage' ? `${currentDiscAmount}% ছাড়` : `৳${currentDiscAmount} ছাড়`}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {courseReferralLink && (
                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={courseReferralLink}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-mono text-gray-700 select-all"
                                />
                                <button
                                    onClick={() => handleCopy(courseReferralLink, 'course')}
                                    className="shrink-0 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    {copiedCourseLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {copiedCourseLink ? 'কপি হয়েছে!' : 'কোর্স লিংক কপি'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Tables Grid: Recent Commissions & Payouts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Commissions */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                                    সাম্প্রতিক কমিশনসমূহ
                                </h3>
                                <span className="text-xs text-gray-400">সর্বশেষ ১০টি</span>
                            </div>

                            {recentCommissions.length === 0 ? (
                                <div className="text-center py-10 px-4 text-gray-400">
                                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-xs">এখনও কোনো কমিশন অর্জিত হয়নি। আপনার লিংক শেয়ার করুন!</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-gray-600">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                                            <tr>
                                                <th className="px-4 py-3">কোর্স</th>
                                                <th className="px-4 py-3">অর্ডার #</th>
                                                <th className="px-4 py-3">কমিশন</th>
                                                <th className="px-4 py-3">স্ট্যাটাস</th>
                                                <th className="px-4 py-3 text-right">তারিখ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {recentCommissions.map((comm) => (
                                                <tr key={comm.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 font-medium text-gray-900 line-clamp-1">
                                                        {comm.course?.title || 'Course'}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-gray-500">
                                                        {comm.order?.order_number || `#${comm.order_id}`}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-emerald-600">
                                                        ৳{Number(comm.commission_amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex px-1.5 py-0.5 rounded-sm font-semibold ${
                                                                comm.status === 'approved'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-amber-50 text-amber-700'
                                                            }`}
                                                        >
                                                            {comm.status === 'approved' ? 'অনুমোদিত' : 'অপেক্ষমাণ'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-400">
                                                        {new Date(comm.created_at).toLocaleDateString('bn-BD', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Payout History */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-indigo-600" />
                                    উত্তোলন / পেআউট হিস্ট্রি
                                </h3>
                                <button
                                    onClick={() => setPayoutModalOpen(true)}
                                    disabled={Number(profile.balance) < Number(settings?.min_payout_amount || 500)}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                                >
                                    + নতুন উত্তোলন
                                </button>
                            </div>

                            {payouts.length === 0 ? (
                                <div className="text-center py-10 px-4 text-gray-400">
                                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-xs">এখনও কোনো উত্তোলনের হিস্ট্রি নেই।</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-gray-600">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                                            <tr>
                                                <th className="px-4 py-3">পরিমাণ</th>
                                                <th className="px-4 py-3">মেথড</th>
                                                <th className="px-4 py-3">অ্যাকাউন্ট</th>
                                                <th className="px-4 py-3">স্ট্যাটাস</th>
                                                <th className="px-4 py-3 text-right">তারিখ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {payouts.map((p) => (
                                                <tr key={p.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 font-bold text-gray-900">
                                                        ৳{Number(p.amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 uppercase font-semibold text-gray-700">
                                                        {p.payment_method}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-gray-600">
                                                        {p.account_number}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex px-1.5 py-0.5 rounded-sm font-semibold ${
                                                                p.status === 'approved'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : p.status === 'pending'
                                                                    ? 'bg-amber-50 text-amber-700'
                                                                    : 'bg-red-50 text-red-700'
                                                            }`}
                                                        >
                                                            {p.status === 'approved' ? 'পরিশোধিত' : p.status === 'pending' ? 'অপেক্ষমাণ' : 'বাতিল'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-400">
                                                        {new Date(p.created_at).toLocaleDateString('bn-BD', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Request Payout */}
            {payoutModalOpen && profile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                        <button
                            onClick={() => setPayoutModalOpen(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-indigo-600" />
                                টাকা উত্তোলন রিকোয়েস্ট
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                আপনার উপার্জিত কমিশন সরাসরি বিকাশ, নগদ বা রকেটে নিন।
                            </p>
                        </div>

                        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 mb-4 text-xs space-y-1">
                            <div className="flex justify-between text-gray-700">
                                <span>উপলব্ধ ব্যালেন্স:</span>
                                <strong className="text-indigo-900 text-sm">৳{Number(profile.balance).toFixed(2)}</strong>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>সর্বনিম্ন উত্তোলনের পরিমাণ:</span>
                                <span>৳{settings?.min_payout_amount || 500}</span>
                            </div>
                        </div>

                        <form onSubmit={handleRequestPayout} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-1">
                                    উত্তোলনের পরিমাণ (টাকা)
                                </label>
                                <input
                                    type="number"
                                    min={settings?.min_payout_amount || 500}
                                    max={profile.balance}
                                    step="1"
                                    value={payoutForm.amount}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                                    placeholder={`৳${settings?.min_payout_amount || 500} - ৳${profile.balance}`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-1">পেমেন্ট মেথড</label>
                                <select
                                    value={payoutForm.payment_method}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, payment_method: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                                >
                                    <option value="bkash">বিকাশ (bKash Personal)</option>
                                    <option value="nagad">নগদ (Nagad Personal)</option>
                                    <option value="rocket">রকেট (Rocket Personal)</option>
                                    <option value="bank">ব্যাংক একাউন্ট (Bank Account)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-1">
                                    অ্যাকাউন্ট / মোবাইল নম্বর
                                </label>
                                <input
                                    type="text"
                                    value={payoutForm.account_number}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                                    placeholder="যেমন: 017XXXXXXXX"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPayoutModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    disabled={requestingPayout}
                                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                    {requestingPayout && <Loader2 className="h-4 w-4 animate-spin" />}
                                    রিকোয়েস্ট পাঠান
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Update Payout Account */}
            {accountModalOpen && profile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                        <button
                            onClick={() => setAccountModalOpen(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-indigo-600" />
                                ডিফল্ট পেআউট অ্যাকাউন্ট
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                আপনার নিয়মিত টাকা গ্রহণের নম্বর সংরক্ষণ করে রাখুন।
                            </p>
                        </div>

                        <form onSubmit={handleUpdateAccount} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-1">পেমেন্ট মেথড</label>
                                <select
                                    value={accountForm.payout_method}
                                    onChange={(e) => setAccountForm({ ...accountForm, payout_method: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                                >
                                    <option value="bkash">বিকাশ (bKash Personal)</option>
                                    <option value="nagad">নগদ (Nagad Personal)</option>
                                    <option value="rocket">রকেট (Rocket Personal)</option>
                                    <option value="bank">ব্যাংক একাউন্ট (Bank Account)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-1">
                                    অ্যাকাউন্ট / মোবাইল নম্বর
                                </label>
                                <input
                                    type="text"
                                    value={accountForm.payout_account}
                                    onChange={(e) => setAccountForm({ ...accountForm, payout_account: e.target.value })}
                                    placeholder="যেমন: 017XXXXXXXX"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAccountModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingAccount}
                                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                    {savingAccount && <Loader2 className="h-4 w-4 animate-spin" />}
                                    সংরক্ষণ করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
