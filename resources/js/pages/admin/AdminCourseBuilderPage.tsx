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
    MessageSquare,
    Calendar,
    Package,
    Truck,
    FileUp
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

    // Tab state ('lessons' | 'live_classes' | 'practice_exams' | 'live_exams' | 'routine')
    const [activeTab, setActiveTab] = useState<'lessons' | 'live_classes' | 'practice_exams' | 'live_exams' | 'routine'>('lessons');

    // Routine state
    const [routineItems, setRoutineItems] = useState<any[]>([]);
    const [loadingRoutine, setLoadingRoutine] = useState(false);
    const [routineModalOpen, setRoutineModalOpen] = useState(false);
    const [editingRoutineItem, setEditingRoutineItem] = useState<any | null>(null);
    const [routineItemType, setRoutineItemType] = useState<'class_upload' | 'material' | 'book_parcel' | 'general'>('class_upload');
    const [routineItemTitle, setRoutineItemTitle] = useState('');
    const [routineItemSubject, setRoutineItemSubject] = useState('');
    const [routineItemStartTime, setRoutineItemStartTime] = useState('');
    const [routineItemEndTime, setRoutineItemEndTime] = useState('');
    const [routineItemDesc, setRoutineItemDesc] = useState('');
    const [routineItemLinkUrl, setRoutineItemLinkUrl] = useState('');
    const [routineItemActionText, setRoutineItemActionText] = useState('');
    const [routineItemStatus, setRoutineItemStatus] = useState('upcoming');
    const [routineItemCourier, setRoutineItemCourier] = useState('');
    const [routineItemTracking, setRoutineItemTracking] = useState('');
    const [savingRoutineItem, setSavingRoutineItem] = useState(false);

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

    // Create / Edit Exam Modal state
    const [examModalOpen, setExamModalOpen] = useState(false);
    const [examModalType, setExamModalType] = useState<'practice' | 'live'>('practice');
    const [editingExam, setEditingExam] = useState<any | null>(null);
    const [examTitle, setExamTitle] = useState('');
    const [examDesc, setExamDesc] = useState('');
    const [examDuration, setExamDuration] = useState('30');
    const [examPassMarks, setExamPassMarks] = useState('0');
    const [examHasNegativeMarking, setExamHasNegativeMarking] = useState(false);
    const [examNegativeMarks, setExamNegativeMarks] = useState('0.25');
    const [examStartTime, setExamStartTime] = useState('');
    const [examEndTime, setExamEndTime] = useState('');
    const [examStatus, setExamStatus] = useState<'published' | 'draft'>('published');
    const [savingExam, setSavingExam] = useState(false);

    // Attach Exam Modal state
    const [attachModalOpen, setAttachModalOpen] = useState(false);
    const [attachExamType, setAttachExamType] = useState<'practice' | 'live'>('practice');
    const [attachStartTime, setAttachStartTime] = useState('');
    const [attachEndTime, setAttachEndTime] = useState('');
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
        fetchCourseRoutine();
    }, [id]);

    const fetchCourseRoutine = async () => {
        try {
            setLoadingRoutine(true);
            const { data } = await apiClient.get(`/builder/${id}/routine`);
            setRoutineItems(data.routine_items || []);
        } catch (err) {
            console.error('Failed to load course routine', err);
        } finally {
            setLoadingRoutine(false);
        }
    };

    const openAddRoutineItem = (defaultType?: 'class_upload' | 'material' | 'book_parcel' | 'general') => {
        setEditingRoutineItem(null);
        setRoutineItemType(defaultType || 'class_upload');
        setRoutineItemTitle('');
        setRoutineItemSubject('');

        const now = new Date();
        now.setHours(16, 0, 0, 0);
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        setRoutineItemStartTime(`${y}-${m}-${d}T${h}:${min}`);
        setRoutineItemEndTime('');
        setRoutineItemDesc('');
        setRoutineItemLinkUrl('');
        setRoutineItemActionText('');
        setRoutineItemStatus('upcoming');
        setRoutineItemCourier('');
        setRoutineItemTracking('');
        setRoutineModalOpen(true);
    };

    const openEditRoutineItem = (item: any) => {
        setEditingRoutineItem(item);
        setRoutineItemType(item.type || 'class_upload');
        setRoutineItemTitle(item.title || '');
        setRoutineItemSubject(item.subject || '');

        const formatForInput = (isoStr: string | null) => {
            if (!isoStr) return '';
            const dt = new Date(isoStr);
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const d = String(dt.getDate()).padStart(2, '0');
            const h = String(dt.getHours()).padStart(2, '0');
            const min = String(dt.getMinutes()).padStart(2, '0');
            return `${y}-${m}-${d}T${h}:${min}`;
        };

        setRoutineItemStartTime(formatForInput(item.start_time));
        setRoutineItemEndTime(formatForInput(item.end_time));
        setRoutineItemDesc(item.description || '');
        setRoutineItemLinkUrl(item.link_url || '');
        setRoutineItemActionText(item.action_text || '');
        setRoutineItemStatus(item.status || 'upcoming');
        setRoutineItemCourier(item.meta?.courier_name || '');
        setRoutineItemTracking(item.meta?.tracking_code || '');
        setRoutineModalOpen(true);
    };

    const handleSaveRoutineItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!routineItemTitle.trim() || !routineItemStartTime) {
            alert('দয়া করে শিরোনাম এবং তারিখ/সময় প্রদান করুন।');
            return;
        }

        try {
            setSavingRoutineItem(true);
            const payload: any = {
                type: routineItemType,
                title: routineItemTitle.trim(),
                subject: routineItemSubject.trim() || null,
                start_time: routineItemStartTime,
                end_time: routineItemEndTime || null,
                description: routineItemDesc.trim() || null,
                link_url: routineItemLinkUrl.trim() || null,
                action_text: routineItemActionText.trim() || null,
                status: routineItemStatus,
                meta: routineItemType === 'book_parcel' ? {
                    courier_name: routineItemCourier.trim() || null,
                    tracking_code: routineItemTracking.trim() || null,
                } : null,
            };

            if (editingRoutineItem) {
                await apiClient.put(`/builder/${id}/routine/items/${editingRoutineItem.id}`, payload);
            } else {
                await apiClient.post(`/builder/${id}/routine/items`, payload);
            }

            setRoutineModalOpen(false);
            fetchCourseRoutine();
        } catch (err: any) {
            alert(err.response?.data?.message || 'রুটিন সূচী সংরক্ষণ করতে সমস্যা হয়েছে।');
        } finally {
            setSavingRoutineItem(false);
        }
    };

    const handleDeleteRoutineItem = async (itemId: number, title: string) => {
        if (!window.confirm(`আপনি কি নিশ্চিত যে "${title}" রুটিন সূচীটি মুছে ফেলতে চান?`)) {
            return;
        }
        try {
            await apiClient.delete(`/builder/${id}/routine/items/${itemId}`);
            fetchCourseRoutine();
        } catch (err: any) {
            alert(err.response?.data?.message || 'রুটিন সূচী মোছা সম্ভব হয়নি।');
        }
    };

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
            fetchCourseRoutine();
        } catch (err: any) {
            alert(err.response?.data?.message || 'লাইভ ক্লাস সংরক্ষণ করতে সমস্যা হয়েছে।');
        } finally {
            setSavingLiveClass(false);
        }
    };

    const handleDeleteLiveClass = async (lcId: number, title?: string) => {
        if (title && !window.confirm(`আপনি কি নিশ্চিত যে "${title}" লাইভ ক্লাসটি মুছে ফেলতে চান?`)) {
            return;
        }
        if (!title && !window.confirm('আপনি কি নিশ্চিত যে এই লাইভ ক্লাসটি মুছে ফেলতে চান?')) {
            return;
        }
        try {
            await apiClient.delete(`/builder/${id}/live-classes/${lcId}`);
            setLiveClasses(prev => prev.filter(c => c.id !== lcId));
            fetchCourseRoutine();
        } catch (err: any) {
            alert(err.response?.data?.message || 'লাইভ ক্লাস ডিলিট করা যায়নি।');
        }
    };

    const handleToggleLiveStatus = async (lc: any, newStatus: string) => {
        try {
            await apiClient.patch(`/builder/${id}/live-classes/${lc.id}/status`, { status: newStatus });
            fetchLiveClasses();
            fetchCourseRoutine();
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

    const formatExamDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('bn-BD', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        } catch {
            return dateStr;
        }
    };

    const isExamExpired = (exam: any) => {
        if (!exam.end_time) return false;
        return new Date(exam.end_time) < new Date();
    };

    const isExamLiveNow = (exam: any) => {
        if (exam.exam_type !== 'live' || !exam.start_time || !exam.end_time) return false;
        const now = new Date();
        return new Date(exam.start_time) <= now && now <= new Date(exam.end_time);
    };

    const isExamUpcoming = (exam: any) => {
        if (exam.exam_type !== 'live' || !exam.start_time) return false;
        return new Date(exam.start_time) > new Date();
    };

    // Practice Exams List:
    // 1) All exams where exam_type === 'practice' (or unset)
    // 2) PLUS live exams whose end_time has passed (they automatically transition to practice exams!)
    const practiceExamsList = attachedExams.filter(exam => {
        const isLive = exam.exam_type === 'live';
        if (!isLive) return true;
        return isExamExpired(exam);
    });

    // Live Exams List:
    // All exams created as 'live'
    const liveExamsList = attachedExams.filter(exam => exam.exam_type === 'live');

    const openAddExam = (type: 'practice' | 'live') => {
        setEditingExam(null);
        setExamModalType(type);
        setExamTitle('');
        setExamDesc('');
        setExamDuration('30');
        setExamPassMarks('0');
        setExamHasNegativeMarking(false);
        setExamNegativeMarks('0.25');
        setExamStartTime('');
        setExamEndTime('');
        setExamStatus('published');
        setExamModalOpen(true);
    };

    const openEditExam = (exam: any) => {
        setEditingExam(exam);
        setExamModalType(exam.exam_type === 'live' ? 'live' : 'practice');
        setExamTitle(exam.title || '');
        setExamDesc(exam.description || '');
        setExamDuration(String(exam.duration_minutes || 30));
        setExamPassMarks(String(exam.pass_marks || 0));
        setExamHasNegativeMarking(Boolean(exam.has_negative_marking));
        setExamNegativeMarks(String(exam.negative_marks || 0.25));
        setExamStartTime(exam.start_time ? exam.start_time.substring(0, 16) : '');
        setExamEndTime(exam.end_time ? exam.end_time.substring(0, 16) : '');
        setExamStatus(exam.status || 'published');
        setExamModalOpen(true);
    };

    const openAttachModal = (type: 'practice' | 'live') => {
        setSelectedExamId('');
        setAttachExamType(type);
        setAttachStartTime('');
        setAttachEndTime('');
        setExamSearch('');
        setAttachModalOpen(true);
    };

    const handleSaveExam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!examTitle.trim()) {
            alert('পরীক্ষার শিরোনাম দেওয়া আবশ্যক।');
            return;
        }
        if (examModalType === 'live') {
            if (!examStartTime || !examEndTime) {
                alert('লাইভ পরীক্ষার শুরুর সময় এবং শেষের সময় দেওয়া আবশ্যক।');
                return;
            }
            if (new Date(examEndTime) <= new Date(examStartTime)) {
                alert('লাইভ পরীক্ষার শেষের সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে।');
                return;
            }
        }

        try {
            setSavingExam(true);
            const payload = {
                title: examTitle.trim(),
                description: examDesc.trim() || null,
                exam_type: examModalType,
                duration_minutes: parseInt(examDuration) || 30,
                pass_marks: parseFloat(examPassMarks) || 0,
                has_negative_marking: examHasNegativeMarking,
                negative_marks: examHasNegativeMarking ? (parseFloat(examNegativeMarks) || 0) : 0,
                start_time: examModalType === 'live' ? examStartTime : null,
                end_time: examModalType === 'live' ? examEndTime : null,
                status: examStatus,
            };

            if (editingExam) {
                await apiClient.put(`/builder/${id}/exams/${editingExam.id}`, payload);
            } else {
                await apiClient.post(`/builder/${id}/exams/create`, payload);
            }

            setExamModalOpen(false);
            fetchCourseExams();
            fetchCourseRoutine();
        } catch (err: any) {
            alert(err.response?.data?.message || 'পরীক্ষা সংরক্ষণ করতে ব্যর্থ হয়েছে।');
        } finally {
            setSavingExam(false);
        }
    };

    const handleAttachExam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExamId) return;

        if (attachExamType === 'live') {
            if (!attachStartTime || !attachEndTime) {
                alert('লাইভ পরীক্ষার শুরুর সময় এবং শেষের সময় দেওয়া আবশ্যক।');
                return;
            }
            if (new Date(attachEndTime) <= new Date(attachStartTime)) {
                alert('লাইভ পরীক্ষার শেষের সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে।');
                return;
            }
        }

        try {
            setAttaching(true);
            await apiClient.post(`/builder/${id}/exams`, {
                exam_id: Number(selectedExamId),
                exam_type: attachExamType,
                start_time: attachExamType === 'live' ? attachStartTime : null,
                end_time: attachExamType === 'live' ? attachEndTime : null,
            });
            setSelectedExamId('');
            setAttachModalOpen(false);
            fetchCourseExams();
            fetchCourseRoutine();
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
            fetchCourseRoutine();
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

                    {activeTab === 'practice_exams' && (
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => openAddExam('practice')}
                                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ নতুন প্র্যাকটিস এক্সাম</span>
                            </button>
                            <button
                                onClick={() => openAttachModal('practice')}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span>+ পূর্বের এক্সাম যুক্ত করুন</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'live_exams' && (
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => openAddExam('live')}
                                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-600/30 flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ নতুন লাইভ এক্সাম</span>
                            </button>
                            <button
                                onClick={() => openAttachModal('live')}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span>+ পূর্বের এক্সাম লাইভ হিসেবে যুক্ত করুন</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'routine' && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={openAddLiveClass}
                                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Radio className="w-3.5 h-3.5" />
                                <span>+ লাইভ ক্লাস</span>
                            </button>
                            <button
                                onClick={() => openAddExam('live')}
                                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>+ লাইভ এক্সাম</span>
                            </button>
                            <button
                                onClick={() => openAddRoutineItem()}
                                className="px-3.5 py-2 bg-[#0B4B34] hover:bg-[#083827] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ নতুন সূচী (ক্লাস আপলোড / ম্যাটেরিয়াল / পার্সেল)</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Builder Navigation Tabs */}
            <div className="flex items-center gap-2 sm:gap-4 border-b border-slate-200 overflow-x-auto pb-1 sm:pb-0">
                <button
                    onClick={() => setActiveTab('lessons')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
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
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
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
                    onClick={() => setActiveTab('practice_exams')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'practice_exams'
                            ? 'border-sky-600 text-sky-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>Practice Exam</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700">
                        {practiceExamsList.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('live_exams')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'live_exams'
                            ? 'border-amber-600 text-amber-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    <span>Live Exam</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        {liveExamsList.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('routine')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'routine'
                            ? 'border-[#0B4B34] text-[#0B4B34]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Calendar className="w-4 h-4" />
                    <span>রুটিন (Routine)</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0B4B34]">
                        {routineItems.length}
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

            {/* Practice Exams Tab Content */}
            {activeTab === 'practice_exams' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-sky-600" />
                                <span>প্র্যাকটিস এক্সাম (Practice Exams)</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                মোট {practiceExamsList.length} টি প্র্যাকটিস পরীক্ষা। লাইভ পরীক্ষার সময়সীমা শেষ হলেও তা স্বয়ংক্রিয়ভাবে এখানে চলে আসবে যেন শিক্ষার্থীরা যে কোনো সময় অনুশীলন করতে পারে।
                            </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                                onClick={() => openAddExam('practice')}
                                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ নতুন প্র্যাকটিস এক্সাম</span>
                            </button>
                            <button
                                onClick={() => openAttachModal('practice')}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span>+ পূর্বের এক্সাম যুক্ত করুন</span>
                            </button>
                        </div>
                    </div>

                    {loadingExams ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-3" />
                            <p className="text-xs text-slate-400">Loading practice exams...</p>
                        </div>
                    ) : practiceExamsList.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">কোনো প্র্যাকটিস এক্সাম পাওয়া যায়নি</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                    শিক্ষার্থীদের নিয়মিত অনুশীলনের জন্য নতুন প্র্যাকটিস পরীক্ষা তৈরি করুন অথবা পূর্বের তৈরি করা পরীক্ষা যুক্ত করুন।
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    onClick={() => openAddExam('practice')}
                                    className="px-5 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-sky-700 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>নতুন প্র্যাকটিস এক্সাম তৈরি করুন</span>
                                </button>
                                <button
                                    onClick={() => openAttachModal('practice')}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Paperclip className="w-4 h-4" />
                                    <span>পূর্বের এক্সাম যুক্ত করুন</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {practiceExamsList.map((exam, index) => {
                                const isFromLive = exam.exam_type === 'live';
                                return (
                                    <div
                                        key={exam.id}
                                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 hover:border-sky-200 transition-all space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="w-6 h-6 rounded-md bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <h4 className="text-base font-bold text-slate-900 tracking-tight">
                                                        {exam.title}
                                                    </h4>
                                                    {isFromLive ? (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                                                            <Sparkles className="w-3 h-3 text-purple-600" />
                                                            <span>🔄 লাইভ সম্পন্ন • এখন প্র্যাকটিস মোডে উন্মুক্ত</span>
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 uppercase">
                                                            প্র্যাকটিস এক্সাম
                                                        </span>
                                                    )}
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
                                                    onClick={() => openEditExam(exam)}
                                                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Exam"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDetachExam(exam.id, exam.title)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Live Exams Tab Content */}
            {activeTab === 'live_exams' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-600" />
                                <span>লাইভ এক্সাম (Live Exams)</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                মোট {liveExamsList.length} টি লাইভ পরীক্ষা। নির্ধারিত সময় (শুরু ও শেষ) অনুযায়ী শিক্ষার্থীরা লাইভ পরীক্ষায় অংশ নেয়। সময় শেষ হলে এটি স্বয়ংক্রিয়ভাবে প্র্যাকটিস এক্সামে চলে যায়।
                            </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                                onClick={() => openAddExam('live')}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ নতুন লাইভ এক্সাম</span>
                            </button>
                            <button
                                onClick={() => openAttachModal('live')}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span>+ পূর্বের এক্সাম লাইভ হিসেবে যুক্ত করুন</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">স্বয়ংক্রিয় প্র্যাকটিস রূপান্তর সিস্টেম: </span>
                            লাইভ পরীক্ষার জন্য নির্ধারিত শেষের সময় (End Time) অতিক্রম করার সাথে সাথে পরীক্ষাটি স্বয়ংক্রিয়ভাবে <strong>প্র্যাকটিস এক্সাম</strong> ট্যাবে চলে যাবে এবং শিক্ষার্থীরা নিয়মিত যেকোনো সময় প্র্যাকটিস হিসেবে অংশ নিতে পারবে।
                        </div>
                    </div>

                    {loadingExams ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
                            <p className="text-xs text-slate-400">Loading live exams...</p>
                        </div>
                    ) : liveExamsList.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                                <Clock className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">কোনো লাইভ এক্সাম তৈরি করা হয়নি</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                    নির্দিষ্ট সময়সীমা নির্ধারণ করে একটি লাইভ এক্সাম তৈরি করুন। শিক্ষার্থীরা একই সময়ে পরীক্ষা দিয়ে মেধা তালিকায় প্রতিযোগিতা করতে পারবে।
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    onClick={() => openAddExam('live')}
                                    className="px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-amber-700 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>নতুন লাইভ এক্সাম তৈরি করুন</span>
                                </button>
                                <button
                                    onClick={() => openAttachModal('live')}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Paperclip className="w-4 h-4" />
                                    <span>পূর্বের এক্সাম লাইভ হিসেবে যুক্ত করুন</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {liveExamsList.map((exam, index) => {
                                const isLiveNow = isExamLiveNow(exam);
                                const isUpcoming = isExamUpcoming(exam);
                                const isExpired = isExamExpired(exam);

                                return (
                                    <div
                                        key={exam.id}
                                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 hover:border-amber-200 transition-all space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <h4 className="text-base font-bold text-slate-900 tracking-tight">
                                                        {exam.title}
                                                    </h4>

                                                    {isLiveNow && (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white flex items-center gap-1.5 animate-pulse shadow-sm">
                                                            <Radio className="w-3.5 h-3.5" />
                                                            <span>🔴 লাইভ চলছে</span>
                                                        </span>
                                                    )}

                                                    {isUpcoming && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                            <span>⏳ আসন্ন লাইভ</span>
                                                        </span>
                                                    )}

                                                    {isExpired && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>🔄 সময় সমাপ্ত (প্র্যাকটিস এক্সামে সক্রিয়)</span>
                                                        </span>
                                                    )}

                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        exam.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {exam.status}
                                                    </span>
                                                </div>

                                                {/* Live Schedule Timeline */}
                                                {(exam.start_time || exam.end_time) && (
                                                    <div className="flex flex-wrap items-center gap-3 text-xs bg-amber-50/70 border border-amber-200/60 px-3 py-1.5 rounded-xl text-amber-900 font-medium">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                            <span>শুরু: <strong>{formatExamDate(exam.start_time)}</strong></span>
                                                        </div>
                                                        <span>—</span>
                                                        <div className="flex items-center gap-1">
                                                            <span>শেষ: <strong>{formatExamDate(exam.end_time)}</strong></span>
                                                        </div>
                                                    </div>
                                                )}

                                                {exam.description && (
                                                    <p className="text-xs text-slate-500 line-clamp-2 pl-8">
                                                        {exam.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                <Link
                                                    to={`${examBasePath}/${exam.id}/builder`}
                                                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                    title="Add or edit questions"
                                                >
                                                    <Edit className="w-3.5 h-3.5 text-amber-600" />
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
                                                    onClick={() => openEditExam(exam)}
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Schedule / Settings"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDetachExam(exam.id, exam.title)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
                                                <span>পরীক্ষার সময়সীমা: <strong className="text-slate-800">{exam.duration_minutes} mins</strong></span>
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
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Routine Tab Content */}
            {activeTab === 'routine' && (
                <div className="space-y-6">
                    {/* Header Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#0B4B34]" />
                                <span>কোর্স রুটিন (Course Routine)</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                                এই কোর্সের সকল লাইভ ক্লাস, লাইভ পরীক্ষা, ক্লাস আপলোড, স্টাডি ম্যাটেরিয়াল এবং বই/পার্সেল ডেলিভারির পূর্ণাঙ্গ সময়সূচী। এখান থেকে যোগ করা যেকোনো সূচী স্বয়ংক্রিয়ভাবে শিক্ষার্থীদের রুটিনে ও ড্যাশবোর্ডে প্রদর্শিত হবে।
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                                onClick={openAddLiveClass}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Radio className="w-3.5 h-3.5" />
                                <span>+ লাইভ ক্লাস</span>
                            </button>
                            <button
                                onClick={() => openAddExam('live')}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>+ লাইভ এক্সাম</span>
                            </button>
                            <button
                                onClick={() => openAddRoutineItem('class_upload')}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Video className="w-3.5 h-3.5" />
                                <span>+ ক্লাস আপলোড</span>
                            </button>
                            <button
                                onClick={() => openAddRoutineItem('material')}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>+ ম্যাটেরিয়াল</span>
                            </button>
                            <button
                                onClick={() => openAddRoutineItem('book_parcel')}
                                className="px-3 py-1.5 bg-[#0B4B34] hover:bg-[#083827] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Package className="w-3.5 h-3.5" />
                                <span>+ বই/পার্সেল ডেলিভারি</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0B4B34] flex items-center justify-center font-black shrink-0">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">মোট ইভেন্ট</span>
                                <span className="text-base font-black text-slate-800">{routineItems.length} টি</span>
                            </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black shrink-0">
                                <Radio className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">লাইভ ক্লাস</span>
                                <span className="text-base font-black text-slate-800">{routineItems.filter(i => i.type === 'live_class').length} টি</span>
                            </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black shrink-0">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">লাইভ এক্সাম</span>
                                <span className="text-base font-black text-slate-800">{routineItems.filter(i => i.type === 'live_exam').length} টি</span>
                            </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black shrink-0">
                                <Video className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">ক্লাস আপলোড</span>
                                <span className="text-base font-black text-slate-800">{routineItems.filter(i => i.type === 'class_upload').length} টি</span>
                            </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black shrink-0">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">ম্যাটেরিয়াল</span>
                                <span className="text-base font-black text-slate-800">{routineItems.filter(i => i.type === 'material').length} টি</span>
                            </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black shrink-0">
                                <Package className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">বই ও পার্সেল</span>
                                <span className="text-base font-black text-slate-800">{routineItems.filter(i => i.type === 'book_parcel').length} টি</span>
                            </div>
                        </div>
                    </div>

                    {/* Routine Items List */}
                    {loadingRoutine ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                            <Loader2 className="w-8 h-8 text-[#0B4B34] animate-spin mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-bold">রুটিন ডাটা লোড হচ্ছে...</p>
                        </div>
                    ) : routineItems.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-base font-bold text-slate-800">এখনও কোনো রুটিন সূচী যুক্ত করা হয়নি</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                আপনার শিক্ষার্থীদের জন্য লাইভ ক্লাস, লাইভ পরীক্ষা, ক্লাস আপলোড, স্টাডি ম্যাটেরিয়াল কিংবা বই/পার্সেল ডেলিভারি সিডিউল করুন।
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                                <button
                                    onClick={openAddLiveClass}
                                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                                >
                                    <Radio className="w-3.5 h-3.5" />
                                    <span>লাইভ ক্লাস</span>
                                </button>
                                <button
                                    onClick={() => openAddExam('live')}
                                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>লাইভ এক্সাম</span>
                                </button>
                                <button
                                    onClick={() => openAddRoutineItem()}
                                    className="px-3.5 py-2 bg-[#0B4B34] hover:bg-[#083827] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>অন্যান্য রুটিন সূচী (ক্লাস আপলোড / ম্যাটেরিয়াল / পার্সেল)</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {routineItems.map((item: any) => {
                                const isClass = item.type === 'live_class';
                                const isExam = item.type === 'live_exam';
                                const isCustom = Boolean(item.is_custom_routine);
                                const isClassUpload = item.type === 'class_upload';
                                const isMaterial = item.type === 'material';
                                const isBookParcel = item.type === 'book_parcel';

                                const matchingLiveClass = isClass ? liveClasses.find(lc => lc.id === item.id) : null;
                                const matchingLiveExam = isExam ? liveExamsList.find(e => e.id === item.id) : null;

                                return (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            {/* Date / Time Card */}
                                            <div className="shrink-0 text-center w-28 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                                                <div className="text-[11px] font-extrabold text-[#0B4B34] uppercase tracking-wider">
                                                    {item.day_name || 'তারিখ'}
                                                </div>
                                                <div className="text-sm font-black text-slate-800 my-0.5">
                                                    {item.date_formatted?.split(' ')?.[0] || ''} {item.date_formatted?.split(' ')?.[1] || ''}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500">
                                                    {item.time_display || 'সময় নির্ধারিত'}
                                                </div>
                                            </div>

                                            {/* Main Info */}
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {isClass && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                                            <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                                                            <span>লাইভ ক্লাস</span>
                                                        </span>
                                                    )}
                                                    {isExam && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                            <span>লাইভ এক্সাম</span>
                                                        </span>
                                                    )}
                                                    {isClassUpload && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                                                            <Video className="w-3 h-3 text-sky-600" />
                                                            <span>ক্লাস আপলোড</span>
                                                        </span>
                                                    )}
                                                    {isMaterial && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                                                            <FileText className="w-3 h-3 text-teal-600" />
                                                            <span>স্টাডি ম্যাটেরিয়াল</span>
                                                        </span>
                                                    )}
                                                    {isBookParcel && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                                                            <Package className="w-3 h-3 text-orange-600" />
                                                            <span>বই / পার্সেল ডেলিভারি</span>
                                                        </span>
                                                    )}
                                                    {!isClass && !isExam && !isClassUpload && !isMaterial && !isBookParcel && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3 text-slate-600" />
                                                            <span>{item.type_label || 'সাধারণ সূচী'}</span>
                                                        </span>
                                                    )}

                                                    {/* Status Badge */}
                                                    {item.status === 'live' ? (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                                            <span>লাইভ চলছে</span>
                                                        </span>
                                                    ) : item.status === 'completed' || item.status === 'delivered' ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                                            {item.status === 'delivered' ? 'ডেলিভারি সম্পন্ন' : 'সম্পন্ন'}
                                                        </span>
                                                    ) : item.status === 'shipped' ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                                                            <Truck className="w-3 h-3" />
                                                            <span>কুরিয়ারে পাঠানো হয়েছে</span>
                                                        </span>
                                                    ) : item.status === 'published' ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                            প্রকাশিত
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700">
                                                            আসন্ন
                                                        </span>
                                                    )}

                                                    {item.subject && (
                                                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            {item.subject}
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                                    {item.title}
                                                </h4>

                                                {item.description && (
                                                    <p className="text-xs text-slate-500 line-clamp-1">
                                                        {item.description}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                                                    {isBookParcel && item.meta?.courier_name && (
                                                        <span className="flex items-center gap-1 text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded-md text-[11px]">
                                                            <Truck className="w-3.5 h-3.5" />
                                                            <span>কুরিয়ার: {item.meta.courier_name}</span>
                                                            {item.meta.tracking_code && <span>(ট্র্যাকিং: {item.meta.tracking_code})</span>}
                                                        </span>
                                                    )}
                                                    {isClass && item.live_url && (
                                                        <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                                                            <ExternalLink className="w-3 h-3" />
                                                            <span>ইউটিউব লাইভ লিংক সংযুক্ত</span>
                                                        </span>
                                                    )}
                                                    {isExam && matchingLiveExam && (
                                                        <span className="text-amber-700 font-medium text-[11px] flex items-center gap-1">
                                                            <Award className="w-3 h-3 text-amber-500" />
                                                            <span>পূর্ণমান: {matchingLiveExam.total_marks} | প্রশ্ন: {matchingLiveExam.questions_count ?? 0}</span>
                                                        </span>
                                                    )}
                                                    {item.link_url && (
                                                        <span className="text-sky-600 font-medium text-[11px] flex items-center gap-1 truncate max-w-[200px]">
                                                            <Paperclip className="w-3 h-3 shrink-0" />
                                                            <span className="truncate">{item.action_text || 'সংযুক্ত লিংক'}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto border-t md:border-t-0 pt-2 md:pt-0 w-full md:w-auto justify-end">
                                            {isClass && (
                                                <>
                                                    <Link
                                                        to={`/student/live-class/${item.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                        title="লাইভ ক্লাস ভিউ"
                                                    >
                                                        <Radio className="w-3.5 h-3.5 text-rose-600" />
                                                        <span>ক্লাস রুম</span>
                                                    </Link>

                                                    {matchingLiveClass && (
                                                        <button
                                                            onClick={() => openEditLiveClass(matchingLiveClass)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                            title="লাইভ ক্লাস সম্পাদনা"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDeleteLiveClass(item.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        title="লাইভ ক্লাস ডিলিট"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            {isExam && (
                                                <>
                                                    <Link
                                                        to={`${examBasePath}/${item.id}/builder`}
                                                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                        title="Question Builder"
                                                    >
                                                        <Edit className="w-3.5 h-3.5 text-amber-600" />
                                                        <span>Question Builder</span>
                                                    </Link>

                                                    <Link
                                                        to={`${examBasePath}/${item.id}/submissions`}
                                                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                        title="Submissions"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>ফলাফল ({matchingLiveExam?.submissions_count ?? 0})</span>
                                                    </Link>

                                                    {matchingLiveExam && (
                                                        <button
                                                            onClick={() => openEditExam(matchingLiveExam)}
                                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                            title="লাইভ এক্সাম সম্পাদনা"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDetachExam(item.id, item.title)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        title="কোর্স থেকে পরীক্ষা বাদ দিন"
                                                    >
                                                        <Unlink className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            {isCustom && (
                                                <>
                                                    {item.link_url && (
                                                        <a
                                                            href={item.link_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            <span>{item.action_text || 'লিংক দেখুন'}</span>
                                                        </a>
                                                    )}

                                                    <button
                                                        onClick={() => openEditRoutineItem(item)}
                                                        className="p-1.5 text-slate-400 hover:text-[#0B4B34] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                                        title="সূচী সম্পাদনা"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteRoutineItem(item.id, item.title)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        title="সূচী মুছে ফেলুন"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Custom Routine Item Modal (Class Upload, Materials, Book/Parcel Delivery, Notice) */}
            <Modal
                isOpen={routineModalOpen}
                onClose={() => setRoutineModalOpen(false)}
                title={editingRoutineItem ? 'রুটিন সূচী সম্পাদনা করুন' : 'নতুন রুটিন সূচী যুক্ত করুন'}
                maxWidth="lg"
            >
                <form onSubmit={handleSaveRoutineItem} className="space-y-4">
                    {/* Routine Type Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                            সূচীর ধরন নির্বাচন করুন <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => setRoutineItemType('class_upload')}
                                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                    routineItemType === 'class_upload'
                                        ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-400/20 shadow-xs'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Video className="w-5 h-5 text-sky-600" />
                                <span>ক্লাস আপলোড</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRoutineItemType('material')}
                                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                    routineItemType === 'material'
                                        ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-400/20 shadow-xs'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <FileText className="w-5 h-5 text-teal-600" />
                                <span>স্টাডি ম্যাটেরিয়াল</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRoutineItemType('book_parcel')}
                                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                    routineItemType === 'book_parcel'
                                        ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-400/20 shadow-xs'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Package className="w-5 h-5 text-orange-600" />
                                <span>বই / পার্সেল ডেলিভারি</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRoutineItemType('general')}
                                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                    routineItemType === 'general'
                                        ? 'border-emerald-500 bg-emerald-50 text-[#0B4B34] ring-2 ring-emerald-400/20 shadow-xs'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Calendar className="w-5 h-5 text-[#0B4B34]" />
                                <span>সাধারণ নোটিশ</span>
                            </button>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            শিরোনাম <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={routineItemTitle}
                            onChange={e => setRoutineItemTitle(e.target.value)}
                            placeholder={
                                routineItemType === 'class_upload'
                                    ? 'e.g. পদার্থবিজ্ঞান ১ম পত্র - গতিবিদ্যা লেকচার ০২ আপলোড'
                                    : routineItemType === 'material'
                                    ? 'e.g. রসায়ন ১ম অধ্যায়ের স্পেশাল শিট ও প্র্যাকটিস বুকলেট পিডিএফ'
                                    : routineItemType === 'book_parcel'
                                    ? 'e.g. পদার্থবিজ্ঞান প্রশ্নব্যাংক ও প্র্যাকটিস বুক কুরিয়ার ডেলিভারি'
                                    : 'e.g. বিশেষ সেশন / নোটিশ'
                            }
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Subject */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                বিষয় / টপিক (ঐচ্ছিক)
                            </label>
                            <input
                                type="text"
                                value={routineItemSubject}
                                onChange={e => setRoutineItemSubject(e.target.value)}
                                placeholder="e.g. পদার্থবিজ্ঞান, রসায়ন, বাংলা, বই ডেলিভারি"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                স্ট্যাটাস
                            </label>
                            <select
                                value={routineItemStatus}
                                onChange={e => setRoutineItemStatus(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            >
                                <option value="upcoming">আসন্ন (Upcoming)</option>
                                <option value="published">প্রকাশিত (Published / Uploaded)</option>
                                {routineItemType === 'book_parcel' && (
                                    <>
                                        <option value="shipped">কুরিয়ারে পাঠানো হয়েছে (Shipped)</option>
                                        <option value="delivered">ডেলিভারি সম্পন্ন (Delivered)</option>
                                    </>
                                )}
                                <option value="completed">সম্পন্ন (Completed)</option>
                            </select>
                        </div>
                    </div>

                    {/* Schedule Date & Times */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                তারিখ ও শুরুর সময় <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={routineItemStartTime}
                                onChange={e => setRoutineItemStartTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                শেষ সময় / প্রত্যাশিত ডেলিভারি (ঐচ্ছিক)
                            </label>
                            <input
                                type="datetime-local"
                                value={routineItemEndTime}
                                onChange={e => setRoutineItemEndTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            />
                        </div>
                    </div>

                    {/* Book / Parcel specific fields */}
                    {routineItemType === 'book_parcel' && (
                        <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-3">
                            <h4 className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-orange-600" />
                                <span>কুরিয়ার ও পার্সেল ট্র্যাকিং তথ্য</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        কুরিয়ার সার্ভিস
                                    </label>
                                    <input
                                        type="text"
                                        value={routineItemCourier}
                                        onChange={e => setRoutineItemCourier(e.target.value)}
                                        placeholder="e.g. Steadfast, Sundarban, RedX, Pathao"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        ট্র্যাকিং কোড বা চালান নম্বর
                                    </label>
                                    <input
                                        type="text"
                                        value={routineItemTracking}
                                        onChange={e => setRoutineItemTracking(e.target.value)}
                                        placeholder="e.g. TRK-982341 বা চালান #402"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Link & Action Button Text */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                লিংক / ফাইল / ট্র্যাকিং ইউআরএল (ঐচ্ছিক)
                            </label>
                            <input
                                type="url"
                                value={routineItemLinkUrl}
                                onChange={e => setRoutineItemLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                বাটন টেক্সট (ঐচ্ছিক)
                            </label>
                            <input
                                type="text"
                                value={routineItemActionText}
                                onChange={e => setRoutineItemActionText(e.target.value)}
                                placeholder={
                                    routineItemType === 'class_upload'
                                        ? 'e.g. ক্লাস দেখুন'
                                        : routineItemType === 'material'
                                        ? 'e.g. নোট ডাউনলোড'
                                        : routineItemType === 'book_parcel'
                                        ? 'e.g. পার্সেল ট্র্যাক'
                                        : 'e.g. বিস্তারিত দেখুন'
                                }
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            বিস্তারিত বিবরণ / শিক্ষার্থী বার্তা (ঐচ্ছিক)
                        </label>
                        <textarea
                            rows={3}
                            value={routineItemDesc}
                            onChange={e => setRoutineItemDesc(e.target.value)}
                            placeholder="শিক্ষার্থীদের জন্য কোনো বিশেষ নির্দেশনা, অধ্যায় বা পার্সেল পাওয়ার সময়সীমা..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setRoutineModalOpen(false)}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                        >
                            বাতিল
                        </button>
                        <button
                            type="submit"
                            disabled={savingRoutineItem}
                            className="px-5 py-2.5 bg-[#0B4B34] hover:bg-[#083827] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                        >
                            {savingRoutineItem ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>সংরক্ষণ হচ্ছে...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{editingRoutineItem ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Create / Edit Exam Modal */}
            <Modal
                isOpen={examModalOpen}
                onClose={() => setExamModalOpen(false)}
                title={editingExam ? 'পরীক্ষা সম্পাদনা করুন' : (examModalType === 'live' ? 'নতুন লাইভ এক্সাম তৈরি করুন' : 'নতুন প্র্যাকটিস এক্সাম তৈরি করুন')}
                maxWidth="lg"
            >
                <form onSubmit={handleSaveExam} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            পরীক্ষার নাম / শিরোনাম <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={examTitle}
                            onChange={e => setExamTitle(e.target.value)}
                            placeholder={examModalType === 'live' ? 'e.g. পদার্থবিজ্ঞান অধ্যায় ১ - লাইভ উইকলি টেস্ট' : 'e.g. রসায়ন ১ম পত্র মডেল টেস্ট - ০১'}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            বিবরণ ও নির্দেশনা (ঐচ্ছিক)
                        </label>
                        <textarea
                            rows={3}
                            value={examDesc}
                            onChange={e => setExamDesc(e.target.value)}
                            placeholder="পরীক্ষার নিয়মাবলী ও প্রয়োজনীয় নির্দেশনা..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Live Exam Times Window */}
                    {examModalType === 'live' && (
                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span>লাইভ পরীক্ষার সময়সূচি (শুরু ও শেষ) <span className="text-rose-500">*</span></span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        কখন শুরু হবে (Start Time)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={examStartTime}
                                        onChange={e => setExamStartTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        কখন শেষ হবে (End Time)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={examEndTime}
                                        onChange={e => setExamEndTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                                💡 <strong>স্বয়ংক্রিয় প্র্যাকটিস রূপান্তর:</strong> এই নির্ধারিত সময় শেষ হওয়ার সাথে সাথেই পরীক্ষাটি স্বয়ংক্রিয়ভাবে <strong>প্র্যাকটিস এক্সামে</strong> চলে যাবে এবং শিক্ষার্থীরা নিয়মিত অনুশীলনের জন্য পরীক্ষাটি দিতে পারবে।
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                পরীক্ষার সময়সীমা (মিনিট) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="1440"
                                required
                                value={examDuration}
                                onChange={e => setExamDuration(e.target.value)}
                                placeholder="30"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                পাস মার্ক (ঐচ্ছিক)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={examPassMarks}
                                onChange={e => setExamPassMarks(e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </div>

                    {/* Negative Marking */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                            <input
                                type="checkbox"
                                checked={examHasNegativeMarking}
                                onChange={e => setExamHasNegativeMarking(e.target.checked)}
                                className="rounded text-sky-600 focus:ring-sky-500"
                            />
                            <span>নেগেটিভ মার্কিং চালু করুন</span>
                        </label>
                        {examHasNegativeMarking && (
                            <div className="flex items-center gap-2 pl-6">
                                <span className="text-xs text-slate-500">ভুল উত্তরের জন্য কাটা মার্ক:</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.05"
                                    value={examNegativeMarks}
                                    onChange={e => setExamNegativeMarks(e.target.value)}
                                    placeholder="0.25"
                                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">স্ট্যাটাস</label>
                        <div className="flex items-center gap-4 text-xs font-medium">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="exam_status"
                                    value="published"
                                    checked={examStatus === 'published'}
                                    onChange={() => setExamStatus('published')}
                                    className="text-sky-600"
                                />
                                <span>Published (শিক্ষার্থীদের জন্য দৃশ্যমান)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="exam_status"
                                    value="draft"
                                    checked={examStatus === 'draft'}
                                    onChange={() => setExamStatus('draft')}
                                    className="text-sky-600"
                                />
                                <span>Draft (খসড়া)</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setExamModalOpen(false)}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                        >
                            বাতিল
                        </button>
                        <button
                            type="submit"
                            disabled={savingExam}
                            className={`px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                examModalType === 'live' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-600 hover:bg-sky-700'
                            }`}
                        >
                            {savingExam ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>সংরক্ষণ হচ্ছে...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{editingExam ? 'আপডেট করুন' : 'তৈরি করুন'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Enhanced Attach Exam Modal */}
            <Modal
                isOpen={attachModalOpen}
                onClose={() => setAttachModalOpen(false)}
                title={attachExamType === 'live' ? 'কোর্সে লাইভ এক্সাম হিসেবে যুক্ত করুন' : 'কোর্সে প্র্যাকটিস এক্সাম হিসেবে যুক্ত করুন'}
                maxWidth="lg"
            >
                <div className="space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setAttachExamType('practice')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                attachExamType === 'practice'
                                    ? 'bg-white text-sky-700 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            📝 প্র্যাকটিস এক্সাম হিসেবে
                        </button>
                        <button
                            type="button"
                            onClick={() => setAttachExamType('live')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                attachExamType === 'live'
                                    ? 'bg-white text-amber-800 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            ⏰ লাইভ এক্সাম হিসেবে
                        </button>
                    </div>

                    {attachExamType === 'live' && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 space-y-2.5">
                            <p className="text-xs font-bold text-amber-900 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>লাইভ পরীক্ষার নির্ধারিত সময়সীমা (শুরু ও শেষ) দিন</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">শুরুর সময়</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={attachStartTime}
                                        onChange={e => setAttachStartTime(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">শেষের সময়</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={attachEndTime}
                                        onChange={e => setAttachEndTime(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-amber-700">
                                💡 সময় শেষ হলে এই পরীক্ষাটি স্বয়ংক্রিয়ভাবে প্র্যাকটিস এক্সামে রূপান্তর হয়ে যাবে।
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-slate-500">
                        নিচের তালিকা থেকে একটি পরীক্ষা নির্বাচন করুন:
                    </p>

                    {availableExams.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-xs text-slate-600 font-medium">
                                কোনো উন্মুক্ত পরীক্ষা পাওয়া যায়নি।
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setAttachModalOpen(false);
                                    openAddExam(attachExamType);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>নতুন পরীক্ষা তৈরি করুন</span>
                            </button>
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
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedExamId || attaching}
                                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
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
