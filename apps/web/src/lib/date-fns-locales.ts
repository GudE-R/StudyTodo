import { ja, enUS, de, fr, es, ko, zhCN, zhTW, ptBR, it, ru, vi, id, tr, nl } from "date-fns/locale";

const localeMap: Record<string, any> = {
    ja: ja,
    en: enUS,
    de: de,
    fr: fr,
    es: es,
    ko: ko,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'pt-BR': ptBR,
    it: it,
    ru: ru,
    vi: vi,
    id: id,
    tr: tr,
    nl: nl,
};

export function getDateFnsLocale(locale: string) {
    return localeMap[locale] || enUS;
}
