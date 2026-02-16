import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // `[locale]` セグメントを検証
    let locale = await requestLocale;

    if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`../../../../packages/shared/src/i18n/locales/${locale}.json`)).default
    };
});
