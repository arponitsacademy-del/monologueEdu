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
            setSendErrorMessage(err.response?.data?.message || 'এসএমএস পাঠাতে সমস্যা হয়েছে। গেটওয়ে সেটিংস পরীক্ষা করুন।');
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
                    <span>এসএমএস কনফিগারেশন (Configuration)</span>
                </Link>
                <div className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 text-white shadow-sm flex items-center justify-center gap-2">
                    <Send className="w-4 h-4 text-white" />
                    <span>এসএমএস মার্কেটিং ও বাল্ক সেন্ডার (Marketing)</span>
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
                            <h1 className="text-xl font-bold text-slate-900">এসএমএস মার্কেটিং ও ঘোষণা</h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                নির্দিষ্ট কোর্সের শিক্ষার্থী অথবা ওয়েবসাইটের সকল গ্রাহকদের এক ক্লিকে বাল্ক বার্তা পাঠান
                            </p>
                        </div>
                    </div>

                    {/* Gateway Status Badge */}
                    <div className="flex items-center gap-2">
                        {settings?.sms_enabled ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>গ্রিনওয়েব গেটওয়ে সক্রিয়</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <Info className="w-3.5 h-3.5 text-amber-600" />
                                <span>সিমুলেশন মোড (টেস্টিং)</span>
                            </div>
                        )}
                    </div>
                </div>

                {!settings?.sms_enabled && (
                    <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                            এসএমএস গেটওয়ে বর্তমানে সিমুলেশন মোডে রয়েছে। বার্তা পাঠালে তা সফলভাবে প্রসেস হবে এবং লগ ফাইলে রেকর্ড থাকবে, কিন্তু কোনো মোবাইল ব্যালেন্স কাটবে না। লাইভ এসএমএস পাঠাতে "এসএমএস কনফিগারেশন" থেকে এপিআই টোকেন দিয়ে গেটওয়ে সক্রিয় করুন।
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
                        বন্ধ করুন
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
                        বন্ধ করুন
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
                                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-extrabold text-xs flex items-center justify-center">১</span>
                                <span>কাদের এসএমএস পাঠাতে চান? (টার্গেট প্রাপক)</span>
                            </h3>
                            {loadingPreview && (
                                <span className="inline-flex items-center gap-1 text-xs text-sky-600 font-medium">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>হিসাব হচ্ছে...</span>
                                </span>
                            )}
                        </div>

                        {/* Audience Type Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                                { id: 'students', label: 'সকল শিক্ষার্থী', icon: Users, desc: 'নিবন্ধিত সব ছাত্র' },
                                { id: 'course', label: 'নির্দিষ্ট কোর্স', icon: BookOpen, desc: 'একটি নির্দিষ্ট কোর্স' },
                                { id: 'all', label: 'সকল ইউজার', icon: UserCheck, desc: 'ছাত্র, শিক্ষক ও অন্যান্য' },
                                { id: 'custom', label: 'কাস্টম নম্বর', icon: PhoneCall, desc: 'নিজে নম্বর লিখুন' },
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
                                    কোর্স নির্বাচন করুন:
                                </label>
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                >
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.title} ({course.enrollments_count} জন এনরোল্ড শিক্ষার্থী)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {targetType === 'custom' && (
                            <div className="pt-2 animate-in fade-in">
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    মোবাইল নম্বরসমূহ (কমা অথবা নতুন লাইনে লিখুন):
                                </label>
                                <textarea
                                    rows={3}
                                    value={customNumbers}
                                    onChange={(e) => setCustomNumbers(e.target.value)}
                                    placeholder="01700000000, 01800000000, 01900000000..."
                                    className="w-full px-3.5 py-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    ১১ ডিজিটের বৈধ বাংলাদেশি মোবাইল নম্বর লিখুন। ডুপ্লিকেট নম্বর স্বয়ংক্রিয়ভাবে বাদ দেওয়া হবে।
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Message Composer */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-extrabold text-xs flex items-center justify-center">২</span>
                                <span>এসএমএস বার্তা লিখুন (Message Body)</span>
                            </h3>

                            {/* Tags helper */}
                            <div className="hidden sm:flex items-center gap-1.5 text-xs">
                                <span className="text-slate-400 text-[11px]">ভেরিয়েবল:</span>
                                <button
                                    type="button"
                                    onClick={() => insertVariable('{name}')}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 font-mono text-[11px] rounded border border-slate-200"
                                    title="প্রাপকের নাম"
                                >
                                    + {'{name}'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertVariable('{site_name}')}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 font-mono text-[11px] rounded border border-slate-200"
                                    title="ওয়েবসাইট নাম"
                                >
                                    + {'{site_name}'}
                                </button>
                                {targetType === 'course' && (
                                    <button
                                        type="button"
                                        onClick={() => insertVariable('{course_title}')}
                                        className="px-2 py-0.5 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 font-mono text-[11px] rounded border border-slate-200"
                                        title="কোর্সের নাম"
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
                                placeholder="ক্যাম্পেইনের নাম (ঐচ্ছিক, যেমন: ফিজিক্স ১ম পত্র লাইভ ক্লাস নোটিশ)"
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
                                placeholder="এখানে এসএমএস মেসেজটি লিখুন... যেমন: প্রিয় {name}, আপনার কোর্সের নতুন লাইভ ক্লাস শুরু হয়েছে।"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>

                        {/* Character and SMS calculation indicator */}
                        <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 gap-2">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    isUnicode ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {isUnicode ? 'বাংলা (Unicode)' : 'ইংরেজি (GSM)'}
                                </span>
                                <span className="text-slate-600 font-medium">
                                    মোট অক্ষর: <strong className="text-slate-900">{charCount}</strong>
                                </span>
                                <span className="text-slate-600 font-medium">
                                    প্রতি প্রাপক: <strong className="text-sky-700">{smsParts}</strong> এসএমএস
                                </span>
                            </div>

                            <div className="text-slate-500 font-medium text-[11px]">
                                আনুমানিক খরচ: <strong className="text-slate-900">{estimatedTotalSms}</strong> টি ক্রেডিট
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
                                        <span>এসএমএস পাঠানো হচ্ছে...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>{preview?.total_recipients || 0} জন প্রাপককে পাঠান</span>
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
                                অডিয়েন্স সারাংশ
                            </h4>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                                {preview?.total_recipients || 0} জন
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs">
                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">টার্গেট ধরন</span>
                                <span className="font-bold text-slate-800 capitalize">
                                    {targetType === 'students' && 'সকল নিবন্ধিত শিক্ষার্থী'}
                                    {targetType === 'course' && 'কোর্সের এনরোল্ড শিক্ষার্থী'}
                                    {targetType === 'all' && 'সকল সক্রিয় ইউজার'}
                                    {targetType === 'custom' && 'কাস্টম মোবাইল নম্বর'}
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
                                        <p className="text-[10px] text-slate-400">নির্বাচিত কোর্স</p>
                                    </div>
                                </div>
                            )}

                            {/* Sample Recipients */}
                            <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1.5">
                                    নমুনা প্রাপক তালিকা ({preview?.sample_recipients?.length || 0})
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
                                    <p className="text-xs text-slate-400 italic">কোনো প্রাপক খুঁজে পাওয়া যায়নি</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick SMS Templates Box */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            <span>রেডিমেড টেমপ্লেট</span>
                        </h4>
                        <div className="space-y-2">
                            {[
                                {
                                    title: 'লাইভ ক্লাস নোটিশ',
                                    text: 'প্রিয় {name}, আজ রাত ৮:০০ টায় আপনার কোর্সের লাইভ ক্লাস শুরু হবে। যথাসময়ে জয়েন করুন। - {site_name}'
                                },
                                {
                                    title: 'ডিসকাউন্ট অফার ঘোষণা',
                                    text: 'প্রিয় {name}, Novonex Academy-এর সকল কোর্সে চলছে ৫০% মেগা ছাড়! আজই এনরোল করুন। ভিজিট করুন আমাদের ওয়েবসাইট।'
                                },
                                {
                                    title: 'জরুরী নোটিশ',
                                    text: 'বিশেষ নোটিশ: আগামীকালের ক্লাস স্থগিত করা হয়েছে। পরবর্তী ক্লাসের সময়সূচি শীঘ্রই জানানো হবে। - {site_name}'
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
                        <h3 className="text-base font-bold text-slate-900">পূর্ববর্তী এসএমএস ক্যাম্পেইন ইতিহাস</h3>
                        <p className="text-xs text-slate-500 mt-0.5">সম্প্রতি প্রেরিত বাল্ক মেসেজগুলোর বিবরণ ও ডেলিভারি রিপোর্ট</p>
                    </div>
                    <button
                        onClick={fetchHistory}
                        className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                        title="রিফ্রেশ"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                <th className="py-3 px-6">ক্যাম্পেইন শিরোনাম</th>
                                <th className="py-3 px-6">টার্গেট অডিয়েন্স</th>
                                <th className="py-3 px-6">মেসেজ সারসংক্ষেপ</th>
                                <th className="py-3 px-6 text-center">প্রাপক (সফল/ব্যর্থ)</th>
                                <th className="py-3 px-6 text-right">তারিখ ও সময়</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        এখনও কোনো এসএমএস ক্যাম্পেইন পাঠানো হয়নি
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
                                                    {c.target_type === 'students' ? 'সকল শিক্ষার্থী' : c.target_type === 'all' ? 'সকল গ্রাহক' : 'কাস্টম'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 max-w-xs truncate text-slate-600 font-sans" title={c.message}>
                                            {c.message}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="font-bold text-emerald-600">{c.sent_count} সফল</span>
                                            {c.failed_count > 0 && (
                                                <span className="text-rose-600 font-bold ml-1.5">({c.failed_count} ব্যর্থ)</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right font-medium text-slate-400 text-[11px]">
                                            {new Date(c.created_at).toLocaleString('bn-BD', {
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
                            এসএমএস ক্যাম্পেইন নিশ্চিতকরণ
                        </h3>
                        <p className="text-xs text-slate-500 text-center mt-1">
                            আপনি কি নিশ্চিতভাবে এই বার্তাটি প্রচার করতে চান?
                        </p>

                        <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">মোট প্রাপক:</span>
                                <strong className="text-slate-800">{preview?.total_recipients} জন</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">মোট এসএমএস ক্রেডিট:</span>
                                <strong className="text-sky-700">{estimatedTotalSms} টি</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">টার্গেট গ্রুপ:</span>
                                <strong className="text-slate-800">{preview?.course?.title || targetType}</strong>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                            >
                                বাতিল
                            </button>
                            <button
                                type="button"
                                onClick={handleSendCampaign}
                                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20"
                            >
                                হ্যাঁ, এখনই পাঠান
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
