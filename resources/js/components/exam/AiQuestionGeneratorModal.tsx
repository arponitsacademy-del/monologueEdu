import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { ExamQuestion } from '../../types';
import { MathView } from '../shared/MathView';
import { MediaPickerModal } from '../shared/MediaPickerModal';
import {
    Sparkles,
    X,
    Upload,
    FileText,
    Image as ImageIcon,
    RefreshCw,
    CheckCircle2,
    CheckSquare,
    Square,
    Circle,
    Edit3,
    Trash2,
    Save,
    AlertCircle,
    Sliders,
    BookOpen,
    ArrowLeft,
    Check,
    Layers,
    Cpu,
    ExternalLink,
    Globe,
    Languages,
    Plus
} from 'lucide-react';

export interface GeneratedAiQuestion {
    id: string;
    question_text: string;
    question_type: 'single_choice' | 'multiple_choice' | 'fill_in_the_blank' | 'written_paper';
    marks: number;
    explanation?: string;
    options?: { id: string; text: string }[] | null;
    correct_answers?: string[] | null;
    attachment_url?: string | null;
}

interface AiQuestionGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    examId: string | number;
    examTitle: string;
    onQuestionsImported: (newQuestions: ExamQuestion[], newTotalMarks: number) => void;
}

export const AiQuestionGeneratorModal: React.FC<AiQuestionGeneratorModalProps> = ({
    isOpen,
    onClose,
    examId,
    examTitle,
    onQuestionsImported,
}) => {
    const [step, setStep] = useState<'configure' | 'review'>('configure');

    // Generator inputs
    const [prompt, setPrompt] = useState('');
    const [language, setLanguage] = useState<'bn' | 'en' | 'mixed'>('bn');
    const [questionTypes, setQuestionTypes] = useState<string[]>([
        'single_choice',
        'multiple_choice',
        'fill_in_the_blank',
    ]);
    const [count, setCount] = useState<number>(5);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
    const [marksPerQuestion, setMarksPerQuestion] = useState<number>(1);
    const [referenceText, setReferenceText] = useState('');
    const [mediaUrls, setMediaUrls] = useState<{ url: string; name: string }[]>([]);

    // Media picker modal
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generated questions review state
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedAiQuestion[]>([]);
    const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

    // Inline edit modal
    const [editingQuestion, setEditingQuestion] = useState<GeneratedAiQuestion | null>(null);

    if (!isOpen) return null;

    const toggleType = (type: string) => {
        if (questionTypes.includes(type)) {
            if (questionTypes.length === 1) return; // Keep at least one
            setQuestionTypes(questionTypes.filter(t => t !== type));
        } else {
            setQuestionTypes([...questionTypes, type]);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await apiClient.post('/exams/questions/upload-attachment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMediaUrls(prev => [...prev, { url: data.url, name: file.name }]);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload document / image.');
        } finally {
            setUploadingFile(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);

        try {
            const payload = {
                prompt,
                language,
                question_types: questionTypes,
                count: Number(count),
                difficulty,
                marks_per_question: Number(marksPerQuestion),
                reference_text: referenceText,
                media_urls: mediaUrls.map(m => m.url),
            };

            const { data } = await apiClient.post(`/exams/${examId}/ai/generate-questions`, payload);

            if (data.questions && data.questions.length > 0) {
                setGeneratedQuestions(data.questions);
                // By default approve all generated questions
                setApprovedIds(new Set(data.questions.map((q: GeneratedAiQuestion) => q.id)));
                setStep('review');
            } else {
                setError('No questions could be generated. Please adjust your prompt and try again.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate questions using AI.');
        } finally {
            setGenerating(false);
        }
    };

    const toggleApprove = (id: string) => {
        setApprovedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleRegenerateRejected = async () => {
        const rejectedQuestions = generatedQuestions.filter(q => !approvedIds.has(q.id));
        const approvedQuestions = generatedQuestions.filter(q => approvedIds.has(q.id));

        if (rejectedQuestions.length === 0) return;

        setRegenerating(true);
        setError(null);

        try {
            const payload = {
                prompt,
                language,
                question_types: questionTypes,
                count: rejectedQuestions.length,
                difficulty,
                marks_per_question: Number(marksPerQuestion),
                reference_text: referenceText,
                media_urls: mediaUrls.map(m => m.url),
                existing_approved_questions: approvedQuestions,
            };

            const { data } = await apiClient.post(`/exams/${examId}/ai/generate-questions`, payload);

            if (data.questions && data.questions.length > 0) {
                // Combine approved ones + new replacements
                const combined = [...approvedQuestions, ...data.questions];
                setGeneratedQuestions(combined);
                setApprovedIds(new Set(combined.map(q => q.id)));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to regenerate questions.');
        } finally {
            setRegenerating(false);
        }
    };

    const handleImportApproved = async () => {
        const approvedQuestions = generatedQuestions.filter(q => approvedIds.has(q.id));
        if (approvedQuestions.length === 0) {
            alert('Please approve at least 1 question to import.');
            return;
        }

        setImporting(true);
        setError(null);

        try {
            const { data } = await apiClient.post(`/exams/${examId}/ai/import-questions`, {
                questions: approvedQuestions,
            });

            onQuestionsImported(data.questions, data.exam_total_marks);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to import approved questions.');
        } finally {
            setImporting(false);
        }
    };

    const handleSaveInlineEdit = (updated: GeneratedAiQuestion) => {
        if (!updated.question_text.trim()) {
            alert('Question text cannot be empty.');
            return;
        }

        if (updated.question_type === 'single_choice' || updated.question_type === 'multiple_choice') {
            if (!updated.options || updated.options.length < 2) {
                alert('Please provide at least 2 choices for multiple choice questions.');
                return;
            }
            if (!updated.correct_answers || updated.correct_answers.length === 0) {
                updated.correct_answers = ['1'];
            }
            if (updated.question_type === 'single_choice' && updated.correct_answers.length > 1) {
                updated.correct_answers = [updated.correct_answers[0]];
            }
        }

        setGeneratedQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
        setApprovedIds(prev => new Set(prev).add(updated.id));
        setEditingQuestion(null);
    };

    const approvedCount = approvedIds.size;
    const rejectedCount = generatedQuestions.length - approvedCount;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-purple-500/5 via-sky-500/5 to-transparent shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/25">
                            <Sparkles className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                    Make Questions with AI
                                </h3>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                    OpenAI Model
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Target Exam: <span className="font-semibold text-slate-700 dark:text-slate-300">{examTitle}</span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span className="flex-1">{error}</span>
                    </div>
                )}

                {/* Content Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {step === 'configure' ? (
                        <div className="space-y-6">
                            {/* Question Types Selection */}
                            <div className="space-y-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                                        <span>1. Select Question Types to Generate:</span>
                                    </label>

                                    {/* Quick Selection Presets */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">Quick Presets:</span>
                                        <button
                                            type="button"
                                            onClick={() => setQuestionTypes(['single_choice', 'multiple_choice', 'fill_in_the_blank', 'written_paper'])}
                                            className="px-2 py-0.5 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 transition cursor-pointer"
                                        >
                                            All Types
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuestionTypes(['single_choice', 'multiple_choice'])}
                                            className="px-2 py-0.5 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 transition cursor-pointer"
                                        >
                                            MCQs Only
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuestionTypes(['fill_in_the_blank'])}
                                            className="px-2 py-0.5 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 transition cursor-pointer"
                                        >
                                            Blanks Only
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuestionTypes(['written_paper'])}
                                            className="px-2 py-0.5 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 transition cursor-pointer"
                                        >
                                            Written Only
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        {
                                            key: 'single_choice',
                                            label: 'Single Choice (MCQ)',
                                            desc: '4 choices with 1 correct answer',
                                            icon: Circle,
                                        },
                                        {
                                            key: 'multiple_choice',
                                            label: 'Multiple Choice',
                                            desc: '4 choices with multiple correct',
                                            icon: CheckSquare,
                                        },
                                        {
                                            key: 'fill_in_the_blank',
                                            label: 'Fill in the Blanks',
                                            desc: 'Sentence with ____ blank word',
                                            icon: Edit3,
                                        },
                                        {
                                            key: 'written_paper',
                                            label: 'Written Paper',
                                            desc: 'Descriptive & model solutions',
                                            icon: FileText,
                                        },
                                    ].map(item => {
                                        const Icon = item.icon;
                                        const isSelected = questionTypes.includes(item.key);
                                        return (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => toggleType(item.key)}
                                                className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                                                    isSelected
                                                        ? 'bg-purple-50/90 dark:bg-purple-950/60 border-2 border-purple-600 dark:border-purple-500 shadow-md ring-2 ring-purple-600/15'
                                                        : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 opacity-65 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                        isSelected
                                                            ? 'bg-purple-600 text-white shadow-xs'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                    }`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>

                                                    {/* Active / Inactive Badge */}
                                                    {isSelected ? (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-purple-600 text-white flex items-center gap-1 shadow-xs">
                                                            <Check className="w-3 h-3 stroke-[3]" />
                                                            <span>Active</span>
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                                            Disabled
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <div className={`text-xs font-black tracking-tight ${
                                                        isSelected ? 'text-purple-950 dark:text-purple-100' : 'text-slate-600 dark:text-slate-400 font-semibold'
                                                    }`}>
                                                        {item.label}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Language Selection */}
                            <div className="space-y-2.5">
                                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <Languages className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>2. Select Question Language:</span>
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        {
                                            key: 'bn',
                                            flag: '🇧🇩',
                                            label: 'Bengali (বাংলা)',
                                            desc: 'Questions, choices & explanations strictly in Bengali (বাংলা).',
                                        },
                                        {
                                            key: 'en',
                                            flag: '🇬🇧',
                                            label: 'English',
                                            desc: 'Questions, choices & explanations strictly in English.',
                                        },
                                        {
                                            key: 'mixed',
                                            flag: '🌐',
                                            label: 'Bilingual (বাংলা + English)',
                                            desc: 'Bangla phrasing with standard English terms and formulas.',
                                        },
                                    ].map(item => {
                                        const isSelected = language === item.key;
                                        return (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => setLanguage(item.key as any)}
                                                className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                                                    isSelected
                                                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-2 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-600/15'
                                                        : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 opacity-65 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xl leading-none">{item.flag}</span>

                                                    {isSelected ? (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-indigo-600 text-white flex items-center gap-1 shadow-xs">
                                                            <Check className="w-3 h-3 stroke-[3]" />
                                                            <span>Selected</span>
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                                            Off
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <div className={`text-xs font-black tracking-tight ${
                                                        isSelected ? 'text-indigo-950 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-400 font-semibold'
                                                    }`}>
                                                        {item.label}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Numbers, Marks, Difficulty Grid */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sliders className="w-3.5 h-3.5 text-sky-600" />
                                    <span>3. Exam Parameters:</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Number of Questions:
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={25}
                                            value={count}
                                            onChange={e => setCount(Math.max(1, Math.min(25, Number(e.target.value) || 1)))}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Marks per Question:
                                        </label>
                                        <input
                                            type="number"
                                            step={0.5}
                                            min={0.5}
                                            value={marksPerQuestion}
                                            onChange={e => setMarksPerQuestion(Number(e.target.value) || 1)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Difficulty Level:
                                        </label>
                                        <select
                                            value={difficulty}
                                            onChange={e => setDifficulty(e.target.value as any)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                                        >
                                            <option value="easy">Easy (Fundamentals)</option>
                                            <option value="medium">Medium (Standard Academic)</option>
                                            <option value="hard">Hard (Advanced Reasoning)</option>
                                            <option value="mixed">Mixed (Balanced)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Prompt / Custom Instructions */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                    <span>4. Prompt / Specific Instructions for AI:</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder="e.g. Create 5 challenging questions on Newtonian Mechanics and Kinetic Energy suitable for HSC / College standard, including clear explanations."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-purple-500 dark:text-white"
                                />
                            </div>

                            {/* Reference Material / Book Content */}
                            <div className="space-y-3 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                                        <span>5. Reference Material, Book Pages or PDF (Optional):</span>
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMediaPickerOpen(true)}
                                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>From Media Library</span>
                                        </button>

                                        <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                                            {uploadingFile ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                            <span>{uploadingFile ? 'Uploading...' : 'Upload PDF / Image'}</span>
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*,.txt,.md"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                disabled={uploadingFile}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Attached media pill tags */}
                                {mediaUrls.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {mediaUrls.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 shadow-2xs"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                                <span className="truncate max-w-[220px] font-semibold">{item.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                                                    className="text-slate-400 hover:text-rose-500"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <textarea
                                    rows={3}
                                    value={referenceText}
                                    onChange={e => setReferenceText(e.target.value)}
                                    placeholder="Or paste textbook excerpts, chapter summaries, or lecture notes here..."
                                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium dark:text-white"
                                />
                            </div>
                        </div>
                    ) : (
                        /* STEP 2: REVIEW & APPROVAL STUDIO */
                        <div className="space-y-5">
                            {/* Stats bar */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        Total Questions: <strong className="text-slate-900 dark:text-white font-mono">{generatedQuestions.length}</strong>
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Approved: {approvedCount}</span>
                                    </span>
                                    {rejectedCount > 0 && (
                                        <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                                            <X className="w-3.5 h-3.5" />
                                            <span>Rejected: {rejectedCount}</span>
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {rejectedCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleRegenerateRejected}
                                            disabled={regenerating}
                                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                                            <span>{regenerating ? 'Regenerating...' : `Regenerate Rejected (${rejectedCount})`}</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setStep('configure')}
                                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                                    >
                                        Edit Prompt
                                    </button>
                                </div>
                            </div>

                            {/* Questions Cards */}
                            <div className="space-y-4">
                                {generatedQuestions.map((q, idx) => {
                                    const isApproved = approvedIds.has(q.id);
                                    return (
                                        <div
                                            key={q.id}
                                            className={`p-5 rounded-2xl border transition-all ${
                                                isApproved
                                                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                                                    : 'bg-slate-50/80 dark:bg-slate-950/40 border-rose-200 dark:border-rose-950/60 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-300">
                                                        Q{idx + 1}
                                                    </span>

                                                    {q.question_type === 'single_choice' && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700">
                                                            Single Choice (MCQ)
                                                        </span>
                                                    )}
                                                    {q.question_type === 'multiple_choice' && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-700">
                                                            Multiple Choice
                                                        </span>
                                                    )}
                                                    {q.question_type === 'fill_in_the_blank' && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-700">
                                                            Fill in the Blanks
                                                        </span>
                                                    )}
                                                    {q.question_type === 'written_paper' && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700">
                                                            Written Paper
                                                        </span>
                                                    )}

                                                    <span className="text-xs font-bold text-emerald-600">
                                                        [{q.marks} Marks]
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingQuestion(JSON.parse(JSON.stringify(q)))}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                        <span>Edit Question</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => toggleApprove(q.id)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                                            isApproved
                                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-2xs'
                                                                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                                        }`}
                                                    >
                                                        {isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                                        <span>{isApproved ? 'Approved' : 'Rejected'}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-3 space-y-3">
                                                <MathView content={q.question_text} className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed" />

                                                {/* MCQ Options */}
                                                {(q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && (
                                                    <div className="space-y-1.5 pt-1">
                                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Choices / Options:</span>
                                                            <span className="text-[10px] font-semibold text-slate-400">
                                                                {q.question_type === 'single_choice' ? 'Single correct answer' : 'Multiple correct answers'}
                                                            </span>
                                                        </div>
                                                        {q.options && q.options.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {q.options.map((opt, oIdx) => {
                                                                    const isCorrect = (q.correct_answers || []).includes(opt.id);
                                                                    return (
                                                                        <div
                                                                            key={opt.id}
                                                                            className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition-all ${
                                                                                isCorrect
                                                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 font-bold shadow-2xs'
                                                                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                                            }`}
                                                                        >
                                                                            <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                                                                isCorrect ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                                            }`}>
                                                                                {String.fromCharCode(65 + oIdx)}
                                                                            </span>
                                                                            <MathView content={opt.text} inline className="flex-1" />
                                                                            {isCorrect && (
                                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white flex items-center gap-1 shrink-0">
                                                                                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Correct
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                                                                No options provided. Click the edit icon to add choices.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Fill in the Blanks Answer */}
                                                {q.question_type === 'fill_in_the_blank' && (
                                                    <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 text-xs text-teal-900 dark:text-teal-200 flex items-center gap-2">
                                                        <span className="font-bold">Accepted Correct Answer(s):</span>
                                                        <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-teal-300 font-bold">
                                                            {Array.isArray(q.correct_answers) ? q.correct_answers.join(' / ') : q.correct_answers}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Explanation */}
                                                {q.explanation && (
                                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                                                        <strong className="text-slate-800 dark:text-slate-100 mr-1.5 font-bold">Explanation:</strong>
                                                        <MathView content={q.explanation} inline />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                    >
                        Cancel
                    </button>

                    {step === 'configure' ? (
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/25 transition disabled:opacity-50 cursor-pointer"
                        >
                            <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                            <span>{generating ? 'Generating Questions...' : 'Generate Questions with AI'}</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setStep('configure')}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleImportApproved}
                                disabled={importing || approvedCount === 0}
                                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
                            >
                                <Save className="w-4 h-4" />
                                <span>{importing ? 'Importing...' : `Import Approved Questions to Exam (${approvedCount})`}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Media Picker Modal */}
            {mediaPickerOpen && (
                <MediaPickerModal
                    isOpen={mediaPickerOpen}
                    onClose={() => setMediaPickerOpen(false)}
                    filterType="all"
                    title="Select Book / PDF / Image for AI Question Generator"
                    onSelect={(url, item) => {
                        setMediaUrls(prev => [...prev, { url, name: item?.file_name || 'Document' }]);
                        setMediaPickerOpen(false);
                    }}
                />
            )}

            {/* Comprehensive Question Editor Modal */}
            {editingQuestion && (
                <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                        
                        {/* Editor Header */}
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                    <Edit3 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                                        Edit Question
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                        Update question statement, options, correct answers, or marks
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingQuestion(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Editor Body */}
                        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
                            
                            {/* Question Type Switcher */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Question Type:
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { key: 'single_choice', label: 'Single Choice (MCQ)' },
                                        { key: 'multiple_choice', label: 'Multiple Choice' },
                                        { key: 'fill_in_the_blank', label: 'Fill in the Blank' },
                                        { key: 'written_paper', label: 'Written Paper' },
                                    ].map(t => {
                                        const isCurrent = editingQuestion.question_type === t.key;
                                        return (
                                            <button
                                                key={t.key}
                                                type="button"
                                                onClick={() => {
                                                    if (t.key === 'single_choice' || t.key === 'multiple_choice') {
                                                        const opts = (editingQuestion.options && editingQuestion.options.length >= 2)
                                                            ? editingQuestion.options
                                                            : [
                                                                { id: '1', text: 'Option A' },
                                                                { id: '2', text: 'Option B' },
                                                                { id: '3', text: 'Option C' },
                                                                { id: '4', text: 'Option D' },
                                                            ];
                                                        setEditingQuestion({
                                                            ...editingQuestion,
                                                            question_type: t.key as any,
                                                            options: opts,
                                                            correct_answers: t.key === 'single_choice'
                                                                ? [opts[0].id]
                                                                : [opts[0].id, opts[1]?.id || opts[0].id],
                                                        });
                                                    } else if (t.key === 'fill_in_the_blank') {
                                                        setEditingQuestion({
                                                            ...editingQuestion,
                                                            question_type: 'fill_in_the_blank',
                                                            options: null,
                                                            correct_answers: editingQuestion.correct_answers || ['Correct Answer'],
                                                        });
                                                    } else {
                                                        setEditingQuestion({
                                                            ...editingQuestion,
                                                            question_type: 'written_paper',
                                                            options: null,
                                                            correct_answers: null,
                                                        });
                                                    }
                                                }}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                                                    isCurrent
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                                }`}
                                            >
                                                {t.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Question Text */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Question Text (LaTeX formulas like <code className="font-mono text-purple-600">$E = mc^2$</code> supported):
                                </label>
                                <textarea
                                    rows={3}
                                    value={editingQuestion.question_text}
                                    onChange={e => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter question statement..."
                                />
                                {editingQuestion.question_text && (
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Live Math Preview:
                                        </div>
                                        <MathView content={editingQuestion.question_text} className="text-xs font-medium text-slate-800 dark:text-slate-200" />
                                    </div>
                                )}
                            </div>

                            {/* Marks Input */}
                            <div className="w-full sm:w-48">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Marks for Question:
                                </label>
                                <input
                                    type="number"
                                    step={0.5}
                                    min={0.5}
                                    value={editingQuestion.marks}
                                    onChange={e => setEditingQuestion({ ...editingQuestion, marks: Number(e.target.value) || 1 })}
                                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                                />
                            </div>

                            {/* MCQ Options Editor */}
                            {(editingQuestion.question_type === 'single_choice' || editingQuestion.question_type === 'multiple_choice') && (
                                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                                Choices & Correct Answer:
                                            </label>
                                            <p className="text-[11px] text-slate-500">
                                                {editingQuestion.question_type === 'single_choice'
                                                    ? 'Click "Correct Choice" button on the option that is correct.'
                                                    : 'Click "Correct Choice" button on all options that are correct.'}
                                            </p>
                                        </div>

                                        {(editingQuestion.options?.length || 0) < 6 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const cur = editingQuestion.options || [];
                                                    const nextId = String(cur.length + 1);
                                                    setEditingQuestion({
                                                        ...editingQuestion,
                                                        options: [...cur, { id: nextId, text: `Option ${String.fromCharCode(65 + cur.length)}` }],
                                                    });
                                                }}
                                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Add Choice</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2.5">
                                        {(editingQuestion.options || []).map((opt, idx) => {
                                            const isCorrect = (editingQuestion.correct_answers || []).includes(opt.id);
                                            return (
                                                <div
                                                    key={opt.id}
                                                    className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center gap-3 ${
                                                        isCorrect
                                                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700'
                                                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${
                                                            isCorrect ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                        }`}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </span>

                                                        {/* Toggle Correct Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (editingQuestion.question_type === 'single_choice') {
                                                                    setEditingQuestion({
                                                                        ...editingQuestion,
                                                                        correct_answers: [opt.id],
                                                                    });
                                                                } else {
                                                                    const cur = editingQuestion.correct_answers || [];
                                                                    const next = cur.includes(opt.id)
                                                                        ? cur.filter(id => id !== opt.id)
                                                                        : [...cur, opt.id];
                                                                    if (next.length === 0) return; // Keep at least one
                                                                    setEditingQuestion({
                                                                        ...editingQuestion,
                                                                        correct_answers: next,
                                                                    });
                                                                }
                                                            }}
                                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                                                                isCorrect
                                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                                    : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
                                                            }`}
                                                        >
                                                            {isCorrect && <Check className="w-3 h-3 stroke-[3]" />}
                                                            <span>{isCorrect ? 'Correct Answer' : 'Mark as Correct'}</span>
                                                        </button>
                                                    </div>

                                                    {/* Option text input */}
                                                    <input
                                                        type="text"
                                                        value={opt.text}
                                                        onChange={e => {
                                                            const newOpts = [...(editingQuestion.options || [])];
                                                            newOpts[idx].text = e.target.value;
                                                            setEditingQuestion({ ...editingQuestion, options: newOpts });
                                                        }}
                                                        placeholder={`Enter text for Choice ${String.fromCharCode(65 + idx)}...`}
                                                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium dark:text-white"
                                                    />

                                                    {/* Delete option */}
                                                    {(editingQuestion.options?.length || 0) > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const cur = editingQuestion.options || [];
                                                                const filtered = cur.filter((_, i) => i !== idx);
                                                                const remapped = filtered.map((o, i) => ({ id: String(i + 1), text: o.text }));
                                                                let newCorrect = (editingQuestion.correct_answers || []).filter(id => id !== opt.id);
                                                                if (newCorrect.length === 0) newCorrect = ['1'];
                                                                setEditingQuestion({
                                                                    ...editingQuestion,
                                                                    options: remapped,
                                                                    correct_answers: newCorrect,
                                                                });
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                                            title="Delete option"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Fill in the Blank Answer */}
                            {editingQuestion.question_type === 'fill_in_the_blank' && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Accepted Correct Answer(s) (comma separated for synonyms):
                                    </label>
                                    <input
                                        type="text"
                                        value={Array.isArray(editingQuestion.correct_answers) ? editingQuestion.correct_answers.join(', ') : (editingQuestion.correct_answers || '')}
                                        onChange={e => setEditingQuestion({
                                            ...editingQuestion,
                                            correct_answers: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                        })}
                                        placeholder="e.g. Mitochondria, mitochondrion"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium dark:text-white"
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        Hint: Ensure your question text above contains <code className="font-mono font-bold text-teal-600">____</code> (underscores) where the blank is placed.
                                    </p>
                                </div>
                            )}

                            {/* Explanation */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Explanation / Model Solution (Optional):
                                </label>
                                <textarea
                                    rows={2}
                                    value={editingQuestion.explanation || ''}
                                    onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                                    placeholder="Add detailed explanation or step-by-step solution..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Editor Footer */}
                        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                            <button
                                type="button"
                                onClick={() => setEditingQuestion(null)}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSaveInlineEdit(editingQuestion)}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                            >
                                <Check className="w-4 h-4 stroke-[2.5]" />
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

