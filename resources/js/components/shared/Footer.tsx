import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Phone, Mail, MapPin, Heart, ShieldCheck, Share2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { getLocalizedText } from '../../utils/localization';

export const Footer: React.FC = () => {
    const { t, language } = useLanguage();
    const { settings } = useSettings();
    const footer = settings?.footer_settings;

    const bgColor = footer?.bg_color || '#0f172a';
    const brandTitle = getLocalizedText(footer?.brand_title, footer?.brand_title_en, language)
        || (settings?.site_name ? settings.site_name.split(' ')[0] : 'Novonex');
    const brandSubtitle = getLocalizedText(footer?.brand_subtitle, footer?.brand_subtitle_en, language)
        || (settings?.site_name && settings.site_name.split(' ').length > 1 ? settings.site_name.split(' ').slice(1).join(' ') : 'Academy');

    const description = getLocalizedText(footer?.description, footer?.description_en, language) || t.footer.desc;
    const showBadge = footer?.show_badge !== false;
    const badgeText = getLocalizedText(footer?.badge_text, footer?.badge_text_en, language) || t.footer.trustedBadge;

    const col2Title = getLocalizedText(footer?.column_2_title, footer?.column_2_title_en, language) || t.footer.quickLinks;
    const rawCol2Links = footer?.column_2_links && footer.column_2_links.length > 0
        ? footer.column_2_links
        : [
            { id: '1', label: t.footer.home, url: '/' },
            { id: '2', label: t.footer.allCourses, url: '/courses' },
            { id: '3', label: language === 'en' ? 'Physics Courses' : 'পদার্থবিজ্ঞান কোর্সসমূহ', url: '/courses?category=hsc-physics' },
            { id: '4', label: language === 'en' ? 'Admission Preparation' : 'ভর্তি প্রস্তুতি কোর্সসমূহ', url: '/courses?category=admission' },
        ];
    const col2Links = rawCol2Links.map(link => ({
        ...link,
        label: getLocalizedText(link.label, link.label_en, language) || link.label,
    }));

    const col3Title = getLocalizedText(footer?.column_3_title, footer?.column_3_title_en, language) || t.footer.categoriesTitle;
    const rawCol3Links = footer?.column_3_links && footer.column_3_links.length > 0
        ? footer.column_3_links
        : [
            { id: '1', label: t.footer.physics, url: '/courses?category=hsc-physics' },
            { id: '2', label: t.footer.chemistry, url: '/courses?category=chemistry' },
            { id: '3', label: t.footer.math, url: '/courses?category=math' },
            { id: '4', label: t.footer.admission, url: '/courses?category=admission' },
        ];
    const col3Links = rawCol3Links.map(link => ({
        ...link,
        label: getLocalizedText(link.label, link.label_en, language) || link.label,
    }));

    const col4Title = getLocalizedText(footer?.column_4_title, footer?.column_4_title_en, language) || t.footer.contactUs;
    const phone = footer?.phone || settings?.contact_phone || '+880 1700 000000';
    const phoneHours = getLocalizedText(footer?.phone_hours, footer?.phone_hours_en, language) || t.footer.hotlineTime;
    const email = footer?.email || settings?.contact_email || 'support@novonex.edu.bd';
    const address = getLocalizedText(footer?.address, footer?.address_en, language) || (language === 'en' ? 'Dhaka, Bangladesh' : 'ঢাকা, বাংলাদেশ');
    const socialLinks = footer?.social_links || [];

    const defaultCopyright = `© 2026 ${brandTitle} ${brandSubtitle}. ${t.footer.rightsReserved}`;
    const copyrightText = getLocalizedText(footer?.copyright_text, footer?.copyright_text_en, language)
        || settings?.copyright_text
        || defaultCopyright;

    const defaultCredit = language === 'en' ? 'Crafted with ❤️ for passionate learners' : 'শিক্ষার্থীদের স্বপ্নপূরণের লক্ষ্যে ❤️ দিয়ে তৈরি';
    const bottomCredit = getLocalizedText(footer?.bottom_credit, footer?.bottom_credit_en, language) || defaultCredit;

    return (
        <footer style={{ backgroundColor: bgColor }} className="text-slate-300 pt-16 pb-12 border-t border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tight">
                                {brandTitle} <span className="text-sky-400">{brandSubtitle}</span>
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {description}
                        </p>
                        {showBadge && (
                            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg w-fit">
                                <ShieldCheck className="w-4 h-4" />
                                <span>{badgeText}</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-bold text-base mb-4 tracking-wide">{col2Title}</h4>
                        <ul className="space-y-2.5 text-sm">
                            {col2Links.map((link) => (
                                <li key={link.id || link.label}>
                                    {link.url.startsWith('http') ? (
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition-colors">
                                            {link.label}
                                        </a>
                                    ) : (
                                        <Link to={link.url} className="hover:text-sky-400 transition-colors">
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Popular Categories / Column 3 */}
                    <div>
                        <h4 className="text-white font-bold text-base mb-4 tracking-wide">{col3Title}</h4>
                        <ul className="space-y-2.5 text-sm">
                            {col3Links.map((link) => (
                                <li key={link.id || link.label}>
                                    {link.url.startsWith('http') ? (
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition-colors">
                                            {link.label}
                                        </a>
                                    ) : (
                                        <Link to={link.url} className="hover:text-sky-400 transition-colors">
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-white font-bold text-base mb-4 tracking-wide">{col4Title}</h4>
                        <ul className="space-y-3 text-sm">
                            {phone && (
                                <li className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 text-sky-400 mt-1 shrink-0" />
                                    <div>
                                        <span>{phone}</span>
                                        {phoneHours && (
                                            <div className="text-xs text-slate-400 mt-0.5">{phoneHours}</div>
                                        )}
                                    </div>
                                </li>
                            )}
                            {email && (
                                <li className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                                    <span>{email}</span>
                                </li>
                            )}
                            {address && (
                                <li className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-sky-400 mt-1 shrink-0" />
                                    <span>{address}</span>
                                </li>
                            )}
                        </ul>

                        {/* Social Links */}
                        {socialLinks.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-800/80">
                                <div className="flex flex-wrap items-center gap-2">
                                    {socialLinks.map((soc) => (
                                        <a
                                            key={soc.id || soc.platform}
                                            href={soc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white text-xs font-semibold capitalize transition"
                                        >
                                            {soc.platform}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Copyright Bar */}
                <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <div>{copyrightText}</div>
                    <div className="flex items-center gap-1">
                        {bottomCredit}
                    </div>
                </div>
            </div>
        </footer>
    );
};
