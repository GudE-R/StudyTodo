"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Square, ArrowLeft, MoreVertical, Timer, Watch, CheckCircle } from "lucide-react";
import { Todo } from "@/types";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNotification } from "@/hooks/useNotification";

interface TimerViewProps {
    todo: Todo;
    onBack: () => void;
    onSaveSession?: (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => void;
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
export function TimerView({ todo, onBack, onSaveSession }: TimerViewProps) {
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

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 通知フック
    const { requestPermission, sendNotification } = useNotification();

    // 初回マウント時に通知許可をリクエスト
    useEffect(() => {
        requestPermission();
    }, [requestPermission]);

    // タイマー終了時の処理
    const handleTimerComplete = useCallback(() => {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);

        // ポモドーロモードで集中時間が終わったら休憩モードへ誘導
        if (mode === "pomodoro" && status === "focus") {
            // 音声通知などもここで行う
            sendNotification("集中終了！", { body: "お疲れ様でした。休憩しましょう。" });
            alert("お疲れ様でした！休憩しましょう。");
            setStatus("break");
        } else if (mode === "pomodoro" && status === "break") {
            sendNotification("休憩終了！", { body: "次のセッションを始めましょう。" });
            alert("休憩終了です！作業に戻りましょう。");
            setStatus("focus");
        } else if (mode === "countdown") {
            sendNotification("タイマー終了", { body: "設定した時間が経過しました。" });
            alert("タイマー終了です！");
        }
    }, [mode, status, sendNotification]);

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        resetTimer();
    }, [resetTimer]);

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
            alert("セッションを記録しました！");
            // 保存後はリセットするか、そのまま続けるかは要件次第だが、ここではリセットしない
        } else {
            alert("記録する時間がありません。");
        }
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
                <div className="flex bg-white/50 rounded-full p-1">
                    <button
                        onClick={() => { setMode("pomodoro"); setStatus("focus"); }}
                        className={`p-2 rounded-full transition-colors ${mode === "pomodoro" ? "bg-white shadow-sm text-blue-600" : "text-gray-400"}`}
                    >
                        <Timer size={20} />
                    </button>
                    <button
                        onClick={() => setMode("countdown")}
                        className={`p-2 rounded-full transition-colors ${mode === "countdown" ? "bg-white shadow-sm text-blue-600" : "text-gray-400"}`}
                    >
                        <Watch size={20} />
                    </button>
                    <button
                        onClick={() => setMode("stopwatch")}
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

                {/* Timer Display */}
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

                    <div className="absolute text-6xl font-mono font-bold text-gray-800 tracking-tighter">
                        {mode === "stopwatch" ? formatTime(stopwatchTime) : formatTime(timeLeft)}
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

                {/* Controls */}
                <div className="flex items-center space-x-6">
                    {!isRunning ? (
                        <button
                            onClick={() => { setIsRunning(true); setIsPaused(false); }}
                            className={`flex items-center justify-center w-20 h-20 text-white rounded-full shadow-xl hover:scale-105 transition-all ${status === "break" ? "bg-green-500 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                            <Play size={32} fill="currentColor" className="ml-1" />
                        </button>
                    ) : (
                        <button
                            onClick={() => { setIsRunning(false); setIsPaused(true); }}
                            className="flex items-center justify-center w-20 h-20 bg-yellow-500 text-white rounded-full shadow-xl hover:bg-yellow-600 hover:scale-105 transition-all"
                        >
                            <Pause size={32} fill="currentColor" />
                        </button>
                    )}

                    {(isRunning || isPaused) && (
                        <button
                            onClick={resetTimer}
                            className="flex items-center justify-center w-16 h-16 bg-white text-gray-600 rounded-full shadow-md hover:bg-gray-50 transition-all"
                        >
                            <Square size={24} fill="currentColor" />
                        </button>
                    )}
                </div>

                {/* Record Button */}
                <button
                    onClick={handleSaveSession}
                    className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">記録のみ保存</span>
                </button>
            </div>
        </div>
    );
}

