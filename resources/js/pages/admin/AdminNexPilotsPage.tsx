import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { 
    Bot, 
    Plus, 
    Wrench, 
    Edit3, 
    Trash2, 
    Search, 
    Sparkles, 
    Settings, 
    BookOpen, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    Check, 
    ExternalLink,
    HelpCircle,
    GraduationCap,
    SlidersHorizontal,
    DollarSign
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const AdminNexPilotsPage: React.FC = () => {
    const navigate = useNavigate();
    const [pilots, setPilots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [pilotToDelete, setPilotToDelete] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);

    // OpenAI Settings Modal
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [openAiKey, setOpenAiKey] = useState('');
    const [openAiModel, setOpenAiModel] = useState('gpt-4o-mini');
    const [costInput, setCostInput] = useState(0.00015);
    const [costOutput, setCostOutput] = useState(0.00060);
    const [savingSettings, setSavingSettings] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        fetchPilots();
    }, [search]);

    const fetchPilots = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/admin/nexpilot', {
                params: { search: search || undefined }
            });
            setPilots(data.data || []);
        } catch (err) {
            console.error('Failed to fetch pilots', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOpenAiSettings = async () => {
        try {
            const { data } = await apiClient.get('/admin/nexpilot/settings');
            setOpenAiKey(data.api_key || '');
            setOpenAiModel(data.default_model || 'gpt-4o-mini');
            setCostInput(data.cost_per_1k_input || 0.00015);
            setCostOutput(data.cost_per_1k_output || 0.00060);
            setTestResult(null);
            setSettingsModalOpen(true);
        } catch (err) {
            console.error('Failed to fetch OpenAI settings', err);
        }
    };

    const handleSaveOpenAiSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            await apiClient.put('/admin/nexpilot/settings', {
                api_key: openAiKey,
                default_model: openAiModel,
                cost_per_1k_input: costInput,
                cost_per_1k_output: costOutput,
            });
            setSettingsModalOpen(false);
        } catch (err: any) {
            alert(err.response?.data?.message || 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleTestOpenAiConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);
        try {
            const { data } = await apiClient.post('/admin/nexpilot/test-connection', {
                api_key: openAiKey,
            });
            setTestResult({ success: true, message: data.message });
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'OpenAI API সংযোগ ব্যর্থ হয়েছে।'
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleDeletePilot = async () => {
        if (!pilotToDelete) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/admin/nexpilot/${pilotToDelete.id}`);
            setPilots(prev => prev.filter(p => p.id !== pilotToDelete.id));
            setDeleteModalOpen(false);
            setPilotToDelete(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'পাইলট মুছে ফেলা সম্ভব হয়নি।');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span>NexPilot AI পাইলট</span>
                                <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 rounded-full border border-sky-200 dark:border-sky-800">
                                    OpenAI Powered
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                কোর্স ভিত্তিক পার্সোনাল AI শিক্ষক এবং প্র্যাকটিস সলভিং কোচ ম্যানেজমেন্ট
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={fetchOpenAiSettings}
                        className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>OpenAI কনফিগারেশন</span>
                    </button>

                    <Link
                        to="/admin/nexpilot/new"
                        className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>নতুন পাইলট তৈরি করুন</span>
                    </Link>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="কোর্স বা পাইলটের নাম দিয়ে খুঁজুন..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                    />
                </div>
            </div>

            {/* Pilots Grid / List */}
            {loading ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                    <span className="text-xs font-bold">NexPilot তালিকা লোড হচ্ছে...</span>
                </div>
            ) : pilots.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 mx-auto flex items-center justify-center">
                        <Bot className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">কোনো NexPilot পাওয়া যায়নি</h4>
                        <p className="text-xs text-slate-400 mt-1">আপনার কোর্সের জন্য প্রথম AI পাইলট তৈরি করুন।</p>
                    </div>
                    <Link
                        to="/admin/nexpilot/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-sky-700"
                    >
                        <Plus className="w-4 h-4" />
                        <span>নতুন পাইলট যুক্ত করুন</span>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {pilots.map((pilot) => {
                        const course = pilot.course;
                        return (
                            <div
                                key={pilot.id}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between gap-5 transition-all hover:border-sky-300 dark:hover:border-slate-700"
                            >
                                <div className="space-y-4">
                                    {/* Top row: Status and Course Badge */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                <BookOpen className="w-3 h-3 text-sky-600" />
                                                <span className="truncate max-w-[200px]">{course?.title || 'কোর্স নেই'}</span>
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800">
                                                {pilot.openai_model || 'gpt-4o-mini'}
                                            </span>
                                        </div>

                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                            pilot.is_active 
                                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                            {pilot.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                        </span>
                                    </div>

                                    {/* Pilot Title & Short Description */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span>{pilot.title}</span>
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                            {pilot.short_description || 'কোর্সের সাথে শিক্ষার্থীদের সার্বক্ষণিক AI শিক্ষক ও প্র্যাকটিস কোচ।'}
                                        </p>
                                    </div>

                                    {/* Metrics Pill Grid */}
                                    <div className="grid grid-cols-3 gap-2.5 pt-2">
                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                            <p className="text-[10px] font-semibold text-slate-400">অ্যাড-অন ফি</p>
                                            <p className="text-sm font-black text-sky-600 dark:text-sky-400 mt-0.5">
                                                {pilot.price > 0 ? formatBDT(pilot.price) : 'ফ্রি'}
                                            </p>
                                        </div>

                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                            <p className="text-[10px] font-semibold text-slate-400">সর্বোচ্চ বাজেট/শিক্ষার্থী</p>
                                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                ${parseFloat(pilot.max_usd_limit || 2).toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                            <p className="text-[10px] font-semibold text-slate-400">টপিক সংখ্যা</p>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                                                <span className="text-indigo-600">{pilot.theory_topics_count || 0} থিওরি</span>
                                                <span className="text-slate-300 mx-1">•</span>
                                                <span className="text-sky-600">{pilot.practice_topics_count || 0} প্র্যাকটিস</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Bar */}
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                        <span>এনরোল্ড শিক্ষার্থী: <strong>{pilot.students_count || 0}</strong></span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Builder Button */}
                                        <Link
                                            to={`/admin/nexpilot/${pilot.id}/builder`}
                                            className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
                                        >
                                            <Wrench className="w-3.5 h-3.5" />
                                            <span>বিল্ডার (Builder)</span>
                                        </Link>

                                        {/* Edit Button */}
                                        <Link
                                            to={`/admin/nexpilot/${pilot.id}/edit`}
                                            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
                                            title="এডিট করুন"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </Link>

                                        {/* Delete Button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPilotToDelete(pilot);
                                                setDeleteModalOpen(true);
                                            }}
                                            className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                                            title="মুছে ফেলুন"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* OpenAI Settings Modal */}
            <Modal
                isOpen={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                title="OpenAI কনফিগারেশন ও টোকেন রেট"
            >
                <form onSubmit={handleSaveOpenAiSettings} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            OpenAI API Secret Key
                        </label>
                        <input
                            type="password"
                            value={openAiKey}
                            onChange={(e) => setOpenAiKey(e.target.value)}
                            placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxx"
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                            পাইলটের মাধ্যমে চ্যাট করার সময় এই কী দিয়ে OpenAI সার্ভারে রিকোয়েস্ট পাঠানো হবে।
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            ডিফল্ট AI মডেল
                        </label>
                        <select
                            value={openAiModel}
                            onChange={(e) => setOpenAiModel(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="gpt-4o-mini">gpt-4o-mini (সর্বোচ্চ দ্রুত ও সাশ্রয়ী - Recommended)</option>
                            <option value="gpt-4o">gpt-4o (সর্বোচ্চ বুদ্ধিমান ও নিখুঁত)</option>
                            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                ইনপুট টোকেন কস্ট ($ per 1K)
                            </label>
                            <input
                                type="number"
                                step="0.00001"
                                value={costInput}
                                onChange={(e) => setCostInput(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                আউটপুট টোকেন কস্ট ($ per 1K)
                            </label>
                            <input
                                type="number"
                                step="0.00001"
                                value={costOutput}
                                onChange={(e) => setCostOutput(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                            />
                        </div>
                    </div>

                    {/* Test Connection Banner */}
                    {testResult && (
                        <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                            testResult.success 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200' 
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200'
                        }`}>
                            {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                            <span>{testResult.message}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handleTestOpenAiConnection}
                            disabled={testingConnection}
                            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            {testingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                            <span>সংযোগ পরীক্ষা করুন</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSettingsModalOpen(false)}
                                className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                                বাতিল
                            </button>
                            <button
                                type="submit"
                                disabled={savingSettings}
                                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                                {savingSettings ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="NexPilot মুছে ফেলার নিশ্চয়তা"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        আপনি কি নিশ্চিত যে <strong>"{pilotToDelete?.title}"</strong> মুছে ফেলতে চান?
                        এর সকল থিওরি ও প্র্যাকটিস টপিক এবং চ্যাট হিস্ট্রি ডিলিট হয়ে যাবে।
                    </p>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setDeleteModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-500"
                        >
                            বাতিল
                        </button>
                        <button
                            type="button"
                            onClick={handleDeletePilot}
                            disabled={deleting}
                            className="px-4 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl"
                        >
                            {deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

