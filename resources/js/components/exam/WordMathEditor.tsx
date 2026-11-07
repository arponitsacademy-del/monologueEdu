import React, { useState, useRef } from 'react';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Superscript,
    Subscript,
    List,
    ListOrdered,
    Eye,
    Edit3,
    Columns,
    X,
    Calculator,
    Check,
    HelpCircle,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { MathView } from '../shared/MathView';
import katex from 'katex';

interface WordMathEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    minHeight?: string;
    required?: boolean;
}

// Math symbols library
const MATH_SYMBOLS = [
    { label: '±', latex: '\\pm ' },
    { label: '×', latex: '\\times ' },
    { label: '÷', latex: '\\div ' },
    { label: '≠', latex: '\\ne ' },
    { label: '≤', latex: '\\le ' },
    { label: '≥', latex: '\\ge ' },
    { label: '≈', latex: '\\approx ' },
    { label: '∞', latex: '\\infty ' },
    { label: '°', latex: '^\\circ ' },
    { label: '√', latex: '\\sqrt{}' },
    { label: 'π', latex: '\\pi ' },
    { label: 'θ', latex: '\\theta ' },
    { label: 'α', latex: '\\alpha ' },
    { label: 'β', latex: '\\beta ' },
    { label: 'γ', latex: '\\gamma ' },
    { label: 'λ', latex: '\\lambda ' },
    { label: 'μ', latex: '\\mu ' },
    { label: 'σ', latex: '\\sigma ' },
    { label: 'ω', latex: '\\omega ' },
    { label: 'Ω', latex: '\\Omega ' },
    { label: 'Δ', latex: '\\Delta ' },
    { label: '→', latex: '\\rightarrow ' },
    { label: '⇒', latex: '\\Rightarrow ' },
    { label: '∈', latex: '\\in ' },
    { label: '⊂', latex: '\\subset ' },
    { label: '∪', latex: '\\cup ' },
    { label: '∩', latex: '\\cap ' },
];

// Equation Templates categories
const EQUATION_TEMPLATES = [
    {
        category: 'বীজগণিত ও সাধারণ (Algebra)',
        items: [
            { name: 'ভগ্নাংশ (Fraction)', template: '$\\frac{a}{b}$', preview: '\\frac{a}{b}' },
            { name: 'বর্গমূল (Square Root)', template: '$\\sqrt{x}$', preview: '\\sqrt{x}' },
            { name: 'n-তম মূল (Nth Root)', template: '$\\sqrt[n]{x}$', preview: '\\sqrt[n]{x}' },
            { name: 'পাওয়ার / সূচক (Power)', template: '$x^{2}$', preview: 'x^{2}' },
            { name: 'দ্বিঘাত সূত্র (Quadratic)', template: '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$', preview: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
            { name: 'বর্গের সূত্র', template: '$$(a+b)^2 = a^2 + 2ab + b^2$$', preview: '(a+b)^2 = a^2 + 2ab + b^2' },
        ]
    },
    {
        category: 'ক্যালকুলাস ও লিমিট (Calculus & Limits)',
        items: [
            { name: 'ডিফারেন্সিয়েশন', template: '$\\frac{dy}{dx}$', preview: '\\frac{dy}{dx}' },
            { name: 'অনির্দিষ্ট সমাকলন', template: '$$\\int f(x) dx$$', preview: '\\int f(x) dx' },
            { name: 'নির্দিষ্ট সমাকলন', template: '$$\\int_{a}^{b} f(x) dx$$', preview: '\\int_{a}^{b} f(x) dx' },
            { name: 'লিমিট (Limit)', template: '$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$', preview: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1' },
            { name: 'সামেশন (Summation)', template: '$$\\sum_{i=1}^{n} i$$', preview: '\\sum_{i=1}^{n} i' },
            { name: 'আংশিক অন্তরীকরণ', template: '$\\frac{\\partial f}{\\partial x}$', preview: '\\frac{\\partial f}{\\partial x}' },
        ]
    },
    {
        category: 'ত্রিকোণমিতি ও জ্যামিতি (Trigonometry)',
        items: [
            { name: 'সাইন স্কয়ার প্লাস কস স্কয়ার', template: '$$\\sin^2\\theta + \\cos^2\\theta = 1$$', preview: '\\sin^2\\theta + \\cos^2\\theta = 1' },
            { name: 'ট্যান থিটা', template: '$\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$', preview: '\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}' },
            { name: 'ত্রিভুজের ক্ষেত্রফল', template: '$$\\text{Area} = \\frac{1}{2}bh$$', preview: '\\text{Area} = \\frac{1}{2}bh' },
            { name: 'বৃত্তের ক্ষেত্রফল', template: '$$A = \\pi r^2$$', preview: 'A = \\pi r^2' },
            { name: 'কোণ (Angle)', template: '$\\angle ABC = 90^\\circ$', preview: '\\angle ABC = 90^\\circ' },
        ]
    },
    {
        category: 'পদার্থবিজ্ঞান ও ভেক্টর (Physics & Vectors)',
        items: [
            { name: 'ভেক্টর ডট গুণন', template: '$$\\vec{A} \\cdot \\vec{B} = AB \\cos\\theta$$', preview: '\\vec{A} \\cdot \\vec{B} = AB \\cos\\theta' },
            { name: 'ভেক্টর ক্রস গুণন', template: '$$\\vec{A} \\times \\vec{B} = AB \\sin\\theta \\hat{\\eta}$$', preview: '\\vec{A} \\times \\vec{B} = AB \\sin\\theta \\hat{\\eta}' },
            { name: 'একক ভেক্টর', template: '$\\hat{i}, \\hat{j}, \\hat{k}$', preview: '\\hat{i}, \\hat{j}, \\hat{k}' },
            { name: 'নিউটনের ২য় সূত্র', template: '$$\\vec{F} = m\\vec{a}$$', preview: '\\vec{F} = m\\vec{a}' },
            { name: 'গতি সমীকরণ (১)', template: '$$v = u + at$$', preview: 'v = u + at' },
            { name: 'গতি সমীকরণ (২)', template: '$$s = ut + \\frac{1}{2}at^2$$', preview: 's = ut + \\frac{1}{2}at^2' },
            { name: 'গতি সমীকরণ (৩)', template: '$$v^2 = u^2 + 2as$$', preview: 'v^2 = u^2 + 2as' },
            { name: 'গতিশক্তি', template: '$$E_k = \\frac{1}{2}mv^2$$', preview: 'E_k = \\frac{1}{2}mv^2' },
        ]
    },
    {
        category: 'ম্যাট্রিক্স ও সেট (Matrices & Sets)',
        items: [
            { name: '২x২ ম্যাট্রিক্স', template: '$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$', preview: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
            { name: '২x২ নির্ণায়ক (Determinant)', template: '$$\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}$$', preview: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
            { name: 'সেট ও উপাদান', template: '$x \\in A \\cup B$', preview: 'x \\in A \\cup B' },
        ]
    }
];

export const WordMathEditor: React.FC<WordMathEditorProps> = ({
    value,
    onChange,
    label,
    placeholder = 'এখানে প্রশ্ন লিখুন...',
    minHeight = '140px',
    required = false,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // View Mode: 'split' | 'editor' | 'preview'
    const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
    const [activeTab, setActiveTab] = useState<'home' | 'equation' | 'symbols'>('home');
    const [equationModalOpen, setEquationModalOpen] = useState(false);

    // Custom Equation Builder State
    const [customLatex, setCustomLatex] = useState('');
    const [isBlockMath, setIsBlockMath] = useState(false);

    // Insert text at cursor position in textarea
    const insertAtCursor = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = value.substring(start, end);
        const replacement = before + selected + after;
        const newValue = value.substring(0, start) + replacement + value.substring(end);

        onChange(newValue);

        setTimeout(() => {
            textarea.focus();
            const newCursor = start + before.length + selected.length;
            textarea.setSelectionRange(newCursor, newCursor);
        }, 10);
    };

    // Text formatting actions
    const handleBold = () => insertAtCursor('<b>', '</b>');
    const handleItalic = () => insertAtCursor('<i>', '</i>');
    const handleUnderline = () => insertAtCursor('<u>', '</u>');
    const handleStrike = () => insertAtCursor('<s>', '</s>');
    const handleSuperscript = () => insertAtCursor('<sup>', '</sup>');
    const handleSubscript = () => insertAtCursor('<sub>', '</sub>');
    const handleBullet = () => insertAtCursor('\n• ');
    const handleNumbered = () => insertAtCursor('\n1. ');
    const handleEquationWrap = () => insertAtCursor('$', '$');
    const handleBlockEquationWrap = () => insertAtCursor('$$\n', '\n$$');

    // Insert Symbol
    const handleInsertSymbol = (symbolLatex: string) => {
        insertAtCursor(symbolLatex);
    };

    // Insert Template
    const handleInsertTemplate = (template: string) => {
        insertAtCursor(template + ' ');
        setEquationModalOpen(false);
    };

    // Insert Custom Equation
    const handleInsertCustomEquation = () => {
        if (!customLatex.trim()) return;
        const wrapped = isBlockMath ? `$$\n${customLatex.trim()}\n$$ ` : `$${customLatex.trim()}$ `;
        insertAtCursor(wrapped);
        setCustomLatex('');
        setEquationModalOpen(false);
    };

    return (
        <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm transition-all focus-within:ring-2 focus-within:ring-sky-500/40 focus-within:border-sky-500">
            {/* Top Microsoft Word-Style Banner */}
            <div className="bg-gradient-to-r from-[#204070] to-[#2b579a] text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-blue-900/40">
                <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white text-[#2b579a] text-xs font-black rounded flex items-center justify-center font-serif">
                        W
                    </span>
                    <span className="text-xs font-bold tracking-tight">
                        {label || 'প্রশ্ন এডিটর (Microsoft Word Math Style)'}
                        {required && <span className="text-rose-300 ml-1">*</span>}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-[10px] font-semibold text-blue-100 hidden sm:inline-block">
                        LaTeX Equation Engine
                    </span>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center bg-blue-950/60 p-0.5 rounded-lg border border-blue-400/20 text-xs">
                    <button
                        type="button"
                        onClick={() => setViewMode('split')}
                        className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition-colors ${
                            viewMode === 'split' ? 'bg-white text-slate-800 shadow-xs' : 'text-blue-100 hover:text-white'
                        }`}
                        title="এডিটর ও স্টুডেন্ট প্রিভিউ পাশাপাশি দেখুন"
                    >
                        <Columns className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">স্প্লিট ভিউ (Split)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('editor')}
                        className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition-colors ${
                            viewMode === 'editor' ? 'bg-white text-slate-800 shadow-xs' : 'text-blue-100 hover:text-white'
                        }`}
                        title="শুধু এডিটর"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">এডিটর (Editor)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('preview')}
                        className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition-colors ${
                            viewMode === 'preview' ? 'bg-white text-slate-800 shadow-xs' : 'text-blue-100 hover:text-white'
                        }`}
                        title="শিক্ষার্থীদের ভিউ"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">প্রিভিউ (Preview)</span>
                    </button>
                </div>
            </div>

            {/* Word Ribbon Toolbar */}
            <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 px-3 py-1.5 space-y-1.5">
                {/* Ribbon Tabs Header */}
                <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-700/80 pb-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('home')}
                        className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
                            activeTab === 'home'
                                ? 'bg-white dark:bg-slate-900 text-[#2b579a] dark:text-sky-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        হোম (Text Tools)
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('equation')}
                        className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                            activeTab === 'equation'
                                ? 'bg-white dark:bg-slate-900 text-[#2b579a] dark:text-sky-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <Calculator className="w-3.5 h-3.5 text-sky-500" />
                        <span>সমীকরণ ও গণিত (Equations)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('symbols')}
                        className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
                            activeTab === 'symbols'
                                ? 'bg-white dark:bg-slate-900 text-[#2b579a] dark:text-sky-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        প্রতীকমালা (Symbols)
                    </button>

                    <div className="ml-auto text-[11px] text-slate-500 hidden md:block">
                        গণিত ও সূত্র লেখার জন্য <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-sky-600">$...$</code> ব্যবহার করুন
                    </div>
                </div>

                {/* Tab: HOME (Text Formatting) */}
                {activeTab === 'home' && (
                    <div className="flex flex-wrap items-center gap-1 text-slate-700 dark:text-slate-300">
                        {/* Font Styles */}
                        <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={handleBold}
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                title="Bold (বোল্ড)"
                            >
                                <Bold className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleItalic}
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                title="Italic (ইটালিক)"
                            >
                                <Italic className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleUnderline}
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                title="Underline (আন্ডারলাইন)"
                            >
                                <Underline className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleStrike}
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                title="Strikethrough"
                            >
                                <Strikethrough className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Subscript & Superscript */}
                        <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={handleSuperscript}
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                title="Superscript / ঘাত (x²)"
                            >
                                <Superscript className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleSubscript}
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                title="Subscript / সাবস্ক্রিপ্ট (x₂)"
                            >
                                <Subscript className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Lists */}
                        <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={handleBullet}
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                title="Bullet List"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleNumbered}
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                title="Numbered List"
                            >
                                <ListOrdered className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quick Math Wrappers */}
                        <div className="flex items-center gap-1 pl-2">
                            <button
                                type="button"
                                onClick={handleEquationWrap}
                                className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800 flex items-center gap-1"
                                title="ইনলাইন সমীকরণ তৈরি করুন ($...$)"
                            >
                                <span>∑ ইনলাইন Math ($x$)</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleBlockEquationWrap}
                                className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 text-violet-700 dark:text-violet-300 text-xs font-bold border border-violet-200 dark:border-violet-800 flex items-center gap-1"
                                title="বড় সমীকরণ ব্লক তৈরি করুন ($$...$$)"
                            >
                                <span>ব্লক সমীকরণ ($$)</span>
                            </button>
                        </div>

                        {/* Big Equation Modal Button */}
                        <button
                            type="button"
                            onClick={() => setEquationModalOpen(true)}
                            className="ml-auto px-3 py-1 rounded-lg bg-[#2b579a] hover:bg-[#204070] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                        >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>ইকুয়েশন বিল্ডার (Equation)</span>
                        </button>
                    </div>
                )}

                {/* Tab: EQUATIONS (Quick Formula Inserter) */}
                {activeTab === 'equation' && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <button
                            type="button"
                            onClick={() => insertAtCursor('$\\frac{a}{b}$ ')}
                            className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-sky-50 text-slate-800 dark:text-slate-200 font-serif font-bold rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                            title="ভগ্নাংশ: \frac{a}{b}"
                        >
                            a/b (ভগ্নাংশ)
                        </button>
                        <button
                            type="button"
                            onClick={() => insertAtCursor('$\\sqrt{x}$ ')}
                            className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-sky-50 text-slate-800 dark:text-slate-200 font-serif font-bold rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                            title="বর্গমূল: \sqrt{x}"
                        >
                            √x (বর্গমূল)
                        </button>
                        <button
                            type="button"
                            onClick={() => insertAtCursor('$\\sqrt[n]{x}$ ')}
                            className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-sky-50 text-slate-800 dark:text-slate-200 font-serif font-bold rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                            ⁿ√x (মূল)
                        </button>
                        <button
                            type="button"
                            onClick={() => insertAtCursor('$\\int_{a}^{b} f(x) dx$ ')}
                            className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-sky-50 text-slate-800 dark:text-slate-200 font-serif font-bold rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                            ∫ সমাকলন
                        </button>
                        <button
                            type="button"
                            onClick={() => insertAtCursor('$\\lim_{x \\to 0} f(x)$ ')}
                            className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-sky-50 text-slate-800 dark:text-slate-200 font-serif font-bold rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                            lim লিমিট
                        </button>
                        <button
                            type="button"
                            onClick={() => insertAtCursor('$\\sum_{i=1}^{n}$ ')}
                            className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-sky-50 text-slate-800 dark:text-slate-200 font-serif font-bold rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                            ∑ সামেশন
                        </button>
                        <button
                            type="button"
                            onClick={() => insertAtCursor('$\\vec{F} = m\\vec{a}$ ')}
                            className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-sky-50 text-slate-800 dark:text-slate-200 font-serif font-bold rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                            F⃗ = ma⃗ (ভেক্টর)
                        </button>
                        <button
                            type="button"
                            onClick={() => insertAtCursor('$\\sin^2\\theta + \\cos^2\\theta = 1$ ')}
                            className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-sky-50 text-slate-800 dark:text-slate-200 font-serif font-bold rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                            sin²θ + cos²θ
                        </button>
                        <button
                            type="button"
                            onClick={() => insertAtCursor('$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$ ')}
                            className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-sky-50 text-slate-800 dark:text-slate-200 font-serif font-bold rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                            [ম্যাট্রিক্স]
                        </button>

                        <button
                            type="button"
                            onClick={() => setEquationModalOpen(true)}
                            className="ml-auto px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                        >
                            <span>সকল সমীকরণ টেমপ্লেট...</span>
                        </button>
                    </div>
                )}

                {/* Tab: SYMBOLS (Quick Symbol Picker) */}
                {activeTab === 'symbols' && (
                    <div className="flex flex-wrap items-center gap-1">
                        {MATH_SYMBOLS.map((s, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleInsertSymbol(`$${s.latex}$`)}
                                className="w-7 h-7 bg-white dark:bg-slate-900 hover:bg-sky-100 hover:text-sky-700 text-slate-800 dark:text-slate-200 font-serif font-semibold text-sm rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors shadow-xs"
                                title={`ইনসার্ট করুন: ${s.latex}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Editor & Preview Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                {/* Editor Column */}
                {(viewMode === 'split' || viewMode === 'editor') && (
                    <div className={`${viewMode === 'editor' ? 'col-span-full' : ''} flex flex-col`}>
                        <div className="bg-slate-50/50 dark:bg-slate-950/40 px-3 py-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <Edit3 className="w-3.5 h-3.5 text-sky-500" />
                                <span>ওয়ার্ড ডকুমেন্ট এডিটর</span>
                            </span>
                            <span>{value.length} অক্ষর</span>
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            placeholder={placeholder}
                            required={required}
                            style={{ minHeight }}
                            className="w-full p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-sans focus:outline-none resize-y leading-relaxed"
                        />
                    </div>
                )}

                {/* Preview Column (Student View) */}
                {(viewMode === 'split' || viewMode === 'preview') && (
                    <div className={`${viewMode === 'preview' ? 'col-span-full' : ''} flex flex-col bg-slate-50/30 dark:bg-slate-950/30`}>
                        <div className="bg-slate-50 dark:bg-slate-950/60 px-3 py-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <Eye className="w-3.5 h-3.5" />
                                <span>লাইভ গণিত ও প্রশ্ন প্রিভিউ (Live Preview)</span>
                            </span>
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                                শিক্ষার্থী যেমন দেখবে
                            </span>
                        </div>
                        <div
                            style={{ minHeight }}
                            className="p-4 overflow-y-auto text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
                        >
                            {value.trim() ? (
                                <MathView content={value} />
                            ) : (
                                <div className="text-slate-400 italic text-xs">
                                    প্রশ্ন লেখার সাথে সাথে এখানে লাইভ সমীকরণ প্রিভিউ দেখতে পাবেন...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Equation Palette Modal */}
            {equationModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                                    <Calculator className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        গাণিতিক সমীকরণ লাইব্রেরি (Math Equation Palette)
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        যেকোনো সূত্রে ক্লিক করে সরাসরি প্রশ্নে যোগ করুন
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEquationModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Custom Equation Tester */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <span>কাস্টম LaTeX সমীকরণ লিখুন</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isBlockMath}
                                        onChange={e => setIsBlockMath(e.target.checked)}
                                        className="rounded text-sky-600 focus:ring-sky-500"
                                    />
                                    <span>ব্লক ডিসপ্লে মোড ($$)</span>
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={customLatex}
                                    onChange={e => setCustomLatex(e.target.value)}
                                    placeholder="যেমন: \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} অথবা x^2 + y^2 = r^2"
                                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleInsertCustomEquation}
                                    disabled={!customLatex.trim()}
                                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>যোগ করুন</span>
                                </button>
                            </div>

                            {/* Live KaTeX Preview of Custom Input */}
                            {customLatex.trim() && (
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-sky-100 dark:border-sky-900/60">
                                    <div className="text-[10px] font-bold uppercase text-sky-600 mb-1">প্রিভিউ:</div>
                                    <MathView content={isBlockMath ? `$$${customLatex}$$` : `$${customLatex}$`} />
                                </div>
                            )}
                        </div>

                        {/* Categorized Formula Templates */}
                        <div className="space-y-5">
                            {EQUATION_TEMPLATES.map((cat, cIdx) => (
                                <div key={cIdx} className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        {cat.category}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                        {cat.items.map((item, iIdx) => (
                                            <button
                                                key={iIdx}
                                                type="button"
                                                onClick={() => handleInsertTemplate(item.template)}
                                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-sm text-left transition-all space-y-1.5 group"
                                            >
                                                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-sky-600">
                                                    {item.name}
                                                </div>
                                                <div className="overflow-x-auto py-1 text-slate-900 dark:text-white">
                                                    <MathView content={`$${item.preview}$`} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setEquationModalOpen(false)}
                                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200"
                            >
                                বন্ধ করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

