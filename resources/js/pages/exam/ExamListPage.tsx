import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Exam } from '../../types';
import {
    ClipboardList,
    Plus,
    Search,
    BookOpen,
    Clock,
    Award,
    Wrench,
    FileText,
    Trash2,
    Edit3,
    AlertCircle,
    CheckCircle2,
    Users,
    ChevronRight,
    Loader2,
    RotateCcw
} from 'lucide-react';

export const ExamListPage: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const isTeacher = user?.role === 'teacher';
    const basePath = isTeacher ? '/teacher/exams' : '/admin/exams';

    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(() => {
        const p = new URLSearchParams(window.location.search);
        return p.get('status') || '';
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalExams, setTotalExams] = useState(0);

    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchExams();
    }, [search, statusFilter, page]);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const params: any = { page };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;

            const res = await apiClient.get('/exams', { params });
            setExams(res.data.data || []);
            setTotalPages(res.data.last_page || 1);
            setTotalExams(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch exams', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('আপনি কি নিশ্চিতভাবে এই পরীক্ষাটি (Exam) ট্র্যাশে পাঠাতে চান? পরবর্তীতে ট্র্যাশ থেকে এটি যেকোনো সময় পুনরুদ্ধার করা যাবে।')) {
            return;
        }

        try {
            setDeletingId(id);
            await apiClient.delete(`/exams/${id}`);
            setExams(prev => prev.filter(e => e.id !== id));
            setTotalExams(prev => Math.max(0, prev - 1));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete exam.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleRestore = async (id: number) => {
        try {
            await apiClient.post(`/exams/${id}/restore`);
            setExams(prev => prev.filter(e => e.id !== id));
            setTotalExams(prev => Math.max(0, prev - 1));
            alert('পরীক্ষাটি সফলভাবে পুনরুদ্ধার করা হয়েছে!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to restore exam.');
        }
    };

    const handleForceDelete = async (id: number) => {
        if (!window.confirm('সতর্কতা: আপনি কি নিশ্চিতভাবে এই পরীক্ষাটি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর কখনোই পুনরুদ্ধার করা যাবে না!')) {
            return;
        }

        try {
            await apiClient.delete(`/exams/${id}/force-delete`);
            setExams(prev => prev.filter(e => e.id !== id));
            setTotalExams(prev => Math.max(0, prev - 1));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to permanently delete exam.');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                        <ClipboardList className="w-7 h-7 text-sky-500" />
                        <span>Exam Management</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        List of all exams, question authoring (Exam Builder), and submission evaluations.
                    </p>
                </div>
                <Link
                    to={`${basePath}/create`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-sm shadow-sky-600/20 transition-all text-sm shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create New Exam</span>
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Exams</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalExams}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exam Builder</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">MCQ & Written Papers</p>
                            <p className="text-xs text-emerald-500 mt-0.5">Easy question creation & editing</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
                            <Wrench className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Results & Evaluation</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">Auto-grading & paper review</p>
                            <p className="text-xs text-purple-500 mt-0.5">Merit position ranking</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center">
                            <Award className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by exam title..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className={`px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                            statusFilter === 'trashed'
                                ? 'border-rose-400 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60'
                                : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                        }`}
                    >
                        <option value="">All Statuses (সকল স্ট্যাটাস)</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                        <option value="trashed">🗑️ ট্র্যাশ (Trash)</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => setStatusFilter(prev => prev === 'trashed' ? '' : 'trashed')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                            statusFilter === 'trashed'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                        title="Trash / রিসাইকেল বিন"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>{statusFilter === 'trashed' ? 'সব পরীক্ষায় ফিরুন' : 'ট্র্যাশ (Trash)'}</span>
                    </button>
                </div>
            </div>

            {/* Trash Mode Notice */}
            {statusFilter === 'trashed' && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200">
                    <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-semibold">
                        ট্র্যাশ মোড (Trash Bin): এখানে পূর্বে মুছে ফেলা পরীক্ষাগুলো (Exams) সংরক্ষিত রয়েছে। আপনি পরীক্ষা পুনরুদ্ধার (Restore) করতে পারেন অথবা ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে পারেন।
                    </span>
                </div>
            )}

            {/* Exams Table / Cards */}
            {loading ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
                    <p className="text-sm">Loading exams...</p>
                </div>
            ) : exams.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center">
                    <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No exams found</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        Click "Create New Exam" button above to create a new exam.
                    </p>
                    <Link
                        to={`${basePath}/create`}
                        className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create First Exam</span>
                    </Link>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Exam Title & Courses</th>
                                    <th className="px-6 py-4">Marks & Duration</th>
                                    <th className="px-6 py-4">Negative Mark</th>
                                    <th className="px-6 py-4">Questions & Candidates</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {exams.map(exam => (
                                    <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                <span>{exam.title}</span>
                                            </div>
                                            {(() => {
                                                const attached = (exam.courses && exam.courses.length > 0)
                                                    ? exam.courses
                                                    : (exam.course ? [exam.course] : []);

                                                if (attached.length === 0) {
                                                    return (
                                                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                            <span>No course attached</span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {attached.map(c => (
                                                            <span
                                                                key={c.id}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[11px] font-medium border border-sky-100 dark:border-sky-900/60"
                                                            >
                                                                <BookOpen className="w-3 h-3 text-sky-500" />
                                                                <span>{c.title}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                <Award className="w-4 h-4 text-amber-500" />
                                                <span>{exam.total_marks} Marks</span>
                                            </div>
                                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{exam.duration_minutes} Mins</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {exam.has_negative_marking ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                                                    Yes (-{exam.negative_marks})
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                    No
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                                {exam.questions_count ?? 0} Questions
                                            </div>
                                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{exam.submissions_count ?? 0} Submissions</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {exam.status === 'published' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                                                    Published
                                                </span>
                                            ) : exam.status === 'draft' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                                                    Draft
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                    Archived
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {statusFilter === 'trashed' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestore(exam.id)}
                                                            title="পুনরুদ্ধার করুন (Restore)"
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                            <span>পুনরুদ্ধার</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleForceDelete(exam.id)}
                                                            title="স্থায়ীভাবে মুছুন (Permanent Delete)"
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors border border-rose-200 dark:border-rose-800 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>স্থায়ী মুছুন</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* Exam Builder button */}
                                                        <Link
                                                            to={`${basePath}/${exam.id}/builder`}
                                                            title="Exam Builder"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-600 dark:text-sky-300 font-semibold text-xs transition-colors border border-sky-200 dark:border-sky-800/40"
                                                        >
                                                            <Wrench className="w-3.5 h-3.5" />
                                                            <span>Exam Builder</span>
                                                        </Link>

                                                        {/* Submissions & Evaluation button */}
                                                        <Link
                                                            to={`${basePath}/${exam.id}/submissions`}
                                                            title="Submissions & Grading"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />
                                                            <span>Submissions</span>
                                                        </Link>

                                                        {/* Edit exam settings */}
                                                        <Link
                                                            to={`${basePath}/${exam.id}/edit`}
                                                            title="Edit Settings"
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </Link>

                                                        {/* Delete exam */}
                                                        <button
                                                            onClick={() => handleDelete(exam.id)}
                                                            disabled={deletingId === exam.id}
                                                            title="Delete Exam"
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Page {page} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

