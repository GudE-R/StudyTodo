"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { X, Mail, Lock, LogIn, UserPlus, CheckSquare, Square } from "lucide-react";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { signIn, signUp } = useAuth();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

    const t = useTranslations("auth");

    if (!isOpen) return null;

    // Email validation
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Password validation (min 8 chars, at least one letter and one number)
    const isValidPassword = (password: string): boolean => {
        return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Validation
        if (!isValidEmail(email)) {
            setMessage({ text: t("invalidEmail"), type: "error" });
            setLoading(false);
            return;
        }

        if (!isLoginMode) {
            // Sign Up specific validation
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
                // Login
                const { error } = await signIn(email, password);
                if (error) throw error;
                setMessage({ text: t("loginSuccess"), type: "success" });
                setTimeout(onClose, 1500);
            } else {
                // Sign Up
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {isLoginMode ? t("welcomeBack") : t("createAccount")}
                    </h2>
                    <p className="text-blue-100 text-sm">
                        {isLoginMode
                            ? t("signInDescription")
                            : t("signUpDescription")}
                    </p>
                </div>

                {/* Form */}
                <div className="p-6">
                    <form onSubmit={handleAuth} className="space-y-4">
                        {message && (
                            <div className={`p-3 rounded-lg text-sm ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{t("email")}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{t("password")}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            {!isLoginMode && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">{t("passwordHint")}</p>
                            )}
                        </div>

                        {/* Confirm Password (Sign Up only) */}
                        {!isLoginMode && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{t("confirmPassword")}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Terms Agreement (Sign Up only) */}
                        {!isLoginMode && (
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
                                        terms: (chunks) => <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{chunks}</a>,
                                        privacy: (chunks) => <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{chunks}</a>,
                                    })}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    {isLoginMode ? <LogIn size={20} /> : <UserPlus size={20} />}
                                    <span>{isLoginMode ? t("loginButton") : t("signUpButton")}</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLoginMode(!isLoginMode)}
                            className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 underline transition-colors"
                        >
                            {isLoginMode
                                ? t("noAccountLink")
                                : t("haveAccountLink")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
