import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Lesson, CourseSection, LessonAttachment, LessonComment } from '../../types';
import { 
    PlayCircle, 
    CheckCircle2, 
    Circle, 
    Download, 
    ChevronLeft, 
    ChevronRight, 
    Menu, 
    X, 
    BookOpen, 
    Paperclip, 
    MessageSquare, 
    Send, 
    Sparkles, 
    ArrowLeft,
    Check,
    ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { PlyrVideoPlayer } from '../../components/shared/PlyrVideoPlayer';

export const LessonPlayerPage: React.FC = () => {
    const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language } = useLanguage();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [sections, setSections] = useState<CourseSection[]>([]);
    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [comments, setComments] = useState<LessonComment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState<Record<number, string>>({});
    const [activeReplyId, setActiveReplyId] = useState<number | null>(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [togglingProgress, setTogglingProgress] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        fetchLessonData();
        fetchComments();
    }, [courseId, lessonId]);

    const fetchLessonData = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/learning/${courseId}/lessons/${lessonId}`);
            setLesson(data.lesson);
            setSections(data.sections || []);
            setCompletedLessonIds(data.completed_lesson_ids || []);
            setIsCompleted(data.is_completed || false);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to access lesson.');
            navigate(`/courses`);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const { data } = await apiClient.get(`/learning/lessons/${lessonId}/comments`);
            setComments(data || []);
        } catch {}
    };

    const handleToggleComplete = async () => {
        if (!lesson) return;
        setTogglingProgress(true);
        try {
            const { data } = await apiClient.post(`/learning/lessons/${lesson.id}/progress`);
            setIsCompleted(data.is_completed);
            if (data.is_completed) {
                setCompletedLessonIds(prev => [...prev, lesson.id]);
            } else {
                setCompletedLessonIds(prev => prev.filter(id => id !== lesson.id));
            }
        } catch {}
        finally {
            setTogglingProgress(false);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !lesson) return;

        setSubmittingComment(true);
        try {
            const { data } = await apiClient.post(`/learning/lessons/${lesson.id}/comments`, {
                content: commentText,
            });
            setComments(prev => [data.comment, ...prev]);
            setCommentText('');
            alert('Your question has been posted. A notification was sent to the course instructor.');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to submit comment.');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handlePostReply = async (commentId: number) => {
        const text = replyText[commentId];
        if (!text || !text.trim()) return;

        try {
            const { data } = await apiClient.post(`/learning/comments/${commentId}/reply`, {
                content: text,
            });
            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        replies: [...(c.replies || []), data.reply],
                    };
                }
                return c;
            }));
            setReplyText(prev => ({ ...prev, [commentId]: '' }));
            setActiveReplyId(null);
        } catch {}
    };

    // Calculate Previous & Next lesson navigation
    const allLessons = sections.flatMap(s => s.lessons || []);
    const currentIndex = allLessons.findIndex(l => String(l.id) === String(lessonId));
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    if (loading || !lesson) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="flex items-center gap-3">
                    <PlayCircle className="w-8 h-8 text-sky-400 animate-spin" />
                    <span className="text-sm font-bold">Loading lesson...</span>
                </div>
            </div>
        );
    }

    // Video Embed helper
    const getEmbedUrl = (url?: string | null) => {
        if (!url) return null;
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        }
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
        }
        return url;
    };

    const embedUrl = getEmbedUrl(lesson.video_url);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            {/* Top Learning Header */}
            <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-3 truncate mr-4">
                    <Link
                        to="/student/my-courses"
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                        title="Back to Course List"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="truncate">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                            {lesson.section?.title || 'Classroom'}
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-white truncate">
                            {lesson.title}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Mark as Complete Button */}
                    <button
                        onClick={handleToggleComplete}
                        disabled={togglingProgress}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                            isCompleted
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        {isCompleted ? <Check className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                        <span className="hidden sm:inline">
                            {isCompleted ? 'Completed' : 'Mark as Complete'}
                        </span>
                    </button>

                    {/* Sidebar Toggle for Mobile & Desktop */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                        title="Syllabus & Lesson List"
                    >
                        <BookOpen className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Player Area + Sidebar */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Center Content Scroll Area */}
                <div className="flex-1 overflow-y-auto">
                    {/* Video Player Box */}
                    {/* Video Player Box with Plyr.js */}
                    <div className="w-full bg-black aspect-video max-h-[65vh] flex items-center justify-center relative">
                        {lesson.video_url ? (
                            <PlyrVideoPlayer
                                url={lesson.video_url}
                                title={lesson.title}
                                onEnded={handleToggleComplete}
                                className="w-full h-full"
                            />
                        ) : (
                            <div className="text-center p-8 text-slate-500 space-y-2">
                                <PlayCircle className="w-12 h-12 mx-auto text-slate-600" />
                                <p className="text-xs">
                                    No video is attached to this lesson. Please read the notes below.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Navigation Bar (Prev / Next) */}
                    <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
                        <div>
                            {prevLesson ? (
                                <button
                                    onClick={() => navigate(`/learning/${courseId}/lessons/${prevLesson.id}`)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Previous Lesson:</span>
                                    <span className="max-w-[120px] truncate">{prevLesson.title}</span>
                                </button>
                            ) : <div />}
                        </div>

                        <div>
                            {nextLesson ? (
                                <button
                                    onClick={() => navigate(`/learning/${courseId}/lessons/${nextLesson.id}`)}
                                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                                >
                                    <span className="hidden sm:inline">Next Lesson:</span>
                                    <span className="max-w-[120px] truncate">{nextLesson.title}</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                    <Sparkles className="w-4 h-4" />
                                    Last lesson of the course!
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Lesson Notes & Discussion Container */}
                    <div className="max-w-4xl mx-auto p-6 sm:p-10 space-y-12">
                        {/* Title & Notes */}
                        <div className="space-y-4">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                {lesson.title}
                            </h1>
                            {lesson.content && (
                                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                    {lesson.content}
                                </div>
                            )}
                        </div>

                        {/* Downloadable Materials Section */}
                        {lesson.attachments && lesson.attachments.length > 0 && (
                            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Paperclip className="w-4 h-4 text-sky-400" />
                                    <span>স্টাডি ম্যাটেরিয়াল ও রিসোর্স ({lesson.attachments.length})</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {lesson.attachments.map((att) => {
                                        const isLink = att.file_path?.startsWith('http') || att.file_type === 'link' || att.file_type === 'google_drive';
                                        const isDrive = att.file_type === 'google_drive' || att.file_path?.includes('drive.google.com') || att.file_path?.includes('docs.google.com');

                                        return (
                                            <a
                                                key={att.id}
                                                href={`/api/learning/attachments/${att.id}/download`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between transition-colors group"
                                            >
                                                <div className="truncate mr-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="text-xs font-bold text-white truncate group-hover:text-sky-400">
                                                            {att.file_name}
                                                        </h4>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                                        {isDrive ? (
                                                            <span className="text-amber-400 font-semibold">Google Drive লিংক</span>
                                                        ) : isLink ? (
                                                            <span className="text-sky-400 font-semibold">ওয়েব লিংক</span>
                                                        ) : (
                                                            <span>{att.file_type.toUpperCase()} • {att.formatted_size || `${Math.round(att.file_size / 1024)} KB`}</span>
                                                        )}
                                                    </span>
                                                </div>
                                                {isLink ? (
                                                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-400 shrink-0" />
                                                ) : (
                                                    <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-400 shrink-0" />
                                                )}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Threaded Discussion Section */}
                        <div className="space-y-6 pt-6 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-sky-400" />
                                    <span>Q&A & Discussion Forum ({comments.length})</span>
                                </h3>
                            </div>

                            {/* Comment Form */}
                            <form onSubmit={handlePostComment} className="space-y-3">
                                <textarea
                                    rows={3}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Type your question or doubt about this lesson..."
                                    className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submittingComment || !commentText.trim()}
                                        className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>{submittingComment ? 'Posting...' : 'Post Question'}</span>
                                    </button>
                                </div>
                            </form>

                            {/* Comments Thread */}
                            <div className="space-y-4">
                                {comments.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-6">
                                        No questions asked yet. Be the first to ask a question!
                                    </p>
                                ) : (
                                    comments.map((comment) => (
                                        <div
                                            key={comment.id}
                                            className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                                                        {comment.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-white">{comment.user.name}</h4>
                                                        <span className="text-[10px] text-slate-500 capitalize">
                                                            {comment.user.role === 'student' ? 'Student' : 'Instructor'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-500">
                                                    {new Date(comment.created_at).toLocaleDateString('en-US')}
                                                </span>
                                            </div>

                                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-10">
                                                {comment.content}
                                            </p>

                                            {/* Nested Replies */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="pl-10 space-y-2 pt-2 border-t border-slate-800/50">
                                                    {comment.replies.map((reply) => (
                                                        <div
                                                            key={reply.id}
                                                            className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs space-y-1"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-sky-400">{reply.user.name}</span>
                                                                    <span className="text-[9px] bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.2 rounded font-semibold">
                                                                        {reply.user.role === 'teacher' ? 'Instructor' : 'Reply'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[9px] text-slate-500">
                                                                    {new Date(reply.created_at).toLocaleDateString('en-US')}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-300 pl-1">{reply.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reply Action */}
                                            <div className="pl-10 pt-1">
                                                {activeReplyId === comment.id ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={replyText[comment.id] || ''}
                                                            onChange={(e) => setReplyText(prev => ({ ...prev, [commentId(comment.id)]: e.target.value }))}
                                                            placeholder="Type your reply..."
                                                            className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                                                        />
                                                        <button
                                                            onClick={() => handlePostReply(comment.id)}
                                                            className="px-4 py-1.5 bg-sky-600 text-white font-bold text-xs rounded-xl"
                                                        >
                                                            Send
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveReplyId(null)}
                                                            className="px-3 py-1.5 text-slate-400 text-xs"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setActiveReplyId(comment.id)}
                                                        className="text-[11px] font-bold text-sky-400 hover:text-sky-300"
                                                    >
                                                        Reply
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Backdrop Overlay: Closes drawer when clicked outside */}
                {sidebarOpen && (
                    <div 
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
                        aria-hidden="true"
                    />
                )}

                {/* Right / Collapsible Curriculum Sidebar - Slides in OVER video on mobile */}
                <aside className={`
                    fixed inset-y-0 right-0 z-50 w-80 sm:w-96 max-w-[85vw] bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl
                    transition-transform duration-300 ease-in-out
                    lg:static lg:z-auto lg:w-80 xl:w-96 lg:shadow-none lg:flex shrink-0
                    ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                `}>
                    <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-sky-400" />
                            <span>Curriculum</span>
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">
                                {completedLessonIds.length} / {allLessons.length} Done
                            </span>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors lg:hidden"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
                        {sections.map((section, sIndex) => (
                            <div key={section.id} className="p-3">
                                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Section {sIndex + 1}: {section.title}
                                </div>
                                <div className="space-y-1">
                                    {section.lessons?.map((l) => {
                                        const isCurrent = String(l.id) === String(lessonId);
                                        const isDone = completedLessonIds.includes(l.id);
                                        return (
                                            <Link
                                                key={l.id}
                                                to={`/learning/${courseId}/lessons/${l.id}`}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-colors ${
                                                    isCurrent
                                                        ? 'bg-sky-600 text-white font-bold shadow-xs'
                                                        : 'text-slate-300 hover:bg-slate-800/70'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 truncate mr-2">
                                                    {isDone ? (
                                                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-emerald-400'}`} />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                                                    )}
                                                    <span className="truncate">{l.title}</span>
                                                </div>
                                                <span className={`text-[10px] shrink-0 ${isCurrent ? 'text-sky-100' : 'text-slate-500'}`}>
                                                    {l.duration_minutes}m
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
};

function commentId(id: number): number {
    return id;
}
