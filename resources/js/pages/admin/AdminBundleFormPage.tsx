import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { Course, CourseBundle } from '../../types';
import { 
    Boxes, 
    ArrowLeft, 
    Save, 
    Loader2, 
    Check, 
    BookOpen, 
    Search, 
    DollarSign, 
    Percent, 
    Image as ImageIcon,
    Sparkles
} from 'lucide-react';
import { MediaPickerModal } from '../../components/shared/MediaPickerModal';

export const AdminBundleFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [courseSearch, setCourseSearch] = useState('');
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

    // Form fields
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [regularPrice, setRegularPrice] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [status, setStatus] = useState<'published' | 'draft'>('published');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);

    useEffect(() => {
        fetchCourses();
        if (isEdit && id) {
            fetchBundle(Number(id));
        }
    }, [id]);

    const fetchCourses = async () => {
        try {
            const { data } = await apiClient.get('/admin/courses', { params: { per_page: 100 } });
            setAllCourses(data.data || []);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        }
    };

    const fetchBundle = async (bundleId: number) => {
        try {
            setLoading(true);
            const { data } = await apiClient.get(`/admin/bundles/${bundleId}`);
            setTitle(data.title || '');
            setSlug(data.slug || '');
            setThumbnail(data.thumbnail || '');
            setRegularPrice(String(data.regular_price || '0'));
            setSalePrice(String(data.sale_price || '0'));
            setStatus(data.status || 'published');
            setShortDescription(data.short_description || '');
            setDescription(data.description || '');
            setSelectedCourseIds((data.courses || []).map((c: any) => c.id));
        } catch (err) {
            console.error('Failed to load bundle details:', err);
            alert('Failed to load bundle details.');
            navigate('/admin/bundles');
        } finally {
            setLoading(false);
        }
    };

    const handleTitleChange = (val: string) => {
        setTitle(val);
        if (!isEdit && !slug) {
            setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
        }
    };

    const toggleCourse = (courseId: number) => {
        setSelectedCourseIds(prev => 
            prev.includes(courseId) ? prev.filter(c => c !== courseId) : [...prev, courseId]
        );
    };

    // Calculate sum of individual course prices
    const selectedCoursesSum = allCourses
        .filter(c => selectedCourseIds.includes(c.id))
        .reduce((sum, c) => sum + (Number(c.price) || 0), 0);

    const autoFillRegularPrice = () => {
        setRegularPrice(String(selectedCoursesSum));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Please enter a bundle title.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title,
                slug: slug || undefined,
                thumbnail: thumbnail || null,
                regular_price: Number(regularPrice) || 0,
                sale_price: Number(salePrice) || 0,
                status,
                short_description: shortDescription,
                description,
                course_ids: selectedCourseIds,
            };

            if (isEdit && id) {
                await apiClient.put(`/admin/bundles/${id}`, payload);
            } else {
                await apiClient.post('/admin/bundles', payload);
            }

            navigate('/admin/bundles');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save course bundle.');
        } finally {
            setSaving(false);
        }
    };

    const filteredCourses = allCourses.filter(c => 
        c.title.toLowerCase().includes(courseSearch.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                <span className="text-sm font-semibold">Loading bundle details...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/bundles"
                        className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Boxes className="w-6 h-6 text-sky-600" />
                            <span>{isEdit ? 'Edit Course Bundle' : 'Create New Course Bundle'}</span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Configure bundle metadata, course selection, and package sale price.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                        Bundle Information
                    </h3>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Bundle Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="e.g., HSC Science Super Combo (Physics + Chemistry + Math)"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Slug (URL identifier)</label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="hsc-science-super-combo"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Publish Status *</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="published">Published (Visible to students)</option>
                                <option value="draft">Draft (Hidden)</option>
                            </select>
                        </div>
                    </div>

                    {/* Thumbnail */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Bundle Thumbnail Image</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={thumbnail}
                                onChange={(e) => setThumbnail(e.target.value)}
                                placeholder="https://... or select from media library"
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setMediaPickerOpen(true)}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Choose Media</span>
                            </button>
                        </div>

                        {thumbnail && (
                            <div className="mt-3 relative w-48 aspect-video rounded-xl overflow-hidden border border-slate-200">
                                <img src={thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Short Description</label>
                        <textarea
                            rows={2}
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            placeholder="Brief catchy summary of this package bundle..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Detailed Description</label>
                        <textarea
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Full details of what is included in this bundle..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                </div>

                {/* Pricing Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                            Pricing & Discounts
                        </h3>
                        {selectedCoursesSum > 0 && (
                            <button
                                type="button"
                                onClick={autoFillRegularPrice}
                                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Auto-fill Regular Price ({formatBDT(selectedCoursesSum)})</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Regular Price (৳ BDT) *</label>
                            <input
                                type="number"
                                min={0}
                                step="any"
                                value={regularPrice}
                                onChange={(e) => setRegularPrice(e.target.value)}
                                placeholder="Combined original value"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-sky-500"
                                required
                            />
                            <span className="text-[11px] text-slate-400 mt-1 block">
                                Combined individual price of courses: {formatBDT(selectedCoursesSum)}
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Bundle Sale Price (৳ BDT) *</label>
                            <input
                                type="number"
                                min={0}
                                step="any"
                                value={salePrice}
                                onChange={(e) => setSalePrice(e.target.value)}
                                placeholder="Discounted bundle price"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-sky-500"
                                required
                            />
                            {Number(regularPrice) > Number(salePrice) && Number(regularPrice) > 0 && (
                                <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                                    Students save {Math.round(((Number(regularPrice) - Number(salePrice)) / Number(regularPrice)) * 100)}% on this bundle!
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Included Courses Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Select Included Courses ({selectedCourseIds.length} Selected)
                            </h3>
                            <p className="text-xs text-slate-500">
                                Choose which courses students will receive when purchasing this bundle.
                            </p>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={courseSearch}
                                onChange={(e) => setCourseSearch(e.target.value)}
                                placeholder="Search courses..."
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                        {filteredCourses.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs">
                                No courses found.
                            </div>
                        ) : (
                            filteredCourses.map(course => {
                                const isSelected = selectedCourseIds.includes(course.id);
                                return (
                                    <label
                                        key={course.id}
                                        className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition ${
                                            isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleCourse(course.id)}
                                                className="w-4 h-4 text-sky-600 rounded border-slate-300"
                                            />
                                            {course.thumbnail && (
                                                <img src={course.thumbnail} alt={course.title} className="w-10 h-10 rounded-lg object-cover" />
                                            )}
                                            <div>
                                                <span className="block text-xs font-bold text-slate-900">
                                                    {course.title}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    Regular: {formatBDT(course.price)}
                                                </span>
                                            </div>
                                        </div>

                                        <span className="text-xs font-mono font-bold text-slate-700">
                                            {formatBDT(course.price)}
                                        </span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link
                        to="/admin/bundles"
                        className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : isEdit ? 'Update Bundle' : 'Create Bundle'}</span>
                    </button>
                </div>
            </form>

            {/* Media Picker Modal */}
            <MediaPickerModal
                isOpen={mediaPickerOpen}
                onClose={() => setMediaPickerOpen(false)}
                onSelect={(media) => {
                    setThumbnail(media.url);
                    setMediaPickerOpen(false);
                }}
            />
        </div>
    );
};
