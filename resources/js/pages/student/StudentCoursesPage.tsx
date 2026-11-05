import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { BookOpen, PlayCircle, Clock, Bot, Sparkles } from 'lucide-react';

export const StudentCoursesPage: React.FC = () => {
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
        return <div className="p-12 text-center text-slate-400">কোর্স লোড হচ্ছে...</div>;
    }

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">আমার কোর্সসমূহ</h2>
                <p className="text-xs text-slate-500 mt-0.5">আপনার সকল অ্যাক্টিভ কোর্স এবং পড়ার অগ্রগতি</p>
            </div>

            {coursesData.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700">কোনো কোর্স পাওয়া যায়নি</h4>
                    <p className="text-xs">নতুন কোর্সে এনরোল করুন।</p>
                    <Link
                        to="/courses"
                        className="inline-block mt-3 px-6 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md"
                    >
                        কোর্স ব্রাউজ করুন
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coursesData.map((item) => {
                        const { course, total_lessons, completed_lessons, progress_percentage, last_lesson_id } = item;
                        return (
                            <div key={course.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
                                <div className="aspect-video bg-slate-900 relative">
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white">
                                            <BookOpen className="w-8 h-8 text-sky-400 opacity-60" />
                                        </div>
                                    )}
                                    <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded">
                                        {total_lessons} টি ক্লাস
                                    </span>
                                </div>

                                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-slate-900 text-base line-clamp-2 flex-1">{course.title}</h3>
                                            {item.has_nexpilot && (
                                                <Link
                                                    to={`/student/courses/${course.id}/nexpilot`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-[11px] font-bold rounded-lg shadow-xs hover:from-sky-700 hover:to-indigo-700 shrink-0 transition-all hover:scale-105"
                                                    title="NexPilot AI টিউটর"
                                                >
                                                    <Sparkles className="w-3 h-3 text-amber-300" />
                                                    <span>Pilot</span>
                                                </Link>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            শিক্ষক: {course.instructors?.map((i: any) => i.name).join(', ') || 'অভিজ্ঞ মেন্টর'}
                                        </p>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500">অগ্রগতি ({completed_lessons}/{total_lessons})</span>
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
                                                <span>ক্লাস চালিয়ে যান</span>
                                            </Link>
                                            <Link
                                                to={`/student/courses/${course.id}/nexpilot`}
                                                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 border border-slate-700"
                                                title="NexPilot AI টিউটর রুমে প্রবেশ করুন"
                                            >
                                                <Bot className="w-4 h-4 text-sky-400" />
                                                <span>Pilot</span>
                                            </Link>
                                        </div>
                                    ) : (
                                        <Link
                                            to={last_lesson_id 
                                                ? `/learning/${course.id}/lessons/${last_lesson_id}` 
                                                : `/courses/${course.slug}`}
                                            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                            <span>ক্লাস চালিয়ে যান</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
