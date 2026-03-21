import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LanguageDetectorAsyncModule } from 'i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import 'intl-pluralrules';
import { RTL_LANGUAGES } from './languages';

import da from '@studytodo/shared/src/i18n/locales/da.json';
import de from '@studytodo/shared/src/i18n/locales/de.json';
import en from '@studytodo/shared/src/i18n/locales/en.json';
import es from '@studytodo/shared/src/i18n/locales/es.json';
import fi from '@studytodo/shared/src/i18n/locales/fi.json';
import fr from '@studytodo/shared/src/i18n/locales/fr.json';
import id from '@studytodo/shared/src/i18n/locales/id.json';
import it from '@studytodo/shared/src/i18n/locales/it.json';
import ja from '@studytodo/shared/src/i18n/locales/ja.json';
import ko from '@studytodo/shared/src/i18n/locales/ko.json';
import nl from '@studytodo/shared/src/i18n/locales/nl.json';
import no from '@studytodo/shared/src/i18n/locales/no.json';
import ptBR from '@studytodo/shared/src/i18n/locales/pt-BR.json';
import ru from '@studytodo/shared/src/i18n/locales/ru.json';
import sv from '@studytodo/shared/src/i18n/locales/sv.json';
import tr from '@studytodo/shared/src/i18n/locales/tr.json';
import vi from '@studytodo/shared/src/i18n/locales/vi.json';
import zhCN from '@studytodo/shared/src/i18n/locales/zh-CN.json';
import zhTW from '@studytodo/shared/src/i18n/locales/zh-TW.json';
// New languages
import hi from '@studytodo/shared/src/i18n/locales/hi.json';
import ar from '@studytodo/shared/src/i18n/locales/ar.json';
import bn from '@studytodo/shared/src/i18n/locales/bn.json';
import ur from '@studytodo/shared/src/i18n/locales/ur.json';
import th from '@studytodo/shared/src/i18n/locales/th.json';
import pl from '@studytodo/shared/src/i18n/locales/pl.json';
import tl from '@studytodo/shared/src/i18n/locales/tl.json';
import fa from '@studytodo/shared/src/i18n/locales/fa.json';
import ms from '@studytodo/shared/src/i18n/locales/ms.json';
import ro from '@studytodo/shared/src/i18n/locales/ro.json';
import cs from '@studytodo/shared/src/i18n/locales/cs.json';
import el from '@studytodo/shared/src/i18n/locales/el.json';
import hu from '@studytodo/shared/src/i18n/locales/hu.json';
import uk from '@studytodo/shared/src/i18n/locales/uk.json';
import he from '@studytodo/shared/src/i18n/locales/he.json';
import sw from '@studytodo/shared/src/i18n/locales/sw.json';

const resources = {
    da: { translation: da },
    de: { translation: de },
    en: { translation: en },
    es: { translation: es },
    fi: { translation: fi },
    fr: { translation: fr },
    id: { translation: id },
    it: { translation: it },
    ja: { translation: ja },
    ko: { translation: ko },
    nl: { translation: nl },
    no: { translation: no },
    'pt-BR': { translation: ptBR },
    ru: { translation: ru },
    sv: { translation: sv },
    tr: { translation: tr },
    vi: { translation: vi },
    'zh-CN': { translation: zhCN },
    'zh-TW': { translation: zhTW },
    // New languages
    hi: { translation: hi },
    ar: { translation: ar },
    bn: { translation: bn },
    ur: { translation: ur },
    th: { translation: th },
    pl: { translation: pl },
    tl: { translation: tl },
    fa: { translation: fa },
    ms: { translation: ms },
    ro: { translation: ro },
    cs: { translation: cs },
    el: { translation: el },
    hu: { translation: hu },
    uk: { translation: uk },
    he: { translation: he },
    sw: { translation: sw },
};

const LANGUAGE_DETECTOR: LanguageDetectorAsyncModule = {
    type: 'languageDetector',
    async: true,
    detect: async (callback: (lng: string | readonly string[] | undefined) => void | undefined): Promise<string | readonly string[] | undefined> => {
        try {
            const stored = await AsyncStorage.getItem('user-language');
            if (stored) {
                callback(stored);
                return stored;
            }

            const locales = Localization.getLocales();
            const primary = locales[0];
            if (!primary) {
                callback('en');
                return 'en';
            }

            // Try tag match first (e.g. pt-BR)
            if (primary.languageTag && resources[primary.languageTag as keyof typeof resources]) {
                callback(primary.languageTag);
                return primary.languageTag;
            }

            // Fallback to language code (e.g. ja)
            const lang = primary.languageCode ?? 'en';
            callback(lang);
            return lang;
        } catch (e) {
            callback('en');
            return 'en';
        }
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem('user-language', language);
        } catch (e) { }
    },
};

const isRTL = (lang: string) => (RTL_LANGUAGES as readonly string[]).includes(lang);

i18n
    .use(initReactI18next)
    .use(LANGUAGE_DETECTOR)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already safes from xss
        },
        compatibilityJSON: 'v4',
        react: {
            useSuspense: false,
        },
    });

// Apply RTL when language changes
i18n.on('languageChanged', (lang: string) => {
    const shouldBeRTL = isRTL(lang);
    if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
        I18nManager.allowRTL(shouldBeRTL);
        // Note: App restart required for RTL changes to take effect.
        // React Native's I18nManager changes apply on next app launch.
    }
});

export default i18n;
