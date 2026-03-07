"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Square, ArrowLeft, MoreVertical, Timer, Watch, CheckCircle } from "lucide-react";
import { Todo } from "@studytodo/shared";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNotification } from "@/hooks/useNotification";
import { InterstitialAd } from "@/components/ads/InterstitialAd";

interface TimerViewProps {
    todo: Todo;
    onBack: () => void;
    onSaveSession?: (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => void;
    onCompleteTask?: () => void;
}

type TimerMode = "pomodoro" | "countdown" | "stopwatch";
type TimerStatus = "focus" | "break";

/**
 * ポモドーロタイマー画面コンポーネント (拡張版)
 * 
 * 以下の機能を提供します：
 * 1. ポモドーロモード (25分/50分) + 休憩 (5分/10分)
 * 2. カウントダウンモード (任意時間 - 今回はモックとして15分固定)
 * 3. ストップウォッチモード
 * 4. 記録機能 (モック)
 */
export function TimerView({ todo, onBack, onSaveSession, onCompleteTask }: TimerViewProps) {
    // 状態管理
    const [mode, setMode] = useState<TimerMode>("pomodoro");
    const [status, setStatus] = useState<TimerStatus>("focus");

    // ポモドーロ設定 (分)
    const [focusDuration, setFocusDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);

    // カウントダウン設定 (分)
    const [countdownDuration, setCountdownDuration] = useState(15);

    const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
    const [stopwatchTime, setStopwatchTime] = useState(0);

    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Interstitial Ad State
    const [showBreakAd, setShowBreakAd] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const autoStartRef = useRef(false);

    // 通知フック
    const { requestPermission, sendNotification } = useNotification();

    // 初回マウント時に通知許可をリクエスト
    useEffect(() => {
        requestPermission();
    }, [requestPermission]);

    // 経過時間の計算
    const getElapsedTime = useCallback(() => {
        if (mode === "stopwatch") return stopwatchTime;
        const total = mode === "pomodoro"
            ? (status === "focus" ? focusDuration * 60 : breakDuration * 60)
            : countdownDuration * 60;
        return total - timeLeft;
    }, [mode, status, focusDuration, breakDuration, countdownDuration, stopwatchTime, timeLeft]);

    // タイマー終了時の処理
    const handleTimerComplete = useCallback(() => {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);

        // ポモドーロモードで集中時間が終わったら休憩モードへ誘導
        if (mode === "pomodoro" && status === "focus") {
            if (onSaveSession) {
                onSaveSession({
                    todoId: todo.id,
                    todoTitle: todo.title,
                    duration: focusDuration * 60,
                    mode: mode
                });
                setIsSaved(true);
            }
            sendNotification("集中終了！", { body: "お疲れ様でした。休憩に入ります。" });
            setShowBreakAd(true);
            autoStartRef.current = true;
            setStatus("break");
        } else if (mode === "pomodoro" && status === "break") {
            sendNotification("休憩終了！", { body: "次のセッションを始めます。" });
            autoStartRef.current = true;
            setStatus("focus");
        } else if (mode === "countdown") {
            if (onSaveSession) {
                onSaveSession({
                    todoId: todo.id,
                    todoTitle: todo.title,
                    duration: countdownDuration * 60,
                    mode: mode
                });
                setIsSaved(true);
            }
            sendNotification("タイマー終了", { body: "設定した時間が経過しました。" });
        }
    }, [mode, status, sendNotification, focusDuration, countdownDuration, todo, onSaveSession]);

    const resetTimer = useCallback(() => {
        setIsRunning(false);
        setIsPaused(false);
        setStopwatchTime(0);

        if (mode === "pomodoro") {
            if (status === "focus") {
                setTimeLeft(focusDuration * 60);
            } else {
                setTimeLeft(breakDuration * 60);
            }
        } else if (mode === "countdown") {
            setTimeLeft(countdownDuration * 60);
        }
    }, [mode, status, focusDuration, breakDuration, countdownDuration]);

    // モードや設定変更時にタイマーをリセット
    useEffect(() => {
        // Stop reset if we just switched to stopwatch (manually handled in button click)
        // However, standard useEffect logic resets whenever mode changes. 
        // We need to bypass this for the specific transition or update resetTimer to handle data preservation?
        // Actually, the button click handler runs STATE UPDATES (batching might apply).
        // If we set state in button click, then THIS effect runs.
        // resetTimer sets stopwatchTime to 0. This will OVERWRITE our carried over time.

        // Solution: Only call resetTimer if NOT switching to stopwatch (or handle stopwatch reset differently).
        // But we want resetTimer to run when switching BACK to pomodoro.

        if (mode !== "stopwatch") {
            resetTimer();
        }
    }, [mode, focusDuration, breakDuration, countdownDuration, resetTimer]);

    // オート進行: statusが変わりresetTimerが実行された後に自動開始
    useEffect(() => {
        if (autoStartRef.current && mode === "pomodoro" && !isRunning) {
            autoStartRef.current = false;
            // 次のティックで開始（resetTimerのstate更新が反映された後）
            const t = setTimeout(() => {
                setIsRunning(true);
                setIsPaused(false);
                setIsSaved(false);
            }, 100);
            return () => clearTimeout(t);
        }
    }, [status, mode, isRunning]);

    // タイマーロジック
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                if (mode === "stopwatch") {
                    setStopwatchTime((prev) => prev + 1);
                } else {
                    setTimeLeft((prev) => {
                        if (prev <= 1) {
                            handleTimerComplete();
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, mode, handleTimerComplete]);



    // 時間フォーマット (MM:SS)
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    // 円形プログレスバーの計算
    const calculateProgress = () => {
        if (mode === "stopwatch") return 100; // ストップウォッチは常に満タン
        const total = mode === "pomodoro"
            ? (status === "focus" ? focusDuration * 60 : breakDuration * 60)
            : countdownDuration * 60;
        return ((total - timeLeft) / total) * 100;
    };

    const progress = calculateProgress();
    const circumference = 2 * Math.PI * 120;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // テーマカラーの決定
    const getThemeColor = () => {
        if (status === "break") return "text-green-500";
        return "text-blue-600";
    };

    const getBgColor = () => {
        if (status === "break") return "bg-green-50";
        return "bg-blue-50";
    };

    // セッション保存処理
    const handleSaveSession = () => {

        // 簡易的に、ストップウォッチなら経過時間、ポモドーロなら設定時間を保存（完了時）
        // 途中保存の場合は経過時間を計算する必要がある
        // ここでは「記録のみ保存」ボタン用として、現在の経過時間を保存するロジックにする

        let actualDuration = 0;
        if (mode === "stopwatch") {
            actualDuration = stopwatchTime;
        } else {
            // カウントダウン系は「元々の時間 - 残り時間」が経過時間
            const total = mode === "pomodoro"
                ? (status === "focus" ? focusDuration * 60 : breakDuration * 60)
                : countdownDuration * 60;
            actualDuration = total - timeLeft;
        }

        if (actualDuration > 0 && onSaveSession) {
            onSaveSession({
                todoId: todo.id,
                todoTitle: todo.title,
                duration: actualDuration,
                mode: mode
            });
            setIsSaved(true);
            alert("セッションを記録しました！");
        } else {
            alert("記録する時間がありません。");
        }
    };

    // タスク完了処理
    const handleCompleteTask = () => {
        const elapsed = getElapsedTime();
        if (elapsed > 0 && !isSaved && onSaveSession) {
            onSaveSession({
                todoId: todo.id,
                todoTitle: todo.title,
                duration: elapsed,
                mode: mode
            });
        }
        if (onCompleteTask) onCompleteTask();
    };

    // Keyboard Shortcuts
    useKeyboardShortcuts({
        onToggleTimer: () => {
            if (isRunning) {
                setIsRunning(false);
                setIsPaused(true);
            } else {
                setIsRunning(true);
                setIsPaused(false);
            }
        },
        onCloseModal: onBack // Escで戻る
    });

    return (
        <div className={`flex flex-col h-screen transition-colors duration-500 ${getBgColor()}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4">
                <button onClick={onBack} className="p-2 text-gray-500 hover:bg-white/50 rounded-full">
                    <ArrowLeft size={24} />
                </button>

                {/* モード切替タブ */}
                {/* モード切替タブ */}
                <div className="flex bg-white/50 rounded-full p-1">
                    <button
                        onClick={() => {
                            setMode("pomodoro");
                            setStatus("focus");
                            setIsRunning(false);
                            resetTimer();
                        }}
                        className={`p-2 rounded-full transition-colors ${mode === "pomodoro" ? "bg-white shadow-sm text-blue-600" : "text-gray-400"}`}
                    >
                        <Timer size={20} />
                    </button>
                    <button
                        onClick={() => {
                            setMode("countdown");
                            setIsRunning(false);
                            resetTimer();
                        }}
                        className={`p-2 rounded-full transition-colors ${mode === "countdown" ? "bg-white shadow-sm text-blue-600" : "text-gray-400"}`}
                    >
                        <Watch size={20} />
                    </button>
                    <button
                        onClick={() => {
                            if (mode !== "stopwatch") {
                                // Calculate elapsed time to carry over
                                let elapsed = 0;
                                if (mode === "pomodoro" && status === "focus") {
                                    elapsed = focusDuration * 60 - timeLeft;
                                } else if (mode === "countdown") {
                                    elapsed = countdownDuration * 60 - timeLeft;
                                } else {
                                    // if break mode, start from 0
                                    elapsed = 0;
                                }

                                setStopwatchTime(Math.max(0, elapsed));
                                setMode("stopwatch");
                                // Do NOT stop timer, let it continue running if it was
                            }
                        }}
                        className={`p-2 rounded-full transition-colors ${mode === "stopwatch" ? "bg-white shadow-sm text-blue-600" : "text-gray-400"}`}
                    >
                        <Play size={20} className="rotate-90" />
                    </button>
                </div>

                <button className="p-2 text-gray-500 hover:bg-white/50 rounded-full">
                    <MoreVertical size={24} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">

                {/* Task Info */}
                <div className="text-center space-y-2">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide transition-colors ${status === "break" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                        {status === "break" ? "BREAK TIME" : "CURRENT TASK"}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 line-clamp-2">
                        {todo.title}
                    </h1>
                </div>

                {/* Timer Display with embedded controls */}
                <div className="relative flex items-center justify-center">
                    <svg className="transform -rotate-90 w-72 h-72">
                        <circle
                            cx="144"
                            cy="144"
                            r="120"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-white/50"
                        />
                        <circle
                            cx="144"
                            cy="144"
                            r="120"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className={`${getThemeColor()} transition-all duration-1000 ease-linear`}
                        />
                    </svg>

                    <div className="absolute flex flex-col items-center gap-3">
                        <div className="text-6xl font-mono font-bold text-gray-800 tracking-tighter">
                            {mode === "stopwatch" ? formatTime(stopwatchTime) : formatTime(timeLeft)}
                        </div>

                        {/* Play/Pause button inside circle */}
                        <div className="flex items-center gap-3">
                            {!isRunning ? (
                                <button
                                    onClick={() => { setIsRunning(true); setIsPaused(false); }}
                                    className={`flex items-center justify-center w-14 h-14 rounded-full transition-all hover:scale-105 ${status === "break"
                                        ? "bg-green-500/15 text-green-600 hover:bg-green-500/25"
                                        : "bg-blue-600/15 text-blue-600 hover:bg-blue-600/25"
                                        }`}
                                >
                                    <Play size={24} fill="currentColor" className="ml-0.5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setIsRunning(false); setIsPaused(true); }}
                                    className="flex items-center justify-center w-14 h-14 bg-yellow-500/15 text-yellow-600 rounded-full transition-all hover:bg-yellow-500/25 hover:scale-105"
                                >
                                    <Pause size={24} fill="currentColor" />
                                </button>
                            )}

                            {(isRunning || isPaused) && (
                                <button
                                    onClick={resetTimer}
                                    className="flex items-center justify-center w-11 h-11 bg-black/5 text-gray-500 rounded-full transition-all hover:bg-black/10 hover:scale-105"
                                >
                                    <Square size={18} fill="currentColor" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Settings (Pomodoro Only) */}
                {mode === "pomodoro" && !isRunning && !isPaused && (
                    <div className="flex space-x-4">
                        {status === "focus" ? (
                            <>
                                <button
                                    onClick={() => setFocusDuration(25)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${focusDuration === 25 ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}
                                >
                                    25分
                                </button>
                                <button
                                    onClick={() => setFocusDuration(50)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${focusDuration === 50 ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}
                                >
                                    50分
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setBreakDuration(5)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${breakDuration === 5 ? "bg-green-600 text-white" : "bg-white text-gray-500"}`}
                                >
                                    5分
                                </button>
                                <button
                                    onClick={() => setBreakDuration(10)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${breakDuration === 10 ? "bg-green-600 text-white" : "bg-white text-gray-500"}`}
                                >
                                    10分
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Settings (Countdown Only) */}
                {mode === "countdown" && !isRunning && !isPaused && (
                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                        <span className="text-sm font-bold text-gray-500">タイマー時間:</span>
                        <input
                            type="number"
                            min="1"
                            value={countdownDuration}
                            onChange={(e) => setCountdownDuration(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-16 text-center border-b-2 border-blue-100 focus:border-blue-500 outline-none font-bold text-gray-800"
                        />
                        <span className="text-sm font-bold text-gray-500">分</span>
                    </div>
                )}

                {/* Bottom Actions */}
                <div className="flex items-center justify-between w-full px-6">
                    <button
                        onClick={handleSaveSession}
                        className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors py-2"
                    >
                        <CheckCircle size={18} />
                        <span className="text-sm font-medium">記録のみ保存</span>
                    </button>

                    {onCompleteTask && (
                        <button
                            onClick={handleCompleteTask}
                            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-colors font-bold text-sm"
                        >
                            <CheckCircle size={18} />
                            <span>タスク完了</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Interstitial Ad for Break Time */}
            <InterstitialAd
                isOpen={showBreakAd}
                onClose={() => setShowBreakAd(false)}
                message="休憩中 - お疲れ様でした！"
                autoCloseSeconds={10}
            />
        </div>
    );
}

