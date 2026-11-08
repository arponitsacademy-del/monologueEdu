import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { CoursePurchaseSmsSetting, CourseSmsTemplate } from '../../types';
import { 
    MessageSquare, 
    Send, 
    Save, 
    Trash2, 
    Edit3, 
    CheckCircle2, 
    AlertCircle, 
    Smartphone, 
    Plus, 
    Layers, 
    Sparkles, 
    RefreshCw,
    Info,
    BookOpen
} from 'lucide-react';

interface CourseOption {
    id: number;
    title: string;
    price: number;
}

const AVAILABLE_TAGS = [
    { tag: '{student_name}', label: 'Student Name', desc: 'Full name of the student' },
    { tag: '{course_title}', label: 'Course Title', desc: 'Title of the enrolled course' },
    { tag: '{order_id}', label: 'Order ID', desc: 'Unique order identifier' },
    { tag: '{amount}', label: 'Amount Paid', desc: 'Final amount paid in BDT' },
    { tag: '{site_name}', label: 'Site Name', desc: 'Monologue Edu' },
    { tag: '{login_url}', label: 'Login URL', desc: 'Direct portal login link' },
];

export const AdminAutoSmsPushPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [savingGeneral, setSavingGeneral] = useState(false);
    const [savingCourse, setSavingCourse] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);

    // Settings state
    const [enabled, setEnabled] = useState(true);
    const [generalTemplate, setGeneralTemplate] = useState('');
    const [courseTemplates, setCourseTemplates] = useState<CourseSmsTemplate[]>([]);
    const [courses, setCourses] = useState<CourseOption[]>([]);

    // Form for course override
    const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
    const [courseTemplateText, setCourseTemplateText] = useState('');
    const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

    // Test SMS
    const [testPhone, setTestPhone] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; rendered?: string } | null>(null);

    // Feedback
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [autoSmsRes, coursesRes] = await Promise.all([
                apiClient.get('/admin/sms/auto-push').catch(err => {
                    console.error('Auto SMS settings API error:', err);
                    return { data: null };
                }),
                apiClient.get('/admin/courses', { params: { per_page: 100 } }).catch(err => {
                    console.error('Courses API error:', err);
                    return { data: null };
                }),
            ]);

            if (autoSmsRes?.data) {
                setEnabled(Boolean(autoSmsRes.data.setting?.enabled));
                setGeneralTemplate(autoSmsRes.data.setting?.general_template || '');
                setCourseTemplates(autoSmsRes.data.course_templates || []);
                if (autoSmsRes.data.courses && autoSmsRes.data.courses.length > 0) {
                    setCourses(autoSmsRes.data.courses);
                }
            }

            // Always ensure courses list is populated from /admin/courses if not already
            if (coursesRes?.data?.data && coursesRes.data.data.length > 0) {
                setCourses(coursesRes.data.data.map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    price: Number(c.price) || 0,
                })));
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to load Auto SMS Push settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingGeneral(true);
        setFeedback(null);
        try {
            const { data } = await apiClient.put('/admin/sms/auto-push/settings', {
                enabled,
                general_template: generalTemplate,
            });
            setFeedback({ type: 'success', message: data.message || 'General settings saved successfully.' });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to save general settings.' });
        } finally {
            setSavingGeneral(false);
        }
    };

    const handleSaveCourseOverride = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourseId) {
            alert('Please select a course.');
            return;
        }
        if (!courseTemplateText.trim()) {
            alert('Please enter an SMS template.');
            return;
        }

        setSavingCourse(true);
        setFeedback(null);
        try {
            const { data } = await apiClient.post('/admin/sms/auto-push/courses', {
                course_id: selectedCourseId,
                template: courseTemplateText,
                is_active: true,
            });
            setFeedback({ type: 'success', message: data.message || 'Course override saved successfully.' });
            
            // Reset form
            setSelectedCourseId('');
            setCourseTemplateText('');
            setEditingTemplateId(null);
            
            // Refresh list
            fetchData();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to save course override.' });
        } finally {
            setSavingCourse(false);
        }
    };

    const handleEditCourse = (t: CourseSmsTemplate) => {
        setSelectedCourseId(t.course_id);
        setCourseTemplateText(t.template);
        setEditingTemplateId(t.id);
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    const handleDeleteCourse = async (id: number) => {
        if (!confirm('Are you sure you want to remove this course custom SMS? Default general SMS will be used instead.')) {
            return;
        }
        try {
            const { data } = await apiClient.delete(`/admin/sms/auto-push/courses/${id}`);
            setFeedback({ type: 'success', message: data.message || 'Course override removed.' });
            setCourseTemplates(prev => prev.filter(t => t.id !== id));
            if (editingTemplateId === id) {
                setSelectedCourseId('');
                setCourseTemplateText('');
                setEditingTemplateId(null);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete template.');
        }
    };

    const handleSendTestSms = async () => {
        if (!testPhone.trim()) {
            alert('Please enter a recipient phone number.');
            return;
        }
        setSendingTest(true);
        setTestResult(null);
        try {
            const templateToTest = courseTemplateText.trim() ? courseTemplateText : generalTemplate;
            const { data } = await apiClient.post('/admin/sms/auto-push/test', {
                phone: testPhone,
                template: templateToTest,
                course_id: selectedCourseId || undefined,
            });
            setTestResult({
                success: true,
                message: data.message,
                rendered: data.rendered_message,
            });
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'Failed to send test SMS.',
            });
        } finally {
            setSendingTest(false);
        }
    };

    const insertTag = (tag: string, target: 'general' | 'course') => {
        if (target === 'general') {
            setGeneralTemplate(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + tag);
        } else {
            setCourseTemplateText(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + tag);
        }
    };

    // Calculate preview for general
    const renderPreview = (tpl: string) => {
        return tpl
            .replace(/{student_name}/g, 'John Doe')
            .replace(/{course_title}/g, 'HSC Physics Complete Mastery')
            .replace(/{order_id}/g, 'ORD-10293')
            .replace(/{amount}/g, '৳2,500.00')
            .replace(/{site_name}/g, 'Monologue Edu')
            .replace(/{login_url}/g, 'https://monologueedu.com/login');
    };

    if (loading) {
        return (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
                <span className="text-sm font-semibold">Loading Auto SMS Push settings...</span>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <MessageSquare className="w-7 h-7 text-sky-600" />
                        <span>Auto SMS Push on Course Purchase</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Configure automated transactional SMS sent to students immediately after course enrollment.
                    </p>
                </div>

                <button
                    onClick={fetchData}
                    className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                </button>
            </div>

            {feedback && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold animate-in fade-in ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    {feedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Master Toggle Banner */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <h3 className="text-sm font-bold text-slate-900">
                            Automatic SMS Delivery on Course Purchase
                        </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                        When enabled, any successful purchase or approved order triggers an instant SMS to the student's mobile number.
                    </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
            </div>

            {/* SECTION 1: General SMS Template (Default Fallback) */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                            <Layers className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">1. General Purchase SMS Template (Default Fallback)</h3>
                            <p className="text-xs text-slate-500">
                                This message will be sent whenever a student purchases a course that does not have a specific custom template override.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSaveGeneral} className="space-y-5">
                    {/* Placeholder Tags Pills */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            <span>Click to Insert Dynamic Placeholders:</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {AVAILABLE_TAGS.map(t => (
                                <button
                                    key={t.tag}
                                    type="button"
                                    onClick={() => insertTag(t.tag, 'general')}
                                    title={t.desc}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-700 text-xs font-mono font-semibold rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
                                >
                                    + {t.tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Textarea */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700">General SMS Template Text *</label>
                            <span className="text-[11px] font-mono text-slate-400">
                                {generalTemplate.length} characters ({Math.ceil(generalTemplate.length / 160) || 1} SMS)
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            value={generalTemplate}
                            onChange={(e) => setGeneralTemplate(e.target.value)}
                            placeholder="Dear {student_name}, your course {course_title} purchase is confirmed!..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                            required
                        />
                    </div>

                    {/* Live Preview */}
                    <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-start gap-3">
                        <Smartphone className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                            <span className="font-bold text-sky-900 block">Rendered Preview (Sample Student):</span>
                            <p className="text-sky-800 font-mono bg-white/80 p-2.5 rounded-xl border border-sky-200/70 leading-relaxed">
                                {renderPreview(generalTemplate) || 'Type above to see live SMS preview...'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={savingGeneral}
                        className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        <span>{savingGeneral ? 'Saving...' : 'Save General Template'}</span>
                    </button>
                </form>
            </div>

            {/* SECTION 2: Course-Specific SMS Overrides */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">2. Course-Specific SMS Overrides</h3>
                            <p className="text-xs text-slate-500">
                                Set dedicated SMS messages for specific courses (e.g. including a private Telegram group link, batch details, or special orientation guidelines).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form to Add / Edit Course Override */}
                <form onSubmit={handleSaveCourseOverride} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {editingTemplateId ? 'Edit Course SMS Override' : 'Create New Course SMS Override'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Select Course *</label>
                            <select
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                                required
                            >
                                <option value="">-- Choose a Course ({courses.length > 0 ? `${courses.length} courses available` : 'Loading...'}) --</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.title} (৳{c.price})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Click to Insert Dynamic Placeholders:</label>
                            <div className="flex flex-wrap gap-1">
                                {AVAILABLE_TAGS.map(t => (
                                    <button
                                        key={t.tag}
                                        type="button"
                                        onClick={() => insertTag(t.tag, 'course')}
                                        className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-[11px] font-mono text-slate-600 rounded border border-slate-200 transition"
                                    >
                                        + {t.tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700">Course Custom SMS Text *</label>
                            <span className="text-[11px] font-mono text-slate-400">
                                {courseTemplateText.length} characters ({Math.ceil(courseTemplateText.length / 160) || 1} SMS)
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            value={courseTemplateText}
                            onChange={(e) => setCourseTemplateText(e.target.value)}
                            placeholder="Dear {student_name}, welcome to {course_title}! Join our batch group: https://t.me/... - Monologue Edu"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={savingCourse}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>{savingCourse ? 'Saving...' : editingTemplateId ? 'Update Course Override' : 'Save Course Override'}</span>
                        </button>

                        {editingTemplateId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCourseId('');
                                    setCourseTemplateText('');
                                    setEditingTemplateId(null);
                                }}
                                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                {/* List of Configured Course Overrides */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">
                        Configured Course Overrides ({courseTemplates.length})
                    </h4>

                    {courseTemplates.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                            No course-specific overrides configured yet. All courses currently use the General Template above.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                            {courseTemplates.map((item) => (
                                <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/70 transition">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">
                                                Course Override
                                            </span>
                                            <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                                                {item.course?.title || `Course ID #${item.course_id}`}
                                            </h5>
                                        </div>
                                        <p className="text-xs font-mono text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                                            {item.template}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                        <button
                                            onClick={() => handleEditCourse(item)}
                                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                            title="Edit Override"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCourse(item.id)}
                                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                            title="Delete Override"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 3: Live SMS Tester */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Send className="w-5 h-5 text-sky-600" />
                    <h3 className="text-base font-bold text-slate-900">Test SMS Delivery</h3>
                </div>
                <p className="text-xs text-slate-500">
                    Send a test message to your personal mobile number to verify dynamic tags and gateway delivery.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="017xxxxxxxx"
                        className="w-full sm:max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                        onClick={handleSendTestSms}
                        disabled={sendingTest}
                        className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingTest ? 'Sending...' : 'Send Test SMS'}</span>
                    </button>
                </div>

                {testResult && (
                    <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                        testResult.success 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                        <div className="font-bold flex items-center gap-1.5">
                            {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span>Result: {testResult.message}</span>
                        </div>
                        {testResult.rendered && (
                            <div className="font-mono bg-white/70 p-2 rounded-lg mt-1 border border-emerald-300">
                                Dispatched SMS: {testResult.rendered}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

