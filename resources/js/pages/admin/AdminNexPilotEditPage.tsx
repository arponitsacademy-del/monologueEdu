import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import {
    Bot,
    ArrowLeft,
    Check,
    Save,
    Sparkles,
    Wrench,
    AlertCircle,
    Loader2,
    DollarSign,
    Info,
    BookOpen,
    Cpu
} from 'lucide-react';

export const AdminNexPilotEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState<number>(0);
    const [shortDescription, setShortDescription] = useState('');
    const [longDescription, setLongDescription] = useState('');
    const [maxUsdLimit, setMaxUsdLimit] = useState<number>(2.0);
    const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Fetch eligible courses
            const { data: coursesData } = await apiClient.get('/admin/nexpilot/courses');
            setCourses(coursesData || []);

            if (isEditMode) {
                const { data: pilot } = await apiClient.get(`/admin/nexpilot/${id}`);
                setSelectedCourseId(pilot.course_id);
                setTitle(pilot.title || '');
                setPrice(pilot.price || 0);
                setShortDescription(pilot.short_description || '');
                setLongDescription(pilot.long_description || '');
                setMaxUsdLimit(pilot.max_usd_limit || 2.0);
                setOpenaiModel(pilot.openai_model || 'gpt-4o-mini');
                setOpenaiApiKey(pilot.openai_api_key || '');
                setSystemPrompt(pilot.system_prompt || '');
                setIsActive(Boolean(pilot.is_active));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load details.');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSelect = (courseId: number) => {
        setSelectedCourseId(courseId);
        const course = courses.find(c => c.id === courseId);
        if (course && !title) {
            setTitle(`${course.title} NexPilot`);
        }
        if (!shortDescription) {
            setShortDescription('24/7 personal AI tutor and practice solving coach');
        }
    };

    const handleSubmit = async (e: React.FormEvent, proceedToBuilder = false) => {
        e.preventDefault();
        if (!selectedCourseId) {
            setError('Please select a course.');
            return;
        }

        setError(null);
        setSaving(true);

        const payload = {
            course_id: Number(selectedCourseId),
            title: title.trim(),
            price: Number(price) || 0,
            short_description: shortDescription.trim(),
            long_description: longDescription.trim(),
            max_usd_limit: Number(maxUsdLimit) || 2.0,
            system_prompt: systemPrompt?.trim() || null,
            is_active: isActive,
        };

        try {
            if (isEditMode) {
                await apiClient.put(`/admin/nexpilot/${id}`, payload);
                if (proceedToBuilder) {
                    navigate(`/admin/nexpilot/${id}/builder`);
                } else {
                    navigate('/admin/nexpilot');
                }
            } else {
                const { data } = await apiClient.post('/admin/nexpilot', payload);
                const newId = data.pilot?.id;
                if (proceedToBuilder && newId) {
                    navigate(`/admin/nexpilot/${newId}/builder`);
                } else {
                    navigate('/admin/nexpilot');
                }
            }
        } catch (err: any) {
            const validationErrors = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(' ')
                : null;
            setError(validationErrors || err.response?.data?.message || 'Failed to save pilot.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                <span className="text-xs font-bold">Loading...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/nexpilot"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {isEditMode ? 'Edit NexPilot' : 'Create New NexPilot'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Link course, set pricing, and configure token usage limits
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                {/* 1. Course Selection & Basic Info */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-sky-600" />
                        <span>Course & Pilot Details</span>
                    </h3>

                    {/* Select Course */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Target Course <span className="text-rose-500">*</span>
                        </label>
                        <select
                            required
                            value={selectedCourseId}
                            onChange={(e) => handleCourseSelect(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="">-- Select Course --</option>
                            {courses.map((course) => {
                                const isCurrentCourse = isEditMode && course.id === selectedCourseId;
                                const isOwnedByAnotherPilot = course.has_pilot && (!isEditMode || course.id !== selectedCourseId);

                                return (
                                    <option
                                        key={course.id}
                                        value={course.id}
                                        disabled={isOwnedByAnotherPilot}
                                    >
                                        {course.title}
                                        {isCurrentCourse ? ' (Current Course)' : ''}
                                        {isOwnedByAnotherPilot ? ' (Already linked to another pilot)' : ''}
                                        {` (${formatBDT(course.price)})`}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Pilot Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            NexPilot Name / Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Physics 1st Paper NexPilot"
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Short Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Short Description
                        </label>
                        <input
                            type="text"
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            placeholder="Displayed on checkout page for students..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Long Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Detailed Description
                        </label>
                        <textarea
                            rows={3}
                            value={longDescription}
                            onChange={(e) => setLongDescription(e.target.value)}
                            placeholder="Describe how this pilot helps students..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                </div>

                {/* 2. Pricing & Token/Dollar Budget Limits */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span>Pricing & Token Budget Limits</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Price in BDT */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                NexPilot Add-on Fee (৳) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                    ৳
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    step="1"
                                    required
                                    value={price}
                                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                                    placeholder="500"
                                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Students pay this fee during checkout to unlock this AI pilot.
                            </p>
                        </div>

                        {/* Max USD Limit per student */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <span>Maximum Budget Limit (USD / $)</span>
                                <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                    $
                                </span>
                                <input
                                    type="number"
                                    min={0.1}
                                    max={100}
                                    step="0.1"
                                    required
                                    value={maxUsdLimit}
                                    onChange={(e) => setMaxUsdLimit(parseFloat(e.target.value) || 2.0)}
                                    placeholder="2.00"
                                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Maximum dollar value of tokens each student can consume in chat.
                            </p>
                        </div>
                    </div>

                    {/* Explanatory Info Card */}
                    <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 text-xs text-sky-900 dark:text-sky-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                            <Info className="w-4 h-4 text-sky-600" />
                            <span>Token & Dollar Cost Estimation</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            On OpenAI's <strong>gpt-4o-mini</strong> model, $1.00 can process approximately <strong>2 million tokens</strong> (over 2,000 question-answer pairs)! Therefore, <strong>${maxUsdLimit}</strong> is more than enough for a student to complete all theories and practices in the course.
                        </p>
                    </div>
                </div>

                {/* 3. AI Model & System Prompt */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-indigo-600" />
                        <span>AI Model & Course Guidelines</span>
                    </h3>

                    {/* Centrally Connected Notice */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/30 border border-sky-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>
                                OpenAI model and API connection are centrally managed in <strong className="text-sky-600 dark:text-sky-400 font-bold">AI Model Configuration</strong>.
                            </span>
                        </div>
                        <Link
                            to="/admin/nexpilot/ai-configuration"
                            className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold hover:underline shrink-0 text-xs"
                            target="_blank"
                        >
                            <span>Configure Model</span>
                            <span>→</span>
                        </Link>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Optional Course System Prompt
                        </label>
                        <textarea
                            rows={3}
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="e.g. In this course, explain physics concepts with practical examples and equations..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Active Status</span>
                            <span className="text-[11px] text-slate-400">When active, students can see and purchase this pilot at checkout</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                        </label>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/nexpilot')}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Pilot'}</span>
                    </button>

                    <button
                        type="button"
                        disabled={saving}
                        onClick={(e) => handleSubmit(e, true)}
                        className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <Wrench className="w-4 h-4" />
                        <span>Save & Open Builder</span>
                    </button>
                </div>
            </form>
        </div>
    );
};
