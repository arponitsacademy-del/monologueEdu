import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
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
    ChevronRight,
    Sparkles,
    Video,
    Check,
    Share2,
    Globe,
    FileText
} from 'lucide-react';

interface TeacherData {
    id: number;
    name: string;
    designation: string;
    institution: string;
    photo_url?: string | null;
    bio?: string | null;
    expertise?: string | null;
    experience?: string | null;
    social_links?: any;
    courses_count: number;
    total_students: number;
}

const CURATED_FACULTY: TeacherData[] = [
    {
        id: 101,
        name: 'Dr. Khaledur Rahman',
        designation: 'Senior Higher Math Faculty',
        institution: 'BUET',
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        bio: 'বুয়েট (BUET) থেকে স্নাতক ও গণিতে উচ্চতর গবেষণার অভিজ্ঞতা সম্পন্ন। গত ১০ বছর ধরে হাজারো শিক্ষার্থীকে উচ্চতর গণিতের জটিল থিওরি ও শর্টকাট টেকনিক শিখিয়ে ইঞ্জিনিয়ারিং ও বোর্ড পরীক্ষায় সর্বোচ্চ সাফল্যে পৌঁছাতে সাহায্য করে আসছেন।',
        expertise: 'উচ্চতর গণিত, ক্যালকুলাস, জ্যামিতি',
        experience: '১০+ বছর',
        courses_count: 5,
        total_students: 14200
    },
    {
        id: 102,
        name: 'Saikat Abdullah',
        designation: 'Senior Chemistry Teacher',
        institution: 'KUET',
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        bio: 'কুয়েট (KUET) এর সাবেক শিক্ষার্থী। কেমিস্ট্রির বিক্রিয়া ও পর্যায়বৃত্ত ধর্মগুলোকে সহজ বাস্তব উদাহরণের মাধ্যমে শিক্ষার্থীদের হৃদয়ে গেঁথে দিতে তিনি বিশেষভাবে পারদর্শী। তাঁর বিশেষ টেকনিক হাজারো শিক্ষার্থীর প্রিয়।',
        expertise: 'জৈব রসায়ন, পরিমাণগত রসায়ন',
        experience: '৮+ বছর',
        courses_count: 4,
        total_students: 11800
    },
    {
        id: 103,
        name: 'Md Abdur Rahman',
        designation: 'Senior Physics Faculty',
        institution: 'DU',
        photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        bio: 'ঢাকা বিশ্ববিদ্যালয় (DU) পদার্থবিজ্ঞান বিভাগের মেধাবী গ্র্যাজুয়েট। ভৌত জগত, গতিবিদ্যা থেকে আধুনিক পদার্থবিজ্ঞানের প্রতিটি কনসেপ্ট ভিজ্যুয়াল ব্যাখ্যা ও বোর্ড-এডমিশন স্ট্যান্ডার্ড গাণিতিক সমস্যা সমাধানের জন্য সুপরিচিত।',
        expertise: 'পদার্থবিজ্ঞান ১ম ও ২য় পত্র',
        experience: '১০+ বছর',
        courses_count: 6,
        total_students: 16500
    },
    {
        id: 104,
        name: 'Md Jahangir Alam',
        designation: 'General Math Specialist',
        institution: 'BUET',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: 'বুয়েট থেকে পাস করা একজন অভিজ্ঞ গণিত শিক্ষক। সাধারণ গণিত ও ফাউন্ডেশন ম্যাথমেটিক্সে শিক্ষার্থীদের ভিত্তি মজবুত করার জন্য নিবেদিত। তাঁর ক্লাসগুলোতে প্রতিটি সূত্র ও সমীকরণের গোড়ার ব্যাখ্যা তুলে ধরা হয়।',
        expertise: 'বীজগণিত, ত্রিকোণমিতি, পরিমিতি',
        experience: '১০+ বছর',
        courses_count: 4,
        total_students: 9800
    },
    {
        id: 105,
        name: 'Md Yasin Mamun',
        designation: 'Physics & Dynamics Teacher',
        institution: 'RUET',
        photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
        bio: 'রুয়েট (RUET) থেকে মেকানিক্যাল ইঞ্জিনিয়ারিং। নিউটনিয়ান বলবিদ্যা ও তড়িৎ চুম্বকত্বের মতো জটিল অধ্যায়গুলোতে গাণিতিক বিশ্লেষণের সহজ ট্রিকস দিয়ে শিক্ষার্থীদের আত্মবিশ্বাস বহুগুণ বাড়িয়ে দেন।',
        expertise: 'গতিবিদ্যা, কাজ-শক্তি-ক্ষমতা, আলো',
        experience: '৯+ বছর',
        courses_count: 5,
        total_students: 13400
    },
    {
        id: 106,
        name: 'Kawser Islam',
        designation: 'Accounting & Finance Faculty',
        institution: 'DU',
        photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
        bio: 'ঢাকা বিশ্ববিদ্যালয়ের একাউন্টিং অ্যান্ড ইনফরমেশন সিস্টেমস (AIS) থেকে বিবিএ ও এমবিএ সম্পন্ন। হিসাববিজ্ঞানের প্রতিটি নীতি ও আর্থিক বিবরণীর কঠিন হিসাবগুলোকে চোখের পলকে সহজ করে তোলার জন্য খ্যাত।',
        expertise: 'হিসাববিজ্ঞান ১ম ও ২য় পত্র, ফিন্যান্স',
        experience: '১২+ বছর',
        courses_count: 3,
        total_students: 8600
    },
    {
        id: 107,
        name: 'Dr. Abrar Hasan',
        designation: 'Senior Biology & Medical Faculty',
        institution: 'DMC',
        photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
        bio: 'ঢাকা মেডিকেল কলেজ (DMC) থেকে এমবিবিএস সম্পন্ন চিকিৎসক ও শিক্ষক। জীববিজ্ঞান ও প্রাণিবিজ্ঞানের প্রতিটি চিত্র, অঙ্গসংস্থান ও শারীরতত্ত্ব সহজে মনে রাখার অনন্য নেমোনিক ট্রিকস উপহার দিয়ে মেডিকেল ভর্তিচ্ছুদের অন্যতম ভরসার নাম।',
        expertise: 'উদ্ভিদবিজ্ঞান, প্রাণিবিজ্ঞান, মানব শারীরতত্ত্ব',
        experience: '১০+ বছর',
        courses_count: 6,
        total_students: 19200
    },
    {
        id: 108,
        name: 'Nusrat Jahan',
        designation: 'English Literature & Grammar',
        institution: 'DU',
        photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        bio: 'ঢাকা বিশ্ববিদ্যালয় ইংরেজি বিভাগ। গ্রামারের খুটিনাটি নিয়ম, ফ্রিহ্যান্ড রাইটিং ও সাহিত্যভিত্তিক পাঠদান করে শিক্ষার্থীদের বোর্ড পরীক্ষা ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষায় ইংরেজি ভীতি দূর করতে অগ্রণী ভূমিকা পালন করছেন।',
        expertise: 'ইংলিশ ১ম ও ২য় পত্র, রিটেন এক্সপার্ট',
        experience: '৭+ বছর',
        courses_count: 3,
        total_students: 7900
    }
];

export const TeacherProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [teacher, setTeacher] = useState<TeacherData | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTeacherProfile();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    const fetchTeacherProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const numericId = parseInt(id || '0', 10);
            
            // Try fetching from API first
            try {
                const res = await apiClient.get(`/teachers/${id}`);
                if (res.data?.teacher) {
                    setTeacher(res.data.teacher);
                    setCourses(res.data.courses || []);
                    return;
                }
            } catch {
                // If API fails or teacher not in DB, fallback to curated faculty
            }

            // Find in curated faculty
            const curated = CURATED_FACULTY.find((c) => c.id === numericId);
            if (curated) {
                setTeacher(curated);
                // Fetch public courses for course showcase
                try {
                    const coursesRes = await apiClient.get('/courses?per_page=6');
                    setCourses(coursesRes.data.data || []);
                } catch {
                    setCourses([]);
                }
            } else {
                // If ID is not curated, fallback to first curated or general teacher
                const fallback = CURATED_FACULTY[0];
                setTeacher({
                    ...fallback,
                    id: numericId || 101,
                    name: 'অভিজ্ঞ শিক্ষক মেন্টর',
                    designation: 'সিনিয়র ফ্যাকাল্টি মেম্বার'
                });
                try {
                    const coursesRes = await apiClient.get('/courses?per_page=6');
                    setCourses(coursesRes.data.data || []);
                } catch {
                    setCourses([]);
                }
            }
        } catch (err: any) {
            console.error('Failed to load teacher profile', err);
            setError('ইন্সট্রাক্টর প্রোফাইল লোড করতে সমস্যা হয়েছে।');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-sky-500 mb-3" />
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
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {error || 'শিক্ষকের প্রোফাইল পাওয়া যায়নি'}
                </h2>
                <p className="text-sm text-slate-500">অনুগ্রহ করে ইউআরএল চেক করুন অথবা হোমপেজে ফিরে যান।</p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-500 text-white font-bold text-xs hover:bg-sky-600 transition-colors shadow-md"
                >
                    হোমপেজে ফিরে যান
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 transition-colors font-sans">
            {/* Breadcrumb Navigation */}
            <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-16 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link to="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                        হোম
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <Link to="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                        ইন্সট্রাক্টরবৃন্দ
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{teacher.name}</span>
                </div>
            </div>

            {/* Profile Hero Header (Bondi Pathshala Inspired Layout) */}
            <section className="bg-gradient-to-b from-sky-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pt-8 pb-12 border-b border-slate-200/60 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-10 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-10">
                        {/* Arched Portrait Box */}
                        <div className="relative shrink-0 w-52 sm:w-60">
                            <div className="relative aspect-[3/3.8] rounded-3xl overflow-hidden bg-gradient-to-b from-sky-400 via-sky-600 to-slate-950 dark:from-sky-500 dark:via-sky-800 dark:to-slate-950 flex items-end justify-center shadow-lg">
                                {/* Soft radial glow */}
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

                                {/* Sparkle stars */}
                                <div className="absolute top-4 right-5 text-sky-200/60 pointer-events-none animate-pulse">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="absolute top-12 left-4 text-cyan-200/40 pointer-events-none">
                                    <Sparkles className="w-3 h-3" />
                                </div>

                                {/* Arched contour ring */}
                                <div className="absolute inset-1.5 rounded-t-full border border-sky-300/30 pointer-events-none" />

                                {/* Top Left Institution Badge */}
                                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/20 text-xs font-black text-white flex items-center gap-1 shadow-xs">
                                    <span>{teacher.institution || 'BUET'}</span>
                                </div>

                                {/* Top Right Golden Crest */}
                                <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-amber-400/25 backdrop-blur-md border border-amber-300/50 flex items-center justify-center text-amber-300 shadow-xs">
                                    <Award className="w-4 h-4" />
                                </div>

                                {/* Photo / Avatar */}
                                <div className="w-full h-[90%] relative flex items-end justify-center overflow-hidden">
                                    {teacher.photo_url ? (
                                        <img
                                            src={teacher.photo_url}
                                            alt={teacher.name}
                                            className="w-full h-full object-cover object-top drop-shadow-md"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-white">
                                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-3xl font-black mb-1">
                                                {(teacher.name || 'T').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-bold text-sky-200">শিক্ষক মেন্টর</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Verified check badge at bottom right */}
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg border-2 border-white dark:border-slate-800 flex items-center gap-1" title="ভেরিফাইড শিক্ষক">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Details & Information */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200/80 dark:border-sky-800/80 mb-2.5">
                                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
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
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                                {teacher.bio || 'মনোলগ এডুর অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষক। শিক্ষার্থীদের জন্য জটিল বিষয়গুলো সহজ ও সাবলীলভাবে উপস্থাপন করে কনসেপচুয়াল মাস্টারি তৈরি করাই তাঁর প্রধান লক্ষ্য।'}
                            </p>

                            {/* Quick Stats Bar */}
                            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-semibold">
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                                    <BookOpen className="w-4 h-4 text-sky-500" />
                                    <span>কোর্স: <strong className="text-slate-900 dark:text-slate-100 font-bold">{teacher.courses_count || courses.length} টি</strong></span>
                                </div>

                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                                    <Users className="w-4 h-4 text-emerald-500" />
                                    <span>মোট শিক্ষার্থী: <strong className="text-slate-900 dark:text-slate-100 font-bold">{teacher.total_students ? teacher.total_students.toLocaleString('en-US') : '১২,৫০০'}+ জন</strong></span>
                                </div>

                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                                    <span>শিক্ষক রেটিং: <strong className="text-slate-900 dark:text-slate-100 font-bold">৫.০ (টপ রেটেড)</strong></span>
                                </div>

                                {teacher.experience && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                                        <Award className="w-4 h-4 text-sky-500" />
                                        <span>অভিজ্ঞতা: <strong className="text-slate-900 dark:text-slate-100 font-bold">{teacher.experience}</strong></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Courses Section ("শিক্ষকের পরিচালিত কোর্সসমূহ") */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-sky-500" />
                            <span>শিক্ষকের পরিচালিত কোর্সসমূহ</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {teacher.name} স্যারের তত্ত্বাবধানে অনুষ্ঠিত সকল চলমান ও স্পেশাল কোর্স
                        </p>
                    </div>

                    <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 self-start sm:self-auto border border-sky-200 dark:border-sky-800">
                        {courses.length} টি সক্রিয় কোর্স
                    </span>
                </div>

                {courses.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-3">
                        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">বর্তমানে কোনো কোর্স পাওয়া যায়নি</h3>
                        <p className="text-xs text-slate-400">এই শিক্ষকের নতুন ব্যাচ খুব শীঘ্রই শুরু হবে।</p>
                        <Link
                            to="/courses"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline pt-2"
                        >
                            <span>সকল কোর্স দেখুন</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-2xl hover:border-sky-400 dark:hover:border-sky-500 transition-all flex flex-col justify-between overflow-hidden relative"
                            >
                                <div>
                                    {/* Thumbnail */}
                                    <Link to={`/courses/${course.slug}`} className="block relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer group/thumb">
                                        {(course.thumbnail || (course as any).thumbnail_url) ? (
                                            <img
                                                src={getImageUrl(course.thumbnail || (course as any).thumbnail_url)}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 group-hover/thumb:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                                    const fallback = (e.currentTarget.parentElement?.querySelector('.fallback-thumb') as HTMLElement);
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`fallback-thumb w-full h-full ${(course.thumbnail || (course as any).thumbnail_url) ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-tr from-slate-800 to-sky-950 text-white`}>
                                            <BookOpen className="w-12 h-12 text-sky-400 opacity-60" />
                                        </div>

                                        {/* Discount Badge */}
                                        {course.discount_percent && course.discount_percent > 0 ? (
                                            <span className="absolute top-3 right-3 px-3 py-1 text-xs font-black bg-rose-600 text-white rounded-xl shadow-md">
                                                {course.discount_percent}% ছাড়
                                            </span>
                                        ) : course.price === 0 ? (
                                            <span className="absolute top-3 right-3 px-3 py-1 text-xs font-black bg-emerald-600 text-white rounded-xl shadow-md">
                                                ফ্রি কোর্স
                                            </span>
                                        ) : null}
                                    </Link>

                                    {/* Details */}
                                    <div className="p-5 sm:p-6 space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Video className="w-3.5 h-3.5 text-sky-500" />
                                                <span>{course.lessons_count || 0} টি ক্লাস</span>
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>{course.enrollments_count || 0} জন শিক্ষার্থী</span>
                                            </span>
                                        </div>

                                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 transition-colors line-clamp-2">
                                            <Link
                                                to={`/courses/${course.slug}`}
                                                className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                                            >
                                                {course.title}
                                            </Link>
                                        </h3>

                                        {/* Course feature checklist */}
                                        <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-300">
                                            {((course.features && Array.isArray(course.features) && course.features.length > 0)
                                                ? course.features.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
                                                : [
                                                    'লাইভ ও ফুল HD রেকর্ডেড ক্লাস আর্কাইভ',
                                                    'চ্যাপ্টারভিত্তিক লেকচার শিট ও প্রশ্নব্যাংক',
                                                    'NexPilot AI ২৪/৭ ইনস্ট্যান্ট ডাউট সলভার',
                                                ]
                                            ).slice(0, 4).map((feat: string, fIdx: number) => (
                                                <div key={fIdx} className="flex items-start gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span className="line-clamp-1 leading-tight">{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer & Action */}
                                <div className="p-5 sm:p-6 pt-0 space-y-3">
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-medium">কোর্স ফি:</span>
                                        <div className="text-right">
                                            {course.price === 0 ? (
                                                <span className="text-lg font-black text-emerald-600">ফ্রি</span>
                                            ) : (
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-xl font-black text-sky-600 dark:text-sky-400">
                                                        {formatBDT(
                                                            course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price)
                                                                ? Number(course.sale_price)
                                                                : (course.effective_price ?? Number(course.price))
                                                        )}
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

                                    {/* Action buttons */}
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <Link
                                            to={`/courses/${course.slug}`}
                                            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 text-center transition-all cursor-pointer"
                                        >
                                            বিস্তারিত দেখুন
                                        </Link>
                                        <Link
                                            to={`/checkout/${course.slug}`}
                                            className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 font-bold text-xs text-white text-center transition-all shadow-sm cursor-pointer"
                                        >
                                            কোর্সটি কিনুন
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};