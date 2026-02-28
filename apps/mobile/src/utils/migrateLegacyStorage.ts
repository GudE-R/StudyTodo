import AsyncStorage from '@react-native-async-storage/async-storage';
import { documentDirectory, getInfoAsync, moveAsync, deleteAsync } from 'expo-file-system/legacy';

/**
 * pomarc → studytodo へのレガシーデータマイグレーション
 *
 * 旧名称 "pomarc" で保存されていた AsyncStorage キーと SQLite DB ファイルを
 * 新名称 "studytodo" に移行する。
 *
 * - 初回起動時にのみ実行される（フラグで二重実行を防止）
 * - App.tsx で Provider 構築前に await で呼び出す
 */

const MIGRATION_FLAG_KEY = '@studytodo_migration_v1_done';

// AsyncStorage の旧キー → 新キー マッピング
const STORAGE_KEY_MIGRATIONS: [string, string][] = [
    ['@pomarc_theme_mode', '@studytodo_theme_mode'],
    ['@pomarc_layout_mode', '@studytodo_layout_mode'],
    ['@pomarc_reminder_enabled', '@studytodo_reminder_enabled'],
    ['@pomarc_reminder_time', '@studytodo_reminder_time'],
];

const OLD_DB_NAME = 'pomarc.db';
const NEW_DB_NAME = 'studytodo.db';

/**
 * AsyncStorage の旧キーを新キーに移行する。
 * 旧キーに値が存在し、新キーにまだ値がない場合のみコピーし、旧キーを削除する。
 */
export async function migrateAsyncStorageKeys(): Promise<void> {
    for (const [oldKey, newKey] of STORAGE_KEY_MIGRATIONS) {
        try {
            const oldValue = await AsyncStorage.getItem(oldKey);
            if (oldValue !== null) {
                // 新キーに既に値がある場合は上書きしない（安全策）
                const newValue = await AsyncStorage.getItem(newKey);
                if (newValue === null) {
                    await AsyncStorage.setItem(newKey, oldValue);
                }
                await AsyncStorage.removeItem(oldKey);
                if (__DEV__) {
                    console.log(`[Migration] AsyncStorage: ${oldKey} → ${newKey}`);
                }
            }
        } catch (error) {
            // 個別キーの失敗で全体を止めない
            if (__DEV__) {
                console.warn(`[Migration] Failed to migrate key ${oldKey}:`, error);
            }
        }
    }
}

/**
 * SQLite DB ファイルを旧名から新名にリネームする。
 * expo-sqlite は documentDirectory 配下の SQLite/ フォルダにDBを保存する。
 */
export async function migrateDatabaseFile(): Promise<void> {
    const sqliteDir = `${documentDirectory}SQLite/`;
    const oldDbPath = `${sqliteDir}${OLD_DB_NAME}`;
    const newDbPath = `${sqliteDir}${NEW_DB_NAME}`;

    try {
        const oldDbInfo = await getInfoAsync(oldDbPath);
        if (!oldDbInfo.exists) {
            // 旧DBが存在しない（新規ユーザーまたは既に移行済み）
            if (__DEV__) {
                console.log('[Migration] No legacy DB found, skipping.');
            }
            return;
        }

        // 新DBが既に存在する場合はリネームしない（安全策）
        const newDbInfo = await getInfoAsync(newDbPath);
        if (newDbInfo.exists) {
            if (__DEV__) {
                console.log('[Migration] New DB already exists, skipping rename.');
            }
            // 旧DBを削除して重複を防ぐ
            await deleteAsync(oldDbPath, { idempotent: true });
            return;
        }

        // リネーム実行
        await moveAsync({
            from: oldDbPath,
            to: newDbPath,
        });

        // WAL/SHM ジャーナルファイルも移行
        for (const suffix of ['-wal', '-shm']) {
            const oldJournal = `${oldDbPath}${suffix}`;
            const newJournal = `${newDbPath}${suffix}`;
            const journalInfo = await getInfoAsync(oldJournal);
            if (journalInfo.exists) {
                await moveAsync({
                    from: oldJournal,
                    to: newJournal,
                });
            }
        }

        if (__DEV__) {
            console.log(`[Migration] DB renamed: ${OLD_DB_NAME} → ${NEW_DB_NAME}`);
        }
    } catch (error) {
        // DB移行失敗は致命的エラーだがクラッシュさせない
        // 旧DBはそのまま残るので、次回起動時に再試行される
        console.error('[Migration] Failed to migrate database file:', error);
    }
}

/**
 * 全マイグレーションを実行する。
 * App起動時に一度だけ呼ばれる。マイグレーション完了後にフラグを保存し、
 * 二度目以降はスキップする。
 */
export async function runMigrations(): Promise<void> {
    try {
        const done = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
        if (done === 'true') {
            return; // 既にマイグレーション済み
        }

        if (__DEV__) {
            console.log('[Migration] Starting pomarc → studytodo migration...');
        }

        // 1. DBファイルリネーム（Repository初期化前に必ず完了させる）
        await migrateDatabaseFile();

        // 2. AsyncStorageキー移行
        await migrateAsyncStorageKeys();

        // 3. マイグレーション完了フラグを保存
        await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');

        if (__DEV__) {
            console.log('[Migration] Migration completed successfully.');
        }
    } catch (error) {
        console.error('[Migration] Migration failed:', error);
        // フラグを保存しないので次回起動時に再試行される
    }
}
