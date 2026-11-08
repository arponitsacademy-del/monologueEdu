import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Exam, ExamQuestion } from '../../types';
import { WordMathEditor } from '../../components/exam/WordMathEditor';
import { MathView } from '../../components/shared/MathView';
import {
    Wrench,
    ArrowLeft,
    Plus,
    Trash2,
    Edit3,
    CheckCircle2,
    Circle,
    Square,
    CheckSquare,
    FileText,
    Image as ImageIcon,
    Upload,
    Clock,
    Award,
    AlertCircle,
    Eye,
    Save,
    X,
    Loader2,
    HelpCircle,
    MoveUp,
    MoveDown
} from 'lucide-react';

export const ExamBuilderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const isTeacher = user?.role === 'teacher';
    const basePath = isTeacher ? '/teacher/exams' : '/admin/exams';

    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state for Add/Edit Question
    const [modalOpen, setModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Question form state
    const [questionForm, setQuestionForm] = useState({
        question_text: '',
        question_type: 'single_choice' as 'single_choice' | 'multiple_choice' | 'written_paper',
        marks: 1,
        attachment_url: '',
        explanation: '',
        options: [
            { id: '1', text: '' },
            { id: '2', text: '' },
            { id: '3', text: '' },
            { id: '4', text: '' },
        ],
        correct_answers: ['1'] as string[],
    });

    const [formError, setFormError] = useState<string | null>(null);

    // Option Math Equation Modal State
    const [optionMathModalIndex, setOptionMathModalIndex] = useState<number | null>(null);
    const [tempOptionText, setTempOptionText] = useState('');

    const openOptionMathModal = (idx: number) => {
        setOptionMathModalIndex(idx);
        setTempOptionText(questionForm.options[idx]?.text || '');
    };

    const saveOptionMath = () => {
        if (optionMathModalIndex !== null) {
            handleOptionTextChange(optionMathModalIndex, tempOptionText);
            setOptionMathModalIndex(null);
        }
    };

    useEffect(() => {
        fetchExamData();
    }, [id]);

    const fetchExamData = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/exams/${id}/questions`);
            setExam(res.data.exam);
            setQuestions(res.data.questions || []);
        } catch (err: any) {
            console.error('Failed to load exam questions', err);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingQuestion(null);
        setQuestionForm({
            question_text: '',
            question_type: 'single_choice',
            marks: 1,
            attachment_url: '',
            explanation: '',
            options: [
                { id: '1', text: '' },
                { id: '2', text: '' },
                { id: '3', text: '' },
                { id: '4', text: '' },
            ],
            correct_answers: ['1'],
        });
        setFormError(null);
        setModalOpen(true);
    };

    const openEditModal = (q: ExamQuestion) => {
        setEditingQuestion(q);
        setQuestionForm({
            question_text: q.question_text || '',
            question_type: q.question_type,
            marks: q.marks || 1,
            attachment_url: q.attachment_url || '',
            explanation: q.explanation || '',
            options: q.options && q.options.length > 0
                ? q.options
                : [
                    { id: '1', text: '' },
                    { id: '2', text: '' },
                ],
            correct_answers: q.correct_answers || [],
        });
        setFormError(null);
        setModalOpen(true);
    };

    const handleOptionTextChange = (idx: number, text: string) => {
        const newOpts = [...questionForm.options];
        newOpts[idx].text = text;
        setQuestionForm({ ...questionForm, options: newOpts });
    };

    const addOption = () => {
        const nextId = String(Date.now());
        setQuestionForm({
            ...questionForm,
            options: [...questionForm.options, { id: nextId, text: '' }],
        });
    };

    const removeOption = (idx: number) => {
        if (questionForm.options.length <= 2) {
            alert('There must be at least 2 options.');
            return;
        }
        const removedId = questionForm.options[idx].id;
        const newOpts = questionForm.options.filter((_, i) => i !== idx);
        const newCorrect = questionForm.correct_answers.filter(id => id !== removedId);
        setQuestionForm({
            ...questionForm,
            options: newOpts,
            correct_answers: newCorrect.length > 0 ? newCorrect : [newOpts[0].id],
        });
    };

    const toggleCorrectAnswer = (optionId: string) => {
        if (questionForm.question_type === 'single_choice') {
            setQuestionForm({ ...questionForm, correct_answers: [optionId] });
        } else if (questionForm.question_type === 'multiple_choice') {
            const exists = questionForm.correct_answers.includes(optionId);
            let nextAnswers = [];
            if (exists) {
                nextAnswers = questionForm.correct_answers.filter(id => id !== optionId);
                if (nextAnswers.length === 0) {
                    nextAnswers = [optionId]; // keep at least one
                }
            } else {
                nextAnswers = [...questionForm.correct_answers, optionId];
            }
            setQuestionForm({ ...questionForm, correct_answers: nextAnswers });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingImage(true);
            const data = new FormData();
            data.append('file', file);
            const res = await apiClient.post('/exams/questions/upload-attachment', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setQuestionForm(prev => ({ ...prev, attachment_url: res.data.url }));
        } catch (err: any) {
            alert('Failed to upload image.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!questionForm.question_text.trim()) {
            setFormError('Please enter the question text.');
            return;
        }

        if (questionForm.question_type !== 'written_paper') {
            const emptyOpt = questionForm.options.find(o => !o.text.trim());
            if (emptyOpt) {
                setFormError('Please fill in all option texts or delete extra options.');
                return;
            }
            if (questionForm.correct_answers.length === 0) {
                setFormError('Please select at least one correct answer.');
                return;
            }
        }

        try {
            setSaving(true);
            const payload = {
                ...questionForm,
                marks: Number(questionForm.marks),
                options: questionForm.question_type === 'written_paper' ? null : questionForm.options,
                correct_answers: questionForm.question_type === 'written_paper' ? null : questionForm.correct_answers,
            };

            if (editingQuestion) {
                const res = await apiClient.put(`/exams/${id}/questions/${editingQuestion.id}`, payload);
                setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? res.data.data : q));
                if (exam) setExam({ ...exam, total_marks: res.data.exam_total_marks });
            } else {
                const res = await apiClient.post(`/exams/${id}/questions`, payload);
                setQuestions(prev => [...prev, res.data.data]);
                if (exam) setExam({ ...exam, total_marks: res.data.exam_total_marks });
            }

            setModalOpen(false);
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to save question.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuestion = async (qId: number) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;

        try {
            const res = await apiClient.delete(`/exams/${id}/questions/${qId}`);
            setQuestions(prev => prev.filter(q => q.id !== qId));
            if (exam) setExam({ ...exam, total_marks: res.data.exam_total_marks });
        } catch (err) {
            alert('Failed to delete question.');
        }
    };

    const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= questions.length) return;

        const newQuestions = [...questions];
        const temp = newQuestions[index];
        newQuestions[index] = newQuestions[targetIndex];
        newQuestions[targetIndex] = temp;

        setQuestions(newQuestions);

        try {
            await apiClient.post(`/exams/${id}/questions/reorder`, {
                question_ids: newQuestions.map(q => q.id),
            });
        } catch (err) {
            fetchExamData(); // rollback
        }
    };

    if (loading) {
        return (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
                <p className="text-sm">Loading Exam Builder...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Top Navigation & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <Link
                        to={basePath}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                {exam?.title}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                                Exam Builder
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {exam?.course ? `Course: ${exam.course.title} • ` : ''}
                            Total Questions: {questions.length} • Total Marks: {exam?.total_marks} Marks • Duration: {exam?.duration_minutes} Mins
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        to={`${basePath}/${id}/submissions`}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5"
                    >
                        <FileText className="w-4 h-4 text-purple-500" />
                        <span>Submissions ({exam?.submissions_count ?? 0})</span>
                    </Link>
                    <button
                        onClick={openAddModal}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-sky-600/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Question</span>
                    </button>
                </div>
            </div>

            {/* Questions List */}
            {questions.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm">
                    <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No questions added yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        Click below to create MCQ (Single Choice / Multiple Choice) or Written Question Paper.
                    </p>
                    <button
                        onClick={openAddModal}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium shadow-sm shadow-sky-600/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add First Question</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map((q, idx) => (
                        <div
                            key={q.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                        Q{idx + 1}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {q.question_type === 'single_choice' && (
                                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                                                    Single Choice (MCQ)
                                                </span>
                                            )}
                                            {q.question_type === 'multiple_choice' && (
                                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
                                                    Multiple Choice
                                                </span>
                                            )}
                                            {q.question_type === 'written_paper' && (
                                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    <span>Written Question Paper</span>
                                                </span>
                                            )}
                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                [{q.marks} Marks]
                                            </span>
                                        </div>
                                        <MathView
                                            content={q.question_text}
                                            className="text-sm font-medium text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    {/* Reorder buttons */}
                                    <button
                                        onClick={() => handleMoveQuestion(idx, 'up')}
                                        disabled={idx === 0}
                                        className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-20"
                                        title="Move Up"
                                    >
                                        <MoveUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleMoveQuestion(idx, 'down')}
                                        disabled={idx === questions.length - 1}
                                        className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-20"
                                        title="Move Down"
                                    >
                                        <MoveDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(q)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        title="Edit Question"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                        title="Delete Question"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Optional Question Attachment */}
                            {q.attachment_url && (
                                <div className="pl-10">
                                    <img
                                        src={q.attachment_url}
                                        alt="Question diagram"
                                        className="max-h-48 rounded-xl border border-slate-200 dark:border-slate-800 object-contain bg-slate-50 dark:bg-slate-950"
                                    />
                                </div>
                            )}

                            {/* MCQ Options Display */}
                            {q.question_type !== 'written_paper' && q.options && q.options.length > 0 && (
                                <div className="pl-10 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    {q.options.map((opt, oIdx) => {
                                        const isCorrect = (q.correct_answers || []).includes(opt.id);
                                        return (
                                            <div
                                                key={opt.id}
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                                                    isCorrect
                                                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                                                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                {isCorrect ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                <span className="font-semibold text-slate-500 mr-1">
                                                    {String.fromCharCode(65 + oIdx)}.
                                                </span>
                                                <MathView content={opt.text} inline className="truncate" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Written Paper Information */}
                            {q.question_type === 'written_paper' && (
                                <div className="pl-10">
                                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                        <FileText className="w-4 h-4 shrink-0 text-amber-600" />
                                        <span>
                                            Students will write answers on paper and upload photos or PDF during the exam. The instructor can evaluate submissions from the "Submissions" page.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Add / Edit Question */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-sky-500" />
                                <span>{editingQuestion ? 'Edit Question' : 'Add New Question'}</span>
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveQuestion} className="space-y-4">
                            {/* Question Type Selection */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                    Question Type <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setQuestionForm({ ...questionForm, question_type: 'single_choice', correct_answers: [questionForm.options[0]?.id || '1'] })}
                                        className={`p-3 rounded-xl text-left border text-xs font-medium transition-all ${
                                            questionForm.question_type === 'single_choice'
                                                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-800 dark:text-sky-200 ring-2 ring-sky-500/20'
                                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="font-bold flex items-center gap-1.5">
                                            <Circle className="w-3.5 h-3.5 text-sky-500" />
                                            <span>Single Choice</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">1 Correct Answer (MCQ)</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setQuestionForm({ ...questionForm, question_type: 'multiple_choice' })}
                                        className={`p-3 rounded-xl text-left border text-xs font-medium transition-all ${
                                            questionForm.question_type === 'multiple_choice'
                                                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-800 dark:text-purple-200 ring-2 ring-purple-500/20'
                                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="font-bold flex items-center gap-1.5">
                                            <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
                                            <span>Multiple Choice</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Multiple Correct Answers</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setQuestionForm({ ...questionForm, question_type: 'written_paper' })}
                                        className={`p-3 rounded-xl text-left border text-xs font-medium transition-all ${
                                            questionForm.question_type === 'written_paper'
                                                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/20'
                                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="font-bold flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Upload Paper (Written)</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Upload photo or PDF</p>
                                    </button>
                                </div>
                            </div>

                            {/* Word Math Question Text Editor */}
                            <div>
                                <WordMathEditor
                                    value={questionForm.question_text}
                                    onChange={val => setQuestionForm({ ...questionForm, question_text: val })}
                                    label="Question & Mathematical Equations"
                                    placeholder="Type questions and formulas like Microsoft Word... e.g. If $x^2 + y^2 = 25$ and $x + y = 7$, what is the value of $xy$?"
                                    minHeight="150px"
                                    required
                                />
                            </div>

                            {/* Marks & Image Attachment Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Question Marks <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.5"
                                        required
                                        value={questionForm.marks}
                                        onChange={e => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Question Image / Diagram (Optional)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5 shrink-0">
                                            {uploadingImage ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Upload className="w-3.5 h-3.5 text-sky-500" />
                                            )}
                                            <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                                            <input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                                disabled={uploadingImage}
                                            />
                                        </label>
                                        {questionForm.attachment_url && (
                                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 truncate">
                                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">Image attached</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setQuestionForm({ ...questionForm, attachment_url: '' })}
                                                    className="text-rose-500 hover:underline text-[11px]"
                                                >
                                                    (Remove)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Options Editor (Only for MCQ Single or Multiple choice) */}
                            {questionForm.question_type !== 'written_paper' && (
                                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                Options & Correct Answer Selection
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {questionForm.question_type === 'single_choice'
                                                    ? 'Click the radio button on the left to set the correct answer.'
                                                    : 'Check the boxes for multiple correct answers.'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addOption}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-500"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Add Option</span>
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {questionForm.options.map((opt, idx) => {
                                            const isChecked = questionForm.correct_answers.includes(opt.id);
                                            return (
                                                <div
                                                    key={opt.id}
                                                    className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                                                        isChecked
                                                            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                                                    }`}
                                                >
                                                    {/* Correct toggle */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCorrectAnswer(opt.id)}
                                                        className="p-1 rounded-full text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                                                        title="Mark as correct answer"
                                                    >
                                                        {questionForm.question_type === 'single_choice' ? (
                                                            isChecked ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                            ) : (
                                                                <Circle className="w-5 h-5 text-slate-400" />
                                                            )
                                                        ) : (
                                                            isChecked ? (
                                                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                                                            ) : (
                                                                <Square className="w-5 h-5 text-slate-400" />
                                                            )
                                                        )}
                                                    </button>

                                                    <span className="text-xs font-bold text-slate-500 w-5 text-center">
                                                        {String.fromCharCode(65 + idx)}
                                                    </span>

                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <input
                                                                type="text"
                                                                required
                                                                value={opt.text}
                                                                onChange={e => handleOptionTextChange(idx, e.target.value)}
                                                                placeholder={`Enter option ${String.fromCharCode(65 + idx)} text... (e.g. $\\frac{1}{2}$ or $x^2$)`}
                                                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => openOptionMathModal(idx)}
                                                                className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-xs font-serif font-bold rounded-lg border border-sky-200 dark:border-sky-800 flex items-center gap-1 shrink-0"
                                                                title="Add equation or formula to this option"
                                                            >
                                                                <span>∑ Formula</span>
                                                            </button>
                                                        </div>
                                                        {opt.text && (opt.text.includes('$') || opt.text.includes('\\')) && (
                                                            <div className="text-xs px-2.5 py-1 bg-sky-50/80 dark:bg-sky-950/40 rounded-lg text-sky-900 dark:text-sky-200 border border-sky-100 dark:border-sky-900/40">
                                                                <span className="text-[10px] text-slate-400 mr-2 font-bold uppercase">Option Preview:</span>
                                                                <MathView content={opt.text} inline />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {questionForm.options.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOption(idx)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-500"
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

                            {/* Written Paper Special Notice */}
                            {questionForm.question_type === 'written_paper' && (
                                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                                    <p className="font-semibold flex items-center gap-1.5">
                                        <FileText className="w-4 h-4 text-amber-600" />
                                        <span>Written Exam Instructions:</span>
                                    </p>
                                    <p>
                                        Students will solve questions on paper, take photos with their camera/mobile, or upload PDF files. The assigned teacher can evaluate and award marks once submitted.
                                    </p>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm shadow-sky-600/20 flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-3.5 h-3.5" />
                                            <span>{editingQuestion ? 'Update Question' : 'Add Question'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Option Math Equation Builder Modal */}
            {optionMathModalIndex !== null && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Option {String.fromCharCode(65 + optionMathModalIndex)} Equation Builder</span>
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Click or type formulas below to formulate option text
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOptionMathModalIndex(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Input text / formula */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Option Text or LaTeX Equation:
                            </label>
                            <input
                                type="text"
                                value={tempOptionText}
                                onChange={e => setTempOptionText(e.target.value)}
                                placeholder="e.g. $\frac{1}{2}$ or $\sqrt{3}/2$ or $x^2 + 1$"
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-sky-500"
                                autoFocus
                            />
                        </div>

                        {/* Live KaTeX Preview */}
                        <div className="p-3 bg-sky-50/50 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900/50 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                                Live Preview:
                            </div>
                            <div className="min-h-8 flex items-center text-sm font-semibold text-slate-900 dark:text-white">
                                {tempOptionText.trim() ? (
                                    <MathView content={tempOptionText} inline />
                                ) : (
                                    <span className="text-xs text-slate-400 italic">Type text or click common formulas below...</span>
                                )}
                            </div>
                        </div>

                        {/* Quick Common Math Formulas for Options */}
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                Quick Formulas (Click to insert):
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                                {[
                                    { label: '½', val: '$\\frac{1}{2}$' },
                                    { label: '¼', val: '$\\frac{1}{4}$' },
                                    { label: '¾', val: '$\\frac{3}{4}$' },
                                    { label: '√3 / 2', val: '$\\frac{\\sqrt{3}}{2}$' },
                                    { label: '1 / √2', val: '$\\frac{1}{\\sqrt{2}}$' },
                                    { label: '√2', val: '$\\sqrt{2}$' },
                                    { label: '√3', val: '$\\sqrt{3}$' },
                                    { label: '0', val: '$0$' },
                                    { label: '1', val: '$1$' },
                                    { label: '-1', val: '$-1$' },
                                    { label: '±1', val: '$\\pm 1$' },
                                    { label: '∞', val: '$\\infty$' },
                                    { label: 'π', val: '$\\pi$' },
                                    { label: 'θ', val: '$\\theta$' },
                                    { label: 'x²', val: '$x^2$' },
                                    { label: 'a/b', val: '$\\frac{a}{b}$' },
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setTempOptionText(item.val)}
                                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 hover:text-sky-700 text-xs font-serif font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-center"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setOptionMathModalIndex(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={saveOptionMath}
                                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                            >
                                <Check className="w-3.5 h-3.5" />
                                <span>Save to Option</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

