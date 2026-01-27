"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Timer, Cloud, BarChart3, RefreshCw, ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

export function WelcomeScreen({ onGetStarted, onLogin }: WelcomeScreenProps) {
    const t = useTranslations("welcome");

    const features = [
        {
            icon: Timer,
            titleKey: "featureTimer",
            descKey: "featureTimerDesc",
        },
        {
            icon: RefreshCw,
            titleKey: "featureSrs",
            descKey: "featureSrsDesc",
        },
        {
            icon: BarChart3,
            titleKey: "featureAnalytics",
            descKey: "featureAnalyticsDesc",
        },
        {
            icon: Cloud,
            titleKey: "featureSync",
            descKey: "featureSyncDesc",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex flex-col overflow-hidden">
            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Logo & Title with fade-in animation */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25 mb-6 animate-in zoom-in duration-500">
                        <Timer className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                        StudyTodo
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        {t("subtitle")}
                    </p>
                </div>

                {/* Features Grid with stagger animation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full mb-12">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="group bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700/50 animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${150 + index * 100}ms`, animationFillMode: 'backwards' }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-all duration-300">
                                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            {t(feature.titleKey)}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {t(feature.descKey)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CTA Buttons with animation */}
                <div
                    className="flex flex-col sm:flex-row gap-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700"
                    style={{ animationDelay: '550ms', animationFillMode: 'backwards' }}
                >
                    <button
                        onClick={onGetStarted}
                        className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                        <span>{t("getStarted")}</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onLogin}
                        className="flex-1 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 active:scale-[0.98] transition-all duration-200"
                    >
                        {t("alreadyHaveAccount")}
                    </button>
                </div>
            </div>

            {/* Footer with subtle animation */}
            <footer
                className="text-center py-6 text-sm text-gray-500 dark:text-gray-500 animate-in fade-in duration-1000"
                style={{ animationDelay: '700ms', animationFillMode: 'backwards' }}
            >
                <p>{t("footerTagline")}</p>
            </footer>
        </div>
    );
}
