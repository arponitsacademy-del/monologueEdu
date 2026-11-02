import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { AlertCircle, Check, Sparkles } from 'lucide-react';
import { VdoCipherPlayer } from './VdoCipherPlayer';

interface PlyrVideoPlayerProps {
    url?: string | null;
    title?: string;
    autoplay?: boolean;
    poster?: string;
    className?: string;
    onEnded?: () => void;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats including shorts, watch, embed, youtu.be.
 */
export const extractYouTubeId = (url?: string | null): string | null => {
    if (!url) return null;
    const cleanUrl = url.trim();
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = cleanUrl.match(regExp);
    return match ? match[1] : null;
};

/**
 * Extracts Vimeo video ID from Vimeo URL formats.
 */
export const extractVimeoId = (url?: string | null): string | null => {
    if (!url) return null;
    const cleanUrl = url.trim();
    const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    const match = cleanUrl.match(regExp);
    return match ? match[3] : null;
};

/**
 * Extracts VdoCipher video ID from vdocipher://, vdocipher: or hex format.
 */
export const extractVdoCipherId = (url?: string | null): string | null => {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('vdocipher://')) {
        return cleanUrl.replace('vdocipher://', '').split(/[?#]/)[0];
    }
    if (cleanUrl.startsWith('vdocipher:')) {
        return cleanUrl.replace('vdocipher:', '').split(/[?#]/)[0];
    }
    if (/^[0-9a-f]{32}$/i.test(cleanUrl)) {
        return cleanUrl;
    }
    const match = cleanUrl.match(/player\.vdocipher\.com\/v2\/\?(?:.*&)?(?:video|playbackInfo)=([^&]+)/i);
    if (match) return match[1];
    return null;
};

const QUALITY_STORAGE_KEY = 'novonex_video_quality';

const QUALITY_OPTIONS = [
    { label: '1080p', detail: 'Full HD', value: '1080p', ytLevel: 'hd1080' },
    { label: '720p', detail: 'HD', value: '720p', ytLevel: 'hd720' },
    { label: '480p', detail: 'Standard', value: '480p', ytLevel: 'large' },
    { label: '360p', detail: 'Data Saver', value: '360p', ytLevel: 'medium' },
    { label: 'Auto', detail: 'স্বয়ংক্রিয়', value: 'auto', ytLevel: 'default' },
];

export const PlyrVideoPlayer: React.FC<PlyrVideoPlayerProps> = ({
    url,
    title,
    autoplay = false,
    poster,
    className = '',
    onEnded
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerInstanceRef = useRef<Plyr | null>(null);
    const qualityMenuRef = useRef<HTMLDivElement>(null);

    const [hasError, setHasError] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [controlsEl, setControlsEl] = useState<Element | null>(null);
    const [qualityOpen, setQualityOpen] = useState(false);
    const [qualityToast, setQualityToast] = useState<string | null>(null);

    const [currentQuality, setCurrentQuality] = useState<string>(() => {
        return localStorage.getItem(QUALITY_STORAGE_KEY) || '720p';
    });

    const vdoCipherId = extractVdoCipherId(url);
    const youtubeId = !vdoCipherId ? extractYouTubeId(url) : null;
    const vimeoId = !vdoCipherId && !youtubeId ? extractVimeoId(url) : null;
    const isDirectVideo = !vdoCipherId && !youtubeId && !vimeoId && url && (
        url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg') || url.includes('/media/') || url.includes('/storage/')
    );

    // Apply quality to YouTube / HTML5 player instance
    const applyQuality = useCallback((qualityValue: string, player?: Plyr | null) => {
        const p = player || playerInstanceRef.current;
        if (!p) return;

        const opt = QUALITY_OPTIONS.find(o => o.value === qualityValue);
        const ytTarget = opt ? opt.ytLevel : 'default';

        const pAny = p as any;
        if (pAny.embed) {
            try {
                if (typeof pAny.embed.setPlaybackQuality === 'function') {
                    pAny.embed.setPlaybackQuality(ytTarget);
                }
                if (typeof pAny.embed.setPlaybackQualityRange === 'function') {
                    pAny.embed.setPlaybackQualityRange(ytTarget, ytTarget);
                }
            } catch (_) {}
        }
    }, []);

    // Handle user selecting a quality
    const handleQualitySelect = (value: string) => {
        setCurrentQuality(value);
        localStorage.setItem(QUALITY_STORAGE_KEY, value);
        setQualityOpen(false);

        applyQuality(value);

        const selectedOpt = QUALITY_OPTIONS.find(o => o.value === value);
        const label = selectedOpt ? `${selectedOpt.label} (${selectedOpt.detail})` : value;
        setQualityToast(`ভিডিও কোয়ালিটি: ${label}`);
        setTimeout(() => setQualityToast(null), 2400);
    };

    // Close quality dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
                setQualityOpen(false);
            }
        };
        if (qualityOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [qualityOpen]);

    useEffect(() => {
        if (vdoCipherId) return;
        setHasError(null);
        setControlsEl(null);
        if (!containerRef.current) return;

        // Cleanup existing player instance if URL changed
        if (playerInstanceRef.current) {
            try {
                playerInstanceRef.current.destroy();
            } catch (_) {}
            playerInstanceRef.current = null;
        }

        // Target media element for Plyr
        const mediaElement = containerRef.current.querySelector('video, .plyr__video-embed');
        if (!mediaElement) return;

        try {
            const player = new Plyr(mediaElement as HTMLElement, {
                controls: [
                    'play-large',
                    'play',
                    'rewind',
                    'fast-forward',
                    'progress',
                    'current-time',
                    'duration',
                    'mute',
                    'volume',
                    'settings',
                    'pip',
                    'fullscreen',
                ],
                settings: ['speed'],
                speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
                seekTime: 10,
                autoplay: autoplay,
                invertTime: false,
                toggleInvert: true,
                tooltips: { controls: true, seek: true },
                keyboard: { focused: true, global: false },
                clickToPlay: true,
                hideControls: true,
                resetOnEnd: false,
                youtube: {
                    noCookie: false,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    playsinline: 1,
                },
            });

            player.on('ready', () => {
                setHasError(null);
                // Locate Plyr controls container so we can portal the Quality Switcher directly inside
                const controls = containerRef.current?.querySelector('.plyr__controls');
                if (controls) {
                    setControlsEl(controls);
                }
                // Apply saved quality without triggering player reload
                const savedQuality = localStorage.getItem(QUALITY_STORAGE_KEY) || '720p';
                applyQuality(savedQuality, player);
            });

            player.on('error', (event: any) => {
                const code = event?.detail?.code;
                if (code === 101 || code === 150) {
                    setHasError('এই ভিডিওটির মালিক ইউটিউব এম্বেড প্লেব্যাক সীমাবদ্ধ করেছেন।');
                } else if (code === 100) {
                    setHasError('ভিডিওটি ইউটিউব থেকে মুছে ফেলা হয়েছে বা প্রাইভেট করা হয়েছে।');
                }
            });

            if (onEnded) {
                player.on('ended', onEnded);
            }

            playerInstanceRef.current = player;
        } catch (err) {
            console.error('Failed to initialize Plyr player', err);
        }

        return () => {
            if (playerInstanceRef.current) {
                try {
                    playerInstanceRef.current.destroy();
                } catch (_) {}
                playerInstanceRef.current = null;
            }
            setControlsEl(null);
        };
    }, [url, autoplay, youtubeId, vimeoId]);

    // Single click on video toggles Play/Pause
    const handleVideoClick = useCallback(() => {
        if (playerInstanceRef.current) {
            playerInstanceRef.current.togglePlay();
        }
    }, []);

    // Double click on video toggles Fullscreen
    const handleDoubleClick = useCallback(() => {
        if (playerInstanceRef.current) {
            playerInstanceRef.current.fullscreen.toggle();
        }
    }, []);

    // Keydown shortcuts when container is focused or hovered
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!playerInstanceRef.current) return;
        const player = playerInstanceRef.current;

        switch (e.key) {
            case ' ':
            case 'k':
            case 'K':
                e.preventDefault();
                player.togglePlay();
                break;
            case 'ArrowLeft':
            case 'j':
            case 'J':
                e.preventDefault();
                player.rewind(10);
                break;
            case 'ArrowRight':
            case 'l':
            case 'L':
                e.preventDefault();
                player.forward(10);
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                player.fullscreen.toggle();
                break;
            case 'm':
            case 'M':
                e.preventDefault();
                player.muted = !player.muted;
                break;
        }
    };

    if (!url) {
        return (
            <div className={`w-full aspect-video bg-slate-900 flex items-center justify-center text-slate-500 text-xs ${className}`}>
                ভিডিও লিংক পাওয়া যায়নি
            </div>
        );
    }

    if (vdoCipherId) {
        return (
            <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg ${className}`}>
                <VdoCipherPlayer
                    videoId={vdoCipherId}
                    title={title}
                    onEnded={onEnded}
                />
            </div>
        );
    }

    return (
        <div 
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative w-full aspect-video bg-black overflow-hidden select-none outline-none plyr-protected-wrapper ${className}`}
            onContextMenu={(e) => {
                // Strictly block context menu so user cannot copy video URL or inspect frame
                e.preventDefault();
                e.stopPropagation();
                return false;
            }}
        >
            <div ref={containerRef} className="w-full h-full relative" key={url}>
                {youtubeId ? (
                    /* YouTube Plyr Embed with Protected Pointer Events */
                    <div className="plyr__video-embed w-full h-full">
                        <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}?iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1`}
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            title={title || 'Video Player'}
                            className="w-full h-full pointer-events-none"
                        />
                    </div>
                ) : vimeoId ? (
                    /* Vimeo Plyr Embed */
                    <div className="plyr__video-embed w-full h-full">
                        <iframe
                            src={`https://player.vimeo.com/video/${vimeoId}?loop=false&byline=false&portrait=false&title=false&speed=true&transparent=0&gesture=media`}
                            allowFullScreen
                            allow="autoplay"
                            title={title || 'Video Player'}
                            className="w-full h-full pointer-events-none"
                        />
                    </div>
                ) : (
                    /* Direct HTML5 Video (mp4, webm, etc.) */
                    <video
                        playsInline
                        controls
                        poster={poster}
                        src={url}
                        className="w-full h-full object-contain"
                    >
                        <source src={url} type="video/mp4" />
                    </video>
                )}

                {/* Top Shield Mask: Conceals YouTube top bar, channel link, and title */}
                {(youtubeId || vimeoId) && (
                    <div 
                        className={`absolute top-0 left-0 right-0 h-16 z-[12] pointer-events-none bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-start px-4 pt-3 transition-opacity duration-300 ${
                            isHovered ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {title && (
                            <span className="text-xs font-semibold text-white/95 drop-shadow-md truncate max-w-[85%] tracking-wide">
                                {title}
                            </span>
                        )}
                    </div>
                )}

                {/* Quality Change Toast Notification */}
                {qualityToast && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-slate-900/95 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-slate-700/80 flex items-center gap-2 pointer-events-none transition-all">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{qualityToast}</span>
                    </div>
                )}

                {/* Click interceptor overlay:
                    Leaves bottom 64px clear so clicks and drags on the progress bar and controls never get hijacked.
                    Clicking video toggles play/pause, double clicking toggles fullscreen. */}
                {(youtubeId || vimeoId) && (
                    <div 
                        onClick={handleVideoClick}
                        onDoubleClick={handleDoubleClick}
                        className="absolute inset-x-0 top-0 bottom-16 z-[10] cursor-pointer"
                        title={title || 'Video Player'}
                    />
                )}

                {hasError && (
                    <div className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-white space-y-2">
                        <AlertCircle className="w-8 h-8 text-rose-500" />
                        <p className="text-sm font-semibold">{hasError}</p>
                        <p className="text-xs text-slate-400">দয়া করে ইউটিউবে ভিডিওটি পাবলিক বা আনলিস্টেড এবং এম্বেড এনাবল করা আছে কিনা চেক করুন।</p>
                    </div>
                )}
            </div>

            {/* Quality Switcher Badge Button - Portaled directly into Plyr's control bar */}
            {controlsEl && createPortal(
                <div 
                    ref={qualityMenuRef} 
                    className="plyr__controls__item plyr__quality-container relative inline-flex items-center"
                    style={{ order: 50 }}
                >
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setQualityOpen((prev) => !prev);
                        }}
                        className="plyr__control !h-7 !px-2.5 !py-0.5 !rounded-md !bg-white/10 hover:!bg-sky-600 !text-white !font-bold !text-[11px] flex items-center gap-1 transition-all border border-white/10"
                        title="ভিডিও কোয়ালিটি (Quality)"
                        aria-label="Quality settings"
                    >
                        <span className="tracking-wider">
                            {currentQuality === 'auto' ? 'AUTO' : currentQuality.toUpperCase()}
                        </span>
                    </button>

                    {qualityOpen && (
                        <div 
                            className="absolute bottom-full right-0 mb-3 w-44 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden py-1.5 z-50 text-xs font-semibold text-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
                                <span>ভিডিও কোয়ালিটি</span>
                                <span className="text-[9px] text-sky-400 font-bold">QUALITY</span>
                            </div>
                            <div className="py-1">
                                {QUALITY_OPTIONS.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => handleQualitySelect(item.value)}
                                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-sky-600/30 hover:text-white transition-colors text-xs ${
                                            currentQuality === item.value 
                                                ? 'text-sky-400 font-bold bg-sky-500/10' 
                                                : 'text-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{item.label}</span>
                                            <span className="text-[10px] text-slate-400 font-normal">
                                                ({item.detail})
                                            </span>
                                        </div>
                                        {currentQuality === item.value && (
                                            <Check className="w-3.5 h-3.5 text-sky-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>,
                controlsEl
            )}

            {/* Optimized Plyr Theme & Bottom Control Anchoring */}
            <style>{`
                /* Ensure Fullscreen is at the extreme right */
                .plyr-protected-wrapper .plyr__control[data-plyr="fullscreen"] {
                    order: 99 !important;
                    margin-left: 2px !important;
                }

                .plyr-protected-wrapper .plyr__quality-container {
                    order: 50 !important;
                }

                /* Mobile tap and touch responsiveness */
                .plyr-protected-wrapper,
                .plyr-protected-wrapper .plyr__control,
                .plyr-protected-wrapper button {
                    touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                }
                /* Ensure YouTube/Vimeo iframe pointer events are strictly disabled */
                .plyr-protected-wrapper .plyr__video-embed iframe {
                    pointer-events: none !important;
                }

                .plyr-protected-wrapper .plyr {
                    width: 100% !important;
                    height: 100% !important;
                    max-height: 100% !important;
                }

                /* Force Plyr control bar firmly to the BOTTOM of the video container */
                .plyr-protected-wrapper .plyr--video .plyr__controls {
                    position: absolute !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    z-index: 25 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    padding: 16px 16px 12px 16px !important;
                    background: linear-gradient(to top, rgba(10, 15, 29, 0.95) 0%, rgba(10, 15, 29, 0.6) 65%, transparent 100%) !important;
                    pointer-events: auto !important;
                    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }

                /* Smooth auto-hide when video is playing */
                .plyr-protected-wrapper .plyr--video.plyr--hide-controls .plyr__controls {
                    opacity: 0 !important;
                    pointer-events: none !important;
                    transform: translateY(100%) !important;
                }

                /* Progress bar container: stretches horizontally between buttons */
                .plyr-protected-wrapper .plyr__controls .plyr__progress__container {
                    flex: 1 1 auto !important;
                    min-width: 80px !important;
                    margin: 0 4px !important;
                    padding: 0 !important;
                }

                /* Custom Plyr theme color (Sky-600 #0284c7) */
                .plyr-protected-wrapper .plyr--full-ui input[type="range"] {
                    color: #0284c7 !important;
                    cursor: pointer !important;
                }

                .plyr-protected-wrapper .plyr--full-ui input[type="range"]::-webkit-slider-thumb {
                    box-shadow: 0 0 10px rgba(2, 132, 199, 0.7) !important;
                    transition: transform 0.15s ease !important;
                }

                .plyr-protected-wrapper .plyr--full-ui input[type="range"]:hover::-webkit-slider-thumb {
                    transform: scale(1.3) !important;
                }

                /* Center large play button */
                .plyr-protected-wrapper .plyr__control--overlaid {
                    background: rgba(2, 132, 199, 0.95) !important;
                    backdrop-filter: blur(8px) !important;
                    box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.5) !important;
                    border-radius: 9999px !important;
                    padding: 18px !important;
                    z-index: 20 !important;
                    pointer-events: auto !important;
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease !important;
                }

                .plyr-protected-wrapper .plyr__control--overlaid:hover {
                    background: #0284c7 !important;
                    transform: translate(-50%, -50%) scale(1.1) !important;
                }

                /* Control buttons styling */
                .plyr-protected-wrapper .plyr__control {
                    border-radius: 8px !important;
                    transition: all 0.15s ease !important;
                    color: #f1f5f9 !important;
                }

                .plyr-protected-wrapper .plyr__control:hover {
                    background: rgba(255, 255, 255, 0.15) !important;
                    color: #ffffff !important;
                }

                .plyr-protected-wrapper .plyr__control:focus-visible {
                    outline: 2px solid #38bdf8 !important;
                    outline-offset: 2px !important;
                }

                /* Typography for time indicators */
                .plyr-protected-wrapper .plyr__time {
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    font-variant-numeric: tabular-nums !important;
                    color: #cbd5e1 !important;
                    padding: 0 4px !important;
                }

                /* Settings popup menu with glassmorphism */
                .plyr-protected-wrapper .plyr__menu__container {
                    background: rgba(15, 23, 42, 0.96) !important;
                    border: 1px solid rgba(51, 65, 85, 0.6) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;
                    backdrop-filter: blur(12px) !important;
                    color: #f8fafc !important;
                    padding: 6px !important;
                }

                .plyr-protected-wrapper .plyr__menu__container .plyr__control {
                    border-radius: 8px !important;
                    color: #cbd5e1 !important;
                    font-size: 13px !important;
                }

                .plyr-protected-wrapper .plyr__menu__container .plyr__control:hover {
                    background: rgba(255, 255, 255, 0.1) !important;
                    color: #ffffff !important;
                }
            `}</style>
        </div>
    );
};
