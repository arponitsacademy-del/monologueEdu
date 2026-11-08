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
        return <div className="p-12 text-center text-slate-400">Loading orders...</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Order History</h2>
                <p className="text-xs text-slate-500 mt-0.5">All your course purchase and payment transactions</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6">Order #</th>
                                <th className="py-4 px-4">Course Name</th>
                                <th className="py-4 px-4">Amount Paid</th>
                                <th className="py-4 px-4">Payment Method</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-6 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        No order history found.
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
                                                    Paid
                                                </span>
                                            ) : order.payment_status === 'pending' ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                                                    Cancelled
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right text-slate-400">
                                            {new Date(order.created_at).toLocaleDateString('en-US')}
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
