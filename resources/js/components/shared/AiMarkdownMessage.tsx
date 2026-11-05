import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface AiMarkdownMessageProps {
    content: string;
    className?: string;
}

export const AiMarkdownMessage: React.FC<AiMarkdownMessageProps> = ({ content, className = '' }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopyCode = (code: string, index: number) => {
        navigator.clipboard.writeText(code);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Parse text into blocks: code blocks, headers, lists, and paragraphs
    const parseBlocks = (text: string) => {
        const blocks: React.ReactNode[] = [];
        const lines = text.split('\n');
        let inCodeBlock = false;
        let codeLang = '';
        let codeBuffer: string[] = [];
        let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null;
        let blockIndex = 0;

        const flushList = () => {
            if (listBuffer) {
                const isUl = listBuffer.type === 'ul';
                const Tag = isUl ? 'ul' : 'ol';
                blocks.push(
                    <Tag
                        key={`list-${blockIndex++}`}
                        className={`my-2 pl-5 space-y-1 ${isUl ? 'list-disc' : 'list-decimal'} text-slate-800 dark:text-slate-200`}
                    >
                        {listBuffer.items.map((item, i) => (
                            <li key={i} className="leading-relaxed">
                                {formatInline(item)}
                            </li>
                        ))}
                    </Tag>
                );
                listBuffer = null;
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Code block delimiter
            if (line.startsWith('```')) {
                flushList();
                if (inCodeBlock) {
                    // closing code block
                    const codeString = codeBuffer.join('\n');
                    const currentIdx = blockIndex++;
                    blocks.push(
                        <div key={`code-${currentIdx}`} className="my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 text-slate-100 font-mono text-xs shadow-sm">
                            <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                                <span>{codeLang || 'code'}</span>
                                <button
                                    type="button"
                                    onClick={() => handleCopyCode(codeString, currentIdx)}
                                    className="flex items-center gap-1 text-[11px] hover:text-white transition-colors cursor-pointer"
                                >
                                    {copiedIndex === currentIdx ? (
                                        <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span className="text-emerald-400">কপি হয়েছে</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            <span>কপি</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <pre className="p-3.5 overflow-x-auto leading-relaxed">{codeString}</pre>
                        </div>
                    );
                    codeBuffer = [];
                    inCodeBlock = false;
                    codeLang = '';
                } else {
                    // opening code block
                    inCodeBlock = true;
                    codeLang = line.replace('```', '').trim();
                }
                continue;
            }

            if (inCodeBlock) {
                codeBuffer.push(line);
                continue;
            }

            // Headers
            if (line.startsWith('### ')) {
                flushList();
                blocks.push(
                    <h4 key={`h3-${blockIndex++}`} className="font-bold text-sm text-slate-900 dark:text-white mt-3 mb-1">
                        {formatInline(line.replace('### ', ''))}
                    </h4>
                );
                continue;
            }
            if (line.startsWith('## ')) {
                flushList();
                blocks.push(
                    <h3 key={`h2-${blockIndex++}`} className="font-bold text-base text-slate-900 dark:text-white mt-4 mb-1.5 border-b border-slate-200 dark:border-slate-800 pb-1">
                        {formatInline(line.replace('## ', ''))}
                    </h3>
                );
                continue;
            }
            if (line.startsWith('# ')) {
                flushList();
                blocks.push(
                    <h2 key={`h1-${blockIndex++}`} className="font-extrabold text-lg text-slate-900 dark:text-white mt-4 mb-2">
                        {formatInline(line.replace('# ', ''))}
                    </h2>
                );
                continue;
            }

            // Blockquote
            if (line.startsWith('> ')) {
                flushList();
                blocks.push(
                    <blockquote key={`bq-${blockIndex++}`} className="my-2 pl-3.5 border-l-3 border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 py-1.5 pr-2 rounded-r-lg text-xs italic text-slate-700 dark:text-slate-300">
                        {formatInline(line.replace('> ', ''))}
                    </blockquote>
                );
                continue;
            }

            // Unordered list (- or *)
            const ulMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
            if (ulMatch) {
                if (!listBuffer || listBuffer.type !== 'ul') {
                    flushList();
                    listBuffer = { type: 'ul', items: [] };
                }
                listBuffer.items.push(ulMatch[2]);
                continue;
            }

            // Ordered list (1., 2.)
            const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
            if (olMatch) {
                if (!listBuffer || listBuffer.type !== 'ol') {
                    flushList();
                    listBuffer = { type: 'ol', items: [] };
                }
                listBuffer.items.push(olMatch[2]);
                continue;
            }

            // Empty line
            if (!line.trim()) {
                flushList();
                continue;
            }

            // Normal paragraph line
            flushList();
            blocks.push(
                <p key={`p-${blockIndex++}`} className="my-1.5 leading-relaxed text-slate-800 dark:text-slate-200">
                    {formatInline(line)}
                </p>
            );
        }

        flushList();

        // Handle unclosed code block if any
        if (inCodeBlock && codeBuffer.length > 0) {
            const codeString = codeBuffer.join('\n');
            blocks.push(
                <div key={`code-${blockIndex++}`} className="my-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs">
                    <pre className="p-3.5 overflow-x-auto">{codeString}</pre>
                </div>
            );
        }

        return blocks;
    };

    // Format inline markdown: bold, italic, inline code, and math ($...$)
    const formatInline = (text: string): React.ReactNode[] => {
        // Tokenize by inline code `...`, bold **...**, and math $...$
        const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$[^$]+\$)/g;
        const parts = text.split(regex);

        return parts.map((part, index) => {
            if (!part) return null;

            // Inline code `...`
            if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
                return (
                    <code
                        key={index}
                        className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 font-mono text-[11px] text-sky-700 dark:text-sky-300 border border-slate-300/60 dark:border-slate-700"
                    >
                        {part.slice(1, -1)}
                    </code>
                );
            }

            // Bold **...**
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                return (
                    <strong key={index} className="font-bold text-slate-900 dark:text-white">
                        {part.slice(2, -2)}
                    </strong>
                );
            }

            // Italic *...*
            if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
                return (
                    <em key={index} className="italic text-slate-800 dark:text-slate-200">
                        {part.slice(1, -1)}
                    </em>
                );
            }

            // Math formula $...$
            if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
                return (
                    <span
                        key={index}
                        className="px-1 py-0.2 mx-0.5 font-serif italic text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 rounded border border-indigo-200/50 dark:border-indigo-800/50"
                    >
                        {part.slice(1, -1)}
                    </span>
                );
            }

            return part;
        });
    };

    return <div className={`text-xs sm:text-sm ${className}`}>{parseBlocks(content)}</div>;
};

