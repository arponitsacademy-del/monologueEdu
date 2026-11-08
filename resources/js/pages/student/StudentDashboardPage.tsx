import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
    BookOpen, 
    CheckCircle2, 
    Clock, 
    PlayCircle, 
    ArrowRight, 
    Sparkles, 
    GraduationCap,
    Award,
    ClipboardList,
    AlertCircle,
    Check
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [coursesData, setCoursesData] = useState<any[]>([]);
    const [availableExams, setAvailableExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [coursesRes, examsRes] = await Promise.allSettled([
                apiClient.get('/student/my-courses'),
                apiClient.get('/student/exams/available'),
            ]);

            if (coursesRes.status === 'fulfilled') {
                setCoursesData(coursesRes.value.data || []);
            }
            if (examsRes.status === 'fulfilled') {
                setAvailableExams(examsRes.value.data?.exams || []);
            }
        } catch {
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400">Loading dashboard...</div>;
    }

    const totalEnrolled = coursesData.length;
    const completedLessonsTotal = coursesData.reduce((acc, c) => acc + (c.completed_lessons || 0), 0);
    const inProgressCount = coursesData.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length;

    const recentCourse = coursesData[0];

    return (
        <div className="space-y-8 max-w-7xl pb-16">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-600/15 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
                        Learning Space
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                        Welcome, {user?.name}! 👋
                    </h2>
                    <p className="text-xs sm:text-sm text-sky-100 max-w-lg">
                        Complete your lessons today and maintain steady learning progress.
                    </p>
                </div>

                {recentCourse && (
                    <Link
                        to={recentCourse.last_lesson_id 
                            ? `/learning/${recentCourse.course.id}/lessons/${recentCourse.last_lesson_id}` 
                            : `/courses/${recentCourse.course.slug}`}
                        className="px-6 py-3.5 bg-white text-slate-900 hover:bg-slate-50 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 self-start sm:self-center"
                    >
                        <PlayCircle className="w-5 h-5 text-sky-600" />
                        <span>Continue Learning</span>
                    </Link>
                )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Enrolled Courses</span>
                        <div className="text-2xl font-black text-slate-900">{totalEnrolled}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">In-Progress Courses</span>
                        <div className="text-2xl font-black text-slate-900">{inProgressCount}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Completed Lessons</span>
                        <div className="text-2xl font-black text-slate-900">{completedLessonsTotal}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <Link
                    to="/student/exams"
                    className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-purple-300 hover:shadow-sm transition-all group"
                >
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1 group-hover:text-purple-600 transition-colors">
                            Available Exams
                        </span>
                        <div className="text-2xl font-black text-slate-900">
                            {availableExams.length}
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                </Link>
            </div>

            {/* Published Exams & Assessments Section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                Published Exams & Assessments
                            </h3>
                            <p className="text-xs text-slate-500">
                                Participate in live quizzes and examination papers to evaluate your learning
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/student/exams"
                        className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 self-start sm:self-center"
                    >
                        <span>View All Exams ({availableExams.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {availableExams.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 space-y-2.5">
                        <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="font-bold text-slate-700 text-sm">No exams scheduled currently</h4>
                        <p className="text-xs max-w-sm mx-auto">
                            Check back later when instructors publish new chapter tests and mock exams.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {availableExams.map((exam) => {
                            const courseTitle = exam.course?.title || exam.courses?.[0]?.title;

                            return (
                                <div
                                    key={exam.id}
                                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
                                >
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                                                {courseTitle || 'Open Assessment'}
                                            </span>

                                            {exam.has_negative_marking && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                                    Negative (-{exam.negative_marks})
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                                            {exam.title}
                                        </h4>

                                        {exam.description && (
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {exam.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-slate-600 font-medium pt-1">
                                            <span className="flex items-center gap-1 font-bold text-purple-700">
                                                <Award className="w-3.5 h-3.5" />
                                                {exam.total_marks} Marks
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {exam.duration_minutes} Mins
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span>
                                                {exam.questions_count} Questions
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-2">
                                        {exam.has_submitted ? (
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Score: {exam.submission?.obtained_marks} / {exam.submission?.total_marks}
                                                </span>
                                                <Link
                                                    to="/student/exams?tab=results"
                                                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition"
                                                >
                                                    View Result
                                                </Link>
                                            </div>
                                        ) : exam.in_progress ? (
                                            <Link
                                                to={`/exams/${exam.id}/take`}
                                                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                                            >
                                                <span>Resume Exam</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        ) : !exam.is_enrolled ? (
                                            <Link
                                                to={`/courses/${exam.course?.slug || ''}`}
                                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <span>Enroll in Course to Take</span>
                                            </Link>
                                        ) : (
                                            <Link
                                                to={`/exams/${exam.id}/take`}
                                                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-600/20"
                                            >
                                                <ClipboardList className="w-4 h-4" />
                                                <span>Take Exam Now</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Enrolled Courses Progress */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-900">My Courses & Progress</h3>
                    <Link to="/courses" className="text-xs font-bold text-sky-600 hover:text-sky-700">
                        Find New Courses
                    </Link>
                </div>

                {coursesData.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-3">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                        <h4 className="font-bold text-slate-700">You haven't enrolled in any courses yet</h4>
                        <p className="text-xs">Explore our catalog and find the course that fits your goals.</p>
                        <Link
                            to="/courses"
                            className="inline-block mt-2 px-6 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md"
                        >
                            Browse Courses
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {coursesData.map((item) => {
                            const { course, total_lessons, completed_lessons, progress_percentage, last_lesson_id } = item;
                            return (
                                <div
                                    key={course.id}
                                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-300 hover:shadow-xs transition-all space-y-4 flex flex-col justify-between"
                                >
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-base">{course.title}</h4>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Instructor: {course.instructors?.map((i: any) => i.name).join(', ') || 'Expert Mentor'}
                                        </p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-600">{completed_lessons} / {total_lessons} Completed</span>
                                            <span className="text-sky-600">{progress_percentage}%</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500"
                                                style={{ width: `${progress_percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <Link
                                        to={last_lesson_id 
                                            ? `/learning/${course.id}/lessons/${last_lesson_id}` 
                                            : `/courses/${course.slug}`}
                                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                        <span>Open Classroom</span>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
