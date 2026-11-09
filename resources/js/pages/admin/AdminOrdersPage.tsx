import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { Order } from '../../types';
import {
    ShoppingCart,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    AlertCircle,
    Filter,
    ShieldCheck
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const AdminOrdersPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('payment_status') || '');

    // View Modal
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchOrders();
    }, [search, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('payment_status', statusFilter);

            const { data } = await apiClient.get(`/admin/orders?${params.toString()}`);
            setOrders(data.data || []);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (orderId: number) => {
        if (!window.confirm('Are you sure you want to confirm payment for this order and activate the student enrollment?')) return;

        setProcessingId(orderId);
        try {
            const { data } = await apiClient.post(`/admin/orders/${orderId}/confirm-payment`);
            setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
            if (viewOrder && viewOrder.id === orderId) {
                setViewOrder(data.order);
            }
            alert(data.message);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve payment.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectPayment = async (orderId: number) => {
        const reason = window.prompt('Enter reason for rejecting payment (optional):');
        if (reason === null) return;

        setProcessingId(orderId);
        try {
            const { data } = await apiClient.post(`/admin/orders/${orderId}/reject-payment`, { reason });
            setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
            if (viewOrder && viewOrder.id === orderId) {
                setViewOrder(data.order);
            }
            alert(data.message);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reject payment.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Orders & Payments Management</h2>
                <p className="text-xs text-slate-500 mt-0.5">Verify manual mobile payments (bKash/Nagad) and approve course enrollments</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-md">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Order number, student name or phone..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700"
                    >
                        <option value="">All Payment Statuses</option>
                        <option value="pending">Pending Verification</option>
                        <option value="paid">Paid & Active</option>
                        <option value="failed">Rejected / Failed</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6">Order Number</th>
                                <th className="py-4 px-4">Student</th>
                                <th className="py-4 px-4">Course</th>
                                <th className="py-4 px-4">Amount</th>
                                <th className="py-4 px-4">Method & TrxID</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const payment = order.latest_payment;
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-4 px-6 font-mono font-bold text-slate-900">
                                                {order.order_number}
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="font-bold text-slate-900">{order.user?.name}</div>
                                                <div className="text-[11px] text-slate-400 font-mono">{order.user?.phone}</div>
                                            </td>

                                            <td className="py-4 px-4 max-w-[180px] truncate">
                                                {order.course?.title}
                                            </td>

                                            <td className="py-4 px-4">
                                                <span className="font-bold text-slate-900">{formatBDT(order.final_amount)}</span>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="font-semibold text-slate-800 uppercase text-[11px]">
                                                    {order.payment_method.replace('manual_', '')}
                                                </div>
                                                <div className="font-mono text-[10px] text-sky-600 font-bold">
                                                    {payment?.transaction_ref || 'N/A'}
                                                </div>
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
                                                        Failed
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-6 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => setViewOrder(order)}
                                                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {order.payment_status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleConfirmPayment(order.id)}
                                                                disabled={processingId === order.id}
                                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs disabled:opacity-50"
                                                                title="Approve payment & activate enrollment"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectPayment(order.id)}
                                                                disabled={processingId === order.id}
                                                                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-xs disabled:opacity-50"
                                                                title="Reject payment"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Order Modal */}
            <Modal
                isOpen={Boolean(viewOrder)}
                onClose={() => setViewOrder(null)}
                title="Order Details"
                maxWidth="md"
            >
                {viewOrder && (
                    <div className="space-y-4 text-xs text-slate-700">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex justify-between font-mono font-bold text-slate-900 border-b border-slate-200 pb-2">
                                <span>Order Number:</span>
                                <span>{viewOrder.order_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Student:</span>
                                <span className="font-bold text-slate-800">{viewOrder.user?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Phone Number:</span>
                                <span className="font-mono">{viewOrder.user?.phone}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Course Name:</span>
                                <span className="font-bold text-slate-800">{viewOrder.course?.title}</span>
                            </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Regular Price:</span>
                                <span>{formatBDT(viewOrder.original_price)}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600">
                                <span>Discount:</span>
                                <span>- {formatBDT(viewOrder.discount_amount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-2">
                                <span>Final Payable:</span>
                                <span className="text-sky-600">{formatBDT(viewOrder.final_amount)}</span>
                            </div>
                        </div>

                        {/* Trx Info */}
                        <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-2">
                            <h4 className="font-bold text-sky-950 uppercase text-[11px]">Payment Transaction Details</h4>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Method:</span>
                                <span className="font-bold uppercase">{viewOrder.payment_method.replace('manual_', '')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Sender Phone:</span>
                                <span className="font-mono font-bold text-slate-800">{viewOrder.latest_payment?.sender_phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Transaction ID:</span>
                                <span className="font-mono font-bold text-sky-700 text-sm">{viewOrder.latest_payment?.transaction_ref || 'N/A'}</span>
                            </div>
                        </div>

                        {viewOrder.payment_status === 'pending' && (
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => handleConfirmPayment(viewOrder.id)}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
                                >
                                    Approve Payment & Enroll
                                </button>
                                <button
                                    onClick={() => handleRejectPayment(viewOrder.id)}
                                    className="py-3 px-6 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};