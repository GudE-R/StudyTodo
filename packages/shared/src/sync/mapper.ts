/**
 * Supabase ⇔ App データ変換共通モジュール
 * - camelCase ⇔ snake_case 変換
 * - 日付のISO文字列変換
 * - 無効な日付値のサニタイズ
 */

import { toISOString } from '../utils/date';

/**
 * camelCase を snake_case に変換
 */
function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * snake_case を camelCase に変換
 */
function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 日付フィールドかどうかを判定
 */
function isDateField(key: string): boolean {
    const dateFields = [
        'createdAt', 'updatedAt', 'dueDate', 'nextReviewDate',
        'startTime', 'endTime',
        'created_at', 'updated_at', 'due_date', 'next_review_date',
        'start_time', 'end_time'
    ];
    return dateFields.includes(key) ||
        key.endsWith('At') ||
        key.endsWith('Date') ||
        key.endsWith('_at') ||
        key.endsWith('_date');
}

export const mapper = {
    /**
     * アプリのエンティティをSupabase形式に変換
     * @param entity 変換対象のエンティティ
     * @param userId ユーザーID（存在する場合は追加）
     * @param allowedFields 含めるフィールドのホワイトリスト
     */
    toSupabase: (entity: Record<string, unknown>, userId?: string, allowedFields?: string[]): Record<string, unknown> => {
        const result: Record<string, unknown> = {};

        for (const key in entity) {
            // allowedFields が指定されていて、キーが含まれていない場合はスキップ
            if (allowedFields && !allowedFields.includes(key)) {
                continue;
            }

            const snakeKey = toSnakeCase(key);
            let value = entity[key];

            // Date オブジェクトを ISO 文字列に変換
            if (value instanceof Date) {
                const isoString = toISOString(value);
                value = isoString ?? null; // 無効な日付は null
            }

            result[snakeKey] = value;
        }

        // user_id を追加
        if (userId) {
            result['user_id'] = userId;
        }

        return result;
    },

    /**
     * Supabaseのエンティティをアプリ形式に変換
     * @param entity Supabaseから取得したエンティティ
     */
    fromSupabase: <T = Record<string, unknown>>(entity: Record<string, unknown>): T => {
        const result: Record<string, unknown> = {};

        for (const key in entity) {
            // user_id はアプリ側では不要
            if (key === 'user_id') {
                continue;
            }

            // estimated_time → estimatedDuration の特殊マッピング
            if (key === 'estimated_time') {
                result['estimatedDuration'] = entity[key];
                continue;
            }

            const camelKey = toCamelCase(key);
            let value = entity[key];

            // 日付フィールドは Date オブジェクトに変換
            if (isDateField(key) && typeof value === 'string' && value) {
                const date = new Date(value);
                value = isNaN(date.getTime()) ? undefined : date;
            }

            result[camelKey] = value;
        }

        return result as T;
    }
};

export type Mapper = typeof mapper;
