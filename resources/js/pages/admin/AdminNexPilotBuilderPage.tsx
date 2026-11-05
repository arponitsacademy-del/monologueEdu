import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { 
    Bot, 
    ArrowLeft, 
    BookOpen, 
    Sparkles, 
    Plus, 
    Wrench, 
    Edit3, 
    Trash2, 
    UploadCloud, 
    FileText, 
    Paperclip, 
    Send, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    X, 
    Eye,
    Play,
    Copy,
    Check,
    Cpu,
    ExternalLink
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { AiMarkdownMessage } from '../../components/shared/AiMarkdownMessage';

interface Attachment {
    name: string;
    url: string;
    size?: number;
    type?: string;
}

interface Topic {
    id: number;
    type: 'theory' | 'practice';
    title: string;
    description?: string;
    prompt: string;
    materials_text?: string;
    attachments?: Attachment[];
    order_index: number;
    is_active: boolean;
}

export const AdminNexPilotBuilderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [pilotData, setPilotData] = useState<any>(null);
    const [theoryTopics, setTheoryTopics] = useState<Topic[]>([]);
    const [practiceTopics, setPracticeTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Active Mode: 'theory' or 'practice'
    const [activeMode, setActiveMode] = useState<'theory' | 'practice'>('theory');

    // Topic Modal (Create/Edit)
    const [topicModalOpen, setTopicModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [topicTitle, setTopicTitle] = useState('');
    const [topicDescription, setTopicDescription] = useState('');
    const [topicPrompt, setTopicPrompt] = useState('');
    const [topicMaterials, setTopicMaterials] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [savingTopic, setSavingTopic] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Live Test Playground Modal
    const [playgroundModalOpen, setPlaygroundModalOpen] = useState(false);
    const [testingTopic, setTestingTopic] = useState<Topic | null>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [sendingChat, setSendingChat] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchBuilderData();
    }, [id]);

    useEffect(() => {
        if (playgroundModalOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, playgroundModalOpen]);

    const fetchBuilderData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await apiClient.get(`/admin/nexpilot/${id}/builder`);
            setPilotData(data.pilot);
            setTheoryTopics(data.theory_topics || []);
            setPracticeTopics(data.practice_topics || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'বিল্ডার ডাটা লোড করতে সমস্যা হয়েছে।');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingTopic(null);
        setTopicTitle('');
        setTopicDescription('');
        setAttachments([]);

        // Default smart templates for prompt
        if (activeMode === 'theory') {
            setTopicPrompt(
                'এই টপিকে শিক্ষার্থীদের বিষয়টির মূল ধারণা সহজে বাস্তব উদাহরণ দিয়ে বোঝাবে। কোনো জটিল সূত্র থাকলে সেটির ব্যাখ্যা ধাপে ধাপে দেবে এবং শিক্ষার্থীদের প্রশ্ন করে নিশ্চিত হবে তারা বুঝতে পেরেছে কিনা।'
            );
            setTopicMaterials('');
        } else {
            setTopicPrompt(
                'শিক্ষার্থীদের প্রথমে সহজ থেকে শুরু করে এক এক করে প্র্যাকটিস প্রবলেম দেবে। তারা সমাধান শেয়ার করলে সঠিক হয়েছে কিনা যাচাই করবে। ভুল হলে সরাসরি উত্তর না দিয়ে হিন্ট দেবে। শিক্ষার্থী না পারলে তখন সম্পূর্ণ সমাধান ব্যাখ্যা করবে।'
            );
            setTopicMaterials('');
        }

        setTopicModalOpen(true);
    };

    const handleOpenEditModal = (topic: Topic) => {
        setEditingTopic(topic);
        setTopicTitle(topic.title);
        setTopicDescription(topic.description || '');
        setTopicPrompt(topic.prompt || '');
        setTopicMaterials(topic.materials_text || '');
        setAttachments(topic.attachments || []);
        setTopicModalOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await apiClient.post('/admin/nexpilot/upload-material', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAttachments(prev => [...prev, data]);
        } catch (err: any) {
            alert(err.response?.data?.message || 'ফাইল আপলোড করতে সমস্যা হয়েছে।');
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topicTitle.trim()) return;

        setSavingTopic(true);
        const payload = {
            type: activeMode,
            title: topicTitle,
            description: topicDescription,
            prompt: topicPrompt,
            materials_text: topicMaterials,
            attachments,
            is_active: true,
        };

        try {
            if (editingTopic) {
                const { data } = await apiClient.put(`/admin/nexpilot/topics/${editingTopic.id}`, payload);
                if (activeMode === 'theory') {
                    setTheoryTopics(prev => prev.map(t => (t.id === editingTopic.id ? data.topic : t)));
                } else {
                    setPracticeTopics(prev => prev.map(t => (t.id === editingTopic.id ? data.topic : t)));
                }
            } else {
                const { data } = await apiClient.post(`/admin/nexpilot/${id}/topics`, payload);
                if (activeMode === 'theory') {
                    setTheoryTopics(prev => [...prev, data.topic]);
                } else {
                    setPracticeTopics(prev => [...prev, data.topic]);
                }
            }
            setTopicModalOpen(false);
        } catch (err: any) {
            alert(err.response?.data?.message || 'টপিক সংরক্ষণ ব্যর্থ হয়েছে।');
        } finally {
            setSavingTopic(false);
        }
    };

    const handleDeleteTopic = async () => {
        if (!topicToDelete) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/admin/nexpilot/topics/${topicToDelete.id}`);
            if (topicToDelete.type === 'theory') {
                setTheoryTopics(prev => prev.filter(t => t.id !== topicToDelete.id));
            } else {
                setPracticeTopics(prev => prev.filter(t => t.id !== topicToDelete.id));
            }
            setDeleteModalOpen(false);
            setTopicToDelete(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'টপিক মুছে ফেলা সম্ভব হয়নি।');
        } finally {
            setDeleting(false);
        }
    };

    // Live Test Playground
    const handleOpenPlayground = async (topic: Topic) => {
        setTestingTopic(topic);
        setChatMessages([]);
        setInputMessage('');
        setPlaygroundModalOpen(true);

        try {
            const { data } = await apiClient.get(`/student/nexpilot/topics/${topic.id}/history`);
            setChatMessages(data.messages || []);
        } catch {
            // silent fail
        }
    };

    const handleSendTestMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !testingTopic || sendingChat) return;

        const userMsgText = inputMessage.trim();
        setInputMessage('');

        const optimisticMsg = {
            id: Date.now(),
            role: 'user',
            content: userMsgText,
            created_at: new Date().toISOString(),
        };

        setChatMessages(prev => [...prev, optimisticMsg]);
        setSendingChat(true);

        try {
            const { data } = await apiClient.post(`/student/nexpilot/topics/${testingTopic.id}/chat`, {
                message: userMsgText,
            });

            if (data.message) {
                setChatMessages(prev => [...prev, data.message]);
            }
        } catch (err: any) {
            setChatMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `⚠️ এরর: ${err.response?.data?.message || 'AI উত্তর জেনারেট করতে ব্যর্থ হয়েছে। OpenAI API কী ঠিক আছে কিনা যাচাই করুন।'}`,
                    created_at: new Date().toISOString(),
                },
            ]);
        } finally {
            setSendingChat(false);
        }
    };

    if (loading) {
        return (
            <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                <span className="text-xs font-bold">বিল্ডার লোড হচ্ছে...</span>
            </div>
        );
    }

    if (error || !pilotData) {
        return (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-600" />
                <h4 className="font-bold">{error || 'পাইলট পাওয়া যায়নি।'}</h4>
                <Link to="/admin/nexpilot" className="mt-4 inline-block text-xs font-bold text-sky-600 underline">
                    NexPilot তালিকায় ফিরে যান
                </Link>
            </div>
        );
    }

    const currentTopics = activeMode === 'theory' ? theoryTopics : practiceTopics;

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Top Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/nexpilot"
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300 transition-colors shadow-xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {pilotData.title}
                            </h2>
                            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800">
                                {pilotData.openai_model}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                            <span>কোর্স: <strong>{pilotData.course_title}</strong></span>
                            <span className="text-slate-300 mx-1">•</span>
                            <span>বাজেট লিমিট: <strong>${parseFloat(pilotData.max_usd_limit).toFixed(2)}</strong></span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to={`/admin/nexpilot/${pilotData.id}/edit`}
                        className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>পাইলট তথ্য এডিট</span>
                    </Link>
                </div>
            </div>

            {/* Two Primary Mode Switcher Buttons: THEORY & PRACTICE */}
            <div className="bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl flex gap-2 max-w-xl mx-auto shadow-xs border border-slate-200/80 dark:border-slate-800">
                <button
                    type="button"
                    onClick={() => setActiveMode('theory')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        activeMode === 'theory'
                            ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/25 scale-[1.01]'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-800'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">Theory (থিওরি)</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        activeMode === 'theory' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                        {theoryTopics.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveMode('practice')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        activeMode === 'practice'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 scale-[1.01]'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-800'
                    }`}
                >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="text-sm">Practice (প্র্যাকটিস)</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        activeMode === 'practice' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                        {practiceTopics.length}
                    </span>
                </button>
            </div>

            {/* Mode Banner & Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{activeMode === 'theory' ? '📖 থিওরি টপিক বিল্ডার' : '🎯 প্র্যাকটিস টপিক বিল্ডার'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeMode === 'theory'
                            ? 'স্লাইড, নোট বা বইয়ের বিষয়বস্তু আপলোড করে প্রম্পট দিন যাতে AI শিক্ষার্থীদের এই টপিক চমৎকারভাবে পড়ায়।'
                            : 'টপিক অনুযায়ী প্র্যাকটিস প্রবলেম, গাইডেন্স ও সলভিং রুলস প্রম্পট দিয়ে সেট করুন।'}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className={`px-4 py-2.5 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                        activeMode === 'theory' 
                            ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20' 
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    }`}
                >
                    <Plus className="w-4 h-4" />
                    <span>{activeMode === 'theory' ? 'নতুন থিওরি টপিক যোগ করুন' : 'নতুন প্র্যাকটিস টপিক যোগ করুন'}</span>
                </button>
            </div>

            {/* Topics List */}
            {currentTopics.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                        {activeMode === 'theory' ? <BookOpen className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            কোনো {activeMode === 'theory' ? 'থিওরি' : 'প্র্যাকটিস'} টপিক যোগ করা হয়নি
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                            শিক্ষার্থীদের শেখানোর জন্য প্রথম টপিক তৈরি করে প্রম্পট এবং স্টাডি ম্যাটেরিয়াল যুক্ত করুন।
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>প্রথম টপিক তৈরি করুন</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {currentTopics.map((topic, index) => {
                        const hasAttachments = topic.attachments && topic.attachments.length > 0;
                        return (
                            <div
                                key={topic.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                            topic.type === 'theory' 
                                                ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' 
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                                {topic.title}
                                            </h4>
                                            {topic.description && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {topic.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2">
                                        {/* Live Test Chat Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleOpenPlayground(topic)}
                                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200/60 dark:border-indigo-800"
                                            title="AI কীভাবে পড়াবে পরীক্ষা করুন"
                                        >
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            <span>টেস্ট চ্যাট</span>
                                        </button>

                                        {/* Edit */}
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEditModal(topic)}
                                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
                                            title="এডিট"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTopicToDelete(topic);
                                                setDeleteModalOpen(true);
                                            }}
                                            className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 cursor-pointer"
                                            title="মুছে ফেলুন"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Teaching / Practice Prompt Snippet */}
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                                    <span className="font-bold text-[11px] text-slate-400 block uppercase tracking-wider">
                                        {topic.type === 'theory' ? 'AI শিক্ষাদান প্রম্পট:' : 'প্র্যাকটিস ও সলভিং প্রম্পট:'}
                                    </span>
                                    <p className="line-clamp-2 italic leading-relaxed text-slate-600 dark:text-slate-400 font-serif">
                                        "{topic.prompt}"
                                    </p>
                                </div>

                                {/* Attached Materials / Slides */}
                                {hasAttachments && (
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                            <Paperclip className="w-3 h-3" />
                                            <span>সংযুক্ত ফাইল ({topic.attachments?.length}):</span>
                                        </span>
                                        {topic.attachments?.map((att, attIdx) => (
                                            <a
                                                key={attIdx}
                                                href={att.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700"
                                            >
                                                <FileText className="w-3 h-3 text-sky-600" />
                                                <span className="truncate max-w-[140px]">{att.name}</span>
                                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Topic Modal */}
            <Modal
                isOpen={topicModalOpen}
                onClose={() => setTopicModalOpen(false)}
                title={editingTopic ? 'টপিক এডিট করুন' : (activeMode === 'theory' ? 'নতুন থিওরি টপিক তৈরি' : 'নতুন প্র্যাকটিস টপিক তৈরি')}
            >
                <form onSubmit={handleSaveTopic} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
                    {/* Topic Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            টপিকের নাম / অধ্যায় <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={topicTitle}
                            onChange={(e) => setTopicTitle(e.target.value)}
                            placeholder="e.g. ভেক্টর যোগ ও সামান্তরিক সূত্র"
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Topic Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)
                        </label>
                        <input
                            type="text"
                            value={topicDescription}
                            onChange={(e) => setTopicDescription(e.target.value)}
                            placeholder="টপিকের মূল বিষয়ের সারাংশ..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* AI Prompt */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            AI-কে দেওয়া প্রম্পট / নির্দেশনা (Prompt) <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={4}
                            required
                            value={topicPrompt}
                            onChange={(e) => setTopicPrompt(e.target.value)}
                            placeholder={activeMode === 'theory' 
                                ? 'AI কীভাবে শিক্ষার্থীদের এই থিওরি শেখাবে, কোন কোন বিষয়ের ওপর জোর দেবে...' 
                                : 'AI কীভাবে শিক্ষার্থীদের এক এক করে প্র্যাকটিস প্রবলেম দেবে, কীভাবে হিন্ট দেবে এবং কখন সলভ দেবে...'}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 leading-relaxed font-mono"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                            {activeMode === 'theory' 
                                ? 'টিপস: আপনি এখানে লিখে দিতে পারেন AI যেন সহজ উদাহরণ দিয়ে বোঝায় এবং শেষে প্রশ্ন করে যাচাই করে।' 
                                : 'টিপস: AI যেন একবারে একটি প্রশ্ন দেয় এবং শিক্ষার্থী না পারলে ধাপে ধাপে হিন্ট দেয়।'}
                        </p>
                    </div>

                    {/* Reference Materials / Notes Text */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            রেফারেন্স নোট, বইয়ের টেক্সট বা লেকচার কনটেন্ট (ঐচ্ছিক)
                        </label>
                        <textarea
                            rows={3}
                            value={topicMaterials}
                            onChange={(e) => setTopicMaterials(e.target.value)}
                            placeholder="বইয়ের সংজ্ঞা, সূত্র, অথবা গাণিতিক সমস্যার সেট এখানে সরাসরি পেস্ট করতে পারেন..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 leading-relaxed"
                        />
                    </div>

                    {/* File Attachments (Slides, Books, PDFs) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            স্লাইড, হ্যান্ডনোট বা বইয়ের ফাইল আপলোড (PDF, Slide, Image)
                        </label>

                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                type="button"
                                disabled={uploadingFile}
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 text-sky-600" />}
                                <span>{uploadingFile ? 'আপলোড হচ্ছে...' : 'ফাইল আপলোড করুন'}</span>
                            </button>
                            <span className="text-[11px] text-slate-400">সর্বোচ্চ ৩০MB</span>
                        </div>

                        {/* Uploaded attachments list */}
                        {attachments.length > 0 && (
                            <div className="mt-2.5 space-y-1.5">
                                {attachments.map((att, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                            <span className="truncate font-medium">{att.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAttachment(i)}
                                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setTopicModalOpen(false)}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                            বাতিল
                        </button>
                        <button
                            type="submit"
                            disabled={savingTopic}
                            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                            {savingTopic ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Topic Confirm Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="টপিক মুছে ফেলার নিশ্চয়তা"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        আপনি কি নিশ্চিত যে <strong>"{topicToDelete?.title}"</strong> টপিকটি মুছে ফেলতে চান?
                    </p>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setDeleteModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-500"
                        >
                            বাতিল
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteTopic}
                            disabled={deleting}
                            className="px-4 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl"
                        >
                            {deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Live Test Chat Playground Modal */}
            <Modal
                isOpen={playgroundModalOpen}
                onClose={() => setPlaygroundModalOpen(false)}
                title={`লাইভ টেস্ট চ্যাট: ${testingTopic?.title || ''}`}
            >
                <div className="space-y-4 flex flex-col h-[520px]">
                    {/* Header info badge */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Bot className="w-4 h-4 text-sky-600" />
                            <span>মোড: <strong>{testingTopic?.type === 'theory' ? 'Theory Lesson' : 'Practice Problem Coach'}</strong></span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                            মডেল: {pilotData.openai_model}
                        </span>
                    </div>

                    {/* Chat Messages Feed */}
                    <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50/60 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                        {chatMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                                <Sparkles className="w-8 h-8 text-sky-500/50" />
                                <p className="text-xs font-medium">
                                    নিচে যেকোনো প্রশ্ন বা 'হাই' লিখে শুরু করুন। AI আপনার প্রম্পট অনুযায়ী উত্তর দেবে।
                                </p>
                            </div>
                        ) : (
                            chatMessages.map((msg, index) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <div
                                        key={index}
                                        className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {!isUser && (
                                            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
                                                <Bot className="w-4 h-4" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                                                isUser
                                                    ? 'bg-sky-600 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-xs'
                                            }`}
                                        >
                                            {isUser ? (
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            ) : (
                                                <AiMarkdownMessage content={msg.content} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {sendingChat && (
                            <div className="flex gap-2.5 items-center text-slate-400 text-xs italic pl-9">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                                <span>NexPilot উত্তর তৈরি করছে...</span>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Form */}
                    <form onSubmit={handleSendTestMessage} className="flex gap-2 pt-1">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="এখানে মেসেজ লিখুন (যেমন: এই সূত্রটি বুঝিয়ে দাও)..."
                            disabled={sendingChat}
                            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim() || sendingChat}
                            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>পাঠান</span>
                        </button>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

