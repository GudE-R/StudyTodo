"use client";

import React from "react";
import { ArrowLeft, Scale, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function TermsPage() {
    const t = useTranslations("common");

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
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 sm:p-12 text-white">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                            <Scale size={32} />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">利用規約</h1>
                        <p className="text-blue-100">効力発生日: 2026年1月11日</p>
                    </div>

                    <div className="p-8 sm:p-12 prose prose-blue dark:prose-invert max-w-none">
                        <section className="mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="text-blue-600" size={24} />
                                第1条（はじめに）
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                この利用規約（以下，「本規約」といいます。）は，本サービス「StudyTodo」（以下，「本サービス」といいます。）の利用条件を定めるものです。本サービスは、開発者本人（以下，「管理者」といいます。）が個人で提供します。ユーザーの皆さまには，本規約に従って，本サービスをご利用いただきます。
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第2条（利用登録）</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                本サービスにおいては，登録希望者が本規約に同意の上，管理者の定める方法によって利用登録を申請し，管理者がこれを承認することによって，利用登録が完了するものとします。
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第3条（禁止事項）</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                                <li>法令または公序良俗に違反する行為</li>
                                <li>犯罪行為に関連する行為</li>
                                <li>本サービスの内容等，本サービスに含まれる著作権，商標権ほか知的財産権を侵害する行為</li>
                                <li>本サービスのサーバーまたはネットワークの機能を破壊したり，妨害したりする行為</li>
                                <li>本サービスによって得られた情報を商業的に利用する行為</li>
                                <li>管理者のサービスの運営を妨害するおそれのある行為</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第4条（本サービスの提供の停止等）</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                管理者は，以下のいずれかの事由があると判断した場合，ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2 mt-2">
                                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                                <li>地震，落雷，火災，停電または天災などの不可抗力により，本サービスの提供が困難となった場合</li>
                                <li>その他，管理者が本サービスの提供が困難と判断した場合</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第5条（保証の否認および免責事項）</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                管理者は，本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。管理者は，本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。
                            </p>
                        </section>

                        <section className="mb-12 border-t border-gray-100 dark:border-gray-800 pt-8 text-center text-sm text-gray-500">
                            <p>StudyTodoは個人開発によるプロジェクトです。法人ではありません。</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
