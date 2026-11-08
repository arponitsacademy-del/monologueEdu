import React, { useState, useEffect } from 'react';
import { apiClient, formatBDT } from '../../api/client';
import {
    BarChart3,
    Calendar,
    TrendingUp,
    ShoppingCart,
    BookOpen,
    Filter,
    DollarSign
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';

export const AdminAnalyticsPage: React.FC = () => {
    const [period, setPeriod] = useState('30days');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('period', period);
            if (period === 'custom') {
                if (fromDate) params.append('from_date', fromDate);
                if (toDate) params.append('to_date', toDate);
            }

            const { data } = await apiClient.get(`/admin/analytics?${params.toString()}`);
            setData(data);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    const handleCustomFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAnalytics();
    };

    if (loading || !data) {
        return <div className="p-12 text-center text-slate-400">Generating analytics report...</div>;
    }

    const { summary, daily_trends, monthly_trends, course_sales, date_range } = data;

    return (
        <div className="space-y-8 max-w-7xl pb-16">
            {/* Header & Date Range Picker */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Income & Revenue Analytics</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Date Range: {date_range.start} to {date_range.end} (Timezone: Asia/Dhaka)
                    </p>
                </div>

                {/* Filter Options */}
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { label: 'Today', value: 'today' },
                        { label: 'Yesterday', value: 'yesterday' },
                        { label: '7 Days', value: '7days' },
                        { label: '30 Days', value: '30days' },
                        { label: 'This Month', value: 'this_month' },
                        { label: 'Last Month', value: 'last_month' },
                        { label: 'Custom Range', value: 'custom' },
                    ].map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${period === p.value
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Date Inputs if custom selected */}
            {period === 'custom' && (
                <form onSubmit={handleCustomFilterSubmit} className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <span>From:</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <span>To:</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800"
                    >
                        Apply Filter
                    </button>
                </form>
            )}

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-bold text-slate-400 block mb-1">Selected Period Revenue</span>
                    <div className="text-2xl font-black text-slate-900">{formatBDT(summary.period_revenue)}</div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                        Paid Orders: {summary.period_paid_orders}
                    </span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-bold text-slate-400 block mb-1">Total Platform Revenue</span>
                    <div className="text-2xl font-black text-sky-600">{formatBDT(summary.total_revenue)}</div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                        Total Paid Orders: {summary.total_paid_orders}
                    </span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-bold text-slate-400 block mb-1">This Month Revenue</span>
                    <div className="text-2xl font-black text-emerald-600">{formatBDT(summary.this_month_revenue)}</div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                        Last Month: {formatBDT(summary.last_month_revenue)}
                    </span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-bold text-slate-400 block mb-1">Today's Revenue</span>
                    <div className="text-2xl font-black text-slate-900">{formatBDT(summary.today_revenue)}</div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                        Yesterday: {formatBDT(summary.yesterday_revenue)}
                    </span>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Daily Revenue Trend */}
                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Daily Revenue Trend</h3>
                    <div className="h-72 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={daily_trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v}`} />
                                <Tooltip formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, 'Revenue']} />
                                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#areaColor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Trend */}
                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Monthly Revenue (Last 6 Months)</h3>
                    <div className="h-72 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthly_trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v}`} />
                                <Tooltip formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, 'Revenue']} />
                                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Course Sales Breakdown Table */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">Course Sales Breakdown</h3>
                    <span className="text-xs text-slate-400">Aggregated from real order records</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="py-3 px-4 rounded-l-lg">Course Title</th>
                                <th className="py-3 px-4">Regular Price</th>
                                <th className="py-3 px-4">Units Sold</th>
                                <th className="py-3 px-4">Gross Sales</th>
                                <th className="py-3 px-4 rounded-r-lg">Net Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {course_sales && course_sales.length > 0 ? (
                                course_sales.map((cs: any) => (
                                    <tr key={cs.id} className="hover:bg-slate-50/60">
                                        <td className="py-3.5 px-4 font-bold text-slate-900">{cs.title}</td>
                                        <td className="py-3.5 px-4">{formatBDT(cs.price)}</td>
                                        <td className="py-3.5 px-4 font-bold">{cs.units_sold} Units</td>
                                        <td className="py-3.5 px-4">{formatBDT(cs.gross_sales)}</td>
                                        <td className="py-3.5 px-4 font-bold text-sky-600">{formatBDT(cs.net_revenue)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-slate-400">No sales data found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
