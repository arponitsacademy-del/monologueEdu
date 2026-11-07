import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { Course } from '../../types';
import {
    GraduationCap,
    BookOpen,
    Users,
    Star,
    Award,
    CheckCircle2,
    ArrowRight,
    Loader2,
    Calendar,
    Share2,
    ExternalLink,
    ChevronRight,
    Sparkles,
    Mail,
    Phone
} from 'lucide-react';

interface TeacherData {
    id: number;
    name: string;
    designation: string;
    institution: string;
    photo_url?: string | null;
    bio?: string | null;
    expertise?: string | null;
    social_links?: any;
    courses_count: number;
    total_students: number;
}

export const TeacherProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [teacher, setTeacher] = useState<TeacherData | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTeacherProfile();
    }, [id]);

    const fetchTeacherProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get(`/teachers/${id}`);
            setTeacher(res.data.teacher);
            setCourses(res.data.courses || []);
        } catch (err: any) {
            console.error('Failed to load teacher profile', err);
            setError('শিক্ষকের প্রোফাইল তথ্য পাওয়া যায়নি।');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-sky-600 mb-3" />
                <p className="text-sm font-semibold">শিক্ষকের প্রোফাইল লোড হচ্ছে...</p>
            </div>
        );
    }

    if (error || !teacher) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
                    <GraduationCap className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{error || 'শিক্ষকের তথ্য পাওয়া যায়নি'}</h2>
                <p className="text-sm text-slate-500">অনুগ্রহ করে সঠিক শিক্ষকের প্রোফাইল লিংক চেক করুন।</p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors shadow-md"
                >
                    হোমপেজে ফিরে যান
                </Link>
            </div>
        );
    }

    const initial = (teacher.name || 'T').charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 transition-colors">
            {/* Breadcrumb Bar */}
            <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link to="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                        হোমপেজ
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>শিক্ষক প্রোফাইল</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{teacher.name}</span>
                </div>
            </div>

            {/* Profile Hero Header */}
            <section className="bg-gradient-to-b from-sky-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pt-10 pb-12 border-b border-slate-200/60 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar / Photo */}
                        <div className="relative shrink-0">
                            {teacher.photo_url ? (
                                <img
                                    src={teacher.photo_url}
                                    alt={teacher.name}
                                    className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-xl ring-4 ring-sky-500/20"
                                />
                            ) : (
                                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 text-white text-5xl sm:text-6xl font-black flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl ring-4 ring-sky-500/20">
                                    {initial}
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg border-2 border-white dark:border-slate-800" title="ভেরিফাইড শিক্ষক">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200/60 dark:border-purple-800/60 mb-2">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                    <span>মনোলগ এডু ফ্যাকাল্টি মেম্বার</span>
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {teacher.name}
                                </h1>
                                <p className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 mt-1">
                                    {teacher.designation}
                                </p>
                            </div>

                            {/* Institution Badge */}
                            {teacher.institution && (
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700">
                                    <GraduationCap className="w-4 h-4 text-sky-500 shrink-0" />
                                    <span>শিক্ষা প্রতিষ্ঠান: <strong>{teacher.institution}</strong></span>
                                </div>
                            )}

                            {/* Bio */}
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                                {teacher.bio || 'মনোলগ এডুর একজন অভিজ্ঞ ও নিষ্ঠাবান শিক্ষক। শিক্ষার্থীদের ধারণা পরিষ্কার করা ও পরীক্ষায় সর্বোচ্চ সাফল্য অর্জনে সাহায্য করাই যার মূল লক্ষ্য।'}
                            </p>

                            {/* Quick Stats Bar */}
                            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                                    <BookOpen className="w-4 h-4 text-indigo-500" />
                                    <span>পরিচালিত কোর্স: <strong className="text-slate-900 dark:text-slate-100 font-bold">{teacher.courses_count} টি</strong></span>
                                </div>

                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                                    <Users className="w-4 h-4 text-emerald-500" />
                                    <span>মোট শিক্ষার্থী: <strong className="text-slate-900 dark:text-slate-100 font-bold">{teacher.total_students}+ জন</strong></span>
                                </div>

                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                                    <span>শিক্ষার্থী রেটিং: <strong className="text-slate-900 dark:text-slate-100 font-bold">৫.০ (সর্বোচ্চ)</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Courses Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-sky-600" />
                            <span>এই শিক্ষকের পরিচালিত কোর্সসমূহ</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {teacher.name} স্যারের সাথে প্রস্তুতি নিয়ে নিজের দক্ষতা বাড়ান
                        </p>
                    </div>

                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 self-start sm:self-auto">
                        মোট {courses.length} টি কোর্স
                    </span>
                </div>

                {courses.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-3">
                        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">বর্তমানে কোনো সক্রিয় কোর্স নেই</h3>
                        <p className="text-xs text-slate-400">এই শিক্ষকের নতুন কোর্স শীঘ্রই যুক্ত হবে।</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                            >
                                <div>
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                                        {course.thumbnail ? (
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <BookOpen className="w-10 h-10 text-sky-500" />
                                            </div>
                                        )}
                                        {course.sale_price && course.sale_price < course.price && (
                                            <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-black bg-rose-500 text-white rounded-lg shadow-md">
                                                বিশেষ ছাড়
                                            </span>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                                            <span>{course.lessons_count || 0} টি ক্লাস</span>
                                            <span>•</span>
                                            <span>{course.enrollments_count || 0} জন শিক্ষার্থী</span>
                                        </div>

                                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2">
                                            {course.title}
                                        </h3>

                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {course.short_description || 'জাতীয় শিক্ষাক্রম অনুযায়ী সম্পূর্ণ সিলেবাস কভার করা হয়েছে।'}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer & Action */}
                                <div className="p-5 pt-0 space-y-3">
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <span className="text-xs text-slate-500">কোর্স ফি:</span>
                                        <div className="text-right">
                                            {course.price === 0 ? (
                                                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">ফ্রি</span>
                                            ) : (
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-lg font-black text-slate-900 dark:text-white">
                                                        {formatBDT(course.sale_price || course.price)}
                                                    </span>
                                                    {course.sale_price && course.sale_price < course.price && (
                                                        <span className="text-xs text-slate-400 line-through">
                                                            {formatBDT(course.price)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Link
                                        to={`/courses/${course.slug}`}
                                        className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-600/20"
                                    >
                                        <span>কোর্সের বিস্তারিত ও ভর্তি</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
