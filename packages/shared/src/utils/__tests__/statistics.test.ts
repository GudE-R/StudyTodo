import { describe, it, expect } from 'vitest';
import { calculateStreak } from '../statistics';
import { Session } from '../../types';
import { subDays, subHours } from 'date-fns';

const createSession = (date: Date): Session => ({
    id: `session-${date.getTime()}`,
    todoId: 'todo-1',
    todoTitle: 'Test Todo',
    duration: 1500, // 25 min
    createdAt: date,
    mode: 'pomodoro',
});

describe('calculateStreak', () => {
    it('should return 0 streak for empty sessions', () => {
        const result = calculateStreak([]);
        expect(result.currentStreak).toBe(0);
        expect(result.longestStreak).toBe(0);
    });

    it('should calculate streak of 1 for today', () => {
        const today = new Date();
        const sessions = [createSession(today)];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(1);
    });

    it('should calculate streak of 2 for today and yesterday', () => {
        const today = new Date();
        const yesterday = subDays(today, 1);
        const sessions = [createSession(today), createSession(yesterday)];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(2);
        expect(result.longestStreak).toBe(2);
    });

    it('should maintain streak if missed today but did yesterday', () => {
        const yesterday = subDays(new Date(), 1);
        const sessions = [createSession(yesterday)];
        const result = calculateStreak(sessions);
        // Logic says: if last study date is yesterday, streak is kept (usually displayed as current streak)
        expect(result.currentStreak).toBe(1);
    });

    it('should reset streak if missed more than 1 day', () => {
        const twoDaysAgo = subDays(new Date(), 2);
        const sessions = [createSession(twoDaysAgo)];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(0);
        expect(result.longestStreak).toBe(1); // Longest was 1 that day
    });

    it('should handle multiple sessions in one day correctly', () => {
        const today = new Date();
        const sessions = [
            createSession(today),
            createSession(subHours(today, 1)), // Same day, earlier
            createSession(subDays(today, 1))
        ];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(2); // Today + Yesterday
    });

    it('should calculate longest streak correctly across gaps', () => {
        const today = new Date();
        const sessions = [
            createSession(today), // Current: 1
            // Gap
            createSession(subDays(today, 3)),
            createSession(subDays(today, 4)),
            createSession(subDays(today, 5)), // Old streak: 3
        ];
        const result = calculateStreak(sessions);
        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(3);
    });
});
