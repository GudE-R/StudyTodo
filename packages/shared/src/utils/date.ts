/**
 * 日付ユーティリティ
 * Web版とMobile版で共通の日付処理を提供
 */

/**
 * 日付を安全にパースする
 * 無効な値の場合は undefined を返す
 */
export function parseDate(value: string | Date | undefined | null): Date | undefined {
    if (value === null || value === undefined) {
        return undefined;
    }

    if (value instanceof Date) {
        return isNaN(value.getTime()) ? undefined : value;
    }

    if (typeof value === 'string') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? undefined : d;
    }

    return undefined;
}

/**
 * 日付をISO 8601文字列に変換
 * 無効な日付の場合は undefined を返す
 */
export function toISOString(value: Date | string | undefined | null): string | undefined {
    if (value === null || value === undefined) {
        return undefined;
    }

    if (typeof value === 'string') {
        // 既にISO文字列の場合はバリデーションして返す
        const d = new Date(value);
        if (isNaN(d.getTime())) {
            return undefined;
        }
        return d.toISOString();
    }

    if (value instanceof Date) {
        if (isNaN(value.getTime())) {
            return undefined;
        }
        return value.toISOString();
    }

    return undefined;
}

/**
 * 2つの日付の新しさを比較（ms単位）
 * cloud > local なら正の値、local > cloud なら負の値、同じなら 0
 * 一方が無効な場合、有効な方が新しいとみなす
 */
export function compareDates(
    cloudDate: Date | string | undefined | null,
    localDate: Date | string | undefined | null
): number {
    const cloud = parseDate(cloudDate);
    const local = parseDate(localDate);

    const cloudTime = cloud?.getTime() ?? 0;
    const localTime = local?.getTime() ?? 0;

    return cloudTime - localTime;
}

/**
 * 日付値が有効かどうかを判定
 */
export function isValidDate(value: Date | string | undefined | null): boolean {
    return parseDate(value) !== undefined;
}
