import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { CustomPage } from '../../types';
import { PageBlockRenderer } from '../../components/builder/PageBlockRenderer';
import { FileText, ArrowLeft, AlertCircle } from 'lucide-react';

interface CustomPageViewProps {
    slugOverride?: string;
}

export const CustomPageView: React.FC<CustomPageViewProps> = ({ slugOverride }) => {
    const params = useParams<{ slug?: string }>();
    const location = useLocation();

    // Determine slug
    let slug = slugOverride || params.slug;
    if (!slug) {
        // e.g. /privacy-policy -> privacy-policy
        slug = location.pathname.replace(/^\//, '').replace(/\/$/, '');
    }

    const [page, setPage] = useState<CustomPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchPage = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const res = await apiClient.get(`/pages/${slug}`);
                setPage(res.data.page);
                if (res.data.page?.meta_title) {
                    document.title = res.data.page.meta_title;
                }
            } catch (err: any) {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchPage();
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (notFound || !page) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">পেজটি পাওয়া যায়নি (404)</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
                    আপনি যে পেজটিতে প্রবেশ করতে চেয়েছেন তা বিদ্যমান নেই অথবা অপ্রকাশিত অবস্থায় রয়েছে।
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md hover:bg-sky-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>হোম পেজে ফিরে যান</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Scoped Page CSS */}
            {page.custom_css && <style>{page.custom_css}</style>}

            {/* Render Page Blocks */}
            <div className="space-y-0">
                {Array.isArray(page.blocks) && page.blocks.map((block) => (
                    <PageBlockRenderer key={block.id} block={block} isBuilder={false} />
                ))}
            </div>
        </div>
    );
};
