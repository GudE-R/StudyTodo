import { describe, it, expect } from 'vitest';
import {
    tick,
    resetTimerState,
    createInitialState,
    calculateProgress,
    formatTime,
    TimerState,
} from '../timerCore';

describe('timerCore', () => {
    describe('createInitialState', () => {
        it('デフォルト値で初期化する', () => {
            const state = createInitialState();
            expect(state.mode).toBe('pomodoro');
            expect(state.timeLeft).toBe(1500);
            expect(state.isActive).toBe(false);
            expect(state.elapsed).toBe(0);
        });

        it('カスタム値で初期化する', () => {
            const state = createInitialState('countdown', 60);
            expect(state.mode).toBe('countdown');
            expect(state.timeLeft).toBe(60);
        });

        it('stopwatch モードで初期化する', () => {
            const state = createInitialState('stopwatch', 0);
            expect(state.mode).toBe('stopwatch');
            expect(state.timeLeft).toBe(0);
        });
    });

    describe('tick', () => {
        it('非アクティブ時は何も変わらない', () => {
            const state: TimerState = { mode: 'pomodoro', timeLeft: 100, isActive: false, elapsed: 0 };
            const result = tick(state);
            expect(result.timeLeft).toBe(100);
            expect(result.elapsed).toBe(0);
            expect(result.isActive).toBe(false);
            expect(result.completed).toBe(false);
        });

        it('pomodoro モードで1秒カウントダウンする', () => {
            const state: TimerState = { mode: 'pomodoro', timeLeft: 10, isActive: true, elapsed: 0 };
            const result = tick(state);
            expect(result.timeLeft).toBe(9);
            expect(result.elapsed).toBe(1);
            expect(result.isActive).toBe(true);
            expect(result.completed).toBe(false);
        });

        it('countdown モードで1秒カウントダウンする', () => {
            const state: TimerState = { mode: 'countdown', timeLeft: 5, isActive: true, elapsed: 3 };
            const result = tick(state);
            expect(result.timeLeft).toBe(4);
            expect(result.elapsed).toBe(4);
        });

        it('残り1秒で完了する', () => {
            const state: TimerState = { mode: 'pomodoro', timeLeft: 1, isActive: true, elapsed: 99 };
            const result = tick(state);
            expect(result.timeLeft).toBe(0);
            expect(result.elapsed).toBe(100);
            expect(result.isActive).toBe(false);
            expect(result.completed).toBe(true);
        });

        it('残り0秒でも完了する', () => {
            const state: TimerState = { mode: 'countdown', timeLeft: 0, isActive: true, elapsed: 60 };
            const result = tick(state);
            expect(result.completed).toBe(true);
            expect(result.isActive).toBe(false);
        });

        it('stopwatch モードでカウントアップする', () => {
            const state: TimerState = { mode: 'stopwatch', timeLeft: 5, isActive: true, elapsed: 5 };
            const result = tick(state);
            expect(result.timeLeft).toBe(6);
            expect(result.elapsed).toBe(6);
            expect(result.isActive).toBe(true);
            expect(result.completed).toBe(false);
        });

        it('連続tickで正しく動作する', () => {
            let state: TimerState = { mode: 'pomodoro', timeLeft: 3, isActive: true, elapsed: 0 };
            state = { ...state, ...tick(state) }; // 3→2
            state = { ...state, ...tick(state) }; // 2→1
            const result = tick(state);            // 1→0 (完了)
            expect(result.timeLeft).toBe(0);
            expect(result.elapsed).toBe(3);
            expect(result.completed).toBe(true);
        });
    });

    describe('resetTimerState', () => {
        it('pomodoro モードでリセットする', () => {
            const state = resetTimerState('pomodoro', 1500);
            expect(state.mode).toBe('pomodoro');
            expect(state.timeLeft).toBe(1500);
            expect(state.isActive).toBe(false);
            expect(state.elapsed).toBe(0);
        });

        it('stopwatch モードでリセットする（timeLeft は 0）', () => {
            const state = resetTimerState('stopwatch', 100);
            expect(state.timeLeft).toBe(0);
            expect(state.elapsed).toBe(0);
        });

        it('countdown モードでリセットする', () => {
            const state = resetTimerState('countdown', 60);
            expect(state.timeLeft).toBe(60);
        });
    });

    describe('calculateProgress', () => {
        it('0% を返す（開始時）', () => {
            const state: TimerState = { mode: 'pomodoro', timeLeft: 100, isActive: true, elapsed: 0 };
            expect(calculateProgress(state, 100)).toBe(0);
        });

        it('50% を返す（半分経過）', () => {
            const state: TimerState = { mode: 'pomodoro', timeLeft: 50, isActive: true, elapsed: 50 };
            expect(calculateProgress(state, 100)).toBe(50);
        });

        it('100% を返す（完了時）', () => {
            const state: TimerState = { mode: 'pomodoro', timeLeft: 0, isActive: false, elapsed: 100 };
            expect(calculateProgress(state, 100)).toBe(100);
        });

        it('stopwatch モードでは 0 を返す', () => {
            const state: TimerState = { mode: 'stopwatch', timeLeft: 300, isActive: true, elapsed: 300 };
            expect(calculateProgress(state, 300)).toBe(0);
        });

        it('totalDuration が 0 の場合は 0 を返す', () => {
            const state: TimerState = { mode: 'pomodoro', timeLeft: 0, isActive: false, elapsed: 0 };
            expect(calculateProgress(state, 0)).toBe(0);
        });

        it('100% を超えない', () => {
            const state: TimerState = { mode: 'pomodoro', timeLeft: -5, isActive: false, elapsed: 105 };
            expect(calculateProgress(state, 100)).toBe(100);
        });
    });

    describe('formatTime', () => {
        it('0秒を 00:00 に変換する', () => {
            expect(formatTime(0)).toBe('00:00');
        });

        it('65秒を 01:05 に変換する', () => {
            expect(formatTime(65)).toBe('01:05');
        });

        it('1500秒 (25分) を 25:00 に変換する', () => {
            expect(formatTime(1500)).toBe('25:00');
        });

        it('3600秒 (60分) を 60:00 に変換する', () => {
            expect(formatTime(3600)).toBe('60:00');
        });

        it('9秒を 00:09 に変換する', () => {
            expect(formatTime(9)).toBe('00:09');
        });
    });
});
