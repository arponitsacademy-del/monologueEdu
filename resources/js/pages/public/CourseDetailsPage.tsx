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
    ExternalLink
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
                            <div className="grid grid-cols-2 gap-2.5">
                                {/* Admission Count Badge */}
                                <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-3 flex items-center gap-2.5 shadow-2xs">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[11px] font-bold text-slate-700 block truncate">
                                            ভর্তি সংখ্যা
                                        </span>
                                        <span className="text-xl font-black text-indigo-700 leading-tight">
                                            {totalEnrolled}
                                        </span>
                                    </div>
                                </div>

                                {/* Class Start Badge */}
                                <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-3 flex items-center gap-2.5 shadow-2xs">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                        <Calendar className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[11px] font-bold text-slate-700 block truncate">
                                            ক্লাস শুরু
                                        </span>
                                        <span className="text-xs sm:text-sm font-extrabold text-indigo-700 truncate block leading-tight">
                                            {course.class_starts_at || 'ভর্তি চলছে'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline justify-between pt-2">
                                <div>
                                    <span className="text-xs font-semibold text-slate-400 block mb-1">কোর্স ফি</span>
                                    {course.price === 0 ? (
                                        <span className="text-3xl font-black text-emerald-600">Free</span>
                                    ) : (
                                        <div className="flex items-baseline gap-2.5">
                                            <span className="text-3xl font-black text-indigo-600">
                                                {formatBDT(
                                                    course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price)
                                                        ? Number(course.sale_price)
                                                        : (course.effective_price ?? Number(course.price))
                                                )}
                                            </span>
                                            {course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price) && (
                                                <span className="text-base text-slate-400 line-through font-bold">
                                                    {formatBDT(course.price)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {((course.discount_percent && course.discount_percent > 0) || (course.sale_price && course.sale_price < course.price)) ? (
                                    <span className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-extrabold rounded-lg border border-rose-200">
                                        {course.discount_percent || Math.round(((course.price - Number(course.sale_price)) / course.price) * 100)}% OFF
                                    </span>
                                ) : null}
                            </div>

                            {/* Action CTA */}
                            <div className="space-y-2.5">
                                {isEnrolled ? (
                                    <Link
                                        to={firstLessonId ? `/learning/${course.id}/lessons/${firstLessonId}` : '/student/my-courses'}
                                        className="w-full py-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                                    >
                                        <PlayCircle className="w-5 h-5" />
                                        <span>ক্লাস শুরু করুন</span>
                                    </Link>
                                ) : course.price === 0 ? (
                                    <button
                                        onClick={handleFreeEnroll}
                                        disabled={enrollingFree}
                                        className="w-full py-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        <span>{enrollingFree ? 'এনরোল হচ্ছে...' : 'ফ্রিতে ক্লাস শুরু করুন'}</span>
                                    </button>
                                ) : (
                                    <Link
                                        to={`/checkout/${course.slug}`}
                                        className="w-full py-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                                    >
                                        <span>কোর্সটি কিনুন</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                )}

                                {/* Custom Action Buttons (Outline, How to buy, etc.) */}
                                {course.action_buttons && course.action_buttons.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                        {course.action_buttons.map((btn) => (
                                            <a
                                                key={btn.id}
                                                href={btn.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 shadow-2xs transition group"
                                            >
                                                {btn.type === 'file' ? (
                                                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                                                ) : (
                                                    <PlayCircle className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                                                )}
                                                <span>{btn.label}</span>
                                                <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition ml-0.5" />
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
        </div>
    );
};
