import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
    Play, 
    ArrowRight, 
    GraduationCap, 
    FileText, 
    Calendar, 
    Star, 
    Clock, 
    Sparkles, 
    CheckCircle2, 
    Award, 
    Loader2,
    Radio
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [coursesData, setCoursesData] = useState<any[]>([]);
    const [availableExams, setAvailableExams] = useState<any[]>([]);
    const [activeLiveClass, setActiveLiveClass] = useState<any | null>(null);
    const [upcomingLiveClass, setUpcomingLiveClass] = useState<any | null>(null);
    const [todayRoutineEvents, setTodayRoutineEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [coursesRes, examsRes, liveRes, routineRes] = await Promise.allSettled([
                apiClient.get('/student/my-courses'),
                apiClient.get('/student/exams/available'),
                apiClient.get('/student/live-classes'),
                apiClient.get('/student/routine'),
            ]);

            if (coursesRes.status === 'fulfilled') {
                setCoursesData(coursesRes.value.data || []);
            }
            if (examsRes.status === 'fulfilled') {
                setAvailableExams(examsRes.value.data?.exams || []);
            }
            if (liveRes.status === 'fulfilled') {
                const list = liveRes.value.data?.live_classes || [];
                const live = list.find((c: any) => c.status === 'live' || c.is_currently_live);
                const upcoming = list.find((c: any) => c.status === 'upcoming' && !c.is_currently_live);
                setActiveLiveClass(live || null);
                setUpcomingLiveClass(upcoming || null);
            }
            if (routineRes.status === 'fulfilled') {
                const allEvts = routineRes.value.data?.events || [];
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const todayList = allEvts.filter((e: any) => e.date === todayStr);
                setTodayRoutineEvents(todayList.length > 0 ? todayList : allEvts.slice(0, 3));
            }
        } catch {
            // silent fail
        } finally {
            setLoading(false);
        }
    };

    // Calculate time-aware Bengali greeting
    const getBengaliGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'শুভ সকাল';
        if (hour >= 12 && hour < 16) return 'শুভ দুপুর';
        if (hour >= 16 && hour < 18) return 'শুভ বিকাল';
        return 'শুভ রাত্রি';
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                <span className="text-xs font-bold text-slate-500">ড্যাশবোর্ড লোড হচ্ছে...</span>
            </div>
        );
    }

    const totalEnrolled = coursesData.length;
    const recentCourse = coursesData[0];
    const continueUrl = recentCourse?.last_lesson_id 
        ? `/learning/${recentCourse.course.id}/lessons/${recentCourse.last_lesson_id}` 
        : recentCourse?.course?.slug 
            ? `/courses/${recentCourse.course.slug}` 
            : '/courses';

    const recentCourseTitle = recentCourse?.course?.title || 'SSC 26 Free Crash Course';
    const recentLessonTitle = recentCourse?.last_lesson?.title || 'লেকচার -০১ | বাংলা ব্যাকরণ (সমাস)';
    const progressPercent = recentCourse?.progress_percentage || 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Greeting Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {getBengaliGreeting()}, {user?.name || 'শিক্ষার্থী'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-500">
                            আজকে পড়া শুরু করো
                        </p>
                        {user?.registration_number && (
                            <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full font-mono">
                                আইডি: {user.registration_number}
                            </span>
                        )}
                    </div>
                </div>

                {/* Profile Completion / Reward Points Badge */}
                <div className="self-start sm:self-center">
                    <button
                        type="button"
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                        <span>প্রোফাইল পূরণ করো</span>
                        <span className="bg-white/25 px-2 py-0.5 rounded-full text-[10px] tracking-wide font-black">
                            +৫০ পয়েন্ট
                        </span>
                    </button>
                </div>
            </div>

            {/* Hero Cards: Continue Learning & Upcoming Class */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Card: Continue Class / Latest Lecture */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-5">
                    {/* Video Thumbnail */}
                    <Link
                        to={continueUrl}
                        className="w-full sm:w-56 h-36 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 rounded-2xl relative overflow-hidden flex items-center justify-center shrink-0 shadow-inner group cursor-pointer"
                    >
                        {recentCourse?.course?.thumbnail ? (
                            <img
                                src={recentCourse.course.thumbnail}
                                alt={recentCourseTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-600/40 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-3 text-center">
                                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                                    বাংলা ব্যাকরণ
                                </span>
                                <span className="text-xl font-black text-white mt-1">সমাস</span>
                                <span className="text-[10px] text-sky-200/80">ভিডিও ক্লাস</span>
                            </div>
                        )}

                        {/* Centered Play Button */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 group-hover:scale-110 transition-transform pl-0.5">
                                <Play className="w-5 h-5 fill-white text-white" />
                            </div>
                        </div>
                    </Link>

                    {/* Course & Lesson Details */}
                    <div className="flex-1 min-w-0 w-full space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 block">
                            লেটেস্ট ক্লাস
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                            {recentCourseTitle}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-1">
                            {recentLessonTitle}
                        </p>

                        {/* Progress Bar */}
                        <div className="pt-1 space-y-1">
                            <div className="flex items-center justify-end text-[11px] font-bold text-slate-400">
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="pt-2">
                            <Link
                                to={continueUrl}
                                className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-full transition-all shadow-md shadow-sky-600/20"
                            >
                                <span>শুরু করো</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Card: Dynamic Live / Upcoming Class */}
                <div className={`lg:col-span-5 bg-white rounded-3xl p-5 border shadow-xs flex flex-col justify-between ${
                    activeLiveClass ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200/80'
                }`}>
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                            {activeLiveClass ? (
                                <div className="inline-flex items-center gap-1.5 text-xs font-black text-rose-600">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                                    <span>🔴 লাইভ চলছে</span>
                                </div>
                            ) : upcomingLiveClass ? (
                                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700">
                                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                                    <span>আসন্ন লাইভ ক্লাস</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Radio className="w-3.5 h-3.5 text-slate-400" />
                                    <span>লাইভ ক্লাস</span>
                                </div>
                            )}

                            <Link
                                to="/student/live-classes"
                                className="text-[11px] font-bold text-sky-600 hover:underline"
                            >
                                সবগুলো দেখুন
                            </Link>
                        </div>

                        {activeLiveClass ? (
                            <div>
                                <span className="text-[11px] font-extrabold text-sky-700 block mb-1 truncate">
                                    {activeLiveClass.course?.title}
                                </span>
                                <h4 className="font-black text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
                                    {activeLiveClass.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                    {activeLiveClass.creator ? `মেন্টর: ${activeLiveClass.creator.name}` : 'ইন্টারঅ্যাক্টিভ লাইভ সেশন ও প্রশ্নোত্তর'}
                                </p>
                            </div>
                        ) : upcomingLiveClass ? (
                            <div>
                                <span className="text-[11px] font-extrabold text-sky-700 block mb-1 truncate">
                                    {upcomingLiveClass.course?.title}
                                </span>
                                <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                                    {upcomingLiveClass.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                    <span>
                                        {new Date(upcomingLiveClass.start_time).toLocaleString('bn-BD', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            <div>
                                <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                                    এই মুহূর্তে কোনো লাইভ ক্লাস নেই
                                </h4>
                                <p className="text-xs text-slate-500 mt-1.5">
                                    নতুন লাইভ ক্লাস শিডিউল করা হলে আপনার ড্যাশবোর্ডে সরাসরি নোটিফিকেশন ও লিংক পাবেন।
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        {activeLiveClass ? (
                            <Link
                                to={`/student/live-classes/${activeLiveClass.id}`}
                                className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs rounded-full transition-all shadow-md shadow-rose-600/25 text-center flex items-center justify-center gap-2"
                            >
                                <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                                <span>এখনই ক্লাসে যুক্ত হও</span>
                            </Link>
                        ) : upcomingLiveClass ? (
                            <Link
                                to={`/student/live-classes/${upcomingLiveClass.id}`}
                                className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-full transition-all shadow-md shadow-sky-600/20 text-center block"
                            >
                                বিস্তারিত ও রুম লিংক
                            </Link>
                        ) : (
                            <Link
                                to="/student/live-classes"
                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full transition-all text-center block"
                            >
                                লাইভ ক্লাসের তালিকা
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* 4-Card Quick Actions / Category Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* 1. চলমান কোর্স */}
                <Link
                    to="/student/my-courses"
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all group flex items-center gap-3.5"
                >
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-extrabold text-slate-800 text-sm group-hover:text-sky-600 transition-colors">
                            চলমান কোর্স
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                            {totalEnrolled} টি কোর্স
                        </div>
                    </div>
                </Link>

                {/* 2. পরীক্ষা */}
                <Link
                    to="/student/exams"
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group flex items-center justify-between relative"
                >
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                                পরীক্ষা
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                                মডেল টেস্ট ও কুইজ
                            </div>
                        </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0">
                        {availableExams.length}টি
                    </span>
                </Link>

                {/* 3. রুটিন */}
                <Link
                    to="/student/routine"
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all group flex items-center gap-3.5"
                >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-extrabold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">
                            রুটিন
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                            ক্লাস সিডিউল
                        </div>
                    </div>
                </Link>

                {/* 4. ফ্রি রিসোর্স */}
                <Link
                    to="/courses?type=free"
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group flex items-center gap-3.5"
                >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Star className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">
                            ফ্রি রিসোর্স
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                            নোট ও হ্যান্ডনোট
                        </div>
                    </div>
                </Link>
            </div>

            {/* Bottom 2-Column Section: Take Exam & Today's Routine */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: পরীক্ষা দাও (Take Exams) */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <h3 className="font-extrabold text-slate-900 text-base">
                                পরীক্ষা দাও
                            </h3>
                            <Link
                                to="/student/exams"
                                className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
                            >
                                সব দেখুন
                            </Link>
                        </div>

                        {/* Exams List */}
                        {availableExams.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 space-y-2">
                                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="text-xs font-bold text-slate-600">বর্তমানে কোনো পরীক্ষা নির্ধারিত নেই</p>
                                <p className="text-[11px] text-slate-400">নতুন মডেল টেস্ট ও কুইজ প্রকাশিত হলে এখানে দেখতে পাবেন।</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {availableExams.slice(0, 3).map((exam) => {
                                    const courseName = exam.course?.title || exam.courses?.[0]?.title || 'মডেল টেস্ট';
                                    return (
                                        <div
                                            key={exam.id}
                                            className="p-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 border border-slate-100/70"
                                        >
                                            {/* Duration Pill */}
                                            <div className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                                                exam.is_live_active 
                                                    ? 'bg-rose-500 text-white animate-pulse shadow-xs' 
                                                    : 'bg-sky-50 text-sky-700'
                                            }`}>
                                                {exam.is_live_active ? '🔴' : `${exam.duration_minutes}′`}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                                                        {exam.title}
                                                    </h4>
                                                    {exam.is_live_active && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 shrink-0">
                                                            লাইভ
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                                    {courseName} • {exam.duration_minutes} মিনিট
                                                    {exam.is_live_expired && ' • প্র্যাকটিস মোড'}
                                                </p>
                                            </div>

                                            {/* Action Button */}
                                            <Link
                                                to={`/exams/${exam.id}/take`}
                                                className={`px-4 py-1.5 rounded-full font-bold text-xs shrink-0 transition-colors shadow-2xs ${
                                                    exam.is_live_active
                                                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                                                        : 'bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700'
                                                }`}
                                            >
                                                {exam.is_live_active ? 'অংশ নিন' : 'শুরু'}
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 text-center">
                        <Link
                            to="/student/exams"
                            className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
                        >
                            সকল পরীক্ষার তালিকা দেখুন →
                        </Link>
                    </div>
                </div>

                {/* Right: আজকের রুটিন (Today's Routine) */}
                <div
                    id="student-routine-section"
                    className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between"
                >
                    <div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <h3 className="font-extrabold text-slate-900 text-base">
                                আজকের রুটিন
                            </h3>
                            <Link
                                to="/student/routine"
                                className="text-xs font-bold text-[#0B4B34] hover:text-emerald-800 transition-colors cursor-pointer"
                            >
                                রুটিন ক্যালেন্ডার
                            </Link>
                        </div>

                        {/* Timeline Routine Items */}
                        <div className="space-y-4">
                            {todayRoutineEvents.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 space-y-2">
                                    <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="text-xs">আজকের দিনে নির্ধারিত কোনো ক্লাস বা পরীক্ষা নেই।</p>
                                </div>
                            ) : (
                                todayRoutineEvents.slice(0, 3).map((evt: any) => (
                                    <div key={`${evt.type}-${evt.id}`} className="flex items-start gap-3">
                                        <div className="w-12 shrink-0 pt-0.5 text-right">
                                            <span className="text-xs font-bold text-slate-700 block">
                                                {evt.time_time || '—'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold block">
                                                {evt.time_period || ''}
                                            </span>
                                        </div>
                                        <div className={`border-l-2 ${
                                            evt.type === 'live_exam'
                                                ? 'border-amber-500'
                                                : evt.type === 'live_class'
                                                ? 'border-rose-500'
                                                : evt.type === 'class_upload'
                                                ? 'border-sky-500'
                                                : evt.type === 'material'
                                                ? 'border-teal-500'
                                                : evt.type === 'book_parcel'
                                                ? 'border-orange-500'
                                                : 'border-[#0B4B34]'
                                        } pl-3.5 py-0.5 space-y-0.5 flex-1 min-w-0`}>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">
                                                    {evt.title}
                                                </h4>
                                                {evt.is_live && (
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500 text-white shrink-0 animate-pulse">
                                                        লাইভ চলছে
                                                    </span>
                                                )}
                                                {evt.type === 'book_parcel' && (
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-100 text-orange-800 shrink-0">
                                                        বই/পার্সেল
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 line-clamp-1">
                                                {evt.subject} • {evt.course_title}
                                            </p>
                                        </div>
                                        <Link
                                            to={evt.action_url || '/student/routine'}
                                            className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-[#0B4B34] text-slate-600 shrink-0 transition-colors self-center"
                                        >
                                            {evt.is_live ? 'যুক্ত হন' : (evt.action_text || 'দেখুন')}
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 text-center">
                        <Link
                            to="/student/routine"
                            className="text-xs font-bold text-[#0B4B34] hover:text-emerald-800 hover:underline"
                        >
                            পূর্ণাঙ্গ রুটিন ক্যালেন্ডার দেখুন →
                            কোর্সের পূর্ণাঙ্গ সময়সূচি দেখুন →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
