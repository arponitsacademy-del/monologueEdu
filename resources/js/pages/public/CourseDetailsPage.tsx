import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { Course } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
    BookOpen, 
    Users, 
    Clock, 
    PlayCircle, 
    CheckCircle2, 
    Lock, 
    Sparkles, 
    ChevronDown, 
    ChevronUp,
    ShieldCheck,
    ArrowRight,
    Calendar,
    GraduationCap,
    FileText,
    ExternalLink,
    X,
    Copy,
    Check
} from 'lucide-react';

const DEFAULT_FEATURES = [
    'Full HD video lectures & live discussions',
    'Downloadable practice sheets & lecture notes',
    'Direct Q&A doubt-solving support with instructors',
    'Lifetime course access from any device',
];

export const CourseDetailsPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language } = useLanguage();

    const [course, setCourse] = useState<Course | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
    const [enrollingFree, setEnrollingFree] = useState(false);
    const [copiedCoupon, setCopiedCoupon] = useState(false);
    const [showHowToBuyModal, setShowHowToBuyModal] = useState(false);

    // Live countdown timer state (Matches user screenshot)
    const [timeLeft, setTimeLeft] = useState({
        days: 18,
        hours: 20,
        minutes: 10,
        seconds: 28,
    });

    useEffect(() => {
        const updateTimer = () => {
            if (course?.discount_deadline) {
                const diff = new Date(course.discount_deadline).getTime() - new Date().getTime();
                if (diff > 0) {
                    setTimeLeft({
                        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                        minutes: Math.floor((diff / 1000 / 60) % 60),
                        seconds: Math.floor((diff / 1000) % 60),
                    });
                    return;
                }
            }
            // Rolling live countdown based on day/month target
            const now = new Date();
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 18, 23, 59, 59);
            const diff = Math.max(0, target.getTime() - now.getTime());
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [course?.discount_deadline]);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { data } = await apiClient.get(`/courses/${slug}`);
                setCourse(data.course);
                setIsEnrolled(data.is_enrolled || false);
                // Expand all sections by default
                if (data.course?.sections) {
                    const expanded: Record<number, boolean> = {};
                    data.course.sections.forEach((s: any) => {
                        expanded[s.id] = true;
                    });
                    setOpenSections(expanded);
                }
            } catch {
                navigate('/courses');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [slug]);

    const toggleSection = (id: number) => {
        setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleFreeEnroll = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!course) return;

        setEnrollingFree(true);
        try {
            await apiClient.post(`/courses/${course.id}/enroll-free`);
            setIsEnrolled(true);
            const firstLesson = course.sections?.[0]?.lessons?.[0];
            if (firstLesson) {
                navigate(`/learning/${course.id}/lessons/${firstLesson.id}`);
            } else {
                navigate('/student/my-courses');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Enrollment failed.');
        } finally {
            setEnrollingFree(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse space-y-8">
                <div className="h-12 bg-slate-200 rounded-xl w-2/3" />
                <div className="h-6 bg-slate-200 rounded w-1/3" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-96 bg-slate-200 rounded-2xl" />
                    <div className="h-96 bg-slate-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!course) return null;

    const firstLessonId = course.sections?.[0]?.lessons?.[0]?.id;
    const totalEnrolled = (course.fake_enrollment_count || 0) + (course.enrollments_count || 0);
    const courseFeatures = (course.features && course.features.length > 0) ? course.features : DEFAULT_FEATURES;

    const effectivePrice = course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price)
        ? Number(course.sale_price)
        : (course.effective_price ?? Number(course.price));
    const hasDiscount = course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price);
    const promoCoupon = course.coupon_code || 'ACPPOWERPLAY500';
    const discountAmount = hasDiscount ? Math.round(Number(course.price) - Number(course.sale_price)) : 500;
    const discountText = course.coupon_discount_text || `৳${discountAmount} ছাড়`;

    const handleApplyCoupon = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(promoCoupon);
        }
        setCopiedCoupon(true);
        setTimeout(() => setCopiedCoupon(false), 2500);
        navigate(`/checkout/${course.slug}?coupon=${promoCoupon}`);
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Header Hero */}
            <div className="bg-slate-900 text-white py-16 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold border border-sky-500/30">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Online Batch</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                            {course.title}
                        </h1>

                        <p className="text-base text-slate-300 leading-relaxed">
                            {course.short_description || 'Special course prepared according to the complete syllabus.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-sky-400" />
                                {course.lessons_count || 0} Lessons
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-sky-400" />
                                {totalEnrolled} Students
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left: Description & Curriculum */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Course Overview */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                            <h2 className="text-xl font-bold text-slate-900">Course Details & Overview</h2>
                            <div 
                                className="text-sm text-slate-600 leading-relaxed prose prose-slate max-w-none"
                                dangerouslySetInnerHTML={{ __html: course.description || '<p>Course details will be published soon.</p>' }}
                            />
                        </div>

                        {/* Curriculum Preview */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Course Curriculum & Syllabus</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Total {course.sections?.length || 0} Sections • {course.lessons_count || 0} Lessons
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {course.sections && course.sections.length > 0 ? (
                                    course.sections.map((section, sIndex) => {
                                        const isOpen = openSections[section.id];
                                        return (
                                            <div
                                                key={section.id}
                                                className="border border-slate-200 rounded-xl overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => toggleSection(section.id)}
                                                    className="w-full px-5 py-4 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
                                                >
                                                    <div>
                                                        <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block">
                                                            Topic 0{sIndex + 1}
                                                        </span>
                                                        <h4 className="text-base font-bold text-slate-800">
                                                            {section.title}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                                        <span>{section.lessons?.length || 0} Classes</span>
                                                        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                                    </div>
                                                </button>

                                                {isOpen && (
                                                    <div className="divide-y divide-slate-100 bg-white">
                                                        {section.lessons?.map((lesson, lIndex) => (
                                                            <div
                                                                key={lesson.id}
                                                                className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 text-sm"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {lesson.is_preview ? (
                                                                        <PlayCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                                                    ) : (
                                                                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                                                    )}
                                                                    <span className="text-slate-700 font-medium">
                                                                        Class {lIndex + 1}: {lesson.title}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    {lesson.is_preview && (
                                                                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                                                            Free Preview
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs text-slate-400">
                                                                        {lesson.duration_minutes} mins
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-slate-400 text-center py-6">
                                        Curriculum for this course will be published soon.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Instructors */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                            <h2 className="text-xl font-bold text-slate-900">Course Instructors</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {course.instructors && course.instructors.length > 0 ? (
                                    course.instructors.map((teacher) => (
                                        <div key={teacher.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-lg">
                                                {teacher.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{teacher.name}</h4>
                                                <p className="text-xs text-slate-500">Online Teacher & Mentor</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-lg">
                                            M
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">Monologue Edu Expert Faculty</h4>
                                            <p className="text-xs text-slate-500">Experienced Academic Mentor</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Sticky Enrollment Card */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28 bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden space-y-6 p-6">
                            {/* Course Image */}
                            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden -mx-2 -mt-2">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white">
                                        <BookOpen className="w-12 h-12 text-sky-400 opacity-60" />
                                    </div>
                                )}
                            </div>

                            {/* Admission Count & Class Start Badges (Matches User Image) */}
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                {/* Admission Count Badge */}
                                <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-2xs">
                                    <div className="w-10 h-10 flex items-center justify-center shrink-0 text-[#3B49DF]">
                                        <svg viewBox="0 0 48 48" className="w-9 h-9" fill="currentColor">
                                            {/* Graduation cap */}
                                            <path d="M24 6L6 15l18 9 14-7V30h3V16.5L42 15 24 6z" />
                                            {/* Center student bust */}
                                            <circle cx="24" cy="27" r="3.5" />
                                            <path d="M19 36c0-2.8 2.2-5 5-5s5 2.2 5 5v1H19v-1z" />
                                            {/* Left student bust */}
                                            <circle cx="15" cy="29" r="2.8" />
                                            <path d="M11 37c0-2.2 1.8-4 4-4 1.2 0 2.3.5 3 1.4-.4.8-.6 1.8-.6 2.6H11v0z" />
                                            {/* Right student bust */}
                                            <circle cx="33" cy="29" r="2.8" />
                                            <path d="M37 37c0-2.2-1.8-4-4-4-1.2 0-2.3.5-3 1.4.4.8.6 1.8.6 2.6H37v0z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs sm:text-sm font-bold text-slate-700 block truncate">
                                            ভর্তি সংখ্যা
                                        </span>
                                        <span className="text-2xl sm:text-3xl font-black text-[#3B49DF] leading-tight block">
                                            {totalEnrolled}
                                        </span>
                                    </div>
                                </div>

                                {/* Class Start Badge */}
                                <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-2xs">
                                    <div className="w-10 h-10 flex items-center justify-center shrink-0 text-[#3B49DF]">
                                        <svg viewBox="0 0 48 48" className="w-9 h-9" fill="currentColor">
                                            {/* Calendar body */}
                                            <rect x="7" y="11" width="34" height="28" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
                                            <path d="M7 19h34" stroke="currentColor" strokeWidth="3" />
                                            {/* Rings */}
                                            <circle cx="15" cy="8" r="2" />
                                            <circle cx="24" cy="8" r="2" />
                                            <circle cx="33" cy="8" r="2" />
                                            {/* Dots */}
                                            <circle cx="14" cy="24" r="1.5" />
                                            <circle cx="20" cy="24" r="1.5" />
                                            <circle cx="14" cy="29" r="1.5" />
                                            <circle cx="20" cy="29" r="1.5" />
                                            {/* Clock badge */}
                                            <circle cx="32" cy="31" r="7" fill="currentColor" />
                                            <circle cx="32" cy="31" r="5" fill="#EEF2FF" />
                                            <path d="M32 28v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs sm:text-sm font-bold text-slate-700 block truncate">
                                            ক্লাস শুরু
                                        </span>
                                        <span className="text-xs sm:text-sm font-extrabold text-[#3B49DF] truncate block leading-tight">
                                            {course.class_starts_at || 'Nov 09, 2026'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon & Live Countdown Timer (Matches User Reference Image) */}
                            <div className="border-dashed border-2 border-indigo-200/90 bg-[#F6F8FF] rounded-2xl p-3.5 sm:p-4 space-y-3">
                                {/* Top Row: Coupon code, discount label, and Apply button */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="bg-white border border-indigo-200 rounded-xl px-3 sm:px-4 py-1.5 font-mono font-black text-[#3B49DF] text-xs sm:text-sm tracking-wide shadow-2xs truncate">
                                        {promoCoupon}
                                    </div>
                                    <span className="text-xs sm:text-sm font-black text-[#3B49DF] whitespace-nowrap">
                                        {discountText}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer whitespace-nowrap"
                                    >
                                        {copiedCoupon ? 'প্রয়োগ হয়েছে!' : 'প্রয়োগ করো'}
                                    </button>
                                </div>

                                {/* Bottom Row: 4 Countdown Pills */}
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="bg-white rounded-xl shadow-2xs py-2 px-1 border border-indigo-100/60 flex flex-col items-center justify-center">
                                        <span className="text-base sm:text-lg font-black text-[#3B49DF] leading-tight">{timeLeft.days}</span>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">দিন</span>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-2xs py-2 px-1 border border-indigo-100/60 flex flex-col items-center justify-center">
                                        <span className="text-base sm:text-lg font-black text-[#3B49DF] leading-tight">{timeLeft.hours}</span>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">ঘণ্টা</span>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-2xs py-2 px-1 border border-indigo-100/60 flex flex-col items-center justify-center">
                                        <span className="text-base sm:text-lg font-black text-[#3B49DF] leading-tight">{timeLeft.minutes}</span>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">মিনিট</span>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-2xs py-2 px-1 border border-indigo-100/60 flex flex-col items-center justify-center">
                                        <span className="text-base sm:text-lg font-black text-[#3B49DF] leading-tight">{timeLeft.seconds}</span>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">সেকেন্ড</span>
                                    </div>
                                </div>
                            </div>

                            {/* Centered Price Section (Matches Screenshot) */}
                            <div className="text-center py-1 flex items-baseline justify-center gap-3">
                                {course.price === 0 ? (
                                    <span className="text-3xl sm:text-4xl font-black text-emerald-600">Free</span>
                                ) : (
                                    <>
                                        <span className="text-3xl sm:text-4xl font-black text-[#3B49DF] tracking-tight">
                                            {formatBDT(effectivePrice)}
                                        </span>
                                        {hasDiscount && (
                                            <span className="text-xl sm:text-2xl font-bold text-slate-400 line-through">
                                                {formatBDT(course.price)}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Action CTA */}
                            <div className="space-y-2.5">
                                {isEnrolled ? (
                                    <Link
                                        to={firstLessonId ? `/learning/${course.id}/lessons/${firstLessonId}` : '/student/my-courses'}
                                        className="w-full py-4 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                                    >
                                        <PlayCircle className="w-5 h-5" />
                                        <span>ক্লাস শুরু করুন</span>
                                    </Link>
                                ) : course.price === 0 ? (
                                    <button
                                        onClick={handleFreeEnroll}
                                        disabled={enrollingFree}
                                        className="w-full py-4 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        <span>{enrollingFree ? 'এনরোল হচ্ছে...' : 'ফ্রিতে ক্লাস শুরু করুন'}</span>
                                    </button>
                                ) : (
                                    <Link
                                        to={`/checkout/${course.slug}${promoCoupon ? `?coupon=${promoCoupon}` : ''}`}
                                        className="w-full py-4 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                                    >
                                        <span>কোর্সটি কিনুন</span>
                                    </Link>
                                )}

                                {/* Secondary: 'কোর্সটি কীভাবে কিনবেন' button (Matches user screenshot) */}
                                <button
                                    type="button"
                                    onClick={() => setShowHowToBuyModal(true)}
                                    className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 font-bold text-base flex items-center justify-center gap-2.5 shadow-2xs transition group cursor-pointer"
                                >
                                    <PlayCircle className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition" />
                                    <span>কোর্সটি কীভাবে কিনবেন</span>
                                </button>

                                {/* Custom Action Buttons (Outline, etc.) */}
                                {course.action_buttons && course.action_buttons.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                        {course.action_buttons.map((btn) => (
                                            <a
                                                key={btn.id}
                                                href={btn.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 shadow-2xs transition group"
                                            >
                                                {btn.type === 'file' ? (
                                                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                                                ) : (
                                                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                                                )}
                                                <span>{btn.label}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Course Features Checklist */}
                            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600 font-medium">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">এই কোর্সে যা যা থাকছে:</h4>
                                {courseFeatures.map((feat, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="leading-tight text-slate-700">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* How to Buy Modal */}
            {showHowToBuyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 space-y-4 p-6 relative">
                        <button
                            type="button"
                            onClick={() => setShowHowToBuyModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <PlayCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">কোর্সটি কীভাবে কিনবেন?</h3>
                                <p className="text-xs text-slate-500">সহজ ৪টি ধাপে কোর্সটিতে ভর্তি হোন</p>
                            </div>
                        </div>

                        {course.how_to_buy_url ? (
                            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                                {course.how_to_buy_url.includes('youtube.com') || course.how_to_buy_url.includes('youtu.be') ? (
                                    <iframe
                                        src={
                                            course.how_to_buy_url.includes('embed')
                                                ? course.how_to_buy_url
                                                : course.how_to_buy_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')
                                        }
                                        title="How to buy course"
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <video
                                        src={course.how_to_buy_url}
                                        controls
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2.5 py-1">
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                                    <p className="text-xs text-slate-700 font-medium">নিচে বা সাইডবারে <strong className="text-indigo-700">"কোর্সটি কিনুন"</strong> বাটনে ক্লিক করে চেকআউট পেজে যান।</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                                    <p className="text-xs text-slate-700 font-medium">কুপন কোড <strong className="text-indigo-700 font-mono">{promoCoupon}</strong> স্বয়ংক্রিয়ভাবে ডিসকাউন্ট প্রযোজ্য করবে।</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                                    <p className="text-xs text-slate-700 font-medium">বিকাশ, নগদ, রকেট অথবা সুর্যপে এর মাধ্যমে পেমেন্ট সম্পন্ন করুন।</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                                    <p className="text-xs text-slate-700 font-medium">পেমেন্ট নিশ্চিত হওয়ার সাথে সাথে আপনার ড্যাশবোর্ডে কোর্সটি চালু হয়ে যাবে।</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <Link
                                to={`/checkout/${course.slug}${promoCoupon ? `?coupon=${promoCoupon}` : ''}`}
                                onClick={() => setShowHowToBuyModal(false)}
                                className="w-full py-3.5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition"
                            >
                                <span>কোর্সটি কিনুন</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
