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
    Globe
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

    const features = [
        {
            icon: <CheckCircle2 className="w-6 h-6 text-primary" />,
            title: t("slide1.title"), // Manage Tasks
            description: t("slide1.description")
        },
        {
            icon: <Clock className="w-6 h-6 text-orange-500" />,
            title: t("slide3.title"), // Focus Timer
            description: t("slide3.description")
        },
        {
            icon: <CalendarDays className="w-6 h-6 text-blue-500" />,
            title: t("slide2.title"), // Schedule
            description: t("slide2.description")
        },
        {
            icon: <Brain className="w-6 h-6 text-purple-500" />,
            title: t("slide4.title"), // Automate Learning (SRS)
            description: t("slide4.description")
        },
        {
            icon: <LineChart className="w-6 h-6 text-green-500" />,
            title: t("slide5.title"), // Scale Growth
            description: t("slide5.description")
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-primary/30">

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            S
                        </div>
                        <span className="font-bold text-xl tracking-tight">StudyTodo</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onLogin} className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors hover:text-primary">
                            {authT("loginButton")}
                        </button>
                        <button onClick={onGetStarted} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors bg-primary text-white hover:bg-primary/90 shadow-sm rounded-md">
                            {welcomeT("getStarted")}
                        </button>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent leading-tight mt-8">
                        Record, Measure, Plan. <br className="hidden sm:block" />
                        All in one place.
                    </h1>
                    <p className="mt-4 text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto font-medium">
                        {t("welcome.subtitle")}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button
                            onClick={onGetStarted}
                            className="inline-flex justify-center items-center w-full sm:w-auto text-lg h-14 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-xl group transition-all duration-200"
                        >
                            {welcomeT("getStarted")}
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={onLogin}
                            className="inline-flex justify-center items-center w-full sm:w-auto text-lg h-14 px-8 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200"
                        >
                            {authT("loginButton")}
                        </button>
                    </div>

                    {/* App Preview Mockup (Stylized) */}
                    <div className="mt-20 relative max-w-5xl mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-950 to-transparent z-10 h-full w-full pointer-events-none" />
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shadow-2xl overflow-hidden aspect-video relative flex items-center justify-center p-8">
                            {/* Abstract App Representation */}
                            <div className="w-full h-full max-w-4xl grid grid-cols-12 gap-4 opacity-80">
                                <div className="col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                    <div className="space-y-2">
                                        <div className="h-10 w-full bg-gray-100 dark:bg-gray-900 rounded-md"></div>
                                        <div className="h-10 w-full bg-gray-100 dark:bg-gray-900 rounded-md"></div>
                                        <div className="h-10 w-full bg-gray-100 dark:bg-gray-900 rounded-md"></div>
                                    </div>
                                </div>
                                <div className="col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
                                    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                                        <div className="relative w-32 h-32 rounded-full border-8 border-orange-500/20 flex items-center justify-center">
                                            <div className="text-3xl font-bold text-orange-500">25:00</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {Array.from({ length: 35 }).map((_, i) => (
                                            <div key={i} className={`h-8 rounded-sm ${i % 7 === 3 ? 'bg-primary/80' : i % 5 === 0 ? 'bg-primary/40' : 'bg-gray-100 dark:bg-gray-900'}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="py-24 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("welcome.title")}</h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Everything you need to maximize your productivity and learning efficiency.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-950 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center mb-6">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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
                    <h2 className="text-3xl font-bold mb-6">Need Help?</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                        If you have any questions, encountering issues, or want to share feedback, we're here to help. Our support team typically responds within 24-48 hours.
                    </p>

                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Official Support</span>
                        </div>
                        <a
                            href="mailto:studytodoapp@gmail.com"
                            className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors block my-4"
                        >
                            studytodoapp@gmail.com
                        </a>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Operating Hours: Monday - Friday, 9:00 - 18:00 (JST)
                        </p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                        <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center text-xs">S</div>
                        StudyTodo
                    </div>

                    <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
                        <Link href={`/${locale}/privacy`} className="hover:text-primary transition-colors">
                            {commonT("privacyPolicy")}
                        </Link>
                        <Link href={`/${locale}/terms`} className="hover:text-primary transition-colors">
                            {commonT("termsOfService")}
                        </Link>
                        <span className="flex items-center gap-1">
                            <Globe className="w-4 h-4" /> {locale.toUpperCase()}
                        </span>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        &copy; {new Date().getFullYear()} StudyTodo. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
