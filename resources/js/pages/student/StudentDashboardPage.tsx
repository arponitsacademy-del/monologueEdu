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
    Award
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [coursesData, setCoursesData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Enrolled Courses</span>
                        <div className="text-2xl font-black text-slate-900">{totalEnrolled}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">In-Progress Courses</span>
                        <div className="text-2xl font-black text-slate-900">{inProgressCount}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Completed Lessons</span>
                        <div className="text-2xl font-black text-slate-900">{completedLessonsTotal}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
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
