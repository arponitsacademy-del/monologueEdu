import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
    content?: string | null;
    className?: string;
    inline?: boolean;
}

/**
 * Parses and renders LaTeX equations ($...$ and $$...$$) alongside rich text formatting
 */
export const renderMathAndHtml = (text?: string | null): string => {
    if (!text) return '';

    // 1. Process block math: $$...$$
    let processed = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        try {
            return `<div class="katex-display-wrapper my-2 overflow-x-auto py-1">${katex.renderToString(math.trim(), {
                displayMode: true,
                throwOnError: false,
            })}</div>`;
        } catch {
            return `<code class="text-rose-500 font-mono text-xs">$$${math}$$</code>`;
        }
    });

    // 2. Process block math: \[...\]
    processed = processed.replace(/\\\[([\s\S]+?)\\\]/g, (_, math) => {
        try {
            return `<div class="katex-display-wrapper my-2 overflow-x-auto py-1">${katex.renderToString(math.trim(), {
                displayMode: true,
                throwOnError: false,
            })}</div>`;
        } catch {
            return `<code class="text-rose-500 font-mono text-xs">\\[${math}\\]</code>`;
        }
    });

    // 3. Process inline math: $...$
    processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try {
            return `<span class="katex-inline-wrapper mx-0.5 inline-block align-middle">${katex.renderToString(math.trim(), {
                displayMode: false,
                throwOnError: false,
            })}</span>`;
        } catch {
            return `<code class="text-rose-500 font-mono text-xs">$${math}$</code>`;
        }
    });

    // 4. Process inline math: \(...\)
    processed = processed.replace(/\\\(([\s\S]+?)\\\)/g, (_, math) => {
        try {
            return `<span class="katex-inline-wrapper mx-0.5 inline-block align-middle">${katex.renderToString(math.trim(), {
                displayMode: false,
                throwOnError: false,
            })}</span>`;
        } catch {
            return `<code class="text-rose-500 font-mono text-xs">\\(${math}\\)</code>`;
        }
    });

    // 5. Convert simple newlines to <br/> if not wrapped in major block HTML tags
    if (!/<(p|div|ul|ol|li|table|h[1-6])\b[^>]*>/i.test(processed)) {
        processed = processed.replace(/\n/g, '<br/>');
    }

    return processed;
};

export const MathView: React.FC<MathViewProps> = ({ content, className = '', inline = false }) => {
    const html = useMemo(() => renderMathAndHtml(content), [content]);

    if (!content) return null;

    if (inline) {
        return (
            <span
                className={`math-rendered-content ${className}`}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }

    return (
        <div
            className={`math-rendered-content leading-relaxed ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

