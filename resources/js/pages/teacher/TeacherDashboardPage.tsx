import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Course } from '../../types';
import { 
    BookOpen, 
    Users, 
    MessageSquare, 
    Layers, 
    PlayCircle, 
    ArrowRight,
    Sparkles
} from 'lucide-react';

export const TeacherDashboardPage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                const [coursesRes, questionsRes] = await Promise.all([
                    apiClient.get('/teacher/my-courses'),
                    apiClient.get('/teacher/student-questions'),
                ]);
                setCourses(coursesRes.data || []);
                setQuestions(questionsRes.data.data || []);
            } catch {}
            finally {
                setLoading(false);
            }
        };
        fetchTeacherData();
    }, []);

    if (loading) {
        return <div className="p-12 text-center text-slate-400">শিক্ষক ড্যাশবোর্ড লোড হচ্ছে...</div>;
    }

    const totalStudents = courses.reduce((acc, c) => acc + (c.enrollments_count || 0), 0);
    const totalLessons = courses.reduce((acc, c) => acc + (c.lessons_count || 0), 0);

    return (
        <div className="space-y-8 max-w-7xl pb-16">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">শিক্ষক পোর্টাল ড্যাশবোর্ড</h2>
                <p className="text-xs text-slate-500 mt-0.5">আপনার তত্ত্বাবধানে থাকা কোর্স ও শিক্ষার্থীদের প্রশ্নের বিবরণ</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">অ্যাসাইনকৃত কোর্স</span>
                        <div className="text-2xl font-black text-slate-900">{courses.length} টি</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">মোট শিক্ষার্থী</span>
                        <div className="text-2xl font-black text-slate-900">{totalStudents} জন</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">মোট লেসন সংখ্যা</span>
                        <div className="text-2xl font-black text-slate-900">{totalLessons} টি</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <PlayCircle className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">নতুন প্রশ্নসমূহ</span>
                        <div className="text-2xl font-black text-slate-900">{questions.length} টি</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* My Courses Grid */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-900">আমার নির্ধারিত কোর্সসমূহ</h3>
                    <Link to="/teacher/courses" className="text-xs font-bold text-sky-600 hover:text-sky-700">
                        সবগুলো দেখুন
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div key={course.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
                            <div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    course.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {course.status}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-2">{course.title}</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    {course.lessons_count || 0} টি লেসন • {course.enrollments_count || 0} শিক্ষার্থী
                                </p>
                            </div>

                            <Link
                                to={`/admin/courses/${course.id}/builder`}
                                className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                            >
                                <Layers className="w-3.5 h-3.5" />
                                <span>কারিকুলাম বিল্ডার</span>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Questions */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900">শিক্ষার্থীদের সাম্প্রতিক প্রশ্ন ও মন্তব্য</h3>
                    <Link to="/teacher/questions" className="text-xs font-bold text-sky-600 hover:text-sky-700">
                        উত্তর দিন
                    </Link>
                </div>

                <div className="divide-y divide-slate-100">
                    {questions.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">কোনো অমীমাংসিত প্রশ্ন নেই।</p>
                    ) : (
                        questions.slice(0, 5).map((q) => (
                            <div key={q.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 text-xs">{q.user?.name}</span>
                                        <span className="text-[10px] text-slate-400">• {q.lesson?.title}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 italic">"{q.content}"</p>
                                </div>
                                <Link
                                    to="/teacher/questions"
                                    className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs rounded-lg shrink-0 self-start sm:self-center"
                                >
                                    উত্তর লিখুন
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
