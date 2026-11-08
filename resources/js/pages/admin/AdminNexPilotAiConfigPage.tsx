import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
    Bot, 
    Sparkles, 
    Cpu, 
    Key, 
    Check, 
    CheckCircle2, 
    AlertCircle, 
    Eye, 
    EyeOff, 
    Save, 
    RefreshCw, 
    ShieldCheck, 
    Zap, 
    ExternalLink,
    HelpCircle,
    Info,
    Sliders,
    MessageSquareQuote
} from 'lucide-react';

interface OpenAiSettings {
    has_api_key: boolean;
    masked_key: string;
    api_key: string;
    default_model: string;
    is_enabled: boolean;
    temperature: number;
    global_system_prompt: string;
    cost_per_1k_input: number;
    cost_per_1k_output: number;
}

export const AdminNexPilotAiConfigPage: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [hasExistingKey, setHasExistingKey] = useState(false);
    const [maskedKey, setMaskedKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [defaultModel, setDefaultModel] = useState('gpt-4o-mini');
    const [isEnabled, setIsEnabled] = useState(true);
    const [temperature, setTemperature] = useState(0.7);
    const [globalSystemPrompt, setGlobalSystemPrompt] = useState('');
    const [costInput, setCostInput] = useState(0.00015);
    const [costOutput, setCostOutput] = useState(0.00060);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get<OpenAiSettings>('/admin/ai/settings');
            setHasExistingKey(Boolean(data.has_api_key));
            setMaskedKey(data.masked_key || '');
            setApiKey(data.api_key || '');
            setDefaultModel(data.default_model || 'gpt-4o-mini');
            setIsEnabled(data.is_enabled !== false);
            setTemperature(typeof data.temperature === 'number' ? data.temperature : 0.7);
            setGlobalSystemPrompt(data.global_system_prompt || '');
            setCostInput(data.cost_per_1k_input || 0.00015);
            setCostOutput(data.cost_per_1k_output || 0.00060);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load configuration.');
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        setError(null);
        const startTime = Date.now();

        try {
            const { data } = await apiClient.post('/admin/ai/test-connection', {
                api_key: apiKey.trim() || undefined
            });

            const latency = Date.now() - startTime;
            setTestResult({
                success: true,
                message: data.message || 'OpenAI API successfully connected!',
                latency,
            });
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'Connection failed. Please check your API Key.'
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSaveSuccess(false);

        try {
            const payload = {
                api_key: apiKey.trim() || undefined,
                default_model: defaultModel,
                is_enabled: isEnabled,
                temperature,
                global_system_prompt: globalSystemPrompt,
                cost_per_1k_input: costInput,
                cost_per_1k_output: costOutput,
            };

            await apiClient.post('/admin/ai/settings', payload);
            setSaveSuccess(true);
            await fetchSettings();
            setTimeout(() => setSaveSuccess(false), 4000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save configuration.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
                <span className="text-xs font-bold">Loading AI configuration...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                        <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span>AI Configuration</span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                Global OpenAI
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Configure global OpenAI API models powering both AI Exam Question Generation and NexPilot Tutors across Monologue Edu.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testing || (!apiKey && !hasExistingKey)}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                        {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                        <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                </div>
            </div>

            {/* Connection Status Banner */}
            {hasExistingKey ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-sm text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                                <span>OpenAI Model Successfully Connected</span>
                                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                    {defaultModel}
                                </span>
                            </div>
                            <p className="text-xs text-emerald-700/90 dark:text-emerald-300/80 mt-0.5">
                                NexPilot AI tutors are active across all courses. Saved key: <span className="font-mono font-bold">{maskedKey}</span>
                            </p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-1 rounded-lg shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Active</span>
                    </span>
                </div>
            ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-sm text-amber-900 dark:text-amber-100">
                            OpenAI API Key Not Added Yet
                        </div>
                        <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                            To enable the NexPilot assistant, enter your OpenAI API Secret Key below and click "Save Configuration".
                        </p>
                    </div>
                </div>
            )}

            {/* Test Result Message */}
            {testResult && (
                <div className={`p-4 rounded-2xl border text-xs font-medium flex items-start gap-3 animate-in fade-in duration-200 ${
                    testResult.success 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}>
                    {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                        <div className="font-bold">{testResult.message}</div>
                        {testResult.latency && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                                Response time: {testResult.latency}ms
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            {/* Success Message */}
            {saveSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>AI Model configuration saved and updated globally!</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* 1. API Key Card */}
                <div className="p-6 sm:p-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Key className="w-4 h-4 text-sky-600" />
                            <span>OpenAI API Key (Secret Key)</span>
                        </h3>
                        <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline"
                        >
                            <span>Get API key from OpenAI</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>

                    <div className="relative">
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={hasExistingKey ? 'Enter new key to replace existing (or leave empty)' : 'sk-proj-...'}
                            className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                        >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {hasExistingKey && !apiKey && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                            <Check className="w-3.5 h-3.5" />
                            <span>Currently saved key: <strong className="font-mono">{maskedKey}</strong> is active.</span>
                        </p>
                    )}
                </div>

                {/* 2. Model Selection Card */}
                <div className="p-6 sm:p-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Default AI Model Selection</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Option 1: gpt-4o-mini */}
                        <div
                            onClick={() => setDefaultModel('gpt-4o-mini')}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                defaultModel === 'gpt-4o-mini'
                                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 shadow-xs'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="font-black text-sm text-slate-900 dark:text-white font-mono">
                                    gpt-4o-mini
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                    Recommended
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Extremely fast, cost-effective and smart. Can process ~2M tokens per $1.00. Recommended for most courses.
                            </p>
                        </div>

                        {/* Option 2: gpt-4o */}
                        <div
                            onClick={() => setDefaultModel('gpt-4o')}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                defaultModel === 'gpt-4o'
                                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="font-black text-sm text-slate-900 dark:text-white font-mono">
                                    gpt-4o
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                    High Intelligence
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Highest intelligence and highly adept at complex mathematical/scientific reasoning. Ideal for deep learning & advanced courses.
                            </p>
                        </div>

                        {/* Option 3: gpt-4-turbo */}
                        <div
                            onClick={() => setDefaultModel('gpt-4-turbo')}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                defaultModel === 'gpt-4-turbo'
                                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 shadow-xs'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                            }`}
                        >
                            <span className="font-black text-sm text-slate-900 dark:text-white font-mono block mb-1">
                                gpt-4-turbo
                            </span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Powerful and dependable GPT-4 Turbo engine.
                            </p>
                        </div>

                        {/* Option 4: gpt-3.5-turbo */}
                        <div
                            onClick={() => setDefaultModel('gpt-3.5-turbo')}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                defaultModel === 'gpt-3.5-turbo'
                                    ? 'border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-xs'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                            }`}
                        >
                            <span className="font-black text-sm text-slate-900 dark:text-white font-mono block mb-1">
                                gpt-3.5-turbo
                            </span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Classic legacy model. Effective for general Q&A and basic chat.
                            </p>
                        </div>

                        {/* Option 5: o1-mini */}
                        <div
                            onClick={() => setDefaultModel('o1-mini')}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                defaultModel === 'o1-mini'
                                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 shadow-xs'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="font-black text-sm text-slate-900 dark:text-white font-mono">
                                    o1-mini
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                                    STEM Reasoning
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Specialized in math, physics, coding and multi-step scientific problems.
                            </p>
                        </div>

                        {/* Option 6: o1-preview */}
                        <div
                            onClick={() => setDefaultModel('o1-preview')}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                defaultModel === 'o1-preview'
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="font-black text-sm text-slate-900 dark:text-white font-mono">
                                    o1-preview
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                    Deep Reasoning
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Deep thinking for complex academic exams and research-grade problems.
                            </p>
                        </div>
                    </div>

                    {/* Custom Model Input */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Selected / Custom Model Identifier:
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={defaultModel}
                                onChange={(e) => setDefaultModel(e.target.value)}
                                placeholder="e.g. gpt-4o, gpt-4o-mini, ft:gpt-4o-mini:..."
                                className="w-full sm:max-w-md px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 dark:text-white"
                                required
                            />
                            <span className="text-[11px] text-slate-400">
                                Type any model name or fine-tuned model ID
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Global Persona & Instructions */}
                <div className="p-6 sm:p-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquareQuote className="w-4 h-4 text-emerald-600" />
                        <span>Global System Persona & Instructions</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Define the baseline personality, demeanor, tone, and teaching style across all course chatbots.
                    </p>

                    <textarea
                        rows={3}
                        value={globalSystemPrompt}
                        onChange={(e) => setGlobalSystemPrompt(e.target.value)}
                        placeholder="e.g. Always respond in a warm, encouraging tone. Explain complex ideas with intuitive real-world examples and KaTeX mathematical notation..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                    />
                </div>

                {/* 4. Advanced Settings (Temperature & Token Costs) */}
                <div className="p-6 sm:p-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-slate-600" />
                        <span>Advanced Parameters & Token Rates</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Temperature */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Temperature ({temperature})
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.1}
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="w-full cursor-pointer accent-sky-600 mt-2"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                                <span>Precise (0.0)</span>
                                <span>Balanced (0.7)</span>
                                <span>Creative (1.0)</span>
                            </div>
                        </div>

                        {/* Input Cost per 1K Tokens */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Input Cost / 1K Tokens ($)
                            </label>
                            <input
                                type="number"
                                step="0.00001"
                                min="0"
                                value={costInput}
                                onChange={(e) => setCostInput(parseFloat(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Default $0.00015 (gpt-4o-mini)</p>
                        </div>

                        {/* Output Cost per 1K Tokens */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Output Cost / 1K Tokens ($)
                            </label>
                            <input
                                type="number"
                                step="0.00001"
                                min="0"
                                value={costOutput}
                                onChange={(e) => setCostOutput(parseFloat(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Default $0.00060 (gpt-4o-mini)</p>
                        </div>
                    </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};
