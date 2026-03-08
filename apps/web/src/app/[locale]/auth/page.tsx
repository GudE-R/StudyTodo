"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Timer, Mail, Lock, LogIn, UserPlus, CheckSquare, Square, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function AuthPage() {
    const { user, loading: authLoading, signIn, signUp, signInWithProvider, resetPassword, updatePassword, isRecovery, clearRecovery } = useAuth();
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "signup" | "reset" | "updatePassword">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

    const isLoginMode = mode === "login";
    const isResetMode = mode === "reset";
    const isUpdatePasswordMode = mode === "updatePassword";

    const t = useTranslations("auth");
    const tWelcome = useTranslations("welcome");

    // PASSWORD_RECOVERY イベント検出時に updatePassword モードへ切替
    useEffect(() => {
        if (isRecovery) {
            setMode("updatePassword");
            setMessage(null);
        }
    }, [isRecovery]);

    // Redirect if already logged in (only after auth state is determined)
    useEffect(() => {
        if (!authLoading && user?.id && !isRecovery) {
            router.push("/");
        }
    }, [user, authLoading, router, isRecovery]);

    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPassword = (password: string): boolean => {
        return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (isUpdatePasswordMode) {
            if (!isValidPassword(password)) {
                setMessage({ text: t("weakPassword"), type: "error" });
                setLoading(false);
                return;
            }
            if (password !== confirmPassword) {
                setMessage({ text: t("passwordMismatch"), type: "error" });
                setLoading(false);
                return;
            }
            try {
                const { error } = await updatePassword(password);
                if (error) throw error;
                setMessage({ text: t("passwordUpdated"), type: "success" });
                clearRecovery();
                setTimeout(() => { setMode("login"); setMessage(null); }, 2000);
            } catch (error: any) {
                setMessage({ text: error.message || t("errorOccurred"), type: "error" });
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!isValidEmail(email)) {
            setMessage({ text: t("invalidEmail"), type: "error" });
            setLoading(false);
            return;
        }

        if (isResetMode) {
            try {
                const { error } = await resetPassword(email);
                if (error) throw error;
                setMessage({ text: t("resetEmailSent"), type: "success" });
            } catch (error: any) {
                setMessage({ text: error.message || t("errorOccurred"), type: "error" });
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!isLoginMode) {
            if (!isValidPassword(password)) {
                setMessage({ text: t("weakPassword"), type: "error" });
                setLoading(false);
                return;
            }
            if (password !== confirmPassword) {
                setMessage({ text: t("passwordMismatch"), type: "error" });
                setLoading(false);
                return;
            }
            if (!agreedToTerms) {
                setMessage({ text: t("mustAgreeTerms"), type: "error" });
                setLoading(false);
                return;
            }
        }

        try {
            if (isLoginMode) {
                const { error } = await signIn(email, password);
                if (error) throw error;
                setMessage({ text: t("loginSuccess"), type: "success" });
                setTimeout(() => router.push("/"), 1500);
            } else {
                const { error } = await signUp(email, password);
                if (error) throw error;
                setMessage({ text: t("checkEmail"), type: "success" });
            }
        } catch (error: any) {
            setMessage({ text: error.message || t("errorOccurred"), type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const _handleSocialLogin = async (provider: "google" | "github") => {
        setLoading(true);
        setMessage(null);
        try {
            const { error } = await signInWithProvider(provider);
            if (error) throw error;
        } catch (error: any) {
            setMessage({ text: error.message || t("errorOccurred"), type: "error" });
            setLoading(false);
        }
    };

    const features = [
        { icon: "⏱️", title: tWelcome("featureTimer"), desc: tWelcome("featureTimerDesc") },
        { icon: "🔄", title: tWelcome("featureSrs"), desc: tWelcome("featureSrsDesc") },
        { icon: "📊", title: tWelcome("featureAnalytics"), desc: tWelcome("featureAnalyticsDesc") },
        { icon: "☁️", title: tWelcome("featureSync"), desc: tWelcome("featureSyncDesc") },
    ];

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Left Panel - Features */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 p-12 flex-col justify-between relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                            <Timer className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">StudyTodo</span>
                    </div>

                    <h1
                        className="text-4xl font-bold text-white mb-4 tracking-tight animate-in fade-in slide-in-from-left-4 duration-700"
                        style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
                    >
                        {tWelcome("subtitle")}
                    </h1>
                    <p
                        className="text-blue-100 text-lg mb-12 animate-in fade-in slide-in-from-left-4 duration-700"
                        style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
                    >
                        {tWelcome("footerTagline")}
                    </p>

                    <div className="space-y-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500"
                                style={{ animationDelay: `${300 + index * 100}ms`, animationFillMode: 'backwards' }}
                            >
                                <span className="text-2xl">{feature.icon}</span>
                                <div>
                                    <h3 className="font-semibold text-white">{feature.title}</h3>
                                    <p className="text-blue-100 text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-blue-200 text-sm relative z-10 animate-in fade-in duration-1000" style={{ animationDelay: '700ms', animationFillMode: 'backwards' }}>
                    © 2026 StudyTodo. All rights reserved.
                </p>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-700">
                    {/* Back Button */}
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8 transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>{t("backToApp") || "Back"}</span>
                    </button>

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Timer className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">StudyTodo</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                            {isUpdatePasswordMode ? t("setNewPassword") : isResetMode ? t("resetPassword") : isLoginMode ? t("welcomeBack") : t("createAccount")}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            {isUpdatePasswordMode ? t("setNewPasswordDescription") : isResetMode ? t("resetDescription") : isLoginMode ? t("signInDescription") : t("signUpDescription")}
                        </p>
                    </div>

                    {/* Social Buttons */}
                    {!isUpdatePasswordMode && (
                        <div className="relative mb-6">
                            <div className="flex gap-3 opacity-40 select-none grayscale cursor-not-allowed">
                                <button
                                    type="button"
                                    disabled={true}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Google</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={true}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-gray-700 rounded-xl disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    <span className="font-medium text-white">GitHub</span>
                                </button>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center z-10 cursor-not-allowed">
                                <div className="bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 px-4 py-1.5 rounded-full shadow-sm">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    {!isUpdatePasswordMode && (
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400">
                                    {t("orContinueWith")}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        {message && (
                            <div className={`p-3 rounded-lg text-sm ${message.type === "error" ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"}`}>
                                {message.text}
                            </div>
                        )}

                        {/* Email - updatePassword モードでは非表示 */}
                        {!isUpdatePasswordMode && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("email")}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password - updatePassword モードまたは通常ログイン/サインアップ時に表示 */}
                        {(!isResetMode || isUpdatePasswordMode) && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {isUpdatePasswordMode ? t("newPassword") : t("password")}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {(!isLoginMode || isUpdatePasswordMode) && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("passwordHint")}</p>
                                )}
                                {isLoginMode && !isUpdatePasswordMode && (
                                    <button
                                        type="button"
                                        onClick={() => { setMode("reset"); setMessage(null); }}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        {t("forgotPassword")}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Confirm Password - サインアップ or updatePassword */}
                        {(isUpdatePasswordMode || (!isLoginMode && !isResetMode)) && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {isUpdatePasswordMode ? t("confirmNewPassword") : t("confirmPassword")}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Terms Agreement - サインアップのみ */}
                        {!isLoginMode && !isResetMode && !isUpdatePasswordMode && (
                            <div className="flex items-start space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                                    className="mt-0.5 text-blue-600 dark:text-blue-400"
                                >
                                    {agreedToTerms ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t.rich("termsAgreement", {
                                        terms: (chunks) => <Link href="/terms" target="_blank" className="text-blue-600 hover:underline">{chunks}</Link>,
                                        privacy: (chunks) => <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline">{chunks}</Link>,
                                    })}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    {isUpdatePasswordMode ? <Lock size={20} /> : isResetMode ? <Mail size={20} /> : isLoginMode ? <LogIn size={20} /> : <UserPlus size={20} />}
                                    <span>{isUpdatePasswordMode ? t("setNewPassword") : isResetMode ? t("sendResetLink") : isLoginMode ? t("loginButton") : t("signUpButton")}</span>
                                </>
                            )}
                        </button>
                    </form>

                    {!isUpdatePasswordMode && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => { setMode(isResetMode ? "login" : isLoginMode ? "signup" : "login"); setMessage(null); }}
                                className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 underline transition-colors"
                            >
                                {isResetMode
                                    ? t("backToLogin")
                                    : isLoginMode
                                        ? t("noAccountLink")
                                        : t("haveAccountLink")}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
