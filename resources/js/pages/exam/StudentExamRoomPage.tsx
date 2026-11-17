import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Exam, ExamQuestion, ExamSubmission } from '../../types';
import { MathView } from '../../components/shared/MathView';
import {
    Clock,
    Award,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Camera,
    Upload,
    FileText,
    ArrowLeft,
    ArrowRight,
    Send,
    Loader2,
    Trophy,
    Check,
    X,
    MinusCircle,
    Eye,
    RotateCcw,
    Printer,
    Download,
    ClipboardList
} from 'lucide-react';

export const StudentExamRoomPage: React.FC = () => {
    const { examId } = useParams<{ examId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [submission, setSubmission] = useState<ExamSubmission | null>(null);

    // State for student answers: questionId -> { student_answer: string[], attachments: any[] }
    const [answersState, setAnswersState] = useState<Record<number, { student_answer: string[]; attachments: any[] }>>({});

    // Countdown Timer in seconds
    const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(1800);
    const [isTimeUp, setIsTimeUp] = useState(false);

    // Result screen state
    const [resultData, setResultData] = useState<any>(null);
    const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'wrong' | 'skipped'>('all');
    const [uploadingPaperId, setUploadingPaperId] = useState<number | null>(null);

    useEffect(() => {
        startOrResumeExam();
    }, [examId]);

    // Timer interval
    useEffect(() => {
        if (!resultData && timeLeftSeconds > 0) {
            const timer = setInterval(() => {
                setTimeLeftSeconds(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsTimeUp(true);
                        handleAutoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeftSeconds, resultData]);

    const startOrResumeExam = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/student/exams/${examId}/start`);

            if (res.data.already_submitted) {
                // Student already submitted, show results directly
                const sub: ExamSubmission = res.data.submission;
                setExam(res.data.exam);
                setSubmission(sub);
                setResultData({
                    obtained_marks: sub.obtained_marks,
                    total_marks: sub.total_marks,
                    total_questions: sub.total_questions,
                    total_answered: sub.total_answered,
                    total_skipped: sub.total_skipped,
                    total_correct: sub.total_correct,
                    total_wrong: sub.total_wrong,
                    negative_marks_deducted: sub.negative_marks_deducted,
                    merit_position: sub.merit_position,
                    requires_teacher_grading: sub.status === 'submitted',
                });
                return;
            }

            setExam(res.data.exam);
            setQuestions(res.data.questions || []);
            setSubmission(res.data.submission);

            // Calculate remaining time from started_at
            const durationSec = (res.data.exam.duration_minutes || 30) * 60;
            const startedAt = new Date(res.data.submission.started_at).getTime();
            const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
            const remaining = Math.max(0, durationSec - elapsedSec);

            setTimeLeftSeconds(remaining);
            if (remaining === 0) {
                setIsTimeUp(true);
            }

            // Initialize empty answers state
            const initialAns: Record<number, { student_answer: string[]; attachments: any[] }> = {};
            (res.data.questions || []).forEach((q: ExamQuestion) => {
                initialAns[q.id] = { student_answer: [], attachments: [] };
            });
            setAnswersState(initialAns);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to start exam.');
            navigate('/student/my-courses');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (questionId: number, optionId: string, isMultiple: boolean) => {
        const current = answersState[questionId] || { student_answer: [], attachments: [] };

        if (!isMultiple) {
            // Single choice
            setAnswersState({
                ...answersState,
                [questionId]: { ...current, student_answer: [optionId] },
            });
        } else {
            // Multiple choice
            const exists = current.student_answer.includes(optionId);
            const next = exists
                ? current.student_answer.filter(id => id !== optionId)
                : [...current.student_answer, optionId];

            setAnswersState({
                ...answersState,
                [questionId]: { ...current, student_answer: next },
            });
        }
    };

    const handleFillBlankAnswer = (questionId: number, val: string) => {
        const current = answersState[questionId] || { student_answer: [], attachments: [] };
        setAnswersState(prev => ({
            ...prev,
            [questionId]: {
                ...current,
                student_answer: [val],
            },
        }));
    };

    const handleUploadPaperPhoto = async (questionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            setUploadingPaperId(questionId);
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('file', files[i]);

                const res = await apiClient.post('/student/exams/upload-attachment', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const current = answersState[questionId] || { student_answer: [], attachments: [] };
                current.attachments = [...current.attachments, {
                    url: res.data.url,
                    file_name: res.data.file_name,
                    file_type: res.data.file_type,
                }];

                setAnswersState(prev => ({
                    ...prev,
                    [questionId]: { ...current },
                }));
            }
        } catch (err) {
            alert('Failed to upload sheet image. Please try again.');
        } finally {
            setUploadingPaperId(null);
        }
    };

    const removeAttachment = (questionId: number, attachIdx: number) => {
        const current = answersState[questionId];
        if (!current) return;
        const nextAttachments = current.attachments.filter((_, idx) => idx !== attachIdx);
        setAnswersState({
            ...answersState,
            [questionId]: { ...current, attachments: nextAttachments },
        });
    };

    const handleAutoSubmit = () => {
        alert('Your allocated exam time has expired! Your answers are being submitted automatically.');
        submitAnswers();
    };

    const submitAnswers = async () => {
        try {
            setSubmitting(true);
            const answersPayload = Object.entries(answersState).map(([qId, data]) => ({
                question_id: Number(qId),
                student_answer: data.student_answer,
                attachments: data.attachments,
            }));

            const res = await apiClient.post(`/student/exams/${examId}/submit`, {
                answers: answersPayload,
            });

            setSubmission(res.data.submission);
            setResultData(res.data.summary);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to submit exam answers.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
                <p className="text-sm font-medium">Preparing exam room...</p>
            </div>
        );
    }

    // RESULT SCREEN (Instant MCQ evaluation + Merit Position + Complete Question Review)
    if (resultData) {
        const percentage = resultData.total_marks > 0
            ? Math.round((resultData.obtained_marks / resultData.total_marks) * 100)
            : 0;

        const reviewAnswers = (submission?.answers && submission.answers.length > 0)
            ? submission.answers
            : (questions || []).map(q => {
                const ansData = answersState[q.id];
                const studentAns = ansData?.student_answer || [];
                const attachments = ansData?.attachments || [];
                const isAnswered = studentAns.length > 0 || attachments.length > 0;
                const correctAnswers = (q.correct_answers || []).map(String).sort();
                const selectedAnswers = studentAns.map(String).sort();
                const isCorrect = isAnswered && (JSON.stringify(correctAnswers) === JSON.stringify(selectedAnswers));
                return {
                    id: q.id,
                    question_id: q.id,
                    student_answer: studentAns,
                    attachments: attachments,
                    is_correct: isAnswered ? isCorrect : false,
                    marks_obtained: isCorrect ? (q.marks || 1) : 0,
                    question: q,
                };
            });

        const filteredReviewAnswers = reviewAnswers.filter((ans: any) => {
            const studentAnswers: string[] = Array.isArray(ans.student_answer)
                ? ans.student_answer.map(String)
                : (ans.student_answer ? [String(ans.student_answer)] : []);
            const isSkipped = studentAnswers.length === 0 && (!ans.attachments || ans.attachments.length === 0);
            const isCorrect = ans.is_correct === true;
            const isWrong = !isSkipped && ans.is_correct === false;

            if (reviewFilter === 'correct') return isCorrect;
            if (reviewFilter === 'wrong') return isWrong;
            if (reviewFilter === 'skipped') return isSkipped;
            return true;
        });

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 print:p-0 print:bg-white print:min-h-0 text-slate-900 dark:text-white">
                {/* Print Optimization Styles */}
                <style>{`
                    @media print {
                        @page {
                            size: A4;
                            margin: 12mm 10mm 12mm 10mm;
                        }
                        html, body {
                            background: #ffffff !important;
                            color: #0f172a !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .print-break-inside-avoid {
                            break-inside: avoid !important;
                            page-break-inside: avoid !important;
                        }
                    }
                `}</style>

                <div className="max-w-3xl mx-auto space-y-6 print:max-w-none print:w-full print:space-y-4">
                    {/* Print-Only Official Header */}
                    <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900">MONOLOGUE EDU</h1>
                                <p className="text-xs uppercase tracking-widest text-slate-600 font-bold">Online Examination Result & Evaluation Sheet</p>
                            </div>
                            <div className="text-right text-xs text-slate-700">
                                <p className="font-bold text-sm text-slate-900">{exam?.title}</p>
                                <p className="text-slate-500">{new Date(submission?.submitted_at || Date.now()).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50">
                            <div><span className="text-slate-500 block text-[11px]">শিক্ষার্থী:</span><strong className="text-slate-900">{user?.name}</strong></div>
                            <div><span className="text-slate-500 block text-[11px]">রোল নম্বর:</span><strong className="text-slate-900 font-mono">{user?.registration_number || `ME-2026-${user?.id}`}</strong></div>
                            <div><span className="text-slate-500 block text-[11px]">প্রাপ্ত নম্বর:</span><strong className="text-emerald-700">{resultData.obtained_marks} / {resultData.total_marks} ({percentage}%)</strong></div>
                            <div><span className="text-slate-500 block text-[11px]">মেরিট পজিশন:</span><strong className="text-amber-700 font-bold">#{resultData.merit_position}</strong></div>
                        </div>
                    </div>

                    {/* Result Header Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-center relative overflow-hidden print:shadow-none print:border-slate-300 print:rounded-2xl print:p-5 print:mb-4">
                        <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-md print:hidden">
                            <Trophy className="w-10 h-10" />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white print:text-xl">
                            Exam Result
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {exam?.title}
                        </p>

                        {/* Merit Position Badge */}
                        <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-sky-500/10 border border-amber-300 dark:border-amber-800/60 print:bg-amber-50 print:border-amber-300">
                            <Award className="w-5 h-5 text-amber-500" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                Your Rank (Merit Position): <span className="text-amber-600 dark:text-amber-400 text-lg">#{resultData.merit_position}</span>
                            </span>
                        </div>

                        {/* Score Big Display */}
                        <div className="mt-8 py-6 border-y border-slate-100 dark:border-slate-800 flex items-center justify-center gap-8 print:py-3 print:mt-4">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Marks Obtained</p>
                                <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 print:text-2xl">
                                    {resultData.obtained_marks}
                                    <span className="text-lg font-normal text-slate-400 print:text-sm"> / {resultData.total_marks}</span>
                                </p>
                            </div>
                            <div className="h-12 w-px bg-slate-200 dark:bg-slate-800" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Percentage</p>
                                <p className="text-4xl font-extrabold text-sky-600 dark:text-sky-400 mt-1 print:text-2xl">
                                    {percentage}%
                                </p>
                            </div>
                        </div>

                        {/* Written Paper Evaluation Notice */}
                        {resultData.requires_teacher_grading && (
                            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2">
                                <FileText className="w-4 h-4 shrink-0 text-amber-600" />
                                <span>
                                    This exam contains written paper questions. Your final marks and merit rank will be updated after instructor evaluation.
                                </span>
                            </div>
                        )}

                        {/* Detailed Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 print:mt-3">
                            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 print:p-2.5">
                                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Correct Answers</p>
                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 print:text-lg">
                                    {resultData.total_correct}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 print:p-2.5">
                                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">Wrong Answers</p>
                                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-0.5 print:text-lg">
                                    {resultData.total_wrong}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 print:p-2.5">
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Skipped</p>
                                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mt-0.5 print:text-lg">
                                    {resultData.total_skipped}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 print:p-2.5">
                                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Negative Deduction</p>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-0.5 print:text-lg">
                                    -{resultData.negative_marks_deducted}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons (Hidden on Print) */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 print:hidden">
                            <Link
                                to="/student/exams"
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20"
                            >
                                <ClipboardList className="w-4 h-4" />
                                <span>All Exams History & Review</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
                            >
                                <Printer className="w-4 h-4 text-slate-500" />
                                <span>Download PDF / Print</span>
                            </button>
                            <Link
                                to="/student/my-courses"
                                className="px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-semibold transition-all"
                            >
                                Return to Courses
                            </Link>
                        </div>
                    </div>

                    {/* DETAILED QUESTION-BY-QUESTION REVIEW */}
                    <div className="space-y-4 print:space-y-4">
                        {/* Filter Tabs (Hidden on Print) */}
                        <div className="print:hidden flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-sky-500" />
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                    প্রশ্ন ও উত্তর বিশ্লেষণ ({reviewAnswers.length} টি প্রশ্ন)
                                </h3>
                            </div>

                            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setReviewFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        reviewFilter === 'all'
                                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    সব ({reviewAnswers.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReviewFilter('correct')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        reviewFilter === 'correct'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'text-emerald-600 hover:text-emerald-700'
                                    }`}
                                >
                                    সঠিক ({resultData.total_correct || 0})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReviewFilter('wrong')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        reviewFilter === 'wrong'
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : 'text-rose-600 hover:text-rose-700'
                                    }`}
                                >
                                    ভুল ({resultData.total_wrong || 0})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReviewFilter('skipped')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        reviewFilter === 'skipped'
                                            ? 'bg-slate-700 text-white shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    ছেড়ে দেওয়া ({resultData.total_skipped || 0})
                                </button>
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="space-y-4 print:space-y-4">
                            {filteredReviewAnswers.map((ans: any, idx: number) => {
                                const q = ans.question || questions.find(qItem => qItem.id === ans.question_id);
                                if (!q) return null;

                                const studentAnswers: string[] = Array.isArray(ans.student_answer)
                                    ? ans.student_answer.map(String)
                                    : (ans.student_answer ? [String(ans.student_answer)] : []);
                                
                                const isSkipped = studentAnswers.length === 0 && (!ans.attachments || ans.attachments.length === 0);
                                const isCorrect = ans.is_correct === true;
                                const isWrong = !isSkipped && ans.is_correct === false;
                                const correctAnswers: string[] = (q.correct_answers || []).map(String);

                                return (
                                    <div
                                        key={ans.id || q.id || idx}
                                        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs print:border-slate-300 print:shadow-none print:bg-white print:p-4 print:mb-4 print:break-inside-avoid print:page-break-inside-avoid"
                                        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                                    >
                                        {/* Question Header Meta */}
                                        <div className="flex items-center justify-between text-xs mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 print:bg-slate-200">
                                                    প্রশ্ন #{idx + 1}
                                                </span>
                                                <span className="text-slate-400">•</span>
                                                <span className="font-semibold text-slate-500">
                                                    পূর্ণমান: {q.marks || 1}
                                                </span>
                                            </div>

                                            <div>
                                                {isCorrect && (
                                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full text-xs print:bg-emerald-100">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        সঠিক উত্তর (+{ans.marks_obtained})
                                                    </span>
                                                )}
                                                {isWrong && (
                                                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 rounded-full text-xs print:bg-rose-100">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        ভুল উত্তর ({exam?.has_negative_marking ? `-${exam.negative_marks}` : '0'})
                                                    </span>
                                                )}
                                                {isSkipped && (
                                                    <span className="inline-flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-xs print:bg-slate-200">
                                                        <MinusCircle className="w-3.5 h-3.5" />
                                                        উত্তর দেওয়া হয়নি
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Question Text with MathView */}
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed mb-4">
                                            <MathView content={q.question_text} />
                                        </div>

                                        {/* Attachment image if present */}
                                        {q.attachment_url && (
                                            <div className="mb-4">
                                                <img
                                                    src={q.attachment_url}
                                                    alt="Question attachment"
                                                    className="max-h-60 rounded-xl border border-slate-200 dark:border-slate-700 object-contain"
                                                />
                                            </div>
                                        )}

                                        {/* MCQ Options List */}
                                        {(q.question_type === 'single_choice' || q.question_type === 'multiple_choice' || !q.question_type) && q.options && (
                                            <div className="space-y-2 mb-4">
                                                {q.options.map((opt: any) => {
                                                    const optId = String(opt.id ?? opt.key);
                                                    const isCorrectOpt = correctAnswers.includes(optId);
                                                    const isSelected = studentAnswers.includes(optId);

                                                    let optStyle = 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200';
                                                    if (isCorrectOpt) {
                                                        optStyle = 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-semibold';
                                                    } else if (isSelected && !isCorrectOpt) {
                                                        optStyle = 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 font-semibold';
                                                    }

                                                    return (
                                                        <div
                                                            key={optId}
                                                            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${optStyle}`}
                                                        >
                                                            <div className="flex items-center gap-2.5 flex-1 pr-2">
                                                                <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono font-bold flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-200">
                                                                    {optId}
                                                                </span>
                                                                <div className="flex-1">
                                                                    <MathView content={opt.text} inline />
                                                                </div>
                                                            </div>

                                                            <div className="shrink-0 flex items-center gap-1.5">
                                                                {isCorrectOpt && isSelected && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs">
                                                                        <Check className="w-3 h-3" />
                                                                        আপনার সঠিক উত্তর
                                                                    </span>
                                                                )}
                                                                {isCorrectOpt && !isSelected && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold text-[10px] flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                                                                        <Check className="w-3 h-3" />
                                                                        সঠিক উত্তর
                                                                    </span>
                                                                )}
                                                                {!isCorrectOpt && isSelected && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs">
                                                                        <X className="w-3 h-3" />
                                                                        আপনার ভুল উত্তর
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Explanation Box */}
                                        {q.explanation && (
                                            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 mt-2">
                                                <span className="font-bold block mb-1 text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                                    <Award className="w-3.5 h-3.5 text-amber-600" />
                                                    ব্যাখ্যা (Explanation):
                                                </span>
                                                <MathView content={q.explanation} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // EXAM TAKING ROOM
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-24">
            {/* Sticky Header with Timer */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-8 py-3.5">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div>
                        <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                            {exam?.title}
                        </h2>
                        <p className="text-xs text-slate-400">
                            Total Questions: {questions.length} • Total Marks: {exam?.total_marks}
                            {exam?.has_negative_marking && ` • Negative Marking: -${exam.negative_marks}`}
                        </p>
                    </div>

                    {/* Timer Badge */}
                    <div className={`px-4 py-1.5 rounded-2xl font-mono text-sm sm:text-base font-bold flex items-center gap-2 border shadow-sm ${
                        timeLeftSeconds < 300
                            ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:border-rose-900 animate-pulse'
                            : 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/60 dark:border-sky-900'
                    }`}>
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{formatTime(timeLeftSeconds)}</span>
                    </div>
                </div>
            </header>

            {/* Questions Container */}
            <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 mt-4">
                {questions.map((q, idx) => {
                    const ans = answersState[q.id] || { student_answer: [], attachments: [] };
                    const isWritten = q.question_type === 'written_paper';
                    const isMultiple = q.question_type === 'multiple_choice';
                    const isFillBlank = q.question_type === 'fill_in_the_blank';

                    return (
                        <div
                            key={q.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4"
                        >
                            {/* Question Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                                        Q{idx + 1}
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                                {isWritten ? 'Written Paper' : isFillBlank ? 'Fill in the Blank' : isMultiple ? 'Multi-select' : 'Single Choice'}
                                            </span>
                                            <span className="text-xs font-bold text-emerald-600">
                                                [{q.marks} Marks]
                                            </span>
                                        </div>
                                        <MathView
                                            content={q.question_text}
                                            className="text-base font-semibold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Question Attachment Image */}
                            {q.attachment_url && (
                                <div className="pl-11">
                                    <img
                                        src={q.attachment_url}
                                        alt="Question diagram"
                                        className="max-h-60 rounded-xl border border-slate-200 dark:border-slate-800 object-contain"
                                    />
                                </div>
                            )}

                            {/* Fill in the Blanks Answer Input */}
                            {isFillBlank && (
                                <div className="pl-0 sm:pl-11 space-y-2 pt-1">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Type missing word or answer:
                                    </label>
                                    <input
                                        type="text"
                                        value={ans.student_answer?.[0] || ''}
                                        onChange={e => handleFillBlankAnswer(q.id, e.target.value)}
                                        placeholder="Type answer here..."
                                        className="w-full sm:max-w-md px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:border-sky-500 focus:outline-none dark:text-white transition-colors"
                                    />
                                </div>
                            )}

                            {/* MCQ Options List */}
                            {!isWritten && !isFillBlank && q.options && (
                                <div className="pl-0 sm:pl-11 space-y-2.5 pt-1">
                                    {q.options.map((opt, oIdx) => {
                                        const isChecked = ans.student_answer.includes(opt.id);
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => handleSelectOption(q.id, opt.id, isMultiple)}
                                                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left text-sm font-medium transition-all ${
                                                    isChecked
                                                        ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-950 dark:text-sky-200 ring-2 ring-sky-500/20'
                                                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                                }`}
                                            >
                                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                                    isChecked ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}>
                                                    {String.fromCharCode(65 + oIdx)}
                                                </span>
                                                <MathView content={opt.text} inline className="flex-1" />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Written Paper Answer Upload Area (Photos or PDF) */}
                            {isWritten && (
                                <div className="pl-0 sm:pl-11 space-y-4 pt-1">
                                    <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                                        <p className="font-semibold flex items-center gap-1.5">
                                            <FileText className="w-4 h-4 text-amber-600" />
                                            <span>Written Submission Guidelines:</span>
                                        </p>
                                        <p>
                                            Write your answers clearly on your exam sheets. Then take clear photos with your camera/mobile or upload a PDF document below.
                                        </p>
                                    </div>

                                    {/* Upload and Camera Buttons */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Camera capture button */}
                                        <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all">
                                            <Camera className="w-4 h-4" />
                                            <span>Take Photo</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="hidden"
                                                onChange={e => handleUploadPaperPhoto(q.id, e)}
                                                disabled={uploadingPaperId === q.id}
                                            />
                                        </label>

                                        {/* File upload button */}
                                        <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all">
                                            <Upload className="w-4 h-4 text-slate-500" />
                                            <span>Select Image or PDF Files</span>
                                            <input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                multiple
                                                className="hidden"
                                                onChange={e => handleUploadPaperPhoto(q.id, e)}
                                                disabled={uploadingPaperId === q.id}
                                            />
                                        </label>

                                        {uploadingPaperId === q.id && (
                                            <div className="flex items-center gap-1.5 text-xs text-sky-500">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Uploading...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Uploaded attachments preview */}
                                    {ans.attachments.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-slate-500">Uploaded Sheets ({ans.attachments.length}):</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {ans.attachments.map((file, aIdx) => (
                                                    <div key={aIdx} className="relative group rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                                        {file.file_type === 'pdf' ? (
                                                            <div className="h-28 flex flex-col items-center justify-center p-2 text-center">
                                                                <FileText className="w-8 h-8 text-rose-500" />
                                                                <span className="text-[10px] text-slate-600 truncate mt-1">PDF Page {aIdx + 1}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="h-28">
                                                                <img
                                                                    src={file.url}
                                                                    alt={`Sheet ${aIdx + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAttachment(q.id, aIdx)}
                                                            className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                                                            title="Delete sheet"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                                                            Page {aIdx + 1}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </main>

            {/* Bottom Submit Action Bar */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3.5 px-4 shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        Click submit when you have answered all questions.
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to submit your exam answers? You cannot change your submission once submitted.')) {
                                submitAnswers();
                            }
                        }}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Submit Exam</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

