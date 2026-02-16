import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LanguageDetectorAsyncModule } from 'i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'intl-pluralrules';

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
            useSuspense: false, // React Native doesn't support Suspense well yet (or async usage)
        },
    });

export default i18n;
