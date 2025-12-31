import { describe, it, expect } from 'vitest';
import { parseDate, toISOString, compareDates, isValidDate } from '../date';

describe('parseDate', () => {
    it('ISO文字列をパースする', () => {
        const result = parseDate('2025-01-01T10:00:00.000Z');
        expect(result).toBeInstanceOf(Date);
        expect(result?.toISOString()).toBe('2025-01-01T10:00:00.000Z');
    });

    it('Date オブジェクトをそのまま返す', () => {
        const date = new Date('2025-01-01T10:00:00.000Z');
        const result = parseDate(date);
        expect(result).toBe(date);
    });

    it('無効な文字列は undefined を返す', () => {
        expect(parseDate('invalid-date')).toBeUndefined();
        expect(parseDate('')).toBeUndefined();
    });

    it('null/undefined は undefined を返す', () => {
        expect(parseDate(null)).toBeUndefined();
        expect(parseDate(undefined)).toBeUndefined();
    });

    it('無効な Date オブジェクトは undefined を返す', () => {
        const invalidDate = new Date('invalid');
        expect(parseDate(invalidDate)).toBeUndefined();
    });
});

describe('toISOString', () => {
    it('Date を ISO 文字列に変換する', () => {
        const date = new Date('2025-01-01T10:00:00.000Z');
        expect(toISOString(date)).toBe('2025-01-01T10:00:00.000Z');
    });

    it('文字列は正規化して返す', () => {
        // 様々な形式を受け付けてISO形式に正規化
        const result = toISOString('2025-01-01T10:00:00Z');
        expect(result).toBe('2025-01-01T10:00:00.000Z');
    });

    it('無効な Date は undefined を返す', () => {
        const invalidDate = new Date('invalid');
        expect(toISOString(invalidDate)).toBeUndefined();
    });

    it('無効な文字列は undefined を返す', () => {
        expect(toISOString('invalid-date')).toBeUndefined();
    });

    it('null/undefined は undefined を返す', () => {
        expect(toISOString(null)).toBeUndefined();
        expect(toISOString(undefined)).toBeUndefined();
    });
});

describe('compareDates', () => {
    it('cloud が新しい場合は正の値を返す', () => {
        const cloud = '2025-01-02T10:00:00.000Z';
        const local = '2025-01-01T10:00:00.000Z';
        expect(compareDates(cloud, local)).toBeGreaterThan(0);
    });

    it('local が新しい場合は負の値を返す', () => {
        const cloud = '2025-01-01T10:00:00.000Z';
        const local = '2025-01-02T10:00:00.000Z';
        expect(compareDates(cloud, local)).toBeLessThan(0);
    });

    it('同じ場合は 0 を返す', () => {
        const date = '2025-01-01T10:00:00.000Z';
        expect(compareDates(date, date)).toBe(0);
    });

    it('cloud が undefined で local が有効な場合は負の値を返す', () => {
        const local = '2025-01-01T10:00:00.000Z';
        expect(compareDates(undefined, local)).toBeLessThan(0);
    });

    it('local が undefined で cloud が有効な場合は正の値を返す', () => {
        const cloud = '2025-01-01T10:00:00.000Z';
        expect(compareDates(cloud, undefined)).toBeGreaterThan(0);
    });

    it('両方 undefined の場合は 0 を返す', () => {
        expect(compareDates(undefined, undefined)).toBe(0);
    });

    it('Date オブジェクトも受け付ける', () => {
        const cloud = new Date('2025-01-02T10:00:00.000Z');
        const local = new Date('2025-01-01T10:00:00.000Z');
        expect(compareDates(cloud, local)).toBeGreaterThan(0);
    });
});

describe('isValidDate', () => {
    it('有効な日付文字列は true を返す', () => {
        expect(isValidDate('2025-01-01T10:00:00.000Z')).toBe(true);
    });

    it('有効な Date オブジェクトは true を返す', () => {
        expect(isValidDate(new Date())).toBe(true);
    });

    it('無効な日付は false を返す', () => {
        expect(isValidDate('invalid-date')).toBe(false);
        expect(isValidDate(new Date('invalid'))).toBe(false);
    });

    it('null/undefined は false を返す', () => {
        expect(isValidDate(null)).toBe(false);
        expect(isValidDate(undefined)).toBe(false);
    });
});
