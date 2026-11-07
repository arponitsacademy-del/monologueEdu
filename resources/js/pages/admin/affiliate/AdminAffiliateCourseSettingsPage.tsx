import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import {
    BookOpen,
    Search,
    Edit3,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    Loader2,
    DollarSign,
    Percent,
    Sliders,
    X,
    Info,
    Sparkles
} from 'lucide-react';

interface CourseAffiliateSettingData {
    id: number;
    course_id: number;
    is_active: boolean;
    commission_type: 'percentage' | 'fixed';
    commission_amount: number;
    discount_type: 'percentage' | 'fixed';
    discount_amount: number;
}

interface CourseItem {
    id: number;
    title: string;
    price: number;
    sale_price: number | null;
    status: string;
    affiliate_setting?: CourseAffiliateSettingData | null;
}

export const AdminAffiliateCourseSettingsPage: React.FC = () => {
    const [courses, setCourses] = useState<CourseItem[]>([]);
    const [generalSettings, setGeneralSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'custom' | 'default'>('all');

    // Edit modal state
    const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        is_active: true,
        commission_type: 'percentage' as 'percentage' | 'fixed',
        commission_amount: 10,
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_amount: 0,
    });

    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchCourseSettings();
    }, []);

    const fetchCourseSettings = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/admin/affiliate/course-settings');
            setCourses(res.data.courses || []);
            setGeneralSettings(res.data.general_settings);
        } catch (err: any) {
            console.error('Failed to load course affiliate settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = (course: CourseItem) => {
        setSelectedCourse(course);
        const existing = course.affiliate_setting;
        if (existing) {
            setEditForm({
                is_active: Boolean(existing.is_active),
                commission_type: existing.commission_type || 'percentage',
                commission_amount: Number(existing.commission_amount || 0),
                discount_type: existing.discount_type || 'percentage',
                discount_amount: Number(existing.discount_amount || 0),
            });
        } else {
            setEditForm({
                is_active: true,
                commission_type: generalSettings?.default_commission_type || 'percentage',
                commission_amount: Number(generalSettings?.default_commission_amount || 10),
                discount_type: generalSettings?.default_discount_type || 'percentage',
                discount_amount: Number(generalSettings?.default_discount_amount || 0),
            });
        }
        setModalOpen(true);
    };

    const handleSaveCourseSetting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;

        try {
            setSaving(true);
            const res = await apiClient.put(`/admin/affiliate/course-settings/${selectedCourse.id}`, editForm);
            setAlertMessage({ type: 'success', text: res.data.message || 'কোর্সের কমিশন আপডেট হয়েছে।' });
            setModalOpen(false);
            fetchCourseSettings();
        } catch (err: any) {
            setAlertMessage({ type: 'error', text: err.response?.data?.message || 'সংরক্ষণ ব্যর্থ হয়েছে।' });
        } finally {
            setSaving(false);
        }
    };

    const handleResetToDefault = async (course: CourseItem) => {
        if (!window.confirm(`আপনি কি "${course.title}" কোর্সের কাস্টম কমিশন রিসেট করে সাধারণ ডিফল্ট সেটিংসে ফিরিয়ে আনতে চান?`)) {
            return;
        }

        try {
            const res = await apiClient.delete(`/admin/affiliate/course-settings/${course.id}`);
            setAlertMessage({ type: 'success', text: res.data.message || 'রিসেট সম্পন্ন হয়েছে।' });
            fetchCourseSettings();
        } catch (err: any) {
            setAlertMessage({ type: 'error', text: 'রিসেট করা সম্ভব হয়নি।' });
        }
    };

    const filteredCourses = courses.filter((c) => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
        const hasCustom = c.affiliate_setting && c.affiliate_setting.is_active;

        if (filterType === 'custom') return matchesSearch && hasCustom;
        if (filterType === 'default') return matchesSearch && !hasCustom;
        return matchesSearch;
    });

    const customCount = courses.filter((c) => c.affiliate_setting && c.affiliate_setting.is_active).length;

    // Helper for calculating preview amounts in modal
    const effectivePrice = selectedCourse ? (selectedCourse.sale_price !== null && selectedCourse.sale_price !== undefined ? Number(selectedCourse.sale_price) : Number(selectedCourse.price)) : 0;
    const previewDiscount = editForm.discount_type === 'percentage'
        ? Math.round((effectivePrice * editForm.discount_amount) / 100)
        : Math.min(effectivePrice, editForm.discount_amount);
    const previewPayable = Math.max(0, effectivePrice - previewDiscount);
    const previewCommission = editForm.commission_type === 'percentage'
        ? Math.round((previewPayable * editForm.commission_amount) / 100)
        : editForm.commission_amount;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Sliders className="h-7 w-7 text-indigo-600" />
                        কোর্স ভিত্তিক কমিশন ও ডিসকাউন্ট
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        যেকোনো নির্দিষ্ট কোর্সের জন্য বিশেষ অ্যাফিলিয়েট কমিশন এবং রেফারেল ক্রেতার ডিসকাউন্ট সেট করুন।
                    </p>
                </div>
            </div>

            {/* Alert Message */}
            {alertMessage && (
                <div
                    className={`p-4 rounded-xl flex items-center justify-between transition-all ${
                        alertMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {alertMessage.type === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                        )}
                        <span className="font-medium text-sm">{alertMessage.text}</span>
                    </div>
                    <button
                        onClick={() => setAlertMessage(null)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">মোট কোর্স</span>
                        <BookOpen className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{courses.length}</p>
                    <p className="text-xs text-gray-400 mt-1">সিস্টেমে বিদ্যমান কোর্স</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">কাস্টম কমিশন সেট করা</span>
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                    </div>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">{customCount}</p>
                    <p className="text-xs text-indigo-500 mt-1">স্বতন্ত্র রেটে কমিশন পাচ্ছে</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">সাধারণ ডিফল্ট রেট</span>
                        <Info className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 mt-2">
                        {generalSettings?.default_commission_type === 'percentage'
                            ? `${generalSettings?.default_commission_amount}%`
                            : `৳${generalSettings?.default_commission_amount}`}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">বাকি সব কোর্সের ডিফল্ট হার</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
                <div className="relative w-full sm:w-96">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="কোর্সের নাম দিয়ে খুঁজুন..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            filterType === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        সকল ({courses.length})
                    </button>
                    <button
                        onClick={() => setFilterType('custom')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            filterType === 'custom'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        কাস্টম রেট ({customCount})
                    </button>
                    <button
                        onClick={() => setFilterType('default')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            filterType === 'default'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        ডিফল্ট রেট ({courses.length - customCount})
                    </button>
                </div>
            </div>

            {/* Courses Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                        <span className="text-sm font-medium">কোর্স তালিকা লোড হচ্ছে...</span>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-500">কোনো কোর্স পাওয়া যায়নি</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50/75 border-b border-gray-200 text-xs uppercase font-semibold text-gray-600">
                                <tr>
                                    <th className="px-6 py-3.5">কোর্সের বিবরণ</th>
                                    <th className="px-6 py-3.5">কোর্স ফি</th>
                                    <th className="px-6 py-3.5">কমিশন মোড</th>
                                    <th className="px-6 py-3.5">অ্যাফিলিয়েট কমিশন</th>
                                    <th className="px-6 py-3.5">ক্রেতার ছাড় (ডিসকাউন্ট)</th>
                                    <th className="px-6 py-3.5 text-right">অ্যাকশন</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredCourses.map((course) => {
                                    const custom = course.affiliate_setting && course.affiliate_setting.is_active;
                                    const commType = custom ? course.affiliate_setting!.commission_type : generalSettings?.default_commission_type;
                                    const commAmount = custom ? course.affiliate_setting!.commission_amount : generalSettings?.default_commission_amount;
                                    const discType = custom ? course.affiliate_setting!.discount_type : generalSettings?.default_discount_type;
                                    const discAmount = custom ? course.affiliate_setting!.discount_amount : generalSettings?.default_discount_amount;

                                    return (
                                        <tr key={course.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 line-clamp-1">{course.title}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">ID: #{course.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {course.sale_price !== null && course.sale_price !== undefined ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-gray-900">৳{course.sale_price}</span>
                                                        <span className="text-xs text-gray-400 line-through">৳{course.price}</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-bold text-gray-900">৳{course.price}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {custom ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                        <Sparkles className="h-3 w-3" />
                                                        কাস্টম রেট
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                        সাধারণ ডিফল্ট
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-semibold ${custom ? 'text-indigo-600 font-bold' : 'text-gray-700'}`}>
                                                    {commType === 'percentage' ? `${commAmount}%` : `৳${commAmount}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {discAmount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                                        {discType === 'percentage' ? `${discAmount}% ছাড়` : `৳${discAmount} ছাড়`}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">কোনো ছাড় নেই</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenEdit(course)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                    সেট করুন
                                                </button>
                                                {custom && (
                                                    <button
                                                        onClick={() => handleResetToDefault(course)}
                                                        title="সাধারণ ডিফল্টে ফিরিয়ে নিন"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        রিসেট
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal for setting custom rates */}
            {modalOpen && selectedCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                        <button
                            onClick={() => setModalOpen(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Edit3 className="h-5 w-5 text-indigo-600" />
                                কোর্স কমিশন কনফিগার করুন
                            </h2>
                            <p className="text-sm font-medium text-indigo-700 mt-1 line-clamp-1">
                                {selectedCourse.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                কোর্স মূল্য: ৳{effectivePrice}
                            </p>
                        </div>

                        <form onSubmit={handleSaveCourseSetting} className="space-y-4">
                            {/* Active Switch */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <div>
                                    <span className="text-sm font-semibold text-gray-900 block">কাস্টম সেটিং সক্রিয় রাখুন</span>
                                    <span className="text-xs text-gray-500">বন্ধ রাখলে সাধারণ ডিফল্ট রেট কার্যকর হবে</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.is_active}
                                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {/* Commission section */}
                            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                    <Percent className="h-4 w-4 text-indigo-600" />
                                    অ্যাফিলিয়েট কমিশন (যা রেফারিং পার্টনার পাবে)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-xs text-gray-600 block mb-1">কমিশন ধরণ</span>
                                        <select
                                            value={editForm.commission_type}
                                            onChange={(e) => setEditForm({ ...editForm, commission_type: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="percentage">শতকরা (%)</option>
                                            <option value="fixed">নির্দিষ্ট টাকা (৳)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-600 block mb-1">পরিমাণ</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editForm.commission_amount}
                                            onChange={(e) => setEditForm({ ...editForm, commission_amount: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Buyer discount section */}
                            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                    ক্রেতার ডিসকাউন্ট (রেফারেল লিংকে শিক্ষার্থী যে ছাড় পাবে)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-xs text-gray-600 block mb-1">ডিসকাউন্ট ধরণ</span>
                                        <select
                                            value={editForm.discount_type}
                                            onChange={(e) => setEditForm({ ...editForm, discount_type: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="percentage">শতকরা (%)</option>
                                            <option value="fixed">নির্দিষ্ট টাকা (৳)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-600 block mb-1">পরিমাণ</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editForm.discount_amount}
                                            onChange={(e) => setEditForm({ ...editForm, discount_amount: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Live calculation preview */}
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1.5">
                                <div className="font-semibold text-gray-700 flex items-center gap-1">
                                    <Info className="h-3.5 w-3.5 text-indigo-500" />
                                    উদাহরণ হিসাব (প্রতিটি সফল বিক্রয়ে):
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>কোর্সের দাম:</span>
                                    <span>৳{effectivePrice}</span>
                                </div>
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span>শিক্ষার্থী ছাড় পাবে:</span>
                                    <span>- ৳{previewDiscount}</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
                                    <span>শিক্ষার্থী পরিশোধ করবে:</span>
                                    <span>৳{previewPayable}</span>
                                </div>
                                <div className="flex justify-between text-indigo-700 font-bold border-t border-dashed border-gray-200 pt-1">
                                    <span>অ্যাফিলিয়েট পাবে:</span>
                                    <span>৳{previewCommission}</span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    সংরক্ষণ করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

