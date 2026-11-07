import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Course, CourseSection, Lesson, LessonAttachment } from '../../types';
import { 
    ArrowLeft, 
    Plus, 
    Layers, 
    PlayCircle, 
    FileText, 
    Trash2, 
    Edit, 
    Copy, 
    ChevronUp, 
    ChevronDown, 
    Upload, 
    Paperclip, 
    Download, 
    Sparkles, 
    Lock, 
    Eye, 
    Save, 
    Check, 
    ShieldCheck, 
    Globe, 
    Video,
    ClipboardList,
    Clock,
    Award,
    Users,
    Unlink,
    Search,
    Loader2,
    AlertCircle,
    ExternalLink,
    BookOpen,
    CheckCircle2
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { VdoCipherUploader } from '../../components/admin/VdoCipherUploader';

export const AdminCourseBuilderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const isTeacher = user?.role === 'teacher';
    const examBasePath = isTeacher ? '/teacher/exams' : '/admin/exams';

    const [course, setCourse] = useState<any>(null);
    const [sections, setSections] = useState<CourseSection[]>([]);
    const [loading, setLoading] = useState(true);

    // Tab state
    const [activeTab, setActiveTab] = useState<'curriculum' | 'exams'>('curriculum');

    // Course Attached Exams state
    const [attachedExams, setAttachedExams] = useState<any[]>([]);
    const [availableExams, setAvailableExams] = useState<any[]>([]);
    const [loadingExams, setLoadingExams] = useState(false);
    const [attachModalOpen, setAttachModalOpen] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [attaching, setAttaching] = useState(false);
    const [examSearch, setExamSearch] = useState('');

    // Section modal
    const [sectionModalOpen, setSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<CourseSection | null>(null);
    const [sectionTitle, setSectionTitle] = useState('');
    const [sectionDesc, setSectionDesc] = useState('');

    // Lesson modal
    const [lessonModalOpen, setLessonModalOpen] = useState(false);
    const [targetSectionId, setTargetSectionId] = useState<number | null>(null);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonContent, setLessonContent] = useState('');
    const [lessonVideoUrl, setLessonVideoUrl] = useState('');
    const [lessonDuration, setLessonDuration] = useState('0');
    const [lessonIsPreview, setLessonIsPreview] = useState(false);
    const [lessonStatus, setLessonStatus] = useState<'draft' | 'published'>('published');
    const [videoSourceType, setVideoSourceType] = useState<'vdocipher' | 'embed'>('vdocipher');

    // Attachments upload state
    const [uploadingAttachment, setUploadingAttachment] = useState(false);

    useEffect(() => {
        fetchCurriculum();
        fetchCourseExams();
    }, [id]);

    const fetchCurriculum = async () => {
        try {
            const { data } = await apiClient.get(`/builder/${id}/curriculum`);
            setCourse(data.course);
            setSections(data.sections || []);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    const fetchCourseExams = async () => {
        try {
            setLoadingExams(true);
            const { data } = await apiClient.get(`/builder/${id}/exams`);
            setAttachedExams(data.attached_exams || []);
            setAvailableExams(data.available_exams || []);
        } catch (err) {
            console.error('Failed to load course exams', err);
        } finally {
            setLoadingExams(false);
        }
    };

    const handleAttachExam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExamId) return;

        try {
            setAttaching(true);
            await apiClient.post(`/builder/${id}/exams`, {
                exam_id: Number(selectedExamId),
            });
            setSelectedExamId('');
            setAttachModalOpen(false);
            fetchCourseExams();
        } catch (err: any) {
            alert(err.response?.data?.message || 'পরীক্ষা যুক্ত করতে সমস্যা হয়েছে।');
        } finally {
            setAttaching(false);
        }
    };

    const handleDetachExam = async (examId: number, examTitle: string) => {
        if (!window.confirm(`আপনি কি "${examTitle}" পরীক্ষাটি এই কোর্স থেকে অপসারণ করতে চান? (মূল পরীক্ষাটি মুছে যাবে না, কেবল এই কোর্স থেকে বিচ্ছিন্ন হবে)`)) {
            return;
        }

        try {
            await apiClient.delete(`/builder/${id}/exams/${examId}`);
            setAttachedExams(prev => prev.filter(e => e.id !== examId));
            fetchCourseExams();
        } catch (err: any) {
            alert(err.response?.data?.message || 'পরীক্ষা অপসারণ করতে সমস্যা হয়েছে।');
        }
    };

    /* Section Actions */
    const openAddSection = () => {
        setEditingSection(null);
        setSectionTitle('');
        setSectionDesc('');
        setSectionModalOpen(true);
    };

    const openEditSection = (section: CourseSection) => {
        setEditingSection(section);
        setSectionTitle(section.title);
        setSectionDesc(section.description || '');
        setSectionModalOpen(true);
    };

    const handleSaveSection = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSection) {
                await apiClient.put(`/builder/sections/${editingSection.id}`, {
                    title: sectionTitle,
                    description: sectionDesc,
                });
            } else {
                await apiClient.post(`/builder/${id}/sections`, {
                    title: sectionTitle,
                    description: sectionDesc,
                });
            }
            setSectionModalOpen(false);
            fetchCurriculum();
        } catch (err: any) {
            alert(err.response?.data?.message || 'সেকশন সংরক্ষণ ব্যর্থ হয়েছে।');
        }
    };

    const handleDeleteSection = async (sectionId: number) => {
        if (!window.confirm('এই সেকশন এবং এর ভেতরের সকল ক্লাস কি মুছে ফেলতে চান?')) return;
        try {
            await apiClient.delete(`/builder/sections/${sectionId}`);
            setSections(prev => prev.filter(s => s.id !== sectionId));
        } catch {}
    };

    const moveSection = async (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;

        const temp = newSections[index];
        newSections[index] = newSections[targetIndex];
        newSections[targetIndex] = temp;

        setSections(newSections);

        try {
            await apiClient.post(`/builder/${id}/reorder-sections`, {
                section_ids: newSections.map(s => s.id),
            });
        } catch {}
    };

    /* Lesson Actions */
    const openAddLesson = (sectionId: number) => {
        setTargetSectionId(sectionId);
        setEditingLesson(null);
        setLessonTitle('');
        setLessonContent('');
        setLessonVideoUrl('');
        setLessonDuration('15');
        setLessonIsPreview(false);
        setLessonStatus('published');
        setVideoSourceType('vdocipher');
        setLessonModalOpen(true);
    };

    const openEditLesson = (lesson: Lesson) => {
        setTargetSectionId(lesson.section_id);
        setEditingLesson(lesson);
        setLessonTitle(lesson.title);
        setLessonContent(lesson.content || '');
        setLessonVideoUrl(lesson.video_url || '');
        setLessonDuration(String(lesson.duration_minutes || 0));
        setLessonIsPreview(lesson.is_preview);
        setLessonStatus(lesson.status);

        const vUrl = (lesson.video_url || '').toLowerCase();
        const isEmbed = vUrl.includes('youtube.com') || vUrl.includes('youtu.be') || vUrl.includes('vimeo.com');
        setVideoSourceType(isEmbed ? 'embed' : 'vdocipher');

        setLessonModalOpen(true);
    };

    const handleSaveLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                title: lessonTitle,
                content: lessonContent,
                video_url: lessonVideoUrl,
                duration_minutes: parseInt(lessonDuration, 10) || 0,
                is_preview: lessonIsPreview,
                status: lessonStatus,
            };

            if (editingLesson) {
                await apiClient.put(`/builder/lessons/${editingLesson.id}`, payload);
            } else if (targetSectionId) {
                await apiClient.post(`/builder/sections/${targetSectionId}/lessons`, payload);
            }
            setLessonModalOpen(false);
            fetchCurriculum();
        } catch (err: any) {
            alert(err.response?.data?.message || 'লেসন সংরক্ষণ ব্যর্থ হয়েছে।');
        }
    };

    const handleDeleteLesson = async (lessonId: number) => {
        if (!window.confirm('এই ক্লাসটি কি মুছে ফেলতে চান?')) return;
        try {
            await apiClient.delete(`/builder/lessons/${lessonId}`);
            fetchCurriculum();
        } catch {}
    };

    const handleDuplicateLesson = async (lessonId: number) => {
        try {
            await apiClient.post(`/builder/lessons/${lessonId}/duplicate`);
            fetchCurriculum();
        } catch {}
    };

    const moveLesson = async (section: CourseSection, lessonIndex: number, direction: 'up' | 'down') => {
        const lessons = [...section.lessons];
        const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
        if (targetIndex < 0 || targetIndex >= lessons.length) return;

        const temp = lessons[lessonIndex];
        lessons[lessonIndex] = lessons[targetIndex];
        lessons[targetIndex] = temp;

        setSections(prev => prev.map(s => s.id === section.id ? { ...s, lessons } : s));

        try {
            await apiClient.post(`/builder/sections/${section.id}/reorder-lessons`, {
                lesson_ids: lessons.map(l => l.id),
            });
        } catch {}
    };

    /* Attachment Actions */
    const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>, lessonId: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploadingAttachment(true);
        try {
            await apiClient.post(`/builder/lessons/${lessonId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            fetchCurriculum();
        } catch (err: any) {
            alert(err.response?.data?.message || 'ফাইল আপলোডে ব্যর্থ হয়েছে।');
        } finally {
            setUploadingAttachment(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!window.confirm('এই ফাইলটি কি মুছে ফেলতে চান?')) return;
        try {
            await apiClient.delete(`/builder/attachments/${attachmentId}`);
            fetchCurriculum();
        } catch {}
    };

    if (loading || !course) {
        return <div className="p-12 text-center text-slate-400">কারিকুলাম বিল্ডার লোড হচ্ছে...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Top Bar Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/courses"
                        className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">ভিজ্যুয়াল কোর্স বিল্ডার</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                course.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                                {course.status}
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{course.title}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === 'curriculum' ? (
                        <button
                            onClick={openAddSection}
                            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>নতুন সেকশন যোগ করুন</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => {
                                    setSelectedExamId('');
                                    setAttachModalOpen(true);
                                }}
                                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>পরীক্ষা যুক্ত করুন</span>
                            </button>
                            <Link
                                to={`${examBasePath}/create`}
                                target="_blank"
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl flex items-center gap-2 transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>নতুন পরীক্ষা তৈরি</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Builder Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('curriculum')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'curriculum'
                            ? 'border-sky-600 text-sky-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>কারিকুলাম ও লেসন</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                        {sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('exams')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'exams'
                            ? 'border-sky-600 text-sky-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <ClipboardList className="w-4 h-4" />
                    <span>কোর্সের পরীক্ষাসমূহ (Exams)</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700">
                        {attachedExams.length}
                    </span>
                </button>
            </div>

            {/* Curriculum Tab Content */}
            {activeTab === 'curriculum' && (
            <div className="space-y-6">
                {sections.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                        <Layers className="w-12 h-12 text-slate-300 mx-auto" />
                        <h3 className="text-lg font-bold text-slate-800">এখনও কোনো সেকশন যোগ করা হয়নি</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            কোর্সটি সুসংগঠিত করতে প্রথমে একটি টপিক বা সেকশন তৈরি করুন, যেমন: "পরিচিতি", "অধ্যায় ০১"।
                        </p>
                        <button
                            onClick={openAddSection}
                            className="px-6 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-sky-700"
                        >
                            প্রথম সেকশন তৈরি করুন
                        </button>
                    </div>
                ) : (
                    sections.map((section, sIndex) => (
                        <div
                            key={section.id}
                            className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
                        >
                            {/* Section Header */}
                            <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-sky-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                                        ০{sIndex + 1}
                                    </span>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                                        {section.description && (
                                            <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Move Section Up / Down */}
                                    <button
                                        onClick={() => moveSection(sIndex, 'up')}
                                        disabled={sIndex === 0}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg disabled:opacity-30"
                                        title="উপরে নিন"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => moveSection(sIndex, 'down')}
                                        disabled={sIndex === sections.length - 1}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg disabled:opacity-30"
                                        title="নিচে নিন"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {/* Edit Section */}
                                    <button
                                        onClick={() => openEditSection(section)}
                                        className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100"
                                        title="সেকশন এডিট"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>

                                    {/* Delete Section */}
                                    <button
                                        onClick={() => handleDeleteSection(section.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                                        title="সেকশন ডিলিট"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    {/* Add Lesson Button */}
                                    <button
                                        onClick={() => openAddLesson(section.id)}
                                        className="ml-2 px-3.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>লেসন যোগ করুন</span>
                                    </button>
                                </div>
                            </div>

                            {/* Lessons List inside Section */}
                            <div className="p-4 sm:p-6 space-y-3">
                                {section.lessons && section.lessons.length > 0 ? (
                                    section.lessons.map((lesson, lIndex) => (
                                        <div
                                            key={lesson.id}
                                            className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                                                    <PlayCircle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-slate-800">{lesson.title}</h4>
                                                        {lesson.is_preview && (
                                                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                                                                ফ্রি প্রিভিউ
                                                            </span>
                                                        )}
                                                        {lesson.status === 'draft' && (
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                                ড্রাফট
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                        <span>সময়: {lesson.duration_minutes} মিনিট</span>
                                                        {lesson.attachments && lesson.attachments.length > 0 && (
                                                            <span className="flex items-center gap-1 text-sky-600 font-semibold">
                                                                <Paperclip className="w-3 h-3" />
                                                                {lesson.attachments.length} টি ফাইল
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lesson Actions */}
                                            <div className="flex items-center gap-1.5">
                                                {/* Reorder Lesson Up / Down */}
                                                <button
                                                    onClick={() => moveLesson(section, lIndex, 'up')}
                                                    disabled={lIndex === 0}
                                                    className="p-1 text-slate-400 hover:text-slate-700 rounded disabled:opacity-30"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => moveLesson(section, lIndex, 'down')}
                                                    disabled={lIndex === section.lessons.length - 1}
                                                    className="p-1 text-slate-400 hover:text-slate-700 rounded disabled:opacity-30"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>

                                                {/* Upload Study Material */}
                                                <label className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg cursor-pointer" title="স্টাডি ম্যাটেরিয়াল আপলোড">
                                                    <Upload className="w-4 h-4" />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => handleUploadAttachment(e, lesson.id)}
                                                    />
                                                </label>

                                                {/* Duplicate */}
                                                <button
                                                    onClick={() => handleDuplicateLesson(lesson.id)}
                                                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg"
                                                    title="ডুপ্লিকেট লেসন"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEditLesson(lesson)}
                                                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg"
                                                    title="লেসন এডিট"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                                    title="লেসন ডিলিট"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        এই সেকশনে এখনও কোনো লেসন নেই। "+ লেসন যোগ করুন" বাটনে ক্লিক করুন।
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            )}

            {/* Course Exams Tab Content */}
            {activeTab === 'exams' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-sky-600" />
                                <span>কোর্সের অন্তর্ভুক্ত পরীক্ষাসমূহ</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                এই কোর্সে মোট {attachedExams.length}টি পরীক্ষা যুক্ত আছে। একই পরীক্ষা একাধিক কোর্সেও যুক্ত রাখা যায়।
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedExamId('');
                                setAttachModalOpen(true);
                            }}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ কোর্সে পরীক্ষা যুক্ত করুন</span>
                        </button>
                    </div>

                    {loadingExams ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-3" />
                            <p className="text-xs text-slate-400">পরীক্ষার তথ্য লোড হচ্ছে...</p>
                        </div>
                    ) : attachedExams.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
                                <ClipboardList className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">এই কোর্সে কোনো পরীক্ষা যুক্ত করা হয়নি</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                    শিক্ষার্থীদের মূল্যায়নের জন্য আপনার তৈরি করা যেকোনো পরীক্ষা এই কোর্সে যুক্ত করুন, অথবা নতুন একটি পরীক্ষা তৈরি করুন।
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setSelectedExamId('');
                                        setAttachModalOpen(true);
                                    }}
                                    className="px-5 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-sky-700 flex items-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>পরীক্ষা যুক্ত করুন</span>
                                </button>
                                <Link
                                    to={`${examBasePath}/create`}
                                    target="_blank"
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>নতুন পরীক্ষা তৈরি করুন</span>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {attachedExams.map((exam, index) => (
                                <div
                                    key={exam.id}
                                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 hover:border-sky-200 transition-all space-y-4"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-md bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                    {index + 1}
                                                </span>
                                                <h4 className="text-base font-bold text-slate-900 tracking-tight">
                                                    {exam.title}
                                                </h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                    exam.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {exam.status}
                                                </span>
                                            </div>
                                            {exam.description && (
                                                <p className="text-xs text-slate-500 line-clamp-2 pl-8">
                                                    {exam.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                            <Link
                                                to={`${examBasePath}/${exam.id}/builder`}
                                                className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                title="প্রশ্ন যুক্ত বা সম্পাদনা করুন"
                                            >
                                                <Edit className="w-3.5 h-3.5 text-sky-600" />
                                                <span>প্রশ্ন বিল্ডার</span>
                                            </Link>

                                            <Link
                                                to={`${examBasePath}/${exam.id}/submissions`}
                                                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                title="শিক্ষার্থীদের খাতা ও ফলাফল"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>খাতা মূল্যায়ন ({exam.submissions_count ?? 0})</span>
                                            </Link>

                                            <button
                                                onClick={() => handleDetachExam(exam.id, exam.title)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="কোর্স থেকে পরীক্ষা অপসারণ করুন"
                                            >
                                                <Unlink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta Badges */}
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Award className="w-4 h-4 text-amber-500" />
                                            <span>মোট নম্বর: <strong className="text-slate-800">{exam.total_marks}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Clock className="w-4 h-4 text-sky-500" />
                                            <span>সময়: <strong className="text-slate-800">{exam.duration_minutes} মিনিট</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <FileText className="w-4 h-4 text-violet-500" />
                                            <span>প্রশ্ন: <strong className="text-slate-800">{exam.questions_count ?? 0}টি</strong></span>
                                        </div>
                                        {exam.has_negative_marking ? (
                                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[11px] font-semibold">
                                                নেগেটিভ মার্কিং: -{exam.negative_marks}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-semibold">
                                                নেগেটিভ মার্কিং নেই
                                            </span>
                                        )}
                                        {exam.creator && (
                                            <span className="text-slate-400 text-[11px] ml-auto">
                                                তৈরি করেছেন: {exam.creator.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Attach Exam Modal */}
            <Modal
                isOpen={attachModalOpen}
                onClose={() => setAttachModalOpen(false)}
                title="কোর্সে পরীক্ষা যুক্ত করুন (Attach Exam to Course)"
                maxWidth="lg"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                        নিচের তালিকা থেকে যেকোনো পরীক্ষা নির্বাচন করে এই কোর্সে যুক্ত করুন। একই পরীক্ষা একাধিক কোর্সেও যুক্ত করা যাবে।
                    </p>

                    {availableExams.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-xs text-slate-600 font-medium">
                                যুক্ত করার মতো কোনো পরীক্ষা অবশিষ্ট নেই।
                            </p>
                            <Link
                                to={`${examBasePath}/create`}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>নতুন পরীক্ষা তৈরি করুন</span>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleAttachExam} className="space-y-4">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={examSearch}
                                    onChange={e => setExamSearch(e.target.value)}
                                    placeholder="পরীক্ষার নাম দিয়ে খুঁজুন..."
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                {availableExams
                                    .filter(e => !examSearch || e.title.toLowerCase().includes(examSearch.toLowerCase()))
                                    .map(exam => (
                                        <label
                                            key={exam.id}
                                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                selectedExamId === String(exam.id)
                                                    ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="selected_exam"
                                                value={exam.id}
                                                checked={selectedExamId === String(exam.id)}
                                                onChange={e => setSelectedExamId(e.target.value)}
                                                className="mt-1 text-sky-600 focus:ring-sky-500"
                                            />
                                            <div className="space-y-1 flex-1">
                                                <div className="font-bold text-xs text-slate-900">{exam.title}</div>
                                                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                                    <span>সময়: {exam.duration_minutes} মিনিট</span>
                                                    <span>•</span>
                                                    <span>নম্বর: {exam.total_marks}</span>
                                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                                        exam.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {exam.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setAttachModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedExamId || attaching}
                                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                                >
                                    {attaching ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>যুক্ত হচ্ছে...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>কোর্সে যুক্ত করুন</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </Modal>

            {/* Section Modal */}
            <Modal
                isOpen={sectionModalOpen}
                onClose={() => setSectionModalOpen(false)}
                title={editingSection ? 'সেকশন সম্পাদনা করুন' : 'নতুন সেকশন তৈরি করুন'}
            >
                <form onSubmit={handleSaveSection} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">সেকশন বা টপিক শিরোনাম *</label>
                        <input
                            type="text"
                            required
                            value={sectionTitle}
                            onChange={(e) => setSectionTitle(e.target.value)}
                            placeholder="যেমন: অধ্যায় ০১ - ভেক্টর ও বলবিদ্যা"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)</label>
                        <textarea
                            rows={3}
                            value={sectionDesc}
                            onChange={(e) => setSectionDesc(e.target.value)}
                            placeholder="এই সেকশনের অন্তর্ভুক্ত বিষয়বস্তু..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md"
                    >
                        সংরক্ষণ করুন
                    </button>
                </form>
            </Modal>

            {/* Lesson Modal */}
            <Modal
                isOpen={lessonModalOpen}
                onClose={() => setLessonModalOpen(false)}
                title={editingLesson ? 'লেসন সম্পাদনা করুন' : 'নতুন লেসন তৈরি করুন'}
                maxWidth="xl"
            >
                <form onSubmit={handleSaveLesson} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">লেসনের শিরোনাম *</label>
                        <input
                            type="text"
                            required
                            value={lessonTitle}
                            onChange={(e) => setLessonTitle(e.target.value)}
                            placeholder="যেমন: লেকচার ০১: ভেক্টর বিভাজন ও প্রয়োগ"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Video Source Switcher */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700">
                            লেসনের ভিডিও নির্বাচন করুন *
                        </label>

                        {/* Switcher Tabs */}
                        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setVideoSourceType('vdocipher')}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    videoSourceType === 'vdocipher'
                                        ? 'bg-white text-indigo-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                <span>VdoCipher (DRM সুরক্ষিত আপলোড)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setVideoSourceType('embed')}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    videoSourceType === 'embed'
                                        ? 'bg-white text-sky-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Globe className="w-4 h-4 text-sky-600" />
                                <span>YouTube / Vimeo লিংক</span>
                            </button>
                        </div>

                        {/* VdoCipher Uploader or External URL */}
                        {videoSourceType === 'vdocipher' ? (
                            <VdoCipherUploader
                                initialVideoUrl={lessonVideoUrl}
                                lessonTitle={lessonTitle || 'Lesson Video'}
                                onVideoUploaded={(url) => setLessonVideoUrl(url)}
                                onDurationDetected={(mins) => {
                                    if (!lessonDuration || lessonDuration === '0') {
                                        setLessonDuration(String(mins));
                                    }
                                }}
                            />
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    ভিডিও লিংক (YouTube / Vimeo / Direct URL)
                                </label>
                                <input
                                    type="text"
                                    value={lessonVideoUrl}
                                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">ক্লাসের সময়কাল (মিনিট)</label>
                            <input
                                type="number"
                                min={0}
                                value={lessonDuration}
                                onChange={(e) => setLessonDuration(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">লেসনের বিস্তারিত নোট / পড়ার বিষয়বস্তু</label>
                        <textarea
                            rows={4}
                            value={lessonContent}
                            onChange={(e) => setLessonContent(e.target.value)}
                            placeholder="ক্লাস সংক্রান্ত কোনো নির্দেশনা বা আলোচনা..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Preview & Status Checkboxes */}
                    <div className="flex flex-wrap items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                            <input
                                type="checkbox"
                                checked={lessonIsPreview}
                                onChange={(e) => setLessonIsPreview(e.target.checked)}
                                className="w-4 h-4 text-sky-600 rounded border-slate-300"
                            />
                            <span>ফ্রি প্রিভিউ লেসন (কোর্স না কিনেও দেখতে পারবে)</span>
                        </label>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <span>স্ট্যাটাস:</span>
                            <select
                                value={lessonStatus}
                                onChange={(e) => setLessonStatus(e.target.value as any)}
                                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
                            >
                                <option value="published">প্রকাশিত (Published)</option>
                                <option value="draft">ড্রাফট (Draft)</option>
                            </select>
                        </div>
                    </div>

                    {/* Uploaded Attachments in Edit mode */}
                    {editingLesson && editingLesson.attachments && editingLesson.attachments.length > 0 && (
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                            <label className="block text-xs font-bold text-slate-700">সংযুক্ত স্টাডি ম্যাটেরিয়াল</label>
                            <div className="space-y-1.5">
                                {editingLesson.attachments.map((att) => (
                                    <div key={att.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 truncate mr-2">
                                            <Paperclip className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                            <span className="font-semibold truncate">{att.file_name}</span>
                                            <span className="text-slate-400 text-[10px]">({att.file_type.toUpperCase()})</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAttachment(att.id)}
                                            className="text-rose-500 hover:text-rose-700 p-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md"
                    >
                        লেসন সংরক্ষণ করুন
                    </button>
                </form>
            </Modal>
        </div>
    );
};
