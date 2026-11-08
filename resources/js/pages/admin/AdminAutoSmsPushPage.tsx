import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import { CoursePurchaseSmsSetting, CourseSmsTemplate } from '../../types';
import { 
    MessageSquare, 
    Send, 
    Save, 
    Trash2, 
    Edit3, 
    CheckCircle2, 
    AlertCircle, 
    Smartphone, 
    Layers, 
    Sparkles, 
    RefreshCw,
    BookOpen,
    ChevronDown,
    Search,
    X,
    Check,
    Package
} from 'lucide-react';

interface CourseOption {
    id: number;
    title: string;
    price: number;
}

interface BundleOption {
    id: number;
    title: string;
    sale_price: number | string;
    regular_price?: number | string;
    courses_count?: number;
}

const AVAILABLE_TAGS = [
    { tag: '{student_name}', label: 'Student Name', desc: 'Full name of the student' },
    { tag: '{course_title}', label: 'Course Title', desc: 'Title of the enrolled course' },
    { tag: '{bundle_title}', label: 'Bundle Title', desc: 'Title of the enrolled course bundle' },
    { tag: '{order_id}', label: 'Order ID', desc: 'Unique order identifier' },
    { tag: '{amount}', label: 'Amount Paid', desc: 'Final amount paid in BDT' },
    { tag: '{site_name}', label: 'Site Name', desc: 'Monologue Edu' },
    { tag: '{login_url}', label: 'Login URL', desc: 'Direct portal login link' },
];

/**
 * Searchable course combobox selector with multi-word search filter.
 */
const SearchableCourseSelect: React.FC<{
    courses: CourseOption[];
    selectedId: number | '';
    onSelect: (id: number | '') => void;
    placeholder?: string;
}> = ({ courses, selectedId, onSelect, placeholder = '-- Choose a Course --' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedCourse = courses.find(c => c.id === selectedId);

    // Multi-word filtering (e.g. typing "hsc phy" matches "HSC 2026 Physics")
    const filtered = courses.filter(c => {
        if (!searchQuery.trim()) return true;
        const tokens = searchQuery.toLowerCase().trim().split(/\s+/);
        const titleLower = c.title.toLowerCase();
        return tokens.every(token => titleLower.includes(token));
    });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setTimeout(() => searchInputRef.current?.focus(), 60);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={dropdownRef} className="relative w-full">
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition shadow-2xs ${
                    isOpen ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200 hover:border-slate-300'
                }`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                    {selectedCourse ? (
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-slate-900 truncate">
                                {selectedCourse.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-sky-50 text-sky-700 shrink-0">
                                ৳{selectedCourse.price}
                            </span>
                        </div>
                    ) : (
                        <span className="text-slate-400 font-medium">
                            {placeholder} ({courses.length} courses available)
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {selectedCourse && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect('');
                            }}
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition"
                            title="Clear selection"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {/* Live Search Input Box */}
                    <div className="p-2.5 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Type to search (e.g. Physics, Math, HSC)..."
                                className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        {searchQuery && (
                            <span className="text-[10px] text-slate-400 block px-1 pt-1.5 font-medium">
                                Found {filtered.length} matching course{filtered.length === 1 ? '' : 's'}
                            </span>
                        )}
                    </div>

                    {/* Scrollable Course List */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
                        {filtered.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs">
                                No courses found matching "{searchQuery}"
                            </div>
                        ) : (
                            filtered.map((course) => {
                                const isSelected = course.id === selectedId;
                                return (
                                    <div
                                        key={course.id}
                                        onClick={() => {
                                            onSelect(course.id);
                                            setIsOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition ${
                                            isSelected ? 'bg-sky-50 text-sky-950 font-bold' : 'hover:bg-slate-50 text-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xs truncate">{course.title}</span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] font-mono font-bold text-slate-500">
                                                ৳{course.price}
                                            </span>
                                            {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Searchable bundle combobox selector with multi-word search filter.
 */
const SearchableBundleSelect: React.FC<{
    bundles: BundleOption[];
    selectedId: number | '';
    onSelect: (id: number | '') => void;
    placeholder?: string;
}> = ({ bundles, selectedId, onSelect, placeholder = '-- Choose a Course Bundle --' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedBundle = bundles.find(b => b.id === selectedId);

    // Multi-word filtering (e.g. typing "hsc phy" matches "HSC 2026 Physics Combo")
    const filtered = bundles.filter(b => {
        if (!searchQuery.trim()) return true;
        const tokens = searchQuery.toLowerCase().trim().split(/\s+/);
        const titleLower = b.title.toLowerCase();
        return tokens.every(token => titleLower.includes(token));
    });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setTimeout(() => searchInputRef.current?.focus(), 60);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={dropdownRef} className="relative w-full">
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition shadow-2xs ${
                    isOpen ? 'border-purple-500 ring-2 ring-purple-100' : 'border-slate-200 hover:border-slate-300'
                }`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Package className="w-4 h-4 text-purple-600 shrink-0" />
                    {selectedBundle ? (
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-slate-900 truncate">
                                {selectedBundle.title}
                            </span>
                            {selectedBundle.courses_count !== undefined && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-purple-50 text-purple-700 shrink-0">
                                    {selectedBundle.courses_count} courses
                                </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-emerald-50 text-emerald-700 shrink-0">
                                ৳{selectedBundle.sale_price}
                            </span>
                        </div>
                    ) : (
                        <span className="text-slate-400 font-medium">
                            {placeholder} ({bundles.length} bundles available)
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {selectedBundle && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect('');
                            }}
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition"
                            title="Clear selection"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {/* Live Search Input Box */}
                    <div className="p-2.5 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Type to search bundle (e.g. Science, Combo, Batch)..."
                                className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        {searchQuery && (
                            <span className="text-[10px] text-slate-400 block px-1 pt-1.5 font-medium">
                                Found {filtered.length} matching bundle{filtered.length === 1 ? '' : 's'}
                            </span>
                        )}
                    </div>

                    {/* Scrollable Bundle List */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
                        {filtered.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs">
                                No bundles found matching "{searchQuery}"
                            </div>
                        ) : (
                            filtered.map((bundle) => {
                                const isSelected = bundle.id === selectedId;
                                return (
                                    <div
                                        key={bundle.id}
                                        onClick={() => {
                                            onSelect(bundle.id);
                                            setIsOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition ${
                                            isSelected ? 'bg-purple-50 text-purple-950 font-bold' : 'hover:bg-slate-50 text-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Package className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                            <span className="text-xs truncate">{bundle.title}</span>
                                            {bundle.courses_count !== undefined && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                                    {bundle.courses_count} courses
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] font-mono font-bold text-emerald-600">
                                                ৳{bundle.sale_price}
                                            </span>
                                            {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const AdminAutoSmsPushPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [savingGeneral, setSavingGeneral] = useState(false);
    const [savingOverride, setSavingOverride] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);

    // Settings state
    const [enabled, setEnabled] = useState(true);
    const [generalTemplate, setGeneralTemplate] = useState('');
    const [courseTemplates, setCourseTemplates] = useState<CourseSmsTemplate[]>([]);
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [bundles, setBundles] = useState<BundleOption[]>([]);

    // Form for custom override (Course vs Bundle)
    const [targetType, setTargetType] = useState<'course' | 'bundle'>('course');
    const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
    const [selectedBundleId, setSelectedBundleId] = useState<number | ''>('');
    const [templateText, setTemplateText] = useState('');
    const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

    // Test SMS
    const [testPhone, setTestPhone] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; rendered?: string } | null>(null);

    // Feedback
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [autoSmsRes, coursesRes, bundlesRes] = await Promise.all([
                apiClient.get('/admin/sms/auto-push').catch(err => {
                    console.error('Auto SMS settings API error:', err);
                    return { data: null };
                }),
                apiClient.get('/admin/courses', { params: { per_page: 100 } }).catch(err => {
                    console.error('Courses API error:', err);
                    return { data: null };
                }),
                apiClient.get('/admin/bundles', { params: { per_page: 100 } }).catch(err => {
                    console.error('Bundles API error:', err);
                    return { data: null };
                }),
            ]);

            if (autoSmsRes?.data) {
                setEnabled(Boolean(autoSmsRes.data.setting?.enabled));
                setGeneralTemplate(autoSmsRes.data.setting?.general_template || '');
                setCourseTemplates(autoSmsRes.data.course_templates || []);
                if (autoSmsRes.data.courses && autoSmsRes.data.courses.length > 0) {
                    setCourses(autoSmsRes.data.courses);
                }
                if (autoSmsRes.data.bundles && autoSmsRes.data.bundles.length > 0) {
                    setBundles(autoSmsRes.data.bundles);
                }
            }

            // Fallback ensure courses list is populated
            if (coursesRes?.data?.data && coursesRes.data.data.length > 0) {
                setCourses(coursesRes.data.data.map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    price: Number(c.price) || 0,
                })));
            }

            // Fallback ensure bundles list is populated
            if (bundlesRes?.data?.data && bundlesRes.data.data.length > 0) {
                setBundles(bundlesRes.data.data.map((b: any) => ({
                    id: b.id,
                    title: b.title,
                    sale_price: Number(b.sale_price) || 0,
                    regular_price: Number(b.regular_price) || 0,
                    courses_count: b.courses_count || b.courses?.length || 0,
                })));
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to load Auto SMS Push settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingGeneral(true);
        setFeedback(null);
        try {
            const { data } = await apiClient.put('/admin/sms/auto-push/settings', {
                enabled,
                general_template: generalTemplate,
            });
            setFeedback({ type: 'success', message: data.message || 'General settings saved successfully.' });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to save general settings.' });
        } finally {
            setSavingGeneral(false);
        }
    };

    const handleSaveOverride = async (e: React.FormEvent) => {
        e.preventDefault();

        if (targetType === 'course' && !selectedCourseId) {
            alert('Please select a course.');
            return;
        }

        if (targetType === 'bundle' && !selectedBundleId) {
            alert('Please select a course bundle.');
            return;
        }

        if (!templateText.trim()) {
            alert('Please enter an SMS template.');
            return;
        }

        setSavingOverride(true);
        setFeedback(null);
        try {
            const payload: any = {
                type: targetType,
                template: templateText,
                is_active: true,
            };

            if (targetType === 'course') {
                payload.course_id = selectedCourseId;
            } else {
                payload.bundle_id = selectedBundleId;
            }

            const { data } = await apiClient.post('/admin/sms/auto-push/courses', payload);
            setFeedback({ type: 'success', message: data.message || `${targetType === 'bundle' ? 'Bundle' : 'Course'} override saved successfully.` });
            
            // Reset form
            setSelectedCourseId('');
            setSelectedBundleId('');
            setTemplateText('');
            setEditingTemplateId(null);
            
            // Refresh list
            fetchData();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to save override.' });
        } finally {
            setSavingOverride(false);
        }
    };

    const handleEditItem = (t: CourseSmsTemplate) => {
        const isBundle = t.type === 'bundle' || Boolean(t.bundle_id);
        if (isBundle) {
            setTargetType('bundle');
            setSelectedBundleId(t.bundle_id || '');
            setSelectedCourseId('');
        } else {
            setTargetType('course');
            setSelectedCourseId(t.course_id || '');
            setSelectedBundleId('');
        }
        setTemplateText(t.template);
        setEditingTemplateId(t.id);
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    const handleDeleteItem = async (id: number, type?: string) => {
        const itemType = type === 'bundle' ? 'bundle' : 'course';
        if (!confirm(`Are you sure you want to remove this ${itemType} custom SMS override? Default general SMS will be used instead.`)) {
            return;
        }
        try {
            const { data } = await apiClient.delete(`/admin/sms/auto-push/courses/${id}`);
            setFeedback({ type: 'success', message: data.message || 'Override removed.' });
            setCourseTemplates(prev => prev.filter(t => t.id !== id));
            if (editingTemplateId === id) {
                setSelectedCourseId('');
                setSelectedBundleId('');
                setTemplateText('');
                setEditingTemplateId(null);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete template.');
        }
    };

    const handleSendTestSms = async () => {
        if (!testPhone.trim()) {
            alert('Please enter a recipient phone number.');
            return;
        }
        setSendingTest(true);
        setTestResult(null);
        try {
            const templateToTest = templateText.trim() ? templateText : generalTemplate;
            const { data } = await apiClient.post('/admin/sms/auto-push/test', {
                phone: testPhone,
                template: templateToTest,
                type: targetType,
                course_id: targetType === 'course' ? (selectedCourseId || undefined) : undefined,
                bundle_id: targetType === 'bundle' ? (selectedBundleId || undefined) : undefined,
            });
            setTestResult({
                success: true,
                message: data.message,
                rendered: data.rendered_message,
            });
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'Failed to send test SMS.',
            });
        } finally {
            setSendingTest(false);
        }
    };

    const insertTag = (tag: string, target: 'general' | 'override') => {
        if (target === 'general') {
            setGeneralTemplate(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + tag);
        } else {
            setTemplateText(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + tag);
        }
    };

    // Calculate preview for general
    const renderPreview = (tpl: string) => {
        return tpl
            .replace(/{student_name}/g, 'John Doe')
            .replace(/{course_title}/g, 'HSC Physics Mastery')
            .replace(/{bundle_title}/g, 'HSC Science Complete Bundle')
            .replace(/{order_id}/g, 'ORD-10293')
            .replace(/{amount}/g, '৳2,500.00')
            .replace(/{site_name}/g, 'Monologue Edu')
            .replace(/{login_url}/g, 'https://monologueedu.com/login');
    };

    if (loading) {
        return (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
                <span className="text-sm font-semibold">Loading Auto SMS Push settings...</span>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <MessageSquare className="w-7 h-7 text-sky-600" />
                        <span>Auto SMS Push on Purchase</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Configure automated transactional SMS sent immediately to students upon course or bundle enrollment.
                    </p>
                </div>

                <button
                    onClick={fetchData}
                    className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                </button>
            </div>

            {feedback && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold animate-in fade-in ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    {feedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Master Toggle Banner */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <h3 className="text-sm font-bold text-slate-900">
                            Automatic SMS Delivery on Course or Bundle Purchase
                        </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                        When enabled, any successful purchase or approved order triggers an instant SMS to the student's mobile number.
                    </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
            </div>

            {/* SECTION 1: General SMS Template (Default Fallback) */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                            <Layers className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">1. General Purchase SMS Template (Default Fallback)</h3>
                            <p className="text-xs text-slate-500">
                                This message is sent whenever an enrolled course or bundle does not have a specific custom template override.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSaveGeneral} className="space-y-5">
                    {/* Placeholder Tags Pills */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            <span>Click to Insert Dynamic Placeholders:</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {AVAILABLE_TAGS.map(t => (
                                <button
                                    key={t.tag}
                                    type="button"
                                    onClick={() => insertTag(t.tag, 'general')}
                                    title={t.desc}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-700 text-xs font-mono font-semibold rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
                                >
                                    + {t.tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Textarea */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700">General SMS Template Text *</label>
                            <span className="text-[11px] font-mono text-slate-400">
                                {generalTemplate.length} characters ({Math.ceil(generalTemplate.length / 160) || 1} SMS)
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            value={generalTemplate}
                            onChange={(e) => setGeneralTemplate(e.target.value)}
                            placeholder="Dear {student_name}, thank you for purchasing {course_title}! Log in to start learning: {login_url}"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                            required
                        />
                    </div>

                    {/* Live Preview */}
                    <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-start gap-3">
                        <Smartphone className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                            <span className="font-bold text-sky-900 block">Rendered Preview (Sample Student):</span>
                            <p className="text-sky-800 font-mono bg-white/80 p-2.5 rounded-xl border border-sky-200/70 leading-relaxed">
                                {renderPreview(generalTemplate) || 'Type above to see live SMS preview...'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={savingGeneral}
                        className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        <span>{savingGeneral ? 'Saving...' : 'Save General Template'}</span>
                    </button>
                </form>
            </div>

            {/* SECTION 2: Course & Bundle Specific SMS Overrides */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">2. Course & Bundle Specific SMS Overrides</h3>
                            <p className="text-xs text-slate-500">
                                Set dedicated SMS messages for specific courses or course bundles (e.g. including private Telegram links, batch instructions, or bundle bonus access).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form to Add / Edit Override */}
                <form onSubmit={handleSaveOverride} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {editingTemplateId 
                                ? `Edit ${targetType === 'bundle' ? 'Bundle' : 'Course'} SMS Override` 
                                : `Create New ${targetType === 'bundle' ? 'Bundle' : 'Course'} SMS Override`}
                        </h4>

                        {/* Switcher Toggle: Course vs Bundle */}
                        <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => {
                                    setTargetType('course');
                                    setSelectedBundleId('');
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                    targetType === 'course'
                                        ? 'bg-sky-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Single Course</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setTargetType('bundle');
                                    setSelectedCourseId('');
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                    targetType === 'bundle'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <Package className="w-3.5 h-3.5" />
                                <span>Course Bundle</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Selector based on targetType */}
                        <div>
                            {targetType === 'course' ? (
                                <>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                                        <span>Select Course *</span>
                                    </label>
                                    <SearchableCourseSelect
                                        courses={courses}
                                        selectedId={selectedCourseId}
                                        onSelect={(id) => setSelectedCourseId(id)}
                                        placeholder="-- Search & Choose Course --"
                                    />
                                </>
                            ) : (
                                <>
                                    <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Select Course Bundle *</span>
                                    </label>
                                    <SearchableBundleSelect
                                        bundles={bundles}
                                        selectedId={selectedBundleId}
                                        onSelect={(id) => setSelectedBundleId(id)}
                                        placeholder="-- Search & Choose Bundle --"
                                    />
                                </>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Click to Insert Dynamic Placeholders:</label>
                            <div className="flex flex-wrap gap-1">
                                {AVAILABLE_TAGS.map(t => (
                                    <button
                                        key={t.tag}
                                        type="button"
                                        onClick={() => insertTag(t.tag, 'override')}
                                        className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-[11px] font-mono text-slate-600 rounded border border-slate-200 transition"
                                    >
                                        + {t.tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700">
                                {targetType === 'bundle' ? 'Bundle Custom SMS Text *' : 'Course Custom SMS Text *'}
                            </label>
                            <span className="text-[11px] font-mono text-slate-400">
                                {templateText.length} characters ({Math.ceil(templateText.length / 160) || 1} SMS)
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            value={templateText}
                            onChange={(e) => setTemplateText(e.target.value)}
                            placeholder={
                                targetType === 'bundle'
                                    ? 'Dear {student_name}, congratulations on enrolling in {bundle_title}! Access your courses at {login_url} - Monologue Edu'
                                    : 'Dear {student_name}, welcome to {course_title}! Join our batch group: https://t.me/... - Monologue Edu'
                            }
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={savingOverride}
                            className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition disabled:opacity-50 cursor-pointer ${
                                targetType === 'bundle'
                                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                            }`}
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>
                                {savingOverride 
                                    ? 'Saving...' 
                                    : editingTemplateId 
                                        ? `Update ${targetType === 'bundle' ? 'Bundle' : 'Course'} Override` 
                                        : `Save ${targetType === 'bundle' ? 'Bundle' : 'Course'} Override`}
                            </span>
                        </button>

                        {editingTemplateId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCourseId('');
                                    setSelectedBundleId('');
                                    setTemplateText('');
                                    setEditingTemplateId(null);
                                }}
                                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                {/* List of Configured Overrides */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">
                        Configured Overrides ({courseTemplates.length})
                    </h4>

                    {courseTemplates.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                            No specific course or bundle overrides configured yet. All purchases currently receive the General Template above.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                            {courseTemplates.map((item) => {
                                const isBundle = item.type === 'bundle' || Boolean(item.bundle_id);
                                const itemTitle = isBundle 
                                    ? (item.bundle?.title || `Bundle ID #${item.bundle_id}`)
                                    : (item.course?.title || `Course ID #${item.course_id}`);
                                const itemPrice = isBundle
                                    ? item.bundle?.sale_price
                                    : item.course?.price;

                                return (
                                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/70 transition">
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {isBundle ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-700 flex items-center gap-1">
                                                        <Package className="w-3 h-3" />
                                                        <span>Bundle Override</span>
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-sky-700 flex items-center gap-1">
                                                        <BookOpen className="w-3 h-3" />
                                                        <span>Course Override</span>
                                                    </span>
                                                )}

                                                <h5 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                                    {itemTitle}
                                                </h5>

                                                {itemPrice !== undefined && itemPrice !== null && (
                                                    <span className="text-[11px] font-mono font-bold text-slate-500">
                                                        (৳{itemPrice})
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs font-mono text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed break-words">
                                                {item.template}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                            <button
                                                onClick={() => handleEditItem(item)}
                                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                                title="Edit Override"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id, item.type)}
                                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                title="Delete Override"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 3: Live SMS Tester */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Send className="w-5 h-5 text-sky-600" />
                    <h3 className="text-base font-bold text-slate-900">Test SMS Delivery</h3>
                </div>
                <p className="text-xs text-slate-500">
                    Send a test message to your personal mobile number to verify dynamic tags and gateway delivery.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="017xxxxxxxx"
                        className="w-full sm:max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                        onClick={handleSendTestSms}
                        disabled={sendingTest}
                        className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingTest ? 'Sending...' : 'Send Test SMS'}</span>
                    </button>
                </div>

                {testResult && (
                    <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                        testResult.success 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                        <div className="font-bold flex items-center gap-1.5">
                            {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span>Result: {testResult.message}</span>
                        </div>
                        {testResult.rendered && (
                            <div className="font-mono bg-white/70 p-2 rounded-lg mt-1 border border-emerald-300">
                                Dispatched SMS: {testResult.rendered}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
