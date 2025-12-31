/**
 * 同期コアロジック
 * Web版とMobile版で共通の同期処理を提供
 */

import { compareDates } from '../utils/date';

/**
 * 同期対象アイテムの基本インターフェース
 */
export interface SyncItem {
    id: string;
    updatedAt?: Date | string;
}

/**
 * 同期処理のハンドラー
 */
export interface SyncHandlers<T extends SyncItem> {
    /** 新規アイテムをローカルに追加 */
    onImport: (item: T) => Promise<void>;
    /** 既存アイテムをローカルで更新 */
    onUpdate: (id: string, item: T) => Promise<void>;
    /** アイテムをクラウドにエクスポート */
    onExport: (items: T[]) => Promise<void>;
}

/**
 * 同期結果
 */
export interface SyncResult {
    /** ローカルにインポートした件数 */
    imported: number;
    /** ローカルを更新した件数 */
    updated: number;
    /** クラウドにエクスポートした件数 */
    exported: number;
}

/**
 * ローカルとクラウドのデータをマージする共通ロジック
 * 
 * @param localItems ローカルのアイテム一覧
 * @param cloudItems クラウドのアイテム一覧（fromSupabase済み）
 * @param handlers 同期処理のハンドラー
 * @returns 同期結果
 */
export async function processTableSync<T extends SyncItem>(
    localItems: T[],
    cloudItems: T[],
    handlers: SyncHandlers<T>
): Promise<SyncResult> {
    const cloudMap = new Map(cloudItems.map(item => [item.id, item]));
    const localMap = new Map(localItems.map(item => [item.id, item]));

    const toImport: T[] = [];
    const toUpdate: T[] = [];
    const toExport: T[] = [];

    // クラウドのアイテムを処理
    for (const [id, cloudItem] of cloudMap) {
        const localItem = localMap.get(id);

        if (!localItem) {
            // ローカルに存在しない → インポート
            toImport.push(cloudItem);
        } else {
            // 両方に存在する → updatedAt を比較
            const comparison = compareDates(cloudItem.updatedAt, localItem.updatedAt);

            if (comparison > 0) {
                // クラウドが新しい → ローカルを更新
                toUpdate.push(cloudItem);
            } else if (comparison < 0) {
                // ローカルが新しい → クラウドにエクスポート
                toExport.push(localItem);
            }
            // comparison === 0 の場合は何もしない（同じ）
        }
    }

    // ローカルにのみ存在するアイテム → クラウドにエクスポート
    for (const [id, localItem] of localMap) {
        if (!cloudMap.has(id)) {
            toExport.push(localItem);
        }
    }

    // 処理を実行
    for (const item of toImport) {
        await handlers.onImport(item);
    }

    for (const item of toUpdate) {
        await handlers.onUpdate(item.id, item);
    }

    if (toExport.length > 0) {
        await handlers.onExport(toExport);
    }

    return {
        imported: toImport.length,
        updated: toUpdate.length,
        exported: toExport.length
    };
}

/**
 * 許可されたフィールドのマップ
 * 各テーブルごとにSupabaseに送信可能なフィールドを定義
 */
export const allowedFieldsMap: Record<string, string[]> = {
    todos: [
        'id', 'title', 'completed', 'createdAt', 'updatedAt',
        'dueDate', 'dueTime', 'endTime', 'categoryId',
        'estimatedDuration', 'actualDuration', 'priority', 'notes', 'tags',
        'srsLevel', 'nextReviewDate', 'srsProfileId', 'reviewHistory',
        'memo', 'range', 'srsInterval', 'srsGroupId'
    ],
    categories: [
        'id', 'name', 'parentId', 'level', 'isDefault', 'order',
        'createdAt', 'updatedAt', 'icon'
    ],
    srsProfiles: [
        'id', 'name', 'intervals', 'isDefault', 'createdAt', 'updatedAt'
    ],
    sessions: [
        'id', 'todoId', 'todoTitle', 'startTime', 'endTime',
        'duration', 'mode', 'createdAt'
    ]
};

/**
 * Supabaseテーブル名のマップ
 * アプリ側のテーブル名 → Supabase側のテーブル名
 */
export const supabaseTableMap: Record<string, string> = {
    todos: 'todos',
    categories: 'categories',
    srsProfiles: 'srs_profiles',
    sessions: 'sessions'
};
