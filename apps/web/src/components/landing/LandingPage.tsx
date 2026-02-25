"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
    CheckCircle2,
    Clock,
    CalendarDays,
    LineChart,
    Brain,
    Mail,
    ArrowRight,
    ShieldCheck,
    Globe,
    Zap,
    Repeat
} from "lucide-react";
import Link from "next/link";


interface LandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
    const t = useTranslations("onboarding");
    const commonT = useTranslations("common");
    const authT = useTranslations("auth");
    const welcomeT = useTranslations("welcome");
    const locale = useLocale();

    // Landing page specific features (different from onboarding slides)
    const features = [
        {
            icon: <Clock className="w-6 h-6 text-blue-500" />,
            title: welcomeT("featureTimer"), // Pomodoro Timer
            description: welcomeT("featureTimerDesc")
        },
        {
            icon: <Repeat className="w-6 h-6 text-indigo-500" />,
            title: welcomeT("featureSrs"), // Spaced Repetition
            description: welcomeT("featureSrsDesc")
        },
        {
            icon: <LineChart className="w-6 h-6 text-cyan-500" />,
            title: welcomeT("featureAnalytics"), // Learning Analytics
            description: welcomeT("featureAnalyticsDesc")
        },
        {
            icon: <Globe className="w-6 h-6 text-sky-500" />,
            title: welcomeT("featureSync"), // Cloud Sync
            description: welcomeT("featureSyncDesc")
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30">

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            S
                        </div>
                        <span className="font-bold text-xl tracking-tight">StudyTodo</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onLogin} className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                            {authT("loginButton")}
                        </button>
                        <button onClick={onGetStarted} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 shadow-sm rounded-md">
                            {welcomeT("getStarted")}
                        </button>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center px-3 py-1 mb-6 text-sm font-medium text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                        <Zap className="w-4 h-4 mr-2" />
                        {welcomeT("footerTagline")}
                    </div>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent leading-tight">
                        {welcomeT("heroTitle")} <br className="hidden sm:block" />
                        <span className="text-blue-600 dark:text-blue-500">{welcomeT("heroTitleHighlight")}</span>
                    </h1>
                    <p className="mt-4 text-xl sm:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto font-medium">
                        {welcomeT("heroSubtitle")}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button
                            onClick={onGetStarted}
                            className="inline-flex justify-center items-center w-full sm:w-auto text-lg h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 rounded-xl group transition-all duration-200"
                        >
                            {welcomeT("getStarted")}
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={onLogin}
                            className="inline-flex justify-center items-center w-full sm:w-auto text-lg h-14 px-8 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
                        >
                            {authT("loginButton")}
                        </button>
                    </div>

                    {/* App Preview Mockup (Stylized) */}
                    <div className="mt-20 relative max-w-5xl mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent z-10 h-full w-full pointer-events-none" />
                        <div className="rounded-t-2xl border-t border-x border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden aspect-[21/9] relative flex flex-col pt-8 px-8">
                            {/* Abstract App Representation */}
                            <div className="w-full flex-1 grid grid-cols-12 gap-6 opacity-90">
                                <div className="col-span-3 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl border-t border-x border-slate-100 dark:border-slate-700 p-5 space-y-4">
                                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                                    <div className="space-y-3">
                                        <div className="h-12 w-full bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-100 dark:border-slate-700"></div>
                                        <div className="h-12 w-full bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-100 dark:border-slate-700"></div>
                                        <div className="h-12 w-full bg-blue-50 dark:bg-blue-900/20 rounded-md shadow-sm border border-blue-100 dark:border-blue-800/50"></div>
                                    </div>
                                </div>
                                <div className="col-span-9 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl shadow-sm border-t border-x border-slate-100 dark:border-slate-700 p-6 flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                                        <div className="h-8 w-24 bg-blue-600 rounded-md"></div>
                                    </div>
                                    <div className="flex-1 w-full bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                        <div className="grid grid-cols-7 gap-2 w-full max-w-md">
                                            {Array.from({ length: 28 }).map((_, i) => (
                                                <div key={i} className={`aspect-square rounded-md ${i % 7 === 3 ? 'bg-blue-500' : i % 5 === 0 ? 'bg-blue-300 dark:bg-blue-800' : 'bg-slate-100 dark:bg-slate-700'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("slides.welcome.title")}</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                                Everything you need to maximize your productivity and learning efficiency.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature, idx) => (
                                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-5 shadow-sm">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Support & Contact Section */}
                <section id="support" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold mb-6">{welcomeT("supportTitle")}</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
                        {welcomeT("supportDesc")}
                    </p>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">{welcomeT("officialSupport")}</span>
                        </div>
                        <a
                            href="mailto:studytodoapp@gmail.com"
                            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors block my-4"
                        >
                            studytodoapp@gmail.com
                        </a>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {welcomeT("operatingHours")}
                        </p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                        <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs">S</div>
                        StudyTodo
                    </div>

                    <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-400">
                        <Link href={`/${locale}/privacy`} className="hover:text-blue-600 transition-colors">
                            {commonT("privacyPolicy")}
                        </Link>
                        <Link href={`/${locale}/terms`} className="hover:text-blue-600 transition-colors">
                            {commonT("termsOfService")}
                        </Link>
                        <span className="flex items-center gap-1">
                            <Globe className="w-4 h-4" /> {locale.toUpperCase()}
                        </span>
                    </div>

                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        &copy; {new Date().getFullYear()} StudyTodo. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
