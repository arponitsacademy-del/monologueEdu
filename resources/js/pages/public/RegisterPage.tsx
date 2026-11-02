import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../api/client';
import { User, Phone, Mail, Lock, BookOpen, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const RegisterPage: React.FC = () => {
    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // OTP Modal states
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState<string | null>(null);
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState<string | null>(null);

    useEffect(() => {
        let timer: any;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data } = await apiClient.post('/auth/register', {
                name,
                phone,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });

            if (data.requires_otp) {
                setShowOtpModal(true);
                setResendCooldown(60);
                setResendSuccess(null);
                setOtpError(null);
            } else {
                login(data.token, data.user);
                navigate('/student');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please check your information.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setOtpError(null);
        setOtpLoading(true);

        try {
            const { data } = await apiClient.post('/auth/otp/verify', {
                phone,
                otp: otpCode,
            });

            if (data.token && data.user) {
                login(data.token, data.user);
                setShowOtpModal(false);
                navigate('/student');
            }
        } catch (err: any) {
            setOtpError(err.response?.data?.message || 'Invalid OTP code. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || resendLoading) return;

        setResendLoading(true);
        setOtpError(null);
        setResendSuccess(null);

        try {
            const { data } = await apiClient.post('/auth/otp/resend', { phone });
            setResendSuccess(data.message || 'A new OTP code has been sent.');
            setResendCooldown(60);
        } catch (err: any) {
            const seconds = err.response?.data?.seconds_remaining;
            if (seconds) setResendCooldown(seconds);
            setOtpError(err.response?.data?.message || 'Failed to send OTP code.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-sky-500/20">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {t.auth.registerTitle}
                    </h2>
                    <p className="text-xs text-slate-500">
                        {t.auth.registerSub}
                    </p>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t.auth.nameLabel}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t.auth.namePlaceholder}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                            />
                            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t.auth.phoneLabel}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder={t.auth.phonePlaceholder}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                            />
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t.auth.emailLabel}
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.auth.emailPlaceholder}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                            />
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t.auth.passwordLabel}
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t.auth.passwordPlaceholder}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                            />
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t.auth.confirmPasswordLabel}
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                placeholder={t.auth.confirmPasswordPlaceholder}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                            />
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                    >
                        <span>{loading ? t.auth.processing : t.auth.completeRegisterBtn}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="text-center text-xs text-slate-500 pt-2">
                    {t.auth.haveAccount}{' '}
                    <Link to="/login" className="font-bold text-sky-600 hover:text-sky-700">
                        {t.auth.loginBtn}
                    </Link>
                </div>
            </div>

            {/* OTP Verification Modal */}
            <Modal
                isOpen={showOtpModal}
                onClose={() => setShowOtpModal(false)}
                title={t.auth.verifyOtpTitle}
                maxWidth="sm"
            >
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center space-y-1">
                        <p className="text-xs text-slate-600">
                            A 6-digit OTP code has been sent to <span className="font-bold text-slate-800">{phone}</span>.
                        </p>
                        <p className="text-[11px] text-slate-400">
                            Your account will be activated automatically once the number is verified.
                        </p>
                    </div>

                    {resendSuccess && (
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>{resendSuccess}</span>
                        </div>
                    )}

                    {otpError && (
                        <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{otpError}</span>
                        </div>
                    )}

                    <div>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="------"
                            className="w-full text-center tracking-[0.5em] text-xl font-bold py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={otpLoading || otpCode.length !== 6}
                        className="w-full py-3 bg-sky-600 text-white font-bold text-sm rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {otpLoading ? t.auth.verifying : t.auth.verifyOtpBtn}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1 px-1 border-t border-slate-100">
                        <span className="text-slate-500">Didn't receive code?</span>
                        {resendCooldown > 0 ? (
                            <span className="text-slate-400 font-medium font-mono">
                                Resend in {resendCooldown}s
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendLoading}
                                className="text-sky-600 font-bold hover:underline cursor-pointer disabled:opacity-50"
                            >
                                {resendLoading ? 'Sending...' : 'Resend OTP'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
};
