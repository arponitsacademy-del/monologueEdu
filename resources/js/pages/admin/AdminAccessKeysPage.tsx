import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
    KeyRound, 
    Search, 
    Copy, 
    Check, 
    Users, 
    BookOpen, 
    ArrowLeft, 
    RefreshCw, 
    ShieldCheck, 
    Phone, 
    Mail, 
    ExternalLink, 
    Loader2, 
    AlertCircle, 
    CheckCircle2,
    Sparkles,
    Calendar,
    UserCheck,
    X
} from 'lucide-react';

interface CourseItem {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    price: number;
    status: string;
    enrollments_count: number;
}

interface StudentItem {
    enrollment_id: number;
    user_id: number;
    user: {
        id: number;
        name: string;
        phone: string | null;
        email: string | null;
        registration_number?: string | null;
        status?: string;
    };
    access_key: string;
    enrolled_at: string | null;
    status: string;
}

interface VerificationResult {
    valid: boolean;
    message: string;
    enrollment?: {
        id: number;
        access_key: string;
        status: string;
        enrolled_at: string;
        user: {
            id: number;
            name: string;
            phone: string | null;
            email: string | null;
            registration_number?: string | null;
        };
        course: {
            id: number;
            title: string;
            slug: string;
            thumbnail: string | null;
        };
    };
}

export const AdminAccessKeysPage: React.FC = () => {
    // Courses state
    const [courses, setCourses] = useState<CourseItem[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [courseSearch, setCourseSearch] = useState('');

    // Selected course drill-down state
    const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        current_page: 1,
        last_page: 1,
        per_page: 50
    });

    // Quick verification state
    const [verifyKeyInput, setVerifyKeyInput] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);

    // Copy tracking
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

    // Fetch all courses
    const fetchCourses = async (search = '') => {
        setLoadingCourses(true);
        try {
            const { data } = await apiClient.get('/admin/access-keys/courses', {
                params: { search: search.trim() || undefined }
            });
            setCourses(data.courses || []);
        } catch (err) {
            console.error('Failed to load courses for access keys', err);
        } finally {
            setLoadingCourses(false);
        }
    };

    // Fetch students of selected course
    const fetchCourseStudents = async (courseId: number, page = 1, search = '') => {
        setLoadingStudents(true);
        try {
            const { data } = await apiClient.get(`/admin/access-keys/courses/${courseId}`, {
                params: {
                    page,
                    search: search.trim() || undefined,
                    per_page: 50
                }
            });
            setStudents(data.students || []);
            setPagination(data.pagination || {
                total: 0,
                current_page: 1,
                last_page: 1,
                per_page: 50
            });
            setCurrentPage(page);
        } catch (err) {
            console.error('Failed to load course students', err);
        } finally {
            setLoadingStudents(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    // Course search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCourses(courseSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [courseSearch]);

    // Student search with debounce
    useEffect(() => {
        if (!selectedCourse) return;
        const timer = setTimeout(() => {
            fetchCourseStudents(selectedCourse.id, 1, studentSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [studentSearch]);

    const handleSelectCourse = (course: CourseItem) => {
        setSelectedCourse(course);
        setStudentSearch('');
        setCurrentPage(1);
        fetchCourseStudents(course.id, 1, '');
    };

    const handleBackToCourses = () => {
        setSelectedCourse(null);
        setStudents([]);
        setStudentSearch('');
    };

    const handleCopy = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => {
            setCopiedKey(null);
        }, 2000);
    };

    // Verify key directly
    const handleVerifyKey = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = verifyKeyInput.trim();
        if (!trimmed) return;

        setVerifying(true);
        try {
            const { data } = await apiClient.post('/admin/access-keys/verify', { key: trimmed });
            setVerifyResult({
                valid: data.found ?? true,
                message: data.found ? 'শিক্ষার্থী ও অ্যাক্সেস কি সফলভাবে ভেরিফাই হয়েছে!' : (data.message || 'অ্যাক্সেস কি পাওয়া যায়নি।'),
                enrollment: data.found ? {
                    id: data.enrollment_id,
                    access_key: data.access_key,
                    status: data.status,
                    enrolled_at: data.enrolled_at,
                    user: data.user,
                    course: data.course
                } : undefined
            });
            setShowVerifyModal(true);
        } catch (err: any) {
            setVerifyResult({
                valid: false,
                message: err.response?.data?.message || 'অ্যাক্সেস কি পাওয়া যায়নি অথবা সঠিক নয়।'
            });
            setShowVerifyModal(true);
        } finally {
            setVerifying(false);
        }
    };

    // Regenerate student access key
    const handleRegenerateKey = async (enrollmentId: number) => {
        if (!confirm('আপনি কি এই শিক্ষার্থীর জন্য নতুন অ্যাক্সেস কি তৈরি করতে চান? পূর্বের কি বাতিল হয়ে যাবে।')) {
            return;
        }

        setRegeneratingId(enrollmentId);
        try {
            const { data } = await apiClient.post(`/admin/access-keys/${enrollmentId}/regenerate`);
            if (data.access_key) {
                setStudents(prev => prev.map(s => 
                    s.enrollment_id === enrollmentId 
                        ? { ...s, access_key: data.access_key }
                        : s
                ));
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'অ্যাক্সেস কি তৈরি করতে সমস্যা হয়েছে।');
        } finally {
            setRegeneratingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-600 to-indigo-700 dark:from-slate-900 dark:to-indigo-950 p-6 rounded-2xl text-white shadow-lg">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
                            <KeyRound className="w-6 h-6 text-sky-200" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Access Key (অ্যাক্সেস কি ম্যানেজমেন্ট)</h1>
                    </div>
                    <p className="text-sky-100 text-sm mt-2 max-w-2xl">
                        কোর্সের শিক্ষার্থীদের অ্যাক্সেস কি তালিকা দেখুন, কপি করুন অথবা ফেসবুক গ্রুপ ও প্রাইভেট কমিউনিটিতে রিকোয়েস্ট দেওয়া শিক্ষার্থীর অ্যাক্সেস কি সরাসরি ভেরিফাই করুন।
                    </p>
                </div>
            </div>

            {/* Quick Access Key Verification Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        সরাসরি অ্যাক্সেস কি ভেরিফিকেশন (Quick Key Verifier)
                    </h2>
                </div>
                <form onSubmit={handleVerifyKey} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={verifyKeyInput}
                            onChange={(e) => setVerifyKeyInput(e.target.value.toUpperCase())}
                            placeholder="এখানে অ্যাক্সেস কি পেস্ট করুন (যেমন: MN-ABCD-1234)..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-mono text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={verifying || !verifyKeyInput.trim()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer shrink-0"
                    >
                        {verifying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <UserCheck className="w-4 h-4" />
                        )}
                        <span>ভেরিফাই করুন</span>
                    </button>
                </form>
            </div>

            {/* VIEW 1: SELECTED COURSE DRILL-DOWN */}
            {selectedCourse ? (
                <div className="space-y-6">
                    {/* Top Bar with Back Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={handleBackToCourses}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 font-semibold text-sm transition-all shadow-xs cursor-pointer w-fit"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>সকল কোর্সে ফিরে যান</span>
                        </button>

                        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                            মোট শিক্ষার্থী: <span className="text-slate-900 dark:text-white font-bold">{pagination.total}</span> জন
                        </div>
                    </div>

                    {/* Course Header Banner */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {selectedCourse.thumbnail ? (
                                <img
                                    src={selectedCourse.thumbnail}
                                    alt={selectedCourse.title}
                                    className="w-16 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shrink-0"
                                />
                            ) : (
                                <div className="w-16 h-12 bg-sky-100 dark:bg-sky-950/60 rounded-xl flex items-center justify-center text-sky-600 shrink-0">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {selectedCourse.title}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    কোর্সের প্রতিটি শিক্ষার্থীর জন্য নির্ধারিত স্বয়ংক্রিয় অ্যাক্সেস কি তালিকা নিচে রয়েছে।
                                </p>
                            </div>
                        </div>

                        {/* Search Input for Students */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                placeholder="নাম, ফোন বা কি দিয়ে খুঁজুন..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </div>

                    {/* Students Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                        {loadingStudents ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                                <p className="text-sm font-semibold">শিক্ষার্থীদের অ্যাক্সেস কি লোড হচ্ছে...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="py-20 text-center px-4">
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                                    {studentSearch ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'এই কোর্সে এখনো কোনো শিক্ষার্থী নেই'}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                    {studentSearch ? 'অন্য নাম, মোবাইল নম্বর বা অ্যাক্সেস কি লিখে আবার চেষ্টা করুন।' : 'কোর্সে শিক্ষার্থী এনরোল হলে তাদের অ্যাক্সেস কি স্বয়ংক্রিয়ভাবে তৈরি হবে।'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-850/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                                            <th className="py-3.5 px-4 w-12 text-center">#</th>
                                            <th className="py-3.5 px-4">শিক্ষার্থী (Student)</th>
                                            <th className="py-3.5 px-4">মোবাইল ও ইমেইল</th>
                                            <th className="py-3.5 px-4">অ্যাক্সেস কি (Access Key)</th>
                                            <th className="py-3.5 px-4">এনরোলমেন্ট তারিখ</th>
                                            <th className="py-3.5 px-4 text-right">রিসেন্ট/নতুন কি</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                                        {students.map((student, idx) => {
                                            const serialNo = (currentPage - 1) * pagination.per_page + idx + 1;
                                            const isCopied = copiedKey === student.access_key;

                                            return (
                                                <tr key={student.enrollment_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                                                    <td className="py-3.5 px-4 text-center font-bold text-xs text-slate-400">
                                                        {serialNo}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                                                                {student.user.name?.charAt(0)?.toUpperCase() || 'S'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                                                    {student.user.name}
                                                                </div>
                                                                <div className="text-xs text-slate-400 font-mono">
                                                                    {student.user.registration_number || `ID: #${student.user_id}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="space-y-0.5 text-xs">
                                                            {student.user.phone ? (
                                                                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                                    <span>{student.user.phone}</span>
                                                                </div>
                                                            ) : null}
                                                            {student.user.email ? (
                                                                <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                                                                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                    <span className="truncate">{student.user.email}</span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 px-3 py-1.5 rounded-xl">
                                                            <KeyRound className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                                                            <span className="font-mono font-bold tracking-wider text-sky-700 dark:text-sky-300 text-sm select-all">
                                                                {student.access_key}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopy(student.access_key)}
                                                                className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                                                    isCopied
                                                                        ? 'bg-emerald-600 text-white'
                                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                                }`}
                                                                title="অ্যাক্সেস কি কপি করুন"
                                                            >
                                                                {isCopied ? (
                                                                    <>
                                                                        <Check className="w-3.5 h-3.5" />
                                                                        <span className="text-[11px] font-bold">কপি হয়েছে</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                        <span className="text-[11px]">কপি</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                        {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString('bn-BD', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        }) : '—'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRegenerateKey(student.enrollment_id)}
                                                            disabled={regeneratingId === student.enrollment_id}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                                                            title="নতুন অ্যাক্সেস কি জেনারেট করুন"
                                                        >
                                                            <RefreshCw className={`w-3.5 h-3.5 ${regeneratingId === student.enrollment_id ? 'animate-spin' : ''}`} />
                                                            <span>নতুন কি</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-xs text-slate-500">
                                <div>
                                    পৃষ্ঠা {pagination.current_page} / {pagination.last_page} (মোট {pagination.total} জন)
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={pagination.current_page <= 1}
                                        onClick={() => fetchCourseStudents(selectedCourse.id, pagination.current_page - 1, studentSearch)}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40 cursor-pointer"
                                    >
                                        পূর্ববর্তী
                                    </button>
                                    <button
                                        type="button"
                                        disabled={pagination.current_page >= pagination.last_page}
                                        onClick={() => fetchCourseStudents(selectedCourse.id, pagination.current_page + 1, studentSearch)}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40 cursor-pointer"
                                    >
                                        পরবর্তী
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* VIEW 2: COURSES LIST & SEARCH */
                <div className="space-y-6">
                    {/* Courses Search Bar */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={courseSearch}
                                onChange={(e) => setCourseSearch(e.target.value)}
                                placeholder="কোর্সের নাম দিয়ে খুঁজুন..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            />
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            মোট কোর্স: <span className="text-slate-800 dark:text-slate-200 font-bold">{courses.length}</span> টি
                        </div>
                    </div>

                    {/* Courses Grid */}
                    {loadingCourses ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                            <p className="text-sm font-semibold">কোর্স তালিকা লোড হচ্ছে...</p>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-20 text-center px-4">
                            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                                কোনো কোর্স পাওয়া যায়নি
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                অন্য কোনো নাম লিখে আবার সার্চ করুন।
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {courses.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all flex flex-col"
                                >
                                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
                                        {course.thumbnail ? (
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <BookOpen className="w-10 h-10" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-xs shadow-xs">
                                                {course.status === 'published' ? 'Active' : course.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 text-base">
                                                {course.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                                                <Users className="w-4 h-4 text-sky-500" />
                                                <span>এনরোল্ড শিক্ষার্থী: <strong className="text-slate-800 dark:text-slate-200 font-bold">{course.enrollments_count || 0}</strong> জন</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleSelectCourse(course)}
                                            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white dark:bg-slate-800 dark:hover:bg-sky-600 dark:text-sky-300 dark:hover:text-white font-bold text-xs transition-all cursor-pointer"
                                        >
                                            <KeyRound className="w-4 h-4" />
                                            <span>শিক্ষার্থী ও অ্যাক্সেস কি তালিকা</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Verification Result Modal */}
            {showVerifyModal && verifyResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className={`p-5 flex items-center justify-between text-white ${
                            verifyResult.valid ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}>
                            <div className="flex items-center gap-2.5">
                                {verifyResult.valid ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                    <AlertCircle className="w-6 h-6" />
                                )}
                                <h3 className="font-bold text-base">
                                    {verifyResult.valid ? 'সঠিক অ্যাক্সেস কি (Valid Access Key)' : 'অকার্যকর অ্যাক্সেস কি (Invalid)'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowVerifyModal(false)}
                                className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {verifyResult.message}
                            </p>

                            {verifyResult.enrollment && (
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                        <span className="text-xs text-slate-500">অ্যাক্সেস কি:</span>
                                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                                            {verifyResult.enrollment.access_key}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-400">শিক্ষার্থীর নাম:</div>
                                        <div className="font-bold text-slate-900 dark:text-white text-base">
                                            {verifyResult.enrollment.user.name}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-slate-400">মোবাইল: </span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {verifyResult.enrollment.user.phone || '—'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">ইমেইল: </span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {verifyResult.enrollment.user.email || '—'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                                        <div className="text-xs text-slate-400">কোর্সের নাম:</div>
                                        <div className="font-bold text-sky-700 dark:text-sky-300 text-sm mt-0.5">
                                            {verifyResult.enrollment.course.title}
                                        </div>
                                    </div>

                                    <div className="text-xs text-slate-500 pt-1">
                                        এনরোলমেন্ট তারিখ: {new Date(verifyResult.enrollment.enrolled_at).toLocaleDateString('bn-BD', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowVerifyModal(false)}
                                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm cursor-pointer"
                            >
                                বন্ধ করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
