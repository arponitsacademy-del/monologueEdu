/**
 * Referral / Affiliate Tracking Utility
 * Stores referral code in localStorage and cookies for cross-session attribution.
 */

const REFERRAL_KEY = 'monologue_aff_ref';
const DEFAULT_EXPIRY_DAYS = 30;

interface StoredReferral {
    code: string;
    savedAt: number;
    expiryDays: number;
}

/**
 * Capture referral code from URL query string if present (e.g. ?ref=XYZ or ?affiliate=XYZ)
 */
export function captureReferralFromUrl(): string | null {
    if (typeof window === 'undefined') return null;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref') || urlParams.get('aff') || urlParams.get('affiliate');

        if (refCode && refCode.trim()) {
            const cleanCode = refCode.trim().toUpperCase();
            setStoredReferralCode(cleanCode, DEFAULT_EXPIRY_DAYS);
            return cleanCode;
        }
    } catch (e) {
        console.error('Error capturing referral code from URL', e);
    }

    return null;
}

/**
 * Save referral code with expiry days
 */
export function setStoredReferralCode(code: string, expiryDays: number = DEFAULT_EXPIRY_DAYS): void {
    if (typeof window === 'undefined') return;

    try {
        const payload: StoredReferral = {
            code: code.trim().toUpperCase(),
            savedAt: Date.now(),
            expiryDays: expiryDays || DEFAULT_EXPIRY_DAYS,
        };

        localStorage.setItem(REFERRAL_KEY, JSON.stringify(payload));

        // Also set a document cookie for redundancy
        const maxAge = (expiryDays || DEFAULT_EXPIRY_DAYS) * 24 * 60 * 60;
        document.cookie = `monologue_ref=${encodeURIComponent(code)}; max-age=${maxAge}; path=/; SameSite=Lax`;
    } catch (e) {
        console.error('Error storing referral code', e);
    }
}

/**
 * Get currently active referral code if not expired
 */
export function getStoredReferralCode(): string | null {
    if (typeof window === 'undefined') return null;

    try {
        // Try localStorage first
        const raw = localStorage.getItem(REFERRAL_KEY);
        if (raw) {
            const data: StoredReferral = JSON.parse(raw);
            const maxLifetime = (data.expiryDays || DEFAULT_EXPIRY_DAYS) * 24 * 60 * 60 * 1000;
            if (Date.now() - data.savedAt < maxLifetime) {
                return data.code;
            } else {
                localStorage.removeItem(REFERRAL_KEY);
            }
        }

        // Fallback: check cookie
        const match = document.cookie.match(/(?:^|; )monologue_ref=([^;]*)/);
        if (match && match[1]) {
            return decodeURIComponent(match[1]);
        }
    } catch (e) {
        console.error('Error reading stored referral code', e);
    }

    return null;
}

/**
 * Clear stored referral code
 */
export function clearStoredReferralCode(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(REFERRAL_KEY);
        document.cookie = 'monologue_ref=; max-age=0; path=/; SameSite=Lax';
    } catch (e) {
        console.error('Error clearing referral code', e);
    }
}

