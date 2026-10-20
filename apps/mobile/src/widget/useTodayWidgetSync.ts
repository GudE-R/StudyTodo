import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { ExtensionStorage } from '@bacons/apple-targets';
import i18n from 'i18next';
import { useRepository } from '../providers/RepositoryProvider';
import { buildTodayWidgetPayload } from './buildTodayWidgetPayload';

const APP_GROUP = 'group.com.studytodo.app';
const STORAGE_KEY = 'todayWidget';
const storage = new ExtensionStorage(APP_GROUP);

/**
 * iOS ホーム画面ウィジェットへ今日の Todo を書き出す。
 * 起動時・todos/categories 変更時・フォアグラウンド復帰時（日付またぎ対策）に更新する。
 */
export function useTodayWidgetSync() {
    const repository = useRepository();

    useEffect(() => {
        if (Platform.OS !== 'ios') return;

        let timer: ReturnType<typeof setTimeout> | undefined;

        const sync = async () => {
            try {
                const [todos, categories] = await Promise.all([
                    repository.getTodos(),
                    repository.getCategories(),
                ]);
                const payload = buildTodayWidgetPayload(todos, categories, new Date(), {
                    title: i18n.t('widget.title'),
                    empty: i18n.t('widget.empty'),
                    more: i18n.t('widget.more', { n: '%d' }),
                    openApp: i18n.t('widget.openApp'),
                });
                storage.set(STORAGE_KEY, JSON.stringify(payload));
                ExtensionStorage.reloadWidget();
            } catch (error) {
                if (__DEV__) console.warn('[useTodayWidgetSync] failed', error);
            }
        };

        // 連続した変更（SRS一括追加など）をまとめる
        const scheduleSync = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(sync, 500);
        };

        scheduleSync();

        const unsubscribe = repository.onDataChange?.((table) => {
            if (table === 'todos' || table === 'categories') scheduleSync();
        });
        const appStateSub = AppState.addEventListener('change', (state) => {
            if (state === 'active') scheduleSync();
        });
        i18n.on('languageChanged', scheduleSync);

        return () => {
            if (timer) clearTimeout(timer);
            unsubscribe?.();
            appStateSub.remove();
            i18n.off('languageChanged', scheduleSync);
        };
    }, [repository]);
}
