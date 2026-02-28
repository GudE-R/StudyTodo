/**
 * タイマーコアロジック（純粋関数）
 * React Hookに依存せず、テスト可能な計算ロジックを提供
 */

export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch';

export interface TimerState {
    mode: TimerMode;
    timeLeft: number;
    isActive: boolean;
    elapsed: number;
}

export interface TickResult {
    timeLeft: number;
    elapsed: number;
    isActive: boolean;
    completed: boolean;
}

/**
 * 1秒ごとのtick処理
 * @returns 更新後の状態と完了フラグ
 */
export function tick(state: TimerState): TickResult {
    if (!state.isActive) {
        return {
            timeLeft: state.timeLeft,
            elapsed: state.elapsed,
            isActive: state.isActive,
            completed: false,
        };
    }

    if (state.mode === 'stopwatch') {
        return {
            timeLeft: state.timeLeft + 1,
            elapsed: state.elapsed + 1,
            isActive: true,
            completed: false,
        };
    }

    // countdown / pomodoro
    if (state.timeLeft <= 1) {
        return {
            timeLeft: 0,
            elapsed: state.elapsed + 1,
            isActive: false,
            completed: true,
        };
    }

    return {
        timeLeft: state.timeLeft - 1,
        elapsed: state.elapsed + 1,
        isActive: true,
        completed: false,
    };
}

/**
 * タイマーリセット
 */
export function resetTimerState(mode: TimerMode, duration: number): TimerState {
    return {
        mode,
        timeLeft: mode === 'stopwatch' ? 0 : duration,
        isActive: false,
        elapsed: 0,
    };
}

/**
 * 初期状態の生成
 */
export function createInitialState(
    mode: TimerMode = 'pomodoro',
    duration: number = 1500
): TimerState {
    return {
        mode,
        timeLeft: duration,
        isActive: false,
        elapsed: 0,
    };
}

/**
 * 進捗率の計算 (0-100)
 */
export function calculateProgress(state: TimerState, totalDuration: number): number {
    if (state.mode === 'stopwatch') {
        return 0; // ストップウォッチでは進捗なし
    }
    if (totalDuration <= 0) return 0;
    const progress = ((totalDuration - state.timeLeft) / totalDuration) * 100;
    return Math.min(100, Math.max(0, progress));
}

/**
 * 時間のフォーマット (mm:ss)
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
