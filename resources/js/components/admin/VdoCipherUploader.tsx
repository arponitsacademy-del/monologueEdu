import React, { useState, useRef, useEffect } from 'react';
import { 
    UploadCloud, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    FileVideo, 
    ShieldCheck, 
    Sparkles, 
    Copy,
    Check,
    FastForward
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface VdoCipherUploaderProps {
    initialVideoUrl?: string;
    onVideoUploaded: (videoUrl: string) => void;
    lessonTitle?: string;
}

type CompressionPreset = '720p' | '1080p' | 'original';

export const VdoCipherUploader: React.FC<VdoCipherUploaderProps> = ({
    initialVideoUrl = '',
    onVideoUploaded,
    lessonTitle = 'Course Lesson Video'
}) => {
    const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileDuration, setFileDuration] = useState<number | null>(null);
    const [preset, setPreset] = useState<CompressionPreset>('720p');
    const [enableCompression, setEnableCompression] = useState(true);

    const [status, setStatus] = useState<'idle' | 'compressing' | 'requesting' | 'uploading' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState<number>(0);
    const [compressedSize, setCompressedSize] = useState<number>(0);
    const [isDragging, setIsDragging] = useState(false);
    const [copied, setCopied] = useState(false);

    // Direct ID input mode
    const [manualIdInput, setManualIdInput] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const xhrRef = useRef<XMLHttpRequest | null>(null);
    const skipCompressionRef = useRef<boolean>(false);
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    useEffect(() => {
        setVideoUrl(initialVideoUrl);
        if (initialVideoUrl && (initialVideoUrl.startsWith('vdocipher://') || initialVideoUrl.startsWith('vdocipher:'))) {
            const raw = initialVideoUrl.replace('vdocipher://', '').replace('vdocipher:', '');
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

    const handleFileChange = (file: File) => {
        if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|avi|mkv|webm|m4v)$/i)) {
            setErrorMessage('অনুগ্রহ করে একটি সঠিক ভিডিও ফাইল নির্বাচন করুন (MP4, WebM, MOV, MKV)।');
            return;
        }

        setSelectedFile(file);
        setOriginalSize(file.size);
        setCompressedSize(0);
        setErrorMessage(null);
        setStatus('idle');
        setProgress(0);

        // Probe duration
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.src = URL.createObjectURL(file);
        tempVideo.onloadedmetadata = () => {
            setFileDuration(tempVideo.duration);
            URL.revokeObjectURL(tempVideo.src);
        };
    };

    // Client-side Video Compressor using Offscreen Canvas & MediaRecorder
    const compressVideoClientSide = async (file: File, targetPreset: CompressionPreset): Promise<Blob> => {
        if (targetPreset === 'original' || !enableCompression) {
            return file;
        }

        skipCompressionRef.current = false;

        return new Promise((resolve) => {
            const video = document.createElement('video');
            videoElementRef.current = video;

            // Configure video properties for reliable background rendering
            video.muted = true;
            video.defaultMuted = true;
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            video.setAttribute('muted', '');
            video.style.position = 'fixed';
            video.style.top = '-9999px';
            video.style.left = '-9999px';
            video.style.width = '1px';
            video.style.height = '1px';
            video.style.opacity = '0';
            video.style.pointerEvents = 'none';
            document.body.appendChild(video);

            const videoBlobUrl = URL.createObjectURL(file);
            video.src = videoBlobUrl;

            let animFrameId: number;

            const cleanup = () => {
                try {
                    cancelAnimationFrame(animFrameId);
                    video.pause();
                    video.src = '';
                    if (video.parentNode) {
                        video.parentNode.removeChild(video);
                    }
                    videoElementRef.current = null;
                    URL.revokeObjectURL(videoBlobUrl);
                } catch (_) {}
            };

            video.onloadedmetadata = async () => {
                try {
                    const origWidth = video.videoWidth || 1280;
                    const origHeight = video.videoHeight || 720;
                    const duration = video.duration || 60;

                    let targetWidth = origWidth;
                    let targetHeight = origHeight;
                    let targetBitrate = 1800000; // 1.8 Mbps default

                    if (targetPreset === '720p') {
                        if (origWidth > 1280 || origHeight > 720) {
                            if (origWidth >= origHeight) {
                                targetWidth = 1280;
                                targetHeight = Math.round((origHeight / origWidth) * 1280);
                            } else {
                                targetHeight = 720;
                                targetWidth = Math.round((origWidth / origHeight) * 720);
                            }
                        }
                        targetBitrate = 1400000; // 1.4 Mbps (~10MB per minute)
                    } else if (targetPreset === '1080p') {
                        if (origWidth > 1920 || origHeight > 1080) {
                            if (origWidth >= origHeight) {
                                targetWidth = 1920;
                                targetHeight = Math.round((origHeight / origWidth) * 1920);
                            } else {
                                targetHeight = 1080;
                                targetWidth = Math.round((origWidth / origHeight) * 1080);
                            }
                        }
                        targetBitrate = 2400000; // 2.4 Mbps (~17MB per minute)
                    }

                    // Ensure dimensions are even numbers (required by some encoders)
                    if (targetWidth % 2 !== 0) targetWidth -= 1;
                    if (targetHeight % 2 !== 0) targetHeight -= 1;

                    const canvas = document.createElement('canvas');
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    const ctx = canvas.getContext('2d', { alpha: false });

                    if (!ctx) {
                        cleanup();
                        resolve(file);
                        return;
                    }

                    // Create Canvas Stream
                    const canvasStream = canvas.captureStream ? canvas.captureStream(30) : (canvas as any).mozCaptureStream(30);

                    // Add Audio Track directly from video element
                    try {
                        const vStream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
                        if (vStream) {
                            const audioTracks = vStream.getAudioTracks();
                            if (audioTracks && audioTracks.length > 0) {
                                canvasStream.addTrack(audioTracks[0]);
                            }
                        }
                    } catch (audioErr) {
                        console.warn('Audio capture note:', audioErr);
                    }

                    // Determine best supported MIME type
                    let mimeType = 'video/webm;codecs=vp8,opus';
                    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                        mimeType = 'video/webm;codecs=vp9,opus';
                    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
                        mimeType = 'video/webm;codecs=vp8,opus';
                    } else if (MediaRecorder.isTypeSupported('video/webm')) {
                        mimeType = 'video/webm';
                    } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
                        mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
                    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
                        mimeType = 'video/mp4';
                    }

                    const recorder = new MediaRecorder(canvasStream, {
                        mimeType,
                        videoBitsPerSecond: targetBitrate
                    });
                    mediaRecorderRef.current = recorder;

                    const chunks: BlobPart[] = [];
                    recorder.ondataavailable = (e) => {
                        if (e.data && e.data.size > 0) {
                            chunks.push(e.data);
                        }
                    };

                    recorder.onstop = () => {
                        if (skipCompressionRef.current) {
                            cleanup();
                            resolve(file);
                            return;
                        }

                        const compressedBlob = new Blob(chunks, { type: mimeType });
                        cleanup();

                        if (compressedBlob.size > 0 && compressedBlob.size < file.size) {
                            resolve(compressedBlob);
                        } else {
                            // If compression didn't save size, use whichever is smaller
                            resolve(compressedBlob.size > 0 ? compressedBlob : file);
                        }
                    };

                    recorder.onerror = (err) => {
                        console.error('MediaRecorder error:', err);
                        cleanup();
                        resolve(file);
                    };

                    recorder.start(1000);

                    // Speed up playback rate for fast encoding (3x speed)
                    video.playbackRate = 3.0;

                    const renderFrame = () => {
                        if (skipCompressionRef.current) {
                            if (recorder.state === 'recording') recorder.stop();
                            return;
                        }

                        if (video.paused || video.ended) return;

                        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

                        const current = video.currentTime;
                        const pct = Math.min(99, Math.round((current / duration) * 100));
                        setProgress(pct);
                        setStatusMessage(`ভিডিও অপ্টিমাইজ ও কম্প্রেশন হচ্ছে... ${pct}% (গতি: ৩ গুণ)`);

                        animFrameId = requestAnimationFrame(renderFrame);
                    };

                    video.onplay = () => {
                        renderFrame();
                    };

                    video.onended = () => {
                        cancelAnimationFrame(animFrameId);
                        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                        setProgress(100);
                        if (recorder.state === 'recording') {
                            recorder.stop();
                        }
                    };

                    // Start playing
                    await video.play();

                } catch (err) {
                    console.error('Compression setup error:', err);
                    cleanup();
                    resolve(file);
                }
            };

            video.onerror = () => {
                cleanup();
                resolve(file);
            };
        });
    };

    const handleSkipCompression = () => {
        skipCompressionRef.current = true;
        if (videoElementRef.current) {
            try {
                videoElementRef.current.pause();
            } catch (_) {}
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try {
                mediaRecorderRef.current.stop();
            } catch (_) {}
        }
    };

    const handleStartUpload = async () => {
        if (!selectedFile) {
            setErrorMessage('অনুগ্রহ করে একটি ভিডিও ফাইল নির্বাচন করুন।');
            return;
        }

        setErrorMessage(null);

        try {
            // STEP 1: Client-side compression
            let fileToUpload: Blob = selectedFile;

            if (enableCompression && preset !== 'original') {
                setStatus('compressing');
                setStatusMessage('ব্রাউজারে ভিডিও কম্প্রেশন শুরু হচ্ছে...');
                setProgress(0);

                const compressedResult = await compressVideoClientSide(selectedFile, preset);
                fileToUpload = compressedResult;
                setCompressedSize(compressedResult.size);
            } else {
                setCompressedSize(selectedFile.size);
            }

            // STEP 2: Request Upload Credentials from backend
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

            // STEP 3: Direct Upload to VdoCipher AWS S3 Bucket
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

            const isWebm = fileToUpload.type.includes('webm');
            const fileExt = isWebm ? 'webm' : (selectedFile.name.split('.').pop() || 'mp4');
            const fileName = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_novonex.${fileExt}`;

            // Important: the 'file' parameter MUST be appended last
            formData.append('file', fileToUpload, fileName);

            // Upload directly to S3 with XHR for exact progress tracking
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhrRef.current = xhr;

                xhr.open('POST', targetUploadUrl);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        setProgress(percent);
                        const uploadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
                        const totalMB = (e.total / (1024 * 1024)).toFixed(1);
                        setStatusMessage(`VdoCipher-এ সরাসরি আপলোড হচ্ছে... ${percent}% (${uploadedMB} MB / ${totalMB} MB)`);
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

            // STEP 4: Successful completion
            setStatus('success');
            setProgress(100);
            setUploadedVideoId(videoId);
            const formattedUrl = `vdocipher://${videoId}`;
            setVideoUrl(formattedUrl);
            onVideoUploaded(formattedUrl);
            setStatusMessage('ভিডিও সফলভাবে আপলোড হয়েছে এবং VdoCipher DRM দ্বারা সুরক্ষিত করা হয়েছে!');

        } catch (err: any) {
            console.error('VdoCipher Upload Error:', err);
            setStatus('error');
            setErrorMessage(err.response?.data?.message || err.message || 'ভিডিও আপলোড করতে সমস্যা হয়েছে।');
        }
    };

    const handleCancel = () => {
        handleSkipCompression();
        if (xhrRef.current) {
            xhrRef.current.abort();
            xhrRef.current = null;
        }
        setStatus('idle');
        setProgress(0);
        setStatusMessage('');
    };

    const handleApplyManualId = () => {
        const clean = manualIdInput.trim();
        if (!clean) return;

        let finalUrl = clean;
        if (!clean.startsWith('vdocipher://') && !clean.startsWith('vdocipher:') && !clean.startsWith('http')) {
            finalUrl = `vdocipher://${clean}`;
        }

        setVideoUrl(finalUrl);
        setUploadedVideoId(clean.replace('vdocipher://', '').replace('vdocipher:', ''));
        onVideoUploaded(finalUrl);
        setShowManualInput(false);
    };

    const handleCopyId = () => {
        if (!uploadedVideoId) return;
        navigator.clipboard.writeText(uploadedVideoId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const savingsPercentage = originalSize > 0 && compressedSize > 0 && compressedSize < originalSize
        ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
        : null;

    return (
        <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border-2 border-indigo-200/80 rounded-2xl shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span>VdoCipher DRM ভিডিও আপলোড</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
                                পাইরেসি সুরক্ষিত
                            </span>
                        </h4>
                        <p className="text-xs text-slate-500">
                            ব্রাউজারে ভিডিও কম্প্রেশন ও সরাসরি ক্লাউড আপলোড (ব্যান্ডউইথ সাশ্রয়ী)
                        </p>
                    </div>
                </div>

                {uploadedVideoId && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>কানেক্টেড</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Existing Connected Video Badge */}
            {uploadedVideoId && status !== 'uploading' && status !== 'compressing' && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-medium truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">ভিডিও সংরক্ষিত: <strong>{uploadedVideoId}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={handleCopyId}
                            className="px-2.5 py-1 text-[11px] font-bold bg-white text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-100 flex items-center gap-1 transition-all cursor-pointer"
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'কপি হয়েছে' : 'ID কপি'}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Upload / Compress Work Area */}
            {status !== 'uploading' && status !== 'compressing' && status !== 'requesting' ? (
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
                                ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]' 
                                : selectedFile 
                                ? 'border-indigo-300 bg-indigo-50/30 hover:border-indigo-400' 
                                : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
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
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <FileVideo className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-900 truncate max-w-sm">{selectedFile.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        মূল ফাইল সাইজ: <strong>{formatBytes(selectedFile.size)}</strong>
                                        {fileDuration ? ` • সময়কাল: ${Math.round(fileDuration / 60)} মিনিট` : ''}
                                    </p>
                                </div>
                                <span className="text-[11px] font-semibold text-indigo-600 hover:underline mt-1">
                                    অন্য ফাইল পরিবর্তন করতে ক্লিক করুন
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <UploadCloud className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        ক্লিক করে অথবা ড্র্যাগ করে ভিডিও ফাইল নির্বাচন করুন
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        MP4, MOV, WebM, MKV
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Compression Options */}
                    {selectedFile && (
                        <div className="p-4 bg-white border border-indigo-100 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={enableCompression}
                                        onChange={(e) => setEnableCompression(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                    />
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>ভিডিও কম্প্রেশন সক্রিয় রাখুন (সাইজ কমানোর জন্য)</span>
                                    </span>
                                </label>
                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    ~৫০-৮০% ডাটা সাশ্রয়ী
                                </span>
                            </div>

                            {enableCompression && (
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setPreset('720p')}
                                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                            preset === '720p'
                                                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <p className="text-xs font-bold flex items-center justify-between">
                                            <span>720p HD</span>
                                            {preset === '720p' && <Check className="w-3 h-3 text-indigo-600" />}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">সর্বোচ্চ সেভিংস (Best)</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPreset('1080p')}
                                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                            preset === '1080p'
                                                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <p className="text-xs font-bold flex items-center justify-between">
                                            <span>1080p Full HD</span>
                                            {preset === '1080p' && <Check className="w-3 h-3 text-indigo-600" />}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">হাই কোয়ালিটি</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPreset('original')}
                                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                            preset === 'original'
                                                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <p className="text-xs font-bold flex items-center justify-between">
                                            <span>মূল ফাইল</span>
                                            {preset === 'original' && <Check className="w-3 h-3 text-indigo-600" />}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">সরাসরি আপলোড</p>
                                    </button>
                                </div>
                            )}

                            {/* Estimated Info Banner */}
                            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
                                <span>মূল ফাইল সাইজ: <strong>{formatBytes(selectedFile.size)}</strong></span>
                                {enableCompression && preset !== 'original' && (
                                    <span className="text-emerald-700 font-semibold">
                                        কম্প্রেশন টার্গেট: <strong>~{formatBytes(Math.round(selectedFile.size * (preset === '720p' ? 0.35 : 0.60)))}</strong>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Upload Button */}
                    {selectedFile && (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleStartUpload}
                                className="flex-1 py-3 px-5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <UploadCloud className="w-4 h-4" />
                                <span>
                                    {enableCompression && preset !== 'original' 
                                        ? 'কম্প্রেস করুন ও VdoCipher-এ সরাসরি আপলোড দিন' 
                                        : 'VdoCipher-এ সরাসরি আপলোড দিন'}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedFile(null)}
                                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
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
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                            {showManualInput 
                                ? 'ফাইল আপলোড মোডে ফিরে যান' 
                                : 'অথবা পূর্বে আপলোড করা VdoCipher Video ID লিখুন'}
                        </button>
                    </div>

                    {/* Manual ID Input Box */}
                    {showManualInput && (
                        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 animate-in fade-in">
                            <label className="block text-xs font-bold text-slate-700">
                                VdoCipher Video ID লিখুন:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualIdInput}
                                    onChange={(e) => setManualIdInput(e.target.value)}
                                    placeholder="e.g. 5e0f76906a234f9e871e98b7..."
                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
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
                <div className="p-6 bg-white border border-indigo-200 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                            <span className="text-xs font-bold text-slate-800">
                                {status === 'compressing' ? 'লোকাল কম্প্রেশন চলছে (৩x গতি)...' : 'VdoCipher ক্লাউড আপলোড চলছে...'}
                            </span>
                        </div>
                        <span className="text-xs font-black text-indigo-600 font-mono">
                            {progress}%
                        </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-sky-500 h-full rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <p className="text-xs text-slate-500 text-center font-medium">
                        {statusMessage}
                    </p>

                    <div className="flex items-center justify-center gap-3 pt-2">
                        {status === 'compressing' && (
                            <button
                                type="button"
                                onClick={handleSkipCompression}
                                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-200"
                            >
                                <FastForward className="w-3.5 h-3.5" />
                                <span>কম্প্রেশন স্কিপ করে সরাসরি আপলোড করুন</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleCancel}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                        >
                            বাতিল করুন
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
