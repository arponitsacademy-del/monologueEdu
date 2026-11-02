import React, { useEffect, useState } from 'react';
import { apiClient, formatBDT } from '../../api/client';
import { Order } from '../../types';
import { ShoppingCart, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const StudentOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await apiClient.get('/orders/my-orders');
            setOrders(data.data || []);
        } catch {}
        finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400">অর্ডার লোড হচ্ছে...</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">আমার অর্ডারসমূহ (Order History)</h2>
                <p className="text-xs text-slate-500 mt-0.5">আপনার সকল কোর্স পারচেজ ও পেমেন্ট হিস্ট্রি</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6">অর্ডার নম্বর</th>
                                <th className="py-4 px-4">কোর্সের নাম</th>
                                <th className="py-4 px-4">পরিশোধিত মূল্য</th>
                                <th className="py-4 px-4">পেমেন্ট মেথড</th>
                                <th className="py-4 px-4">স্ট্যাটাস</th>
                                <th className="py-4 px-6 text-right">তারিখ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        আপনার কোনো অর্ডার হিস্ট্রি পাওয়া যায়নি।
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-4 px-6 font-mono font-bold text-slate-900">
                                            {order.order_number}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-slate-900 max-w-xs truncate">
                                            {order.course?.title}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-sky-600">
                                            {formatBDT(order.final_amount)}
                                        </td>
                                        <td className="py-4 px-4 uppercase text-[11px] font-semibold text-slate-600">
                                            {order.payment_method.replace('manual_', '')}
                                        </td>
                                        <td className="py-4 px-4">
                                            {order.payment_status === 'paid' ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                                    পরিশোধিত
                                                </span>
                                            ) : order.payment_status === 'pending' ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                                                    যাচাই বাকি
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                                                    বাতিল
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right text-slate-400">
                                            {new Date(order.created_at).toLocaleDateString('bn-BD')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
