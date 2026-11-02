import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
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
    Video
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { VdoCipherUploader } from '../../components/admin/VdoCipherUploader';

export const AdminCourseBuilderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [course, setCourse] = useState<any>(null);
    const [sections, setSections] = useState<CourseSection[]>([]);
    const [loading, setLoading] = useState(true);

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
                    <button
                        onClick={openAddSection}
                        className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>নতুন সেকশন যোগ করুন</span>
                    </button>
                </div>
            </div>

            {/* Sections & Lessons List (Tutor LMS Pro Style) */}
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
