import { ja, enUS, de, fr, es, ko, zhCN, zhTW, ptBR, it, ru, vi, id, tr, nl, sv, nb, da, fi } from 'date-fns/locale';
import { Locale } from 'date-fns';

const locales: { [key: string]: Locale } = {
    ja,
    en: enUS,
    de,
    fr,
    es,
    ko,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'pt-BR': ptBR,
    it,
    ru,
    vi,
    id,
    tr,
    nl,
    sv,
    no: nb, // Norwegian Bokmål
    da,
    fi
};

export function getDateFnsLocale(locale: string) {
    return locales[locale] || enUS;
}
