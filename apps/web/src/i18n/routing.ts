import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // サポートするロケールのリスト
    locales: ['ja', 'en', 'de', 'fr', 'es', 'ko', 'zh-CN', 'zh-TW', 'pt-BR', 'it', 'ru', 'vi', 'id', 'tr', 'nl', 'sv', 'no', 'da', 'fi', 'hi', 'ar', 'bn', 'ur', 'th', 'pl', 'tl', 'fa', 'ms', 'ro', 'cs', 'el', 'hu', 'uk', 'he', 'sw'],

    // ロケールが指定されていない場合に使用されるデフォルト
    defaultLocale: 'ja'
});

// 軽量なラッパーを作成して、型安全なナビゲーションを実現
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
