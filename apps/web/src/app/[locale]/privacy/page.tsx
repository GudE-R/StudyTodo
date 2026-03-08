"use client";

import React from "react";
import { ArrowLeft, Shield, Lock, Eye, Database } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";

export default function PrivacyPage() {
    const t = useTranslations("common");
    const locale = useLocale();

    const isJa = locale === 'ja';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>{t("back") || "Back"}</span>
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-8 sm:p-12 text-white">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                            <Shield size={32} />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                            {isJa ? "プライバシーポリシー" : "Privacy Policy"}
                        </h1>
                        <p className="text-emerald-100">
                            {isJa ? "最終更新日: 2026年2月19日" : "Last updated: Feb 19, 2026"}
                        </p>
                    </div>

                    <div className="p-8 sm:p-12 prose prose-emerald dark:prose-invert max-w-none">
                        {isJa ? (
                            // Japanese Content
                            <>
                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">はじめに</h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        StudyTodo（以下「私たち」，「私たち」または「私たち」）は，お客様のプライバシーを尊重します。本プライバシーポリシーでは，お客様が当社のモバイルアプリケーションを使用する際に，当社がお客様に関する情報をどのように収集，使用，共有するかについて説明します。
                                    </p>
                                </section>

                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Lock className="text-green-600" size={24} />
                                        1. 収集する情報
                                    </h2>

                                    <h3 className="text-lg font-semibold mt-6 mb-3">お客様から提供される情報</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                        アカウントを作成する場合、以下の情報を収集します：
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                                        <li><strong>アカウント情報</strong>: メールアドレスおよび暗号化されたパスワード。</li>
                                        <li><strong>ユーザーコンテンツ</strong>: Todoアイテム、カテゴリ、学習セッション、SRSプロファイルなど、アプリ内で生成されたデータ。これらのデータは、アカウント確認および複数デバイス間でのデータアクセスのために安全なデータベースに同期されます。</li>
                                        <li><strong>画像</strong>: カスタムアイコンをアップロードした場合、それらの画像は安全なクラウドストレージに保存されます。</li>
                                    </ul>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
                                        アカウントを作成せずにアプリを使用する場合（「ゲストモード」）、ユーザーコンテンツおよび画像はデバイス内にのみ保存され、サーバーには送信されません。
                                    </p>

                                    <h3 className="text-lg font-semibold mt-6 mb-3">自動的に収集される情報</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        アプリを使用する際、主に広告などのサードパーティサービスをサポートするために、特定の情報が自動的に収集されます。
                                    </p>
                                </section>

                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Database className="text-green-600" size={24} />
                                        2. サードパーティサービス
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                        当社は、以下のサードパーティサービスを使用しており、これらはお客様を特定するために使用される情報を収集する場合があります：
                                    </p>

                                    <div className="mb-6">
                                        <h3 className="font-bold text-gray-900 dark:text-white">Google AdMob</h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                            広告を表示するためにGoogle AdMobを使用しています。AdMobは以下を収集・使用する場合があります：
                                        </p>
                                        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                                            <li><strong>デバイス識別子</strong>: 広告ID（GAIDなど）、IPアドレス。</li>
                                            <li><strong>使用状況データ</strong>: 広告とのインタラクションに関する情報。</li>
                                            <li><strong>診断情報</strong>: 広告に関連するクラッシュログやパフォーマンスデータ。</li>
                                        </ul>
                                        <p className="text-sm text-gray-500 mt-2">詳細は <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Googleプライバシーポリシー</a> および <a href="https://developers.google.com/admob/android/data-disclosure" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">AdMobデータ開示</a> をご覧ください。</p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Supabase</h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                            認証およびデータベースストレージのバックエンドサービスプロバイダーとしてSupabaseを使用しています。
                                        </p>
                                        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                                            <li><strong>目的</strong>: アカウント情報の保存およびユーザーデータの同期（サインイン時）。</li>
                                            <li><strong>データ保護</strong>: データは安全に保存され、転送中および保存時に暗号化されます。</li>
                                        </ul>
                                    </div>
                                </section>

                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Eye className="text-green-600" size={24} />
                                        3. 情報の利用目的
                                    </h2>
                                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                                        <li>本サービスの提供、維持、改善のため。</li>
                                        <li>アカウントの管理およびデータの同期のため（サインイン時）。</li>
                                        <li>広告を表示するため（AdMob経由）。</li>
                                        <li>コメントや質問に対応するため。</li>
                                    </ul>
                                </section>

                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. データセキュリティ</h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        転送中および保存時のデータを保護するために、業界標準の暗号化を使用しています。ただし、インターネット上の転送方法や電子保存方法は100%安全ではありません。
                                    </p>
                                </section>

                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. お問い合わせ</h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        本プライバシーポリシーに関するご質問は、以下までお問い合わせください：<br />
                                        <a href="mailto:studytodoapp@gmail.com" className="text-green-600 hover:underline">
                                            studytodoapp@gmail.com
                                        </a>
                                    </p>
                                </section>
                            </>
                        ) : (
                            // English Content
                            <>
                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Introduction</h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        StudyTodo ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our mobile application.
                                    </p>
                                </section>

                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Lock className="text-green-600" size={24} />
                                        1. Information We Collect
                                    </h2>

                                    <h3 className="text-lg font-semibold mt-6 mb-3">Information You Provide to Us</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                        If you choose to create an account, we collect the following information:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                                        <li><strong>Account Information</strong>: Your email address and an encrypted password.</li>
                                        <li><strong>User Content</strong>: Data you generate within the app, including Todo items, categories, study sessions, and SRS profiles. This data is synced to our secure database to verify your account and allow you to access your data across multiple devices.</li>
                                        <li><strong>Images</strong>: If you upload custom icons, these images are stored in our secure cloud storage.</li>
                                    </ul>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
                                        If you use the application without creating an account ("Guest Mode"), your User Content and Images are stored locally on your device and are not transmitted to our servers.
                                    </p>

                                    <h3 className="text-lg font-semibold mt-6 mb-3">Information Collected Automatically</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        When you use our application, certain information is collected automatically, primarily to support third-party services like advertising.
                                    </p>
                                </section>

                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Database className="text-green-600" size={24} />
                                        2. Third-Party Services
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                        We use the following third-party services which may collect information used to identify you:
                                    </p>

                                    <div className="mb-6">
                                        <h3 className="font-bold text-gray-900 dark:text-white">Google AdMob</h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                            We use Google AdMob to display advertisements. AdMob may collect and use:
                                        </p>
                                        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                                            <li><strong>Device Identifiers</strong>: Advertising ID (e.g., GAID), IP address.</li>
                                            <li><strong>Usage Data</strong>: Information about how you interact with the ads.</li>
                                            <li><strong>Diagnostics</strong>: Crash logs and performance data related to ads.</li>
                                        </ul>
                                        <p className="text-sm text-gray-500 mt-2">For more information, please see <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Google's Privacy Policy</a> and <a href="https://developers.google.com/admob/android/data-disclosure" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">AdMob's Data Disclosure</a>.</p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Supabase</h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                            We use Supabase as our backend service provider for authentication and database storage.
                                        </p>
                                        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                                            <li><strong>Purpose</strong>: To store account information and sync user data (if signed in).</li>
                                            <li><strong>Data Protection</strong>: Data is stored securely and is encrypted in transit and at rest.</li>
                                        </ul>
                                    </div>
                                </section>

                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Eye className="text-green-600" size={24} />
                                        3. How We Use Your Information
                                    </h2>
                                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                                        <li>To provide, maintain, and improve our application.</li>
                                        <li>To manage your account and sync your data (if signed in).</li>
                                        <li>To display advertisements (via AdMob).</li>
                                        <li>To respond to your comments and questions.</li>
                                    </ul>
                                </section>

                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Data Security</h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        We use industry-standard encryption to protect your data both in transit and at rest. However, no method of transmission over the internet or method of electronic storage is 100% secure.
                                    </p>
                                </section>

                                <section className="mb-12">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Contact Us</h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        If you have any questions about this Privacy Policy, please contact us at:<br />
                                        <a href="mailto:studytodoapp@gmail.com" className="text-green-600 hover:underline">
                                            studytodoapp@gmail.com
                                        </a>
                                    </p>
                                </section>
                            </>
                        )}

                        <section className="mb-12 border-t border-gray-100 dark:border-gray-800 pt-8 text-center text-sm text-gray-500">
                            <p>StudyTodo is a personal development project. Not a corporate entity.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
