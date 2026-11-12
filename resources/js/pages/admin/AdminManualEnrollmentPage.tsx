import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiClient } from '../../api/client';
import {
    BookOpen,
    Layers,
    Users,
    Search,
    UserCheck,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Loader2,
    ChevronRight,
    ArrowLeft,
    Phone,
    Mail,
    Send,
    FileText,
    History,
    Sparkles,
    Check,
    RotateCcw,
    UserX,
    Filter,
    Clock,
    Shield,
    Package,
    Tag,
    X
} from 'lucide-react';

export interface TargetOption {
    id: number;
    type: 'course' | 'bundle';
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    regular_price: number;
    sale_price?: number | null;
    status: string;
    category?: { id: number; name: string } | null;
    courses_count?: number;
    courses?: { id: number; title: string }[];
    enrollments_count?: number;
}

export interface UserCandidate {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    role: string;
    status: string;
    is_enrolled?: boolean;
}

export interface EnrollmentHistoryItem {
    id: number;
    order_number: string;
    final_amount: number;
    payment_method: string;
    notes?: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        phone?: string | null;
        email?: string | null;
    } | null;
    course?: {
        id: number;
        title: string;
        slug: string;
        thumbnail?: string | null;
    } | null;
    bundle?: {
        id: number;
        title: string;
        slug: string;
        thumbnail?: string | null;
    } | null;
}

export const AdminManualEnrollmentPage: React.FC = () => {
    const [activeView, setActiveView] = useState<'enroll' | 'history'>('enroll');

    // Step state
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // Targets (courses + bundles)
    const [targets, setTargets] = useState<TargetOption[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState<TargetOption | null>(null);
    const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | 'course' | 'bundle'>('all');
    const [targetSearch, setTargetSearch] = useState('');

    // Student Search & Add
    const [addMode, setAddMode] = useState<'search' | 'bulk'>('search');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [userSearchResults, setUserSearchResults] = useState<UserCandidate[]>([]);
    const searchTimeoutRef = useRef<any>(null);

    // Bulk phone numbers
    const [bulkPhonesInput, setBulkPhonesInput] = useState('');
    const [parsingBulk, setParsingBulk] = useState(false);
    const [unmatchedPhones, setUnmatchedPhones] = useState<string[]>([]);

    // Queued students for enrollment
    const [queuedStudents, setQueuedStudents] = useState<UserCandidate[]>([]);

    // Enrollment options
    const [sendSms, setSendSms] = useState(true);
    const [enrollmentNotes, setEnrollmentNotes] = useState('');
    const [enrolling, setEnrolling] = useState(false);

    // Success result modal
    const [enrollResult, setEnrollResult] = useState<{
        message: string;
        target?: {
            id: number;
            type: 'course' | 'bundle';
            title: string;
        };
        enrolled_count: number;
        already_enrolled_count: number;
        failed_count: number;
        enrolled: any[];
        already_enrolled: any[];
        failed: any[];
    } | null>(null);

    // History data
    const [historyItems, setHistoryItems] = useState<EnrollmentHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotal, setHistoryTotal] = useState(0);

    // Fetch targets on mount
    useEffect(() => {
        fetchTargets();
    }, []);

    // Fetch history when activeView changes to history
    useEffect(() => {
        if (activeView === 'history') {
            fetchHistory();
        }
    }, [activeView, historyPage]);

    const fetchTargets = async () => {
        setLoadingTargets(true);
        try {
            const { data } = await apiClient.get('/admin/manual-enrollment/targets');
            const list: TargetOption[] = data.targets || data.courses || [];
            setTargets(list);
        } catch (err: any) {
            console.error('Failed to load courses & bundles', err);
        } finally {
            setLoadingTargets(false);
        }
    };

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const { data } = await apiClient.get('/admin/manual-enrollment/history', {
                params: { page: historyPage, per_page: 15 }
            });
            setHistoryItems(data.data || []);
            setHistoryTotal(data.total || 0);
        } catch (err: any) {
            console.error('Failed to load history', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Instant filter targets
    const filteredTargets = useMemo(() => {
        return targets.filter((t) => {
            if (targetTypeFilter !== 'all' && t.type !== targetTypeFilter) {
                return false;
            }

            const q = targetSearch.trim().toLowerCase();
            if (!q) return true;

            const titleMatch = t.title ? t.title.toLowerCase().includes(q) : false;
            const catMatch = t.category?.name ? t.category.name.toLowerCase().includes(q) : false;
            const slugMatch = t.slug ? t.slug.toLowerCase().includes(q) : false;
            const subCourseMatch =
                t.type === 'bundle' && t.courses
                    ? t.courses.some((sc) => sc.title.toLowerCase().includes(q))
                    : false;

            return titleMatch || catMatch || slugMatch || subCourseMatch;
        });
    }, [targets, targetTypeFilter, targetSearch]);

    const coursesCount = useMemo(() => targets.filter((t) => t.type === 'course').length, [targets]);
    const bundlesCount = useMemo(() => targets.filter((t) => t.type === 'bundle').length, [targets]);

    // Live search users
    const handleUserSearchChange = (query: string) => {
        setUserSearchQuery(query);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!query.trim() || query.trim().length < 2) {
            setUserSearchResults([]);
            return;
        }

        setSearchingUsers(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const { data } = await apiClient.get('/admin/manual-enrollment/search-users', {
                    params: {
                        q: query.trim(),
                        target_type: selectedTarget?.type || 'course',
                        target_id: selectedTarget?.id,
                        course_id: selectedTarget?.id // fallback backwards compatibility
                    }
                });
                setUserSearchResults(data.users || []);
            } catch (err) {
                console.error(err);
            } finally {
                setSearchingUsers(false);
            }
        }, 250);
    };

    // Add user from live search results
    const handleAddUserToQueue = (candidate: UserCandidate) => {
        if (queuedStudents.some((s) => s.id === candidate.id)) {
            alert(`${candidate.name} ইতিমধ্যে তালিকায় যোগ করা হয়েছে।`);
            return;
        }
        setQueuedStudents((prev) => [...prev, candidate]);
        setUserSearchQuery('');
        setUserSearchResults([]);
    };

    // Parse and verify bulk phone numbers
    const handleVerifyBulkPhones = async () => {
        if (!bulkPhonesInput.trim()) {
            alert('অনুগ্রহ করে এক বা একাধিক ফোন নম্বর লিখুন বা পেস্ট করুন।');
            return;
        }

        setParsingBulk(true);
        setUnmatchedPhones([]);

        try {
            const { data } = await apiClient.post('/admin/manual-enrollment/lookup-phones', {
                phones: bulkPhonesInput,
                target_type: selectedTarget?.type || 'course',
                target_id: selectedTarget?.id,
                course_id: selectedTarget?.id
            });

            const matched: UserCandidate[] = data.matched_users || [];
            const unmatched: string[] = data.unmatched_phones || [];

            setUnmatchedPhones(unmatched);

            if (matched.length > 0) {
                setQueuedStudents((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const newStudents = matched.filter((m) => !existingIds.has(m.id));
                    return [...prev, ...newStudents];
                });
            }

            if (matched.length === 0 && unmatched.length > 0) {
                alert('প্রদত্ত নম্বরগুলোর কোনোটির সাথে রেজিস্ট্রার্ড কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'ফোন নম্বর যাচাইয়ে সমস্যা হয়েছে।');
        } finally {
            setParsingBulk(false);
        }
    };

    // Remove candidate from queue
    const handleRemoveFromQueue = (userId: number) => {
        setQueuedStudents((prev) => prev.filter((s) => s.id !== userId));
    };

    // Clear entire queue
    const handleClearQueue = () => {
        if (queuedStudents.length === 0) return;
        if (window.confirm('আপনি কি তালিকা থেকে সকল শিক্ষার্থী সরাতে চান?')) {
            setQueuedStudents([]);
            setUnmatchedPhones([]);
        }
    };

    // Perform enrollment
    const handleEnrollSubmit = async () => {
        if (!selectedTarget) {
            alert('অনুগ্রহ করে প্রথমে কোর্স বা বান্ডেল নির্বাচন করুন।');
            return;
        }

        if (queuedStudents.length === 0) {
            alert('এনরোল করার জন্য অন্তত একজন শিক্ষার্থী নির্বাচন করুন।');
            return;
        }

        const readyStudents = queuedStudents.filter((s) => !s.is_enrolled);
        const alreadyEnrolledCount = queuedStudents.filter((s) => s.is_enrolled).length;

        if (readyStudents.length === 0) {
            alert(
                selectedTarget.type === 'bundle'
                    ? 'নির্বাচিত সকল শিক্ষার্থী ইতিমধ্যে এই বান্ডেলে এনরোল্ড রয়েছেন।'
                    : 'নির্বাচিত সকল শিক্ষার্থী ইতিমধ্যে এই কোর্সে এনরোল্ড রয়েছেন।'
            );
            return;
        }

        const typeLabel = selectedTarget.type === 'bundle' ? 'বান্ডেল' : 'কোর্স';
        let confirmMsg = `আপনি কি ${readyStudents.length} জন শিক্ষার্থীকে "${selectedTarget.title}" ${typeLabel}-এ ম্যানুয়ালি এনরোল করাতে চান?`;
        if (selectedTarget.type === 'bundle') {
            confirmMsg += `\n(শিক্ষার্থীরা এই বান্ডেলের অন্তর্গত সকল ${selectedTarget.courses_count || selectedTarget.courses?.length || ''} টি কোর্সে পূর্ণ অ্যাক্সেস পাবেন)`;
        }
        if (alreadyEnrolledCount > 0) {
            confirmMsg += `\n(${alreadyEnrolledCount} জন শিক্ষার্থী ইতিমধ্যে এনরোল্ড থাকায় তাদের বাদ রাখা হবে)`;
        }

        if (!window.confirm(confirmMsg)) return;

        setEnrolling(true);
        try {
            const { data } = await apiClient.post('/admin/manual-enrollment/enroll', {
                target_type: selectedTarget.type,
                target_id: selectedTarget.id,
                course_id: selectedTarget.id, // fallback backwards compatibility
                user_ids: readyStudents.map((s) => s.id),
                send_sms: sendSms,
                notes: enrollmentNotes.trim() || undefined
            });

            setEnrollResult(data);
            setQueuedStudents([]);
            setBulkPhonesInput('');
            setUnmatchedPhones([]);
            setEnrollmentNotes('');
            // refresh targets
            fetchTargets();
        } catch (err: any) {
            alert(err.response?.data?.message || 'এনরোলমেন্ট সম্পন্ন করতে সমস্যা হয়েছে।');
        } finally {
            setEnrolling(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Top Navigation & Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black shadow-xs">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                ম্যানুয়াল এনরোলমেন্ট (Manual Enrollment)
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                কোর্স বা বান্ডেল নির্বাচন করে শিক্ষার্থী বা একাধিক ফোন নম্বর দিয়ে নিমেষেই ব্যাচে এনরোল করান
                            </p>
                        </div>
                    </div>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setActiveView('enroll')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeView === 'enroll'
                                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>নতুন এনরোলমেন্ট</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveView('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeView === 'history'
                                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" />
                        <span>এনরোলমেন্ট হিস্ট্রি</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: NEW MANUAL ENROLLMENT FLOW */}
            {activeView === 'enroll' && (
                <div className="space-y-6">
                    {/* Stepper Progress Bar */}
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            onClick={() => setCurrentStep(1)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                                currentStep === 1
                                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 ring-2 ring-sky-500/20'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                        >
                            <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                    selectedTarget
                                        ? 'bg-emerald-500 text-white'
                                        : currentStep === 1
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-slate-100 text-slate-500'
                                }`}
                            >
                                {selectedTarget ? <Check className="w-4 h-4" /> : '১'}
                            </div>
                            <div className="truncate">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ধাপ ১</div>
                                <div className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">
                                    {selectedTarget
                                        ? `${selectedTarget.type === 'bundle' ? '📦 ' : '📚 '}${selectedTarget.title}`
                                        : 'কোর্স বা বান্ডেল নির্বাচন করুন'}
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => {
                                if (selectedTarget) setCurrentStep(2);
                                else alert('অনুগ্রহ করে প্রথমে একটি কোর্স বা বান্ডেল নির্বাচন করুন।');
                            }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                                currentStep === 2
                                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 ring-2 ring-sky-500/20'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            } ${!selectedTarget ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300'}`}
                        >
                            <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                    currentStep === 2 ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}
                            >
                                {'২'}
                            </div>
                            <div className="truncate">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ধাপ ২</div>
                                <div className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">
                                    শিক্ষার্থী যোগ ও এনরোল ({queuedStudents.length})
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STEP 1: SELECT COURSE OR BUNDLE */}
                    {currentStep === 1 && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-sky-600" />
                                        <span>কোন কোর্স বা বান্ডেলে শিক্ষার্থী এনরোল করাতে চান?</span>
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        যেটিতে শিক্ষার্থীদের ফ্রি বা সরাসরি অ্যাক্সেস দিতে চান সেটি সিলেক্ট করুন
                                    </p>
                                </div>

                                {/* Instant Live Search Box */}
                                <div className="relative w-full sm:w-80">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={targetSearch}
                                        onChange={(e) => setTargetSearch(e.target.value)}
                                        placeholder="১-২ অক্ষর লিখলেই কোর্স/বান্ডেল চলে আসবে..."
                                        className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
                                        autoFocus
                                    />
                                    {targetSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setTargetSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Filter Pills: All, Courses, Bundles */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTargetTypeFilter('all')}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                            targetTypeFilter === 'all'
                                                ? 'bg-sky-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                        }`}
                                    >
                                        <span>সব দেখুন</span>
                                        <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">
                                            {targets.length}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTargetTypeFilter('course')}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                            targetTypeFilter === 'course'
                                                ? 'bg-sky-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                        }`}
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>কোর্সসমূহ</span>
                                        <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">
                                            {coursesCount}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTargetTypeFilter('bundle')}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                            targetTypeFilter === 'bundle'
                                                ? 'bg-purple-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                        }`}
                                    >
                                        <Package className="w-3.5 h-3.5" />
                                        <span>বান্ডেলসমূহ</span>
                                        <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">
                                            {bundlesCount}
                                        </span>
                                    </button>
                                </div>

                                <div className="text-[11px] text-slate-400 font-medium">
                                    মোট {filteredTargets.length} টি ফলাফল পাওয়া গেছে
                                </div>
                            </div>

                            {loadingTargets ? (
                                <div className="p-12 text-center space-y-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
                                    <p className="text-xs text-slate-500 font-semibold">কোর্স ও বান্ডেল লোড হচ্ছে...</p>
                                </div>
                            ) : filteredTargets.length === 0 ? (
                                <div className="p-12 text-center space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                        "{targetSearch}" দিয়ে কোনো কোর্স বা বান্ডেল পাওয়া যায়নি
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTargetSearch('');
                                            setTargetTypeFilter('all');
                                        }}
                                        className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                                    >
                                        সার্চ রিসেট করুন
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
                                    {filteredTargets.map((item) => {
                                        const isSelected =
                                            selectedTarget?.id === item.id && selectedTarget?.type === item.type;
                                        const isBundle = item.type === 'bundle';

                                        return (
                                            <div
                                                key={`${item.type}-${item.id}`}
                                                onClick={() => setSelectedTarget(item)}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                                    isSelected
                                                        ? isBundle
                                                            ? 'bg-purple-50/70 dark:bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                                                            : 'bg-sky-50/70 dark:bg-sky-950/50 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                                                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 hover:bg-white dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <div className="flex gap-3.5 items-start">
                                                    <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                                                        {item.thumbnail ? (
                                                            <img
                                                                src={item.thumbnail}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : isBundle ? (
                                                            <Package className="w-7 h-7 text-purple-500" />
                                                        ) : (
                                                            <BookOpen className="w-7 h-7 text-sky-500" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                            {isBundle ? (
                                                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                                                                    <Package className="w-3 h-3" />
                                                                    <span>
                                                                        বান্ডেল ({item.courses_count || item.courses?.length || 0}{' '}
                                                                        কোর্স)
                                                                    </span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 truncate max-w-[120px]">
                                                                    {item.category?.name || 'কোর্স'}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                <span>{item.enrollments_count || 0}</span>
                                                            </span>
                                                        </div>

                                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                                                            {item.title}
                                                        </h4>
                                                    </div>
                                                </div>

                                                {/* Bundle Courses Preview */}
                                                {isBundle && item.courses && item.courses.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1 flex items-center gap-1">
                                                            <Layers className="w-3 h-3 text-purple-500" />
                                                            <span>অন্তর্ভুক্ত কোর্সসমূহ:</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.courses.slice(0, 2).map((subC) => (
                                                                <span
                                                                    key={subC.id}
                                                                    className="px-1.5 py-0.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] rounded border border-slate-200 dark:border-slate-600 truncate max-w-[130px]"
                                                                >
                                                                    {subC.title}
                                                                </span>
                                                            ))}
                                                            {item.courses.length > 2 && (
                                                                <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 text-[10px] rounded font-bold">
                                                                    +{item.courses.length - 2} আরও
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Card Footer: Price & Selection Tick */}
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className={`text-xs font-black ${
                                                                isBundle
                                                                    ? 'text-purple-600 dark:text-purple-400'
                                                                    : 'text-sky-600 dark:text-sky-400'
                                                            }`}
                                                        >
                                                            ৳{item.price}
                                                        </span>
                                                        {item.sale_price !== null &&
                                                            item.regular_price > item.price && (
                                                                <span className="text-[10px] text-slate-400 line-through">
                                                                    ৳{item.regular_price}
                                                                </span>
                                                            )}
                                                    </div>

                                                    <div
                                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                                            isSelected
                                                                ? isBundle
                                                                    ? 'bg-purple-600 text-white'
                                                                    : 'bg-sky-600 text-white'
                                                                : 'border border-slate-300 dark:border-slate-600 text-transparent'
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="w-3 h-3" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Continue to Step 2 Button */}
                            {selectedTarget && (
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                        <span>নির্বাচিত {selectedTarget.type === 'bundle' ? 'বান্ডেল' : 'কোর্স'}:</span>
                                        <strong className="text-slate-900 dark:text-white font-extrabold flex items-center gap-1">
                                            {selectedTarget.type === 'bundle' ? (
                                                <Package className="w-4 h-4 text-purple-600" />
                                            ) : (
                                                <BookOpen className="w-4 h-4 text-sky-600" />
                                            )}
                                            {selectedTarget.title}
                                        </strong>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(2)}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition cursor-pointer"
                                    >
                                        <span>পরবর্তী ধাপ (শিক্ষার্থী যোগ করুন)</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: ADD STUDENTS & ENROLL */}
                    {currentStep === 2 && selectedTarget && (
                        <div className="space-y-6">
                            {/* Selected Target Summary Banner */}
                            <div
                                className={`text-white rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                    selectedTarget.type === 'bundle'
                                        ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-sky-700'
                                        : 'bg-gradient-to-r from-sky-600 to-indigo-600'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md overflow-hidden shrink-0 border border-white/20 flex items-center justify-center">
                                        {selectedTarget.thumbnail ? (
                                            <img
                                                src={selectedTarget.thumbnail}
                                                alt={selectedTarget.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : selectedTarget.type === 'bundle' ? (
                                            <Package className="w-7 h-7 text-white" />
                                        ) : (
                                            <BookOpen className="w-7 h-7 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-sky-200 uppercase tracking-widest flex items-center gap-1.5">
                                            {selectedTarget.type === 'bundle' ? (
                                                <>
                                                    <Package className="w-3.5 h-3.5 text-amber-300" />
                                                    <span>টার্গেট বান্ডেল (সকল কোর্সে অ্যাক্সেস পাবেন)</span>
                                                </>
                                            ) : (
                                                <>
                                                    <BookOpen className="w-3.5 h-3.5 text-sky-300" />
                                                    <span>টার্গেট কোর্স</span>
                                                </>
                                            )}
                                        </div>
                                        <h3 className="text-base sm:text-lg font-black leading-tight line-clamp-1">
                                            {selectedTarget.title}
                                        </h3>
                                        <div className="text-xs text-white/85 mt-0.5 flex flex-wrap items-center gap-3">
                                            <span>রেগুলার ফি: ৳{selectedTarget.price}</span>
                                            <span>•</span>
                                            <span>পূর্বে এনরোল্ড: {selectedTarget.enrollments_count || 0} জন</span>
                                            {selectedTarget.type === 'bundle' && selectedTarget.courses && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-amber-200 font-bold">
                                                        {selectedTarget.courses.length} টি কোর্স অন্তর্ভুক্ত
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition self-start sm:self-auto cursor-pointer"
                                >
                                    কোর্স/বান্ডেল পরিবর্তন
                                </button>
                            </div>

                            {/* Dual Mode Student Selector (Search vs Bulk Phones) */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Users className="w-5 h-5 text-sky-600" />
                                            <span>শিক্ষার্থী নির্বাচন করুন</span>
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            নাম বা নম্বর দিয়ে সার্চ করে অথবা একসাথে একাধিক নম্বর দিয়ে যুক্ত করুন
                                        </p>
                                    </div>

                                    {/* Mode Toggle */}
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setAddMode('search')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                                addMode === 'search'
                                                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                                                    : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                        >
                                            <Search className="w-3.5 h-3.5" />
                                            <span>লাইভ সার্চ</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAddMode('bulk')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                                addMode === 'bulk'
                                                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                                                    : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                            <span>একাধিক নম্বর (Bulk)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* MODE 1: LIVE SEARCH BY NAME OR PHONE */}
                                {addMode === 'search' && (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={userSearchQuery}
                                                onChange={(e) => handleUserSearchChange(e.target.value)}
                                                placeholder="শিক্ষার্থীর নাম, মোবাইল নম্বর বা ইমেইল লিখুন..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                                            />
                                            {searchingUsers && (
                                                <Loader2 className="w-4 h-4 animate-spin text-sky-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                                            )}
                                        </div>

                                        {/* Search Results Dropdown List */}
                                        {userSearchResults.length > 0 && (
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                                                {userSearchResults.map((cand) => {
                                                    const isAlreadyQueued = queuedStudents.some((s) => s.id === cand.id);
                                                    return (
                                                        <div
                                                            key={cand.id}
                                                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3 transition"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                                    {cand.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                                            {cand.name}
                                                                        </span>
                                                                        {cand.is_enrolled && (
                                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                                                                ইতিমধ্যে এনরোল্ড
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                                                                        {cand.phone && <span>📞 {cand.phone}</span>}
                                                                        {cand.email && <span>✉️ {cand.email}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                disabled={isAlreadyQueued}
                                                                onClick={() => handleAddUserToQueue(cand)}
                                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                                                    isAlreadyQueued
                                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                                                        : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                                                                }`}
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                                <span>{isAlreadyQueued ? 'যোগ করা হয়েছে' : 'তালিকায় যোগ করুন'}</span>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* MODE 2: BULK PHONE NUMBERS ENTRY */}
                                {addMode === 'bulk' && (
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                                কমা (,) অথবা নতুন লাইন দিয়ে মোবাইল নম্বরগুলো পেস্ট করুন:
                                            </label>
                                            <textarea
                                                rows={4}
                                                value={bulkPhonesInput}
                                                onChange={(e) => setBulkPhonesInput(e.target.value)}
                                                placeholder="যেমন: 01711111111, 01822222222, 01933333333 অথবা এক লাইনে একটি করে নম্বর পেস্ট করুন..."
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-sky-500 leading-relaxed"
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <p className="text-[11px] text-slate-500">
                                                * সিস্টেম স্বয়ংক্রিয়ভাবে নম্বরগুলোর ফরম্যাট ঠিক করে ডাটাবেজ থেকে স্টুডেন্ট অ্যাকাউন্ট খুঁজে বের করবে
                                            </p>
                                            <button
                                                type="button"
                                                disabled={parsingBulk || !bulkPhonesInput.trim()}
                                                onClick={handleVerifyBulkPhones}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                                            >
                                                {parsingBulk ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Search className="w-4 h-4" />
                                                )}
                                                <span>{parsingBulk ? 'যাচাই করা হচ্ছে...' : 'নম্বরগুলো যাচাই ও যোগ করুন'}</span>
                                            </button>
                                        </div>

                                        {/* Unmatched Phones Notice */}
                                        {unmatchedPhones.length > 0 && (
                                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2 animate-in fade-in">
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                                    <span>{unmatchedPhones.length} টি নম্বরের সাথে কোনো অ্যাকাউন্ট পাওয়া যায়নি:</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                                    {unmatchedPhones.map((ph, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 text-amber-900 dark:text-amber-200 text-[11px] font-mono font-bold"
                                                        >
                                                            {ph}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                                    এই নম্বরের শিক্ষার্থীদের প্রথমে প্ল্যাটফর্মে রেজিস্টার করতে হবে অথবা 'All Users &gt; Create User' থেকে অ্যাকাউন্ট তৈরি করতে পারেন।
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* QUEUED STUDENTS LIST TABLE */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                এনরোলমেন্টের জন্য নির্বাচিত শিক্ষার্থী ({queuedStudents.length} জন)
                                            </h4>
                                            <p className="text-[11px] text-slate-500">
                                                কনফার্ম করলে নিচের শিক্ষার্থীদের অ্যাকাউন্টে কোর্সের পূর্ণ অ্যাক্সেস চালু হবে
                                            </p>
                                        </div>
                                    </div>

                                    {queuedStudents.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleClearQueue}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer self-start sm:self-auto"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>সব ক্লিয়ার করুন</span>
                                        </button>
                                    )}
                                </div>

                                {queuedStudents.length === 0 ? (
                                    <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                                        <Users className="w-8 h-8 text-slate-400 mx-auto" />
                                        <p className="text-xs font-bold text-slate-500">এখনো কোনো শিক্ষার্থী যুক্ত করা হয়নি।</p>
                                        <p className="text-[11px] text-slate-400">
                                            উপরের সার্চ বক্স বা একাধিক নম্বরের ইনপুট থেকে শিক্ষার্থী যুক্ত করুন।
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                                    <th className="py-2.5 px-3">#</th>
                                                    <th className="py-2.5 px-3">শিক্ষার্থী</th>
                                                    <th className="py-2.5 px-3">মোবাইল নম্বর</th>
                                                    <th className="py-2.5 px-3">ইমেইল</th>
                                                    <th className="py-2.5 px-3">স্ট্যাটাস</th>
                                                    <th className="py-2.5 px-3 text-right">মুছুন</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {queuedStudents.map((cand, idx) => (
                                                    <tr key={cand.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                                        <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                                                        <td className="py-3 px-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                                                    {cand.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="font-bold text-slate-900 dark:text-white">
                                                                    {cand.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                                                            {cand.phone || '—'}
                                                        </td>
                                                        <td className="py-3 px-3 text-slate-500">{cand.email || '—'}</td>
                                                        <td className="py-3 px-3">
                                                            {cand.is_enrolled ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                                                    <AlertTriangle className="w-3 h-3" />
                                                                    <span>ইতিমধ্যে এনরোল্ড</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                                                    <Check className="w-3 h-3" />
                                                                    <span>প্রস্তুত</span>
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveFromQueue(cand.id)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                                                title="তালিকা থেকে মুছুন"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* ENROLLMENT OPTIONS & CONFIRM BUTTON */}
                            {queuedStudents.length > 0 && (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                                            <label className="flex items-center gap-2.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={sendSms}
                                                    onChange={(e) => setSendSms(e.target.checked)}
                                                    className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                                                />
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                    <Send className="w-3.5 h-3.5 text-sky-600" />
                                                    <span>শিক্ষার্থীর ফোনে কনফার্মেশন SMS পাঠান</span>
                                                </span>
                                            </label>
                                            <p className="text-[11px] text-slate-500 pl-7">
                                                এনরোলমেন্ট সফল হলে শিক্ষার্থীর ফোন নম্বরে শুভেচ্ছা বার্তা পাঠানো হবে (যদি SMS ব্যালেন্স থাকে)।
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                অ্যাডমিন রিমার্কস / নোট (ঐচ্ছিক)
                                            </label>
                                            <input
                                                type="text"
                                                value={enrollmentNotes}
                                                onChange={(e) => setEnrollmentNotes(e.target.value)}
                                                placeholder="যেমন: অফিস ক্যাশ পেমেন্ট, স্কলারশিপ বা ব্যাচ নম্বর..."
                                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            মোট এনরোল যোগ্য শিক্ষার্থী:{' '}
                                            <strong className="text-sky-600 font-extrabold">
                                                {queuedStudents.filter((s) => !s.is_enrolled).length} জন
                                            </strong>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={enrolling || queuedStudents.filter((s) => !s.is_enrolled).length === 0}
                                            onClick={handleEnrollSubmit}
                                            className={`inline-flex items-center justify-center gap-2 px-8 py-3 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg transition disabled:opacity-50 cursor-pointer ${
                                                selectedTarget.type === 'bundle'
                                                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-700 hover:to-sky-700 shadow-purple-600/25'
                                                    : 'bg-gradient-to-r from-sky-600 via-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-sky-600/25'
                                            }`}
                                        >
                                            {enrolling ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <UserCheck className="w-4 h-4" />
                                            )}
                                            <span>
                                                {enrolling
                                                    ? 'এনরোল করা হচ্ছে...'
                                                    : `${selectedTarget.type === 'bundle' ? 'বান্ডেল' : 'কোর্স'} এনরোলমেন্ট নিশ্চিত করুন`}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: ENROLLMENT HISTORY */}
            {activeView === 'history' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <History className="w-5 h-5 text-sky-600" />
                                <span>ম্যানুয়াল এনরোলমেন্ট হিস্ট্রি ({historyTotal})</span>
                            </h3>
                            <p className="text-xs text-slate-500">
                                অ্যাডমিন প্যানেল থেকে সম্পন্ন হওয়া অতীতের ম্যানুয়াল এনরোলমেন্টের রেকর্ড
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={fetchHistory}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                            title="রিফ্রেশ"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>

                    {loadingHistory ? (
                        <div className="p-12 text-center space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
                            <p className="text-xs text-slate-500 font-semibold">হিস্ট্রি লোড হচ্ছে...</p>
                        </div>
                    ) : historyItems.length === 0 ? (
                        <div className="p-12 text-center space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <History className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                কোনো ম্যানুয়াল এনরোলমেন্ট রেকর্ড পাওয়া যায়নি
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="py-2.5 px-3">অর্ডার নং</th>
                                        <th className="py-2.5 px-3">শিক্ষার্থী</th>
                                        <th className="py-2.5 px-3">আইটেম (কোর্স/বান্ডেল)</th>
                                        <th className="py-2.5 px-3">রিমার্কস / নোট</th>
                                        <th className="py-2.5 px-3">তারিখ ও সময়</th>
                                        <th className="py-2.5 px-3">স্ট্যাটাস</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {historyItems.map((item) => {
                                        const isBundle = Boolean(item.bundle);
                                        const title = item.bundle?.title || item.course?.title || 'Course';
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                                <td className="py-3 px-3 font-mono font-bold text-sky-600">
                                                    {item.order_number}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {item.user?.name || 'Unknown'}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500">
                                                            {item.user?.phone || item.user?.email || '—'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-1.5">
                                                        {isBundle ? (
                                                            <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px] shrink-0">
                                                                বান্ডেল
                                                            </span>
                                                        ) : (
                                                            <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-[10px] shrink-0">
                                                                কোর্স
                                                            </span>
                                                        )}
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                                                            {title}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                                                    {item.notes || 'Manual admin enrollment'}
                                                </td>
                                                <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                                                    {new Date(item.created_at).toLocaleString('bn-BD', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                        <Check className="w-3 h-3" />
                                                        <span>Active</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* SUCCESS SUMMARY MODAL */}
            {enrollResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
                        <div className="text-center space-y-2">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                এনরোলমেন্ট সফল হয়েছে!
                            </h3>
                            <p className="text-xs text-slate-500">{enrollResult.message}</p>
                        </div>

                        {/* Breakdown summary */}
                        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                            <div>
                                <div className="text-xs text-slate-400">নতুন এনরোল্ড</div>
                                <div className="text-lg font-black text-emerald-600">{enrollResult.enrolled_count}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">পূর্বে এনরোল্ড ছিল</div>
                                <div className="text-lg font-black text-amber-600">{enrollResult.already_enrolled_count}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">ব্যর্থ</div>
                                <div className="text-lg font-black text-rose-600">{enrollResult.failed_count}</div>
                            </div>
                        </div>

                        {/* Enrolled students chips */}
                        {enrollResult.enrolled && enrollResult.enrolled.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                    এনরোল্ড শিক্ষার্থী তালিকা:
                                </div>
                                <div className="max-h-36 overflow-y-auto space-y-1">
                                    {enrollResult.enrolled.map((en, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs"
                                        >
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{en.name}</span>
                                            <span className="font-mono text-slate-500">{en.phone || en.order_number}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-2 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setEnrollResult(null);
                                    setActiveView('history');
                                }}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                হিস্ট্রি দেখুন
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEnrollResult(null);
                                    setCurrentStep(1);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition cursor-pointer"
                            >
                                আরো এনরোল করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminManualEnrollmentPage;
