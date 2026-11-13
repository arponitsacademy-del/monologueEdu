import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { Course } from '../../types';
import { 
    Plus, 
    Search, 
    Edit, 
    Layers, 
    Trash2, 
    BookOpen, 
    Users, 
    CheckCircle2, 
    Clock, 
    ExternalLink 
} from 'lucide-react';

export const AdminCoursesPage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchCourses();
    }, [search, statusFilter]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const { data } = await apiClient.get(`/admin/courses?${params.toString()}`);
            setCourses(data.data || []);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async (courseId: number) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;

        try {
            await apiClient.delete(`/admin/courses/${courseId}`);
            setCourses(prev => prev.filter(c => c.id !== courseId));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete course.');
        }
    };

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Course Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage all courses, curriculum visual builder, and course details</p>
                </div>
                <Link
                    to="/admin/courses/create"
                    className="px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create New Course</span>
                </Link>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-md">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search courses by name..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700"
                    >
                        <option value="">All Statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6">Course</th>
                                <th className="py-4 px-4">Instructors</th>
                                <th className="py-4 px-4">Price</th>
                                <th className="py-4 px-4">Lessons & Enrolled</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        Loading courses...
                                    </td>
                                </tr>
                            ) : courses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        No courses found.
                                    </td>
                                </tr>
                            ) : (
                                courses.map((course) => (
                                    <tr key={course.id} className="hover:bg-slate-50/60 transition-colors">
                                        {/* Course Info */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <a
                                                    href={`/courses/${course.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-14 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0 block cursor-pointer group"
                                                    title="View course details"
                                                >
                                                    {course.thumbnail ? (
                                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white">
                                                            <BookOpen className="w-4 h-4 text-sky-400" />
                                                        </div>
                                                    )}
                                                </a>
                                                <div className="max-w-xs">
                                                    <a
                                                        href={`/courses/${course.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-bold text-slate-900 hover:text-sky-600 text-sm truncate block transition-colors"
                                                        title="View course details"
                                                    >
                                                        {course.title}
                                                    </a>
                                                    <span className="text-[11px] text-slate-400 font-mono">/{course.slug}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Instructors */}
                                        <td className="py-4 px-4">
                                            <div className="text-slate-800 font-semibold max-w-[150px] truncate">
                                                {course.instructors && course.instructors.length > 0
                                                    ? course.instructors.map(i => i.name).join(', ')
                                                    : 'No instructors assigned'}
                                            </div>
                                        </td>

                                        {/* Pricing */}
                                        <td className="py-4 px-4">
                                            {course.price === 0 ? (
                                                <span className="font-bold text-emerald-600">Free</span>
                                            ) : (
                                                <div>
                                                    <span className="font-bold text-slate-900">
                                                        {formatBDT(course.sale_price || course.price)}
                                                    </span>
                                                    {course.sale_price && course.sale_price < course.price && (
                                                        <span className="block text-[10px] text-slate-400 line-through">
                                                            {formatBDT(course.price)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Stats */}
                                        <td className="py-4 px-4">
                                            <div className="text-slate-600 space-y-0.5">
                                                <div>{course.lessons_count || 0} Lessons</div>
                                                <div className="text-slate-400">{course.enrollments_count || 0} Students</div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-4 px-4">
                                            {course.status === 'published' ? (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                                    Published
                                                </span>
                                            ) : course.status === 'draft' ? (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                                                    Draft
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                                                    Archived
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-6 text-right">
                                            <div className="inline-flex items-center gap-1.5">
                                                <Link
                                                    to={`/admin/courses/${course.id}/builder`}
                                                    title="Open Course Builder"
                                                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg flex items-center gap-1 text-xs transition-colors"
                                                >
                                                    <Layers className="w-3.5 h-3.5" />
                                                    <span>Builder</span>
                                                </Link>
                                                <Link
                                                    to={`/admin/courses/${course.id}/edit`}
                                                    title="Edit Course"
                                                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteCourse(course.id)}
                                                    title="Delete Course"
                                                    className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
