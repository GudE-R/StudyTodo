import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeepState } from '../useKeepState';

describe('useKeepState', () => {
    describe('handleDateLongPress', () => {
        it('日付をキープできること', () => {
            const { result } = renderHook(() => useKeepState());
            const date = new Date(2026, 2, 9);

            act(() => {
                result.current.handleDateLongPress(date);
            });

            expect(result.current.keptDate).toEqual(date);
        });

        it('同じ日付で再度押すとキープを解除できること', () => {
            const { result } = renderHook(() => useKeepState());
            const date = new Date(2026, 2, 9);

            act(() => {
                result.current.handleDateLongPress(date);
            });
            expect(result.current.keptDate).toEqual(date);

            act(() => {
                result.current.handleDateLongPress(date);
            });
            expect(result.current.keptDate).toBeNull();
        });

        it('異なる日付を押すと上書きされること', () => {
            const { result } = renderHook(() => useKeepState());
            const date1 = new Date(2026, 2, 9);
            const date2 = new Date(2026, 2, 10);

            act(() => {
                result.current.handleDateLongPress(date1);
            });
            act(() => {
                result.current.handleDateLongPress(date2);
            });

            expect(result.current.keptDate).toEqual(date2);
        });
    });

    describe('handleTimeLongPress', () => {
        it('時間と日付をキープできること', () => {
            const { result } = renderHook(() => useKeepState());
            const date = new Date(2026, 2, 9);
            const time = '10:00';

            act(() => {
                result.current.handleTimeLongPress(date, time);
            });

            expect(result.current.keptDate).toEqual(date);
            expect(result.current.keptTime).toBe('10:00');
        });

        it('同じ日付・時間で再度押すとキープを解除できること', () => {
            const { result } = renderHook(() => useKeepState());
            const date = new Date(2026, 2, 9);
            const time = '10:00';

            act(() => {
                result.current.handleTimeLongPress(date, time);
            });
            expect(result.current.keptTime).toBe('10:00');

            act(() => {
                result.current.handleTimeLongPress(date, time);
            });
            expect(result.current.keptDate).toBeNull();
            expect(result.current.keptTime).toBeNull();
        });

        it('異なる時間を押すと上書きされること', () => {
            const { result } = renderHook(() => useKeepState());
            const date = new Date(2026, 2, 9);

            act(() => {
                result.current.handleTimeLongPress(date, '10:00');
            });
            act(() => {
                result.current.handleTimeLongPress(date, '14:00');
            });

            expect(result.current.keptTime).toBe('14:00');
        });
    });

    describe('handleResetKeep', () => {
        it('キープ状態をリセットできること', () => {
            const { result } = renderHook(() => useKeepState());
            const date = new Date(2026, 2, 9);

            act(() => {
                result.current.handleTimeLongPress(date, '10:00');
            });
            expect(result.current.keptDate).toEqual(date);
            expect(result.current.keptTime).toBe('10:00');

            act(() => {
                result.current.handleResetKeep();
            });
            expect(result.current.keptDate).toBeNull();
            expect(result.current.keptTime).toBeNull();
        });
    });
});
