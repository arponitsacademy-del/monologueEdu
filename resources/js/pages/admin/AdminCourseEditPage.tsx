import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Category, User } from '../../types';
import { MediaPickerModal } from '../../components/shared/MediaPickerModal';
import { 
    ArrowLeft, 
    Save, 
    Layers, 
    AlertCircle, 
    CheckCircle2, 
    BookOpen,
    UploadCloud,
    Image as ImageIcon,
    Trash2,
    Loader2,
    ExternalLink,
    CreditCard,
    Zap
} from 'lucide-react';

export const AdminCourseEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('0');
    const [salePrice, setSalePrice] = useState('');
    const [enableManualPayment, setEnableManualPayment] = useState(true);
    const [enableShurjopay, setEnableShurjopay] = useState(true);
    const [thumbnail, setThumbnail] = useState('');
    const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);

    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [allTeachers, setAllTeachers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedCourseId, setSavedCourseId] = useState<number | null>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [uploadingThumb, setUploadingThumb] = useState(false);
    const thumbFileInputRef = useRef<HTMLInputElement>(null);

    const handleThumbDirectUpload = async (file: File) => {
        setUploadingThumb(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await apiClient.post('/admin/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data && res.data.media) {
                setThumbnail(res.data.media.url);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to upload thumbnail.');
        } finally {
            setUploadingThumb(false);
            if (thumbFileInputRef.current) thumbFileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        fetchMetadata();
        if (isEdit) {
            fetchCourse();
        }
    }, [id]);

    const fetchMetadata = async () => {
        try {
            const [catsRes, teachersRes] = await Promise.all([
                apiClient.get('/admin/categories').catch(() => apiClient.get('/categories')),
                apiClient.get('/admin/teachers-list'),
            ]);
            setAllCategories(catsRes.data || []);
            setAllTeachers(teachersRes.data || []);
        } catch {}
    };

    const fetchCourse = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/admin/courses/${id}`);
            const c = data.course;
            setTitle(c.title);
            setSlug(c.slug);
            setShortDescription(c.short_description || '');
            setDescription(c.description || '');
            setPrice(String(c.price));
            setSalePrice(c.sale_price ? String(c.sale_price) : '');
            setEnableManualPayment(c.enable_manual_payment !== false);
            setEnableShurjopay(c.enable_shurjopay !== false);
            setThumbnail(c.thumbnail || '');
            setStatus(c.status);
            setSelectedCategoryIds(c.categories?.map((cat: any) => cat.id) || []);
            setSelectedTeacherIds(c.instructors?.map((t: any) => t.id) || []);
            setSavedCourseId(c.id);
        } catch {
            navigate('/admin/courses');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const numPrice = parseFloat(price) || 0;
        const numSale = salePrice ? parseFloat(salePrice) : null;

        if (numSale !== null && numSale > numPrice) {
            setError('Sale Price must be less than or equal to Regular Price.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title,
                slug,
                short_description: shortDescription,
                description,
                price: numPrice,
                sale_price: numSale,
                enable_manual_payment: enableManualPayment,
                enable_shurjopay: enableShurjopay,
                thumbnail,
                status,
                category_ids: selectedCategoryIds,
                instructor_ids: selectedTeacherIds,
            };

            let targetId = savedCourseId;
            if (isEdit) {
                await apiClient.put(`/admin/courses/${id}`, payload);
            } else {
                const { data } = await apiClient.post('/admin/courses', payload);
                targetId = data.course.id;
                setSavedCourseId(targetId);
            }

            alert('Course saved successfully!');
            if (!isEdit && targetId) {
                navigate(`/admin/courses/${targetId}/builder`);
            } else {
                navigate('/admin/courses');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save course.');
        } finally {
            setSaving(false);
        }
    };

    const toggleTeacher = (teacherId: number) => {
        setSelectedTeacherIds(prev => 
            prev.includes(teacherId) ? prev.filter(t => t !== teacherId) : [...prev, teacherId]
        );
    };

    const toggleCategory = (catId: number) => {
        setSelectedCategoryIds(prev => 
            prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
        );
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400">Loading details...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
            <div className="flex items-center justify-between">
                <Link
                    to="/admin/courses"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Courses List</span>
                </Link>

                {savedCourseId && (
                    <Link
                        to={`/admin/courses/${savedCourseId}/builder`}
                        className="px-4 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-sky-200"
                    >
                        <Layers className="w-4 h-4" />
                        <span>Open Visual Curriculum Builder</span>
                    </Link>
                )}
            </div>

            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs space-y-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {isEdit ? 'Edit Course Details' : 'Create New Course'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Configure basic information, pricing, categories, and assign instructors
                    </p>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Course Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. HSC Physics 1st Paper Complete Course"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Course Slug (URL)
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="e.g. hsc-physics-1st-paper"
                            className="w-full px-4 py-3 font-mono bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                    </div>

                    {/* Short Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Short Description
                        </label>
                        <input
                            type="text"
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            placeholder="Brief one or two line description for cards"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Full Description
                        </label>
                        <textarea
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter detailed course information..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                    </div>

                    {/* Thumbnail URL with Direct Upload & Media Library */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                                Course Thumbnail
                            </label>
                            <span className="text-[11px] text-slate-400">Choose a 16:9 ratio image</span>
                        </div>

                        {/* Hidden input for direct upload */}
                        <input
                            ref={thumbFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleThumbDirectUpload(e.target.files[0]);
                                }
                            }}
                        />

                        {/* Action buttons: Direct upload and Media Library browse */}
                        <div className="flex flex-wrap gap-2.5">
                            <button
                                type="button"
                                disabled={uploadingThumb}
                                onClick={() => thumbFileInputRef.current?.click()}
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-semibold border border-sky-200 transition disabled:opacity-50"
                            >
                                {uploadingThumb ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                                        <span>Uploading image...</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-4 h-4 text-sky-600" />
                                        <span>Upload from device</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsMediaModalOpen(true)}
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold border border-slate-200 transition"
                            >
                                <ImageIcon className="w-4 h-4 text-slate-600" />
                                <span>Browse Media Library</span>
                            </button>
                        </div>

                        {/* Manual URL input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={thumbnail}
                                onChange={(e) => setThumbnail(e.target.value)}
                                placeholder="Or paste direct image URL (e.g. https://...)"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                            {thumbnail && (
                                <button
                                    type="button"
                                    onClick={() => setThumbnail('')}
                                    className="absolute right-2.5 top-2.5 text-xs text-rose-500 hover:text-rose-700 font-semibold px-1.5 py-0.5 rounded bg-rose-50"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        {/* Live Image Preview */}
                        {thumbnail && (
                            <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2 max-w-sm overflow-hidden group">
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-200 relative">
                                    <img
                                        src={thumbnail}
                                        alt="Thumbnail Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (!target.dataset.fallback && thumbnail.includes('/storage/')) {
                                                target.dataset.fallback = 'true';
                                                const path = thumbnail.substring(thumbnail.indexOf('/storage/'));
                                                target.src = path;
                                                return;
                                            }
                                            target.style.display = 'none';
                                        }}
                                    />
                                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                        <a
                                            href={thumbnail}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 bg-white/90 hover:bg-white rounded-lg text-slate-700 shadow-sm transition"
                                            title="Open in new tab"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setThumbnail('')}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-600 shadow-sm transition"
                                            title="Delete thumbnail"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1.5 text-center truncate px-2 font-mono">
                                    {thumbnail}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Regular Price (৳) - Enter 0 for Free
                            </label>
                            <input
                                type="number"
                                min={0}
                                required
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Sale Price (৳) - Optional
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={salePrice}
                                onChange={(e) => setSalePrice(e.target.value)}
                                placeholder="Discounted price (must be less than regular price)"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Course Payment Gateways Toggles */}
                    <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-sky-600" />
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    কোর্সের পেমেন্ট পদ্ধতি (Course Payment Methods)
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                                এই কোর্সে কোন মাধ্যমে পেমেন্ট গ্রহণ করবেন তা নির্ধারণ করুন
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Manual Payment Toggle */}
                            <div className={`p-4 rounded-xl border transition-all ${
                                enableManualPayment 
                                    ? 'bg-white border-pink-200 shadow-2xs' 
                                    : 'bg-slate-100/70 border-slate-200 opacity-60'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-black text-xs">
                                            ৳
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-slate-800">
                                                ম্যানুয়াল পেমেন্ট (Manual Payment)
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                বিকাশ, নগদ, রকেট সেন্ড মানি (TrxID)
                                            </span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableManualPayment}
                                            onChange={(e) => setEnableManualPayment(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-pink-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* shurjoPay Online Payment Toggle */}
                            <div className={`p-4 rounded-xl border transition-all ${
                                enableShurjopay 
                                    ? 'bg-white border-sky-200 shadow-2xs' 
                                    : 'bg-slate-100/70 border-slate-200 opacity-60'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-slate-800">
                                                shurjoPay অনলাইন পেমেন্ট
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                স্বয়ংক্রিয় অনলাইন পেমেন্ট গেটওয়ে
                                            </span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableShurjopay}
                                            onChange={(e) => setEnableShurjopay(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-sky-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {!enableManualPayment && !enableShurjopay && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                <span>সতর্কতা: দুটি মেথডই বন্ধ থাকলে স্টুডেন্টরা চেকআউট পেজে কোনো পেমেন্ট অপশন পাবে না (ফ্রি কোর্স ছাড়া)।</span>
                            </div>
                        )}
                    </div>

                    {/* Multi-Teacher Assignment */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                            Assign Instructors (Select one or more teachers) *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                            {allTeachers.map((teacher) => {
                                const isSelected = selectedTeacherIds.includes(teacher.id);
                                return (
                                    <div
                                        key={teacher.id}
                                        onClick={() => toggleTeacher(teacher.id)}
                                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                            isSelected 
                                                ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold' 
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="text-xs truncate mr-2">
                                            <div>{teacher.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{teacher.phone}</div>
                                        </div>
                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                                Select Course Categories (Select one or more categories)
                            </label>
                            <Link 
                                to="/admin/courses/categories" 
                                target="_blank"
                                className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                            >
                                + Create New Category
                            </Link>
                        </div>
                        {allCategories.length === 0 ? (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                                No categories found. Please create categories from the{' '}
                                <Link to="/admin/courses/categories" className="text-sky-600 font-bold underline">
                                    Course Categories
                                </Link>{' '}
                                page.
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                {allCategories.map((cat) => {
                                    const isSelected = selectedCategoryIds.includes(cat.id);
                                    return (
                                        <button
                                            type="button"
                                            key={cat.id}
                                            onClick={() => toggleCategory(cat.id)}
                                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-600/30'
                                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            <span>{cat.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <p className="text-[11px] text-slate-400">
                            Courses on the homepage will be filtered by selected categories.
                        </p>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Publication Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="draft">Draft (Hidden from website)</option>
                            <option value="published">Published (Visible to public on website)</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <Link
                            to="/admin/courses"
                            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{saving ? 'Saving...' : 'Save Course'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Media Picker Modal */}
            <MediaPickerModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={(url) => setThumbnail(url)}
                filterType="image"
                title="Select Thumbnail for Course"
            />
        </div>
    );
};
