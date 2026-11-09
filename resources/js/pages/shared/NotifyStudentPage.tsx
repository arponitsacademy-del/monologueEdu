import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
    Megaphone, 
    Send, 
    BookOpen, 
    Package, 
    Users, 
    CheckCircle2, 
    AlertCircle, 
    Bell, 
    Loader2, 
    ExternalLink, 
    Layers, 
    Info, 
    Calendar,
    Search,
    ChevronRight,
    Sparkles
} from 'lucide-react';

interface CourseOption {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string | null;
    direct_students_count: number;
    bundle_students_count: number;
    total_reach_count: number;
    included_in_bundles: { id: number; title: string }[];
}

interface BundleOption {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string | null;
    total_reach_count: number;
    courses_count: number;
}

interface AnnouncementHistoryItem {
    id: string;
    title: string;
    message: string;
    link?: string;
    sender_name: string;
    target_type: 'course' | 'bundle' | 'all';
    target_title: string;
    created_at: string;
    recipients_count: number;
}

interface NotifyStudentPageProps {
    role?: 'admin' | 'teacher';
}

export const NotifyStudentPage: React.FC<NotifyStudentPageProps> = ({ role = 'admin' }) => {
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [bundles, setBundles] = useState<BundleOption[]>([]);
    const [isAdmin, setIsAdmin] = useState(role === 'admin');
    const [totalStudentsCount, setTotalStudentsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Form State
    const [targetType, setTargetType] = useState<'course' | 'bundle' | 'all'>('course');
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('/student');

    // Submission & Feedback
    const [sending, setSending] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // History
    const [history, setHistory] = useState<AnnouncementHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchOptions();
        fetchHistory();
    }, []);

    const fetchOptions = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/announcements/options');
            setCourses(data.courses || []);
            setBundles(data.bundles || []);
            setIsAdmin(data.is_admin ?? (role === 'admin'));
            setTotalStudentsCount(data.total_students_count || 0);

            if (data.courses?.length > 0) {
                setSelectedCourseId(data.courses[0].id);
            }
            if (data.bundles?.length > 0) {
                setSelectedBundleId(data.bundles[0].id);
            }
        } catch (err: any) {
            console.error('Failed to load options', err);
            setErrorMessage('কোর্স ও বান্ডেলের তালিকা লোড করা যায়নি।');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            const { data } = await apiClient.get('/announcements/history');
            setHistory(data.history || []);
        } catch {
            // silent fail
        } finally {
            setLoadingHistory(false);
        }
    };

    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const selectedBundle = bundles.find(b => b.id === selectedBundleId);

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        if (!title.trim()) {
            setErrorMessage('দয়া করে নোটিফিকেশনের শিরোনাম লিখুন।');
            return;
        }

        if (!message.trim()) {
            setErrorMessage('দয়া করে নোটিফিকেশনের বিস্তারিত বার্তা লিখুন।');
            return;
        }

        if (targetType === 'course' && !selectedCourseId) {
            setErrorMessage('দয়া করে একটি কোর্স নির্বাচন করুন।');
            return;
        }

        if (targetType === 'bundle' && !selectedBundleId) {
            setErrorMessage('দয়া করে একটি বান্ডেল নির্বাচন করুন।');
            return;
        }

        const confirmText = targetType === 'course'
            ? `আপনি কি "${selectedCourse?.title}" কোর্সের (এবং অন্তর্ভুক্ত বান্ডেলের) সকল শিক্ষার্থীর কাছে নোটিফিকেশন পাঠাতে চান?`
            : targetType === 'bundle'
                ? `আপনি কি "${selectedBundle?.title}" বান্ডেলের সকল শিক্ষার্থীর কাছে নোটিফিকেশন পাঠাতে চান?`
                : 'আপনি কি প্ল্যাটফর্মের সকল শিক্ষার্থীর কাছে এই নোটিফিকেশন পাঠাতে চান?';

        if (!window.confirm(confirmText)) {
            return;
        }

        try {
            setSending(true);
            const payload = {
                target_type: targetType,
                target_id: targetType === 'course' ? selectedCourseId : targetType === 'bundle' ? selectedBundleId : null,
                title: title.trim(),
                message: message.trim(),
                link: link.trim() || '/student',
            };

            const { data } = await apiClient.post('/announcements/notify-students', payload);

            setSuccessMessage(data.message || 'নোটিফিকেশন সফলভাবে পাঠানো হয়েছে!');
            setTitle('');
            setMessage('');
            setLink('/student');
            fetchHistory();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'নোটিফিকেশন পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                <span className="text-xs font-bold text-slate-500">লোড হচ্ছে...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                স্টুডেন্ট নোটিফিকেশন ও অ্যানাউন্সমেন্ট
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                কোর্স বা বান্ডেল সিলেক্ট করে শিক্ষার্থীদের নোটিফিকেশন বারে সরাসরি বার্তা পাঠান
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                        মোট কোর্স: {courses.length} | বান্ডেল: {bundles.length}
                    </span>
                </div>
            </div>

            {/* Notification Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 7 Cols: Form */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
                    {/* Alerts */}
                    {successMessage && (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                {successMessage}
                            </div>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="text-xs font-bold text-rose-800 dark:text-rose-300">
                                {errorMessage}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSendNotification} className="space-y-6">
                        {/* 1. Target Audience Tabs */}
                        <div className="space-y-2.5">
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                ১. নোটিফিকেশনের লক্ষ্য নির্ধারণ করুন (Target Audience) <span className="text-rose-500">*</span>
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setTargetType('course')}
                                    className={`p-3 rounded-2xl border text-left font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                                        targetType === 'course'
                                            ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                    }`}
                                >
                                    <BookOpen className="w-4 h-4 text-sky-500" />
                                    <span>কোর্স (Course)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setTargetType('bundle')}
                                    className={`p-3 rounded-2xl border text-left font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                                        targetType === 'bundle'
                                            ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                    }`}
                                >
                                    <Package className="w-4 h-4 text-indigo-500" />
                                    <span>বান্ডেল (Bundle)</span>
                                </button>

                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => setTargetType('all')}
                                        className={`p-3 rounded-2xl border text-left font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                                            targetType === 'all'
                                                ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                        }`}
                                    >
                                        <Users className="w-4 h-4 text-emerald-500" />
                                        <span>সকল শিক্ষার্থী</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. Target Dropdown Select */}
                        {targetType === 'course' && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    কোর্স নির্বাচন করুন <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={selectedCourseId || ''}
                                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                                >
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.title} (সরাসরি: {c.direct_students_count} জন | মোট রিচ: {c.total_reach_count} জন)
                                        </option>
                                    ))}
                                </select>

                                {/* Course Bundle Inclusion Notice */}
                                {selectedCourse && (
                                    <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900/40 text-xs space-y-1.5">
                                        <div className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-300">
                                            <Info className="w-4 h-4 text-sky-600 shrink-0" />
                                            <span>স্বয়ংক্রিয় বান্ডেল ডেলিভারি সক্রিয়</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                            এই কোর্সের সক্রিয় শিক্ষার্থীদের সাথে সাথে—যেসব বান্ডেলে এই কোর্সটি অন্তর্ভুক্ত রয়েছে, সেই বান্ডেলের শিক্ষার্থীদের কাছেও স্বয়ংক্রিয়ভাবে নোটিফিকেশন পৌঁছাবে।
                                        </p>
                                        {selectedCourse.included_in_bundles?.length > 0 ? (
                                            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[10px] font-bold text-slate-500">যুক্ত বান্ডেল:</span>
                                                {selectedCourse.included_in_bundles.map(b => (
                                                    <span key={b.id} className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                                                        {b.title}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 block pt-0.5">
                                                (এই কোর্সটি বর্তমানে আলাদা কোনো বান্ডেলে অন্তর্ভুক্ত নেই)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {targetType === 'bundle' && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    বান্ডেল নির্বাচন করুন <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={selectedBundleId || ''}
                                    onChange={(e) => setSelectedBundleId(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                                >
                                    {bundles.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.title} (কোর্স: {b.courses_count}টি | শিক্ষার্থী: {b.total_reach_count} জন)
                                        </option>
                                    ))}
                                </select>

                                {selectedBundle && (
                                    <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs">
                                        <span className="font-bold text-indigo-800 dark:text-indigo-300">
                                            মোট আনুমানিক প্রাপক: {selectedBundle.total_reach_count} জন শিক্ষার্থী
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {targetType === 'all' && (
                            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-600" />
                                <span>প্ল্যাটফর্মের সকল নিবন্ধিত শিক্ষার্থী ({totalStudentsCount} জন) এই বার্তা পাবেন।</span>
                            </div>
                        )}

                        {/* 3. Title */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                ২. নোটিফিকেশন শিরোনাম (Title) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="উদাঃ আগামীকালের পদার্থবিজ্ঞান লাইভ ক্লাস ও অ্যাসাইনমেন্ট"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                            />
                        </div>

                        {/* 4. Message */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                ৩. বিস্তারিত বার্তা (Message Content) <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                placeholder="শিক্ষার্থীদের জন্য বিস্তারিত নোটিশ বা গুরুত্বপূর্ণ তথ্য লিখুন..."
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 leading-relaxed"
                            />
                        </div>

                        {/* 5. Custom Link */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                ৪. কাস্টম লিংক (ঐচ্ছিক / Optional Link)
                            </label>
                            <input
                                type="text"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="উদাঃ /student/my-courses বা /courses/physics-hsc"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                            />
                            <p className="text-[11px] text-slate-400">
                                শিক্ষার্থী নোটিফিকেশনে ক্লিক করলে সরাসরি এই লিংকে চলে যাবে।
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>নোটিফিকেশন পাঠানো হচ্ছে...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>নোটিফিকেশন পাঠান</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right 5 Cols: Live Preview & Guidance */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Live Preview Box */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <Bell className="w-4 h-4 text-sky-600" />
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                                স্টুডেন্ট নোটিফিকেশন বার প্রিভিউ
                            </h3>
                        </div>

                        {/* Dropdown preview item */}
                        <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold">
                                    {targetType === 'course' 
                                        ? selectedCourse?.title || 'Course' 
                                        : targetType === 'bundle' 
                                            ? selectedBundle?.title || 'Bundle' 
                                            : 'সকল শিক্ষার্থী'}
                                </span>
                                <span className="text-[10px] text-slate-400">এইমাত্র</span>
                            </div>

                            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {title || 'নোটিফিকেশনের শিরোনাম এখানে দেখাবে'}
                            </h4>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                {message || 'নোটিফিকেশনের বিস্তারিত বার্তা এখানে প্রিভিউ হিসেবে দেখা যাবে...'}
                            </p>

                            <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-sky-600">
                                <span>ক্লিক করলে ওপেন হবে:</span>
                                <span className="underline truncate max-w-[150px]">{link || '/student'}</span>
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            💡 শিক্ষার্থী যখন ড্যাশবোর্ডে বা ওয়েবসাইটে প্রবেশ করবে, তখন টপবারের বেল আইকনে লাল ব্যাজ দেখতে পাবে এবং ক্লিক করলেই এই নোটিফিকেশনটি পড়তে পারবে।
                        </p>
                    </div>

                    {/* How bundle delivery works card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/40 dark:to-sky-950/40 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-extrabold text-xs">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span>বান্ডেল শিক্ষার্থীদের স্বয়ংক্রিয় নোটিফিকেশন</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            আপনি যখন কোনো নির্দিষ্ট কোর্সে নোটিফিকেশন পাঠান, সিস্টেম স্বয়ংক্রিয়ভাবে চেক করে কোর্সটি কোন কোন বান্ডেলের অন্তর্গত। সেই বান্ডেলগুলোর সব শিক্ষার্থীও একইসাথে নোটিফিকেশনটি পেয়ে যাবে।
                        </p>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        সম্প্রতি প্রেরিত নোটিফিকেশন হিস্টোরি
                    </h3>
                    <span className="text-xs text-slate-400">সর্বশেষ প্রেরিত ২০টি বার্তা</span>
                </div>

                {loadingHistory ? (
                    <div className="py-8 text-center text-xs text-slate-400">হিস্টোরি লোড হচ্ছে...</div>
                ) : history.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 space-y-2">
                        <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">এখনও কোনো নোটিফিকেশন পাঠানো হয়নি</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {history.map((item) => (
                            <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-2xl transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                                            {item.target_title || item.target_type}
                                        </span>
                                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                            {item.title}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-2xl">
                                        {item.message}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 shrink-0">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                        প্রাপক: {item.recipients_count} জন
                                    </span>
                                    <span>{new Date(item.created_at).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
