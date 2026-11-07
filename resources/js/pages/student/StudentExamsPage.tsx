import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { MathView } from '../../components/shared/MathView';
import { Modal } from '../../components/ui/Modal';
import {
    ClipboardList,
    Search,
    Award,
    TrendingUp,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    FileText,
    Download,
    Printer,
    Eye,
    BookOpen,
    Filter,
    HelpCircle,
    ChevronRight,
    Loader2,
    MinusCircle,
    Check,
    X,
    Sparkles,
    Calendar,
    User
} from 'lucide-react';

interface ExamItem {
    id: number;
    title: string;
    total_marks: number;
    duration_minutes: number;
    has_negative_marking: boolean;
    negative_marks: number;
    courses?: { id: number; title: string; slug: string }[];
}

interface SubmissionItem {
    id: number;
    exam_id: number;
    user_id: number;
    total_marks: number;
    obtained_marks: number;
    total_questions: number;
    total_answered: number;
    total_skipped: number;
    total_correct: number;
    total_wrong: number;
    negative_marks_deducted: number;
    status: 'in_progress' | 'submitted' | 'evaluated';
    submitted_at: string;
    merit_position: number;
    total_participants: number;
    exam: ExamItem;
    evaluator?: { id: number; name: string };
}

interface QuestionReview {
    id: number;
    question_text: string;
    question_type: 'single_choice' | 'multiple_choice' | 'written_paper';
    marks: number;
    attachment_url?: string | null;
    explanation?: string | null;
    options: { key: string; text: string }[];
    correct_answers: string[];
    student_answer: string[] | string | null;
    attachments: { url: string; file_name?: string; file_type?: string }[];
    is_answered: boolean;
    is_correct: boolean;
    marks_obtained: number;
    teacher_feedback?: string | null;
}

export const StudentExamsPage: React.FC = () => {
    const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
    const [progress, setProgress] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [loadingReview, setLoadingReview] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);
    const [reviewExam, setReviewExam] = useState<any>(null);
    const [reviewQuestions, setReviewQuestions] = useState<QuestionReview[]>([]);
    const [questionFilter, setQuestionFilter] = useState<'all' | 'correct' | 'wrong' | 'skipped'>('all');

    useEffect(() => {
        fetchSubmissions(1);
    }, []);

    const fetchSubmissions = async (page = 1) => {
        try {
            setLoading(true);
            const params: any = { page };
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (statusFilter) params.status = statusFilter;

            const res = await apiClient.get('/student/exams/my-exams', { params });
            const data = res.data;
            setSubmissions(data.submissions?.data || []);
            setProgress(data.progress || null);
            setPagination({
                currentPage: data.submissions?.current_page || 1,
                lastPage: data.submissions?.last_page || 1,
                total: data.submissions?.total || 0,
            });
        } catch (err) {
            console.error('Failed to load my exams', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSubmissions(1);
    };

    const handleOpenReview = async (sub: SubmissionItem) => {
        setSelectedSubmission(sub);
        setReviewModalOpen(true);
        setLoadingReview(true);
        setQuestionFilter('all');

        try {
            const res = await apiClient.get(`/student/exams/submissions/${sub.id}`);
            const data = res.data;
            setReviewExam(data.exam);
            setReviewQuestions(data.questions || []);
            if (data.submission) {
                setSelectedSubmission((prev) => ({
                    ...prev!,
                    ...data.submission,
                    merit_position: data.merit_position,
                    total_participants: data.total_participants,
                }));
            }
        } catch (err) {
            console.error('Failed to load submission review', err);
        } finally {
            setLoadingReview(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Filter questions in review modal
    const filteredQuestions = reviewQuestions.filter((q) => {
        if (questionFilter === 'correct') return q.is_answered && q.is_correct;
        if (questionFilter === 'wrong') return q.is_answered && !q.is_correct;
        if (questionFilter === 'skipped') return !q.is_answered;
        return true;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Print Header (Only visible on paper print / PDF export) */}
            <div className="hidden print:block mb-6 border-b border-gray-300 pb-4 text-center">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">MONOLOGUE EDU</h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">Online Examination Result & Evaluation Sheet</p>
                {selectedSubmission && (
                    <div className="mt-4 grid grid-cols-2 text-left text-xs text-gray-700 border border-gray-300 rounded-lg p-3 bg-gray-50/50">
                        <div>
                            <p><strong>শিক্ষার্থীর নাম:</strong> {selectedSubmission.evaluator ? 'Student' : 'User'}</p>
                            <p><strong>পরীক্ষার নাম:</strong> {selectedSubmission.exam?.title}</p>
                            <p><strong>তারিখ:</strong> {new Date(selectedSubmission.submitted_at).toLocaleDateString('bn-BD')}</p>
                        </div>
                        <div className="text-right">
                            <p><strong>প্রাপ্ত নম্বর:</strong> {selectedSubmission.obtained_marks} / {selectedSubmission.total_marks}</p>
                            <p><strong>মেধা স্থান (Merit):</strong> #{selectedSubmission.merit_position} (মোট {selectedSubmission.total_participants} জন)</p>
                            <p><strong>ফলাফল:</strong> {selectedSubmission.total_correct} সঠিক, {selectedSubmission.total_wrong} ভুল, {selectedSubmission.total_skipped} বাদ</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Page Header (Screen only) */}
            <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <ClipboardList className="h-7 w-7 text-indigo-600" />
                        আমার পরীক্ষাসমূহ ও ফলাফল বিশ্লেষণ
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        আপনার সম্পন্ন করা সকল পরীক্ষার বিস্তারিত নম্বর, সঠিক ও ভুল উত্তরের বিশ্লেষণ দেখুন এবং PDF সংগ্রহ করুন।
                    </p>
                </div>
            </div>

            {/* Overall Student Progress Cards (Screen only) */}
            {progress && (
                <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">মোট পরীক্ষা দিয়েছি</span>
                            <ClipboardList className="h-5 w-5 text-indigo-600" />
                        </div>
                        <p className="text-3xl font-extrabold text-gray-900 mt-2">{progress.total_exams} টি</p>
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                            মোট উত্তর করা প্রশ্ন: {progress.total_questions_attempted} টি
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">গড় স্কোর / অর্জন</span>
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-3xl font-extrabold text-emerald-600 mt-2">{progress.overall_percentage}%</p>
                        <p className="text-xs text-gray-500 mt-1.5">
                            গড় প্রাপ্ত নম্বর: <strong className="text-gray-800">{progress.average_score}</strong>
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">নির্ভুলতার হার (Accuracy)</span>
                            <Award className="h-5 w-5 text-amber-500" />
                        </div>
                        <p className="text-3xl font-extrabold text-indigo-900 mt-2">{progress.accuracy_rate}%</p>
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1 font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            {progress.accuracy_rate >= 80 ? 'অসাধারণ দক্ষতা!' : progress.accuracy_rate >= 50 ? 'ভালো অগ্রগতি' : 'আরও প্র্যাকটিস প্রয়োজন'}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">সঠিক বনাম ভুল উত্তর</span>
                            <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <XCircle className="h-4 w-4 text-rose-500" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-3 mt-2">
                            <span className="text-2xl font-black text-emerald-600">{progress.total_correct}</span>
                            <span className="text-xs text-gray-400">সঠিক /</span>
                            <span className="text-2xl font-black text-rose-600">{progress.total_wrong}</span>
                            <span className="text-xs text-gray-400">ভুল</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">মোট ভুল প্রশ্নের সংখ্যা: {progress.total_wrong} টি</p>
                    </div>
                </div>
            )}

            {/* Search & Filter Bar (Screen only) */}
            <div className="print:hidden bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="পরীক্ষার নাম দিয়ে খুঁজুন..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                </form>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setTimeout(() => fetchSubmissions(1), 50);
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    >
                        <option value="">সকল পরীক্ষা</option>
                        <option value="evaluated">মূল্যায়িত (Evaluated)</option>
                        <option value="submitted">খাতা মূল্যায়ন অপেক্ষমাণ</option>
                    </select>

                    <button
                        onClick={() => fetchSubmissions(1)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                    >
                        খুঁজুন
                    </button>
                </div>
            </div>

            {/* Submissions Table / Cards (Screen only) */}
            <div className="print:hidden bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-16 text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                        <span className="text-sm font-medium">পরীক্ষার হিস্ট্রি লোড হচ্ছে...</span>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-800">কোনো পরীক্ষা পাওয়া যায়নি</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            আপনি এখনও কোনো পরীক্ষায় অংশ নেননি অথবা অনুসন্ধানের সাথে কোনো রেকর্ড মিলছে না।
                        </p>
                        <Link
                            to="/courses"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                        >
                            <BookOpen className="h-4 w-4" />
                            কোর্সের পরীক্ষাগুলো দেখুন
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase font-semibold text-gray-600">
                                <tr>
                                    <th className="px-6 py-4">পরীক্ষার নাম ও কোর্স</th>
                                    <th className="px-6 py-4 text-center">প্রাপ্ত স্কোর</th>
                                    <th className="px-6 py-4 text-center">মেধা স্থান (Merit)</th>
                                    <th className="px-6 py-4">উত্তরের বিশ্লেষণ</th>
                                    <th className="px-6 py-4">স্ট্যাটাস</th>
                                    <th className="px-6 py-4">তারিখ</th>
                                    <th className="px-6 py-4 text-right">অ্যাকশন</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {submissions.map((sub) => {
                                    const percentage = sub.total_marks > 0
                                        ? Math.round((sub.obtained_marks / sub.total_marks) * 100)
                                        : 0;

                                    return (
                                        <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 text-sm">{sub.exam?.title}</div>
                                                {sub.exam?.courses && sub.exam.courses.length > 0 && (
                                                    <div className="text-xs text-indigo-600 mt-0.5 font-medium line-clamp-1">
                                                        {sub.exam.courses.map((c) => c.title).join(', ')}
                                                    </div>
                                                )}
                                                <div className="text-[11px] text-gray-400 mt-0.5">
                                                    মোট সময়: {sub.exam?.duration_minutes} মিনিট • পূর্ণমান: {sub.total_marks}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <div className="text-base font-extrabold text-gray-900">
                                                    {sub.obtained_marks} <span className="text-xs text-gray-400 font-normal">/ {sub.total_marks}</span>
                                                </div>
                                                <span
                                                    className={`inline-block text-[11px] font-bold px-2 py-0.2 rounded-full mt-0.5 ${
                                                        percentage >= 80
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : percentage >= 40
                                                            ? 'bg-indigo-50 text-indigo-700'
                                                            : 'bg-rose-50 text-rose-700'
                                                    }`}
                                                >
                                                    {percentage}% নম্বর
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs">
                                                    <Award className="h-3.5 w-3.5 text-amber-500" />
                                                    <span>#{sub.merit_position}</span>
                                                    <span className="text-[10px] text-gray-500 font-normal">/ {sub.total_participants} জন</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                                                        <Check className="h-3.5 w-3.5" />
                                                        {sub.total_correct}
                                                    </span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="inline-flex items-center gap-0.5 text-rose-600 font-bold">
                                                        <X className="h-3.5 w-3.5" />
                                                        {sub.total_wrong}
                                                    </span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="text-gray-400">
                                                        {sub.total_skipped} বাদ
                                                    </span>
                                                </div>
                                                {sub.negative_marks_deducted > 0 && (
                                                    <div className="text-[10px] text-rose-500 mt-0.5">
                                                        মাইনাস মার্কস: -{sub.negative_marks_deducted}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        sub.status === 'evaluated'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}
                                                >
                                                    {sub.status === 'evaluated' ? 'মূল্যায়ন সম্পন্ন' : 'খাতা মূল্যায়ন অপেক্ষমাণ'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {new Date(sub.submitted_at).toLocaleDateString('bn-BD', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </td>

                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenReview(sub)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    রিভিউ ও সমাধান
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* REVIEW & ANALYSIS MODAL */}
            {reviewModalOpen && selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-gray-100 pb-4 shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700">
                                        পরীক্ষার ফলাফল ও রিভিউ
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(selectedSubmission.submitted_at).toLocaleDateString('bn-BD')}
                                    </span>
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                                    {selectedSubmission.exam?.title}
                                </h2>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                                    title="PDF হিসেবে সেভ করুন বা প্রিন্ট করুন"
                                >
                                    <Printer className="h-4 w-4 text-slate-600" />
                                    <span>PDF ডাউনলোড / প্রিন্ট</span>
                                </button>
                                <button
                                    onClick={() => setReviewModalOpen(false)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Top Score Banner */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50/50 border border-indigo-100 text-xs shrink-0">
                            <div>
                                <span className="text-gray-500 text-[11px] block">প্রাপ্ত নম্বর</span>
                                <span className="text-xl font-black text-indigo-950">
                                    {selectedSubmission.obtained_marks} / {selectedSubmission.total_marks}
                                </span>
                            </div>

                            <div>
                                <span className="text-gray-500 text-[11px] block">মেধা স্থান (Merit)</span>
                                <span className="text-xl font-black text-amber-600 flex items-center gap-1">
                                    <Award className="h-5 w-5 text-amber-500 inline" />
                                    #{selectedSubmission.merit_position}
                                    <span className="text-xs text-gray-500 font-normal">/ {selectedSubmission.total_participants}</span>
                                </span>
                            </div>

                            <div>
                                <span className="text-gray-500 text-[11px] block">সঠিক / ভুল</span>
                                <span className="text-base font-bold text-gray-900 mt-0.5 block">
                                    <span className="text-emerald-600 font-black">{selectedSubmission.total_correct}</span> সঠিক • <span className="text-rose-600 font-black">{selectedSubmission.total_wrong}</span> ভুল
                                </span>
                            </div>

                            <div>
                                <span className="text-gray-500 text-[11px] block">নেগেটিভ মার্কিং কর্তন</span>
                                <span className="text-base font-bold text-rose-600 mt-0.5 block">
                                    -{selectedSubmission.negative_marks_deducted} মার্কস
                                </span>
                            </div>
                        </div>

                        {/* Question Filter Tabs */}
                        <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 mb-4 shrink-0 overflow-x-auto">
                            <button
                                onClick={() => setQuestionFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    questionFilter === 'all'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                সকল প্রশ্ন ({reviewQuestions.length})
                            </button>
                            <button
                                onClick={() => setQuestionFilter('correct')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    questionFilter === 'correct'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-100 text-emerald-700 hover:bg-emerald-50'
                                }`}
                            >
                                সঠিক হয়েছে ({selectedSubmission.total_correct})
                            </button>
                            <button
                                onClick={() => setQuestionFilter('wrong')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    questionFilter === 'wrong'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-gray-100 text-rose-700 hover:bg-rose-50'
                                }`}
                            >
                                ভুল হয়েছে ({selectedSubmission.total_wrong})
                            </button>
                            <button
                                onClick={() => setQuestionFilter('skipped')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    questionFilter === 'skipped'
                                        ? 'bg-gray-700 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                বাদ দেওয়া ({selectedSubmission.total_skipped})
                            </button>
                        </div>

                        {/* Questions Content List (Scrollable) */}
                        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                            {loadingReview ? (
                                <div className="py-16 text-center text-gray-400">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
                                    <p className="text-xs font-medium">প্রশ্ন ও উত্তরের বিশ্লেষণ লোড হচ্ছে...</p>
                                </div>
                            ) : filteredQuestions.length === 0 ? (
                                <div className="py-12 text-center text-gray-400">
                                    <CheckCircle2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-xs">এই ক্যাটাগরিতে কোনো প্রশ্ন নেই।</p>
                                </div>
                            ) : (
                                filteredQuestions.map((q, idx) => {
                                    const isSkipped = !q.is_answered;
                                    const isCorrect = q.is_answered && q.is_correct;
                                    const isWrong = q.is_answered && !q.is_correct;

                                    return (
                                        <div
                                            key={q.id}
                                            className={`p-4 rounded-xl border transition-all ${
                                                isCorrect
                                                    ? 'border-emerald-200 bg-emerald-50/20'
                                                    : isWrong
                                                    ? 'border-rose-200 bg-rose-50/20'
                                                    : 'border-gray-200 bg-gray-50/40'
                                            }`}
                                        >
                                            {/* Question Top Meta */}
                                            <div className="flex items-center justify-between text-xs mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-gray-200 text-gray-800">
                                                        প্রশ্ন #{idx + 1}
                                                    </span>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="font-semibold text-gray-600">
                                                        মান: {q.marks} নম্বর
                                                    </span>
                                                </div>

                                                <div>
                                                    {isCorrect && (
                                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            সঠিক (+{q.marks_obtained})
                                                        </span>
                                                    )}
                                                    {isWrong && (
                                                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full text-[11px]">
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            ভুল উত্তর (০ নম্বর)
                                                        </span>
                                                    )}
                                                    {isSkipped && (
                                                        <span className="inline-flex items-center gap-1 font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full text-[11px]">
                                                            <MinusCircle className="h-3.5 w-3.5" />
                                                            এড়িয়ে গেছেন (০)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Question Statement with LaTeX Math */}
                                            <div className="text-sm font-semibold text-gray-900 leading-relaxed mb-3">
                                                <MathView content={q.question_text} />
                                            </div>

                                            {/* Attachment if present */}
                                            {q.attachment_url && (
                                                <div className="mb-3">
                                                    <img
                                                        src={q.attachment_url}
                                                        alt="Question Attachment"
                                                        className="max-h-60 rounded-lg border border-gray-200 object-contain"
                                                    />
                                                </div>
                                            )}

                                            {/* Options for MCQ */}
                                            {(q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && q.options && (
                                                <div className="space-y-2 mb-3">
                                                    {q.options.map((opt) => {
                                                        const isCorrectOpt = Array.isArray(q.correct_answers) && q.correct_answers.includes(opt.key);
                                                        const isStudentSelected = Array.isArray(q.student_answer)
                                                            ? q.student_answer.includes(opt.key)
                                                            : q.student_answer === opt.key;

                                                        let optionClass = 'border-gray-200 bg-white text-gray-700';
                                                        if (isCorrectOpt) {
                                                            optionClass = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-medium';
                                                        } else if (isStudentSelected && !isCorrectOpt) {
                                                            optionClass = 'border-rose-300 bg-rose-50 text-rose-950 font-medium';
                                                        }

                                                        return (
                                                            <div
                                                                key={opt.key}
                                                                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${optionClass}`}
                                                            >
                                                                <div className="flex items-center gap-2.5 flex-1 pr-2">
                                                                    <span className="w-6 h-6 rounded-lg bg-gray-100 border border-gray-300 font-mono font-bold flex items-center justify-center shrink-0">
                                                                        {opt.key}
                                                                    </span>
                                                                    <div className="flex-1">
                                                                        <MathView content={opt.text} inline />
                                                                    </div>
                                                                </div>

                                                                <div className="shrink-0 flex items-center gap-1.5">
                                                                    {isCorrectOpt && isStudentSelected && (
                                                                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1">
                                                                            <Check className="h-3 w-3" />
                                                                            আপনার সঠিক উত্তর
                                                                        </span>
                                                                    )}
                                                                    {isCorrectOpt && !isStudentSelected && (
                                                                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 border border-emerald-300">
                                                                            <Check className="h-3 w-3" />
                                                                            সঠিক উত্তর
                                                                        </span>
                                                                    )}
                                                                    {!isCorrectOpt && isStudentSelected && (
                                                                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] flex items-center gap-1">
                                                                            <X className="h-3 w-3" />
                                                                            আপনার ভুল উত্তর
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Written Paper Answer Attachments */}
                                            {q.question_type === 'written_paper' && (
                                                <div className="space-y-3 p-3 bg-white rounded-xl border border-gray-200 mb-3">
                                                    <span className="text-xs font-bold text-gray-700 block">
                                                        আপনার আপলোডকৃত উত্তরের খাতা / ছবি:
                                                    </span>

                                                    {q.attachments && q.attachments.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {q.attachments.map((att, i) => (
                                                                <a
                                                                    key={i}
                                                                    href={att.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border rounded-lg text-xs font-medium text-gray-800 flex items-center gap-1.5 transition-colors"
                                                                >
                                                                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                                                                    <span>উত্তরপত্র #{i + 1}</span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-400">কোনো ফাইল আপলোড করেননি।</p>
                                                    )}

                                                    {/* Teacher Feedback / Marks */}
                                                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs flex justify-between items-center">
                                                        <div>
                                                            <span className="text-gray-500">শিক্ষকের মূল্যায়ন মার্কস: </span>
                                                            <strong className="text-indigo-900">{q.marks_obtained} / {q.marks}</strong>
                                                        </div>
                                                        {q.teacher_feedback && (
                                                            <div className="text-gray-700 italic">
                                                                "{q.teacher_feedback}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Explanation if present */}
                                            {q.explanation && (
                                                <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-950 space-y-1">
                                                    <div className="font-bold flex items-center gap-1.5 text-sky-800">
                                                        <HelpCircle className="h-3.5 w-3.5" />
                                                        ব্যাখ্যা ও সমাধান:
                                                    </div>
                                                    <div className="leading-relaxed">
                                                        <MathView content={q.explanation} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between shrink-0 mt-2">
                            <span className="text-xs text-gray-400">
                                মনোলগ এডু এক্সামিনেশন সিস্টেম
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>PDF ডাউনলোড / প্রিন্ট</span>
                                </button>
                                <button
                                    onClick={() => setReviewModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
                                >
                                    বন্ধ করুন
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

