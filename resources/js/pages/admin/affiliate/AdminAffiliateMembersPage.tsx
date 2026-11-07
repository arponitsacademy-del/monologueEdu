import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import {
    Users,
    DollarSign,
    Clock,
    Search,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    ArrowUpRight,
    TrendingUp,
    CreditCard,
    FileText,
    Copy,
    Check,
    X,
    Filter
} from 'lucide-react';

interface AffiliateUser {
    id: number;
    name: string;
    email: string;
    phone: string | null;
}

interface AffiliateProfileData {
    id: number;
    user_id: number;
    affiliate_code: string;
    status: 'active' | 'suspended';
    balance: number;
    total_earned: number;
    total_withdrawn: number;
    clicks_count: number;
    payout_method: string | null;
    payout_account: string | null;
    created_at: string;
    user: AffiliateUser;
    commissions_count?: number;
    orders_count?: number;
}

interface CommissionRecord {
    id: number;
    affiliate_id: number;
    order_id: number;
    course_id: number;
    buyer_id: number;
    order_amount: number;
    commission_type: 'percentage' | 'fixed';
    commission_rate: number;
    commission_amount: number;
    status: 'pending' | 'approved' | 'cancelled';
    created_at: string;
    affiliate?: {
        affiliate_code: string;
        user: AffiliateUser;
    };
    course?: {
        id: number;
        title: string;
        price: number;
    };
    order?: {
        id: number;
        order_number: string;
    };
    buyer?: AffiliateUser;
}

interface PayoutRecord {
    id: number;
    affiliate_id: number;
    amount: number;
    payment_method: string;
    account_number: string;
    status: 'pending' | 'approved' | 'rejected';
    transaction_ref: string | null;
    admin_notes: string | null;
    processed_at: string | null;
    created_at: string;
    affiliate?: {
        affiliate_code: string;
        user: AffiliateUser;
    };
}

export const AdminAffiliateMembersPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'members' | 'commissions' | 'payouts'>('members');

    // Affiliates list state
    const [affiliates, setAffiliates] = useState<AffiliateProfileData[]>([]);
    const [loadingAffiliates, setLoadingAffiliates] = useState(false);
    const [searchAffiliate, setSearchAffiliate] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Commissions list state
    const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
    const [loadingCommissions, setLoadingCommissions] = useState(false);
    const [searchCommission, setSearchCommission] = useState('');

    // Payouts list state
    const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
    const [loadingPayouts, setLoadingPayouts] = useState(false);
    const [payoutStatusFilter, setPayoutStatusFilter] = useState('');

    // Payout modal state
    const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [processingPayout, setProcessingPayout] = useState(false);
    const [payoutActionForm, setPayoutActionForm] = useState({
        status: 'approved' as 'approved' | 'rejected',
        transaction_ref: '',
        admin_notes: '',
    });

    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Initial load & Tab change
    useEffect(() => {
        if (activeTab === 'members') fetchAffiliates();
        if (activeTab === 'commissions') fetchCommissions();
        if (activeTab === 'payouts') fetchPayouts();
    }, [activeTab]);

    const fetchAffiliates = async () => {
        try {
            setLoadingAffiliates(true);
            const params: any = {};
            if (searchAffiliate) params.search = searchAffiliate;
            if (statusFilter) params.status = statusFilter;
            const res = await apiClient.get('/admin/affiliate/affiliates', { params });
            setAffiliates(res.data.data || []);
        } catch (err) {
            console.error('Failed to load affiliates', err);
        } finally {
            setLoadingAffiliates(false);
        }
    };

    const fetchCommissions = async () => {
        try {
            setLoadingCommissions(true);
            const params: any = {};
            if (searchCommission) params.search = searchCommission;
            const res = await apiClient.get('/admin/affiliate/commissions', { params });
            setCommissions(res.data.data || []);
        } catch (err) {
            console.error('Failed to load commissions', err);
        } finally {
            setLoadingCommissions(false);
        }
    };

    const fetchPayouts = async () => {
        try {
            setLoadingPayouts(true);
            const params: any = {};
            if (payoutStatusFilter) params.status = payoutStatusFilter;
            const res = await apiClient.get('/admin/affiliate/payouts', { params });
            setPayouts(res.data.data || []);
        } catch (err) {
            console.error('Failed to load payouts', err);
        } finally {
            setLoadingPayouts(false);
        }
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleOpenPayoutModal = (payout: PayoutRecord) => {
        setSelectedPayout(payout);
        setPayoutActionForm({
            status: 'approved',
            transaction_ref: '',
            admin_notes: '',
        });
        setActionModalOpen(true);
    };

    const handleProcessPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPayout) return;

        try {
            setProcessingPayout(true);
            const res = await apiClient.put(`/admin/affiliate/payouts/${selectedPayout.id}`, payoutActionForm);
            setAlertMessage({ type: 'success', text: res.data.message || 'পেআউট স্টেটাস সফলভাবে আপডেট করা হয়েছে।' });
            setActionModalOpen(false);
            fetchPayouts();
        } catch (err: any) {
            setAlertMessage({ type: 'error', text: err.response?.data?.message || 'আপডেট ব্যর্থ হয়েছে।' });
        } finally {
            setProcessingPayout(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-7 w-7 text-indigo-600" />
                    অ্যাফিলিয়েট সদস্য ও পেআউট রিকোয়েস্ট
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    অ্যাফিলিয়েটদের তালিকা পর্যবেক্ষণ করুন, উপার্জিত কমিশন নিরীক্ষা করুন এবং উত্তোলনের রিকোয়েস্ট অনুমোদন করুন।
                </p>
            </div>

            {/* Alert Message */}
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

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-3 gap-6 shadow-xs">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'members'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Users className="h-4 w-4" />
                    অ্যাফিলিয়েট সদস্যগণ
                </button>
                <button
                    onClick={() => setActiveTab('commissions')}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'commissions'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <TrendingUp className="h-4 w-4" />
                    কমিশন হিস্ট্রি
                </button>
                <button
                    onClick={() => setActiveTab('payouts')}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'payouts'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <CreditCard className="h-4 w-4" />
                    উত্তোলন / পেআউট রিকোয়েস্ট
                </button>
            </div>

            {/* TAB 1: AFFILIATES LIST */}
            {activeTab === 'members' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                fetchAffiliates();
                            }}
                            className="relative w-full sm:w-96"
                        >
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchAffiliate}
                                onChange={(e) => setSearchAffiliate(e.target.value)}
                                placeholder="নাম, ইমেইল, মোবাইল বা কোড দিয়ে খুঁজুন..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                        </form>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setTimeout(fetchAffiliates, 50);
                                }}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">সব স্ট্যাটাস</option>
                                <option value="active">সক্রিয় (Active)</option>
                                <option value="suspended">স্থগিত (Suspended)</option>
                            </select>
                            <button
                                onClick={fetchAffiliates}
                                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                            >
                                ফিল্টার করুন
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                        {loadingAffiliates ? (
                            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                                <span className="text-sm font-medium">অ্যাফিলিয়েট তালিকা লোড হচ্ছে...</span>
                            </div>
                        ) : affiliates.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-500">কোনো অ্যাফিলিয়েট পার্টনার পাওয়া যায়নি</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50/75 border-b border-gray-200 text-xs uppercase font-semibold text-gray-600">
                                        <tr>
                                            <th className="px-6 py-3.5">সদস্যের নাম ও তথ্য</th>
                                            <th className="px-6 py-3.5">রেফারেল কোড</th>
                                            <th className="px-6 py-3.5 text-center">ক্লিক সংখ্যা</th>
                                            <th className="px-6 py-3.5 text-center">সফল অর্ডার</th>
                                            <th className="px-6 py-3.5">বর্তমান ব্যালেন্স</th>
                                            <th className="px-6 py-3.5">মোট উপার্জন</th>
                                            <th className="px-6 py-3.5">স্ট্যাটাস</th>
                                            <th className="px-6 py-3.5 text-right">যোগদানের তারিখ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {affiliates.map((aff) => (
                                            <tr key={aff.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{aff.user?.name || 'অজ্ঞাত'}</div>
                                                    <div className="text-xs text-gray-500">{aff.user?.email}</div>
                                                    {aff.user?.phone && (
                                                        <div className="text-xs text-gray-400">{aff.user?.phone}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 font-mono text-xs font-bold text-gray-800">
                                                        <span>{aff.affiliate_code}</span>
                                                        <button
                                                            onClick={() => handleCopy(aff.affiliate_code)}
                                                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                            title="কপি করুন"
                                                        >
                                                            {copiedCode === aff.affiliate_code ? (
                                                                <Check className="h-3 w-3 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium text-gray-700">
                                                    {aff.clicks_count || 0}
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium text-emerald-700">
                                                    {aff.orders_count || 0}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-indigo-600">৳{Number(aff.balance).toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-gray-900">৳{Number(aff.total_earned).toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                            aff.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-red-50 text-red-700 border border-red-200'
                                                        }`}
                                                    >
                                                        {aff.status === 'active' ? 'সক্রিয়' : 'স্থগিত'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs text-gray-500">
                                                    {new Date(aff.created_at).toLocaleDateString('bn-BD', {
                                                        year: 'numeric',
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
            )}

            {/* TAB 2: COMMISSIONS LOG */}
            {activeTab === 'commissions' && (
                <div className="space-y-4">
                    {/* Search */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-center justify-between shadow-xs">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                fetchCommissions();
                            }}
                            className="relative w-full sm:w-96"
                        >
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchCommission}
                                onChange={(e) => setSearchCommission(e.target.value)}
                                placeholder="অর্ডার নম্বর বা অ্যাফিলিয়েট নাম দিয়ে খুঁজুন..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                        </form>
                        <button
                            onClick={fetchCommissions}
                            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                            খুঁজুন
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                        {loadingCommissions ? (
                            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                                <span className="text-sm font-medium">কমিশন রেকর্ড লোড হচ্ছে...</span>
                            </div>
                        ) : commissions.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-500">কোনো কমিশন ট্রানজেকশন পাওয়া যায়নি</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50/75 border-b border-gray-200 text-xs uppercase font-semibold text-gray-600">
                                        <tr>
                                            <th className="px-6 py-3.5">অর্ডার #</th>
                                            <th className="px-6 py-3.5">অ্যাফিলিয়েট পার্টনার</th>
                                            <th className="px-6 py-3.5">কোর্স</th>
                                            <th className="px-6 py-3.5">অর্ডার ভ্যালু</th>
                                            <th className="px-6 py-3.5">কমিশন রেট</th>
                                            <th className="px-6 py-3.5">উপার্জিত কমিশন</th>
                                            <th className="px-6 py-3.5">ক্রেতা</th>
                                            <th className="px-6 py-3.5">স্ট্যাটাস</th>
                                            <th className="px-6 py-3.5 text-right">তারিখ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {commissions.map((comm) => (
                                            <tr key={comm.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-gray-800">
                                                    {comm.order?.order_number || `#${comm.order_id}`}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{comm.affiliate?.user?.name || 'Affiliate'}</div>
                                                    <div className="text-xs text-indigo-600 font-mono">({comm.affiliate?.affiliate_code})</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-800 line-clamp-1">{comm.course?.title || 'Course'}</div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    ৳{Number(comm.order_amount).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 font-medium">
                                                    {comm.commission_type === 'percentage'
                                                        ? `${comm.commission_rate}%`
                                                        : `৳${comm.commission_rate}`}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-emerald-600">
                                                    ৳{Number(comm.commission_amount).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    <div className="font-medium text-gray-800">{comm.buyer?.name || 'Student'}</div>
                                                    <div className="text-gray-400">{comm.buyer?.phone || comm.buyer?.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                            comm.status === 'approved'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : comm.status === 'pending'
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                : 'bg-red-50 text-red-700 border border-red-200'
                                                        }`}
                                                    >
                                                        {comm.status === 'approved' ? 'অনুমোদিত' : comm.status === 'pending' ? 'অপেক্ষমাণ' : 'বাতিল'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs text-gray-500">
                                                    {new Date(comm.created_at).toLocaleDateString('bn-BD', {
                                                        year: 'numeric',
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
            )}

            {/* TAB 3: PAYOUT REQUESTS */}
            {activeTab === 'payouts' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-600">স্ট্যাটাস ফিল্টার:</span>
                            <select
                                value={payoutStatusFilter}
                                onChange={(e) => {
                                    setPayoutStatusFilter(e.target.value);
                                    setTimeout(fetchPayouts, 50);
                                }}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">সব রিকোয়েস্ট</option>
                                <option value="pending">অপেক্ষমাণ (Pending)</option>
                                <option value="approved">অনুমোদিত (Approved / Paid)</option>
                                <option value="rejected">বাতিল (Rejected / Refunded)</option>
                            </select>
                        </div>
                        <button
                            onClick={fetchPayouts}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            রিফ্রেশ করুন
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                        {loadingPayouts ? (
                            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                                <span className="text-sm font-medium">পেআউট রিকোয়েস্ট লোড হচ্ছে...</span>
                            </div>
                        ) : payouts.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-500">কোনো পেআউট রিকোয়েস্ট পাওয়া যায়নি</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50/75 border-b border-gray-200 text-xs uppercase font-semibold text-gray-600">
                                        <tr>
                                            <th className="px-6 py-3.5">অ্যাফিলিয়েট সদস্য</th>
                                            <th className="px-6 py-3.5">পেমেন্ট মেথড</th>
                                            <th className="px-6 py-3.5">অ্যাকাউন্ট নম্বর</th>
                                            <th className="px-6 py-3.5">পরিমাণ</th>
                                            <th className="px-6 py-3.5">স্ট্যাটাস</th>
                                            <th className="px-6 py-3.5">TrxID / রেফারেন্স</th>
                                            <th className="px-6 py-3.5">অনুরোধের সময়</th>
                                            <th className="px-6 py-3.5 text-right">অ্যাকশন</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {payouts.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{p.affiliate?.user?.name || 'User'}</div>
                                                    <div className="text-xs text-indigo-600 font-mono">({p.affiliate?.affiliate_code})</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="uppercase text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                                                        {p.payment_method}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-medium text-gray-800">
                                                    {p.account_number}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900 text-base">
                                                    ৳{Number(p.amount).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                            p.status === 'approved'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : p.status === 'pending'
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                : 'bg-red-50 text-red-700 border border-red-200'
                                                        }`}
                                                    >
                                                        {p.status === 'approved' ? 'পরিশোধিত' : p.status === 'pending' ? 'অপেক্ষমাণ' : 'বাতিল'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-gray-600">
                                                    {p.transaction_ref || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    {new Date(p.created_at).toLocaleDateString('bn-BD', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {p.status === 'pending' ? (
                                                        <button
                                                            onClick={() => handleOpenPayoutModal(p)}
                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                                                        >
                                                            যাচাই ও অ্যাকশন
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">সম্পন্ন</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payout Processing Modal */}
            {actionModalOpen && selectedPayout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                        <button
                            onClick={() => setActionModalOpen(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-indigo-600" />
                                পেআউট রিকোয়েস্ট যাচাইকরণ
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                অ্যাফিলিয়েট পার্টনার: {selectedPayout.affiliate?.user?.name} ({selectedPayout.affiliate?.affiliate_code})
                            </p>
                        </div>

                        {/* Summary of request */}
                        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 mb-4 text-sm space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-gray-600 text-xs">উত্তোলনের পরিমাণ:</span>
                                <span className="font-bold text-indigo-900 text-base">৳{Number(selectedPayout.amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 text-xs">পেমেন্ট মেথড:</span>
                                <span className="font-semibold text-gray-800 uppercase text-xs">{selectedPayout.payment_method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 text-xs">অ্যাকাউন্ট নম্বর:</span>
                                <span className="font-mono font-bold text-gray-900">{selectedPayout.account_number}</span>
                            </div>
                        </div>

                        <form onSubmit={handleProcessPayout} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-1.5">সিদ্ধান্ত নিন</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPayoutActionForm({ ...payoutActionForm, status: 'approved' })}
                                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                                            payoutActionForm.status === 'approved'
                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        অনুমোদন (Paid)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPayoutActionForm({ ...payoutActionForm, status: 'rejected' })}
                                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                                            payoutActionForm.status === 'rejected'
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <XCircle className="h-4 w-4" />
                                        বাতিল (Refund)
                                    </button>
                                </div>
                                {payoutActionForm.status === 'rejected' && (
                                    <p className="text-xs text-red-600 mt-1.5">
                                        * বাতিল করা হলে কর্তনকৃত টাকা স্বয়ংক্রিয়ভাবে সদস্যের অ্যাকাউন্টে ফেরত যাবে।
                                    </p>
                                )}
                            </div>

                            {payoutActionForm.status === 'approved' && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                                        ট্রানজেকশন আইডি (TrxID) / রেফারেন্স
                                    </label>
                                    <input
                                        type="text"
                                        value={payoutActionForm.transaction_ref}
                                        onChange={(e) => setPayoutActionForm({ ...payoutActionForm, transaction_ref: e.target.value })}
                                        placeholder="যেমন: BKL89239824"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                                        required={payoutActionForm.status === 'approved'}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-1">
                                    অ্যাডমিন নোট (ঐচ্ছিক)
                                </label>
                                <textarea
                                    rows={2}
                                    value={payoutActionForm.admin_notes}
                                    onChange={(e) => setPayoutActionForm({ ...payoutActionForm, admin_notes: e.target.value })}
                                    placeholder="কোনো বার্তা বা মন্তব্য থাকলে লিখুন..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActionModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingPayout}
                                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                    {processingPayout && <Loader2 className="h-4 w-4 animate-spin" />}
                                    কনফার্ম করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

