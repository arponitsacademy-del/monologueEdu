import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { 
    BookOpen, 
    PlayCircle, 
    Clock, 
    Bot, 
    Sparkles, 
    ShieldCheck, 
    ArrowRight, 
    Check, 
    AlertCircle, 
    Loader2,
    Copy
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const StudentCoursesPage: React.FC = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { user } = useAuth();

    const [coursesData, setCoursesData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Unlock Modal State
    const [unlockModalOpen, setUnlockModalOpen] = useState(false);
    const [selectedCourseForUnlock, setSelectedCourseForUnlock] = useState<any | null>(null);
    const [unlockPaymentMethod, setUnlockPaymentMethod] = useState<'manual_bkash' | 'manual_nagad' | 'manual_rocket'>('manual_bkash');
    const [unlockSenderPhone, setUnlockSenderPhone] = useState(user?.phone || '');
    const [unlockTrxId, setUnlockTrxId] = useState('');
    const [submittingUnlock, setSubmittingUnlock] = useState(false);
    const [unlockError, setUnlockError] = useState<string | null>(null);
    const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null);
    const [copiedNumber, setCopiedNumber] = useState(false);

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        try {
            const { data } = await apiClient.get('/student/my-courses');
            setCoursesData(data || []);
        } catch {}
        finally {
            setLoading(false);
        }
    };

    const handleOpenUnlock = async (item: any) => {
        setSelectedCourseForUnlock(item);
        setUnlockError(null);
        setUnlockSuccess(null);
        setUnlockSenderPhone(user?.phone || '');
        setUnlockTrxId('');

        // If pilot price is free (0 taka) or user is admin, unlock immediately!
        if ((Number(item.pilot_price) || 0) <= 0 || user?.role === 'admin') {
            try {
                const { data } = await apiClient.post(`/student/nexpilot/courses/${item.course.id}/unlock`);
                setCoursesData(prev => prev.map(c => c.course.id === item.course.id ? { ...c, has_nexpilot: true } : c));
                navigate(`/student/courses/${item.course.id}/nexpilot`);
            } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to activate pilot.');
            }
            return;
        }

        // Open paid unlock modal
        setUnlockModalOpen(true);
    };

    const handleSubmitUnlockPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourseForUnlock) return;

        setSubmittingUnlock(true);
        setUnlockError(null);

        try {
            const { data } = await apiClient.post(`/student/nexpilot/courses/${selectedCourseForUnlock.course.id}/unlock`, {
                payment_method: unlockPaymentMethod,
                transaction_ref: unlockTrxId.trim(),
                sender_phone: unlockSenderPhone.trim(),
            });

            setUnlockSuccess(data.message || 'Payment submitted successfully. It will be activated once verified.');
            setTimeout(() => {
                setUnlockModalOpen(false);
                fetchMyCourses();
            }, 3000);
        } catch (err: any) {
            setUnlockError(err.response?.data?.message || 'Failed to submit payment.');
        } finally {
            setSubmittingUnlock(false);
        }
    };

    const manualBkash = settings?.manual_payment_settings?.bkash?.account_number || '01700000000';
    const manualNagad = settings?.manual_payment_settings?.nagad?.account_number || '01700000000';
    const manualRocket = settings?.manual_payment_settings?.rocket?.account_number || '01700000000';

    const currentPayNumber = unlockPaymentMethod === 'manual_bkash' 
        ? manualBkash 
        : unlockPaymentMethod === 'manual_nagad' 
        ? manualNagad 
        : manualRocket;

    const handleCopyNumber = () => {
        navigator.clipboard.writeText(currentPayNumber);
        setCopiedNumber(true);
        setTimeout(() => setCopiedNumber(false), 2000);
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400">Loading courses...</div>;
    }

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Courses</h2>
                <p className="text-xs text-slate-500 mt-0.5">All your active courses and learning progress</p>
            </div>

            {coursesData.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700">No courses found</h4>
                    <p className="text-xs">Enroll in a new course to get started.</p>
                    <Link
                        to="/courses"
                        className="inline-block mt-3 px-6 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md"
                    >
                        Browse Courses
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coursesData.map((item) => {
                        const { course, total_lessons, completed_lessons, progress_percentage, last_lesson_id } = item;
                        return (
                            <div key={course.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
                                <Link to={`/courses/${course.slug}`} className="block aspect-video bg-slate-900 relative group/thumb cursor-pointer overflow-hidden">
                                    {(course.thumbnail || (course as any).thumbnail_url) ? (
                                        <img
                                            src={getImageUrl(course.thumbnail || (course as any).thumbnail_url)}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLElement).style.display = 'none';
                                                const fallback = (e.currentTarget.parentElement?.querySelector('.fallback-thumb') as HTMLElement);
                                                if (fallback) fallback.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className={`fallback-thumb w-full h-full ${(course.thumbnail || (course as any).thumbnail_url) ? 'hidden' : 'flex'} items-center justify-center text-white bg-slate-900`}>
                                        <BookOpen className="w-8 h-8 text-sky-400 opacity-60" />
                                    </div>
                                    <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded">
                                        {total_lessons} Classes
                                    </span>
                                </Link>

                                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-slate-900 text-base line-clamp-2 flex-1">
                                                <Link
                                                    to={`/courses/${course.slug}`}
                                                    className="hover:text-sky-600 transition-colors cursor-pointer"
                                                >
                                                    {course.title}
                                                </Link>
                                            </h3>
                                            
                                            {item.has_nexpilot ? (
                                                <Link
                                                    to={`/student/courses/${course.id}/nexpilot`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 text-white text-[11px] font-bold rounded-lg shadow-xs hover:from-sky-600 hover:to-sky-800 shrink-0 transition-all hover:scale-105"
                                                    title="NexPilot AI Tutor"
                                                >
                                                    <Sparkles className="w-3 h-3 text-amber-300" />
                                                    <span>Pilot</span>
                                                </Link>
                                            ) : item.has_active_pilot ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenUnlock(item)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                                                    title="Unlock NexPilot AI for this course"
                                                >
                                                    <Sparkles className="w-3 h-3 text-amber-600" />
                                                    <span>{item.pilot_price > 0 ? `+Pilot` : 'Free Pilot'}</span>
                                                </button>
                                            ) : null}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Instructor: {course.instructors?.map((i: any) => i.name).join(', ') || 'Expert Mentor'}
                                        </p>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500">Progress ({completed_lessons}/{total_lessons})</span>
                                            <span className="text-sky-600">{progress_percentage}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-sky-600 rounded-full"
                                                style={{ width: `${progress_percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {item.has_nexpilot ? (
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={last_lesson_id 
                                                    ? `/learning/${course.id}/lessons/${last_lesson_id}` 
                                                    : `/courses/${course.slug}`}
                                                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                            >
                                                <PlayCircle className="w-4 h-4" />
                                                <span>Continue Learning</span>
                                            </Link>
                                            <Link
                                                to={`/student/courses/${course.id}/nexpilot`}
                                                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 border border-slate-700"
                                                title="Open NexPilot AI Tutor Room"
                                            >
                                                <Bot className="w-4 h-4 text-sky-400" />
                                                <span>Pilot</span>
                                            </Link>
                                        </div>
                                    ) : item.has_active_pilot ? (
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={last_lesson_id 
                                                    ? `/learning/${course.id}/lessons/${last_lesson_id}` 
                                                    : `/courses/${course.slug}`}
                                                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                            >
                                                <PlayCircle className="w-4 h-4" />
                                                <span>Continue Learning</span>
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenUnlock(item)}
                                                className="px-3 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                                                title="Unlock NexPilot AI Tutor for this course"
                                            >
                                                <Sparkles className="w-3.5 h-3.5 text-white" />
                                                <span>{item.pilot_price > 0 ? 'Get Pilot' : 'Enable Free'}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <Link
                                            to={last_lesson_id 
                                                ? `/learning/${course.id}/lessons/${last_lesson_id}` 
                                                : `/courses/${course.slug}`}
                                            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                            <span>Continue Learning</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Unlock NexPilot Payment Modal */}
            <Modal
                isOpen={unlockModalOpen}
                onClose={() => setUnlockModalOpen(false)}
                title="Unlock NexPilot AI Personal Tutor"
            >
                {selectedCourseForUnlock && (
                    <div className="space-y-4">
                        {/* Course & Pilot Overview Card */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/70 via-amber-50/40 to-white border border-sky-100 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-bold text-sm text-slate-900 truncate">
                                        {selectedCourseForUnlock.course?.title}
                                    </h4>
                                    <span className="font-black text-sm text-sky-600 shrink-0">
                                        {formatBDT(selectedCourseForUnlock.pilot_price)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                    {selectedCourseForUnlock.pilot_title || 'NexPilot AI Learning Assistant'} — 24/7 personal AI tutor for theory explanations and problem solving.
                                </p>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>Payment Instructions ({unlockPaymentMethod === 'manual_bkash' ? 'bKash' : unlockPaymentMethod === 'manual_nagad' ? 'Nagad' : 'Rocket'} Send Money):</span>
                                <button
                                    type="button"
                                    onClick={handleCopyNumber}
                                    className="inline-flex items-center gap-1 text-sky-600 font-bold hover:underline cursor-pointer"
                                >
                                    {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedNumber ? 'Copied' : 'Copy Number'}</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Receiver Number:</span>
                                <strong className="font-mono text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    {currentPayNumber}
                                </strong>
                            </div>
                            <div>
                                Payable Amount: <strong className="text-slate-900">{formatBDT(selectedCourseForUnlock.pilot_price)}</strong>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {unlockError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{unlockError}</span>
                            </div>
                        )}

                        {/* Success Alert */}
                        {unlockSuccess && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{unlockSuccess}</span>
                            </div>
                        )}

                        {/* Submit Payment Form */}
                        <form onSubmit={handleSubmitUnlockPayment} className="space-y-3 pt-1">
                            {/* Method Selection */}
                            <div className="grid grid-cols-3 gap-2">
                                {(['manual_bkash', 'manual_nagad', 'manual_rocket'] as const).map((method) => {
                                    const isSelected = unlockPaymentMethod === method;
                                    const label = method === 'manual_bkash' ? 'bKash' : method === 'manual_nagad' ? 'Nagad' : 'Rocket';
                                    return (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setUnlockPaymentMethod(method)}
                                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                                                isSelected 
                                                    ? 'border-sky-500 bg-sky-50/70 text-sky-700 shadow-2xs' 
                                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Sender Mobile Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={unlockSenderPhone}
                                    onChange={(e) => setUnlockSenderPhone(e.target.value)}
                                    placeholder="017xxxxxxxx"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Transaction ID (TrxID)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={unlockTrxId}
                                    onChange={(e) => setUnlockTrxId(e.target.value)}
                                    placeholder="e.g. 9J3K8LQZ"
                                    className="w-full px-3.5 py-2.5 font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setUnlockModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingUnlock}
                                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    <span>{submittingUnlock ? 'Submitting...' : 'Submit Payment'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>
        </div>
    );
};

