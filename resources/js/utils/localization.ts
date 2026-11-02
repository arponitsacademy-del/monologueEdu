const BN_TO_EN_MAP: Record<string, string> = {
    'হোম': 'Home',
    'সকল কোর্স': 'All Courses',
    'সকল কোর্সসমূহ': 'All Courses',
    'পদার্থবিজ্ঞান': 'Physics',
    'পদার্থবিজ্ঞান কোর্সসমূহ': 'Physics Courses',
    'রসায়ন': 'Chemistry',
    'উচ্চতর গণিত': 'Higher Mathematics',
    'ভর্তি প্রস্তুতি': 'Admission Preparation',
    'ভর্তি প্রস্তুতি কোর্সসমূহ': 'Admission Preparation',
    'যোগাযোগ': 'Contact Us',
    'দ্রুত লিঙ্কসমূহ': 'Quick Links',
    'জনপ্রিয় বিষয়সমূহ': 'Popular Categories',
    'ভর্তি হন': 'Enroll Now',
    'বিস্তারিত দেখুন': 'View Details',
    'ফ্রি ক্লাস দেখুন': 'Free Classes',
    'ঢাকা, বাংলাদেশ': 'Dhaka, Bangladesh',
};

/**
 * Resolves localized text based on the active language.
 * When in English mode, prefers enText (or mapped English if mainText is Bengali).
 * When in Bengali mode, prefers mainText (or enText if mainText is not set).
 */
export function getLocalizedText(
    mainText?: string | null,
    enText?: string | null,
    language: 'en' | 'bn' = 'en'
): string {
    if (language === 'en') {
        if (enText && enText.trim()) {
            return enText.trim();
        }
        if (mainText && mainText.trim()) {
            const trimmed = mainText.trim();
            return BN_TO_EN_MAP[trimmed] || trimmed;
        }
    } else {
        if (mainText && mainText.trim()) {
            return mainText.trim();
        }
        if (enText && enText.trim()) {
            return enText.trim();
        }
    }
    return '';
}
