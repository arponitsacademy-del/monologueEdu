import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft,
    Radio,
    Clock,
    Calendar,
    User,
    Send,
    MessageSquare,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ExternalLink,
    BookOpen,
    RefreshCw,
    Share2,
    Sparkles
} from 'lucide-react';

interface LiveClassData {
    id: number;
    course_id: number;
    title: string;
    description?: string | null;
    live_url: string;
    youtube_video_id?: string | null;
    embed_url?: string | null;
    start_time: string;
    end_time?: string | null;
    status: 'upcoming' | 'live' | 'completed' | 'cancelled';
    is_currently_live: boolean;
    course: {
        id: number;
        title: string;
        slug: string;
        thumbnail?: string | null;
    };
    creator?: {
        id: number;
        name: string;
        email: string;
    } | null;
    comments?: CommentItem[];
}

interface CommentItem {
    id: number;
    user_id: number;
    comment: string;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
    } | null;
}

const getAvatarGradient = (name: string) => {
    const gradients = [
        'from-sky-500 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-violet-500 to-purple-600',
        'from-amber-500 to-orange-600',
        'from-rose-500 to-pink-600',
        'from-cyan-500 to-blue-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
};

export const StudentLiveClassRoomPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [liveClass, setLiveClass] = useState<LiveClassData | null>(null);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchLiveClass();
        // Polling comments every 6 seconds for live chat feel
        const interval = setInterval(() => {
            fetchCommentsSilently();
        }, 6000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchLiveClass = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get(`/student/live-classes/${id}`);
            setLiveClass(data.live_class);
            setComments(data.live_class?.comments || []);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'লাইভ ক্লাসের বিবরণ লোড করা যায়নি।');
        } finally {
            setLoading(false);
        }
    };

    const fetchCommentsSilently = async () => {
        try {
            const { data } = await apiClient.get(`/student/live-classes/${id}/comments`);
            if (data.comments) {
                setComments(data.comments);
            }
        } catch {
            // silent
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submittingComment) return;

        const text = newComment.trim();
        setSubmittingComment(true);
        try {
            const { data } = await apiClient.post(`/student/live-classes/${id}/comments`, {
                comment: text,
            });
            if (data.comment) {
                setComments(prev => [...prev, data.comment]);
                setNewComment('');
                setTimeout(() => {
                    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'মন্তব্য পাঠাতে সমস্যা হয়েছে।');
        } finally {
            setSubmittingComment(false);
        }
    };

    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('bn-BD', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const formatTimeOnly = (dateStr?: string | null) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString('bn-BD', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-9 h-9 text-sky-600 animate-spin" />
                <span className="text-xs font-bold text-slate-500">লাইভ ক্লাসরুম লোড হচ্ছে...</span>
            </div>
        );
    }

    if (errorMsg || !liveClass) {
        return (
            <div className="max-w-xl mx-auto py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">ক্লাসটি লোড করা সম্ভব হয়নি</h3>
                <p className="text-xs sm:text-sm text-slate-500">{errorMsg || 'লাইভ ক্লাসটি পাওয়া যায়নি।'}</p>
                <div className="pt-2">
                    <Link
                        to="/student/live-classes"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>লাইভ ক্লাস তালিকায় ফিরুন</span>
                    </Link>
                </div>
            </div>
        );
    }

    const isLive = liveClass.status === 'live' || liveClass.is_currently_live;
    const isCompleted = liveClass.status === 'completed';

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Top Navigation Back Link */}
            <div className="flex items-center justify-between gap-4">
                <Link
                    to="/student/live-classes"
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-600 hover:text-sky-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>সকল লাইভ ক্লাস</span>
                </Link>

                {liveClass.course && (
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full flex items-center gap-1.5 truncate max-w-xs">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="truncate">{liveClass.course.title}</span>
                    </span>
                )}
            </div>

            {/* Main Live Stream Player */}
            <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
                {liveClass.embed_url ? (
                    <div className="relative w-full aspect-video bg-black">
                        <iframe
                            src={liveClass.embed_url}
                            title={liveClass.title}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    <div className="w-full aspect-video flex flex-col items-center justify-center p-8 text-center space-y-3 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white">
                        <Radio className="w-12 h-12 text-rose-500 animate-pulse" />
                        <h4 className="text-lg font-black">লাইভ স্ট্রিমিং প্রস্তুত হচ্ছে</h4>
                        <p className="text-xs text-slate-400 max-w-md">
                            শিক্ষক লাইভ লিংক যুক্ত করলেই স্ট্রিমটি স্বয়ংক্রিয়ভাবে এখানে শুরু হবে।
                        </p>
                    </div>
                )}
            </div>

            {/* Class Info & Comments Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left (8 Cols): Title, Teacher, Description */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Status Badge */}
                            {isLive && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-xs animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-white" />
                                    <span>লাইভ চলছে</span>
                                </span>
                            )}
                            {!isLive && !isCompleted && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                                    <span>আসন্ন লাইভ ক্লাস</span>
                                </span>
                            )}
                            {isCompleted && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>ক্লাস সমাপ্ত হয়েছে (রেকর্ডেড)</span>
                                </span>
                            )}

                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{formatDateTime(liveClass.start_time)}</span>
                            </span>
                        </div>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                                {liveClass.title}
                            </h1>
                            {liveClass.creator && (
                                <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span>উপস্থাপক: {liveClass.creator.name}</span>
                                </p>
                            )}
                        </div>

                        {liveClass.description && (
                            <div className="pt-3 border-t border-slate-100">
                                <h4 className="text-xs font-extrabold text-slate-800 mb-1">ক্লাসের বিবরণ ও বিষয়বস্তু:</h4>
                                <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                                    {liveClass.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right (4 Cols): Live Comments & Real-Time Q&A */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[520px]">
                        {/* Comments Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-sky-600" />
                                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                                    লাইভ আলোচনা ও প্রশ্ন ({comments.length})
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={fetchCommentsSilently}
                                title="রিফ্রেশ"
                                className="p-1 rounded-lg text-slate-400 hover:text-sky-600 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Comments Message Feed */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 divide-y divide-slate-50">
                            {comments.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                                    <MessageSquare className="w-8 h-8 opacity-40" />
                                    <p className="text-xs font-semibold">
                                        এখনও কোনো মন্তব্য নেই। ক্লাসে আপনার যেকোনো প্রশ্ন বা মতামত এখানে লিখুন!
                                    </p>
                                </div>
                            ) : (
                                comments.map((c) => {
                                    const isTeacher = c.user?.role === 'teacher' || c.user?.role === 'admin';
                                    const isMe = c.user_id === user?.id;
                                    return (
                                        <div key={c.id} className="pt-2.5 first:pt-0">
                                            <div className="flex items-start gap-2.5">
                                                <div
                                                    className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                                        c.user?.name || 'User'
                                                    )} text-white flex items-center justify-center text-[10px] font-black shrink-0`}
                                                >
                                                    {c.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <span
                                                                className={`text-xs font-bold truncate ${
                                                                    isTeacher ? 'text-sky-700' : isMe ? 'text-indigo-700' : 'text-slate-800'
                                                                }`}
                                                            >
                                                                {c.user?.name || 'শিক্ষার্থী'}
                                                            </span>
                                                            {isTeacher && (
                                                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-sky-100 text-sky-800">
                                                                    শিক্ষক
                                                                </span>
                                                            )}
                                                            {isMe && !isTeacher && (
                                                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                                                                    তুমি
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 shrink-0">
                                                            {formatTimeOnly(c.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-700 mt-1 break-words leading-relaxed">
                                                        {c.comment}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={commentsEndRef} />
                        </div>

                        {/* Comment Input Form */}
                        <form onSubmit={handleSendComment} className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    required
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="আপনার প্রশ্ন বা মন্তব্য লিখুন..."
                                    className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                                <button
                                    type="submit"
                                    disabled={submittingComment || !newComment.trim()}
                                    className="p-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:from-sky-700 hover:to-indigo-700 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                                >
                                    {submittingComment ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

