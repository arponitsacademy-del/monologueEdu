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
    TicketPercent,
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

    // Coupon state
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{
        coupon_id: number;
        code: string;
        title: string;
        discount_type: string;
        discount_amount: number;
        calculated_discount: number;
        final_price: number;
        message: string;
    } | null>(null);
    const [checkingCoupon, setCheckingCoupon] = useState(false);
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    const couponDiscount = appliedCoupon ? Number(appliedCoupon.calculated_discount || 0) : 0;
    const totalPayable = Math.max(0, courseBasePrice + pilotPrice - referralDiscount - couponDiscount);

    const validateCouponCode = async (codeToVerify: string, courseId: number) => {
        if (!codeToVerify || !codeToVerify.trim()) return;
        try {
            setCheckingCoupon(true);
            setCouponMessage(null);
            const res = await apiClient.post('/coupons/validate', {
                code: codeToVerify.trim().toUpperCase(),
                course_id: courseId,
            });

            if (res.data.valid) {
                setAppliedCoupon(res.data);
                setCouponMessage({ type: 'success', text: res.data.message || 'Coupon applied successfully!' });
            } else {
                setCouponMessage({ type: 'error', text: res.data.message || 'Invalid coupon.' });
            }
        } catch (err: any) {
            setCouponMessage({ type: 'error', text: err.response?.data?.message || 'Invalid coupon code.' });
        } finally {
            setCheckingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput('');
        setCouponMessage(null);
    };

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
                setReferralMessage({ type: 'error', text: data.message || 'Referral code is invalid or expired.' });
            }
        } catch (err: any) {
            setReferralMessage({ type: 'error', text: err.response?.data?.message || 'Invalid referral code.' });
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
            return 'Payment';
        }
        if (type === 'cash_out') {
            return 'Cash Out';
        }
        return 'Send Money';
    };

    const getAccountTypeBadge = (type: ManualPaymentType) => {
        if (type === 'payment') {
            return 'Merchant';
        }
        if (type === 'cash_out') {
            return 'Agent';
        }
        return 'Personal';
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
                coupon_code: appliedCoupon?.code || (couponInput.trim() ? couponInput.trim() : undefined),
            });

            navigate(`/order-status/${data.order.order_number}`, { state: { order: data.order } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to process order.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !course) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
                Loading checkout information...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Checkout & Payment
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Submit payment details to confirm your course enrollment
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Payment Method & Trx ID form */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Payment Provider Selection */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            Select Payment Method
                        </h3>

                        {availableGateways.length === 0 ? (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                                No payment gateway is currently available. Please contact support.
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
                                            Payment Instructions ({activeGateway.title}):
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyNumber}
                                        className="inline-flex items-center gap-1 text-sky-600 font-bold hover:underline cursor-pointer"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? 'Copied' : 'Copy Number'}</span>
                                    </button>
                                </div>

                                <p className="leading-relaxed">
                                    {`1. Open your ${activeGateway.title} app or dial code and select ${getMethodTypeLabel(currentType)}.`}
                                </p>

                                <div className="flex items-center gap-2 pt-0.5">
                                    <span>2. Recipient Number: </span>
                                    <strong className="font-mono text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                                        {currentNumber}
                                    </strong>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                        ({getAccountTypeBadge(currentType)})
                                    </span>
                                </div>

                                <p className="pt-0.5">
                                    3. Send Amount: 
                                    <strong className="text-slate-900">{formatBDT(totalPayable)}</strong>
                                </p>

                                {/* Custom instruction note from admin if provided */}
                                {(activeGateway.config?.instructions_en || activeGateway.config?.instructions) && (
                                    <div className="p-3 bg-white rounded-xl border border-slate-200/90 text-slate-600 leading-relaxed font-normal">
                                        <span className="font-semibold text-slate-800 block mb-0.5">
                                            Special Instruction:
                                        </span>
                                        {activeGateway.config?.instructions_en || activeGateway.config?.instructions}
                                    </div>
                                )}

                                <p className="pt-0.5 text-slate-500">
                                    4. Enter the TrxID below after successful transfer.
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
                                    Sender Mobile Number
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
                                    Transaction ID (TrxID)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={transactionRef}
                                    onChange={(e) => setTransactionRef(e.target.value)}
                                    placeholder="e.g. 9J3K8LQZ"
                                    className="w-full px-4 py-3 font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Additional Notes (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any special note or reference"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-base rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
                            >
                                <span>{submitting ? 'Processing Order...' : 'Payment Completed & Confirm Order'}</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: Order Summary */}
                <div className="lg:col-span-5">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                            Order Summary
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
                                <p className="text-xs text-slate-500 mt-1">{course.lessons_count || 0} Lessons</p>
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
                                                <span>NexPilot AI Tutor</span>
                                            </span>
                                            <span className="font-black text-sm text-indigo-600">
                                                +{formatBDT(nexpilot.price)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                            {nexpilot.short_description || 'Comprehensive 24/7 personalized AI tutor assistance across all theory and practice.'}
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
                                                    {appliedReferral.discount_amount > 0 ? `৳${appliedReferral.discount_amount} Off` : 'Code Active'}
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
                                        title="Remove code"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Have a Referral or Promo Code?</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={referralInput}
                                            onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                                            placeholder="e.g. MONO2026"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                        />
                                        <button
                                            type="button"
                                            disabled={checkingReferral || !referralInput.trim()}
                                            onClick={() => validateReferralCode(referralInput, course.id)}
                                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1"
                                        >
                                            {checkingReferral && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            <span>Apply</span>
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

                        {/* Coupon Code Box */}
                        <div className="pt-2 border-t border-slate-100">
                            {appliedCoupon ? (
                                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700">
                                            <TicketPercent className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold text-xs text-indigo-900">{appliedCoupon.code}</span>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-200/80 text-indigo-800 rounded">
                                                    -৳{appliedCoupon.calculated_discount} OFF
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-indigo-700 mt-0.5">
                                                {appliedCoupon.title}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveCoupon}
                                        className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                                        title="Remove coupon"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                        <TicketPercent className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Have a Discount Coupon?</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponInput}
                                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                            placeholder="Enter coupon code..."
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                                        />
                                        <button
                                            type="button"
                                            disabled={checkingCoupon || !couponInput.trim()}
                                            onClick={() => validateCouponCode(couponInput, course.id)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1 cursor-pointer"
                                        >
                                            {checkingCoupon && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            <span>Apply</span>
                                        </button>
                                    </div>
                                    {couponMessage && (
                                        <p className={`text-[11px] font-medium ${couponMessage.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {couponMessage.text}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>Regular Course Fee</span>
                                <span className="font-semibold">{formatBDT(course.price)}</span>
                            </div>

                            {course.sale_price && course.sale_price < course.price && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span>Special Discount ({course.discount_percent}%)</span>
                                    <span>- {formatBDT(course.price - course.sale_price)}</span>
                                </div>
                            )}

                            {referralDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Referral Discount ({appliedReferral?.code})</span>
                                    </span>
                                    <span className="font-semibold">- {formatBDT(referralDiscount)}</span>
                                </div>
                            )}

                            {couponDiscount > 0 && (
                                <div className="flex justify-between text-indigo-600 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <TicketPercent className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Coupon Discount ({appliedCoupon?.code})</span>
                                    </span>
                                    <span className="font-semibold">- {formatBDT(couponDiscount)}</span>
                                </div>
                            )}

                            {hasActivePilot && includeNexPilot && (
                                <div className="flex justify-between text-indigo-600 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>NexPilot AI Learning Assistant</span>
                                    </span>
                                    <span className="font-semibold">+{formatBDT(nexpilot.price)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-100">
                                <span>Total Payable</span>
                                <span className="text-sky-600">{formatBDT(totalPayable)}</span>
                            </div>
                        </div>

                        {/* Security Guarantee */}
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>Secure & Verified Transaction</span>
                            </div>
                            <p className="text-emerald-700/90 leading-relaxed">
                                Your course will be unlocked immediately once the payment is verified, and you will receive SMS confirmation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
