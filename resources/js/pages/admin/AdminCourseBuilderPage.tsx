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
    CheckCircle2,
    Radio,
    MessageSquare
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const AdminCourseBuilderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const isTeacher = user?.role === 'teacher';
    const examBasePath = isTeacher ? '/teacher/exams' : '/admin/exams';

    const [course, setCourse] = useState<any>(null);
    const [sections, setSections] = useState<CourseSection[]>([]);
    const [loading, setLoading] = useState(true);

    // Tab state ('lessons' | 'live_classes' | 'exams')
    const [activeTab, setActiveTab] = useState<'lessons' | 'live_classes' | 'exams'>('lessons');

    // Live Classes state
    const [liveClasses, setLiveClasses] = useState<any[]>([]);
    const [loadingLiveClasses, setLoadingLiveClasses] = useState(false);
    const [liveClassModalOpen, setLiveClassModalOpen] = useState(false);
    const [editingLiveClass, setEditingLiveClass] = useState<any | null>(null);
    const [liveClassTitle, setLiveClassTitle] = useState('');
    const [liveClassDesc, setLiveClassDesc] = useState('');
    const [liveClassUrl, setLiveClassUrl] = useState('');
    const [liveClassStartTime, setLiveClassStartTime] = useState('');
    const [liveClassEndTime, setLiveClassEndTime] = useState('');
    const [liveClassStatus, setLiveClassStatus] = useState<'upcoming' | 'live' | 'completed' | 'cancelled'>('upcoming');
    const [savingLiveClass, setSavingLiveClass] = useState(false);

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

    // Attachments upload state
    const [uploadingAttachment, setUploadingAttachment] = useState(false);

    useEffect(() => {
        fetchCurriculum();
        fetchCourseExams();
        fetchLiveClasses();
    }, [id]);

    const fetchLiveClasses = async () => {
        try {
            setLoadingLiveClasses(true);
            const { data } = await apiClient.get(`/builder/${id}/live-classes`);
            setLiveClasses(data.live_classes || []);
        } catch (err) {
            console.error('Failed to load live classes', err);
        } finally {
            setLoadingLiveClasses(false);
        }
    };

    const openAddLiveClass = () => {
        setEditingLiveClass(null);
        setLiveClassTitle('');
        setLiveClassDesc('');
        setLiveClassUrl('');
        const d = new Date();
        d.setMinutes(d.getMinutes() + 60);
        d.setMinutes(0);
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setLiveClassStartTime(iso);
        setLiveClassEndTime('');
        setLiveClassStatus('upcoming');
        setLiveClassModalOpen(true);
    };

    const openEditLiveClass = (lc: any) => {
        setEditingLiveClass(lc);
        setLiveClassTitle(lc.title);
        setLiveClassDesc(lc.description || '');
        setLiveClassUrl(lc.live_url || '');
        if (lc.start_time) {
            const d = new Date(lc.start_time);
            setLiveClassStartTime(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        } else {
            setLiveClassStartTime('');
        }
        if (lc.end_time) {
            const d = new Date(lc.end_time);
            setLiveClassEndTime(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        } else {
            setLiveClassEndTime('');
        }
        setLiveClassStatus(lc.status || 'upcoming');
        setLiveClassModalOpen(true);
    };

    const handleSaveLiveClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!liveClassTitle.trim() || !liveClassUrl.trim() || !liveClassStartTime) {
            alert('অনুগ্রহ করে ক্লাসের শিরোনাম, ইউটিউব লিংক এবং শুরুর সময় দিন।');
            return;
        }

        try {
            setSavingLiveClass(true);
            const payload = {
                title: liveClassTitle.trim(),
                description: liveClassDesc.trim() || null,
                live_url: liveClassUrl.trim(),
                start_time: liveClassStartTime,
                end_time: liveClassEndTime || null,
                status: liveClassStatus,
            };

            if (editingLiveClass) {
                await apiClient.put(`/builder/${id}/live-classes/${editingLiveClass.id}`, payload);
            } else {
                await apiClient.post(`/builder/${id}/live-classes`, payload);
            }

            setLiveClassModalOpen(false);
            fetchLiveClasses();
        } catch (err: any) {
            alert(err.response?.data?.message || 'লাইভ ক্লাস সংরক্ষণ করতে সমস্যা হয়েছে।');
        } finally {
            setSavingLiveClass(false);
        }
    };

    const handleDeleteLiveClass = async (lcId: number, title: string) => {
        if (!window.confirm(`আপনি কি নিশ্চিত যে "${title}" লাইভ ক্লাসটি মুছে ফেলতে চান?`)) {
            return;
        }
        try {
            await apiClient.delete(`/builder/${id}/live-classes/${lcId}`);
            setLiveClasses(prev => prev.filter(c => c.id !== lcId));
        } catch (err: any) {
            alert(err.response?.data?.message || 'লাইভ ক্লাস ডিলিট করা যায়নি।');
        }
    };

    const handleToggleLiveStatus = async (lc: any, newStatus: string) => {
        try {
            await apiClient.patch(`/builder/${id}/live-classes/${lc.id}/status`, { status: newStatus });
            fetchLiveClasses();
        } catch (err: any) {
            alert(err.response?.data?.message || 'স্ট্যাটাস পরিবর্তন করা যায়নি।');
        }
    };

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
            alert(err.response?.data?.message || 'Failed to attach exam.');
        } finally {
            setAttaching(false);
        }
    };

    const handleDetachExam = async (examId: number, examTitle: string) => {
        if (!window.confirm(`Are you sure you want to detach "${examTitle}" from this course? (The original exam will not be deleted, only unlinked from this course)`)) {
            return;
        }

        try {
            await apiClient.delete(`/builder/${id}/exams/${examId}`);
            setAttachedExams(prev => prev.filter(e => e.id !== examId));
            fetchCourseExams();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to detach exam.');
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
            alert(err.response?.data?.message || 'Failed to save section.');
        }
    };

    const handleDeleteSection = async (sectionId: number) => {
        if (!window.confirm('Are you sure you want to delete this section and all lessons inside it?')) return;
        try {
            await apiClient.delete(`/builder/sections/${sectionId}`);
            setSections(prev => prev.filter(s => s.id !== sectionId));
        } catch {}
    };

    const moveSection = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;

        const updated = [...sections];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        setSections(updated);

        try {
            await apiClient.post(`/builder/${id}/sections/reorder`, {
                section_ids: updated.map(s => s.id),
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
        setLessonDuration('0');
        setLessonIsPreview(false);
        setLessonStatus('published');
        setLessonModalOpen(true);
    };

    const openEditLesson = (lesson: Lesson) => {
        setEditingLesson(lesson);
        setTargetSectionId(lesson.section_id);
        setLessonTitle(lesson.title);
        setLessonContent(lesson.content || '');
        setLessonVideoUrl(lesson.video_url || '');
        setLessonDuration(String(lesson.duration_minutes || '0'));
        setLessonIsPreview(Boolean(lesson.is_preview));
        setLessonStatus(lesson.status);
        setLessonModalOpen(true);
    };

    const handleSaveLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            title: lessonTitle,
            content: lessonContent,
            video_url: lessonVideoUrl,
            duration_minutes: parseInt(lessonDuration, 10) || 0,
            is_preview: lessonIsPreview,
            status: lessonStatus,
        };

        try {
            if (editingLesson) {
                await apiClient.put(`/builder/lessons/${editingLesson.id}`, payload);
            } else if (targetSectionId) {
                await apiClient.post(`/builder/sections/${targetSectionId}/lessons`, payload);
            }
            setLessonModalOpen(false);
            fetchCurriculum();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save lesson.');
        }
    };

    const handleDeleteLesson = async (lessonId: number) => {
        if (!window.confirm('Are you sure you want to delete this lesson?')) return;
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
            alert(err.response?.data?.message || 'Failed to upload file.');
        } finally {
            setUploadingAttachment(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;
        try {
            await apiClient.delete(`/builder/attachments/${attachmentId}`);
            fetchCurriculum();
        } catch {}
    };

    if (loading || !course) {
        return <div className="p-12 text-center text-slate-400">Loading curriculum builder...</div>;
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
                            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Visual Course Builder</span>
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
                    {activeTab === 'lessons' && (
                        <button
                            onClick={openAddSection}
                            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Section</span>
                        </button>
                    )}

                    {activeTab === 'live_classes' && (
                        <button
                            onClick={openAddLiveClass}
                            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ নতুন লাইভ ক্লাস</span>
                        </button>
                    )}

                    {activeTab === 'exams' && (
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => {
                                    setSelectedExamId('');
                                    setAttachModalOpen(true);
                                }}
                                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Attach Exam</span>
                            </button>
                            <Link
                                to={`${examBasePath}/create`}
                                target="_blank"
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl flex items-center gap-2 transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>Create New Exam</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Builder Navigation Tabs */}
            <div className="flex items-center gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('lessons')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        activeTab === 'lessons'
                            ? 'border-sky-600 text-sky-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>Lessons</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                        {sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('live_classes')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        activeTab === 'live_classes'
                            ? 'border-rose-600 text-rose-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Radio className="w-4 h-4" />
                    <span>Live Class</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                        {liveClasses.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('exams')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        activeTab === 'exams'
                            ? 'border-sky-600 text-sky-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <ClipboardList className="w-4 h-4" />
                    <span>Course Exams</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700">
                        {attachedExams.length}
                    </span>
                </button>
            </div>

            {/* Lessons Tab Content */}
            {activeTab === 'lessons' && (
            <div className="space-y-6">
                {sections.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                        <Layers className="w-12 h-12 text-slate-300 mx-auto" />
                        <h3 className="text-lg font-bold text-slate-800">No sections added yet</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            To organize your course, create a topic or section first, such as "Introduction", "Chapter 01".
                        </p>
                        <button
                            onClick={openAddSection}
                            className="px-6 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-sky-700"
                        >
                            Create First Section
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
                                        {String(sIndex + 1).padStart(2, '0')}
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
                                        title="Move Up"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => moveSection(sIndex, 'down')}
                                        disabled={sIndex === sections.length - 1}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg disabled:opacity-30"
                                        title="Move Down"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {/* Edit Section */}
                                    <button
                                        onClick={() => openEditSection(section)}
                                        className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100"
                                        title="Edit Section"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>

                                    {/* Delete Section */}
                                    <button
                                        onClick={() => handleDeleteSection(section.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                                        title="Delete Section"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    {/* Add Lesson Button */}
                                    <button
                                        onClick={() => openAddLesson(section.id)}
                                        className="ml-2 px-3.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Lesson</span>
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
                                                                Free Preview
                                                            </span>
                                                        )}
                                                        {lesson.status === 'draft' && (
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                                Draft
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                        <span>Duration: {lesson.duration_minutes} mins</span>
                                                        {lesson.attachments && lesson.attachments.length > 0 && (
                                                            <span className="flex items-center gap-1 text-sky-600 font-semibold">
                                                                <Paperclip className="w-3 h-3" />
                                                                {lesson.attachments.length} files
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
                                                <label className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg cursor-pointer" title="Upload study material">
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
                                                    title="Duplicate Lesson"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEditLesson(lesson)}
                                                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg"
                                                    title="Edit Lesson"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                                    title="Delete Lesson"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        There are no lessons in this section yet. Click "+ Add Lesson" to get started.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            )}

            {/* Live Classes Tab Content */}
            {activeTab === 'live_classes' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
                                <span>কোর্স লাইভ ক্লাস ({liveClasses.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                ইউটিউবে Unlisted Live চালু করে লিংক ও ক্লাসের সময় সেট করুন। শিক্ষার্থীরা সরাসরি জয়েন করে লাইভ দেখতে ও কমেন্ট করতে পারবে।
                            </p>
                        </div>
                        <button
                            onClick={openAddLiveClass}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ নতুন লাইভ ক্লাস তৈরি করুন</span>
                        </button>
                    </div>

                    {loadingLiveClasses ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-3" />
                            <p className="text-xs text-slate-400">লাইভ ক্লাস লোড হচ্ছে...</p>
                        </div>
                    ) : liveClasses.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                                <Radio className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">কোনো লাইভ ক্লাস যুক্ত করা হয়নি</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                    শিক্ষার্থীদের সাথে লাইভ সেশন নিতে ইউটিউব আনলিস্টেড লাইভ লিংক দিয়ে এখনই একটি ক্লাস শিডিউল করুন।
                                </p>
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={openAddLiveClass}
                                    className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-rose-700 flex items-center gap-1.5 mx-auto cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>প্রথম লাইভ ক্লাস তৈরি করুন</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {liveClasses.map((lc, index) => {
                                const isLive = lc.status === 'live' || lc.is_currently_live;
                                const isCompleted = lc.status === 'completed';

                                return (
                                    <div
                                        key={lc.id}
                                        className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all space-y-4 shadow-xs ${
                                            isLive
                                                ? 'border-rose-300 ring-2 ring-rose-500/15'
                                                : 'border-slate-200/80 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                                                        {lc.title}
                                                    </h4>

                                                    {/* Status Badge */}
                                                    {isLive ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                            <span>লাইভ চলছে</span>
                                                        </span>
                                                    ) : isCompleted ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                                            সমাপ্ত
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                                            আসন্ন
                                                        </span>
                                                    )}
                                                </div>

                                                {lc.description && (
                                                    <p className="text-xs text-slate-500 pl-8 line-clamp-2">
                                                        {lc.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                {/* Live Toggle */}
                                                {!isLive && !isCompleted && (
                                                    <button
                                                        onClick={() => handleToggleLiveStatus(lc, 'live')}
                                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                                        title="লাইভ শুরু করুন"
                                                    >
                                                        <Radio className="w-3.5 h-3.5" />
                                                        <span>লাইভ শুরু করুন</span>
                                                    </button>
                                                )}
                                                {isLive && (
                                                    <button
                                                        onClick={() => handleToggleLiveStatus(lc, 'completed')}
                                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                                        title="লাইভ সমাপ্ত করুন"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>সমাপ্ত করুন</span>
                                                    </button>
                                                )}

                                                <Link
                                                    to={`/student/live-classes/${lc.id}`}
                                                    target="_blank"
                                                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                                                    title="লাইভ ক্লাসরুম দেখুন"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    <span>ক্লাসরুম</span>
                                                </Link>

                                                <button
                                                    onClick={() => openEditLiveClass(lc)}
                                                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                                                    title="এডিট করুন"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteLiveClass(lc.id, lc.title)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    title="ডিলিট করুন"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Metadata row */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-sky-600" />
                                                <span>
                                                    শুরু: <strong>{new Date(lc.start_time).toLocaleString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <a
                                                    href={lc.live_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline truncate max-w-xs"
                                                >
                                                    {lc.live_url}
                                                </a>
                                            </div>

                                            <div className="flex items-center gap-1.5 ml-auto text-slate-500">
                                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{lc.comments_count || 0} টি মন্তব্য</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                                <span>Course Exams</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Total {attachedExams.length} exams attached to this course. The same exam can also be shared across multiple courses.
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
                            <span>+ Attach Exam to Course</span>
                        </button>
                    </div>

                    {loadingExams ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-3" />
                            <p className="text-xs text-slate-400">Loading exams...</p>
                        </div>
                    ) : attachedExams.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
                                <ClipboardList className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">No exams attached to this course</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                    Attach any existing exam or create a new exam to evaluate your students.
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
                                    <span>Attach Exam</span>
                                </button>
                                <Link
                                    to={`${examBasePath}/create`}
                                    target="_blank"
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>Create New Exam</span>
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
                                                title="Add or edit questions"
                                            >
                                                <Edit className="w-3.5 h-3.5 text-sky-600" />
                                                <span>Question Builder</span>
                                            </Link>

                                            <Link
                                                to={`${examBasePath}/${exam.id}/submissions`}
                                                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                title="View student submissions and results"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Submissions ({exam.submissions_count ?? 0})</span>
                                            </Link>

                                            <button
                                                onClick={() => handleDetachExam(exam.id, exam.title)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Detach exam from course"
                                            >
                                                <Unlink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta Badges */}
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Award className="w-4 h-4 text-amber-500" />
                                            <span>Total Marks: <strong className="text-slate-800">{exam.total_marks}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Clock className="w-4 h-4 text-sky-500" />
                                            <span>Time: <strong className="text-slate-800">{exam.duration_minutes} mins</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <FileText className="w-4 h-4 text-violet-500" />
                                            <span>Questions: <strong className="text-slate-800">{exam.questions_count ?? 0}</strong></span>
                                        </div>
                                        {exam.has_negative_marking ? (
                                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[11px] font-semibold">
                                                Negative Marking: -{exam.negative_marks}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-semibold">
                                                No Negative Marking
                                            </span>
                                        )}
                                        {exam.creator && (
                                            <span className="text-slate-400 text-[11px] ml-auto">
                                                Created by: {exam.creator.name}
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
                title="Attach Exam to Course"
                maxWidth="lg"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                        Select any exam from the list below to attach to this course. You can attach the same exam to multiple courses.
                    </p>

                    {availableExams.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-xs text-slate-600 font-medium">
                                No exams available to attach.
                            </p>
                            <Link
                                to={`${examBasePath}/create`}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create New Exam</span>
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
                                    placeholder="Search exams by name..."
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
                                                    <span>Time: {exam.duration_minutes} mins</span>
                                                    <span>•</span>
                                                    <span>Marks: {exam.total_marks}</span>
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
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedExamId || attaching}
                                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                                >
                                    {attaching ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Attaching...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Attach to Course</span>
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
                title={editingSection ? 'Edit Section' : 'Create New Section'}
            >
                <form onSubmit={handleSaveSection} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Section / Topic Title *</label>
                        <input
                            type="text"
                            required
                            value={sectionTitle}
                            onChange={(e) => setSectionTitle(e.target.value)}
                            placeholder="e.g. Chapter 01 - Vectors and Mechanics"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Short Description (Optional)</label>
                        <textarea
                            rows={3}
                            value={sectionDesc}
                            onChange={(e) => setSectionDesc(e.target.value)}
                            placeholder="Topics covered in this section..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md"
                    >
                        Save Section
                    </button>
                </form>
            </Modal>

            {/* Lesson Modal */}
            <Modal
                isOpen={lessonModalOpen}
                onClose={() => setLessonModalOpen(false)}
                title={editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
                maxWidth="xl"
            >
                <form onSubmit={handleSaveLesson} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Lesson Title *</label>
                        <input
                            type="text"
                            required
                            value={lessonTitle}
                            onChange={(e) => setLessonTitle(e.target.value)}
                            placeholder="e.g. Lecture 01: Vector Resolution and Applications"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Video Link */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 text-sky-600" />
                                <span>Lesson Video URL (YouTube / Vimeo / Direct Video URL)</span>
                            </label>
                            <input
                                type="text"
                                value={lessonVideoUrl}
                                onChange={(e) => setLessonVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Lesson Duration (Minutes)</label>
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
                        <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Lesson Notes / Reading Material</label>
                        <textarea
                            rows={4}
                            value={lessonContent}
                            onChange={(e) => setLessonContent(e.target.value)}
                            placeholder="Instructions, key formulas, or discussion..."
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
                            <span>Free Preview Lesson (Students can watch without purchasing)</span>
                        </label>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <span>Status:</span>
                            <select
                                value={lessonStatus}
                                onChange={(e) => setLessonStatus(e.target.value as any)}
                                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
                            >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>

                    {/* Uploaded Attachments in Edit mode */}
                    {editingLesson && editingLesson.attachments && editingLesson.attachments.length > 0 && (
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                            <label className="block text-xs font-bold text-slate-700">Attached Study Materials</label>
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
                        Save Lesson
                    </button>
                </form>
            </Modal>

            {/* Live Class Modal */}
            <Modal
                isOpen={liveClassModalOpen}
                onClose={() => setLiveClassModalOpen(false)}
                title={editingLiveClass ? 'লাইভ ক্লাস সম্পাদনা করুন' : 'নতুন লাইভ ক্লাস তৈরি করুন'}
            >
                <form onSubmit={handleSaveLiveClass} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            ক্লাসের শিরোনাম / বিষয় *
                        </label>
                        <input
                            type="text"
                            required
                            value={liveClassTitle}
                            onChange={(e) => setLiveClassTitle(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-sky-500 focus:outline-hidden"
                            placeholder="যেমন: পদার্থবিজ্ঞান ১ম পত্র - গতিবিদ্যা লাইভ ক্লাস ০১"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            ইউটিউব লাইভ লিংক (Unlisted Live Stream URL) *
                        </label>
                        <input
                            type="text"
                            required
                            value={liveClassUrl}
                            onChange={(e) => setLiveClassUrl(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-sky-500 focus:outline-hidden"
                            placeholder="https://www.youtube.com/watch?v=... বা https://youtu.be/..."
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                            ইউটিউব স্টুডিও থেকে Unlisted Live চালু করে তার লিংকটি এখানে পেস্ট করুন। ক্লাসের সময় শিক্ষার্থীরা সরাসরি এই স্ট্রিমে যুক্ত হয়ে কমেন্ট করতে পারবে।
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                ক্লাসের শুরুর সময় *
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={liveClassStartTime}
                                onChange={(e) => setLiveClassStartTime(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                আনুমানিক সমাপ্তির সময় (ঐচ্ছিক)
                            </label>
                            <input
                                type="datetime-local"
                                value={liveClassEndTime}
                                onChange={(e) => setLiveClassEndTime(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            স্ট্যাটাস
                        </label>
                        <select
                            value={liveClassStatus}
                            onChange={(e: any) => setLiveClassStatus(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                        >
                            <option value="upcoming">আসন্ন (Upcoming)</option>
                            <option value="live">🔴 চলমান লাইভ (Live Now)</option>
                            <option value="completed">সমাপ্ত (Completed)</option>
                            <option value="cancelled">বাতিল (Cancelled)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            বিবরণ বা সিলেবাস (ঐচ্ছিক)
                        </label>
                        <textarea
                            rows={3}
                            value={liveClassDesc}
                            onChange={(e) => setLiveClassDesc(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                            placeholder="এই লাইভ ক্লাসে কী কী টপিক নিয়ে আলোচনা করা হবে..."
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={savingLiveClass}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                            {savingLiveClass && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{savingLiveClass ? 'সংরক্ষণ হচ্ছে...' : editingLiveClass ? 'আপডেট করুন' : 'লাইভ ক্লাস তৈরি করুন'}</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
