"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Square, ArrowLeft, MoreVertical, Timer, Watch, CheckCircle, X, RotateCcw } from "lucide-react";
import { Todo, Session } from "@studytodo/shared";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNotification } from "@/hooks/useNotification";
import { InterstitialAd } from "@/components/ads/InterstitialAd";
import { db } from "@/lib/db";

interface TimerViewProps {
    todo: Todo;
    onBack: () => void;
    onSaveSession?: (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => void;
    onCompleteTask?: () => void;
}

type TimerMode = "pomodoro" | "countdown" | "stopwatch";
type TimerStatus = "focus" | "break";

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

    // 設定・ログ UI
    const [autoProgress, setAutoProgress] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [showSessionLog, setShowSessionLog] = useState(false);
    const [sessionLog, setSessionLog] = useState<Session[]>([]);

    // Interstitial Ad State
    const [showBreakAd, setShowBreakAd] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const autoStartRef = useRef(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // 壁時計ベースのタイマー用ref
    const startTimeRef = useRef<number>(0);       // タイマー開始時のDate.now()
    const pausedElapsedRef = useRef<number>(0);    // 一時停止時までの累計経過秒数

    // 通知フック
    const { requestPermission, sendNotification } = useNotification();

    useEffect(() => {
        requestPermission();
    }, [requestPermission]);

    // メニュー外クリックで閉じる
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showMenu]);

    // セッションログ取得
    const fetchSessionLog = useCallback(async () => {
        try {
            const all = await db.sessions.orderBy("createdAt").reverse().toArray();
            setSessionLog(all.filter(s => s.todoId === todo.id));
        } catch (e) {
            console.error("Failed to fetch sessions:", e);
        }
    }, [todo.id]);

    useEffect(() => { fetchSessionLog(); }, [fetchSessionLog]);

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
        pausedElapsedRef.current = 0;
        if (timerRef.current) clearInterval(timerRef.current);

        if (mode === "pomodoro" && status === "focus") {
            if (onSaveSession) {
                onSaveSession({
                    todoId: todo.id,
                    todoTitle: todo.title,
                    duration: focusDuration * 60,
                    mode: mode
                });
                setIsSaved(true);
                fetchSessionLog();
            }
            sendNotification("集中終了！", { body: "お疲れ様でした。休憩に入ります。" });
            setShowBreakAd(true);
            if (autoProgress) autoStartRef.current = true;
            setStatus("break");
        } else if (mode === "pomodoro" && status === "break") {
            sendNotification("休憩終了！", { body: "次のセッションを始めます。" });
            if (autoProgress) autoStartRef.current = true;
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
                fetchSessionLog();
            }
            sendNotification("タイマー終了", { body: "設定した時間が経過しました。" });
        }
    }, [mode, status, sendNotification, focusDuration, countdownDuration, todo, onSaveSession, autoProgress, fetchSessionLog]);

    const resetTimer = useCallback(() => {
        setIsRunning(false);
        setIsPaused(false);
        setStopwatchTime(0);
        pausedElapsedRef.current = 0;

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

    useEffect(() => {
        if (mode !== "stopwatch") resetTimer();
    }, [mode, focusDuration, breakDuration, countdownDuration, resetTimer]);

    // オート進行
    useEffect(() => {
        if (autoStartRef.current && mode === "pomodoro" && !isRunning) {
            autoStartRef.current = false;
            const t = setTimeout(() => {
                pausedElapsedRef.current = 0;
                setIsRunning(true);
                setIsPaused(false);
                setIsSaved(false);
            }, 100);
            return () => clearTimeout(t);
        }
    }, [status, mode, isRunning]);

    // タイマーロジック（壁時計ベース: ブラウザ最小化・スリープに対応）
    useEffect(() => {
        if (isRunning) {
            // 開始時刻を記録（一時停止から再開の場合はpausedElapsedRefが累計を保持）
            startTimeRef.current = Date.now();

            const tick = () => {
                const nowElapsed = pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);

                if (mode === "stopwatch") {
                    setStopwatchTime(nowElapsed);
                } else {
                    const total = mode === "pomodoro"
                        ? (status === "focus" ? focusDuration * 60 : breakDuration * 60)
                        : countdownDuration * 60;
                    const remaining = total - nowElapsed;
                    if (remaining <= 0) {
                        setTimeLeft(0);
                        handleTimerComplete();
                        return;
                    }
                    setTimeLeft(remaining);
                }
            };

            tick(); // 即座に1回実行
            timerRef.current = setInterval(tick, 1000);

            // タブが非アクティブ→再アクティブになった時に即座に再計算
            const handleVisibility = () => {
                if (document.visibilityState === "visible") tick();
            };
            document.addEventListener("visibilitychange", handleVisibility);

            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
                document.removeEventListener("visibilitychange", handleVisibility);
            };
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRunning, mode, status, handleTimerComplete, focusDuration, breakDuration, countdownDuration]);

    // ヘルパー
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const calculateProgress = () => {
        if (mode === "stopwatch") return 100;
        const total = mode === "pomodoro"
            ? (status === "focus" ? focusDuration * 60 : breakDuration * 60)
            : countdownDuration * 60;
        return ((total - timeLeft) / total) * 100;
    };

    const progress = calculateProgress();
    const circumference = 2 * Math.PI * 120;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const getThemeColor = () => status === "break" ? "text-green-500" : "text-[var(--accent-primary)]";
    const getBgColor = () => status === "break" ? "bg-green-50 dark:bg-green-950/30" : "bg-[var(--background)]";

    const handleSaveSession = () => {
        let actualDuration = 0;
        if (mode === "stopwatch") {
            actualDuration = stopwatchTime;
        } else {
            const total = mode === "pomodoro"
                ? (status === "focus" ? focusDuration * 60 : breakDuration * 60)
                : countdownDuration * 60;
            actualDuration = total - timeLeft;
        }

        if (actualDuration > 0 && onSaveSession) {
            onSaveSession({ todoId: todo.id, todoTitle: todo.title, duration: actualDuration, mode });
            setIsSaved(true);
            fetchSessionLog();
        }
    };

    const handleCompleteTask = () => {
        const elapsed = getElapsedTime();
        if (elapsed > 0 && !isSaved && onSaveSession) {
            onSaveSession({ todoId: todo.id, todoTitle: todo.title, duration: elapsed, mode });
        }
        if (onCompleteTask) onCompleteTask();
    };

    // Keyboard Shortcuts
    useKeyboardShortcuts({
        onToggleTimer: () => {
            if (isRunning) {
                // 一時停止: 経過時間を累計保存
                pausedElapsedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
                setIsRunning(false); setIsPaused(true);
            }
            else {
                // 再開: pausedElapsedRefは保持、startTimeRefはuseEffect内で更新される
                setIsRunning(true); setIsPaused(false);
            }
        },
        onCloseModal: onBack
    });

    return (
        <div className={`flex flex-col h-screen transition-colors duration-500 ${getBgColor()}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4">
                <button onClick={onBack} className="p-2 rounded-full" style={{ color: "var(--text-muted)" }}>
                    <ArrowLeft size={24} />
                </button>

                {/* モード切替タブ */}
                <div className="flex rounded-full p-1" style={{ backgroundColor: "color-mix(in srgb, var(--button-bg) 70%, transparent)" }}>
                    <button
                        onClick={() => { setMode("pomodoro"); setStatus("focus"); setIsRunning(false); resetTimer(); }}
                        className={`p-2 rounded-full transition-colors ${mode === "pomodoro" ? "shadow-sm" : ""}`}
                        style={mode === "pomodoro" ? { backgroundColor: "var(--card-bg)", color: "var(--accent-primary)" } : { color: "var(--text-muted)" }}
                    >
                        <Timer size={20} />
                    </button>
                    <button
                        onClick={() => { setMode("countdown"); setIsRunning(false); resetTimer(); }}
                        className={`p-2 rounded-full transition-colors ${mode === "countdown" ? "shadow-sm" : ""}`}
                        style={mode === "countdown" ? { backgroundColor: "var(--card-bg)", color: "var(--accent-primary)" } : { color: "var(--text-muted)" }}
                    >
                        <Watch size={20} />
                    </button>
                    <button
                        onClick={() => {
                            if (mode !== "stopwatch") {
                                let elapsed = 0;
                                if (mode === "pomodoro" && status === "focus") elapsed = focusDuration * 60 - timeLeft;
                                else if (mode === "countdown") elapsed = countdownDuration * 60 - timeLeft;
                                setStopwatchTime(Math.max(0, elapsed));
                                setMode("stopwatch");
                            }
                        }}
                        className={`p-2 rounded-full transition-colors ${mode === "stopwatch" ? "shadow-sm" : ""}`}
                        style={mode === "stopwatch" ? { backgroundColor: "var(--card-bg)", color: "var(--accent-primary)" } : { color: "var(--text-muted)" }}
                    >
                        <Play size={20} className="rotate-90" />
                    </button>
                </div>

                {/* メニューボタン */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-full"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <MoreVertical size={24} />
                    </button>

                    {/* ドロップダウンメニュー */}
                    {showMenu && (
                        <div className="absolute end-0 top-12 w-56 rounded-xl shadow-xl py-2 z-50" style={{ backgroundColor: "var(--modal-bg)", borderColor: "var(--border-color)", borderWidth: "1px" }}>
                            <button
                                onClick={() => { setAutoProgress(!autoProgress); }}
                                className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:opacity-80"
                            >
                                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>オート進行</span>
                                <div className={`w-10 h-6 rounded-full transition-colors relative`} style={{ backgroundColor: autoProgress ? "var(--accent-primary)" : "var(--button-bg)" }}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${autoProgress ? "translate-x-5" : "translate-x-1"}`} />
                                </div>
                            </button>
                            <div className="h-px mx-2" style={{ backgroundColor: "var(--border-color)" }} />
                            <button
                                onClick={() => { fetchSessionLog(); setShowSessionLog(true); setShowMenu(false); }}
                                className="w-full flex items-center px-4 py-3 transition-colors hover:opacity-80"
                            >
                                <RotateCcw size={16} className="me-3" style={{ color: "var(--text-muted)" }} />
                                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>記録ログ</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">

                {/* Task Info */}
                <div className="text-center space-y-2">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide transition-colors ${status === "break" ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400" : ""}`}
                        style={status !== "break" ? { backgroundColor: "var(--accent-secondary)", color: "var(--accent-primary)" } : undefined}>
                        {status === "break" ? "BREAK TIME" : "CURRENT TASK"}
                    </div>
                    <h1 className="text-2xl font-bold line-clamp-2" style={{ color: "var(--text-primary)" }}>
                        {todo.title}
                    </h1>
                </div>

                {/* Timer Display with embedded controls */}
                <div className="relative flex items-center justify-center">
                    <svg className="transform -rotate-90 w-72 h-72">
                        <circle cx="144" cy="144" r="120" stroke="var(--border-color)" strokeWidth="12" fill="transparent" style={{ opacity: 0.5 }} />
                        <circle cx="144" cy="144" r="120" stroke="currentColor" strokeWidth="12" fill="transparent"
                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                            className={`${getThemeColor()} transition-all duration-1000 ease-linear`}
                        />
                    </svg>

                    <div className="absolute flex flex-col items-center gap-3">
                        <div className="text-6xl font-mono font-bold tracking-tighter" style={{ color: "var(--text-primary)" }}>
                            {mode === "stopwatch" ? formatTime(stopwatchTime) : formatTime(timeLeft)}
                        </div>

                        {/* Play/Pause button inside circle */}
                        <div className="flex items-center gap-3">
                            {!isRunning ? (
                                <button
                                    onClick={() => { if (!isPaused) pausedElapsedRef.current = 0; setIsRunning(true); setIsPaused(false); }}
                                    className={`flex items-center justify-center w-14 h-14 rounded-full transition-all hover:scale-105 ${status === "break"
                                        ? "bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25"
                                        : ""
                                        }`}
                                    style={status !== "break" ? { backgroundColor: "color-mix(in srgb, var(--accent-primary) 15%, transparent)", color: "var(--accent-primary)" } : undefined}
                                >
                                    <Play size={24} fill="currentColor" className="ms-0.5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        pausedElapsedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
                                        setIsRunning(false); setIsPaused(true);
                                    }}
                                    className="flex items-center justify-center w-14 h-14 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 rounded-full transition-all hover:bg-yellow-500/25 hover:scale-105"
                                >
                                    <Pause size={24} fill="currentColor" />
                                </button>
                            )}

                            {(isRunning || isPaused) && (
                                <button
                                    onClick={resetTimer}
                                    className="flex items-center justify-center w-11 h-11 rounded-full transition-all hover:scale-105"
                                    style={{ backgroundColor: "color-mix(in srgb, var(--button-bg) 60%, transparent)", color: "var(--text-muted)" }}
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
                                <button onClick={() => setFocusDuration(25)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${focusDuration === 25 ? "text-white" : ""}`}
                                    style={focusDuration === 25 ? { backgroundColor: "var(--accent-primary)" } : { backgroundColor: "var(--card-bg)", color: "var(--text-secondary)" }}>
                                    25分
                                </button>
                                <button onClick={() => setFocusDuration(50)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${focusDuration === 50 ? "text-white" : ""}`}
                                    style={focusDuration === 50 ? { backgroundColor: "var(--accent-primary)" } : { backgroundColor: "var(--card-bg)", color: "var(--text-secondary)" }}>
                                    50分
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setBreakDuration(5)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${breakDuration === 5 ? "bg-green-600 text-white" : ""}`}
                                    style={breakDuration !== 5 ? { backgroundColor: "var(--card-bg)", color: "var(--text-secondary)" } : undefined}>
                                    5分
                                </button>
                                <button onClick={() => setBreakDuration(10)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${breakDuration === 10 ? "bg-green-600 text-white" : ""}`}
                                    style={breakDuration !== 10 ? { backgroundColor: "var(--card-bg)", color: "var(--text-secondary)" } : undefined}>
                                    10分
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Settings (Countdown Only) */}
                {mode === "countdown" && !isRunning && !isPaused && (
                    <div className="flex items-center space-x-2 px-4 py-2 rounded-lg shadow-sm" style={{ backgroundColor: "var(--card-bg)" }}>
                        <span className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>タイマー時間:</span>
                        <input type="number" min="1" value={countdownDuration}
                            onChange={(e) => setCountdownDuration(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-16 text-center border-b-2 focus:border-[var(--accent-primary)] outline-none font-bold bg-transparent"
                            style={{ borderColor: "var(--input-border)", color: "var(--text-primary)" }} />
                        <span className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>分</span>
                    </div>
                )}

                {/* Bottom Actions */}
                <div className="flex items-center justify-between w-full px-6">
                    <button onClick={handleSaveSession}
                        className="flex items-center space-x-2 transition-colors py-2 hover:opacity-70"
                        style={{ color: "var(--text-muted)" }}>
                        <CheckCircle size={18} />
                        <span className="text-sm font-medium">記録のみ保存</span>
                    </button>

                    {onCompleteTask && (
                        <button onClick={handleCompleteTask}
                            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-colors font-bold text-sm">
                            <CheckCircle size={18} />
                            <span>タスク完了</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Session Log Modal */}
            {showSessionLog && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowSessionLog(false)}>
                    <div className="rounded-t-2xl w-full max-w-lg max-h-[60vh] p-5 animate-slide-up" style={{ backgroundColor: "var(--modal-bg)" }} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>記録ログ</h3>
                            <button onClick={() => setShowSessionLog(false)} className="p-1 hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[300px]">
                            {sessionLog.length === 0 ? (
                                <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>まだ記録がありません</p>
                            ) : (
                                sessionLog.map((s) => {
                                    const d = new Date(s.createdAt);
                                    const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                                    const min = Math.floor(s.duration / 60);
                                    const sec = s.duration % 60;
                                    const modeLabel = s.mode === 'pomodoro' ? '🍅' : s.mode === 'countdown' ? '⏱' : '⏱️';
                                    return (
                                        <div key={s.id} className="flex items-center py-3 gap-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
                                            <span className="text-xl">{modeLabel}</span>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{min}分{sec > 0 ? `${sec}秒` : ''}</p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{dateStr}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        {sessionLog.length > 0 && (
                            <div className="pt-3 text-center" style={{ borderTop: "1px solid var(--border-color)" }}>
                                <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                                    合計: {Math.floor(sessionLog.reduce((sum, s) => sum + s.duration, 0) / 60)}分
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
