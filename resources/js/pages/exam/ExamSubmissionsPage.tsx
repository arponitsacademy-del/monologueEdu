import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Exam, ExamSubmission } from '../../types';
import { MathView } from '../../components/shared/MathView';
import {
    FileText,
    ArrowLeft,
    Search,
    Award,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    User as UserIcon,
    ExternalLink,
    Save,
    X,
    Eye,
    Loader2,
    HelpCircle,
    Download
} from 'lucide-react';

export const ExamSubmissionsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const isTeacher = user?.role === 'teacher';
    const basePath = isTeacher ? '/teacher/exams' : '/admin/exams';

    const [exam, setExam] = useState<Exam | null>(null);
    const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Evaluation modal state
    const [evalModalOpen, setEvalModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);
    const [submissionDetailsLoading, setSubmissionDetailsLoading] = useState(false);
    const [evaluating, setEvaluating] = useState(false);

    // Grading inputs: answerId -> { marks: number, feedback: string }
    const [gradingState, setGradingState] = useState<Record<number, { marks: number; feedback: string }>>({});
    const [overallNotes, setOverallNotes] = useState('');

    // Full screen image preview modal
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        fetchSubmissions();
    }, [id, search, statusFilter, page]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const params: any = { page };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;

            const res = await apiClient.get(`/exams/${id}/submissions`, { params });
            setExam(res.data.exam);
            setSubmissions(res.data.submissions.data || []);
            setTotalPages(res.data.submissions.last_page || 1);
            setStats(res.data.stats || {});
        } catch (err) {
            console.error('Failed to load submissions', err);
        } finally {
            setLoading(false);
        }
    };

    const openEvaluationModal = async (sub: ExamSubmission) => {
        try {
            setSubmissionDetailsLoading(true);
            setEvalModalOpen(true);
            const res = await apiClient.get(`/exams/${id}/submissions/${sub.id}`);
            const fullSub: ExamSubmission = res.data.submission;
            setSelectedSubmission(fullSub);
            setOverallNotes(fullSub.evaluation_notes || '');

            // Initialize grading state from existing answers
            const initialGrading: Record<number, { marks: number; feedback: string }> = {};
            (fullSub.answers || []).forEach(ans => {
                initialGrading[ans.id] = {
                    marks: ans.marks_obtained || 0,
                    feedback: ans.teacher_feedback || '',
                };
            });
            setGradingState(initialGrading);
        } catch (err: any) {
            alert('খাতার তথ্য লোড করতে ব্যর্থ হয়েছে।');
            setEvalModalOpen(false);
        } finally {
            setSubmissionDetailsLoading(false);
        }
    };

    const handleGradeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubmission) return;

        try {
            setEvaluating(true);
            const evaluations = Object.entries(gradingState).map(([ansId, data]) => ({
                answer_id: Number(ansId),
                marks_obtained: Number(data.marks),
                feedback: data.feedback,
            }));

            const res = await apiClient.post(`/exams/${id}/submissions/${selectedSubmission.id}/evaluate`, {
                evaluation_notes: overallNotes,
                evaluations,
            });

            // Update in list
            setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? res.data.submission : s));
            setEvalModalOpen(false);
            fetchSubmissions(); // refresh rankings
        } catch (err: any) {
            alert(err.response?.data?.message || 'মূল্যায়ন সংরক্ষণ ব্যর্থ হয়েছে।');
        } finally {
            setEvaluating(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <Link
                        to={basePath}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                {exam?.title} - খাতা মূল্যায়ন ও মেধাতালিকা
                            </h1>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {exam?.course ? `কোর্স: ${exam.course.title} • ` : ''}
                            মোট নম্বর: {exam?.total_marks} • অংশগ্রহণকারী: {stats?.total_submissions || 0} জন
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to={`${basePath}/${id}/builder`}
                        className="px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300 hover:bg-sky-100 text-xs font-semibold border border-sky-200 dark:border-sky-800"
                    >
                        Exam Builder
                    </Link>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-500">মোট অংশগ্রহণকারী</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {stats?.total_submissions || 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-500">খাতা মূল্যায়ন সম্পন্ন</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {stats?.evaluated_count || 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-500">মূল্যায়ন অপেক্ষমাণ</p>
                    <p className="text-2xl font-bold text-amber-500 mt-1">
                        {stats?.pending_count || 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-500">সর্বোচ্চ নম্বর</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                        {stats?.highest_marks || 0}
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="শিক্ষার্থীর নাম, ইমেইল বা ফোন নম্বর..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        <option value="">সকল অবস্থা</option>
                        <option value="evaluated">মূল্যায়িত (Evaluated)</option>
                        <option value="submitted">অপেক্ষমাণ (Pending)</option>
                    </select>
                </div>
            </div>

            {/* Submissions Table with Merit Rank */}
            {loading ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
                    <p className="text-sm">উত্তরপত্র লোড হচ্ছে...</p>
                </div>
            ) : submissions.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center">
                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">এখনো কোনো উত্তরপত্র জমা পড়েনি</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        শিক্ষার্থীরা এই পরীক্ষায় অংশগ্রহণ করলে তাদের উত্তরপত্র এবং স্বয়ংক্রিয় রেজাল্ট এখানে দেখা যাবে।
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">মেধা স্থান (Rank)</th>
                                    <th className="px-6 py-4">শিক্ষার্থীর নাম ও তথ্য</th>
                                    <th className="px-6 py-4">প্রাপ্ত নম্বর</th>
                                    <th className="px-6 py-4">উত্তর বিশ্লেষণ (সঠিক / ভুল / স্কিপ)</th>
                                    <th className="px-6 py-4">স্ট্যাটাস</th>
                                    <th className="px-6 py-4 text-right">খাতা চেক ও ফলাফল</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {submissions.map((sub, idx) => (
                                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {sub.merit_position === 1 && (
                                                    <span className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center font-bold text-xs shadow-sm">
                                                        🥇 1
                                                    </span>
                                                )}
                                                {sub.merit_position === 2 && (
                                                    <span className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shadow-sm">
                                                        🥈 2
                                                    </span>
                                                )}
                                                {sub.merit_position === 3 && (
                                                    <span className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 flex items-center justify-center font-bold text-xs shadow-sm">
                                                        🥉 3
                                                    </span>
                                                )}
                                                {sub.merit_position && sub.merit_position > 3 && (
                                                    <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-semibold text-xs">
                                                        #{sub.merit_position}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                {sub.user?.name || 'শিক্ষার্থী'}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {sub.user?.phone || sub.user?.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1 text-base">
                                                <span>{sub.obtained_marks}</span>
                                                <span className="text-xs font-normal text-slate-400">/ {sub.total_marks}</span>
                                            </div>
                                            {sub.negative_marks_deducted > 0 && (
                                                <div className="text-[11px] text-rose-500 mt-0.5">
                                                    নেগেটিভ কর্তন: -{sub.negative_marks_deducted}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold" title="সঠিক">
                                                    ✓ {sub.total_correct}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="inline-flex items-center gap-0.5 text-rose-600 font-semibold" title="ভুল">
                                                    ✗ {sub.total_wrong}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="inline-flex items-center gap-0.5 text-slate-400" title="স্কিপ">
                                                    — {sub.total_skipped}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {sub.status === 'evaluated' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span>মূল্যায়িত</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                    <span>খাতা দেখা বাকি</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openEvaluationModal(sub)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-600 dark:text-sky-300 font-semibold text-xs border border-sky-200 dark:border-sky-800 transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>খাতা দেখুন ও মার্ক দিন</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Evaluation & Grading Modal */}
            {evalModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-sky-500" />
                                    <span>উত্তরপত্র মূল্যায়ন: {selectedSubmission?.user?.name}</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    প্রাপ্ত নম্বর: <strong className="text-emerald-600">{selectedSubmission?.obtained_marks}</strong> / {selectedSubmission?.total_marks} • 
                                    মেধা স্থান: <strong className="text-purple-600">#{selectedSubmission?.merit_position}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => setEvalModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {submissionDetailsLoading ? (
                            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
                                <p className="text-sm">খাতা খোলা হচ্ছে...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleGradeSubmit} className="space-y-6">
                                {/* Questions & Answers Evaluation List */}
                                <div className="space-y-5">
                                    {selectedSubmission?.answers?.map((ans, idx) => {
                                        const q = ans.question;
                                        if (!q) return null;
                                        const isWritten = q.question_type === 'written_paper';
                                        const gradeData = gradingState[ans.id] || { marks: ans.marks_obtained, feedback: '' };

                                        return (
                                            <div
                                                key={ans.id}
                                                className={`p-4 rounded-xl border transition-colors space-y-3 ${
                                                    isWritten
                                                        ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40'
                                                        : ans.is_correct
                                                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40'
                                                        : 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
                                                }`}
                                            >
                                                {/* Question Header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-2.5">
                                                        <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                            {idx + 1}
                                                        </span>
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                <span className="text-xs font-semibold text-slate-500 uppercase">
                                                                    {isWritten ? 'লিখিত প্রশ্ন' : 'MCQ'}
                                                                </span>
                                                                <span className="text-xs font-bold text-sky-600">
                                                                    [সর্বোচ্চ নম্বর: {q.marks}]
                                                                </span>
                                                            </div>
                                                            <MathView
                                                                content={q.question_text}
                                                                className="text-sm font-medium text-slate-900 dark:text-white"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Auto-grading badge for MCQ */}
                                                    {!isWritten && (
                                                        <div className="shrink-0 text-right">
                                                            {ans.is_correct ? (
                                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                    <span>+{ans.marks_obtained}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                                                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                                    <span>0</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* MCQ Choices & Student Selection */}
                                                {!isWritten && q.options && (
                                                    <div className="pl-8 space-y-1.5 pt-1">
                                                        {q.options.map((opt, oIdx) => {
                                                            const isStudentPick = (ans.student_answer || []).includes(opt.id);
                                                            const isCorrectOpt = (q.correct_answers || []).includes(opt.id);

                                                            let optStyle = 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
                                                            if (isCorrectOpt) {
                                                                optStyle = 'border-emerald-300 bg-emerald-50/70 text-emerald-800 font-semibold';
                                                            } else if (isStudentPick && !isCorrectOpt) {
                                                                optStyle = 'border-rose-300 bg-rose-50/70 text-rose-800 line-through';
                                                            }

                                                            return (
                                                                <div
                                                                    key={opt.id}
                                                                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border ${optStyle}`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-slate-400">
                                                                            {String.fromCharCode(65 + oIdx)}.
                                                                        </span>
                                                                        <MathView content={opt.text} inline />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[11px]">
                                                                        {isStudentPick && (
                                                                            <span className="text-sky-600 font-semibold">[শিক্ষার্থীর উত্তর]</span>
                                                                        )}
                                                                        {isCorrectOpt && (
                                                                            <span className="text-emerald-600 font-semibold">✓ সঠিক উত্তর</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Written Paper Answer Attachments (Photos/PDF) */}
                                                {isWritten && (
                                                    <div className="pl-8 space-y-3 pt-1">
                                                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                            <FileText className="w-4 h-4 text-amber-500" />
                                                            <span>শিক্ষার্থীর জমা দেওয়া খাতার পাতা / ছবি:</span>
                                                        </div>

                                                        {(!ans.attachments || ans.attachments.length === 0) ? (
                                                            <p className="text-xs text-slate-400 italic">শিক্ষার্থী কোনো খাতার ছবি বা ফাইল আপলোড করেনি।</p>
                                                        ) : (
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                                {ans.attachments.map((file: any, fIdx: number) => {
                                                                    const isPdf = file.file_type === 'pdf' || file.url.toLowerCase().endsWith('.pdf');
                                                                    return (
                                                                        <div key={fIdx} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                                                            {isPdf ? (
                                                                                <a
                                                                                    href={file.url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="p-4 flex flex-col items-center justify-center text-center gap-2 h-32 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                                                >
                                                                                    <FileText className="w-8 h-8 text-rose-500" />
                                                                                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-full">
                                                                                        PDF খাতা দেখুন
                                                                                    </span>
                                                                                </a>
                                                                            ) : (
                                                                                <div className="relative h-32 cursor-pointer" onClick={() => setPreviewImage(file.url)}>
                                                                                    <img
                                                                                        src={file.url}
                                                                                        alt={`Page ${fIdx + 1}`}
                                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                                    />
                                                                                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1 transition-opacity">
                                                                                        <Eye className="w-4 h-4" />
                                                                                        <span>বড় করে দেখুন</span>
                                                                                    </div>
                                                                                    <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                                                        পাতা {fIdx + 1}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Teacher Grading Inputs for this question */}
                                                        <div className="pt-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40">
                                                            <div className="flex items-center gap-2">
                                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                                    প্রাপ্ত নম্বর দিন:
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={q.marks}
                                                                    step="0.5"
                                                                    value={gradeData.marks}
                                                                    onChange={e => setGradingState({
                                                                        ...gradingState,
                                                                        [ans.id]: { ...gradeData, marks: Number(e.target.value) },
                                                                    })}
                                                                    className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                                                />
                                                                <span className="text-xs text-slate-400">/ {q.marks}</span>
                                                            </div>

                                                            <div className="flex-1 w-full">
                                                                <input
                                                                    type="text"
                                                                    value={gradeData.feedback}
                                                                    onChange={e => setGradingState({
                                                                        ...gradingState,
                                                                        [ans.id]: { ...gradeData, feedback: e.target.value },
                                                                    })}
                                                                    placeholder="শিক্ষকের মন্তব্য বা ফিডব্যাক (যেমন: ভালো হয়েছে, ৩ নম্বর লাইনে ভুল ছিল)..."
                                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Overall Teacher Remarks */}
                                <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        সামগ্রিক মন্তব্য ও উপদেশ (Overall Teacher Feedback)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={overallNotes}
                                        onChange={e => setOverallNotes(e.target.value)}
                                        placeholder="শিক্ষার্থীর সামগ্রিক ফলাফলের ওপর পরামর্শ বা মন্তব্য লিখুন..."
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>

                                {/* Modal Actions */}
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEvalModalOpen(false)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        বাতিল
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={evaluating}
                                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {evaluating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>সংরক্ষণ হচ্ছে...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>মূল্যায়ন সম্পন্ন করুন ও নম্বর সেভ করুন</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Image Preview Modal (Full-screen for inspecting answer paper photos) */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-5xl max-h-[95vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img
                            src={previewImage}
                            alt="Answer sheet preview"
                            className="max-h-[90vh] w-auto mx-auto rounded-lg shadow-2xl object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

