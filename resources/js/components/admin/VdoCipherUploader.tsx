import React, { useState, useRef, useEffect } from 'react';
import { 
    UploadCloud, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    FileVideo, 
    ShieldCheck, 
    Copy, 
    Check, 
    Info, 
    Clock, 
    HardDrive, 
    Zap, 
    ChevronDown, 
    ChevronUp
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface VdoCipherUploaderProps {
    initialVideoUrl?: string;
    onVideoUploaded: (videoUrl: string) => void;
    onDurationDetected?: (durationMinutes: number) => void;
    lessonTitle?: string;
}

export const VdoCipherUploader: React.FC<VdoCipherUploaderProps> = ({
    initialVideoUrl = '',
    onVideoUploaded,
    onDurationDetected,
    lessonTitle = 'Course Lesson Video'
}) => {
    const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileDuration, setFileDuration] = useState<number | null>(null);

    const [status, setStatus] = useState<'idle' | 'requesting' | 'uploading' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showDataTips, setShowDataTips] = useState(false);

    // Live upload stats
    const [uploadSpeed, setUploadSpeed] = useState<string>('');
    const [etaText, setEtaText] = useState<string>('');
    const [uploadedBytesText, setUploadedBytesText] = useState<string>('');

    // Direct ID input mode
    const [manualIdInput, setManualIdInput] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const xhrRef = useRef<XMLHttpRequest | null>(null);

    useEffect(() => {
        setVideoUrl(initialVideoUrl);
        if (initialVideoUrl && (initialVideoUrl.startsWith('vdocipher://') || initialVideoUrl.startsWith('vdocipher:'))) {
            const raw = initialVideoUrl.replace('vdocipher://', '').replace('vdocipher:', '').trim();
            setUploadedVideoId(raw);
        }
    }, [initialVideoUrl]);

    const formatBytes = (bytes: number): string => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const formatDuration = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        if (m === 0) return `${s} সেকেন্ড`;
        return `${m} মিনিট ${s > 0 ? `${s} সে.` : ''}`;
    };

    const handleFileChange = (file: File) => {
        if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|avi|mkv|webm|m4v)$/i)) {
            setErrorMessage('অনুগ্রহ করে একটি সঠিক ভিডিও ফাইল নির্বাচন করুন (MP4, WebM, MOV, MKV)।');
            return;
        }

        setSelectedFile(file);
        setErrorMessage(null);
        setStatus('idle');
        setProgress(0);
        setUploadSpeed('');
        setEtaText('');
        setUploadedBytesText('');

        // Extract video duration
        try {
            const tempVideo = document.createElement('video');
            tempVideo.preload = 'metadata';
            const url = URL.createObjectURL(file);
            tempVideo.src = url;
            tempVideo.onloadedmetadata = () => {
                const durationSec = tempVideo.duration;
                if (durationSec && !isNaN(durationSec)) {
                    setFileDuration(durationSec);
                    const durationMinutes = Math.max(1, Math.round(durationSec / 60));
                    if (onDurationDetected) {
                        onDurationDetected(durationMinutes);
                    }
                }
                URL.revokeObjectURL(url);
            };
            tempVideo.onerror = () => {
                URL.revokeObjectURL(url);
            };
        } catch (_) {}
    };

    const handleStartUpload = async () => {
        if (!selectedFile) {
            setErrorMessage('অনুগ্রহ করে একটি ভিডিও ফাইল নির্বাচন করুন।');
            return;
        }

        setErrorMessage(null);

        try {
            // STEP 1: Request Upload Credentials from backend
            setStatus('requesting');
            setStatusMessage('VdoCipher ক্লাউড আপলোড সংযোগ তৈরি করা হচ্ছে...');
            setProgress(0);

            const uploadTitle = (lessonTitle || selectedFile.name.replace(/\.[^/.]+$/, '')).substring(0, 100);

            const { data } = await apiClient.post('/builder/vdocipher/upload-credentials', {
                title: uploadTitle
            });

            const { clientPayload, videoId } = data;
            if (!clientPayload || !videoId) {
                throw new Error('VdoCipher আপলোড ক্রেডেনশিয়াল পাওয়া যায়নি।');
            }

            const targetUploadUrl = clientPayload.uploadLink || clientPayload.upload_link;
            if (!targetUploadUrl) {
                throw new Error('VdoCipher S3 আপলোড লিংক পাওয়া যায়নি।');
            }

            // STEP 2: Direct Upload to VdoCipher AWS S3 Bucket
            setStatus('uploading');
            setStatusMessage('সরাসরি VdoCipher ক্লাউডে ভিডিও আপলোড হচ্ছে...');
            setProgress(0);

            const formData = new FormData();
            
            // AWS S3 POST specs: policy keys must come before the 'file' field
            for (const key of Object.keys(clientPayload)) {
                if (key !== 'uploadLink' && key !== 'upload_link' && key !== 'success_action_redirect' && key !== 'success_action_status') {
                    formData.append(key, clientPayload[key]);
                }
            }

            // AWS S3 parameters required by VdoCipher policy
            formData.append('success_action_status', clientPayload.success_action_status || '201');
            formData.append('success_action_redirect', clientPayload.success_action_redirect || '');

            const fileExt = selectedFile.name.split('.').pop() || 'mp4';
            const sanitizedBase = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `${sanitizedBase}_novonex.${fileExt}`;

            // Important: the 'file' parameter MUST be appended last
            formData.append('file', selectedFile, fileName);

            // Upload directly to S3 with XHR for exact progress and speed tracking
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhrRef.current = xhr;

                const startTime = Date.now();
                let lastLoaded = 0;
                let lastTime = startTime;

                xhr.open('POST', targetUploadUrl);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.min(100, Math.round((e.loaded / e.total) * 100));
                        setProgress(percent);
                        
                        const loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
                        const totalMB = (e.total / (1024 * 1024)).toFixed(1);
                        setUploadedBytesText(`${loadedMB} MB / ${totalMB} MB`);

                        const now = Date.now();
                        const timeDiff = (now - lastTime) / 1000;
                        if (timeDiff >= 0.5) {
                            const bytesDiff = e.loaded - lastLoaded;
                            const speedBytesPerSec = bytesDiff / timeDiff;
                            const speedMBps = (speedBytesPerSec / (1024 * 1024)).toFixed(2);
                            setUploadSpeed(`${speedMBps} MB/s`);

                            const remainingBytes = e.total - e.loaded;
                            if (speedBytesPerSec > 0) {
                                const remainingSecs = Math.round(remainingBytes / speedBytesPerSec);
                                if (remainingSecs < 60) {
                                    setEtaText(`${remainingSecs} সেকেন্ড বাকি`);
                                } else {
                                    const mins = Math.floor(remainingSecs / 60);
                                    const secs = remainingSecs % 60;
                                    setEtaText(`${mins} মিনিট ${secs > 0 ? `${secs} সে.` : ''} বাকি`);
                                }
                            }
                            lastLoaded = e.loaded;
                            lastTime = now;
                        }
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        let errDetail = xhr.statusText;
                        try {
                            const parser = new DOMParser();
                            const xml = parser.parseFromString(xhr.responseText, 'text/xml');
                            const msg = xml.getElementsByTagName('Message')[0];
                            if (msg && msg.textContent) {
                                errDetail = msg.textContent;
                            }
                        } catch (_) {}
                        reject(new Error(`S3 Upload failed with status HTTP ${xhr.status}: ${errDetail}`));
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('ক্লাউডে ফাইল ট্রান্সফার ব্যাহত হয়েছে। ইন্টারনেট সংযোগ চেক করুন।'));
                };

                xhr.onabort = () => {
                    reject(new Error('আপলোড বাতিল করা হয়েছে।'));
                };

                xhr.send(formData);
            });

            // STEP 3: Successful completion
            setStatus('success');
            setProgress(100);
            setUploadedVideoId(videoId);
            const formattedUrl = `vdocipher://${videoId}`;
            setVideoUrl(formattedUrl);
            onVideoUploaded(formattedUrl);
            setStatusMessage('ভিডিও সফলভাবে আপলোড হয়েছে! VdoCipher ক্লাউডে এটি এখন অপ্টিমাইজ ও DRM দ্বারা সুরক্ষিত করা হচ্ছে।');

        } catch (err: any) {
            console.error('VdoCipher Upload Error:', err);
            setStatus('error');
            setErrorMessage(err.response?.data?.message || err.message || 'ভিডিও আপলোড করতে সমস্যা হয়েছে।');
        }
    };

    const handleCancel = () => {
        if (xhrRef.current) {
            xhrRef.current.abort();
            xhrRef.current = null;
        }
        setStatus('idle');
        setProgress(0);
        setStatusMessage('');
        setUploadSpeed('');
        setEtaText('');
    };

    const handleApplyManualId = () => {
        const clean = manualIdInput.trim();
        if (!clean) return;

        let finalUrl = clean;
        if (!clean.startsWith('vdocipher://') && !clean.startsWith('vdocipher:') && !clean.startsWith('http')) {
            finalUrl = `vdocipher://${clean}`;
        }

        setVideoUrl(finalUrl);
        setUploadedVideoId(clean.replace('vdocipher://', '').replace('vdocipher:', '').trim());
        onVideoUploaded(finalUrl);
        setShowManualInput(false);
    };

    const handleCopyId = () => {
        if (!uploadedVideoId) return;
        navigator.clipboard.writeText(uploadedVideoId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border-2 border-indigo-200/80 dark:border-indigo-900/50 rounded-2xl shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span>VdoCipher DRM সুরক্ষিত ভিডিও আপলোড</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-full">
                                পাইরেসি প্রোটেক্টেড
                            </span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            সরাসরি VdoCipher ক্লাউডে আপলোড • স্বয়ংক্রিয় অ্যাডাপ্টিভ বিটরেট ও কম্প্রেশন
                        </p>
                    </div>
                </div>

                {uploadedVideoId && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>কানেক্টেড</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Existing Connected Video Badge */}
            {uploadedVideoId && status !== 'uploading' && status !== 'requesting' && (
                <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-medium truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">ভিডিও সংরক্ষিত: <strong className="font-mono text-emerald-800 dark:text-emerald-300">{uploadedVideoId}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={handleCopyId}
                            className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                        >
                            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'কপি হয়েছে' : 'ID কপি'}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Cloud Bandwidth & Auto-Optimization Info Card */}
            <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/50 rounded-xl p-3.5 text-xs text-sky-900 dark:text-sky-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-300">
                    <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>ক্লাউড অপ্টিমাইজেশন ও ব্যান্ডউইথ সুরক্ষা</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pl-4 list-disc">
                    <li>
                        <strong>হোস্টিং সার্ভার ব্যান্ডউইথ: ০ মেগাবাইট!</strong> ভিডিও সরাসরি ব্রাউজার থেকে VdoCipher AWS ক্লাউডে আপলোড হয়, আপনার হোস্টিংয়ের কোনো ব্যান্ডউইথ বা স্টোরেজ খরচ হয় না।
                    </li>
                    <li>
                        <strong>স্বয়ংক্রিয় ক্লাউড কম্প্রেশন:</strong> আপলোড হওয়া মাত্রই VdoCipher ক্লাউড সার্ভার স্বয়ংক্রিয়ভাবে ভিডিওকে 1080p, 720p, 480p ও 360p মাল্টি-কোয়ালিটিতে ড্রিম (DRM) সহ রূপান্তর করে। স্টুডেন্টদের জন্য ব্যান্ডউইথ সর্বোচ্চ সাশ্রয়ী হবে।
                    </li>
                </ul>

                {/* Collapsible Personal Data Saver Guide */}
                <div className="pt-1.5 border-t border-sky-100 dark:border-sky-800/40">
                    <button
                        type="button"
                        onClick={() => setShowDataTips(!showDataTips)}
                        className="flex items-center justify-between w-full text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-sky-100 cursor-pointer"
                    >
                        <span className="flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            <span>বড় ভিডিওর জন্য নিজের ইন্টারনেট ডাটা বাঁচানোর টিপস</span>
                        </span>
                        {showDataTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showDataTips && (
                        <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 p-3 rounded-lg border border-sky-200 dark:border-slate-800 space-y-1.5 animate-in fade-in">
                            <p>
                                আপনি যদি সীমিত ইন্টারনেট সংযোগ (যেমন মোবাইল ডাটা) ব্যবহার করেন এবং আপনার রেকর্ডিং ফাইলটি অনেক বড় (যেমন ৫০০MB বা ১GB+) হয়, তবে আপলোডের পূর্বে <strong>Windows Clipchamp</strong> (পিসির বিল্ট-ইন) অথবা <strong>HandBrake</strong> সফটওয়্যার দিয়ে ভিডিওটি একবার 720p/1080p তে অপ্টিমাইজ করে নিতে পারেন।
                            </p>
                            <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                                ✓ এতে ভিডিও কোয়ালিটি বা অডিও নিখুঁত রেখে ফাইল সাইজ ৭০-৮০% কমে যাবে এবং আপনার নিজের মেগাবাইট সাশ্রয় হবে।
                            </p>
                            <p className="text-slate-500 dark:text-slate-400">
                                * আর সাধারণ সাইজের ভিডিও (বা ওয়াইফাই থাকলে) কোনো চিন্তা ছাড়াই সরাসরি আপলোড করুন।
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Area */}
            {status !== 'uploading' && status !== 'requesting' ? (
                <div className="space-y-4">
                    {/* Drag & Drop File Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files?.[0]) {
                                handleFileChange(e.dataTransfer.files[0]);
                            }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            isDragging 
                                ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 scale-[1.01]' 
                                : selectedFile 
                                ? 'border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20' 
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*,.mkv"
                            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                            className="hidden"
                        />

                        {selectedFile ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <FileVideo className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm">{selectedFile.name}</p>
                                    <div className="flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        <span className="flex items-center gap-1">
                                            <HardDrive className="w-3.5 h-3.5" />
                                            <span>সাইজ: <strong>{formatBytes(selectedFile.size)}</strong></span>
                                        </span>
                                        {fileDuration && (
                                            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>সময়কাল: {formatDuration(fileDuration)}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-1">
                                    অন্য ফাইল পরিবর্তন করতে ক্লিক করুন
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <UploadCloud className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                        ক্লিক করে অথবা ড্র্যাগ করে ভিডিও ফাইল নির্বাচন করুন
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        MP4, MOV, WebM, MKV
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Upload Button */}
                    {selectedFile && (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleStartUpload}
                                className="flex-1 py-3 px-5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <UploadCloud className="w-4 h-4" />
                                <span>VdoCipher ক্লাউডে সরাসরি আপলোড করুন</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedFile(null)}
                                className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                                বাতিল
                            </button>
                        </div>
                    )}

                    {/* Manual ID toggle */}
                    <div className="pt-2 text-center">
                        <button
                            type="button"
                            onClick={() => setShowManualInput(!showManualInput)}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline cursor-pointer"
                        >
                            {showManualInput 
                                ? 'ফাইল আপলোড মোডে ফিরে যান' 
                                : 'অথবা পূর্বে আপলোড করা VdoCipher Video ID লিখুন'}
                        </button>
                    </div>

                    {/* Manual ID Input Box */}
                    {showManualInput && (
                        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 animate-in fade-in">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                VdoCipher Video ID লিখুন:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualIdInput}
                                    onChange={(e) => setManualIdInput(e.target.value)}
                                    placeholder="e.g. 5e0f76906a234f9e871e98b7..."
                                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyManualId}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                    সংরক্ষণ
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Live Progress State */
                <div className="p-6 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                                {status === 'requesting' ? 'VdoCipher ক্লাউড সংযোগ স্থাপন...' : 'VdoCipher AWS ক্লাউডে সরাসরি আপলোড হচ্ছে...'}
                            </span>
                        </div>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                            {progress}%
                        </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-sky-500 h-full rounded-full transition-all duration-200 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Detailed stats during upload */}
                    {status === 'uploading' && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 font-mono">
                            <span>{uploadedBytesText || 'আপলোড শুরু হচ্ছে...'}</span>
                            <div className="flex items-center gap-3">
                                {uploadSpeed && <span className="font-semibold text-slate-700 dark:text-slate-300">{uploadSpeed}</span>}
                                {etaText && <span className="text-indigo-600 dark:text-indigo-400 font-medium">{etaText}</span>}
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                        {statusMessage}
                    </p>

                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                        >
                            আপলোড বাতিল করুন
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
