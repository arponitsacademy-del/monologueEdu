import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
import { Course } from '../../types';
import { MathView } from '../../components/shared/MathView';
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

    const allInstructors: any[] = (course.instructors && course.instructors.length > 0)
        ? course.instructors
        : (course.instructor ? [course.instructor] : []);

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
            <div className="bg-slate-900 text-white pt-8 pb-14 sm:pt-10 sm:pb-20 lg:pt-10 lg:pb-28 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                        <div className="lg:col-span-8 space-y-3.5 sm:space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold border border-sky-500/30">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Online Batch</span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                                {course.title}
                            </h1>

                            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                                {course.short_description || 'Special course prepared according to the complete syllabus.'}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-xs sm:text-sm text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-sky-400" />
                                    {course.lessons_count || 0} Lessons
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-sky-400" />
                                    {totalEnrolled} Students
                                </span>
                                {allInstructors.length > 0 && (
                                    <div className="flex items-center gap-2 border-l border-slate-700/80 pl-4 sm:pl-5">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {allInstructors.slice(0, 3).map((inst: any) => {
                                                const p = inst.photo_url || inst.teacher_profile?.photo_url || inst.teacherProfile?.photo_url;
                                                return p ? (
                                                    <img
                                                        key={inst.id}
                                                        src={getImageUrl(p)}
                                                        alt={inst.name}
                                                        className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 object-cover object-top"
                                                    />
                                                ) : (
                                                    <div
                                                        key={inst.id}
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white ring-2 ring-slate-900"
                                                    >
                                                        {inst.name.charAt(0).toUpperCase()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <span className="text-xs text-slate-300 font-medium">
                                            ইন্সট্রাক্টর: <strong className="text-white font-bold">{allInstructors.map((i: any) => i.name).join(', ')}</strong>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Spacer column on desktop so hero right side accommodates the floating thumbnail card */}
                        <div className="hidden lg:block lg:col-span-4" />
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                    {/* Left: Description & Curriculum */}
                    <div className="order-2 lg:order-1 lg:col-span-8 space-y-10 pt-8 sm:pt-10">
                        {/* Course Overview */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                            <h2 className="text-xl font-bold text-slate-900">Course Details & Overview</h2>
                            {course.description ? (
                                <MathView
                                    content={course.description}
                                    className="text-sm text-slate-700 leading-relaxed"
                                />
                            ) : (
                                <p className="text-sm text-slate-400 italic">Course details will be published soon.</p>
                            )}
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
                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">কোর্স ইন্সট্রাক্টরবৃন্দ</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {allInstructors.length > 0 ? (
                                    allInstructors.map((teacher: any) => {
                                        const rawPhoto = teacher.photo_url 
                                            || teacher.teacher_profile?.photo_url 
                                            || teacher.teacherProfile?.photo_url 
                                            || teacher.photo 
                                            || teacher.avatar;
                                        const photoSrc = rawPhoto ? getImageUrl(rawPhoto) : '';
                                        const designation = teacher.designation 
                                            || teacher.teacher_profile?.designation 
                                            || teacher.teacherProfile?.designation 
                                            || 'অনলাইন শিক্ষক ও মেন্টর';
                                        const institution = teacher.institution 
                                            || teacher.teacher_profile?.institution 
                                            || teacher.teacherProfile?.institution;

                                        return (
                                            <div 
                                                key={teacher.id} 
                                                className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-sky-300 hover:shadow-md transition-all flex items-center gap-4 group"
                                            >
                                                {/* Teacher Photo / Avatar with rounded frame and fallback */}
                                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-tr from-sky-500 to-amber-500 p-0.5 shadow-md shadow-sky-500/15 group-hover:scale-105 transition-transform">
                                                    {photoSrc ? (
                                                        <img
                                                            src={photoSrc}
                                                            alt={teacher.name}
                                                            className="w-full h-full object-cover object-top rounded-[14px] bg-slate-200"
                                                            onError={(e) => {
                                                                (e.currentTarget as HTMLElement).style.display = 'none';
                                                                const fallback = e.currentTarget.parentElement?.querySelector('.teacher-fallback-avatar') as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`teacher-fallback-avatar w-full h-full ${photoSrc ? 'hidden' : 'flex'} items-center justify-center rounded-[14px] bg-gradient-to-tr from-sky-600 to-slate-900 text-white font-black text-2xl`}>
                                                        {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                                                    </div>
                                                </div>

                                                {/* Teacher Details */}
                                                <div className="min-w-0 flex-1">
                                                    <Link 
                                                        to={`/instructors/${teacher.id}`}
                                                        className="font-black text-slate-900 text-base sm:text-lg hover:text-sky-600 transition-colors line-clamp-1 block cursor-pointer"
                                                    >
                                                        {teacher.name}
                                                    </Link>
                                                    <p className="text-xs text-sky-600 font-bold mt-0.5 line-clamp-1">
                                                        {designation}
                                                    </p>
                                                    {institution && (
                                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                                                            {institution}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center gap-4">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-amber-500 p-0.5 shadow-md shrink-0 flex items-center justify-center">
                                            <div className="w-full h-full rounded-[14px] bg-slate-900 text-white flex items-center justify-center font-black text-2xl">
                                                M
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-base">মনোলগ এডু বিশেষজ্ঞ ফ্যাকাল্টি</h4>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">অভিজ্ঞ একাডেমিক ও ভর্তি মেন্টরবৃন্দ</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Sticky Enrollment Card */}
                    <div className="order-1 lg:order-2 lg:col-span-4 -mt-8 sm:-mt-10 lg:-mt-48 xl:-mt-52 relative z-20">
                        <div className="sticky top-24 bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden space-y-6 p-5 sm:p-6 ring-1 ring-black/5">
                            {/* Course Image */}
                            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden -mx-2 -mt-2">
                                {(course.thumbnail || (course as any).thumbnail_url) ? (
                                    <img 
                                        src={getImageUrl(course.thumbnail || (course as any).thumbnail_url)} 
                                        alt={course.title} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {
                                            (e.currentTarget as HTMLElement).style.display = 'none';
                                            const fallback = e.currentTarget.parentElement?.querySelector('.course-fallback-img') as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`course-fallback-img w-full h-full ${(course.thumbnail || (course as any).thumbnail_url) ? 'hidden' : 'flex'} items-center justify-center text-white bg-slate-900`}>
                                    <BookOpen className="w-12 h-12 text-sky-400 opacity-60" />
                                </div>
                            </div>

                            {/* Admission Count & Class Start Badges (Sky Blue & Amber/Yellow Theme) */}
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                {/* Admission Count Badge (Sky Blue) */}
                                <div className="bg-sky-50/80 border border-sky-200/90 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-2xs">
                                    <div className="w-10 h-10 flex items-center justify-center shrink-0 text-sky-600">
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
                                        <span className="text-2xl sm:text-3xl font-black text-sky-600 leading-tight block">
                                            {totalEnrolled}
                                        </span>
                                    </div>
                                </div>

                                {/* Class Start Badge (Amber / Yellow) */}
                                <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-2xs">
                                    <div className="w-10 h-10 flex items-center justify-center shrink-0 text-amber-500">
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
                                            <circle cx="32" cy="31" r="5" fill="#FEF3C7" />
                                            <path d="M32 28v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs sm:text-sm font-bold text-slate-700 block truncate">
                                            ক্লাস শুরু
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-amber-600 truncate block leading-tight">
                                            {course.class_starts_at || 'Nov 09, 2026'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon & Live Countdown Timer (Sky Blue & Amber Theme) */}
                            <div className="border-[1.5px] border-dashed border-sky-300 bg-gradient-to-br from-sky-50/70 via-white to-amber-50/40 rounded-2xl p-3 sm:p-4 space-y-3">
                                {/* Top Row: Coupon code, discount label, and Apply button */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="bg-white border border-sky-300 rounded-xl px-3 sm:px-4 py-1.5 font-mono font-black text-sky-600 text-xs sm:text-sm tracking-wide shadow-2xs truncate">
                                        {promoCoupon}
                                    </div>
                                    <span className="text-xs sm:text-sm font-black text-amber-600 whitespace-nowrap">
                                        {discountText}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black shadow-xs transition cursor-pointer whitespace-nowrap"
                                    >
                                        {copiedCoupon ? 'প্রয়োগ হয়েছে!' : 'প্রয়োগ করো'}
                                    </button>
                                </div>

                                {/* Bottom Row: 4 Countdown Pills */}
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="bg-white rounded-xl shadow-2xs py-2 px-1 border border-sky-100 flex flex-col items-center justify-center">
                                        <span className="text-base sm:text-lg font-black text-sky-600 leading-tight">{timeLeft.days}</span>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-amber-600">দিন</span>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-2xs py-2 px-1 border border-sky-100 flex flex-col items-center justify-center">
                                        <span className="text-base sm:text-lg font-black text-sky-600 leading-tight">{timeLeft.hours}</span>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-amber-600">ঘণ্টা</span>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-2xs py-2 px-1 border border-sky-100 flex flex-col items-center justify-center">
                                        <span className="text-base sm:text-lg font-black text-sky-600 leading-tight">{timeLeft.minutes}</span>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-amber-600">মিনিট</span>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-2xs py-2 px-1 border border-sky-100 flex flex-col items-center justify-center">
                                        <span className="text-base sm:text-lg font-black text-sky-600 leading-tight">{timeLeft.seconds}</span>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-amber-600">সেকেন্ড</span>
                                    </div>
                                </div>
                            </div>

                            {/* Centered Price Section (Sky Blue) */}
                            <div className="text-center py-1 flex items-baseline justify-center gap-3">
                                {course.price === 0 ? (
                                    <span className="text-3xl sm:text-4xl font-black text-emerald-600">Free</span>
                                ) : (
                                    <>
                                        <span className="text-3xl sm:text-4xl font-black text-sky-600 tracking-tight">
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

                            {/* Action CTA (Sky Blue & Amber Theme) */}
                            <div className="space-y-2.5">
                                {isEnrolled ? (
                                    <Link
                                        to={firstLessonId ? `/learning/${course.id}/lessons/${firstLessonId}` : '/student/my-courses'}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                                    >
                                        <PlayCircle className="w-5 h-5" />
                                        <span>ক্লাস শুরু করুন</span>
                                    </Link>
                                ) : course.price === 0 ? (
                                    <button
                                        onClick={handleFreeEnroll}
                                        disabled={enrollingFree}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        <span>{enrollingFree ? 'এনরোল হচ্ছে...' : 'ফ্রিতে ক্লাস শুরু করুন'}</span>
                                    </button>
                                ) : (
                                    <Link
                                        to={`/checkout/${course.slug}${promoCoupon ? `?coupon=${promoCoupon}` : ''}`}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/35 transition-all"
                                    >
                                        <span>কোর্সটি কিনুন</span>
                                    </Link>
                                )}

                                {/* Secondary: 'কোর্সটি কীভাবে কিনবেন' button */}
                                <button
                                    type="button"
                                    onClick={() => setShowHowToBuyModal(true)}
                                    className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-sky-600 font-bold text-base flex items-center justify-center gap-2.5 shadow-2xs transition group cursor-pointer"
                                >
                                    <PlayCircle className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition" />
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
                                                className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-sky-600 font-bold text-sm flex items-center justify-center gap-2 shadow-2xs transition group"
                                            >
                                                {btn.type === 'file' ? (
                                                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition" />
                                                ) : (
                                                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition" />
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
                            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
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
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/70 border border-sky-100">
                                    <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                                    <p className="text-xs text-slate-700 font-medium">নিচে বা সাইডবারে <strong className="text-sky-700">"কোর্সটি কিনুন"</strong> বাটনে ক্লিক করে চেকআউট পেজে যান।</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/70 border border-sky-100">
                                    <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                                    <p className="text-xs text-slate-700 font-medium">কুপন কোড <strong className="text-sky-700 font-mono">{promoCoupon}</strong> স্বয়ংক্রিয়ভাবে ডিসকাউন্ট প্রযোজ্য করবে।</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/70 border border-sky-100">
                                    <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                                    <p className="text-xs text-slate-700 font-medium">বিকাশ, নগদ, রকেট অথবা সুর্যপে এর মাধ্যমে পেমেন্ট সম্পন্ন করুন।</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/70 border border-sky-100">
                                    <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                                    <p className="text-xs text-slate-700 font-medium">পেমেন্ট নিশ্চিত হওয়ার সাথে সাথে আপনার ড্যাশবোর্ডে কোর্সটি চালু হয়ে যাবে।</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <Link
                                to={`/checkout/${course.slug}${promoCoupon ? `?coupon=${promoCoupon}` : ''}`}
                                onClick={() => setShowHowToBuyModal(false)}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition"
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
