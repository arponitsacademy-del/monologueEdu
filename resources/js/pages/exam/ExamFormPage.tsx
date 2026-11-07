import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import {
    ClipboardList,
    ArrowLeft,
    Save,
    BookOpen,
    Clock,
    Award,
    AlertCircle,
    CheckCircle2,
    Wrench,
    Loader2
} from 'lucide-react';

export const ExamFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const { user } = useAuth();
    const navigate = useNavigate();

    const isTeacher = user?.role === 'teacher';
    const basePath = isTeacher ? '/teacher/exams' : '/admin/exams';

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        course_id: '',
        description: '',
        total_marks: 100,
        pass_marks: 33,
        has_negative_marking: false,
        negative_marks: 0.25,
        duration_minutes: 30,
        status: 'published',
        start_time: '',
        end_time: '',
    });

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
        if (isEdit) {
            fetchExamDetails();
        }
    }, [id]);

    const fetchCourses = async () => {
        try {
            const res = await apiClient.get('/exams/courses-list');
            setCourses(res.data || []);
        } catch (err) {
            console.error('Failed to load courses', err);
        }
    };

    const fetchExamDetails = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/exams/${id}`);
            const data = res.data;
            setFormData({
                title: data.title || '',
                course_id: data.course_id ? String(data.course_id) : '',
                description: data.description || '',
                total_marks: data.total_marks || 0,
                pass_marks: data.pass_marks || 0,
                has_negative_marking: Boolean(data.has_negative_marking),
                negative_marks: data.negative_marks || 0,
                duration_minutes: data.duration_minutes || 30,
                status: data.status || 'published',
                start_time: data.start_time ? data.start_time.substring(0, 16) : '',
                end_time: data.end_time ? data.end_time.substring(0, 16) : '',
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load exam details.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.title.trim()) {
            setError('অনুগ্রহ করে পরীক্ষার নাম লিখুন।');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                course_id: formData.course_id ? Number(formData.course_id) : null,
                total_marks: Number(formData.total_marks),
                pass_marks: Number(formData.pass_marks),
                negative_marks: formData.has_negative_marking ? Number(formData.negative_marks) : 0,
                duration_minutes: Number(formData.duration_minutes),
                start_time: formData.start_time || null,
                end_time: formData.end_time || null,
            };

            if (isEdit) {
                await apiClient.put(`/exams/${id}`, payload);
                navigate(basePath);
            } else {
                const res = await apiClient.post('/exams', payload);
                const newExamId = res.data.data.id;
                // Directly redirect to Exam Builder so teacher/admin can start adding questions right away!
                navigate(`${basePath}/${newExamId}/builder`);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'পরীক্ষা সংরক্ষণ করতে ব্যর্থ হয়েছে।');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
                <p className="text-sm">তথ্য লোড হচ্ছে...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        to={basePath}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                            <ClipboardList className="w-6 h-6 text-sky-500" />
                            <span>{isEdit ? 'পরীক্ষা এডিট করুন' : 'নতুন পরীক্ষা তৈরি (Create New Exam)'}</span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            পরীক্ষার মৌলিক তথ্য, সময়, কোর্স এবং নেগেটিভ মার্কিং কনফিগার করুন।
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                {/* 1. Exam Title */}
                <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                        পরীক্ষার নাম (Exam Title) <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="যেমন: পদার্থবিজ্ঞান ১ম পত্র - অধ্যায় ২ মডেল টেস্ট"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>

                {/* 2. Course Selection */}
                <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                        কোর্স নির্ধারণ করুন (Associated Course)
                    </label>
                    <div className="relative">
                        <select
                            value={formData.course_id}
                            onChange={e => setFormData({ ...formData, course_id: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="">-- সাধারণ পরীক্ষা (কোনো কোর্সের সাথে যুক্ত নয়) --</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        যে কোর্সে পরীক্ষাটি যুক্ত করবেন, সেই কোর্সে দায়িত্বপ্রাপ্ত শিক্ষক উত্তরপত্র মূল্যায়ন (খাতা চেক) করতে পারবেন।
                    </p>
                </div>

                {/* 3. Description / Instructions */}
                <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                        পরীক্ষার বিবরণ ও নিয়মাবলী (Description & Instructions)
                    </label>
                    <textarea
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="পরীক্ষার নিয়মাবলী ও নির্দেশনাবলী এখানে লিখুন..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>

                {/* 4. Marks & Duration Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {/* Duration in Minutes */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-sky-500" />
                            <span>পরীক্ষার সময় (মিনিট) <span className="text-rose-500">*</span></span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="1440"
                            required
                            value={formData.duration_minutes}
                            onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Total Marks */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span>মোট নম্বর (Total Marks)</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={formData.total_marks}
                            onChange={e => setFormData({ ...formData, total_marks: Number(e.target.value) })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">প্রশ্নের নম্বরের যোগফল দিয়ে পরবর্তীতে অটো-আপডেট হবে।</p>
                    </div>

                    {/* Pass Marks */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                            পাস মার্ক (Pass Marks)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={formData.pass_marks}
                            onChange={e => setFormData({ ...formData, pass_marks: Number(e.target.value) })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                </div>

                {/* 5. Negative Marking Configuration */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">নেগেটিভ মার্কিং (Negative Marking)</p>
                            <p className="text-xs text-slate-500">ভুল উত্তরের জন্য নম্বর কাটা যাবে কিনা নির্ধারণ করুন।</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.has_negative_marking}
                                onChange={e => setFormData({ ...formData, has_negative_marking: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                    </div>

                    {formData.has_negative_marking && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                প্রতিটি ভুল উত্তরের জন্য কর্তন নম্বর:
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.05"
                                value={formData.negative_marks}
                                onChange={e => setFormData({ ...formData, negative_marks: Number(e.target.value) })}
                                className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                                placeholder="0.25"
                            />
                            <span className="text-xs text-slate-400">(যেমন: 0.25 বা 0.50)</span>
                        </div>
                    )}
                </div>

                {/* 6. Status */}
                <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                        পরীক্ষার অবস্থা (Status)
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
                            <input
                                type="radio"
                                name="status"
                                value="published"
                                checked={formData.status === 'published'}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="text-sky-600 focus:ring-sky-500"
                            />
                            <span>Published (শিক্ষার্থীরা দেখতে পাবে)</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
                            <input
                                type="radio"
                                name="status"
                                value="draft"
                                checked={formData.status === 'draft'}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="text-sky-600 focus:ring-sky-500"
                            />
                            <span>Draft (ড্রাফট হিসেবে সংরক্ষিত)</span>
                        </label>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                    <Link
                        to={basePath}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        বাতিল (Cancel)
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-md shadow-sky-600/20 text-sm disabled:opacity-50 transition-all"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>সংরক্ষণ হচ্ছে...</span>
                            </>
                        ) : (
                            <>
                                {isEdit ? <Save className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                                <span>{isEdit ? 'আপডেট করুন' : 'সংরক্ষণ ও প্রশ্ন বিল্ডার-এ যান'}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
