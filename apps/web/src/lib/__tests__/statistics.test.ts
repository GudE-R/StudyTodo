import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateStreak } from '../statistics';
import { Session } from '@studytodo/shared';

/**
 * Helper: 指定日の Session を作成
 */
function makeSession(dateStr: string): Session {
    return {
        id: `sess-${dateStr}`,
        todoId: 'todo1',
        todoTitle: 'Test',
        duration: 1500,
        createdAt: new Date(dateStr),
        mode: 'pomodoro',
    };
}

describe('calculateStreak', () => {
    // テスト内で「今日」を固定するため fakeTimers を使用
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z')); // 日曜日
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('空配列の場合 {0, 0} を返すこと', () => {
        const result = calculateStreak([]);
        expect(result).toEqual({ currentStreak: 0, longestStreak: 0 });
    });

    it('今日のみセッションがある場合 currentStreak: 1', () => {
        const sessions = [makeSession('2025-06-15T10:00:00Z')];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(1);
    });

    it('今日と昨日にセッションがある場合 currentStreak: 2', () => {
        const sessions = [
            makeSession('2025-06-15T10:00:00Z'),
            makeSession('2025-06-14T10:00:00Z'),
        ];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(2);
    });

    it('3日連続（今日含む）の場合 currentStreak: 3', () => {
        const sessions = [
            makeSession('2025-06-15T10:00:00Z'),
            makeSession('2025-06-14T10:00:00Z'),
            makeSession('2025-06-13T10:00:00Z'),
        ];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(3);
        expect(result.longestStreak).toBe(3);
    });

    it('昨日まで3日連続、今日はまだ → currentStreak: 3', () => {
        const sessions = [
            makeSession('2025-06-14T10:00:00Z'),
            makeSession('2025-06-13T10:00:00Z'),
            makeSession('2025-06-12T10:00:00Z'),
        ];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(3);
    });

    it('2日以上前で途切れている場合 currentStreak: 0', () => {
        const sessions = [
            makeSession('2025-06-10T10:00:00Z'),
        ];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(0);
    });

    it('同じ日に複数セッションがあっても1日分としてカウント', () => {
        const sessions = [
            makeSession('2025-06-15T08:00:00Z'),
            makeSession('2025-06-15T10:00:00Z'),
            makeSession('2025-06-15T14:00:00Z'),
        ];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(1);
    });

    it('最長ストリークが現在のストリークより長い場合', () => {
        // 過去に4日連続があったが、その後途切れて今日は1日目
        const sessions = [
            makeSession('2025-06-15T10:00:00Z'), // 今日
            // gap: 6/14 なし → currentStreak = 1
            makeSession('2025-06-05T10:00:00Z'),
            makeSession('2025-06-04T10:00:00Z'),
            makeSession('2025-06-03T10:00:00Z'),
            makeSession('2025-06-02T10:00:00Z'), // 過去4日連続
        ];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(4);
    });

    it('連続が途切れた後にまた連続がある場合の最長を計算', () => {
        const sessions = [
            // Block 1: 3 days (6/15, 6/14, 6/13)
            makeSession('2025-06-15T10:00:00Z'),
            makeSession('2025-06-14T10:00:00Z'),
            makeSession('2025-06-13T10:00:00Z'),
            // Gap: 6/12 なし
            // Block 2: 5 days (6/11 ~ 6/7)
            makeSession('2025-06-11T10:00:00Z'),
            makeSession('2025-06-10T10:00:00Z'),
            makeSession('2025-06-09T10:00:00Z'),
            makeSession('2025-06-08T10:00:00Z'),
            makeSession('2025-06-07T10:00:00Z'),
        ];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(3);
        expect(result.longestStreak).toBe(5);
    });
});
