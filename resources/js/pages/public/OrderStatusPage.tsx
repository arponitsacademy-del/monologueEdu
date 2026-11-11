import React from 'react';
import { useParams, useLocation, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, BookOpen, Home, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatBDT } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';

export const OrderStatusPage: React.FC = () => {
    const { orderNumber } = useParams<{ orderNumber: string }>();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { language } = useLanguage();
    const isBn = language === 'bn';

    const order = location.state?.order;
    const queryStatus = searchParams.get('status');
    const trxId = searchParams.get('trx_id');
    const message = searchParams.get('message');

    const isSuccess = queryStatus === 'success';
    const isFailed = queryStatus === 'failed';
    const isCancelled = queryStatus === 'cancelled';

    return (
        <div className="max-w-2xl mx-auto px-4 py-16 sm:py-20 text-center space-y-8 animate-fadeIn">
            {/* Icon status */}
            {isSuccess ? (
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-md shadow-emerald-500/10">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
            ) : isFailed ? (
                <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border-4 border-rose-100 shadow-md shadow-rose-500/10">
                    <XCircle className="w-10 h-10" />
                </div>
            ) : isCancelled ? (
                <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-4 border-amber-100 shadow-md shadow-amber-500/10">
                    <AlertTriangle className="w-10 h-10" />
                </div>
            ) : (
                <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-4 border-amber-100 shadow-xs">
                    <Clock className="w-10 h-10 animate-pulse" />
                </div>
            )}

            {/* Title & Subtitle */}
            <div className="space-y-3">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {isSuccess
                        ? (isBn ? 'পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!' : 'Payment Verified Successfully!')
                        : isFailed
                        ? (isBn ? 'পেমেন্ট সম্পন্ন হতে ব্যর্থ হয়েছে' : 'Payment Failed')
                        : isCancelled
                        ? (isBn ? 'পেমেন্ট বাতিল করা হয়েছে' : 'Payment Cancelled')
                        : (isBn ? 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে!' : 'Order Placed Successfully!')}
                </h1>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    {isSuccess
                        ? (isBn 
                            ? 'আপনার পেমেন্ট সফলভাবে নিশ্চিত করা হয়েছে এবং কোর্স এক্সেস তাৎক্ষণিকভাবে আনলক করা হয়েছে।' 
                            : 'Your payment has been successfully confirmed. Course access and enrollment are now active!')
                        : isFailed
                        ? (message ? decodeURIComponent(message) : (isBn ? 'পেমেন্ট গেটওয়েতে ত্রুটি ঘটেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' : 'There was an issue processing your transaction. Please try again.'))
                        : isCancelled
                        ? (isBn ? 'আপনি পেমেন্ট প্রক্রিয়াটি বাতিল করেছেন। আপনি যেকোনো সময় আবার চেষ্টা করতে পারেন।' : 'You have cancelled the payment process. You can retry at any time.')
                        : (isBn 
                            ? 'আমাদের টিম ম্যানুয়াল পেমেন্টের তথ্য যাচাই করছে। যাচাই সম্পন্ন হলেই স্বয়ংক্রিয়ভাবে আপনার কোর্স আনলক হবে।' 
                            : 'Our team is verifying your payment information. Once confirmed, your course access will be unlocked automatically.')}
                </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs text-left max-w-md mx-auto space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                    <span className="text-slate-500">{isBn ? 'অর্ডার নম্বর:' : 'Order Number:'}</span>
                    <span className="font-mono font-bold text-slate-800">{orderNumber}</span>
                </div>

                {trxId && (
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                        <span className="text-slate-500">{isBn ? 'ট্রানজেকশন আইডি:' : 'Transaction ID:'}</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                            {trxId}
                        </span>
                    </div>
                )}

                {order && (
                    <>
                        <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                            <span className="text-slate-500">{isBn ? 'কোর্স নাম:' : 'Course Name:'}</span>
                            <span className="font-bold text-slate-800 truncate max-w-[200px]">{order.course?.title}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                            <span className="text-slate-500">{isBn ? 'মোট পরিশোধিত:' : 'Total Amount:'}</span>
                            <span className="font-bold text-sky-600">{formatBDT(order.final_amount)}</span>
                        </div>
                    </>
                )}

                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">{isBn ? 'পেমেন্ট স্ট্যাটাস:' : 'Payment Status:'}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isSuccess
                            ? 'bg-emerald-100 text-emerald-800'
                            : isFailed
                            ? 'bg-rose-100 text-rose-800'
                            : isCancelled
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-amber-100 text-amber-800'
                    }`}>
                        {isSuccess
                            ? (isBn ? 'পরিশোধিত (Active)' : 'Paid & Enrolled')
                            : isFailed
                            ? (isBn ? 'ব্যর্থ' : 'Failed')
                            : isCancelled
                            ? (isBn ? 'বাতিল' : 'Cancelled')
                            : (isBn ? 'যাচাই প্রক্রিয়াধীন' : 'Verification Pending')}
                    </span>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                    to="/student/my-courses"
                    className="w-full sm:w-auto px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                    <BookOpen className="w-4 h-4" />
                    <span>{isBn ? 'আমার কোর্স ড্যাশবোর্ড' : 'My Courses Dashboard'}</span>
                </Link>
                <Link
                    to="/"
                    className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <Home className="w-4 h-4" />
                    <span>{isBn ? 'হোম পেজে যান' : 'Go to Home'}</span>
                </Link>
            </div>
        </div>
    );
};
