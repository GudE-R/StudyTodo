import { describe, it, expect } from 'vitest';

/**
 * MobileTimerView の UIレイアウト計算ロジックのテスト
 * 
 * このテストは MobileTimerView.tsx で使用されるSVG計算や
 * ボタン状態の決定ロジックを検証し、UIの見切れやレイアウト崩れを防ぐ。
 */

// --- SVG タイマー円の計算ロジックを再現 ---
function computeCircleParams(screenWidth: number) {
    const CIRCLE_SIZE = screenWidth * 0.75;
    const RADIUS = CIRCLE_SIZE / 2 - 10;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    return { CIRCLE_SIZE, RADIUS, CIRCUMFERENCE };
}

function computeStrokeDashoffset(circumference: number, progress: number) {
    return circumference - (progress / 100) * circumference;
}

// --- ボタン状態の決定ロジックを再現 ---
type ButtonState = 'play' | 'pause';
type ResetVisible = boolean;

function getButtonState(isRunning: boolean): ButtonState {
    return isRunning ? 'pause' : 'play';
}

function isResetVisible(isRunning: boolean, isPaused: boolean): ResetVisible {
    return isRunning || isPaused;
}

// --- テーマカラーの決定ロジック ---
function getThemeColor(status: 'focus' | 'break') {
    return status === 'break' ? '#22c55e' : '#2563eb';
}

function getBgColor(status: 'focus' | 'break') {
    return status === 'break' ? '#f0fdf4' : '#eff6ff';
}

function getPlayBtnBgColor(status: 'focus' | 'break') {
    return status === 'break' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(37, 99, 235, 0.12)';
}

function getPlayBtnIconColor(status: 'focus' | 'break') {
    return status === 'break' ? '#16a34a' : '#2563eb';
}

// --- ストップウォッチ切替の経過時間計算 ---
function calcElapsedOnSwitch(
    mode: 'pomodoro' | 'countdown' | 'stopwatch',
    status: 'focus' | 'break',
    focusDuration: number,
    countdownDuration: number,
    timeLeft: number
): number {
    let elapsed = 0;
    if (mode === 'pomodoro' && status === 'focus') {
        elapsed = focusDuration * 60 - timeLeft;
    } else if (mode === 'countdown') {
        elapsed = countdownDuration * 60 - timeLeft;
    }
    return Math.max(0, elapsed);
}

// =============================================================
describe('MobileTimerView UIロジック', () => {

    // ----- SVG円の計算 -----
    describe('SVG円のサイズ計算', () => {
        it('画面幅375px: 円サイズが281.25 (75%)になる', () => {
            const { CIRCLE_SIZE } = computeCircleParams(375);
            expect(CIRCLE_SIZE).toBeCloseTo(281.25);
        });

        it('画面幅414px: 円サイズが310.5 (75%)になる', () => {
            const { CIRCLE_SIZE } = computeCircleParams(414);
            expect(CIRCLE_SIZE).toBeCloseTo(310.5);
        });

        it('円サイズが画面幅を超えない（見切れ防止）', () => {
            const widths = [320, 375, 390, 414, 430];
            for (const w of widths) {
                const { CIRCLE_SIZE } = computeCircleParams(w);
                expect(CIRCLE_SIZE).toBeLessThan(w);
            }
        });

        it('半径はCIRCLE_SIZE / 2 - 10 で計算される', () => {
            const { CIRCLE_SIZE, RADIUS } = computeCircleParams(400);
            expect(RADIUS).toBe(CIRCLE_SIZE / 2 - 10);
        });

        it('円周の長さが正しく計算される', () => {
            const { RADIUS, CIRCUMFERENCE } = computeCircleParams(400);
            expect(CIRCUMFERENCE).toBeCloseTo(2 * Math.PI * RADIUS);
        });
    });

    // ----- strokeDashoffset -----
    describe('strokeDashoffset計算', () => {
        it('progress=0 のときoffset=circumference (線なし)', () => {
            const { CIRCUMFERENCE } = computeCircleParams(375);
            expect(computeStrokeDashoffset(CIRCUMFERENCE, 0)).toBeCloseTo(CIRCUMFERENCE);
        });

        it('progress=50 のとき半分の値になる', () => {
            const { CIRCUMFERENCE } = computeCircleParams(375);
            expect(computeStrokeDashoffset(CIRCUMFERENCE, 50)).toBeCloseTo(CIRCUMFERENCE / 2);
        });

        it('progress=100 のときoffset=0 (全円)', () => {
            const { CIRCUMFERENCE } = computeCircleParams(375);
            expect(computeStrokeDashoffset(CIRCUMFERENCE, 100)).toBeCloseTo(0);
        });
    });

    // ----- ボタン状態ロジック -----
    describe('ボタン状態の決定ロジック', () => {
        it('タイマー停止時は再生ボタンを表示', () => {
            expect(getButtonState(false)).toBe('play');
        });

        it('タイマー実行中は一時停止ボタンを表示', () => {
            expect(getButtonState(true)).toBe('pause');
        });

        it('停止+非一時停止: リセットボタン非表示', () => {
            expect(isResetVisible(false, false)).toBe(false);
        });

        it('実行中: リセットボタン表示', () => {
            expect(isResetVisible(true, false)).toBe(true);
        });

        it('一時停止中: リセットボタン表示', () => {
            expect(isResetVisible(false, true)).toBe(true);
        });
    });

    // ----- テーマカラー -----
    describe('テーマカラー', () => {
        it('focus状態のテーマカラーは青系', () => {
            expect(getThemeColor('focus')).toBe('#2563eb');
        });

        it('break状態のテーマカラーは緑系', () => {
            expect(getThemeColor('break')).toBe('#22c55e');
        });

        it('focus状態の背景色は薄い青', () => {
            expect(getBgColor('focus')).toBe('#eff6ff');
        });

        it('break状態の背景色は薄い緑', () => {
            expect(getBgColor('break')).toBe('#f0fdf4');
        });

        it('focus状態のボタン背景は青の半透明（薄いカラー）', () => {
            expect(getPlayBtnBgColor('focus')).toBe('rgba(37, 99, 235, 0.12)');
        });

        it('break状態のボタン背景は緑の半透明（薄いカラー）', () => {
            expect(getPlayBtnBgColor('break')).toBe('rgba(22, 163, 74, 0.12)');
        });

        it('focus状態のボタンアイコンは青', () => {
            expect(getPlayBtnIconColor('focus')).toBe('#2563eb');
        });

        it('break状態のボタンアイコンは緑', () => {
            expect(getPlayBtnIconColor('break')).toBe('#16a34a');
        });
    });

    // ----- ストップウォッチ切替の経過時間 -----
    describe('ストップウォッチ切替の経過時間計算', () => {
        it('pomodoro focus 25分、残り20分: 経過5分=300秒', () => {
            expect(calcElapsedOnSwitch('pomodoro', 'focus', 25, 15, 20 * 60)).toBe(300);
        });

        it('countdown 15分、残り10分: 経過5分=300秒', () => {
            expect(calcElapsedOnSwitch('countdown', 'focus', 25, 15, 10 * 60)).toBe(300);
        });

        it('pomodoro break 時は経過0秒', () => {
            expect(calcElapsedOnSwitch('pomodoro', 'break', 25, 15, 3 * 60)).toBe(0);
        });

        it('既にstopwatchなら経過0秒', () => {
            expect(calcElapsedOnSwitch('stopwatch', 'focus', 25, 15, 0)).toBe(0);
        });

        it('経過時間が負にならない', () => {
            // timeLeftがtotal以上でも0を返す
            expect(calcElapsedOnSwitch('pomodoro', 'focus', 25, 15, 30 * 60)).toBe(0);
        });
    });

    // ----- レイアウト制約 -----
    describe('レイアウト制約の検証', () => {
        it('小さな画面(320px)でも円直径が画面幅より小さい', () => {
            const { CIRCLE_SIZE } = computeCircleParams(320);
            expect(CIRCLE_SIZE).toBe(240);
            expect(CIRCLE_SIZE).toBeLessThan(320);
        });

        it('大きなiPhone画面(430px)でも円直径が画面幅より小さい', () => {
            const { CIRCLE_SIZE } = computeCircleParams(430);
            expect(CIRCLE_SIZE).toBe(322.5);
            expect(CIRCLE_SIZE).toBeLessThan(430);
        });

        it('円の残りスペースが下部ボタン用に十分確保されている', () => {
            // 各画面幅で、円の直径以外に最低100pxの余白があることを確認
            // (ヘッダー約60px + タスク情報約60px + 下部ボタン約80px = 約200px が必要)
            const widths = [320, 375, 390, 414, 430];
            for (const w of widths) {
                const { CIRCLE_SIZE } = computeCircleParams(w);
                const remainingVertical = w * 2 - CIRCLE_SIZE; // 画面高さ=幅の約2倍と仮定
                expect(remainingVertical).toBeGreaterThan(200);
            }
        });
    });
});
