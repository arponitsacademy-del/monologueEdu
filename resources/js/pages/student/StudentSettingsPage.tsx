import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import {
    Smartphone,
    Laptop,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    LogOut,
    KeyRound,
    User as UserIcon,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    Clock,
    Globe,
    Check,
    AlertTriangle,
    Shield
} from 'lucide-react';

interface DeviceItem {
    id: number;
    name: string;
    ip_address: string | null;
    user_agent: string | null;
    is_current: boolean;
    last_used_at: string | null;
    created_at: string | null;
}

export const StudentSettingsPage: React.FC = () => {
    const { user, updateUser } = useAuth();

    // Tabs: 'devices' | 'profile' | 'password'
    const [activeTab, setActiveTab] = useState<'devices' | 'profile' | 'password'>('devices');

    // Devices state
    const [devices, setDevices] = useState<DeviceItem[]>([]);
    const [devicesLoading, setDevicesLoading] = useState(true);
    const [deviceActionLoading, setDeviceActionLoading] = useState<number | 'others' | null>(null);
    const [deviceSuccessMsg, setDeviceSuccessMsg] = useState('');
    const [deviceErrorMsg, setDeviceErrorMsg] = useState('');

    // Profile form state
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
    const [profileErrorMsg, setProfileErrorMsg] = useState('');

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
    const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setDevicesLoading(true);
        setDeviceErrorMsg('');
        try {
            const { data } = await apiClient.get('/user/devices');
            setDevices(data.devices || []);
        } catch (err: any) {
            setDeviceErrorMsg('ডিভাইস তালিকা লোড করা যায়নি। আবার চেষ্টা করুন।');
        } finally {
            setDevicesLoading(false);
        }
    };

    const handleRevokeDevice = async (id: number) => {
        if (!window.confirm('আপনি কি নিশ্চিত যে এই ডিভাইসটি লগআউট করতে চান?')) {
            return;
        }

        setDeviceActionLoading(id);
        setDeviceSuccessMsg('');
        setDeviceErrorMsg('');
        try {
            const { data } = await apiClient.delete(`/user/devices/${id}`);
            setDeviceSuccessMsg(data.message || 'ডিভাইসটি সফলভাবে লগআউট করা হয়েছে।');
            await fetchDevices();
        } catch (err: any) {
            setDeviceErrorMsg(err.response?.data?.message || 'ডিভাইস লগআউট করতে সমস্যা হয়েছে।');
        } finally {
            setDeviceActionLoading(null);
        }
    };

    const handleLogoutOthers = async () => {
        if (!window.confirm('বর্তমান ডিভাইসটি ব্যতীত অন্য সকল ডিভাইস থেকে লগআউট করতে চান?')) {
            return;
        }

        setDeviceActionLoading('others');
        setDeviceSuccessMsg('');
        setDeviceErrorMsg('');
        try {
            const { data } = await apiClient.post('/user/devices/logout-others');
            setDeviceSuccessMsg(data.message || 'অন্যান্য সকল ডিভাইস থেকে সফলভাবে লগআউট হয়েছে।');
            await fetchDevices();
        } catch (err: any) {
            setDeviceErrorMsg(err.response?.data?.message || 'লগআউট করতে সমস্যা হয়েছে।');
        } finally {
            setDeviceActionLoading(null);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileSuccessMsg('');
        setProfileErrorMsg('');

        try {
            const { data } = await apiClient.put('/user/profile', {
                name,
                email
            });
            setProfileSuccessMsg(data.message || 'প্রোফাইল সফলভাবে আপডেট হয়েছে!');
            if (updateUser && data.user) {
                updateUser(data.user);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'প্রোফাইল আপডেট ব্যর্থ হয়েছে। তথ্য যাচাই করুন।';
            setProfileErrorMsg(msg);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordSuccessMsg('');
        setPasswordErrorMsg('');

        if (newPassword.length < 8) {
            setPasswordErrorMsg('নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।');
            setPasswordLoading(false);
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            setPasswordErrorMsg('নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।');
            setPasswordLoading(false);
            return;
        }

        try {
            const { data } = await apiClient.post('/user/change-password', {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: newPasswordConfirm
            });
            setPasswordSuccessMsg(data.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।');
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordConfirm('');
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.current_password?.[0] || 'পাসওয়ার্ড পরিবর্তন করা যায়নি।';
            setPasswordErrorMsg(msg);
        } finally {
            setPasswordLoading(false);
        }
    };

    const isMobileDevice = (name: string, ua?: string | null) => {
        const str = `${name} ${ua || ''}`.toLowerCase();
        return str.includes('android') || str.includes('iphone') || str.includes('ipad') || str.includes('mobile');
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return 'অজানা';
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('bn-BD', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-sky-500/20">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {user?.name || 'শিক্ষার্থীর নাম'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                                ফোন: <span className="font-semibold text-slate-700">{user?.phone}</span> • রোল: <span className="text-sky-600 font-bold uppercase">{user?.role || 'student'}</span>
                            </p>
                        </div>
                    </div>

                    {/* Active Tabs Pills */}
                    <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('devices')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                                activeTab === 'devices'
                                    ? 'bg-white text-sky-600 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>লগইন ডিভাইস</span>
                            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-sky-100 text-sky-700">
                                {devices.length}/2
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                                activeTab === 'profile'
                                    ? 'bg-white text-sky-600 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <UserIcon className="w-4 h-4" />
                            <span>প্রোফাইল তথ্য</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('password')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                                activeTab === 'password'
                                    ? 'bg-white text-sky-600 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <KeyRound className="w-4 h-4" />
                            <span>পাসওয়ার্ড পরিবর্তন</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB 1: ACTIVE DEVICES & SECURITY */}
            {activeTab === 'devices' && (
                <div className="space-y-6">
                    {/* Security Notice Card */}
                    <div className="bg-gradient-to-r from-sky-50 via-indigo-50/50 to-blue-50 border border-sky-100 rounded-3xl p-6 relative overflow-hidden">
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white text-sky-600 shadow-sm flex items-center justify-center shrink-0">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-base font-extrabold text-slate-900">
                                    ডিভাইস নিরাপত্তা নীতিমালা: সর্বোচ্চ ২টি সক্রিয় ডিভাইস
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    আপনার অ্যাকাউন্ট সুরক্ষা ও কোর্স কন্টেন্টের গোপনীয়তা নিশ্চিত করতে একটি অ্যাকাউন্ট থেকে
                                    <strong> একসাথে সর্বোচ্চ ২টি ডিভাইসে</strong> লগইন করা যাবে। আপনি ৩য় কোনো নতুন ডিভাইসে লগইন করলে আগের সবচেয়ে পুরোনো ডিভাইসটি স্বয়ংক্রিয়ভাবে লগআউট হয়ে যাবে।
                                </p>
                                <div className="pt-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-sky-700 border border-sky-200">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                                        সর্বোচ্চ সীমা: ২ টি ডিভাইস
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-indigo-700 border border-indigo-200">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                        বর্তমানে লগইন আছে: {devices.length} টি
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Messages */}
                    {deviceSuccessMsg && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>{deviceSuccessMsg}</span>
                        </div>
                    )}
                    {deviceErrorMsg && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>{deviceErrorMsg}</span>
                        </div>
                    )}

                    {/* Devices List Header & Actions */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    লগইন থাকা ডিভাইসসমূহ ({devices.length}/2)
                                </h3>
                                <p className="text-xs text-slate-500">
                                    নিচে আপনার অ্যাকাউন্টে বর্তমানে অ্যাক্টিভ থাকা ডিভাইসগুলোর বিবরণ দেওয়া হলো
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={fetchDevices}
                                    disabled={devicesLoading}
                                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${devicesLoading ? 'animate-spin' : ''}`} />
                                    <span>রিফ্রেশ</span>
                                </button>

                                {devices.some(d => !d.is_current) && (
                                    <button
                                        type="button"
                                        onClick={handleLogoutOthers}
                                        disabled={deviceActionLoading === 'others'}
                                        className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>অন্যান্য সব ডিভাইস লগআউট</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Device Cards */}
                        {devicesLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                                <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
                                <span className="text-xs font-semibold">ডিভাইস তালিকা লোড হচ্ছে...</span>
                            </div>
                        ) : devices.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-sm">
                                কোনো সক্রিয় সেশন পাওয়া যায়নি।
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {devices.map((device) => {
                                    const isMobile = isMobileDevice(device.name, device.user_agent);
                                    return (
                                        <div
                                            key={device.id}
                                            className={`rounded-2xl p-5 border transition-all ${
                                                device.is_current
                                                    ? 'bg-sky-50/40 border-sky-200 ring-2 ring-sky-500/10'
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3.5">
                                                    <div
                                                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                                            device.is_current
                                                                ? 'bg-sky-600 text-white shadow-xs'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {isMobile ? (
                                                            <Smartphone className="w-5 h-5" />
                                                        ) : (
                                                            <Laptop className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-extrabold text-slate-900">
                                                                {device.name}
                                                            </h4>
                                                            {device.is_current && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                                    বর্তমান ডিভাইস
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                            <Globe className="w-3 h-3 text-slate-400" />
                                                            <span>আইপি: {device.ip_address || 'অজানা'}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>সর্বশেষ সক্রিয়: {formatDate(device.last_used_at)}</span>
                                                </div>

                                                {!device.is_current ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRevokeDevice(device.id)}
                                                        disabled={deviceActionLoading === device.id}
                                                        className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                                                    >
                                                        {deviceActionLoading === device.id ? 'লগআউট হচ্ছে...' : 'লগআউট করুন'}
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-sky-600">
                                                        এখন ব্যবহার করছেন
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: PROFILE INFORMATION */}
            {activeTab === 'profile' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                    <div>
                        <h3 className="text-base font-black text-slate-900">ব্যক্তিগত তথ্য</h3>
                        <p className="text-xs text-slate-500">আপনার নাম ও ইমেইল ঠিকানা আপডেট করুন</p>
                    </div>

                    {profileSuccessMsg && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>{profileSuccessMsg}</span>
                        </div>
                    )}
                    {profileErrorMsg && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>{profileErrorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                পূর্ণ নাম
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-hidden transition-all"
                                placeholder="আপনার নাম লিখুন"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                মোবাইল নম্বর (স্থায়ী)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    disabled
                                    value={user?.phone || ''}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium cursor-not-allowed"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-md">
                                    পরিবর্তনযোগ্য নয়
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                মোবাইল নম্বরটি আপনার মূল একাউন্ট আইডি হিসেবে ব্যবহৃত হয় বিধায় এটি পরিবর্তন করা যাবে না।
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                ইমেইল ঠিকানা
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-hidden transition-all"
                                placeholder="yourname@gmail.com"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-indigo-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                                {profileLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                                <span>{profileLoading ? 'সংরক্ষণ হচ্ছে...' : 'তথ্য সংরক্ষণ করুন'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB 3: CHANGE PASSWORD */}
            {activeTab === 'password' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                    <div>
                        <h3 className="text-base font-black text-slate-900">পাসওয়ার্ড পরিবর্তন করুন</h3>
                        <p className="text-xs text-slate-500">আপনার বর্তমান পাসওয়ার্ড যাচাই করে নতুন পাসওয়ার্ড দিন</p>
                    </div>

                    {passwordSuccessMsg && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>{passwordSuccessMsg}</span>
                        </div>
                    )}
                    {passwordErrorMsg && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>{passwordErrorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                বর্তমান পাসওয়ার্ড
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 text-sm font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-hidden transition-all"
                                    placeholder="আপনার বর্তমান পাসওয়ার্ড লিখুন"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 text-sm font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-hidden transition-all"
                                    placeholder="নতুন গোপন পাসওয়ার্ড"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                নতুন পাসওয়ার্ড নিশ্চিত করুন
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={newPasswordConfirm}
                                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 text-sm font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-hidden transition-all"
                                    placeholder="নতুন পাসওয়ার্ডটি পুনরায় লিখুন"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-indigo-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                                {passwordLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                                <span>{passwordLoading ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

