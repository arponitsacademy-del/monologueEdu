import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { SmsSetting, SmsCampaign } from '../../types';
import {
    Send,
    Users,
    BookOpen,
    UserCheck,
    PhoneCall,
    Sliders,
    MessageSquareText,
    CheckCircle2,
    AlertCircle,
    Info,
    RefreshCw,
    Loader2,
    Calendar,
    ChevronRight,
    Sparkles,
    ShieldAlert
} from 'lucide-react';

interface CourseOption {
    id: number;
    title: string;
    thumbnail?: string | null;
    enrollments_count: number;
}

interface PreviewData {
    total_recipients: number;
    sample_recipients: Array<{ name: string; phone: string }>;
    course?: { id: number; title: string; thumbnail?: string } | null;
}

export const AdminSmsMarketingPage: React.FC = () => {
    // Gateway settings
    const [settings, setSettings] = useState<SmsSetting | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);

    // Form states
    const [targetType, setTargetType] = useState<'all' | 'students' | 'teachers' | 'course' | 'custom'>('students');
    const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
    const [customNumbers, setCustomNumbers] = useState('');
    const [campaignTitle, setCampaignTitle] = useState('');
    const [message, setMessage] = useState('');

    // Auxiliary data
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Execution states
    const [sending, setSending] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
    const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchGatewaySettings();
        fetchCourses();
        fetchHistory();
    }, []);

    // Update preview when audience selection changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPreview();
        }, 300);
        return () => clearTimeout(timer);
    }, [targetType, selectedCourseId, customNumbers]);

    const fetchGatewaySettings = async () => {
        try {
            const { data } = await apiClient.get('/admin/sms-settings');
            setSettings(data);
        } catch {
            // silent fail
        } finally {
            setLoadingSettings(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const { data } = await apiClient.get('/admin/sms-marketing/courses');
            setCourses(data || []);
            if (data && data.length > 0 && !selectedCourseId) {
                setSelectedCourseId(data[0].id);
            }
        } catch {
            // handle
        }
    };

    const fetchPreview = async () => {
        if (targetType === 'course' && !selectedCourseId) {
            setPreview({ total_recipients: 0, sample_recipients: [] });
            return;
        }

        setLoadingPreview(true);
        try {
            const { data } = await apiClient.post('/admin/sms-marketing/preview', {
                target_type: targetType,
                course_id: targetType === 'course' ? selectedCourseId : undefined,
                custom_numbers: targetType === 'custom' ? customNumbers : undefined,
            });
            setPreview(data);
        } catch {
            setPreview({ total_recipients: 0, sample_recipients: [] });
        } finally {
            setLoadingPreview(false);
        }
    };

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const { data } = await apiClient.get('/admin/sms-marketing/history');
            setCampaigns(data.data || []);
        } catch {
            // handle
        } finally {
            setLoadingHistory(false);
        }
    };

    // Calculate SMS parts and characters
    const isUnicode = /[^\u0000-\u007F]/.test(message);
    const charCount = message.length;
    let smsParts = 1;
    if (charCount > 0) {
        if (isUnicode) {
            smsParts = charCount <= 70 ? 1 : Math.ceil(charCount / 67);
        } else {
            smsParts = charCount <= 160 ? 1 : Math.ceil(charCount / 153);
        }
    }
    const estimatedTotalSms = (preview?.total_recipients || 0) * smsParts;

    const insertVariable = (variable: string) => {
        setMessage(prev => prev + variable);
    };

    const handleSendCampaign = async () => {
        setShowConfirmModal(false);
        setSending(true);
        setSendSuccessMessage(null);
        setSendErrorMessage(null);

        try {
            const { data } = await apiClient.post('/admin/sms-marketing/send', {
                target_type: targetType,
                course_id: targetType === 'course' ? selectedCourseId : undefined,
                custom_numbers: targetType === 'custom' ? customNumbers : undefined,
                message,
                title: campaignTitle || undefined,
            });

            setSendSuccessMessage(data.message);
            setMessage('');
            setCampaignTitle('');
            fetchHistory();
        } catch (err: any) {
            setSendErrorMessage(err.response?.data?.message || 'Failed to send SMS. Please verify your gateway settings.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
            
            {/* Top Navigation Tabs: Configuration vs Marketing */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-2">
                <Link
                    to="/admin/sms"
                    className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-2 transition"
                >
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span>SMS Configuration</span>
                </Link>
                <div className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 text-white shadow-sm flex items-center justify-center gap-2">
                    <Send className="w-4 h-4 text-white" />
                    <span>SMS Marketing & Bulk Broadcast</span>
                </div>
            </div>

            {/* Header & Gateway Banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
                            <MessageSquareText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">SMS Marketing & Announcements</h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Send bulk SMS broadcasts to course enrollments or all registered users with one click
                            </p>
                        </div>
                    </div>

                    {/* Gateway Status Badge */}
                    <div className="flex items-center gap-2">
                        {settings?.sms_enabled ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Greenweb Gateway Active</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <Info className="w-3.5 h-3.5 text-amber-600" />
                                <span>Simulation Mode (Testing)</span>
                            </div>
                        )}
                    </div>
                </div>

                {!settings?.sms_enabled && (
                    <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                            SMS gateway is currently in simulation mode. Messages will be recorded in logs without deducting mobile credit balance. Configure an API token in SMS Configuration to send live messages.
                        </span>
                    </div>
                )}
            </div>

            {/* Notification Alerts */}
            {sendSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="font-semibold">{sendSuccessMessage}</span>
                    </div>
                    <button
                        onClick={() => setSendSuccessMessage(null)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                    >
                        Close
                    </button>
                </div>
            )}

            {sendErrorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="font-semibold">{sendErrorMessage}</span>
                    </div>
                    <button
                        onClick={() => setSendErrorMessage(null)}
                        className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline"
                    >
                        Close
                    </button>
                </div>
            )}

            {/* Main Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Cols: Form Inputs */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Step 1: Target Audience Selection */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-extrabold text-xs flex items-center justify-center">1</span>
                                <span>Select Target Audience (Recipients)</span>
                            </h3>
                            {loadingPreview && (
                                <span className="inline-flex items-center gap-1 text-xs text-sky-600 font-medium">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Calculating...</span>
                                </span>
                            )}
                        </div>

                        {/* Audience Type Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                                { id: 'students', label: 'All Students', icon: Users, desc: 'Registered students' },
                                { id: 'course', label: 'Specific Course', icon: BookOpen, desc: 'Enrolled in course' },
                                { id: 'all', label: 'All Users', icon: UserCheck, desc: 'Students & staff' },
                                { id: 'custom', label: 'Custom Numbers', icon: PhoneCall, desc: 'Direct phone input' },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = targetType === opt.id;
                                return (
                                    <button
                                        type="button"
                                        key={opt.id}
                                        onClick={() => setTargetType(opt.id as any)}
                                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                                            isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-sky-950' : 'text-slate-800'}`}>
                                                {opt.label}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dynamic Input based on Audience */}
                        {targetType === 'course' && (
                            <div className="pt-2 animate-in fade-in">
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Select Course:
                                </label>
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                >
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.title} ({course.enrollments_count} enrolled students)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {targetType === 'custom' && (
                            <div className="pt-2 animate-in fade-in">
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Mobile Numbers (comma or newline separated):
                                </label>
                                <textarea
                                    rows={3}
                                    value={customNumbers}
                                    onChange={(e) => setCustomNumbers(e.target.value)}
                                    placeholder="01700000000, 01800000000, 01900000000..."
                                    className="w-full px-3.5 py-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Enter valid 11-digit mobile numbers. Duplicate numbers will be automatically removed.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Message Composer */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-extrabold text-xs flex items-center justify-center">2</span>
                                <span>Compose SMS Message</span>
                            </h3>

                            {/* Tags helper */}
                            <div className="hidden sm:flex items-center gap-1.5 text-xs">
                                <span className="text-slate-400 text-[11px]">Variables:</span>
                                <button
                                    type="button"
                                    onClick={() => insertVariable('{name}')}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 font-mono text-[11px] rounded border border-slate-200"
                                    title="Recipient Name"
                                >
                                    + {'{name}'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertVariable('{site_name}')}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 font-mono text-[11px] rounded border border-slate-200"
                                    title="Website Name"
                                >
                                    + {'{site_name}'}
                                </button>
                                {targetType === 'course' && (
                                    <button
                                        type="button"
                                        onClick={() => insertVariable('{course_title}')}
                                        className="px-2 py-0.5 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 font-mono text-[11px] rounded border border-slate-200"
                                        title="Course Name"
                                    >
                                        + {'{course_title}'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Campaign Title (Optional) */}
                        <div>
                            <input
                                type="text"
                                placeholder="Campaign Title (optional, e.g. Physics 1st Paper Live Class Notice)"
                                value={campaignTitle}
                                onChange={(e) => setCampaignTitle(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>

                        {/* Message Textarea */}
                        <div>
                            <textarea
                                rows={5}
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your SMS message here... e.g. Dear {name}, your new live lecture has started on {site_name}."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>

                        {/* Character and SMS calculation indicator */}
                        <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 gap-2">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    isUnicode ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {isUnicode ? 'Unicode' : 'GSM / ASCII'}
                                </span>
                                <span className="text-slate-600 font-medium">
                                    Total Characters: <strong className="text-slate-900">{charCount}</strong>
                                </span>
                                <span className="text-slate-600 font-medium">
                                    Per Recipient: <strong className="text-sky-700">{smsParts}</strong> SMS parts
                                </span>
                            </div>

                            <div className="text-slate-500 font-medium text-[11px]">
                                Estimated Credits: <strong className="text-slate-900">{estimatedTotalSms}</strong> Credits
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={sending || !message.trim() || (preview?.total_recipients || 0) === 0}
                                onClick={() => setShowConfirmModal(true)}
                                className="w-full sm:w-auto px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Sending SMS...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Send to {preview?.total_recipients || 0} Recipients</span>
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>

                {/* Right 1 Col: Summary & Audience Preview */}
                <div className="space-y-6">
                    
                    {/* Live Audience Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                Audience Summary
                            </h4>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                                {preview?.total_recipients || 0}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs">
                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Audience</span>
                                <span className="font-bold text-slate-800 capitalize">
                                    {targetType === 'students' && 'All Registered Students'}
                                    {targetType === 'course' && 'Course Enrolled Students'}
                                    {targetType === 'all' && 'All Active Users'}
                                    {targetType === 'custom' && 'Custom Mobile Numbers'}
                                </span>
                            </div>

                            {preview?.course && (
                                <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2.5">
                                    {preview.course.thumbnail && (
                                        <img
                                            src={preview.course.thumbnail}
                                            alt=""
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                    )}
                                    <div className="truncate">
                                        <p className="font-bold text-slate-800 truncate text-xs">{preview.course.title}</p>
                                        <p className="text-[10px] text-slate-400">Selected Course</p>
                                    </div>
                                </div>
                            )}

                            {/* Sample Recipients */}
                            <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1.5">
                                    Sample Recipients ({preview?.sample_recipients?.length || 0})
                                </span>
                                {preview?.sample_recipients && preview.sample_recipients.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {preview.sample_recipients.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100"
                                            >
                                                <span className="font-medium text-slate-700 truncate max-w-[120px]">
                                                    {item.name}
                                                </span>
                                                <span className="font-mono text-[11px] text-slate-500">
                                                    {item.phone}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No recipients found</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick SMS Templates Box */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            <span>Pre-built Templates</span>
                        </h4>
                        <div className="space-y-2">
                            {[
                                {
                                    title: 'Live Class Notice',
                                    text: 'Dear {name}, your live lecture will begin tonight at 8:00 PM. Please join on time. - {site_name}'
                                },
                                {
                                    title: 'Discount Offer Announcement',
                                    text: 'Dear {name}, enjoy a 50% discount on all courses at Monologue Edu! Enroll today at monologueedu.com.'
                                },
                                {
                                    title: 'Urgent Notice',
                                    text: 'Important Notice: Tomorrow\'s class has been rescheduled. We will notify you shortly. - {site_name}'
                                },
                            ].map((tpl, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setMessage(tpl.text)}
                                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-100 hover:border-sky-200 transition text-xs"
                                >
                                    <span className="font-bold text-slate-800 block">{tpl.title}</span>
                                    <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{tpl.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Campaign History Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Previous SMS Campaign History</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Details and delivery status of recently broadcast campaigns</p>
                    </div>
                    <button
                        onClick={fetchHistory}
                        className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                <th className="py-3 px-6">Campaign Title</th>
                                <th className="py-3 px-6">Target Audience</th>
                                <th className="py-3 px-6">Message Summary</th>
                                <th className="py-3 px-6 text-center">Recipients (Sent/Failed)</th>
                                <th className="py-3 px-6 text-right">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        No SMS campaigns sent yet
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                                        <td className="py-4 px-6 font-bold text-slate-800">
                                            {c.title}
                                        </td>
                                        <td className="py-4 px-6">
                                            {c.course ? (
                                                <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                                    {c.course.title}
                                                </span>
                                            ) : (
                                                <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                                    {c.target_type === 'students' ? 'All Students' : c.target_type === 'all' ? 'All Users' : 'Custom'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 max-w-xs truncate text-slate-600 font-sans" title={c.message}>
                                            {c.message}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="font-bold text-emerald-600">{c.sent_count} Sent</span>
                                            {c.failed_count > 0 && (
                                                <span className="text-rose-600 font-bold ml-1.5">({c.failed_count} Failed)</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right font-medium text-slate-400 text-[11px]">
                                            {new Date(c.created_at).toLocaleString('en-US', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                            })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
                        <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-4">
                            <Send className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 text-center">
                            Confirm SMS Campaign Broadcast
                        </h3>
                        <p className="text-xs text-slate-500 text-center mt-1">
                            Are you sure you want to broadcast this message to the selected audience?
                        </p>

                        <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Recipients:</span>
                                <strong className="text-slate-800">{preview?.total_recipients}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Estimated SMS Credits:</span>
                                <strong className="text-sky-700">{estimatedTotalSms}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Target Group:</span>
                                <strong className="text-slate-800">{preview?.course?.title || targetType}</strong>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSendCampaign}
                                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20"
                            >
                                Yes, Send Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};