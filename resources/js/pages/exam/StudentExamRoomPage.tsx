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

    // RESULT SCREEN (Instant MCQ evaluation + Merit Position)
    if (resultData) {
        const percentage = resultData.total_marks > 0
            ? Math.round((resultData.obtained_marks / resultData.total_marks) * 100)
            : 0;

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Result Header Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
                        <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-md">
                            <Trophy className="w-10 h-10" />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Exam Result
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {exam?.title}
                        </p>

                        {/* Merit Position Badge */}
                        <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-sky-500/10 border border-amber-300 dark:border-amber-800/60">
                            <Award className="w-5 h-5 text-amber-500" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                Your Rank (Merit Position): <span className="text-amber-600 dark:text-amber-400 text-lg">#{resultData.merit_position}</span>
                            </span>
                        </div>

                        {/* Score Big Display */}
                        <div className="mt-8 py-6 border-y border-slate-100 dark:border-slate-800 flex items-center justify-center gap-8">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Marks Obtained</p>
                                <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                                    {resultData.obtained_marks}
                                    <span className="text-lg font-normal text-slate-400"> / {resultData.total_marks}</span>
                                </p>
                            </div>
                            <div className="h-12 w-px bg-slate-200 dark:bg-slate-800" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Percentage</p>
                                <p className="text-4xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
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
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Correct Answers</p>
                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                                    {resultData.total_correct}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
                                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">Wrong Answers</p>
                                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                                    {resultData.total_wrong}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Skipped</p>
                                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                                    {resultData.total_skipped}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
                                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Negative Deduction</p>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                                    -{resultData.negative_marks_deducted}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <Link
                                to="/student/exams"
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20"
                            >
                                <ClipboardList className="w-4 h-4" />
                                <span>All Exams History & Review</span>
                            </Link>
                            <button
                                onClick={() => window.print()}
                                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
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
                                                {isWritten ? 'Written Paper' : isMultiple ? 'Multi-select' : 'Single Choice'}
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

                            {/* MCQ Options List */}
                            {!isWritten && q.options && (
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

