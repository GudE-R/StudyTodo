"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Lock, Eye } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PrivacyPage() {
    const router = useRouter();
    const t = useTranslations("common");

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>{t("back") || "Back"}</span>
                </button>

                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-8 sm:p-12 text-white">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                            <Shield size={32} />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">プライバシーポリシー</h1>
                        <p className="text-emerald-100">最終更新日: 2026年1月11日</p>
                    </div>

                    <div className="p-8 sm:p-12 prose prose-emerald dark:prose-invert max-w-none">
                        <section className="mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Lock className="text-green-600" size={24} />
                                1. 個人情報の収集
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                本サービスでは，ユーザーの皆さまが利用登録をする際に，メールアドレスなどの個人情報をお尋ねすることがあります。また，本サービスの利用状況（タイマーの使用履歴，タスクの内容など）をサーバーに保存します。
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Eye className="text-green-600" size={24} />
                                2. 個人情報の利用目的
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                当社が個人情報を収集・利用する目的は，以下のとおりです。
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2 mt-2">
                                <li>本サービスの提供・運営のため</li>
                                <li>ユーザーからのお問い合わせに回答するため</li>
                                <li>ユーザーが利用中のサービスの新機能，更新情報等を提供するため</li>
                                <li>利用規約に違反したユーザーや，不正・不当な目的でサービスを利用しようとするユーザーの特定をし，ご利用をお断りするため</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. 個人情報の第三者提供</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                当社は，次に掲げる場合を除いて，あらかじめユーザーの同意を得ることなく，第三者に個人情報を提供することはありません。
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2 mt-2">
                                <li>人の生命，身体または財産の保護のために必要がある場合であって，本人の同意を得ることが困難であるとき</li>
                                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって，本人の同意を得ることが困難であるとき</li>
                                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. データの同期と保存</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                本サービスはCloud機能を提供しており，ユーザーのデータは安全なクラウドサーバー（Supabase）に保存されます。これにより，異なるデバイス間でのデータ同期が可能になります。
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. お問い合わせ窓口</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                本ポリシーに関するお問い合わせは，アプリ内のフィードバック機能，または開発者の連絡先までお願いいたします。
                            </p>
                        </section>

                        <section className="mb-12 border-t border-gray-100 dark:border-gray-800 pt-8 text-center text-sm text-gray-500">
                            <p>このプライバシーポリシーはサンプルです。実際の運営にあたっては，適切なリーガルチェックを受けることをお勧めします。</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
