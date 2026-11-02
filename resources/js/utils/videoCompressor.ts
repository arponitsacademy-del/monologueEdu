import {
    Input,
    Output,
    Mp4OutputFormat,
    BufferTarget,
    Conversion,
    ALL_FORMATS,
    BlobSource,
    Quality
} from 'mediabunny';

export interface CompressProgressCallback {
    (percent: number, processedSeconds: number): void;
}

export interface CompressVideoResult {
    file: Blob;
    originalSize: number;
    compressedSize: number;
    savedPercentage: number;
    durationSeconds: number;
    wasCompressed: boolean;
}

export type CompressionPreset = '720p' | '1080p' | 'original';

export const isWebCodecsSupported = (): boolean => {
    return (
        typeof window !== 'undefined' &&
        typeof (window as any).VideoEncoder === 'function' &&
        typeof (window as any).VideoDecoder === 'function'
    );
};

export class VideoCompressionSession {
    private currentConversion: Conversion | null = null;
    private isCanceled = false;

    public async compress(
        file: File,
        preset: CompressionPreset = '720p',
        onProgress?: CompressProgressCallback
    ): Promise<CompressVideoResult> {
        this.isCanceled = false;
        const originalSize = file.size;

        if (preset === 'original' || !isWebCodecsSupported()) {
            return {
                file,
                originalSize,
                compressedSize: originalSize,
                savedPercentage: 0,
                durationSeconds: 0,
                wasCompressed: false
            };
        }

        const input = new Input({
            source: new BlobSource(file),
            formats: ALL_FORMATS
        });

        // Try getting duration for progress calculation
        let duration = 0;
        try {
            duration = (await input.getDurationFromMetadata()) || 0;
        } catch (_) {}

        const output = new Output({
            format: new Mp4OutputFormat(),
            target: new BufferTarget()
        });

        const targetHeight = preset === '720p' ? 720 : 1080;
        const qualityLevel = preset === '720p' ? 'medium' : 'high';

        // Check video track to avoid upscaling
        const videoOptions: any = {
            codec: 'avc',
            quality: new Quality(qualityLevel),
            fit: 'contain'
        };

        try {
            const videoTrack = await input.getPrimaryVideoTrack();
            if (videoTrack) {
                const origHeight = videoTrack.codedHeight || 1080;
                // Only downscale, never upscale
                if (origHeight > targetHeight) {
                    videoOptions.height = targetHeight;
                }
            } else {
                videoOptions.height = targetHeight;
            }
        } catch (_) {
            videoOptions.height = targetHeight;
        }

        // Check if there is an audio track
        let audioOptions: any = undefined;
        try {
            const audioTracks = await input.getAudioTracks();
            if (audioTracks && audioTracks.length > 0) {
                audioOptions = {
                    codec: 'aac'
                };
            }
        } catch (_) {}

        const conversion = await Conversion.init({
            input,
            output,
            video: videoOptions,
            ...(audioOptions ? { audio: audioOptions } : {})
        });

        if (!conversion.isValid) {
            throw new Error('এই ভিডিও ফরম্যাটটি ব্রাউজারে রূপান্তর করার উপযোগী নয়।');
        }

        this.currentConversion = conversion;

        conversion.onProgress = (pct, processedTime) => {
            if (this.isCanceled) return;
            const cleanPercent = Math.min(100, Math.max(0, Math.round(pct * 100)));
            if (onProgress) {
                onProgress(cleanPercent, processedTime || 0);
            }
        };

        await conversion.execute();

        if (this.isCanceled) {
            throw new Error('কম্প্রেশন বাতিল করা হয়েছে।');
        }

        const buffer = output.target.buffer;
        if (!buffer || buffer.byteLength === 0) {
            throw new Error('কম্প্রেশন আউটপুট পাওয়া যায়নি।');
        }

        const compressedBlob = new Blob([buffer], { type: 'video/mp4' });
        const compressedSize = compressedBlob.size;

        // If compression resulted in larger file (e.g. on tiny clips), use original!
        const shouldUseCompressed = compressedSize < originalSize;
        const finalBlob = shouldUseCompressed ? compressedBlob : file;
        const finalSize = shouldUseCompressed ? compressedSize : originalSize;
        const savedPercentage = shouldUseCompressed
            ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
            : 0;

        return {
            file: finalBlob,
            originalSize,
            compressedSize: finalSize,
            savedPercentage,
            durationSeconds: duration,
            wasCompressed: shouldUseCompressed
        };
    }

    public async cancel() {
        this.isCanceled = true;
        if (this.currentConversion) {
            try {
                await this.currentConversion.cancel();
            } catch (_) {}
            this.currentConversion = null;
        }
    }
}
