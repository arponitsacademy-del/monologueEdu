import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { apiClient, formatBDT } from '../../api/client';
import { Course, ManualPaymentSettings, ManualPaymentType } from '../../types';
import { 
    CreditCard, 
    ShieldCheck, 
    AlertCircle, 
    ArrowRight, 
    BookOpen, 
    CheckCircle2,
    Copy,
    Check,
    Sparkles,
    Bot,
    Tag,
    X,
    Loader2
} from 'lucide-react';
import { getStoredReferralCode, setStoredReferralCode, clearStoredReferralCode } from '../../utils/referralTracker';

const DEFAULT_MANUAL_SETTINGS: ManualPaymentSettings = {
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

export const CheckoutPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { language } = useLanguage();
    const { settings } = useSettings();

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [includeNexPilot, setIncludeNexPilot] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'manual_bkash' | 'manual_nagad' | 'manual_rocket'>('manual_bkash');
    const [transactionRef, setTransactionRef] = useState('');
    const [senderPhone, setSenderPhone] = useState(user?.phone || '');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Referral / Affiliate state
    const [referralInput, setReferralInput] = useState('');
    const [appliedReferral, setAppliedReferral] = useState<{
        code: string;
        discount_amount: number;
        discount_rate: number;
        discount_type: string;
        message: string;
    } | null>(null);
    const [checkingReferral, setCheckingReferral] = useState(false);
    const [referralMessage, setReferralMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Merge settings from context or fallback to defaults
    const manualSettings: ManualPaymentSettings = {
        bkash: { ...DEFAULT_MANUAL_SETTINGS.bkash, ...(settings?.manual_payment_settings?.bkash || {}) },
        nagad: { ...DEFAULT_MANUAL_SETTINGS.nagad, ...(settings?.manual_payment_settings?.nagad || {}) },
        rocket: { ...DEFAULT_MANUAL_SETTINGS.rocket, ...(settings?.manual_payment_settings?.rocket || {}) },
    };

    const availableGateways = [
        {
            id: 'manual_bkash' as const,
            key: 'bkash' as const,
            config: manualSettings.bkash,
            colorClass: 'border-pink-500 bg-pink-50/50 text-pink-600',
            inactiveClass: 'hover:border-pink-300',
            textColor: 'text-pink-600',
            title: 'bKash',
        },
        {
            id: 'manual_nagad' as const,
            key: 'nagad' as const,
            config: manualSettings.nagad,
            colorClass: 'border-orange-500 bg-orange-50/50 text-orange-600',
            inactiveClass: 'hover:border-orange-300',
            textColor: 'text-orange-600',
            title: 'Nagad',
        },
        {
            id: 'manual_rocket' as const,
            key: 'rocket' as const,
            config: manualSettings.rocket,
            colorClass: 'border-purple-500 bg-purple-50/50 text-purple-600',
            inactiveClass: 'hover:border-purple-300',
            textColor: 'text-purple-600',
            title: 'Rocket',
        },
    ].filter(gw => gw.config?.enabled !== false);

    // Automatically select the first enabled gateway if current selection is disabled
    useEffect(() => {
        if (availableGateways.length > 0 && !availableGateways.some(gw => gw.id === paymentMethod)) {
            setPaymentMethod(availableGateways[0].id);
        }
    }, [availableGateways, paymentMethod]);

    useEffect(() => {
        if (!user) {
            navigate(`/login?redirect=/checkout/${slug}`);
            return;
        }

        const fetchCourse = async () => {
            try {
                const { data } = await apiClient.get(`/courses/${slug}`);
                if (data.is_enrolled) {
                    navigate('/student/my-courses');
                    return;
                }
                setCourse(data.course);
            } catch {
                navigate('/courses');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [slug, user]);

    const activeGateway = availableGateways.find(gw => gw.id === paymentMethod) || availableGateways[0];
    const currentNumber = activeGateway?.config?.account_number || '01700000000';
    const currentType: ManualPaymentType = activeGateway?.config?.type || 'send_money';

    const nexpilot = course?.nexpilot;
    const hasActivePilot = Boolean(nexpilot && (nexpilot.is_active === true || nexpilot.is_active === 1 || nexpilot.is_active === '1'));
    const pilotPrice = hasActivePilot && includeNexPilot ? Number(nexpilot.price || 0) : 0;
    const courseBasePrice = course ? Number(course.effective_price || course.price || 0) : 0;
    const referralDiscount = appliedReferral ? Number(appliedReferral.discount_amount || 0) : 0;
    const totalPayable = Math.max(0, courseBasePrice + pilotPrice - referralDiscount);

    const validateReferralCode = async (codeToVerify: string, courseId: number) => {
        if (!codeToVerify || !codeToVerify.trim()) return;
        try {
            setCheckingReferral(true);
            setReferralMessage(null);
            const { data } = await apiClient.get(`/affiliate/check-code/${encodeURIComponent(codeToVerify.trim())}`, {
                params: { course_id: courseId }
            });

            if (data.valid) {
                setAppliedReferral({
                    code: data.code,
                    discount_amount: Number(data.discount_amount || 0),
                    discount_rate: Number(data.discount_rate || 0),
                    discount_type: data.discount_type || 'percentage',
                    message: data.message,
                });
                setStoredReferralCode(data.code, data.cookie_days || 30);
                setReferralMessage({ type: 'success', text: data.message });
            } else {
                setReferralMessage({ type: 'error', text: data.message || 'রেফারেল কোডটি কার্যকর নয়।' });
            }
        } catch (err: any) {
            setReferralMessage({ type: 'error', text: err.response?.data?.message || 'রেফারেল কোডটি সঠিক নয়।' });
        } finally {
            setCheckingReferral(false);
        }
    };

    useEffect(() => {
        if (course) {
            const stored = getStoredReferralCode();
            if (stored && !appliedReferral) {
                setReferralInput(stored);
                validateReferralCode(stored, course.id);
            }
        }
    }, [course]);

    const handleRemoveReferral = () => {
        setAppliedReferral(null);
        setReferralInput('');
        setReferralMessage(null);
        clearStoredReferralCode();
    };

    const getMethodTypeLabel = (type: ManualPaymentType) => {
        if (type === 'payment') {
            return language === 'en' ? 'Payment' : 'পেমেন্ট';
        }
        if (type === 'cash_out') {
            return language === 'en' ? 'Cash Out' : 'ক্যাশ আউট';
        }
        return language === 'en' ? 'Send Money' : 'সেন্ড মানি';
    };

    const getAccountTypeBadge = (type: ManualPaymentType) => {
        if (type === 'payment') {
            return language === 'en' ? 'Merchant' : 'মার্চেন্ট';
        }
        if (type === 'cash_out') {
            return language === 'en' ? 'Agent' : 'এজেন্ট';
        }
        return language === 'en' ? 'Personal' : 'ব্যক্তিগত';
    };

    const handleCopyNumber = () => {
        navigator.clipboard.writeText(currentNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!course) return;

        setError(null);
        setSubmitting(true);

        try {
            const { data } = await apiClient.post('/orders/checkout', {
                course_id: course.id,
                payment_method: paymentMethod,
                transaction_ref: transactionRef,
                sender_phone: senderPhone,
                notes,
                include_nexpilot: hasActivePilot && includeNexPilot,
                affiliate_code: appliedReferral?.code || (referralInput.trim() ? referralInput.trim() : undefined),
            });

            navigate(`/order-status/${data.order.order_number}`, { state: { order: data.order } });
        } catch (err: any) {
            setError(err.response?.data?.message || (language === 'en' ? 'Failed to process order.' : 'অর্ডার সম্পন্ন করতে সমস্যা হয়েছে।'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !course) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
                {language === 'en' ? 'Loading checkout information...' : 'তথ্য লোড হচ্ছে...'}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {language === 'en' ? 'Checkout & Payment' : 'চেকআউট ও পেমেন্ট'}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    {language === 'en' ? 'Submit payment details to confirm your course enrollment' : 'কোর্সে ভর্তি নিশ্চিত করতে পেমেন্ট তথ্য সাবমিট করুন'}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Payment Method & Trx ID form */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Payment Provider Selection */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {language === 'en' ? 'Select Payment Method' : 'পেমেন্ট মেথড নির্বাচন করুন'}
                        </h3>

                        {availableGateways.length === 0 ? (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                                {language === 'en' ? 'No payment gateway is currently available. Please contact support.' : 'বর্তমানে কোনো ম্যানুয়াল পেমেন্ট গেটওয়ে চালু নেই। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।'}
                            </div>
                        ) : (
                            <div className={`grid grid-cols-${Math.min(availableGateways.length, 3)} gap-3`}>
                                {availableGateways.map(gw => {
                                    const isSelected = paymentMethod === gw.id;
                                    return (
                                        <button
                                            key={gw.id}
                                            type="button"
                                            onClick={() => setPaymentMethod(gw.id)}
                                            className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                                                isSelected
                                                    ? `${gw.colorClass} shadow-xs`
                                                    : `border-slate-200 hover:border-slate-300 ${gw.inactiveClass}`
                                            }`}
                                        >
                                            <span className={`block font-black text-base ${gw.textColor}`}>{gw.title}</span>
                                            <span className="text-[11px] text-slate-500 font-semibold block truncate">
                                                {gw.title} {getMethodTypeLabel(gw.config?.type || 'send_money')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Instructions */}
                        {activeGateway && (
                            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2.5">
                                <div className="font-bold text-slate-900 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <span>
                                            {language === 'en' 
                                                ? `Payment Instructions (${activeGateway.title}):` 
                                                : `পেমেন্ট নির্দেশনা (${activeGateway.title}):`}
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyNumber}
                                        className="inline-flex items-center gap-1 text-sky-600 font-bold hover:underline cursor-pointer"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? (language === 'en' ? 'Copied' : 'কপি হয়েছে') : (language === 'en' ? 'Copy Number' : 'নম্বর কপি করুন')}</span>
                                    </button>
                                </div>

                                <p className="leading-relaxed">
                                    {language === 'en' 
                                        ? `1. Open your ${activeGateway.title} app or dial code and select ${getMethodTypeLabel(currentType)}.` 
                                        : `১. আপনার ${activeGateway.title} অ্যাপ অথবা ইউএসএসডি কোড ডায়াল করে ${getMethodTypeLabel(currentType)} সিলেক্ট করুন।`}
                                </p>

                                <div className="flex items-center gap-2 pt-0.5">
                                    <span>{language === 'en' ? '2. Recipient Number: ' : '২. প্রাপক নম্বর: '}</span>
                                    <strong className="font-mono text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                                        {currentNumber}
                                    </strong>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                        ({getAccountTypeBadge(currentType)})
                                    </span>
                                </div>

                                <p className="pt-0.5">
                                    {language === 'en' ? '3. Send Amount: ' : '৩. টাকার পরিমাণ: '}
                                    <strong className="text-slate-900">{formatBDT(totalPayable)}</strong>
                                </p>

                                {/* Custom instruction note from admin if provided */}
                                {((language === 'en' && activeGateway.config?.instructions_en) || activeGateway.config?.instructions) && (
                                    <div className="p-3 bg-white rounded-xl border border-slate-200/90 text-slate-600 leading-relaxed font-normal">
                                        <span className="font-semibold text-slate-800 block mb-0.5">
                                            {language === 'en' ? 'Special Instruction:' : 'বিশেষ নির্দেশ:'}
                                        </span>
                                        {language === 'en' && activeGateway.config?.instructions_en 
                                            ? activeGateway.config.instructions_en 
                                            : activeGateway.config?.instructions}
                                    </div>
                                )}

                                <p className="pt-0.5 text-slate-500">
                                    {language === 'en' ? '4. Enter the TrxID below after successful transfer.' : '৪. সফলভাবে পাঠানোর পর প্রাপ্ত Transaction ID (TrxID) নিচে লিখে সাবমিট করুন।'}
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Payment Verification Form */}
                        <form onSubmit={handleSubmitOrder} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    {language === 'en' ? 'Sender Mobile Number' : 'যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Mobile)'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={senderPhone}
                                    onChange={(e) => setSenderPhone(e.target.value)}
                                    placeholder="017xxxxxxxx"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    {language === 'en' ? 'Transaction ID (TrxID)' : 'ট্রানজেকশন আইডি (Transaction ID / TrxID)'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={transactionRef}
                                    onChange={(e) => setTransactionRef(e.target.value)}
                                    placeholder={language === 'en' ? 'e.g. 9J3K8LQZ' : 'যেমন: 9J3K8LQZ'}
                                    className="w-full px-4 py-3 font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    {language === 'en' ? 'Additional Notes (Optional)' : 'অতিরিক্ত কোনো মন্তব্য (ঐচ্ছিক)'}
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={language === 'en' ? 'Any special note or reference' : 'কোনো বিশেষ মন্তব্য থাকলে লিখুন'}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-base rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
                            >
                                <span>{submitting ? (language === 'en' ? 'Processing Order...' : 'অর্ডার প্রসেস হচ্ছে...') : (language === 'en' ? 'Payment Completed & Confirm Order' : 'পেমেন্ট সম্পন্ন হয়েছে ও সাবমিট করুন')}</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: Order Summary */}
                <div className="lg:col-span-5">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                            {language === 'en' ? 'Order Summary' : 'অর্ডার সামারি'}
                        </h3>

                        {/* Course Card Preview */}
                        <div className="flex gap-4">
                            <div className="w-20 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white">
                                        <BookOpen className="w-6 h-6 text-sky-400" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{course.title}</h4>
                                <p className="text-xs text-slate-500 mt-1">{course.lessons_count || 0} {language === 'en' ? 'Lessons' : 'টি ক্লাস'}</p>
                            </div>
                        </div>

                        {/* NexPilot Add-on Option if course has NexPilot */}
                        {hasActivePilot && (
                            <div 
                                onClick={() => setIncludeNexPilot(!includeNexPilot)}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                                    includeNexPilot 
                                        ? 'bg-linear-to-br from-indigo-50/80 via-sky-50/50 to-white border-indigo-400 shadow-xs' 
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-80'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={includeNexPilot}
                                        onChange={(e) => setIncludeNexPilot(e.target.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                                                <Sparkles className="w-4 h-4 text-amber-500" />
                                                <span>NexPilot AI টিউটর</span>
                                            </span>
                                            <span className="font-black text-sm text-indigo-600">
                                                +{formatBDT(nexpilot.price)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                            {nexpilot.short_description || 'সম্পূর্ণ কোর্সের থিওরি ও প্র্যাকটিসে সার্বক্ষণিক পার্সোনালাইজড এআই টিউটর সহায়তা।'}
                                        </p>
                                        <div className="mt-2.5 flex items-center gap-2">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                                                Theory + Practice
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                                                OpenAI Powered
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Referral / Promo Code Box */}
                        <div className="pt-2 border-t border-slate-100">
                            {appliedReferral ? (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold text-xs text-emerald-900">{appliedReferral.code}</span>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-200/80 text-emerald-800 rounded">
                                                    {appliedReferral.discount_amount > 0 ? `৳${appliedReferral.discount_amount} ছাড়` : 'কোড সক্রিয়'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-emerald-700 mt-0.5">
                                                {appliedReferral.message}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveReferral}
                                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                                        title="কোড বাতিল করুন"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>{language === 'en' ? 'Have a Referral or Promo Code?' : 'রেফারেল বা প্রোমো কোড আছে?'}</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={referralInput}
                                            onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                                            placeholder="যেমন: MONO2026"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                        />
                                        <button
                                            type="button"
                                            disabled={checkingReferral || !referralInput.trim()}
                                            onClick={() => validateReferralCode(referralInput, course.id)}
                                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1"
                                        >
                                            {checkingReferral && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            <span>{language === 'en' ? 'Apply' : 'প্রয়োগ'}</span>
                                        </button>
                                    </div>
                                    {referralMessage && referralMessage.type === 'error' && (
                                        <p className="text-[11px] text-red-500 font-medium">
                                            {referralMessage.text}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>{language === 'en' ? 'Regular Course Fee' : 'কোর্সের নিয়মিত ফি'}</span>
                                <span className="font-semibold">{formatBDT(course.price)}</span>
                            </div>

                            {course.sale_price && course.sale_price < course.price && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span>{language === 'en' ? `Discount (${course.discount_percent}%)` : `বিশেষ ছাড় (${course.discount_percent}%)`}</span>
                                    <span>- {formatBDT(course.price - course.sale_price)}</span>
                                </div>
                            )}

                            {referralDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>{language === 'en' ? 'Referral Discount' : 'রেফারেল ডিসকাউন্ট'} ({appliedReferral?.code})</span>
                                    </span>
                                    <span className="font-semibold">- {formatBDT(referralDiscount)}</span>
                                </div>
                            )}

                            {hasActivePilot && includeNexPilot && (
                                <div className="flex justify-between text-indigo-600 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>NexPilot AI লার্নিং অ্যাসিস্ট্যান্ট</span>
                                    </span>
                                    <span className="font-semibold">+{formatBDT(nexpilot.price)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-100">
                                <span>{language === 'en' ? 'Total Payable' : 'মোট প্রদেয়'}</span>
                                <span className="text-sky-600">{formatBDT(totalPayable)}</span>
                            </div>
                        </div>

                        {/* Security Guarantee */}
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>{language === 'en' ? 'Secure & Verified Transaction' : 'নিরাপদ ও বিশ্বস্ত লেনদেন'}</span>
                            </div>
                            <p className="text-emerald-700/90 leading-relaxed">
                                {language === 'en' ? 'Your course will be unlocked immediately once the payment is verified, and you will receive SMS confirmation.' : 'পেমেন্ট যাচাই হওয়ার সাথে সাথেই আপনার কোর্সটি আনলক হয়ে যাবে এবং এসএমএস ও নোটিফিকেশনের মাধ্যমে জানিয়ে দেওয়া হবে।'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
