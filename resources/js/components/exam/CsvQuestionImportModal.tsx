import React, { useState, useRef } from 'react';
import { apiClient } from '../../api/client';
import { ExamQuestion } from '../../types';
import { 
    Upload, 
    Download, 
    FileSpreadsheet, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    X, 
    HelpCircle, 
    ChevronDown, 
    ChevronUp,
    FileText,
    Check,
    Eye
} from 'lucide-react';

interface CsvQuestionImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    examId: number | string;
    onSuccess: (newQuestions: ExamQuestion[], totalMarks: number) => void;
}

interface PreviewRow {
    question_text: string;
    question_type: string;
    mark: string;
    negative_mark: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
}

const SAMPLE_CSV_CONTENT = `\uFEFFquestion_text,question_type,mark,negative_mark,option_a,option_b,option_c,option_d,option_e,correct_answer,explanation
"বাংলাদেশের রাজধানী কোথায়?",single_choice,1,0.25,"ঢাকা","চট্টগ্রাম","খুলনা","রাজশাহী",,"A","বাংলাদেশের রাজধানী হলো ঢাকা।"
"নিচের কোনগুলো মৌলিক সংখ্যা (Prime Number)?",multiple_choice,2,0.5,"2","3","4","6",,"A,B","২ এবং ৩ হলো মৌলিক সংখ্যা।"
"আলোর প্রতিসরণ কাকে বলে? ব্যাখ্যা করো।",written_paper,5,0,,,,,,,"আলো এক স্বচ্ছ মাধ্যম থেকে অন্য স্বচ্ছ মাধ্যমে প্রবেশের সময় দিক পরিবর্তনকে আলোর প্রতিসরণ বলে।"
"সূর্য একটি _____।",fill_in_the_blank,1,0,,,,,,নক্ষত্র,"সূর্য একটি উজ্জ্বল মাঝারি আকারের নক্ষত্র।"`;

export const CsvQuestionImportModal: React.FC<CsvQuestionImportModalProps> = ({
    isOpen,
    onClose,
    examId,
    onSuccess,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
    const [totalParsedRows, setTotalParsedRows] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    if (!isOpen) return null;

    // Download Sample CSV template
    const handleDownloadTemplate = () => {
        try {
            const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'exam_questions_sample_template.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            window.open(`/api/exams/csv-template`, '_blank');
        }
    };

    // Parse CSV locally for instant preview
    const parseCsvForPreview = (text: string) => {
        // Strip BOM
        let clean = text.replace(/^\uFEFF/, '');
        
        // Simple robust CSV row splitter that accounts for quotes
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentCell = '';
        let inQuotes = false;

        for (let i = 0; i < clean.length; i++) {
            const char = clean[i];
            const nextChar = clean[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentCell += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                currentRow.push(currentCell.trim());
                currentCell = '';
            } else if ((char === '\r' || char === '\n') && !inQuotes) {
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
                currentRow.push(currentCell.trim());
                if (currentRow.some(c => c !== '')) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            if (currentRow.some(c => c !== '')) {
                rows.push(currentRow);
            }
        }

        if (rows.length <= 1) {
            setPreviewRows([]);
            setTotalParsedRows(0);
            return;
        }

        const header = rows[0].map(h => h.toLowerCase().replace(/[\s\-\.]/g, '_'));
        const findCol = (aliases: string[]) => {
            for (const a of aliases) {
                const idx = header.indexOf(a);
                if (idx !== -1) return idx;
            }
            return -1;
        };

        const colText = findCol(['question_text', 'question', 'title', 'text', 'প্রশ্ন']);
        const colType = findCol(['question_type', 'type', 'ধরণ']);
        const colMark = findCol(['mark', 'marks', 'point', 'নম্বর']);
        const colNegMark = findCol(['negative_mark', 'negative_marks', 'নেগেটিভ_মার্ক']);
        const colAns = findCol(['correct_answer', 'correct', 'answer', 'সঠিক_উত্তর']);
        const colExp = findCol(['explanation', 'solution', 'ব্যাখ্যা']);

        const colA = findCol(['option_a', 'opt_a', 'a', 'অপশন_ক']);
        const colB = findCol(['option_b', 'opt_b', 'b', 'অপশন_খ']);
        const colC = findCol(['option_c', 'opt_c', 'c', 'অপশন_গ']);
        const colD = findCol(['option_d', 'opt_d', 'd', 'অপশন_ঘ']);
        const colE = findCol(['option_e', 'opt_e', 'e', 'অপশন_ঙ']);

        const dataRows = rows.slice(1);
        setTotalParsedRows(dataRows.length);

        const previews: PreviewRow[] = dataRows.slice(0, 5).map(r => {
            const opts: string[] = [];
            [colA, colB, colC, colD, colE].forEach(col => {
                if (col !== -1 && r[col]) opts.push(r[col]);
            });

            return {
                question_text: colText !== -1 ? r[colText] : r[0] || '',
                question_type: colType !== -1 && r[colType] ? r[colType] : (opts.length > 0 ? 'single_choice' : 'written_paper'),
                mark: colMark !== -1 && r[colMark] ? r[colMark] : '1',
                negative_mark: colNegMark !== -1 && r[colNegMark] ? r[colNegMark] : '0',
                options: opts,
                correct_answer: colAns !== -1 && r[colAns] ? r[colAns] : '—',
                explanation: colExp !== -1 && r[colExp] ? r[colExp] : '',
            };
        });

        setPreviewRows(previews);
    };

    const handleFileChange = (file: File) => {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            setError('অনুগ্রহ করে একটি .csv ফাইল নির্বাচন করুন।');
            return;
        }

        setError(null);
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) {
                parseCsvForPreview(content);
            }
        };
        reader.readAsText(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleSubmitUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('অনুগ্রহ করে একটি CSV ফাইল আপলোড করুন।');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await apiClient.post(`/exams/${examId}/import-csv`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSuccessMessage(res.data.message || 'প্রশ্ন সফলভাবে ইম্পোর্ট করা হয়েছে!');
            if (res.data.questions) {
                onSuccess(res.data.questions, res.data.exam_total_marks);
            }

            setTimeout(() => {
                onClose();
            }, 1800);
        } catch (err: any) {
            setError(err.response?.data?.message || 'CSV ফাইল আপলোড করতে সমস্যা হয়েছে। ফাইলের ফরম্যাট ঠিক আছে কিনা যাচাই করুন।');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
                            <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">CSV ফাইল থেকে প্রশ্ন ইম্পোর্ট করুন</h2>
                            <p className="text-xs text-emerald-100 mt-0.5">
                                একসাথে অসংখ্য প্রশ্ন CSV ফাইলের মাধ্যমে কয়েক সেকেন্ডে আপলোড করুন
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Step 1: Download Sample Template Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-sky-50/60 dark:from-slate-850 dark:to-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    নমুনা CSV টেমপ্লেট ডাউনলোড করুন
                                </h3>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 pl-8">
                                এই টেমপ্লেট ফাইলে প্রশ্ন, অপশন, মার্ক ও নেগেটিভ মার্ক সাজিয়ে নিয়ে সহজেই আপলোড করতে পারবেন।
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
                        >
                            <Download className="w-4 h-4" />
                            <span>টেমপ্লেট ডাউনলোড (.csv)</span>
                        </button>
                    </div>

                    {/* Format Guide Accordion */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowGuide(!showGuide)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-sky-500" />
                                <span>CSV ফাইলের কলামের বিবরণ ও নিয়মাবলী (দেখুন)</span>
                            </span>
                            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showGuide && (
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <strong className="text-slate-900 dark:text-white font-mono">question_text:</strong> প্রশ্নের বিবরণ (আবশ্যক)
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <strong className="text-slate-900 dark:text-white font-mono">question_type:</strong> single_choice / multiple_choice / written_paper / fill_in_the_blank
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <strong className="text-slate-900 dark:text-white font-mono">mark:</strong> প্রশ্নের পূর্ণমান (যেমন: 1, 2, 5)
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <strong className="text-slate-900 dark:text-white font-mono">negative_mark:</strong> ভুল উত্তরের জন্য কাটা মার্ক (যেমন: 0.25, 0.5 বা 0)
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <strong className="text-slate-900 dark:text-white font-mono">option_a ... option_e:</strong> MCQ অপশনগুলো
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <strong className="text-slate-900 dark:text-white font-mono">correct_answer:</strong> সঠিক উত্তর (যেমন: A অথবা B অথবা A,B অথবা টেক্সট)
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: File Upload Zone */}
                    <form onSubmit={handleSubmitUpload} className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                            <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                আপনার তৈরি করা CSV ফাইলটি আপলোড করুন
                            </label>
                        </div>

                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                                dragActive
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                                    : selectedFile
                                    ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/20'
                                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/60 dark:bg-slate-850/40'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                                className="hidden"
                            />

                            <div className="flex flex-col items-center justify-center space-y-2">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700">
                                    <Upload className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                {selectedFile ? (
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-center gap-1.5">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                            <span>{selectedFile.name}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {(selectedFile.size / 1024).toFixed(1)} KB • মোট প্রশ্ন পাওয়া গেছে: <strong>{totalParsedRows}</strong> টি
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            এখানে ক্লিক করে ফাইল সিলেক্ট করুন অথবা ড্র্যাগ করে ড্রপ করুন
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">শুধুমাত্র .csv ফরম্যাট সমর্থিত</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preview Table if file loaded */}
                        {previewRows.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                                        <Eye className="w-3.5 h-3.5 text-sky-500" />
                                        <span>প্রশ্নের প্রিভিউ (প্রথম {previewRows.length} টি প্রশ্ন)</span>
                                    </span>
                                    <span>মোট প্রশ্ন: {totalParsedRows} টি</span>
                                </div>
                                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-48">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 sticky top-0">
                                            <tr>
                                                <th className="p-2">#</th>
                                                <th className="p-2">প্রশ্ন</th>
                                                <th className="p-2">টাইপ</th>
                                                <th className="p-2">মার্ক</th>
                                                <th className="p-2">নেগেটিভ</th>
                                                <th className="p-2">অপশন সংখ্যা</th>
                                                <th className="p-2">সঠিক উত্তর</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {previewRows.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                                    <td className="p-2 font-bold text-slate-400">{idx + 1}</td>
                                                    <td className="p-2 font-medium max-w-xs truncate">{row.question_text}</td>
                                                    <td className="p-2">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                                                            {row.question_type}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 font-mono font-bold text-emerald-600">{row.mark}</td>
                                                    <td className="p-2 font-mono text-rose-500">{row.negative_mark}</td>
                                                    <td className="p-2">{row.options.length} টি</td>
                                                    <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{row.correct_answer}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success Alert */}
                        {successMessage && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={uploading}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                            >
                                বাতিল
                            </button>
                            <button
                                type="submit"
                                disabled={uploading || !selectedFile}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>প্রশ্ন ইম্পোর্ট হচ্ছে...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        <span>প্রশ্ন ইম্পোর্ট সম্পন্ন করুন ({totalParsedRows} টি)</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
