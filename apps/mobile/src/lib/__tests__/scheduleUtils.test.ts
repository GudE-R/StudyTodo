import { describe, it, expect } from 'vitest';
import { calculateTopPosition, slotIndexToTimeStr, isHalfHourSlot } from '../scheduleUtils';

describe('scheduleUtils', () => {
    describe('calculateTopPosition', () => {
        it('calculates the top position correctly at the start of the day', () => {
            expect(calculateTopPosition(0, 30, 15)).toBe(15);
        });

        it('calculates the top position correctly for a mid-day time (e.g., 08:00)', () => {
            // 8:00 is 480 minutes
            // (480 / 30) * 30 + 15 = 16 * 30 + 15 = 480 + 15 = 495
            expect(calculateTopPosition(480, 30, 15)).toBe(495);
        });

        it('calculates top position for 30 min slot correctly', () => {
            // (30 / 30) * 27 + 15 = 27 + 15 = 42
            expect(calculateTopPosition(30, 27, 15)).toBe(42);
        });
    });

    describe('slotIndexToTimeStr', () => {
        it('formats 0:00 correctly', () => {
            expect(slotIndexToTimeStr(0)).toBe('00:00');
        });

        it('formats 8:30 correctly', () => {
            expect(slotIndexToTimeStr(17)).toBe('08:30');
        });

        it('formats 23:30 correctly', () => {
            expect(slotIndexToTimeStr(47)).toBe('23:30');
        });
    });

    describe('isHalfHourSlot', () => {
        it('identifies 0:00 as NOT a half-hour', () => {
            expect(isHalfHourSlot(0)).toBe(false);
        });

        it('identifies 0:30 as a half-hour', () => {
            expect(isHalfHourSlot(1)).toBe(true);
        });

        it('identifies 23:30 as a half-hour', () => {
            expect(isHalfHourSlot(47)).toBe(true);
        });
    });
});
