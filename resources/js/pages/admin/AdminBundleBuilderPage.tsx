import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { Course, CourseBundle } from '../../types';
import { 
    Boxes, 
    ArrowLeft, 
    Plus, 
    Trash2, 
    Search, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    BookOpen, 
    Wrench, 
    ExternalLink, 
    DollarSign, 
    Percent, 
    Layers,
    Edit
} from 'lucide-react';

export const AdminBundleBuilderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [bundle, setBundle] = useState<CourseBundle | null>(null);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [searchAvailable, setSearchAvailable] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchBundleAndAvailable(Number(id));
        }
    }, [id]);

    const fetchBundleAndAvailable = async (bundleId: number) => {
        setLoading(true);
        try {
            const [bundleRes, availRes] = await Promise.all([
                apiClient.get(`/admin/bundles/${bundleId}`),
                apiClient.get(`/admin/bundles/${bundleId}/available-courses`),
            ]);
            setBundle(bundleRes.data);
            setAvailableCourses(availRes.data || []);
        } catch (err: any) {
            console.error('Failed to load bundle builder data:', err);
            alert('Failed to load bundle.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCourse = async (course: Course) => {
        if (!bundle) return;
        setActionLoading(course.id);
        try {
            const { data } = await apiClient.post(`/admin/bundles/${bundle.id}/courses`, {
                course_id: course.id,
            });
            setBundle(data.bundle);
            setAvailableCourses(prev => prev.filter(c => c.id !== course.id));
            showToast(`Added "${course.title}" to bundle!`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to add course to bundle.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveCourse = async (course: Course) => {
        if (!bundle) return;
        setActionLoading(course.id);
        try {
            const { data } = await apiClient.delete(`/admin/bundles/${bundle.id}/courses/${course.id}`);
            setBundle(data.bundle);
            setAvailableCourses(prev => [...prev, course].sort((a, b) => a.title.localeCompare(b.title)));
            showToast(`Removed "${course.title}" from bundle.`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to remove course.');
        } finally {
            setActionLoading(null);
        }
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const filteredAvailable = availableCourses.filter(c => 
        c.title.toLowerCase().includes(searchAvailable.toLowerCase())
    );

    if (loading || !bundle) {
        return (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                <span className="text-sm font-semibold">Loading Bundle Builder...</span>
            </div>
        );
    }

    const includedCourses = bundle.courses || [];
    const regular = Number(bundle.regular_price) || 0;
    const sale = Number(bundle.sale_price) || 0;
    const sumIndividual = includedCourses.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
    const savings = regular > sale && regular > 0 ? Math.round(((regular - sale) / regular) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/bundles"
                        className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-sky-600" />
                                <span>Bundle Builder: {bundle.title}</span>
                            </h2>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                bundle.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                                {bundle.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Add or remove courses from this bundle in real time. Changes take effect instantly.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                        to={`/admin/bundles/${bundle.id}/edit`}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                    >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Details & Pricing</span>
                    </Link>
                </div>
            </div>

            {toastMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Bundle Overview Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">Courses in Bundle</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">
                        {includedCourses.length}
                    </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">Combined Course Value</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">
                        {formatBDT(sumIndividual)}
                    </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">Bundle Sale Price</span>
                    <span className="text-xl font-black text-sky-600 mt-1 block">
                        {formatBDT(sale)}
                    </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">Student Discount</span>
                    <span className="text-xl font-black text-emerald-600 mt-1 block">
                        {savings > 0 ? `Save ${savings}%` : 'Standard'}
                    </span>
                </div>
            </div>

            {/* Interactive Builder Panels (Two-Column Realtime Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT: Included Courses in Bundle */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-sky-600" />
                            <h3 className="text-sm font-bold text-slate-900">
                                Courses Inside Bundle ({includedCourses.length})
                            </h3>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                            Enrolls student in all of these
                        </span>
                    </div>

                    {includedCourses.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
                            <Boxes className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="font-semibold text-slate-600">This bundle is currently empty.</p>
                            <p>Choose courses from the right panel to add them to this bundle.</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {includedCourses.map((course, idx) => (
                                <div 
                                    key={course.id}
                                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 transition"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </span>

                                        {course.thumbnail ? (
                                            <img 
                                                src={course.thumbnail} 
                                                alt={course.title} 
                                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200" 
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                        )}

                                        <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-slate-900 truncate">
                                                {course.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] font-semibold text-slate-500">
                                                    Individual: {formatBDT(course.price)}
                                                </span>
                                                {course.category && (
                                                    <span className="text-[10px] px-2 py-0.2 bg-slate-200/80 text-slate-700 rounded-md">
                                                        {course.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRemoveCourse(course)}
                                        disabled={actionLoading === course.id}
                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer disabled:opacity-50"
                                        title="Remove from bundle"
                                    >
                                        {actionLoading === course.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                        <span>Remove</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: Available Courses to Add */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-sm font-bold text-slate-900">
                                Available Courses ({filteredAvailable.length})
                            </h3>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchAvailable}
                            onChange={(e) => setSearchAvailable(e.target.value)}
                            placeholder="Search available courses..."
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {filteredAvailable.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                            {searchAvailable ? 'No matching courses found.' : 'All active courses are already added to this bundle!'}
                        </div>
                    ) : (
                        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                            {filteredAvailable.map(course => (
                                <div 
                                    key={course.id}
                                    className="p-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between gap-2.5 transition"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {course.thumbnail ? (
                                            <img 
                                                src={course.thumbnail} 
                                                alt={course.title} 
                                                className="w-9 h-9 rounded-lg object-cover shrink-0" 
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                        )}

                                        <div className="min-w-0">
                                            <h5 className="text-xs font-bold text-slate-900 truncate">
                                                {course.title}
                                            </h5>
                                            <span className="text-[11px] font-mono text-slate-400">
                                                {formatBDT(course.price)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleAddCourse(course)}
                                        disabled={actionLoading === course.id}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition shrink-0 cursor-pointer disabled:opacity-50"
                                        title="Add to this bundle"
                                    >
                                        {actionLoading === course.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Plus className="w-3.5 h-3.5" />
                                        )}
                                        <span>Add</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

