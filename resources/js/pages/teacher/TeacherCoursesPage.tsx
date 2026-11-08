import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Course } from '../../types';
import { BookOpen, Layers, MessageSquare, PlayCircle } from 'lucide-react';

export const TeacherCoursesPage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const { data } = await apiClient.get('/teacher/my-courses');
            setCourses(data || []);
        } catch {}
        finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400">Loading courses...</div>;
    }

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Assigned Courses</h2>
                <p className="text-xs text-slate-500 mt-0.5">Courses where you are assigned as an instructor</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.length === 0 ? (
                    <div className="col-span-3 py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                        No courses have been assigned to you yet. Please contact the administrator.
                    </div>
                ) : (
                    courses.map((course) => (
                        <div key={course.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
                            <div className="aspect-video bg-slate-900 relative">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white">
                                        <BookOpen className="w-8 h-8 text-sky-400 opacity-60" />
                                    </div>
                                )}
                                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    course.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'
                                }`}>
                                    {course.status}
                                </span>
                            </div>

                            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base line-clamp-2">{course.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Total {course.lessons_count || 0} Lessons • {course.enrollments_count || 0} Students
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                    <Link
                                        to={`/admin/courses/${course.id}/builder`}
                                        className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>Course Builder</span>
                                    </Link>
                                    <Link
                                        to="/teacher/questions"
                                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>Questions</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
