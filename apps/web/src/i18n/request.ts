import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing } from './routing';

// 訳の無いキーはキー名ではなく英語で表示する（英語を土台に表示言語の訳を重ねる。モバイルの fallbackLng と同じ扱い）
function mergeMessages(base: AbstractIntlMessages, override: AbstractIntlMessages): AbstractIntlMessages {
    const result: AbstractIntlMessages = { ...base };
    for (const [key, value] of Object.entries(override)) {
        const baseValue = base[key];
        result[key] = typeof value === 'object' && typeof baseValue === 'object'
            ? mergeMessages(baseValue, value)
            : value;
    }
    return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
    // `[locale]` セグメントを検証
    let locale = await requestLocale;

    if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
        locale = routing.defaultLocale;
    }

    const fallback = (await import('../../../../packages/shared/src/i18n/locales/en.json')).default;
    const messages = (await import(`../../../../packages/shared/src/i18n/locales/${locale}.json`)).default;

    return {
        locale,
        messages: locale === 'en' ? fallback : mergeMessages(fallback, messages)
    };
});
