import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { 
    Bot, 
    Plus, 
    Wrench, 
    Edit3, 
    Trash2, 
    Search, 
    Sparkles, 
    Settings, 
    BookOpen, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    Check, 
    ExternalLink,
    HelpCircle,
    GraduationCap,
    SlidersHorizontal,
    DollarSign,
    Cpu,
    Users
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const AdminNexPilotsPage: React.FC = () => {
    const navigate = useNavigate();
    const [pilots, setPilots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [pilotToDelete, setPilotToDelete] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Students Access Modal
    const [studentsModalOpen, setStudentsModalOpen] = useState(false);
    const [selectedPilotForStudents, setSelectedPilotForStudents] = useState<any | null>(null);
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | string | null>(null);
    const [studentsSuccessMsg, setStudentsSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        fetchPilots();
    }, [search]);

    const fetchPilots = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/admin/nexpilot', {
                params: { search: search || undefined }
            });
            setPilots(data.data || []);
        } catch (err) {
            console.error('Failed to fetch pilots', err);
        } finally {
            setLoading(false);
        }
    };

    const openStudentsModal = async (pilot: any) => {
        setSelectedPilotForStudents(pilot);
        setStudentsModalOpen(true);
        setStudentsSuccessMsg(null);
        setLoadingStudents(true);
        try {
            const { data } = await apiClient.get(`/admin/nexpilot/${pilot.id}/students`);
            setStudentsList(data.students || []);
        } catch {
            setStudentsList([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleToggleStudentAccess = async (enrollmentId: number) => {
        if (!selectedPilotForStudents) return;
        setActionLoading(enrollmentId);
        try {
            const { data } = await apiClient.post(`/admin/nexpilot/${selectedPilotForStudents.id}/students/${enrollmentId}/toggle`);
            setStudentsList(prev => prev.map(s => s.enrollment_id === enrollmentId ? { ...s, has_nexpilot: data.has_nexpilot } : s));
            setStudentsSuccessMsg(data.message);
            setTimeout(() => setStudentsSuccessMsg(null), 3000);
            fetchPilots();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to toggle access.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleGrantAll = async () => {
        if (!selectedPilotForStudents) return;
        if (!window.confirm('Are you sure you want to enable NexPilot for all enrolled students in this course?')) return;
        setActionLoading('grant-all');
        try {
            const { data } = await apiClient.post(`/admin/nexpilot/${selectedPilotForStudents.id}/grant-all`);
            setStudentsList(prev => prev.map(s => ({ ...s, has_nexpilot: true })));
            setStudentsSuccessMsg(data.message);
            setTimeout(() => setStudentsSuccessMsg(null), 4000);
            fetchPilots();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to grant access to all students.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeletePilot = async () => {
        if (!pilotToDelete) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/admin/nexpilot/${pilotToDelete.id}`);
            setPilots(prev => prev.filter(p => p.id !== pilotToDelete.id));
            setDeleteModalOpen(false);
            setPilotToDelete(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete pilot.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span>NexPilot AI Assistant</span>
                                <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 rounded-full border border-sky-200 dark:border-sky-800">
                                    OpenAI Powered
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Course-specific personal AI tutor and practice solving coach management
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        to="/admin/nexpilot/ai-configuration"
                        className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                        <Cpu className="w-4 h-4 text-indigo-500" />
                        <span>AI Model Configuration</span>
                    </Link>

                    <Link
                        to="/admin/nexpilot/new"
                        className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Pilot</span>
                    </Link>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by course or pilot name..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                    />
                </div>
            </div>

            {/* Pilots Grid / List */}
            {loading ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                    <span className="text-xs font-bold">Loading NexPilot list...</span>
                </div>
            ) : pilots.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 mx-auto flex items-center justify-center">
                        <Bot className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No NexPilot found</h4>
                        <p className="text-xs text-slate-400 mt-1">Create the first AI pilot for your course.</p>
                    </div>
                    <Link
                        to="/admin/nexpilot/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-sky-700"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Pilot</span>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {pilots.map((pilot) => {
                        const course = pilot.course;
                        return (
                            <div
                                key={pilot.id}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between gap-5 transition-all hover:border-sky-300 dark:hover:border-slate-700"
                            >
                                <div className="space-y-4">
                                    {/* Top row: Status and Course Badge */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                <BookOpen className="w-3 h-3 text-sky-600" />
                                                <span className="truncate max-w-[200px]">{course?.title || 'No course'}</span>
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800">
                                                {pilot.openai_model || 'gpt-4o-mini'}
                                            </span>
                                        </div>

                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                            pilot.is_active 
                                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                            {pilot.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    {/* Pilot Title & Short Description */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span>{pilot.title}</span>
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                            {pilot.short_description || '24/7 personal AI tutor and practice coach for enrolled students.'}
                                        </p>
                                    </div>

                                    {/* Metrics Pill Grid */}
                                    <div className="grid grid-cols-3 gap-2.5 pt-2">
                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                            <p className="text-[10px] font-semibold text-slate-400">Add-on Fee</p>
                                            <p className="text-sm font-black text-sky-600 dark:text-sky-400 mt-0.5">
                                                {pilot.price > 0 ? formatBDT(pilot.price) : 'Free'}
                                            </p>
                                        </div>

                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                            <p className="text-[10px] font-semibold text-slate-400">Max Budget / Student</p>
                                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                ${parseFloat(pilot.max_usd_limit || 2).toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                            <p className="text-[10px] font-semibold text-slate-400">Topics Count</p>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                                                <span className="text-indigo-600">{pilot.theory_topics_count || 0} Theory</span>
                                                <span className="text-slate-300 mx-1">•</span>
                                                <span className="text-sky-600">{pilot.practice_topics_count || 0} Practice</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Bar */}
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <button
                                            type="button"
                                            onClick={() => openStudentsModal(pilot)}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-bold text-xs transition-colors cursor-pointer border border-sky-100 dark:border-sky-900"
                                            title="View and manage student NexPilot access"
                                        >
                                            <Users className="w-3.5 h-3.5 text-sky-600" />
                                            <span>Student Access ({pilot.students_count || 0})</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Builder Button */}
                                        <Link
                                            to={`/admin/nexpilot/${pilot.id}/builder`}
                                            className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
                                        >
                                            <Wrench className="w-3.5 h-3.5" />
                                            <span>Builder</span>
                                        </Link>

                                        {/* Edit Button */}
                                        <Link
                                            to={`/admin/nexpilot/${pilot.id}/edit`}
                                            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </Link>

                                        {/* Delete Button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPilotToDelete(pilot);
                                                setDeleteModalOpen(true);
                                            }}
                                            className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirm Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Confirm NexPilot Deletion"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        Are you sure you want to delete <strong>"{pilotToDelete?.title}"</strong>?
                        All associated theory, practice topics, and chat histories will be permanently removed.
                    </p>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setDeleteModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeletePilot}
                            disabled={deleting}
                            className="px-4 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl"
                        >
                            {deleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Students Access Modal */}
            <Modal
                isOpen={studentsModalOpen}
                onClose={() => setStudentsModalOpen(false)}
                title={`${selectedPilotForStudents?.title || 'Pilot'} - Student Access`}
            >
                <div className="space-y-4">
                    {/* Header info & Grant all */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                Course: {selectedPilotForStudents?.course?.title || 'Course'}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                Total Enrolled Students: <strong>{studentsList.length}</strong>
                            </span>
                        </div>

                        {studentsList.length > 0 && (
                            <button
                                type="button"
                                onClick={handleGrantAll}
                                disabled={actionLoading === 'grant-all'}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{actionLoading === 'grant-all' ? 'Processing...' : 'Grant NexPilot to All'}</span>
                            </button>
                        )}
                    </div>

                    {studentsSuccessMsg && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{studentsSuccessMsg}</span>
                        </div>
                    )}

                    {loadingStudents ? (
                        <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                            <span className="text-xs">Loading student list...</span>
                        </div>
                    ) : studentsList.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                            No enrolled students found in this course.
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl">
                            {studentsList.map((st) => (
                                <div key={st.enrollment_id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                    <div className="min-w-0">
                                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                            {st.name}
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-mono">
                                            {st.phone || st.email || 'N/A'} • {st.enrolled_at}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            st.has_nexpilot
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            {st.has_nexpilot ? 'NexPilot Active' : 'Inactive'}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleStudentAccess(st.enrollment_id)}
                                            disabled={actionLoading === st.enrollment_id}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                                st.has_nexpilot
                                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300'
                                                    : 'bg-sky-600 text-white hover:bg-sky-700'
                                            }`}
                                        >
                                            {actionLoading === st.enrollment_id
                                                ? '...'
                                                : st.has_nexpilot ? 'Revoke Access' : 'Grant Access'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setStudentsModalOpen(false)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
