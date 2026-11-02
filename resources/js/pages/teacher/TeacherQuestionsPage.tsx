import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { MessageSquare, Send, CheckCircle2, User, BookOpen } from 'lucide-react';

export const TeacherQuestionsPage: React.FC = () => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState<Record<number, string>>({});
    const [submittingId, setSubmittingId] = useState<number | null>(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const { data } = await apiClient.get('/teacher/student-questions');
            setQuestions(data.data || []);
        } catch {}
        finally {
            setLoading(false);
        }
    };

    const handleSendReply = async (commentId: number) => {
        const text = replyText[commentId];
        if (!text || !text.trim()) return;

        setSubmittingId(commentId);
        try {
            const { data } = await apiClient.post(`/learning/comments/${commentId}/reply`, {
                content: text,
            });

            // Append reply to local state
            setQuestions(prev => prev.map(q => {
                if (q.id === commentId) {
                    return {
                        ...q,
                        replies: [...(q.replies || []), data.reply],
                    };
                }
                return q;
            }));

            setReplyText(prev => ({ ...prev, [commentId]: '' }));
            alert('উত্তর সফলভাবে পাঠানো হয়েছে এবং শিক্ষার্থী নোটিফিকেশন পেয়েছে।');
        } catch (err: any) {
            alert(err.response?.data?.message || 'উত্তর পাঠাতে ব্যর্থ হয়েছে।');
        } finally {
            setSubmittingId(null);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400">প্রশ্ন লোড হচ্ছে...</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-16">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">শিক্ষার্থীদের প্রশ্নোত্তর ফোরাম</h2>
                <p className="text-xs text-slate-500 mt-0.5">আপনার কোর্সের লেসন সংক্রান্ত যেকোনো প্রশ্নের উত্তর দিন</p>
            </div>

            <div className="space-y-6">
                {questions.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="font-bold text-slate-700">কোনো নতুন প্রশ্ন নেই</h4>
                        <p className="text-xs">শিক্ষার্থীরা প্রশ্ন করলে এখানে দেখতে পাবেন।</p>
                    </div>
                ) : (
                    questions.map((q) => (
                        <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                            {/* Question Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
                                        {q.user?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{q.user?.name}</h4>
                                        <span className="text-[11px] text-slate-400">
                                            {q.lesson?.course?.title} • {q.lesson?.title}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                    {new Date(q.created_at).toLocaleDateString('bn-BD')}
                                </span>
                            </div>

                            {/* Question Body */}
                            <p className="text-sm text-slate-800 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                "{q.content}"
                            </p>

                            {/* Existing Replies */}
                            {q.replies && q.replies.length > 0 && (
                                <div className="space-y-2 pl-4 border-l-2 border-sky-200">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                        পূর্ববর্তী উত্তরসমূহ:
                                    </span>
                                    {q.replies.map((reply: any) => (
                                        <div key={reply.id} className="p-3 rounded-xl bg-sky-50/50 border border-sky-100 text-xs">
                                            <div className="font-bold text-sky-950 flex items-center gap-1.5">
                                                <span>{reply.user?.name}</span>
                                                <span className="text-[10px] font-semibold text-sky-600 bg-sky-100 px-1.5 py-0.2 rounded">
                                                    {reply.user?.role === 'teacher' ? 'শিক্ষক' : 'অ্যাডমিন'}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 mt-1">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Write Reply Form */}
                            <div className="pt-2 flex items-center gap-3">
                                <input
                                    type="text"
                                    value={replyText[q.id] || ''}
                                    onChange={(e) => setReplyText(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    placeholder="আপনার উত্তর লিখুন..."
                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                />
                                <button
                                    onClick={() => handleSendReply(q.id)}
                                    disabled={submittingId === q.id || !replyText[q.id]?.trim()}
                                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-600/20 disabled:opacity-50"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>{submittingId === q.id ? 'পাঠানো হচ্ছে...' : 'উত্তর দিন'}</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
