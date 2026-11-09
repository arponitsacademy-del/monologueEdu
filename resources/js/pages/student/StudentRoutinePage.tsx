import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    Radio, 
    BookOpen, 
    CheckCircle2, 
    Bell, 
    Sparkles, 
    ChevronLeft, 
    ChevronRight, 
    PlayCircle, 
    Award,
    Loader2
} from 'lucide-react';

interface RoutineEvent {
    id: number;
    type: 'live_class' | 'live_exam';
    title: string;
    description?: string | null;
    start_time: string | null;
    end_time: string | null;
    date: string | null;
    time_time: string;
    time_period: string;
    time_display: string;
    subject: string;
    subject_theme: 'amber' | 'blue' | 'rose' | 'emerald' | 'violet' | 'teal' | 'green' | 'indigo';
    course_id?: number | null;
    course_title: string;
    instructor_name: string;
    is_live: boolean;
    is_upcoming: boolean;
    is_completed: boolean;
    action_url: string;
    status: string;
    duration_minutes?: number;
    total_marks?: number;
}

const BENGALI_DIGITS: { [key: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

const BENGALI_MONTHS = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const BENGALI_DAYS_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const BENGALI_DAYS_FULL = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

export const toBengaliNumber = (num: number | string): string => {
    return String(num).replace(/[0-9]/g, (match) => BENGALI_DIGITS[match] || match);
};

export const StudentRoutinePage: React.FC = () => {
    const [events, setEvents] = useState<RoutineEvent[]>([]);
    const [datesWithEvents, setDatesWithEvents] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    });

    const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
    const [reminderSetMap, setReminderSetMap] = useState<{ [key: string]: boolean }>({});
    const dateStripRef = useRef<HTMLDivElement>(null);

    const todayStr = useMemo(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);

    useEffect(() => {
        fetchRoutine();
    }, []);

    const fetchRoutine = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/student/routine');
            setEvents(res.data.events || []);
            setDatesWithEvents(res.data.dates_with_events || []);
            if (res.data.server_today) {
                // optionally sync
            }
        } catch (err) {
            console.error('Failed to load routine events', err);
        } finally {
            setLoading(false);
        }
    };

    // Generate days for the horizontal strip (entire current month or +/- 15 days window)
    const monthDays = useMemo(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(day).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            const dayOfWeek = dateObj.getDay();

            days.push({
                dateStr,
                dayNumber: day,
                dayNumberBn: toBengaliNumber(day),
                dayNameBn: BENGALI_DAYS_SHORT[dayOfWeek],
                isToday: dateStr === todayStr,
                hasEvents: datesWithEvents.includes(dateStr),
            });
        }
        return days;
    }, [currentMonthDate, datesWithEvents, todayStr]);

    // Jump to Today
    const handleJumpToToday = () => {
        const now = new Date();
        setCurrentMonthDate(now);
        setSelectedDateStr(todayStr);

        setTimeout(() => {
            const el = document.getElementById(`date-chip-${todayStr}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 100);
    };

    // Previous / Next Month
    const handlePrevMonth = () => {
        setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Filter events for selected date
    const selectedDateEvents = useMemo(() => {
        return events.filter(e => e.date === selectedDateStr);
    }, [events, selectedDateStr]);

    // Selected date display label
    const selectedDateHeaderLabel = useMemo(() => {
        if (!selectedDateStr) return '';
        const parts = selectedDateStr.split('-');
        if (parts.length !== 3) return selectedDateStr;

        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const isToday = selectedDateStr === todayStr;
        const dayOfWeek = BENGALI_DAYS_FULL[dateObj.getDay()];
        const dayBn = toBengaliNumber(dateObj.getDate());
        const monthBn = BENGALI_MONTHS[dateObj.getMonth()];

        const count = selectedDateEvents.length;
        const countText = count > 0 ? `${toBengaliNumber(count)}টি ইভেন্ট` : 'কোনো ক্লাস নেই';

        if (isToday) {
            return `আজ • ${dayOfWeek}, ${dayBn} ${monthBn} ${countText}`;
        }
        return `${dayOfWeek}, ${dayBn} ${monthBn} • ${countText}`;
    }, [selectedDateStr, todayStr, selectedDateEvents.length]);

    // Handle Reminder Click
    const handleToggleReminder = (eventKey: string, title: string) => {
        setReminderSetMap(prev => {
            const isCurrentlySet = Boolean(prev[eventKey]);
            const nextState = !isCurrentlySet;
            if (nextState) {
                alert(`🔔 "${title}" এর জন্য রিমাইন্ডার সেট করা হয়েছে! ক্লাস/পরীক্ষা শুরুর পূর্বে আপনাকে নোটিফিকেশন পাঠানো হবে।`);
            }
            return { ...prev, [eventKey]: nextState };
        });
    };

    const currentMonthLabel = `${BENGALI_MONTHS[currentMonthDate.getMonth()]} ${toBengaliNumber(currentMonthDate.getFullYear())}`;

    // Theme border & badge styling
    const getThemeStyles = (theme: string) => {
        switch (theme) {
            case 'amber':
                return {
                    border: 'border-amber-500',
                    pillBg: 'bg-amber-50 text-amber-800 border-amber-200/60',
                };
            case 'blue':
                return {
                    border: 'border-blue-500',
                    pillBg: 'bg-blue-50 text-blue-800 border-blue-200/60',
                };
            case 'rose':
                return {
                    border: 'border-rose-500',
                    pillBg: 'bg-rose-50 text-rose-800 border-rose-200/60',
                };
            case 'violet':
                return {
                    border: 'border-purple-500',
                    pillBg: 'bg-purple-50 text-purple-800 border-purple-200/60',
                };
            case 'teal':
                return {
                    border: 'border-teal-500',
                    pillBg: 'bg-teal-50 text-teal-800 border-teal-200/60',
                };
            case 'green':
                return {
                    border: 'border-emerald-500',
                    pillBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
                };
            default:
                return {
                    border: 'border-[#0B4B34]',
                    pillBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
                };
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <CalendarIcon className="w-7 h-7 text-[#0B4B34]" />
                        <span>রুটিন</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="পূর্ববর্তী মাস"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-bold text-slate-500">
                            {currentMonthLabel}
                        </span>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="পরবর্তী মাস"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Right: 'আজ' (Today) Pill Button */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={handleJumpToToday}
                        className="px-5 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#0B4B34] font-black text-xs transition-all shadow-2xs border border-emerald-200/80 cursor-pointer active:scale-95"
                    >
                        আজ
                    </button>
                </div>
            </div>

            {/* Horizontal Calendar Date Strip */}
            <div className="relative">
                <div 
                    ref={dateStripRef}
                    className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto py-2 px-1 scroll-smooth no-scrollbar"
                >
                    {monthDays.map((day) => {
                        const isSelected = selectedDateStr === day.dateStr;

                        return (
                            <button
                                key={day.dateStr}
                                id={`date-chip-${day.dateStr}`}
                                type="button"
                                onClick={() => setSelectedDateStr(day.dateStr)}
                                className={`shrink-0 w-12 sm:w-14 py-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-[#0B4B34] text-white shadow-md shadow-emerald-950/25 ring-2 ring-[#0B4B34]/30 scale-105'
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs'
                                }`}
                            >
                                <span className={`text-[11px] font-bold ${
                                    isSelected ? 'text-emerald-100' : 'text-slate-400'
                                }`}>
                                    {day.isToday ? 'আজ' : day.dayNameBn}
                                </span>
                                <span className="text-base font-black tracking-tight mt-0.5">
                                    {day.dayNumberBn}
                                </span>

                                {/* Event indicator dot below */}
                                <span 
                                    className={`w-1.5 h-1.5 rounded-full mt-1.5 transition-all ${
                                        isSelected 
                                            ? 'bg-white' 
                                            : day.hasEvents 
                                                ? 'bg-[#0B4B34]' 
                                                : 'opacity-0'
                                    }`}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Daily Header Subtitle */}
            <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-800">
                    {selectedDateHeaderLabel}
                </h3>
            </div>

            {/* Event Cards Section */}
            {loading ? (
                <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center shadow-xs">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0B4B34] mx-auto mb-3" />
                    <p className="text-xs text-slate-500">রুটিন তথ্য লোড করা হচ্ছে...</p>
                </div>
            ) : selectedDateEvents.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 sm:p-16 border border-slate-200/80 shadow-xs text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0B4B34] flex items-center justify-center mx-auto">
                        <CalendarIcon className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-slate-800">
                        এই দিনে কোনো লাইভ ক্লাস বা পরীক্ষা নেই
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        আজকের দিনে নির্ধারিত কোনো শিডিউল নেই। পূর্বের ক্লাসের নোট ও প্র্যাকটিস পরীক্ষাগুলো রিভিশন দিয়ে প্রস্তুতি সম্পন্ন রাখুন।
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-3">
                        <Link
                            to="/student/exams"
                            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0B4B34] font-bold text-xs rounded-xl transition-colors"
                        >
                            প্র্যাকটিস এক্সাম দিন
                        </Link>
                        <Link
                            to="/student/my-courses"
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                        >
                            কোর্স কনটেন্ট দেখুন
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {selectedDateEvents.map((evt) => {
                        const eventKey = `${evt.type}-${evt.id}`;
                        const isReminderSet = Boolean(reminderSetMap[eventKey]);
                        const theme = getThemeStyles(evt.subject_theme);

                        return (
                            <div
                                key={eventKey}
                                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                {/* Left Column: Time */}
                                <div className="sm:w-24 shrink-0 flex sm:flex-col items-baseline sm:items-start justify-between sm:justify-center border-b sm:border-b-0 border-slate-100 pb-2 sm:pb-0">
                                    <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                                        {evt.time_time || '—'}
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-400 mt-1">
                                        {evt.time_period || ''}
                                    </div>
                                </div>

                                {/* Middle Column: Vertical Accent Line & Content */}
                                <div className={`flex-1 border-l-2 ${theme.border} pl-3.5 sm:pl-4 space-y-1.5`}>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${theme.pillBg}`}>
                                            {evt.subject}
                                        </span>

                                        {evt.is_live && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white flex items-center gap-1 animate-pulse shadow-xs">
                                                <Radio className="w-3 h-3" />
                                                <span>🔴 লাইভ চলছে</span>
                                            </span>
                                        )}

                                        {evt.type === 'live_exam' && (
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                লাইভ পরীক্ষা
                                            </span>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                                        {evt.title}
                                    </h4>

                                    {/* Instructor & Course Subtitle */}
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                                        {evt.instructor_name && (
                                            <span className="font-medium text-slate-600">
                                                {evt.instructor_name}
                                            </span>
                                        )}
                                        {evt.course_title && (
                                            <span className="text-slate-400">
                                                • {evt.course_title}
                                            </span>
                                        )}
                                        {evt.type === 'live_exam' && evt.duration_minutes && (
                                            <span className="text-slate-400">
                                                • {toBengaliNumber(evt.duration_minutes)} মিনিট
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Action Button */}
                                <div className="shrink-0 flex items-center sm:self-center">
                                    {evt.is_live ? (
                                        <Link
                                            to={evt.action_url}
                                            className="px-5 py-2.5 rounded-full bg-[#0B4B34] hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/20 animate-pulse transition-all"
                                        >
                                            <PlayCircle className="w-3.5 h-3.5" />
                                            <span>
                                                {evt.type === 'live_exam' ? 'পরীক্ষায় অংশ নিন' : 'ক্লাসে যুক্ত হন'}
                                            </span>
                                        </Link>
                                    ) : evt.is_completed ? (
                                        <Link
                                            to={evt.action_url}
                                            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                                        >
                                            {evt.type === 'live_exam' ? 'ফলাফল দেখুন' : 'রেকর্ড দেখুন'}
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleReminder(eventKey, evt.title)}
                                            className={`px-5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                                isReminderSet
                                                    ? 'bg-emerald-100 text-[#0B4B34] border border-emerald-300'
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                            }`}
                                        >
                                            <Bell className={`w-3.5 h-3.5 ${isReminderSet ? 'fill-current text-[#0B4B34]' : 'text-slate-400'}`} />
                                            <span>{isReminderSet ? 'রিমাইন্ডার সেট' : 'রিমাইন্ডার'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
