import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
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
    User,
    PlayCircle,
    ArrowRight
} from 'lucide-react';

interface AvailableExam {
    id: number;
    title: string;
    description?: string | null;
    total_marks: number;
    pass_marks: number;
    duration_minutes: number;
    has_negative_marking: boolean;
    negative_marks: number;
    questions_count: number;
    start_time?: string | null;
    end_time?: string | null;
    status: string;
    courses?: { id: number; title: string; slug: string }[];
    course?: { id: number; title: string; slug: string } | null;
    is_open_to_all: boolean;
    is_enrolled: boolean;
    is_upcoming: boolean;
    is_expired: boolean;
    has_submitted: boolean;
    in_progress: boolean;
    submission?: {
        id: number;
        obtained_marks: number;
        total_marks: number;
        status: string;
        submitted_at: string;
    } | null;
}

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
    const [searchParams, setSearchParams] = useSearchParams();

    if (searchParams.get('tab') === 'leaderboard') {
        return <Navigate to="/student/leaderboard" replace />;
    }

    const initialTab = searchParams.get('tab') === 'results' ? 'results' : 'available';
    const [activeTab, setActiveTab] = useState<'available' | 'results'>(initialTab);

    // Available Exams State
    const [availableExams, setAvailableExams] = useState<AvailableExam[]>([]);
    const [loadingAvailable, setLoadingAvailable] = useState(true);
    const [availableSearch, setAvailableSearch] = useState('');
    const [availableFilter, setAvailableFilter] = useState<'all' | 'ready' | 'completed' | 'upcoming'>('all');

    // Submissions State
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
        fetchAvailableExams();
        fetchSubmissions(1);
    }, []);

    const changeTab = (tab: 'available' | 'results') => {
        setActiveTab(tab);
        if (tab === 'results') {
            setSearchParams({ tab: 'results' });
        } else {
            setSearchParams({});
        }
    };

    const fetchAvailableExams = async () => {
        try {
            setLoadingAvailable(true);
            const params: any = {};
            if (availableSearch.trim()) params.search = availableSearch.trim();

            const res = await apiClient.get('/student/exams/available', { params });
            setAvailableExams(res.data.exams || []);
        } catch (err) {
            console.error('Failed to load available exams', err);
        } finally {
            setLoadingAvailable(false);
        }
    };

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

    const handleAvailableSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAvailableExams();
    };

    const handleOpenReviewById = async (submissionId: number) => {
        setReviewModalOpen(true);
        setLoadingReview(true);
        setQuestionFilter('all');

        try {
            const res = await apiClient.get(`/student/exams/submissions/${submissionId}`);
            const data = res.data;
            setReviewExam(data.exam);
            setReviewQuestions(data.questions || []);
            setSelectedSubmission({
                ...data.submission,
                merit_position: data.merit_position,
                total_participants: data.total_participants,
            });
        } catch (err) {
            console.error('Failed to load submission review', err);
        } finally {
            setLoadingReview(false);
        }
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

    // Filter available exams
    const filteredAvailableExams = availableExams.filter((exam) => {
        if (availableSearch.trim()) {
            const query = availableSearch.toLowerCase();
            const matchesTitle = exam.title.toLowerCase().includes(query);
            const matchesDesc = exam.description?.toLowerCase().includes(query);
            const matchesCourse = exam.courses?.some((c) => c.title.toLowerCase().includes(query)) ||
                (exam.course && exam.course.title.toLowerCase().includes(query));
            if (!matchesTitle && !matchesDesc && !matchesCourse) return false;
        }

        if (availableFilter === 'ready') {
            return exam.is_enrolled && !exam.has_submitted && !exam.is_upcoming && !exam.is_expired;
        }
        if (availableFilter === 'completed') {
            return exam.has_submitted;
        }
        if (availableFilter === 'upcoming') {
            return exam.is_upcoming;
        }
        return true;
    });

    const readyExamsCount = availableExams.filter((e) => e.is_enrolled && !e.has_submitted && !e.is_upcoming && !e.is_expired).length;
    const completedExamsCount = availableExams.filter((e) => e.has_submitted).length;
    const upcomingExamsCount = availableExams.filter((e) => e.is_upcoming).length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Print Header (Only visible on paper print / PDF export) */}
            <div className="hidden print:block mb-6 border-b border-gray-300 pb-4 text-center">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">MONOLOGUE EDU</h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">Online Examination Result & Evaluation Sheet</p>
                {selectedSubmission && (
                    <div className="mt-4 grid grid-cols-2 text-left text-xs text-gray-700 border border-gray-300 rounded-lg p-3 bg-gray-50/50">
                        <div>
                            <p><strong>Student Name:</strong> {selectedSubmission.evaluator ? 'Student' : 'User'}</p>
                            <p><strong>Exam Title:</strong> {selectedSubmission.exam?.title}</p>
                            <p><strong>Date:</strong> {new Date(selectedSubmission.submitted_at).toLocaleDateString('en-US')}</p>
                        </div>
                        <div className="text-right">
                            <p><strong>Marks Obtained:</strong> {selectedSubmission.obtained_marks} / {selectedSubmission.total_marks}</p>
                            <p><strong>Rank:</strong> #{selectedSubmission.merit_position} (Total {selectedSubmission.total_participants} candidates)</p>
                            <p><strong>Result:</strong> {selectedSubmission.total_correct} Correct, {selectedSubmission.total_wrong} Wrong, {selectedSubmission.total_skipped} Skipped</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Page Header (Screen only) */}
            <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <ClipboardList className="h-7 w-7 text-indigo-600" />
                        Student Exams & Assessments
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Participate in published examinations, test your knowledge, and review your performance analytics.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs (Screen only) */}
            <div className="print:hidden flex items-center gap-3 border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => changeTab('available')}
                    className={`pb-3.5 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        activeTab === 'available'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <ClipboardList className="w-4 h-4" />
                    <span>Available & Published Exams</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700">
                        {availableExams.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => changeTab('results')}
                    className={`pb-3.5 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        activeTab === 'results'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Award className="w-4 h-4" />
                    <span>My Completed Results</span>
                    {submissions.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gray-100 text-gray-700">
                            {submissions.length}
                        </span>
                    )}
                </button>
            </div>

            {/* AVAILABLE & PUBLISHED EXAMS TAB */}
            {activeTab === 'available' && (
                <div className="space-y-6">
                    {/* Search & Filter Bar */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <form onSubmit={handleAvailableSearchSubmit} className="relative w-full sm:w-96">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={availableSearch}
                                onChange={(e) => setAvailableSearch(e.target.value)}
                                placeholder="Search published exams by title or course..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                        </form>

                        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                            <button
                                type="button"
                                onClick={() => setAvailableFilter('all')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                                    availableFilter === 'all'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                All ({availableExams.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setAvailableFilter('ready')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                                    availableFilter === 'ready'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Ready to Take ({readyExamsCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setAvailableFilter('completed')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                                    availableFilter === 'completed'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Completed ({completedExamsCount})
                            </button>
                            {upcomingExamsCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setAvailableFilter('upcoming')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                                        availableFilter === 'upcoming'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Upcoming ({upcomingExamsCount})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Available Exams Grid */}
                    {loadingAvailable ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center justify-center text-gray-400 shadow-xs">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                            <span className="text-sm font-medium">Loading published exams...</span>
                        </div>
                    ) : filteredAvailableExams.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-xs">
                            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-gray-800">No exams found</h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                {availableSearch
                                    ? 'No published exams match your search criteria.'
                                    : 'There are currently no published exams matching this filter. Check back later or browse courses.'}
                            </p>
                            <Link
                                to="/courses"
                                className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                            >
                                <BookOpen className="h-3.5 w-3.5" />
                                Browse All Courses
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredAvailableExams.map((exam) => {
                                const primaryCourse = exam.courses?.[0] || exam.course;

                                return (
                                    <div
                                        key={exam.id}
                                        className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
                                    >
                                        <div className="p-5 flex-1 flex flex-col">
                                            {/* Badges row */}
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                {primaryCourse ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/80 truncate max-w-[200px]">
                                                        <BookOpen className="w-3 h-3 shrink-0" />
                                                        <span className="truncate">{primaryCourse.title}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/80">
                                                        <Sparkles className="w-3 h-3 shrink-0" />
                                                        Open Assessment
                                                    </span>
                                                )}

                                                {exam.has_submitted ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                                                        <CheckCircle2 className="w-3 h-3" /> Completed
                                                    </span>
                                                ) : exam.in_progress ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 shrink-0">
                                                        <Clock className="w-3 h-3" /> In Progress
                                                    </span>
                                                ) : exam.is_upcoming ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 shrink-0">
                                                        <Calendar className="w-3 h-3" /> Upcoming
                                                    </span>
                                                ) : exam.is_expired ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 shrink-0">
                                                        Expired
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                                        Ready to Take
                                                    </span>
                                                )}
                                            </div>

                                            {/* Exam Title */}
                                            <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1.5">
                                                {exam.title}
                                            </h3>

                                            {exam.description && (
                                                <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                                    {exam.description}
                                                </p>
                                            )}

                                            {/* Exam Meta Info Chips */}
                                            <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-gray-100 text-xs">
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span>{exam.duration_minutes ? `${exam.duration_minutes} Mins` : 'Untimed'}</span>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span>{exam.questions_count} Questions</span>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <Award className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span>Total: <strong>{exam.total_marks}</strong> Marks</span>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    <span>Pass: {exam.pass_marks} Marks</span>
                                                </div>
                                            </div>

                                            {exam.has_negative_marking && exam.negative_marks > 0 && (
                                                <div className="mt-2 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                                    <span>Negative mark: -{exam.negative_marks} per wrong answer</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Footer / Action Button */}
                                        <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-3">
                                            {exam.has_submitted ? (
                                                <>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] text-gray-500 font-medium">Your Score</span>
                                                        <span className="text-sm font-extrabold text-emerald-600">
                                                            {exam.submission?.obtained_marks ?? 0} / {exam.total_marks}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {exam.submission?.id && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenReviewById(exam.submission!.id)}
                                                                className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> Review
                                                            </button>
                                                        )}
                                                        <Link
                                                            to={`/exams/${exam.id}/take`}
                                                            className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl transition-colors shadow-2xs"
                                                        >
                                                            Retake
                                                        </Link>
                                                    </div>
                                                </>
                                            ) : exam.in_progress ? (
                                                <Link
                                                    to={`/exams/${exam.id}/take`}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Resume Exam
                                                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                                                </Link>
                                            ) : exam.is_upcoming ? (
                                                <button
                                                    disabled
                                                    className="w-full py-2.5 px-3 bg-gray-100 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed text-center"
                                                >
                                                    Scheduled for {exam.start_time ? new Date(exam.start_time).toLocaleDateString() : 'Later'}
                                                </button>
                                            ) : exam.is_expired ? (
                                                <button
                                                    disabled
                                                    className="w-full py-2.5 px-3 bg-gray-100 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed text-center"
                                                >
                                                    Assessment Ended
                                                </button>
                                            ) : !exam.is_enrolled ? (
                                                <Link
                                                    to={`/courses/${primaryCourse?.slug || ''}`}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
                                                >
                                                    Enroll Course to Unlock
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </Link>
                                            ) : (
                                                <Link
                                                    to={`/exams/${exam.id}/take`}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm group-hover:bg-indigo-700"
                                                >
                                                    <PlayCircle className="w-4 h-4" />
                                                    Take Exam Now
                                                    <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* MY COMPLETED RESULTS TAB */}
            {activeTab === 'results' && (
                <div className="space-y-6">
                    {/* Overall Student Progress Cards (Screen only) */}
            {progress && (
                <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">Total Exams Taken</span>
                            <ClipboardList className="h-5 w-5 text-indigo-600" />
                        </div>
                        <p className="text-3xl font-extrabold text-gray-900 mt-2">{progress.total_exams} Exams</p>
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                            Questions Attempted: {progress.total_questions_attempted}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">Average Score / Attainment</span>
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-3xl font-extrabold text-emerald-600 mt-2">{progress.overall_percentage}%</p>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Average Marks: <strong className="text-gray-800">{progress.average_score}</strong>
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">Accuracy Rate</span>
                            <Award className="h-5 w-5 text-amber-500" />
                        </div>
                        <p className="text-3xl font-extrabold text-indigo-900 mt-2">{progress.accuracy_rate}%</p>
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1 font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            {progress.accuracy_rate >= 80 ? 'Exceptional Accuracy!' : progress.accuracy_rate >= 50 ? 'Good Progress' : 'More Practice Needed'}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">Correct vs Wrong Answers</span>
                            <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <XCircle className="h-4 w-4 text-rose-500" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-3 mt-2">
                            <span className="text-2xl font-black text-emerald-600">{progress.total_correct}</span>
                            <span className="text-xs text-gray-400">Correct /</span>
                            <span className="text-2xl font-black text-rose-600">{progress.total_wrong}</span>
                            <span className="text-xs text-gray-400">Wrong</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">Total incorrect questions: {progress.total_wrong}</p>
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
                        placeholder="Search by exam title..."
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
                        <option value="">All Exams</option>
                        <option value="evaluated">Evaluated</option>
                        <option value="submitted">Pending Review</option>
                    </select>

                    <button
                        onClick={() => fetchSubmissions(1)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Submissions Table / Cards (Screen only) */}
            <div className="print:hidden bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-16 text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                        <span className="text-sm font-medium">Loading exam history...</span>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-800">No exams found</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            You have not participated in any exams yet or no records match your search criteria.
                        </p>
                        <Link
                            to="/courses"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                        >
                            <BookOpen className="h-4 w-4" />
                            Browse Courses
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase font-semibold text-gray-600">
                                <tr>
                                    <th className="px-6 py-4">Exam Title & Course</th>
                                    <th className="px-6 py-4 text-center">Score</th>
                                    <th className="px-6 py-4 text-center">Rank</th>
                                    <th className="px-6 py-4">Analysis</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Action</th>
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
                                                    Duration: {sub.exam?.duration_minutes} mins • Total Marks: {sub.total_marks}
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
                                                    {percentage}% Score
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs">
                                                    <Award className="h-3.5 w-3.5 text-amber-500" />
                                                    <span>#{sub.merit_position}</span>
                                                    <span className="text-[10px] text-gray-500 font-normal">/ {sub.total_participants} Candidates</span>
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
                                                        {sub.total_skipped} Skipped
                                                    </span>
                                                </div>
                                                {sub.negative_marks_deducted > 0 && (
                                                    <div className="text-[10px] text-rose-500 mt-0.5">
                                                        Negative mark deduction: -{sub.negative_marks_deducted}
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
                                                    {sub.status === 'evaluated' ? 'Evaluated' : 'Pending Review'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {new Date(sub.submitted_at).toLocaleDateString('en-US', {
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
                                                    Review & Answers
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
            </div>
            )}

            {/* REVIEW & ANALYSIS MODAL */}
            {reviewModalOpen && selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-gray-100 pb-4 shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700">
                                        Exam Result & Review
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(selectedSubmission.submitted_at).toLocaleDateString('en-US')}
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
                                    title="Save as PDF or print"
                                >
                                    <Printer className="h-4 w-4 text-slate-600" />
                                    <span>Download PDF / Print</span>
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
                                <span className="text-gray-500 text-[11px] block">Marks Obtained</span>
                                <span className="text-xl font-black text-indigo-950">
                                    {selectedSubmission.obtained_marks} / {selectedSubmission.total_marks}
                                </span>
                            </div>

                            <div>
                                <span className="text-gray-500 text-[11px] block">Rank</span>
                                <span className="text-xl font-black text-amber-600 flex items-center gap-1">
                                    <Award className="h-5 w-5 text-amber-500 inline" />
                                    #{selectedSubmission.merit_position}
                                    <span className="text-xs text-gray-500 font-normal">/ {selectedSubmission.total_participants}</span>
                                </span>
                            </div>

                            <div>
                                <span className="text-gray-500 text-[11px] block">Correct / Wrong</span>
                                <span className="text-base font-bold text-gray-900 mt-0.5 block">
                                    <span className="text-emerald-600 font-black">{selectedSubmission.total_correct}</span> Correct • <span className="text-rose-600 font-black">{selectedSubmission.total_wrong}</span> Wrong
                                </span>
                            </div>

                            <div>
                                <span className="text-gray-500 text-[11px] block">Negative Deduction</span>
                                <span className="text-base font-bold text-rose-600 mt-0.5 block">
                                    -{selectedSubmission.negative_marks_deducted} Marks
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
                                All Questions ({reviewQuestions.length})
                            </button>
                            <button
                                onClick={() => setQuestionFilter('correct')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    questionFilter === 'correct'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-100 text-emerald-700 hover:bg-emerald-50'
                                }`}
                            >
                                Correct ({selectedSubmission.total_correct})
                            </button>
                            <button
                                onClick={() => setQuestionFilter('wrong')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    questionFilter === 'wrong'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-gray-100 text-rose-700 hover:bg-rose-50'
                                }`}
                            >
                                Wrong ({selectedSubmission.total_wrong})
                            </button>
                            <button
                                onClick={() => setQuestionFilter('skipped')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    questionFilter === 'skipped'
                                        ? 'bg-gray-700 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Skipped ({selectedSubmission.total_skipped})
                            </button>
                        </div>

                        {/* Questions Content List (Scrollable) */}
                        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                            {loadingReview ? (
                                <div className="py-16 text-center text-gray-400">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
                                    <p className="text-xs font-medium">Loading question and answer breakdown...</p>
                                </div>
                            ) : filteredQuestions.length === 0 ? (
                                <div className="py-12 text-center text-gray-400">
                                    <CheckCircle2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-xs">No questions found in this category.</p>
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
                                                        Question #{idx + 1}
                                                    </span>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="font-semibold text-gray-600">
                                                        Marks: {q.marks}
                                                    </span>
                                                </div>

                                                <div>
                                                    {isCorrect && (
                                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Correct (+{q.marks_obtained})
                                                        </span>
                                                    )}
                                                    {isWrong && (
                                                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full text-[11px]">
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            Wrong (0)
                                                        </span>
                                                    )}
                                                    {isSkipped && (
                                                        <span className="inline-flex items-center gap-1 font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full text-[11px]">
                                                            <MinusCircle className="h-3.5 w-3.5" />
                                                            Skipped (0)
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
                                                                            Your Correct Answer
                                                                        </span>
                                                                    )}
                                                                    {isCorrectOpt && !isStudentSelected && (
                                                                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 border border-emerald-300">
                                                                            <Check className="h-3 w-3" />
                                                                            Correct Answer
                                                                        </span>
                                                                    )}
                                                                    {!isCorrectOpt && isStudentSelected && (
                                                                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] flex items-center gap-1">
                                                                            <X className="h-3 w-3" />
                                                                            Your Incorrect Answer
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Fill in the Blanks Answer Display */}
                                            {q.question_type === 'fill_in_the_blank' && (
                                                <div className="p-3 bg-white rounded-xl border border-gray-200 mb-3 space-y-2 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-700">Your Answer:</span>
                                                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                                                            q.is_correct
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}>
                                                            {Array.isArray(q.student_answer) ? (q.student_answer.join(', ') || 'No answer provided') : (q.student_answer || 'No answer provided')}
                                                        </span>
                                                        {q.is_correct ? (
                                                            <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                                                                <Check className="h-3 w-3" /> Correct
                                                            </span>
                                                        ) : (
                                                            <span className="text-rose-600 font-bold text-[10px] flex items-center gap-1">
                                                                <X className="h-3 w-3" /> Incorrect
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-700">Accepted Correct Answer(s):</span>
                                                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                                                            {Array.isArray(q.correct_answers) ? q.correct_answers.join(' / ') : q.correct_answers}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Written Paper Answer Attachments */}
                                            {q.question_type === 'written_paper' && (
                                                <div className="space-y-3 p-3 bg-white rounded-xl border border-gray-200 mb-3">
                                                    <span className="text-xs font-bold text-gray-700 block">
                                                        Your Uploaded Answer Sheets / Images:
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
                                                                    <span>Sheet #{i + 1}</span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-400">No files were uploaded.</p>
                                                    )}

                                                    {/* Teacher Feedback / Marks */}
                                                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs flex justify-between items-center">
                                                        <div>
                                                            <span className="text-gray-500">Teacher Evaluated Marks: </span>
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
                                                        Explanation & Solution:
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
                                Monologue Edu Examination System
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Download PDF / Print</span>
                                </button>
                                <button
                                    onClick={() => setReviewModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

