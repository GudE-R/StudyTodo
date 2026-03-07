import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { Todo, Session } from '@studytodo/shared';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useRepository } from '../providers/RepositoryProvider';

type TimerMode = "pomodoro" | "countdown" | "stopwatch";
type TimerStatus = "focus" | "break";

interface UseMobileTimerProps {
    todo: Todo;
    onBack: () => void;
    onSaveSession?: (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => void;
    onCompleteTask?: () => void;
}

export function useMobileTimer({ todo, onBack, onSaveSession, onCompleteTask }: UseMobileTimerProps) {
    const repository = useRepository();

    // State
    const [mode, setMode] = useState<TimerMode>("pomodoro");
    const [status, setStatus] = useState<TimerStatus>("focus");

    // Settings (Minutes)
    const [focusDuration, setFocusDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);
    const [countdownDuration, setCountdownDuration] = useState(15);

    const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
    const [stopwatchTime, setStopwatchTime] = useState(0);

    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showSessionLog, setShowSessionLog] = useState(false);
    const [sessionLog, setSessionLog] = useState<Session[]>([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const autoStartRef = useRef(false);

    // Keep screen awake
    useEffect(() => {
        if (isRunning) {
            activateKeepAwakeAsync('timer');
        } else {
            deactivateKeepAwake('timer');
        }
        return () => { deactivateKeepAwake('timer'); };
    }, [isRunning]);

    // Fetch session log
    const fetchSessionLog = useCallback(async () => {
        try {
            const all = await repository.getSessions();
            const filtered = all
                .filter(s => s.todoId === todo.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setSessionLog(filtered);
        } catch (e) {
            console.error('Failed to fetch sessions:', e);
        }
    }, [repository, todo.id]);

    useEffect(() => {
        fetchSessionLog();
    }, [fetchSessionLog]);

    // Reset on mode/status change
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

    useEffect(() => {
        if (mode !== "stopwatch") {
            resetTimer();
        }
    }, [resetTimer, mode]);

    // オート進行: statusが変わりresetTimerが実行された後に自動開始
    useEffect(() => {
        if (autoStartRef.current && mode === "pomodoro" && !isRunning) {
            autoStartRef.current = false;
            const t = setTimeout(() => {
                setIsRunning(true);
                setIsPaused(false);
                setIsSaved(false);
            }, 100);
            return () => clearTimeout(t);
        }
    }, [status, mode, isRunning]);

    // Timer complete handler (declared before timer logic so it can be referenced)
    const handleTimerComplete = useCallback(() => {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);

        if (mode === "pomodoro") {
            if (status === "focus") {
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
                // オート進行: 即座に休憩に切り替え、自動開始
                autoStartRef.current = true;
                setStatus("break");
            } else {
                // オート進行: 即座に集中に切り替え、自動開始
                autoStartRef.current = true;
                setStatus("focus");
            }
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
            Alert.alert("タイマー終了", `${countdownDuration}分の記録を保存しました。`);
        }
    }, [mode, status, focusDuration, countdownDuration, todo, onSaveSession, fetchSessionLog]);

    // Timer logic
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

    // Helpers
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

    const getThemeColor = () => status === "break" ? "#22c55e" : "#2563eb";
    const getBgColor = () => status === "break" ? "#f0fdf4" : "#eff6ff";

    const getElapsedTime = () => {
        if (mode === "stopwatch") return stopwatchTime;
        const total = mode === "pomodoro"
            ? (status === "focus" ? focusDuration * 60 : breakDuration * 60)
            : countdownDuration * 60;
        return total - timeLeft;
    };

    const handleSave = () => {
        const actualDuration = getElapsedTime();
        if (actualDuration > 0 && onSaveSession) {
            onSaveSession({
                todoId: todo.id,
                todoTitle: todo.title,
                duration: actualDuration,
                mode: mode
            });
            setIsSaved(true);
            fetchSessionLog();
            Alert.alert("保存完了", "記録を保存しました。");
        } else {
            Alert.alert("情報", "記録する時間がありません。");
        }
    };

    const handleBack = () => {
        const elapsed = getElapsedTime();
        if (elapsed > 0 && !isSaved) {
            Alert.alert(
                "未保存の記録",
                `${Math.floor(elapsed / 60)}分${elapsed % 60}秒の記録があります。保存しますか？`,
                [
                    { text: "破棄", style: "destructive", onPress: onBack },
                    {
                        text: "保存して戻る", onPress: () => {
                            if (onSaveSession) {
                                onSaveSession({
                                    todoId: todo.id,
                                    todoTitle: todo.title,
                                    duration: elapsed,
                                    mode: mode
                                });
                            }
                            onBack();
                        }
                    },
                ]
            );
        } else {
            onBack();
        }
    };

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

    const switchToStopwatch = () => {
        if (mode !== "stopwatch") {
            let elapsed = 0;
            if (mode === "pomodoro" && status === "focus") {
                elapsed = focusDuration * 60 - timeLeft;
            } else if (mode === "countdown") {
                elapsed = countdownDuration * 60 - timeLeft;
            }
            setStopwatchTime(Math.max(0, elapsed));
            setMode("stopwatch");
        }
    };

    return {
        // Timer state
        mode, setMode,
        status, setStatus,
        timeLeft, stopwatchTime,
        isRunning, setIsRunning,
        isPaused, setIsPaused,
        isSaved,
        showSessionLog, setShowSessionLog,
        sessionLog,

        // Settings
        focusDuration, setFocusDuration,
        breakDuration, setBreakDuration,
        countdownDuration, setCountdownDuration,

        // Computed
        progress: calculateProgress(),
        themeColor: getThemeColor(),
        bgColor: getBgColor(),

        // Functions
        formatTime,
        resetTimer,
        handleSave,
        handleBack,
        handleCompleteTask,
        switchToStopwatch,
        fetchSessionLog,
    };
}
