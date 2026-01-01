import { ja, enUS, de, fr, es } from "date-fns/locale";

const localeMap: Record<string, any> = {
    ja: ja,
    en: enUS,
    de: de,
    fr: fr,
    es: es,
};

export function getDateFnsLocale(locale: string) {
    return localeMap[locale] || enUS;
}
