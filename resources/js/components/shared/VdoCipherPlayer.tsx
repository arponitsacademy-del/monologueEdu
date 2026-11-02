import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../api/client';

interface VdoCipherPlayerProps {
    videoId: string;
    title?: string;
    className?: string;
    onEnded?: () => void;
}

export const VdoCipherPlayer: React.FC<VdoCipherPlayerProps> = ({
    videoId,
    title,
    className = '',
    onEnded
}) => {
    const [otp, setOtp] = useState<string | null>(null);
    const [playbackInfo, setPlaybackInfo] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOtp = async () => {
        setLoading(true);
        setError(null);
        try {
            // Clean video ID in case it carries prefix
            const cleanId = videoId.replace('vdocipher://', '').replace('vdocipher:', '').trim();
            const { data } = await apiClient.post('/vdocipher/otp', {
                video_id: cleanId
            });

            if (data.otp && data.playbackInfo) {
                setOtp(data.otp);
                setPlaybackInfo(data.playbackInfo);
            } else {
                throw new Error('অসম্পূর্ণ প্লেব্যাক ডাটা পাওয়া গেছে।');
            }
        } catch (err: any) {
            console.error('VdoCipher OTP Error:', err);
            setError(err.response?.data?.message || err.message || 'ভিডিও প্লেব্যাক লোড করতে ব্যর্থ হয়েছে।');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (videoId) {
            fetchOtp();
        }
    }, [videoId]);

    if (loading) {
        return (
            <div className={`w-full h-full min-h-[300px] bg-slate-950 flex flex-col items-center justify-center text-white gap-3 p-6 ${className}`}>
                <div className="relative">
                    <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
                    <ShieldCheck className="w-4 h-4 text-emerald-400 absolute bottom-0 right-0" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-slate-200">ভিডিও লোড হচ্ছে...</p>
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>VdoCipher DRM পাইরেসি প্রটেক্টেড প্লেয়ার</span>
                    </p>
                </div>
            </div>
        );
    }

    if (error || !otp || !playbackInfo) {
        return (
            <div className={`w-full h-full min-h-[300px] bg-slate-900 flex flex-col items-center justify-center text-white gap-4 p-6 ${className}`}>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div className="text-center max-w-md space-y-1">
                    <p className="text-sm font-bold text-rose-300">ভিডিও প্লেব্যাক সমস্যা</p>
                    <p className="text-xs text-slate-400">{error || 'প্লেব্যাক চালু করা সম্ভব হয়নি।'}</p>
                </div>
                <button
                    type="button"
                    onClick={fetchOtp}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>পুনরায় চেষ্টা করুন</span>
                </button>
            </div>
        );
    }

    return (
        <div className={`w-full h-full relative overflow-hidden bg-black ${className}`}>
            <iframe
                title={title || 'VdoCipher DRM Player'}
                src={`https://player.vdocipher.com/v2/?otp=${encodeURIComponent(otp)}&playbackInfo=${encodeURIComponent(playbackInfo)}`}
                className="w-full h-full absolute inset-0 border-0"
                allow="encrypted-media; autoplay; fullscreen"
                allowFullScreen
            />
        </div>
    );
};
