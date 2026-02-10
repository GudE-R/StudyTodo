import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions, Modal, ScrollView } from 'react-native';
import { Play, Pause, Square, ArrowLeft, MoreVertical, Timer, Watch, CheckCircle, ChevronDown, X } from 'lucide-react-native';
import { Svg, Circle } from 'react-native-svg';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Todo, Session } from '@studytodo/shared';
import { useRepository } from '../../providers/RepositoryProvider';

interface MobileTimerViewProps {
    todo: Todo;
    onBack: () => void;
    onSaveSession?: (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => void;
    onCompleteTask?: () => void;
}

type TimerMode = "pomodoro" | "countdown" | "stopwatch";
type TimerStatus = "focus" | "break";

export const MobileTimerView = ({ todo, onBack, onSaveSession, onCompleteTask }: MobileTimerViewProps) => {
    const { width } = useWindowDimensions();
    const repository = useRepository();
    const CIRCLE_SIZE = width * 0.55;
    const RADIUS = CIRCLE_SIZE / 2 - 10;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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

    // Keep screen awake while timer is running
    useEffect(() => {
        if (isRunning) {
            activateKeepAwakeAsync('timer');
        } else {
            deactivateKeepAwake('timer');
        }
        return () => { deactivateKeepAwake('timer'); };
    }, [isRunning]);

    // Fetch session log for this todo
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

    // Initial Reset on Mount/Mode change
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
        // Skip reset if switching to stopwatch (handled manually)
        if (mode !== "stopwatch") {
            resetTimer();
        }
    }, [resetTimer, mode]);

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
    }, [isRunning, mode]);

    const handleTimerComplete = () => {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);

        if (mode === "pomodoro") {
            if (status === "focus") {
                // Auto-save focus session
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
                Alert.alert("集中終了！", `${focusDuration}分の記録を保存しました。休憩しましょう。`, [
                    { text: "OK", onPress: () => { setStatus("break"); setIsSaved(false); } }
                ]);
            } else {
                Alert.alert("休憩終了！", "作業に戻りましょう。", [
                    { text: "OK", onPress: () => setStatus("focus") }
                ]);
            }
        } else if (mode === "countdown") {
            // Auto-save countdown session
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
    };

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
    const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

    const getThemeColor = () => status === "break" ? "#22c55e" : "#2563eb"; // green-500 : blue-600
    const getBgColor = () => status === "break" ? "#f0fdf4" : "#eff6ff"; // green-50 : blue-50

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

    return (
        <View style={[styles.container, { backgroundColor: getBgColor() }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
                    <ArrowLeft size={24} color="#666" />
                </TouchableOpacity>

                <View style={styles.modeTabs}>
                    <TouchableOpacity onPress={() => { setMode("pomodoro"); setStatus("focus"); setIsRunning(false); }} style={[styles.tab, mode === "pomodoro" && styles.activeTab]}>
                        <Timer size={20} color={mode === "pomodoro" ? "#2563eb" : "#999"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setMode("countdown"); setIsRunning(false); }} style={[styles.tab, mode === "countdown" && styles.activeTab]}>
                        <Watch size={20} color={mode === "countdown" ? "#2563eb" : "#999"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            if (mode !== "stopwatch") {
                                let elapsed = 0;
                                if (mode === "pomodoro" && status === "focus") {
                                    elapsed = focusDuration * 60 - timeLeft;
                                } else if (mode === "countdown") {
                                    elapsed = countdownDuration * 60 - timeLeft;
                                } else {
                                    elapsed = 0;
                                }

                                setStopwatchTime(Math.max(0, elapsed));
                                setMode("stopwatch");
                                // Keep running state
                            }
                        }}
                        style={[styles.tab, mode === "stopwatch" && styles.activeTab]}
                    >
                        <Play size={20} color={mode === "stopwatch" ? "#2563eb" : "#999"} style={{ transform: [{ rotate: '90deg' }] }} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.iconBtn} onPress={() => { fetchSessionLog(); setShowSessionLog(true); }}>
                    <MoreVertical size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.taskInfo}>
                    <View style={[styles.statusBadge, status === "break" ? styles.badgeBreak : styles.badgeFocus]}>
                        <Text style={[styles.statusText, status === "break" ? styles.textBreak : styles.textFocus]}>
                            {status === "break" ? "BREAK TIME" : "CURRENT TASK"}
                        </Text>
                    </View>
                    <Text style={styles.taskTitle} numberOfLines={2}>{todo.title}</Text>
                </View>

                {/* Timer Circle */}
                <View style={[styles.timerCircle, { width: CIRCLE_SIZE, height: CIRCLE_SIZE }]}>
                    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
                        <Circle
                            cx={CIRCLE_SIZE / 2}
                            cy={CIRCLE_SIZE / 2}
                            r={RADIUS}
                            stroke="rgba(0,0,0,0.1)"
                            strokeWidth="12"
                            fill="transparent"
                        />
                        <Circle
                            cx={CIRCLE_SIZE / 2}
                            cy={CIRCLE_SIZE / 2}
                            r={RADIUS}
                            stroke={getThemeColor()}
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    </Svg>
                    <View style={styles.timeDisplay}>
                        <Text style={styles.timeText}>
                            {mode === "stopwatch" ? formatTime(stopwatchTime) : formatTime(timeLeft)}
                        </Text>
                    </View>
                </View>

                {/* Settings (Pomodoro) */}
                {mode === "pomodoro" && !isRunning && !isPaused && (
                    <View style={styles.settingsRow}>
                        {status === "focus" ? (
                            <>
                                <TouchableOpacity onPress={() => setFocusDuration(25)} style={[styles.durationBtn, focusDuration === 25 && styles.activeDurationBtn]}>
                                    <Text style={[styles.durationText, focusDuration === 25 && styles.activeDurationText]}>25 min</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setFocusDuration(50)} style={[styles.durationBtn, focusDuration === 50 && styles.activeDurationBtn]}>
                                    <Text style={[styles.durationText, focusDuration === 50 && styles.activeDurationText]}>50 min</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity onPress={() => setBreakDuration(5)} style={[styles.durationBtn, breakDuration === 5 && styles.activeDurationBtnBreak]}>
                                    <Text style={[styles.durationText, breakDuration === 5 && styles.activeDurationText]}>5 min</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setBreakDuration(10)} style={[styles.durationBtn, breakDuration === 10 && styles.activeDurationBtnBreak]}>
                                    <Text style={[styles.durationText, breakDuration === 10 && styles.activeDurationText]}>10 min</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}

                {/* Settings (Countdown) - Simplified as 15min default for now or simple increment */}
                {mode === "countdown" && !isRunning && !isPaused && (
                    <View style={styles.settingsRow}>
                        <TouchableOpacity onPress={() => setCountdownDuration(d => Math.max(1, d - 5))} style={styles.adjustBtn}><Text>-</Text></TouchableOpacity>
                        <Text style={styles.adjustText}>{countdownDuration} min</Text>
                        <TouchableOpacity onPress={() => setCountdownDuration(d => d + 5)} style={styles.adjustBtn}><Text>+</Text></TouchableOpacity>
                    </View>
                )}


                {/* Controls */}
                <View style={styles.controls}>
                    {!isRunning ? (
                        <TouchableOpacity
                            style={[styles.playBtn, status === "break" ? styles.btnBreak : styles.btnFocus]}
                            onPress={() => { setIsRunning(true); setIsPaused(false); }}
                        >
                            <Play size={32} color="#fff" fill="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.pauseBtn}
                            onPress={() => { setIsRunning(false); setIsPaused(true); }}
                        >
                            <Pause size={32} color="#fff" fill="#fff" />
                        </TouchableOpacity>
                    )}

                    {(isRunning || isPaused) && (
                        <TouchableOpacity style={styles.resetBtn} onPress={resetTimer}>
                            <Square size={24} color="#666" fill="#666" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Switch to Stopwatch Button - visible during Pomodoro/Countdown */}
                {mode !== "stopwatch" && (isRunning || isPaused) && (
                    <TouchableOpacity
                        style={styles.switchBtn}
                        onPress={() => {
                            let elapsed = 0;
                            if (mode === "pomodoro" && status === "focus") {
                                elapsed = focusDuration * 60 - timeLeft;
                            } else if (mode === "countdown") {
                                elapsed = countdownDuration * 60 - timeLeft;
                            }
                            setStopwatchTime(Math.max(0, elapsed));
                            setMode("stopwatch");
                            // Keep running state
                        }}
                    >
                        <ChevronDown size={18} color="#2563eb" style={{ transform: [{ rotate: '-90deg' }] }} />
                        <Text style={styles.switchBtnText}>ストップウォッチに切替</Text>
                    </TouchableOpacity>
                )}

                {/* Bottom Actions */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.recordBtn} onPress={handleSave}>
                        <CheckCircle size={18} color="#999" />
                        <Text style={styles.recordText}>記録のみ保存</Text>
                    </TouchableOpacity>

                    {onCompleteTask && (
                        <TouchableOpacity style={styles.completeBtn} onPress={() => {
                            const elapsed = getElapsedTime();
                            if (elapsed > 0 && !isSaved && onSaveSession) {
                                onSaveSession({
                                    todoId: todo.id,
                                    todoTitle: todo.title,
                                    duration: elapsed,
                                    mode: mode
                                });
                            }
                            onCompleteTask();
                        }}>
                            <CheckCircle size={18} color="#fff" />
                            <Text style={styles.completeBtnText}>タスク完了</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </View>

            {/* Session Log Modal */}
            <Modal visible={showSessionLog} transparent animationType="slide">
                <View style={styles.logOverlay}>
                    <View style={styles.logContainer}>
                        <View style={styles.logHeader}>
                            <Text style={styles.logTitle}>記録ログ</Text>
                            <TouchableOpacity onPress={() => setShowSessionLog(false)}>
                                <X size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.logScroll}>
                            {sessionLog.length === 0 ? (
                                <Text style={styles.logEmpty}>まだ記録がありません</Text>
                            ) : (
                                sessionLog.map((s) => {
                                    const d = new Date(s.createdAt);
                                    const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                                    const min = Math.floor(s.duration / 60);
                                    const sec = s.duration % 60;
                                    const modeLabel = s.mode === 'pomodoro' ? '🍅' : s.mode === 'countdown' ? '⏱' : '⏱️';
                                    return (
                                        <View key={s.id} style={styles.logItem}>
                                            <Text style={styles.logMode}>{modeLabel}</Text>
                                            <View style={styles.logInfo}>
                                                <Text style={styles.logDuration}>{min}分{sec > 0 ? `${sec}秒` : ''}</Text>
                                                <Text style={styles.logDate}>{dateStr}</Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>
                        {sessionLog.length > 0 && (
                            <View style={styles.logFooter}>
                                <Text style={styles.logTotal}>
                                    合計: {Math.floor(sessionLog.reduce((sum, s) => sum + s.duration, 0) / 60)}分
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 10,
    },
    iconBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
    },
    modeTabs: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 28,
        padding: 6,
        gap: 10,
    },
    tab: {
        padding: 14,
        borderRadius: 22,
    },
    activeTab: {
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-evenly',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    taskInfo: {
        alignItems: 'center',
        gap: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeFocus: { backgroundColor: '#dbeafe' },
    badgeBreak: { backgroundColor: '#dcfce7' },
    statusText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    textFocus: { color: '#2563eb' },
    textBreak: { color: '#166534' },
    taskTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
    },
    timerCircle: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeDisplay: {
        position: 'absolute',
    },
    timeText: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#1f2937',
        fontVariant: ['tabular-nums'],
    },
    settingsRow: {
        flexDirection: 'row',
        gap: 15,
    },
    durationBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    activeDurationBtn: { backgroundColor: '#2563eb' },
    activeDurationBtnBreak: { backgroundColor: '#16a34a' },
    durationText: { fontSize: 14, fontWeight: 'bold', color: '#6b7280' },
    activeDurationText: { color: '#fff' },

    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    playBtn: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
    },
    btnFocus: { backgroundColor: '#2563eb' },
    btnBreak: { backgroundColor: '#22c55e' },
    pauseBtn: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#eab308',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
    },
    resetBtn: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
    },
    bottomActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    recordBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        padding: 10,
    },
    recordText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    completeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#22c55e',
        borderRadius: 12,
    },
    completeBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    adjustBtn: {
        padding: 10, backgroundColor: '#fff', borderRadius: 8
    },
    adjustText: {
        fontSize: 18, fontWeight: 'bold', paddingHorizontal: 10
    },
    switchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2563eb',
    },
    switchBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
    },
    logOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    logContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
        padding: 20,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    logTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    logScroll: {
        maxHeight: 300,
    },
    logEmpty: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        paddingVertical: 30,
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        gap: 12,
    },
    logMode: {
        fontSize: 24,
    },
    logInfo: {
        flex: 1,
    },
    logDuration: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    logDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    logFooter: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
        alignItems: 'center',
    },
    logTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2563eb',
    },
});
