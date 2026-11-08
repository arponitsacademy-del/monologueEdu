import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { Course, Category, CustomPage } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { 
    Sparkles, 
    BookOpen, 
    CheckCircle2, 
    Users, 
    PlayCircle, 
    ArrowRight, 
    Award, 
    Clock, 
    HelpCircle, 
    Star,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Flame,
    ClipboardList,
    Bot,
    FileText,
    Boxes,
    Zap,
    TrendingUp,
    ShieldCheck,
    Video,
    Check,
    Tag
} from 'lucide-react';

interface FeaturedTeacher {
    id: number;
    name: string;
    email?: string;
    designation: string;
    institution: string;
    photo_url?: string | null;
    bio?: string | null;
    courses_count: number;
}

interface FeaturedBundle {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string | null;
    short_description?: string | null;
    regular_price: number;
    sale_price: number;
    courses_count?: number;
    courses?: { id: number; title: string; thumbnail?: string | null }[];
}

export const HomePage: React.FC = () => {
    const { t, language } = useLanguage();
    const [customPage, setCustomPage] = useState<CustomPage | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [bundles, setBundles] = useState<FeaturedBundle[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [teachers, setTeachers] = useState<FeaturedTeacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [teachersLoading, setTeachersLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: -340, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: 340, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, catsRes, pageRes, teachersRes, bundlesRes] = await Promise.allSettled([
                    apiClient.get('/courses?per_page=12'),
                    apiClient.get('/categories'),
                    apiClient.get('/pages/home'),
                    apiClient.get('/teachers/featured'),
                    apiClient.get('/bundles/featured'),
                ]);

                if (coursesRes.status === 'fulfilled') {
                    setCourses(coursesRes.value.data.data || []);
                }
                if (catsRes.status === 'fulfilled') {
                    setCategories(catsRes.value.data || []);
                }
                if (pageRes.status === 'fulfilled' && pageRes.value.data?.page) {
                    setCustomPage(pageRes.value.data.page);
                }
                if (teachersRes.status === 'fulfilled') {
                    const teacherList = teachersRes.value.data?.data || teachersRes.value.data?.teachers || [];
                    setTeachers(teacherList);
                }
                if (bundlesRes.status === 'fulfilled') {
                    setBundles(bundlesRes.value.data?.bundles || []);
                }
            } catch {
                // handle error
            } finally {
                setLoading(false);
                setTeachersLoading(false);
            }
        };
        fetchData();
    }, []);

    // Smooth auto-scroll for Teacher carousel
    useEffect(() => {
        if (teachers.length <= 1 || isPaused) return;
        const interval = setInterval(() => {
            if (!carouselRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
            if (scrollLeft + clientWidth >= scrollWidth - 15) {
                carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                carouselRef.current.scrollBy({ left: 340, behavior: 'smooth' });
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [teachers, isPaused]);

    const handleCategoryClick = async (slug: string) => {
        if (activeCategory === slug) return;
        setActiveCategory(slug);
        setCoursesLoading(true);
        try {
            const url = slug === 'all' 
                ? '/courses?per_page=12' 
                : `/courses?per_page=12&category=${encodeURIComponent(slug)}`;
            const res = await apiClient.get(url);
            setCourses(res.data.data || []);
        } catch {
            // handle error
        } finally {
            setCoursesLoading(false);
        }
    };

    const faqs = [
        {
            q: 'মনোলগ এডু (Monologue Edu)-তে কোর্স কীভাবে কিনব বা ভর্তি হব?',
            a: 'যেকোনো কোর্সের কার্ডে থাকা "কোর্সটি কিনুন" বাটনে ক্লিক করুন। এরপর বিকাশ (bKash), নগদ (Nagad) বা রকেটের মাধ্যমে সরাসরি পেমেন্ট করে ট্রানজেকশন আইডি (TrxID) দিয়ে সাবমিট করলেই খুব দ্রুত আপনার কোর্স এনরোলমেন্ট সক্রিয় হয়ে যাবে।',
        },
        {
            q: 'লাইভ ক্লাস ছাড়াও কি রেকর্ডেড ক্লাস ও লেকচার শিট পাওয়া যাবে?',
            a: 'হ্যাঁ, প্রতিটি লাইভ ক্লাসের পর তা স্বয়ংক্রিয়ভাবে ফুল HD রেকর্ডেড আর্কাইভে জমা হয় যা পরীক্ষার শেষ দিন পর্যন্ত যতবার ইচ্ছা রিভিশন দেওয়া যায়। সাথে চ্যাপ্টারভিত্তিক প্র্যাকটিস শিট ও লেকচার নোটের পিডিএফ দেওয়া হয়।',
        },
        {
            q: 'NexPilot AI ডাউট সলভার কীভাবে পড়ালেখায় সাহায্য করে?',
            a: 'NexPilot হলো বাংলাদেশের প্রথম সম্পূর্ণ কারিকুলাম-সংযুক্ত ২৪/৭ এআই টিউটর। ক্লাসের পড়ালেখা, সূত্রের ব্যাখ্যা বা কোনো গাণিতিক সমস্যায় আটকে গেলে যেকোনো সময় চ্যাট করে সেকেন্ডের মধ্যে কনসেপ্ট ক্লিয়ার করা যায়।',
        },
        {
            q: 'অনলাইন মডেল টেস্ট ও মেরিট পজিশন কীভাবে কাজ করে?',
            a: 'পরীক্ষাগুলো বাস্তব বোর্ড ও ভর্তি পরীক্ষার মতো নেগেটিভ মার্কিংসহ টাইমারভিত্তিক নেওয়া হয়। পরীক্ষা জমা দেওয়ার সাথে সাথে স্বয়ংক্রিয় মূল্যায়ন, সঠিক উত্তরের ব্যাখ্যা এবং সকল পরীক্ষার্থীদের মধ্যে আপনার মেরিট পজিশন দেখতে পাবেন।',
        },
        {
            q: 'কোর্স কিনলে কি মোবাইল ও কম্পিউটার উভয় ডিভাইসে করা যাবে?',
            a: 'অবশ্যই! আমাদের প্ল্যাটফর্ম যেকোনো স্মার্টফোন, ট্যাবলেট এবং ল্যাপটপ/পিসিতে অত্যন্ত দ্রুত ও স্মুথলি কাজ করে।',
        },
    ];

    return (
        <div className="space-y-16 sm:space-y-24 pb-20 overflow-hidden font-sans">
            {/* Top Live Campaign Ribbon (Bondi Pathshala Style) */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 text-white text-xs sm:text-sm py-2.5 px-4 font-semibold text-center flex items-center justify-center gap-2 shadow-inner">
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
                <span>🔥 HSC একাডেমিক সাইকেল ও অ্যাডমিশন মাস্টার ব্যাচে স্পেশাল ছাড়ে ভর্তি চলছে!</span>
                <Link to="/courses" className="underline font-bold text-amber-300 hover:text-white transition-colors ml-1 hidden sm:inline">
                    সকল কোর্স দেখুন →
                </Link>
            </div>

            {/* 1. HERO SECTION (Bondi Pathshala Inspired Dynamic Layout) */}
            <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pt-8 sm:pt-14 pb-16 sm:pb-24 border-b border-slate-100 dark:border-slate-800 transition-colors">
                {/* Decorative background blurs */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                        {/* Left Content Column */}
                        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                            {/* Trust Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-slate-800 dark:to-slate-800 text-indigo-700 dark:text-sky-300 border border-indigo-200/80 dark:border-slate-700 text-xs sm:text-sm font-extrabold tracking-wide shadow-2xs">
                                <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                                </span>
                                <span>বাংলাদেশের আধুনিকতম অনলাইন লার্নিং প্ল্যাটফর্ম</span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.2] tracking-tight">
                                স্বপ্ন যেখানে বাস্তব হয়, <br />
                                <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
                                    কনসেপ্ট ক্লিয়ারিং থেকে
                                </span> <br />
                                অ্যাডমিশন জয়!
                            </h1>

                            {/* Subtitle */}
                            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                                অভিজ্ঞ মেন্টরদের লাইভ ও ফুল HD রেকর্ডেড ক্লাস, অধ্যায়ভিত্তিক লেকচার শিট, <strong className="text-indigo-600 dark:text-indigo-400 font-bold">24/7 NexPilot AI ডাউট সলভিং</strong> এবং রিয়েল টাইম মডেল টেস্টের মাধ্যমে প্রস্তুতি নাও ১০০% আত্মবিশ্বাসে।
                            </p>

                            {/* Dual CTAs */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                                <Link
                                    to="/courses"
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    <span>কোর্সগুলো ঘুরে দেখুন</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                                </Link>

                                <Link
                                    to="/student/exams"
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                                >
                                    <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <span>অনলাইন এক্সাম দিন</span>
                                </Link>
                            </div>

                            {/* Metrics Counter Bar */}
                            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200/80 dark:border-slate-800 text-left">
                                <div className="space-y-0.5">
                                    <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">৫০,০০০+</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">সক্রিয় শিক্ষার্থী</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">১০০+</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">ফ্ল্যাগশিপ কোর্স</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">৯৮%</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">পরীক্ষায় সাফল্য</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">২৪/৭</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">এআই ডাউট সলভার</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Bondi Pathshala Style Interactive Visual Card */}
                        <div className="lg:col-span-5 relative">
                            <div className="relative mx-auto max-w-md lg:max-w-none bg-gradient-to-tr from-indigo-600 via-sky-600 to-indigo-800 p-1 rounded-3xl shadow-2xl shadow-indigo-500/25">
                                <div className="bg-slate-900 rounded-[22px] p-6 text-white space-y-5">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-2.5 w-2.5 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                            </span>
                                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                                                লাইভ ফ্ল্যাগশিপ প্রোগ্রাম
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-md">
                                            Academic Cycle 2026-27
                                        </span>
                                    </div>

                                    {/* Program Card Title */}
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                                            HSC Academic & Admission Complete Preparation Cycle
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Physics, Chemistry, Higher Math ও Biology-র সম্পূর্ণ বোর্ড সিলেবাস ও অ্যাডমিশন প্রস্তুতি এক প্ল্যাটফর্মে।
                                        </p>
                                    </div>

                                    {/* Highlights list with icons */}
                                    <div className="space-y-2.5">
                                        <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                                                <Video className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white">লাইভ ও ফুল HD রেকর্ডেড ক্লাস</h4>
                                                <p className="text-[11px] text-slate-400">পরীক্ষার আগ পর্যন্ত আনলিমিটেড রিভিশন আর্কাইভ</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                                <Bot className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white">NexPilot AI ডাউট সলভার</h4>
                                                <p className="text-[11px] text-slate-400">যে কোনো প্রশ্নে আটকে গেলে ইনস্ট্যান্ট এআই ব্যাখ্যা</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white">বোর্ড ও অ্যাডমিশন স্ট্যান্ডার্ড মডেল টেস্ট</h4>
                                                <p className="text-[11px] text-slate-400">নেগেটিভ মার্কিংসহ ইনস্ট্যান্ট মেরিট লিস্ট ও অ্যানালাইসিস</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-2">
                                        <Link
                                            to="/courses"
                                            className="block w-full py-3.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-600 hover:opacity-95 text-white font-extrabold rounded-xl text-center text-sm shadow-md transition-all cursor-pointer"
                                        >
                                            এখনই ব্যাচে ভর্তি হোন
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. BONDI PATHSHALA STYLE ACADEMIC SEGMENTS (Quick Jump Cards) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
                        একাডেমিক সেগমেন্টস
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        তুমি কোন ক্লাসের জন্য প্রস্তুতি নিচ্ছ?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        তোমার লক্ষ্য অনুযায়ী কোর্স বেছে নাও এবং আজ থেকেই নিজের স্বপ্ন পূরণের যাত্রা শুরু করো।
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {/* HSC Academic */}
                    <div 
                        onClick={() => handleCategoryClick('all')}
                        className="bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border border-sky-100 dark:border-slate-800 text-center hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">HSC একাডেমিক</h3>
                        <p className="text-[11px] text-slate-500 mt-1">১ম ও ২য় বর্ষ সাইকেল</p>
                    </div>

                    {/* Engineering Admission */}
                    <div 
                        onClick={() => handleCategoryClick('all')}
                        className="bg-gradient-to-b from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-slate-800 text-center hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">ইঞ্জিনিয়ারিং ভর্তি</h3>
                        <p className="text-[11px] text-slate-500 mt-1">BUET, CKRUET প্রস্তুতি</p>
                    </div>

                    {/* Varsity Admission */}
                    <div 
                        onClick={() => handleCategoryClick('all')}
                        className="bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border border-purple-100 dark:border-slate-800 text-center hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Award className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">ভার্সিটি ‘ক’ ও ‘খ’</h3>
                        <p className="text-[11px] text-slate-500 mt-1">ঢাকা বিশ্ববিদ্যালয় ও গুচ্ছ</p>
                    </div>

                    {/* Course Bundles */}
                    <div 
                        onClick={() => handleCategoryClick('all')}
                        className="bg-gradient-to-b from-amber-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-100 dark:border-slate-800 text-center hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Boxes className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">কম্বো বান্ডেল</h3>
                        <p className="text-[11px] text-slate-500 mt-1">একাধিক কোর্স একসাথে</p>
                    </div>

                    {/* Online Model Tests */}
                    <Link 
                        to="/student/exams"
                        className="col-span-2 sm:col-span-1 bg-gradient-to-b from-emerald-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border border-emerald-100 dark:border-slate-800 text-center hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">অনলাইন এক্সাম</h3>
                        <p className="text-[11px] text-slate-500 mt-1">রিয়েল টাইম টেস্ট হল</p>
                    </Link>
                </div>
            </section>

            {/* 3. FEATURED COURSES SECTION (Bondi Pathshala Style Cards) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
                            <Flame className="w-4 h-4 text-rose-500" />
                            <span>জনপ্রিয় ও চলমান কোর্সসমূহ</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            আমাদের সেরা কোর্সসমূহ
                        </h2>
                    </div>
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                        <span>সকল কোর্স দেখুন</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Dynamic Category Navigation Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
                    <button
                        onClick={() => handleCategoryClick('all')}
                        className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                            activeCategory === 'all'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                        }`}
                    >
                        সকল কোর্স
                    </button>
                    {categories.map((cat) => {
                        const isSelected = activeCategory === cat.slug;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                    isSelected
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                                }`}
                            >
                                <span>{cat.name}</span>
                                {cat.courses_count !== undefined && cat.courses_count > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                        {cat.courses_count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {loading || coursesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse space-y-4">
                                <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-slate-500 space-y-3">
                        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">বর্তমানে কোনো কোর্স পাওয়া যায়নি</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">খুব শীঘ্রই এই ক্যাটাগরিতে নতুন ব্যাচের কোর্স যুক্ত করা হবে।</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-2xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col overflow-hidden relative"
                            >
                                {/* Thumbnail Header */}
                                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-800 to-indigo-950 text-white">
                                            <BookOpen className="w-12 h-12 text-indigo-400 opacity-60" />
                                        </div>
                                    )}

                                    {/* Discount Badge */}
                                    {course.discount_percent && course.discount_percent > 0 ? (
                                        <span className="absolute top-3 right-3 px-3 py-1 text-xs font-black bg-rose-600 text-white rounded-xl shadow-md">
                                            {course.discount_percent}% ছাড়
                                        </span>
                                    ) : course.price === 0 ? (
                                        <span className="absolute top-3 right-3 px-3 py-1 text-xs font-black bg-emerald-600 text-white rounded-xl shadow-md">
                                            ফ্রি কোর্স
                                        </span>
                                    ) : null}

                                    {/* Category Pill on image */}
                                    {course.categories && course.categories.length > 0 && (
                                        <span className="absolute bottom-3 left-3 px-2.5 py-1 text-[11px] font-bold bg-black/70 backdrop-blur-xs text-white rounded-lg">
                                            {course.categories[0].name}
                                        </span>
                                    )}
                                </div>

                                {/* Content Body */}
                                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Video className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>{course.lessons_count || 0} টি ক্লাস</span>
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-sky-500" />
                                                <span>{course.enrollments_count || 0} জন শিক্ষার্থী</span>
                                            </span>
                                        </div>

                                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                            {course.title}
                                        </h3>

                                        {/* Bondi Pathshala style feature checklist */}
                                        <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                <span>লাইভ ও ফুল HD রেকর্ডেড ক্লাস আর্কাইভ</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                <span>চ্যাপ্টারভিত্তিক লেকচার শিট ও প্রশ্নব্যাংক</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                <span>NexPilot AI ২৪/৭ ইনস্ট্যান্ট ডাউট সলভার</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing & Instructor Row */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-medium text-slate-500 truncate mr-2">
                                                ইন্সট্রাক্টর: <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {course.instructors && course.instructors.length > 0 
                                                        ? course.instructors[0].name 
                                                        : (course.instructor?.name || 'অভিজ্ঞ মেন্টর')}
                                                </span>
                                            </div>

                                            <div className="text-right shrink-0">
                                                {course.price === 0 ? (
                                                    <span className="text-lg font-black text-emerald-600">ফ্রি</span>
                                                ) : (
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">
                                                            {formatBDT(course.effective_price || course.price)}
                                                        </span>
                                                        {course.sale_price && course.sale_price < course.price && (
                                                            <span className="text-xs text-slate-400 line-through">
                                                                {formatBDT(course.price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <Link
                                                to={`/courses/${course.slug}`}
                                                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 text-center transition-all cursor-pointer"
                                            >
                                                বিস্তারিত দেখুন
                                            </Link>
                                            <Link
                                                to={`/checkout/${course.slug}`}
                                                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white text-center transition-all shadow-sm cursor-pointer"
                                            >
                                                কোর্সটি কিনুন
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 4. COURSE BUNDLES SHOWCASE SECTION (Special High-Converting Bundles) */}
            {bundles.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-tr from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl border border-indigo-800/60">
                        {/* Glow accent */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider mb-2">
                                    <Boxes className="w-3.5 h-3.5" />
                                    <span>কম্বো বান্ডেল অফার</span>
                                </span>
                                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                                    স্পেশাল কোর্স বান্ডেলসমূহ
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                                    একাধিক কোর্স একসাথে বান্ডেল আকারে নিয়ে সম্পূর্ণ প্রস্তুতি সম্পন্ন করো সর্বোচ্চ সাশ্রয়ী মূল্যে।
                                </p>
                            </div>
                            <Link
                                to="/courses"
                                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-amber-300 hover:text-white transition-colors"
                            >
                                <span>সবগুলো বান্ডেল দেখুন</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bundles.map((bundle) => (
                                <div
                                    key={bundle.id}
                                    className="bg-slate-800/80 rounded-2xl border border-indigo-700/40 p-5 flex flex-col justify-between hover:border-amber-400 transition-all group"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                                                {bundle.courses_count || bundle.courses?.length || 0} টি কোর্স একসাথে
                                            </span>
                                            <span className="text-xs font-bold text-emerald-400">
                                                মেগা সেভিং প্যাক
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                                            {bundle.title}
                                        </h3>

                                        {bundle.short_description && (
                                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                                {bundle.short_description}
                                            </p>
                                        )}

                                        {/* Included Courses Pills */}
                                        {bundle.courses && bundle.courses.length > 0 && (
                                            <div className="pt-2 space-y-1">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    অন্তর্ভুক্ত কোর্সসমূহ:
                                                </div>
                                                <div className="space-y-1">
                                                    {bundle.courses.slice(0, 3).map((c) => (
                                                        <div key={c.id} className="text-xs text-slate-200 flex items-center gap-1.5 truncate">
                                                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                            <span className="truncate">{c.title}</span>
                                                        </div>
                                                    ))}
                                                    {bundle.courses.length > 3 && (
                                                        <div className="text-[10px] text-amber-300 font-bold">
                                                            + আরও {bundle.courses.length - 3} টি কোর্স
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pricing & CTA */}
                                    <div className="pt-4 mt-4 border-t border-slate-700/80 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-xs text-slate-400 line-through">
                                                {formatBDT(bundle.regular_price)}
                                            </div>
                                            <div className="text-xl font-black text-amber-400">
                                                {formatBDT(bundle.sale_price)}
                                            </div>
                                        </div>

                                        <Link
                                            to={`/courses`}
                                            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors shadow-md cursor-pointer"
                                        >
                                            বান্ডেলটি নিন
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 5. BONDI PATHSHALA STYLE ROUTINE & MODEL TEST CTA BANNER */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>পরীক্ষার আগেই শতভাগ প্রস্তুতি যাচাই</span>
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                                লাইভ এক্সাম হলে পরীক্ষা দাও, <br />
                                ইনস্ট্যান্ট মেরিট লিস্টে নিজের অবস্থান জানো!
                            </h2>
                            <p className="text-xs sm:text-sm text-sky-100 max-w-xl leading-relaxed">
                                নেগেটিভ মার্কিংসহ বোর্ড ও ভর্তি পরীক্ষার অনুরূপ পরিবেশে চ্যাপ্টারভিত্তিক মডেল টেস্ট এবং সাথে প্রতিটি প্রশ্নের পূর্ণাঙ্গ সল্যুশন ও রিভিউ শিট।
                            </p>
                        </div>

                        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                            <Link
                                to="/student/exams"
                                className="px-6 py-3.5 bg-white hover:bg-slate-100 text-indigo-700 font-black rounded-2xl text-center text-sm shadow-md transition-all cursor-pointer"
                            >
                                অনলাইন মডেল টেস্ট দিন
                            </Link>
                            <Link
                                to="/courses?type=free"
                                className="px-6 py-3.5 bg-indigo-900/60 hover:bg-indigo-900 text-white border border-white/20 font-bold rounded-2xl text-center text-sm transition-all cursor-pointer"
                            >
                                ফ্রি রিসোর্স ও ডেমো ক্লাস
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. BEST INSTRUCTORS & MENTORS CAROUSEL */}
            {(teachers.length > 0 || teachersLoading) && (
                <section className="relative py-12 sm:py-16 bg-gradient-to-b from-white via-indigo-50/30 to-white dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 border-y border-slate-100 dark:border-slate-800/80 transition-colors">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Section Header with Carousel Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wide uppercase mb-2">
                                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                                    <span>অভিজ্ঞ মেন্টর প্যানেল</span>
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                    দেশসেরা শিক্ষকদের তত্ত্বাবধানে প্রস্তুতি
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                                    BUET, ঢাকা বিশ্ববিদ্যালয় ও শীর্ষস্থানীয় প্রতিষ্ঠানের অভিজ্ঞ শিক্ষকদের কাছ থেকে শেখো সহজ টেকনিক ও গভীর ধারণা।
                                </p>
                            </div>

                            {/* Carousel Arrow Controls */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <button
                                    onClick={scrollLeft}
                                    aria-label="Previous teachers"
                                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={scrollRight}
                                    aria-label="Next teachers"
                                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Carousel Scroll Container */}
                        {teachersLoading ? (
                            <div className="flex gap-6 overflow-hidden py-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="w-[280px] sm:w-[320px] shrink-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 animate-pulse space-y-4"
                                    >
                                        <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 mx-auto" />
                                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 mx-auto" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2 mx-auto" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                ref={carouselRef}
                                onMouseEnter={() => setIsPaused(true)}
                                onMouseLeave={() => setIsPaused(false)}
                                className="flex gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-none"
                                style={{ scrollSnapType: 'x mandatory' }}
                            >
                                {teachers.map((teacher) => (
                                    <div
                                        key={teacher.id}
                                        style={{ scrollSnapAlign: 'start' }}
                                        className="w-[280px] sm:w-[320px] shrink-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500" />

                                        <div className="space-y-4">
                                            {/* Photo & Initial */}
                                            <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-100 to-sky-100 dark:from-slate-800 dark:to-slate-700 p-1 shadow-md group-hover:scale-105 transition-transform duration-300">
                                                {teacher.photo_url ? (
                                                    <img
                                                        src={teacher.photo_url}
                                                        alt={teacher.name}
                                                        className="w-full h-full object-cover rounded-[14px]"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                        }}
                                                    />
                                                ) : null}
                                                {!teacher.photo_url && (
                                                    <div className="w-full h-full rounded-[14px] bg-gradient-to-tr from-indigo-600 to-sky-600 text-white flex items-center justify-center font-black text-3xl">
                                                        {(teacher.name || 'T').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Name & Designation */}
                                            <div className="text-center space-y-1.5">
                                                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                                    {teacher.name}
                                                </h3>

                                                <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 line-clamp-1">
                                                    {teacher.designation || 'ইন্সট্রাক্টর'}
                                                </div>

                                                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
                                                    <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                                                    <span className="line-clamp-1">{teacher.institution || 'Monologue Edu'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 font-medium">কোর্স সংখ্যা</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {teacher.courses_count || 0} টি কোর্স
                                                </span>
                                            </div>

                                            <Link
                                                to={`/teachers/${teacher.id}`}
                                                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white font-bold text-xs text-slate-700 dark:text-slate-200 text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                                            >
                                                <span>প্রোফাইল ও কোর্সসমূহ</span>
                                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 7. WHY CHOOSE MONOLOGUE EDU (Platform Pillars) */}
            <section className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-950 px-3 py-1 rounded-full border border-sky-800">
                            কেন মনোলগ এডু সেরা?
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                            সঠিক দিকনির্দেশনা ও সর্বোচ্চ প্রস্তুতি
                        </h2>
                        <p className="text-slate-400 text-xs sm:text-sm">
                            আমরা কেবল পড়াই না, শিক্ষার্থী যেন প্রতিটি বিষয়ে নিজেই মাস্টার হতে পারে সেই পথ তৈরি করি।
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 hover:border-indigo-500 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                <Video className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-white">কনসেপ্ট-ফার্স্ট শিখন</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                মুখস্থ নয়, প্রতিটি বিষয়ের গোড়া থেকে গভীর কনসেপ্ট বুঝিয়ে যেকোনো ধরনের প্রশ্ন সমাধানের কৌশল শেখানো হয়।
                            </p>
                        </div>

                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 hover:border-indigo-500 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                                <Bot className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-white">NexPilot AI ডাউট সলভার</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                রাত ২টায় পড়লেও আর ডাউট জমে থাকবে না। আমাদের নিজস্ব এআই টিউটর সেকেন্ডের মধ্যে সমাধান করে দেবে।
                            </p>
                        </div>

                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 hover:border-indigo-500 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-white">রিয়েল-টাইম মডেল টেস্ট</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                নিয়মিত চ্যাপ্টারওয়াইজ পরীক্ষা, নেগেটিভ মার্কিং ও মেরিট পজিশন যাচাইয়ের মাধ্যমে পরীক্ষার ভয় দূর হয়।
                            </p>
                        </div>

                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 hover:border-indigo-500 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-white">পূর্ণাঙ্গ লেকচার শিট ও নোট</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                ক্লাসের সাথে সাথেই গোছানো বোর্ড-স্ট্যান্ডার্ড লেকচার শিট ও ফর্মুলা বুক যা রিভিশনকে করে দ্বিগুণ দ্রুত।
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ Accordion) */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 space-y-2">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
                        সাধারণ জিজ্ঞাসা
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                        কোর্স ভর্তি ও প্ল্যাটফর্ম ব্যবহারের নিয়মকানুন সম্পর্কে জেনে নাও।
                    </p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, idx) => {
                        const isOpen = openFaq === idx;
                        return (
                            <div
                                key={idx}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all shadow-2xs"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                                            isOpen ? 'rotate-180 text-indigo-600' : ''
                                        }`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 9. COMMUNITY & ADMISSION CONSULTANCY BANNER */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden border border-slate-800">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wide">
                        <Users className="w-3.5 h-3.5" />
                        <span>লার্নার্স কমিউনিটি</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-black max-w-2xl mx-auto leading-tight">
                        আজই যুক্ত হও ৫০,০০০+ শিক্ষার্থীদের সাথে তোমার স্বপ্নের যাত্রায়!
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                        যেকোনো কোর্স সংক্রান্ত পরামর্শ বা দিকনির্দেশনার জন্য আমাদের সাপোর্ট টিম সর্বদা প্রস্তুত রয়েছে।
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 pt-2">
                        <Link
                            to="/courses"
                            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                        >
                            কোর্সসমূহ দেখুন
                        </Link>
                        <Link
                            to="/register"
                            className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-2xl text-sm transition-all border border-slate-700 cursor-pointer"
                        >
                            ফ্রি রেজিস্ট্রেশন করুন
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};
