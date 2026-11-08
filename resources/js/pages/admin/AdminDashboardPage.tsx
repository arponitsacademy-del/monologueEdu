import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { 
    Users, 
    BookOpen, 
    ShoppingCart, 
    TrendingUp, 
    Plus, 
    ArrowUpRight, 
    Clock, 
    CheckCircle2,
    Calendar,
    GraduationCap
} from 'lucide-react';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid 
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const { data } = await apiClient.get('/admin/analytics?period=30days');
            setData(data);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(n => (
                        <div key={n} className="h-32 bg-white rounded-2xl border border-slate-200" />
                    ))}
                </div>
                <div className="h-80 bg-white rounded-2xl border border-slate-200" />
            </div>
        );
    }

    const { summary, daily_trends, recent_orders, recent_students } = data;

    return (
        <div className="space-y-8 max-w-7xl">
            {/* Top Quick Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Overview & Analytics</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time platform performance and revenue metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/courses/create"
                        className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Course</span>
                    </Link>
                    <Link
                        to="/admin/orders?payment_status=pending"
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
                    >
                        <Clock className="w-4 h-4" />
                        <span>Pending Orders ({summary.total_pending_orders})</span>
                    </Link>
                </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Total Revenue Earned</span>
                        <div className="text-2xl font-black text-slate-900">{formatBDT(summary.total_revenue)}</div>
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            This Month: {formatBDT(summary.this_month_revenue)}
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>

                {/* Today's Revenue */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Today's Revenue</span>
                        <div className="text-2xl font-black text-slate-900">{formatBDT(summary.today_revenue)}</div>
                        <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                            Yesterday: {formatBDT(summary.yesterday_revenue)}
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Calendar className="w-6 h-6" />
                    </div>
                </div>

                {/* Total Students */}
                <Link
                    to="/admin/users"
                    className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-sky-500/50 hover:shadow-md transition-all group"
                >
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1 group-hover:text-sky-600 transition-colors">Total Students & Users</span>
                        <div className="text-2xl font-black text-slate-900">{summary.total_students}</div>
                        <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                            Teachers: {summary.total_teachers} • View Users &rarr;
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Users className="w-6 h-6" />
                    </div>
                </Link>

                {/* Total Courses */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Total Courses</span>
                        <div className="text-2xl font-black text-slate-900">{summary.total_courses}</div>
                        <span className="text-[11px] font-semibold text-sky-600 mt-1 block">
                            Published: {summary.published_courses} • Draft: {summary.draft_courses}
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Daily Revenue Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Last 30 Days Revenue Trend</h3>
                        <p className="text-xs text-slate-400">Daily successful sales and income graph</p>
                    </div>
                    <Link to="/admin/analytics" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                        <span>Full Report</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={daily_trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                            <Tooltip 
                                formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, 'Revenue']}
                                labelFormatter={(label) => `Date: ${label}`}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tables Grid: Recent Orders & Recent Students */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Orders */}
                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-900">Recent Successful Orders</h3>
                        <Link to="/admin/orders" className="text-xs font-bold text-sky-600 hover:text-sky-700">
                            View All Orders
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4 rounded-l-lg">Order #</th>
                                    <th className="py-3 px-4">Student</th>
                                    <th className="py-3 px-4">Course</th>
                                    <th className="py-3 px-4">Price</th>
                                    <th className="py-3 px-4 rounded-r-lg">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {recent_orders && recent_orders.length > 0 ? (
                                    recent_orders.map((o: any) => (
                                        <tr key={o.id} className="hover:bg-slate-50/60">
                                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{o.order_number}</td>
                                            <td className="py-3.5 px-4">{o.user?.name}</td>
                                            <td className="py-3.5 px-4 max-w-[180px] truncate">{o.course?.title}</td>
                                            <td className="py-3.5 px-4 font-bold text-slate-900">{formatBDT(o.final_amount)}</td>
                                            <td className="py-3.5 px-4">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                                    Paid
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-400">
                                            No orders found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Students */}
                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-900">Newly Registered Students</h3>
                        <Link to="/admin/users" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                            <span>All Users</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recent_students && recent_students.length > 0 ? (
                            recent_students.map((s: any) => (
                                <Link
                                    key={s.id}
                                    to={`/admin/users?search=${encodeURIComponent(s.phone || s.name || '')}`}
                                    className="p-3 rounded-xl bg-slate-50/60 hover:bg-sky-50/60 border border-slate-100 hover:border-sky-200 flex items-center justify-between transition-colors block group"
                                >
                                    <div className="flex items-center gap-3 truncate mr-2">
                                        <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                                            {(s.name || 'U').charAt(0)}
                                        </div>
                                        <div className="truncate">
                                            <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-700">{s.name}</h4>
                                            <p className="text-[11px] text-slate-500 font-mono">{s.phone}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                        {new Date(s.created_at).toLocaleDateString('en-US')}
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 text-center py-4">No students found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
