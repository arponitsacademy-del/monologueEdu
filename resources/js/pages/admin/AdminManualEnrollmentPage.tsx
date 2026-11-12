import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import {
    BookOpen,
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
    Shield
} from 'lucide-react';

interface CourseOption {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    discount_price?: number | null;
    status: string;
    category?: { id: number; name: string } | null;
    enrollments_count?: number;
}

interface UserCandidate {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    role: string;
    status: string;
    is_enrolled?: boolean;
}

interface EnrollmentHistoryItem {
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
}

export const AdminManualEnrollmentPage: React.FC = () => {
    const [activeView, setActiveView] = useState<'enroll' | 'history'>('enroll');

    // Step state
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // Courses data
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null);
    const [courseSearch, setCourseSearch] = useState('');

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

    // Fetch courses on mount
    useEffect(() => {
        fetchCourses();
    }, []);

    // Fetch history when activeView changes to history
    useEffect(() => {
        if (activeView === 'history') {
            fetchHistory();
        }
    }, [activeView, historyPage]);

    const fetchCourses = async () => {
        setLoadingCourses(true);
        try {
            const { data } = await apiClient.get('/admin/manual-enrollment/courses');
            setCourses(data.courses || []);
        } catch (err: any) {
            console.error('Failed to load courses', err);
        } finally {
            setLoadingCourses(false);
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
                        course_id: selectedCourse?.id
                    }
                });
                setUserSearchResults(data.users || []);
            } catch (err) {
                console.error(err);
            } finally {
                setSearchingUsers(false);
            }
        }, 300);
    };

    // Add user from live search results
    const handleAddUserToQueue = (candidate: UserCandidate) => {
        if (queuedStudents.some(s => s.id === candidate.id)) {
            alert(`${candidate.name} ইতিমধ্যে তালিকায় যোগ করা হয়েছে।`);
            return;
        }
        setQueuedStudents(prev => [...prev, candidate]);
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
                course_id: selectedCourse?.id
            });

            const matched: UserCandidate[] = data.matched_users || [];
            const unmatched: string[] = data.unmatched_phones || [];

            setUnmatchedPhones(unmatched);

            if (matched.length > 0) {
                // Add unique new students to queue
                setQueuedStudents(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newStudents = matched.filter(m => !existingIds.has(m.id));
                    return [...prev, ...newStudents];
                });
            }

            if (matched.length === 0 && unmatched.length > 0) {
                alert(`প্রদত্ত নম্বরগুলোর কোনোটির সাথে রেজিস্ট্রার্ড কোনো অ্যাকাউন্ট পাওয়া যায়নি।`);
            } else if (unmatched.length > 0) {
                // Alert partial match
                // Just keeping unmatchedPhones in state is displayed clearly in UI
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'ফোন নম্বর যাচাইয়ে সমস্যা হয়েছে।');
        } finally {
            setParsingBulk(false);
        }
    };

    // Remove candidate from queue
    const handleRemoveFromQueue = (userId: number) => {
        setQueuedStudents(prev => prev.filter(s => s.id !== userId));
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
        if (!selectedCourse) {
            alert('অনুগ্রহ করে প্রথমে কোর্স নির্বাচন করুন।');
            return;
        }

        if (queuedStudents.length === 0) {
            alert('এনরোল করার জন্য অন্তত একজন শিক্ষার্থী নির্বাচন করুন।');
            return;
        }

        const readyStudents = queuedStudents.filter(s => !s.is_enrolled);
        const alreadyEnrolledCount = queuedStudents.filter(s => s.is_enrolled).length;

        if (readyStudents.length === 0) {
            alert('নির্বাচিত সকল শিক্ষার্থী ইতিমধ্যে এই কোর্সে এনরোল্ড রয়েছেন।');
            return;
        }

        let confirmMsg = `আপনি কি ${readyStudents.length} জন শিক্ষার্থীকে "${selectedCourse.title}" কোর্সে ম্যানুয়ালি এনরোল করাতে চান?`;
        if (alreadyEnrolledCount > 0) {
            confirmMsg += `\n(${alreadyEnrolledCount} জন শিক্ষার্থী ইতিমধ্যে এনরোল্ড থাকায় তাদের বাদ রাখা হবে)`;
        }

        if (!window.confirm(confirmMsg)) return;

        setEnrolling(true);
        try {
            const { data } = await apiClient.post('/admin/manual-enrollment/enroll', {
                course_id: selectedCourse.id,
                user_ids: readyStudents.map(s => s.id),
                send_sms: sendSms,
                notes: enrollmentNotes.trim() || undefined,
            });

            setEnrollResult(data);
            setQueuedStudents([]);
            setBulkPhonesInput('');
            setUnmatchedPhones([]);
            setEnrollmentNotes('');
            // refresh course stats
            fetchCourses();
        } catch (err: any) {
            alert(err.response?.data?.message || 'এনরোলমেন্ট সম্পন্ন করতে সমস্যা হয়েছে।');
        } finally {
            setEnrolling(false);
        }
    };

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        (c.category?.name && c.category.name.toLowerCase().includes(courseSearch.toLowerCase()))
    );

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
                                কোর্স নির্বাচন করে সরাসরি শিক্ষার্থী বা একাধিক ফোন নম্বর দিয়ে নিমেষেই ব্যাচে এনরোল করান
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
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                selectedCourse
                                    ? 'bg-emerald-500 text-white'
                                    : currentStep === 1
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-slate-100 text-slate-500'
                            }`}>
                                {selectedCourse ? <Check className="w-4 h-4" /> : '১'}
                            </div>
                            <div className="truncate">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ধাপ ১</div>
                                <div className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">
                                    {selectedCourse ? selectedCourse.title : 'কোর্স নির্বাচন করুন'}
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => {
                                if (selectedCourse) setCurrentStep(2);
                                else alert('অনুগ্রহ করে প্রথমে একটি কোর্স নির্বাচন করুন।');
                            }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                                currentStep === 2
                                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 ring-2 ring-sky-500/20'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            } ${!selectedCourse ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300'}`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                currentStep === 2
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-slate-100 text-slate-500'
                            }`}>
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

                    {/* STEP 1: SELECT COURSE */}
                    {currentStep === 1 && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-sky-600" />
                                        <span>কোন কোর্সে শিক্ষার্থী এনরোল করাতে চান?</span>
                                    </h3>
                                    <p className="text-xs text-slate-500">যে কোর্সে শিক্ষার্থীদের ফ্রি বা সরাসরি অ্যাক্সেস দিতে চান সেটি সিলেক্ট করুন</p>
                                </div>

                                <div className="relative w-full sm:w-72">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={courseSearch}
                                        onChange={(e) => setCourseSearch(e.target.value)}
                                        placeholder="কোর্সের নাম দিয়ে খুঁজুন..."
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>
                            </div>

                            {loadingCourses ? (
                                <div className="p-12 text-center space-y-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
                                    <p className="text-xs text-slate-500 font-semibold">কোর্স লোড হচ্ছে...</p>
                                </div>
                            ) : filteredCourses.length === 0 ? (
                                <div className="p-12 text-center space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">কোনো কোর্স পাওয়া যায়নি</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
                                    {filteredCourses.map((c) => {
                                        const isSelected = selectedCourse?.id === c.id;
                                        return (
                                            <div
                                                key={c.id}
                                                onClick={() => setSelectedCourse(c)}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3.5 items-start ${
                                                    isSelected
                                                        ? 'bg-sky-50/70 dark:bg-sky-950/50 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                                                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 hover:bg-white dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                                                    {c.thumbnail ? (
                                                        <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <BookOpen className="w-6 h-6 text-slate-400" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        {c.category?.name && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 border border-slate-200 dark:border-slate-600 truncate max-w-[120px]">
                                                                {c.category.name}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            <span>{c.enrollments_count || 0}</span>
                                                        </span>
                                                    </div>

                                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                                                        {c.title}
                                                    </h4>

                                                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700">
                                                        <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                                                            ৳{c.discount_price && c.discount_price > 0 ? c.discount_price : c.price}
                                                        </span>
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                                            isSelected ? 'bg-sky-600 text-white' : 'border border-slate-300 text-transparent'
                                                        }`}>
                                                            {isSelected && <Check className="w-3 h-3" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Continue to Step 2 Button */}
                            {selectedCourse && (
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="text-xs text-slate-600 dark:text-slate-300">
                                        নির্বাচিত কোর্স: <strong className="text-slate-900 dark:text-white font-extrabold">{selectedCourse.title}</strong>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(2)}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition cursor-pointer"
                                    >
                                        <span>পরবর্তী ধাপ (শিক্ষার্থী যোগ করুন)</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: ADD STUDENTS & ENROLL */}
                    {currentStep === 2 && selectedCourse && (
                        <div className="space-y-6">
                            {/* Selected Course Summary Banner */}
                            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md overflow-hidden shrink-0 border border-white/20 flex items-center justify-center">
                                        {selectedCourse.thumbnail ? (
                                            <img src={selectedCourse.thumbnail} alt={selectedCourse.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <BookOpen className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-sky-200 uppercase tracking-widest">টার্গেট কোর্স</div>
                                        <h3 className="text-base sm:text-lg font-black leading-tight line-clamp-1">{selectedCourse.title}</h3>
                                        <div className="text-xs text-white/80 mt-0.5">
                                            রেগুলার ফি: ৳{selectedCourse.price} | এনরোল্ড শিক্ষার্থী: {selectedCourse.enrollments_count || 0} জন
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition self-start sm:self-auto cursor-pointer"
                                >
                                    কোর্স পরিবর্তন করুন
                                </button>
                            </div>

                            {/* Dual Mode Student Selector (Search vs Bulk Phones) */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Users className="w-5 h-5 text-sky-600" />
                                            <span>শিক্ষার্থী নির্বাচন করুন</span>
                                        </h3>
                                        <p className="text-xs text-slate-500">নাম বা নম্বর দিয়ে সার্চ করে অথবা একসাথে একাধিক নম্বর দিয়ে যুক্ত করুন</p>
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
                                                    const isAlreadyQueued = queuedStudents.some(s => s.id === cand.id);
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
                                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
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

                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] text-slate-500">
                                                * সিস্টেম স্বয়ংক্রিয়ভাবে নম্বরগুলোর ফরম্যাট ঠিক করে ডাটাবেজ থেকে স্টুডেন্ট অ্যাকাউন্ট খুঁজে বের করবে
                                            </p>
                                            <button
                                                type="button"
                                                disabled={parsingBulk || !bulkPhonesInput.trim()}
                                                onClick={handleVerifyBulkPhones}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition disabled:opacity-50 cursor-pointer"
                                            >
                                                {parsingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
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
                                            <p className="text-[11px] text-slate-500">কনফার্ম করলে নিচের শিক্ষার্থীদের অ্যাকাউন্টে কোর্সের পূর্ণ অ্যাক্সেস চালু হবে</p>
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
                                        <p className="text-[11px] text-slate-400">উপরের সার্চ বক্স বা একাধিক নম্বরের ইনপুট থেকে শিক্ষার্থী যুক্ত করুন।</p>
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
                                                        <td className="py-3 px-3 text-slate-500">
                                                            {cand.email || '—'}
                                                        </td>
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
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
                                    <div className="pt-2 flex items-center justify-between">
                                        <div className="text-xs text-slate-600">
                                            মোট এনরোল যোগ্য শিক্ষার্থী: <strong className="text-sky-600 font-extrabold">{queuedStudents.filter(s => !s.is_enrolled).length} জন</strong>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={enrolling || queuedStudents.filter(s => !s.is_enrolled).length === 0}
                                            onClick={handleEnrollSubmit}
                                            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-600 via-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-sky-600/25 transition disabled:opacity-50 cursor-pointer"
                                        >
                                            {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                            <span>{enrolling ? 'এনরোল করা হচ্ছে...' : 'এনরোলমেন্ট নিশ্চিত করুন'}</span>
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
                            <p className="text-xs text-slate-500">অ্যাডমিন প্যানেল থেকে সম্পন্ন হওয়া অতীতের ম্যানুয়াল এনরোলমেন্টের রেকর্ড</p>
                        </div>
                        <button
                            type="button"
                            onClick={fetchHistory}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
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
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">কোনো ম্যানুয়াল এনরোলমেন্ট রেকর্ড পাওয়া যায়নি</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="py-2.5 px-3">অর্ডার নং</th>
                                        <th className="py-2.5 px-3">শিক্ষার্থী</th>
                                        <th className="py-2.5 px-3">কোর্স</th>
                                        <th className="py-2.5 px-3">রিমার্কস / নোট</th>
                                        <th className="py-2.5 px-3">তারিখ ও সময়</th>
                                        <th className="py-2.5 px-3">স্ট্যাটাস</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {historyItems.map((item) => (
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
                                                <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                                                    {item.course?.title || 'Course'}
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
                                    ))}
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
                            <p className="text-xs text-slate-500">
                                {enrollResult.message}
                            </p>
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
                        {enrollResult.enrolled.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-600">এনরোল্ড শিক্ষার্থী তালিকা:</div>
                                <div className="max-h-36 overflow-y-auto space-y-1">
                                    {enrollResult.enrolled.map((en, idx) => (
                                        <div key={idx} className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-800">{en.name}</span>
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
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
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
