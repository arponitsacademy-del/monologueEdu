import React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Clock, BookOpen, ArrowRight, Home } from 'lucide-react';
import { formatBDT } from '../../api/client';

export const OrderStatusPage: React.FC = () => {
    const { orderNumber } = useParams<{ orderNumber: string }>();
    const location = useLocation();
    const order = location.state?.order;

    return (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-4 border-amber-100 shadow-xs">
                <Clock className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-3">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Order Placed Successfully!
                </h1>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Our team is verifying your payment information. Once confirmed, your course access will be unlocked automatically.
                </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs text-left max-w-md mx-auto space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                    <span className="text-slate-500">Order Number:</span>
                    <span className="font-mono font-bold text-slate-800">{orderNumber}</span>
                </div>
                {order && (
                    <>
                        <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                            <span className="text-slate-500">Course Name:</span>
                            <span className="font-bold text-slate-800">{order.course?.title}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                            <span className="text-slate-500">Total Amount:</span>
                            <span className="font-bold text-sky-600">{formatBDT(order.final_amount)}</span>
                        </div>
                    </>
                )}
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Verification Pending
                    </span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                    to="/student/my-courses"
                    className="w-full sm:w-auto px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                    <BookOpen className="w-4 h-4" />
                    <span>My Courses Dashboard</span>
                </Link>
                <Link
                    to="/"
                    className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <Home className="w-4 h-4" />
                    <span>Go to Home</span>
                </Link>
            </div>
        </div>
    );
};
