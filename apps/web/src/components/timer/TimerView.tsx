"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Square, ArrowLeft, MoreVertical, Timer, Watch, CheckCircle } from "lucide-react";
import { Todo } from "@pomarc/shared";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNotification } from "@/hooks/useNotification";

interface TimerViewProps {
    todo?: Todo;
    onBack?: () => void;
    onSaveSession?: (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => void;
}

type TimerMode = "pomodoro" | "countdown" | "stopwatch";
type TimerStatus = "focus" | "break";

/**
 * Pomodoro Timer Component (Extended)
 * 
 * Features:
 * 1. Pomodoro Mode (25min/50min) + Break (5min/10min)
 * 2. Countdown Mode (Custom time - default 15min)
 * 3. Stopwatch Mode
 * 4. Record Only (Mock)
 */
export function TimerView({ todo, onBack, onSaveSession }: TimerViewProps) {
    // State Management
    const [mode, setMode] = useState<TimerMode>("pomodoro");
    const [status, setStatus] = useState<TimerStatus>("focus");

    // Pomodoro Settings (minutes)
    const [focusDuration, setFocusDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);

    // Countdown Settings (minutes)
    const [countdownDuration, setCountdownDuration] = useState(15);

    const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
    const [stopwatchTime, setStopwatchTime] = useState(0);

    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Notifications
    const { requestPermission, sendNotification } = useNotification();

    // Request permission on mount
    useEffect(() => {
        requestPermission();
    }, [requestPermission]);

    // Timer Complete Handler
    const handleTimerComplete = useCallback(() => {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);

        // Switch to break/focus if in Pomodoro mode
        if (mode === "pomodoro" && status === "focus") {
            // Sound and Notification
            sendNotification("Focus Completed!", { body: "Great job! Let's take a break." });
            alert("Focus Completed! Let's take a break.");
            setStatus("break");
        } else if (mode === "pomodoro" && status === "break") {
            sendNotification("Break Completed!", { body: "Ready for the next session?" });
            alert("Break Completed! Ready for the next session?");
            setStatus("focus");
        } else if (mode === "countdown") {
            sendNotification("Timer Finished!", { body: "The set time has passed." });
            alert("Timer Finished!");
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

    // Reset timer on mode/settings change
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        resetTimer();
    }, [resetTimer]);

    // Timer Logic
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

    // Time Formatter (MM:SS)
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    // Circular Progress Calculation
    const calculateProgress = () => {
        if (mode === "stopwatch") return 100; // Stopwatch is always full
        const total = mode === "pomodoro"
            ? (status === "focus" ? focusDuration * 60 : breakDuration * 60)
            : countdownDuration * 60;
        return ((total - timeLeft) / total) * 100;
    };

    const progress = calculateProgress();
    const circumference = 2 * Math.PI * 120;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Theme Color
    const getThemeColor = () => {
        if (status === "break") return "text-green-500";
        return "text-blue-600";
    };

    const getBgColor = () => {
        if (status === "break") return "bg-green-50";
        return "bg-blue-50";
    };

    // Save Session Handler
    const handleSaveSession = () => {
        // Ideally, we calculate elapsed time.
        // Here we just use the tracked duration logic or stopwatch time.
        let actualDuration = 0;
        if (mode === "stopwatch") {
            actualDuration = stopwatchTime;
        } else {
            // For countdown/pomodoro, duration is total - remaining
            const total = mode === "pomodoro"
                ? (status === "focus" ? focusDuration * 60 : breakDuration * 60)
                : countdownDuration * 60;
            actualDuration = total - timeLeft;
        }

        if (todo && todo.id && onSaveSession) {
            onSaveSession({
                todoId: todo.id,
                todoTitle: todo?.title ? `Focusing on: ${todo?.title}` : "Focus Timer",
                duration: actualDuration,
                mode: mode
            });
            alert("Session Recorded!");
            // Reset or continue depends on requirements. Here we don't reset automatically.
        } else {
            alert("No time recorded to save.");
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
        onCloseModal: onBack // Esc to go back
    });

    return (
        <div className={`flex flex-col h-screen transition-colors duration-500 ${getBgColor()}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4">
                <button onClick={onBack} className="p-2 text-gray-500 hover:bg-white/50 rounded-full">
                    <ArrowLeft size={24} />
                </button>

                {/* Mode Switcher */}
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
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
                        {todo?.title ? `Focusing on: ${todo.title}` : "Focus Timer"}
                    </h2>
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
                                    25min
                                </button>
                                <button
                                    onClick={() => setFocusDuration(50)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${focusDuration === 50 ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}
                                >
                                    50min
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setBreakDuration(5)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${breakDuration === 5 ? "bg-green-600 text-white" : "bg-white text-gray-500"}`}
                                >
                                    5min
                                </button>
                                <button
                                    onClick={() => setBreakDuration(10)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${breakDuration === 10 ? "bg-green-600 text-white" : "bg-white text-gray-500"}`}
                                >
                                    10min
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Settings (Countdown Only) */}
                {mode === "countdown" && !isRunning && !isPaused && (
                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                        <span className="text-sm font-bold text-gray-500">Timer:</span>
                        <input
                            type="number"
                            min="1"
                            value={countdownDuration}
                            onChange={(e) => setCountdownDuration(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-16 text-center border-b-2 border-blue-100 focus:border-blue-500 outline-none font-bold text-gray-800"
                        />
                        <span className="text-sm font-bold text-gray-500">min</span>
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
                    <span className="text-sm font-medium">Record Session Only</span>
                </button>
            </div>
        </div>
    );
}
