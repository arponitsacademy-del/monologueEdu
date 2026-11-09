import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
    Bot,
    ArrowLeft,
    BookOpen,
    Sparkles,
    Send,
    Loader2,
    AlertCircle,
    Paperclip,
    FileText,
    ExternalLink,
    CheckCircle2,
    RotateCcw,
    ChevronLeft,
    Lightbulb,
    HelpCircle,
    Check
} from 'lucide-react';
import { AiMarkdownMessage } from '../../components/shared/AiMarkdownMessage';

interface Topic {
    id: number;
    type: 'theory' | 'practice';
    title: string;
    description?: string;
    attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
}

export const StudentNexPilotPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();

    const [pilotInfo, setPilotInfo] = useState<any>(null);
    const [usage, setUsage] = useState<any>(null);
    const [theoryTopics, setTheoryTopics] = useState<Topic[]>([]);
    const [practiceTopics, setPracticeTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Active mode: 'theory' or 'practice'
    const [activeMode, setActiveMode] = useState<'theory' | 'practice'>('theory');

    // Currently selected topic for Chat
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [limitReached, setLimitReached] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchPilotData();
    }, [courseId]);

    useEffect(() => {
        if (selectedTopic) {
            fetchTopicHistory(selectedTopic.id);
        }
    }, [selectedTopic]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    const fetchPilotData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await apiClient.get(`/student/nexpilot/courses/${courseId}`);
            setPilotInfo(data.pilot);
            setUsage(data.usage);
            setTheoryTopics(data.theory_topics || []);
            setPracticeTopics(data.practice_topics || []);
            if (data.usage?.is_blocked) {
                setLimitReached(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to access NexPilot.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTopicHistory = async (topicId: number) => {
        setLoadingHistory(true);
        try {
            const { data } = await apiClient.get(`/student/nexpilot/topics/${topicId}/history`);
            setMessages(data.messages || []);
        } catch (err) {
            console.error('Failed to load chat history', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSendMessage = async (textToSend?: string) => {
        const text = (textToSend || inputMessage).trim();
        if (!text || !selectedTopic || sending || limitReached) return;

        setInputMessage('');

        const optimisticUserMessage = {
            id: Date.now(),
            role: 'user',
            content: text,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticUserMessage]);
        setSending(true);

        try {
            const { data } = await apiClient.post(`/student/nexpilot/topics/${selectedTopic.id}/chat`, {
                message: text,
            });

            if (data.message) {
                setMessages(prev => [...prev, data.message]);
            }

            if (data.usage) {
                setUsage(data.usage);
                if (data.usage.is_blocked) {
                    setLimitReached(true);
                }
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || 'Failed to generate AI response. Please try again.';
            if (err.response?.data?.is_limit_reached) {
                setLimitReached(true);
            }
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `⚠️ ${errMsg}`,
                    created_at: new Date().toISOString(),
                },
            ]);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                <span className="text-xs font-bold">Loading NexPilot AI...</span>
            </div>
        );
    }

    if (error || !pilotInfo) {
        return (
            <div className="max-w-2xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm my-12">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {error || 'NexPilot Not Active'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    NexPilot add-on is not active for this course or is being configured by the instructor.
                </p>
                <div className="pt-2">
                    <Link
                        to="/student/my-courses"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to My Courses</span>
                    </Link>
                </div>
            </div>
        );
    }

    const currentTopics = activeMode === 'theory' ? theoryTopics : practiceTopics;

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Top Navigation & Balance Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-3">
                    <Link
                        to="/student/my-courses"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Go Back"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                                {pilotInfo.title}
                            </h2>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-full">
                                AI Assistant
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Course: <strong>{pilotInfo.course_title}</strong>
                        </p>
                    </div>
                </div>

                {/* AI Balance Meter */}
                {usage && (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Usage Balance</p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                                ${parseFloat(usage.remaining_usd || 0).toFixed(2)} remaining{' '}
                                <span className="text-[11px] font-normal text-slate-400">/ ${parseFloat(usage.max_usd_limit || 2).toFixed(2)}</span>
                            </p>
                        </div>
                        <div className="w-20 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-sky-500 h-full rounded-full transition-all"
                                style={{
                                    width: `${Math.min(100, ((usage.remaining_usd || 0) / (usage.max_usd_limit || 2)) * 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Mode Switcher: Theory vs Practice */}
            {!selectedTopic && (
                <div className="bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl flex gap-2 max-w-md mx-auto shadow-xs border border-slate-200/80 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setActiveMode('theory')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${activeMode === 'theory'
                            ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/20 scale-[1.01]'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/50'
                            }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm">Theory</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${activeMode === 'theory' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700'
                            }`}>
                            {theoryTopics.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveMode('practice')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${activeMode === 'practice'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 scale-[1.01]'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/50'
                            }`}
                    >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span className="text-sm">Practice</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${activeMode === 'practice' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700'
                            }`}>
                            {practiceTopics.length}
                        </span>
                    </button>
                </div>
            )}

            {/* View 1: Topics Selection Grid (When no topic selected) */}
            {!selectedTopic ? (
                <div className="space-y-4">
                    <div className="text-center max-w-lg mx-auto space-y-1">
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                            {activeMode === 'theory' ? '📖 Start Reading Theory' : '🎯 Solve Problems & Practice'}
                        </h3>
                        <p className="text-xs text-slate-400">
                            {activeMode === 'theory'
                                ? 'Select any topic, and NexPilot will explain each concept clearly with examples.'
                                : 'Select a topic, and NexPilot will guide you through solving problems step by step.'}
                        </p>
                    </div>

                    {currentTopics.length === 0 ? (
                        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <Bot className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="text-xs font-bold text-slate-500">No topics found at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentTopics.map((topic, index) => (
                                <div
                                    key={topic.id}
                                    onClick={() => setSelectedTopic(topic)}
                                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-sky-400 dark:hover:border-slate-600 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                                >
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${topic.type === 'theory'
                                                ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                                }`}>
                                                Topic {index + 1}
                                            </span>
                                            {topic.attachments && topic.attachments.length > 0 && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Paperclip className="w-3 h-3" />
                                                    <span>{topic.attachments.length} files</span>
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                            {topic.title}
                                        </h4>
                                        {topic.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                {topic.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform">
                                        <span>{topic.type === 'theory' ? 'Start Reading' : 'Start Practice'}</span>
                                        <span>→</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* View 2: Active Chatbot Room with Topic */
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[75vh]">
                    {/* Topic Header inside Chat */}
                    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSelectedTopic(null)}
                                className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Topics List</span>
                            </button>

                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>{selectedTopic.title}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedTopic.type === 'theory'
                                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                        }`}>
                                        {selectedTopic.type === 'theory' ? 'Theory Class' : 'Practice Coach'}
                                    </span>
                                </h3>
                            </div>
                        </div>

                        {/* Attachments Pills if available */}
                        {selectedTopic.attachments && selectedTopic.attachments.length > 0 && (
                            <div className="hidden md:flex items-center gap-2">
                                <span className="text-[11px] text-slate-400 font-medium">Notes/Slides:</span>
                                {selectedTopic.attachments.map((att, i) => (
                                    <a
                                        key={i}
                                        href={att.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                                    >
                                        <FileText className="w-3 h-3 text-sky-600" />
                                        <span className="truncate max-w-[120px]">{att.name}</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/30">
                        {/* Welcome Card if no messages yet */}
                        {messages.length === 0 && !loadingHistory && (
                            <div className="max-w-xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-3 my-6 animate-in fade-in">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-md shadow-sky-500/20">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                    {selectedTopic.type === 'theory' ? 'Welcome to Theory Class!' : 'Welcome to Practice Session!'}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {selectedTopic.type === 'theory'
                                        ? `I am NexPilot, your personal tutor for "${selectedTopic.title}". Feel free to ask any question or click 'Explain Concepts' below.`
                                        : `I am your NexPilot practice coach for "${selectedTopic.title}". I will provide problems one by one for you to solve and guide you through. When you are ready, let's begin!`}
                                </p>

                                <div className="pt-2 flex flex-wrap justify-center gap-2">
                                    {selectedTopic.type === 'theory' ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleSendMessage('Please explain the core concepts of this topic with simple examples.')}
                                                className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold hover:bg-sky-100 transition-colors cursor-pointer border border-sky-200 dark:border-sky-800"
                                            >
                                                👉 Explain Core Concepts
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSendMessage('Show the important formulas and principles with examples.')}
                                                className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold hover:bg-sky-100 transition-colors cursor-pointer border border-sky-200 dark:border-sky-800"
                                            >
                                                📐 Key Formulas & Examples
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleSendMessage('Please give me the first practice problem.')}
                                                className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
                                            >
                                                🎯 First Practice Problem
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSendMessage('Start with an easy problem.')}
                                                className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
                                            >
                                                ⚡ Start with an Easy Problem
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Chat Messages */}
                        {messages.map((msg, idx) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div
                                    key={idx}
                                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isUser && (
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[85%] sm:max-w-[78%] rounded-3xl px-5 py-3.5 text-xs sm:text-sm ${isUser
                                            ? 'bg-sky-600 text-white rounded-tr-none shadow-sm'
                                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-xs'
                                            }`}
                                    >
                                        {isUser ? (
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        ) : (
                                            <AiMarkdownMessage content={msg.content} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing indicator */}
                        {sending && (
                            <div className="flex gap-3 items-center text-slate-400 text-xs italic pl-11">
                                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                                <span>NexPilot is generating response...</span>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick Helpful Prompts Pills */}
                    {selectedTopic.type === 'practice' && messages.length > 0 && !limitReached && (
                        <div className="px-5 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
                            <span className="text-slate-400 font-bold shrink-0">Quick Actions:</span>
                            <button
                                type="button"
                                onClick={() => handleSendMessage('Give me a small hint, do not reveal the whole solution.')}
                                disabled={sending}
                                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-400 shrink-0 font-medium cursor-pointer"
                            >
                                💡 Give me a hint
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSendMessage('I do not understand. Please explain the full step-by-step solution.')}
                                disabled={sending}
                                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-400 shrink-0 font-medium cursor-pointer"
                            >
                                🔍 Full step-by-step solution
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSendMessage('Give me the next problem.')}
                                disabled={sending}
                                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-400 shrink-0 font-medium cursor-pointer"
                            >
                                ➡️ Next problem
                            </button>
                        </div>
                    )}

                    {/* Limit reached alert */}
                    {limitReached && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between px-5">
                            <span className="flex items-center gap-1.5 font-bold">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <span>Your allocated AI usage budget (${usage?.max_usd_limit}) has been reached.</span>
                            </span>
                            <span className="text-[11px] underline">Contact Support</span>
                        </div>
                    )}

                    {/* Chat Input Bar */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                        className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2.5 items-center"
                    >
                        <input
                            type="text"
                            disabled={sending || limitReached}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder={limitReached ? 'Usage limit reached...' : 'Type your question or response...'}
                            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim() || sending || limitReached}
                            className="px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">Send</span>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

