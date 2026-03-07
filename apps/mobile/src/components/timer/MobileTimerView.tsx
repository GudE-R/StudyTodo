import React, { useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Modal, ScrollView } from 'react-native';
import { Play, Pause, Square, ArrowLeft, MoreVertical, Timer, Watch, CheckCircle, ChevronDown, X } from 'lucide-react-native';
import { Svg, Circle } from 'react-native-svg';
import { Todo } from '@studytodo/shared';
import { useMobileTimer } from '../../hooks/useMobileTimer';

interface MobileTimerViewProps {
    todo: Todo;
    onBack: () => void;
    onSaveSession?: (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => void;
    onCompleteTask?: () => void;
}

export const MobileTimerView = ({ todo, onBack, onSaveSession, onCompleteTask }: MobileTimerViewProps) => {
    const { width } = useWindowDimensions();
    const CIRCLE_SIZE = width * 0.75;
    const RADIUS = CIRCLE_SIZE / 2 - 10;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    const timer = useMobileTimer({ todo, onBack, onSaveSession, onCompleteTask });

    const strokeDashoffset = CIRCUMFERENCE - (timer.progress / 100) * CIRCUMFERENCE;

    return (
        <View style={[styles.container, { backgroundColor: timer.bgColor }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={timer.handleBack} style={styles.iconBtn}>
                    <ArrowLeft size={24} color="#666" />
                </TouchableOpacity>

                <View style={styles.modeTabs}>
                    <TouchableOpacity onPress={() => { timer.setMode("pomodoro"); timer.setStatus("focus"); timer.setIsRunning(false); }} style={[styles.tab, timer.mode === "pomodoro" && styles.activeTab]}>
                        <Timer size={20} color={timer.mode === "pomodoro" ? "#2563eb" : "#999"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { timer.setMode("countdown"); timer.setIsRunning(false); }} style={[styles.tab, timer.mode === "countdown" && styles.activeTab]}>
                        <Watch size={20} color={timer.mode === "countdown" ? "#2563eb" : "#999"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={timer.switchToStopwatch}
                        style={[styles.tab, timer.mode === "stopwatch" && styles.activeTab]}
                    >
                        <Play size={20} color={timer.mode === "stopwatch" ? "#2563eb" : "#999"} style={{ transform: [{ rotate: '90deg' }] }} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.iconBtn} onPress={() => { timer.fetchSessionLog(); timer.setShowSessionLog(true); }}>
                    <MoreVertical size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.taskInfo}>
                    <View style={[styles.statusBadge, timer.status === "break" ? styles.badgeBreak : styles.badgeFocus]}>
                        <Text style={[styles.statusText, timer.status === "break" ? styles.textBreak : styles.textFocus]}>
                            {timer.status === "break" ? "BREAK TIME" : "CURRENT TASK"}
                        </Text>
                    </View>
                    <Text style={styles.taskTitle} numberOfLines={2}>{todo.title}</Text>
                </View>

                {/* Timer Circle with embedded controls */}
                <View style={[styles.timerCircle, { width: CIRCLE_SIZE, height: CIRCLE_SIZE }]}>
                    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
                        <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke="rgba(0,0,0,0.1)" strokeWidth="12" fill="transparent" />
                        <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke={timer.themeColor} strokeWidth="12" fill="transparent" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                    </Svg>
                    <View style={styles.timerInner}>
                        {/* Time display */}
                        <Text style={styles.timeText}>
                            {timer.mode === "stopwatch" ? timer.formatTime(timer.stopwatchTime) : timer.formatTime(timer.timeLeft)}
                        </Text>

                        {/* Play/Pause button inside circle */}
                        <View style={styles.inCircleControls}>
                            {!timer.isRunning ? (
                                <TouchableOpacity
                                    style={[styles.inCircleBtn, timer.status === "break" ? styles.inCircleBtnBreak : styles.inCircleBtnFocus]}
                                    onPress={() => { timer.setIsRunning(true); timer.setIsPaused(false); }}
                                >
                                    <Play size={24} color={timer.status === "break" ? "#16a34a" : "#2563eb"} fill={timer.status === "break" ? "#16a34a" : "#2563eb"} />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.inCircleBtnPause}
                                    onPress={() => { timer.setIsRunning(false); timer.setIsPaused(true); }}
                                >
                                    <Pause size={24} color="#ca8a04" fill="#ca8a04" />
                                </TouchableOpacity>
                            )}

                            {(timer.isRunning || timer.isPaused) && (
                                <TouchableOpacity style={styles.inCircleResetBtn} onPress={timer.resetTimer}>
                                    <Square size={18} color="#999" fill="#999" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* Settings (Pomodoro) */}
                {timer.mode === "pomodoro" && !timer.isRunning && !timer.isPaused && (
                    <View style={styles.settingsRow}>
                        {timer.status === "focus" ? (
                            <>
                                <TouchableOpacity onPress={() => timer.setFocusDuration(25)} style={[styles.durationBtn, timer.focusDuration === 25 && styles.activeDurationBtn]}>
                                    <Text style={[styles.durationText, timer.focusDuration === 25 && styles.activeDurationText]}>25 min</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => timer.setFocusDuration(50)} style={[styles.durationBtn, timer.focusDuration === 50 && styles.activeDurationBtn]}>
                                    <Text style={[styles.durationText, timer.focusDuration === 50 && styles.activeDurationText]}>50 min</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity onPress={() => timer.setBreakDuration(5)} style={[styles.durationBtn, timer.breakDuration === 5 && styles.activeDurationBtnBreak]}>
                                    <Text style={[styles.durationText, timer.breakDuration === 5 && styles.activeDurationText]}>5 min</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => timer.setBreakDuration(10)} style={[styles.durationBtn, timer.breakDuration === 10 && styles.activeDurationBtnBreak]}>
                                    <Text style={[styles.durationText, timer.breakDuration === 10 && styles.activeDurationText]}>10 min</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}

                {/* Settings (Countdown) */}
                {timer.mode === "countdown" && !timer.isRunning && !timer.isPaused && (
                    <View style={styles.settingsRow}>
                        <TouchableOpacity onPress={() => timer.setCountdownDuration(d => Math.max(1, d - 5))} style={styles.adjustBtn}><Text>-</Text></TouchableOpacity>
                        <Text style={styles.adjustText}>{timer.countdownDuration} min</Text>
                        <TouchableOpacity onPress={() => timer.setCountdownDuration(d => d + 5)} style={styles.adjustBtn}><Text>+</Text></TouchableOpacity>
                    </View>
                )}

                {/* Switch to Stopwatch */}
                {timer.mode !== "stopwatch" && (timer.isRunning || timer.isPaused) && (
                    <TouchableOpacity style={styles.switchBtn} onPress={timer.switchToStopwatch}>
                        <ChevronDown size={18} color="#2563eb" style={{ transform: [{ rotate: '-90deg' }] }} />
                        <Text style={styles.switchBtnText}>ストップウォッチに切替</Text>
                    </TouchableOpacity>
                )}

                {/* Bottom Actions */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.recordBtn} onPress={timer.handleSave}>
                        <CheckCircle size={18} color="#999" />
                        <Text style={styles.recordText}>記録のみ保存</Text>
                    </TouchableOpacity>

                    {onCompleteTask && (
                        <TouchableOpacity style={styles.completeBtn} onPress={timer.handleCompleteTask}>
                            <CheckCircle size={18} color="#fff" />
                            <Text style={styles.completeBtnText}>タスク完了</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Session Log Modal */}
            <Modal visible={timer.showSessionLog} transparent animationType="slide">
                <View style={styles.logOverlay}>
                    <View style={styles.logContainer}>
                        <View style={styles.logHeader}>
                            <Text style={styles.logTitle}>記録ログ</Text>
                            <TouchableOpacity onPress={() => timer.setShowSessionLog(false)}>
                                <X size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.logScroll}>
                            {timer.sessionLog.length === 0 ? (
                                <Text style={styles.logEmpty}>まだ記録がありません</Text>
                            ) : (
                                timer.sessionLog.map((s) => {
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
                        {timer.sessionLog.length > 0 && (
                            <View style={styles.logFooter}>
                                <Text style={styles.logTotal}>
                                    合計: {Math.floor(timer.sessionLog.reduce((sum, s) => sum + s.duration, 0) / 60)}分
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
    container: { flex: 1, width: '100%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, width: '100%' },
    iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20 },
    modeTabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 28, padding: 6, gap: 10 },
    tab: { padding: 14, borderRadius: 22 },
    activeTab: { backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: 4 },
    taskInfo: { alignItems: 'center', gap: 5 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    badgeFocus: { backgroundColor: '#dbeafe' },
    badgeBreak: { backgroundColor: '#dcfce7' },
    statusText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    textFocus: { color: '#2563eb' },
    textBreak: { color: '#166534' },
    taskTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' },
    timerCircle: { justifyContent: 'center', alignItems: 'center' },
    timerInner: { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: 12 },
    timeText: { fontSize: 64, fontWeight: 'bold', color: '#1f2937', fontVariant: ['tabular-nums'] },
    inCircleControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    inCircleBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    inCircleBtnFocus: { backgroundColor: 'rgba(37, 99, 235, 0.12)' },
    inCircleBtnBreak: { backgroundColor: 'rgba(22, 163, 74, 0.12)' },
    inCircleBtnPause: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(234, 179, 8, 0.15)', justifyContent: 'center', alignItems: 'center' },
    inCircleResetBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
    settingsRow: { flexDirection: 'row', gap: 15 },
    durationBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#fff' },
    activeDurationBtn: { backgroundColor: '#2563eb' },
    activeDurationBtnBreak: { backgroundColor: '#16a34a' },
    durationText: { fontSize: 14, fontWeight: 'bold', color: '#6b7280' },
    activeDurationText: { color: '#fff' },
    bottomActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 },
    recordBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 10 },
    recordText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#22c55e', borderRadius: 12 },
    completeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    adjustBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 8 },
    adjustText: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 10 },
    switchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#2563eb' },
    switchBtnText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
    logOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    logContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', padding: 20 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    logTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    logScroll: { maxHeight: 300 },
    logEmpty: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 30 },
    logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
    logMode: { fontSize: 24 },
    logInfo: { flex: 1 },
    logDuration: { fontSize: 16, fontWeight: '600', color: '#333' },
    logDate: { fontSize: 12, color: '#999', marginTop: 2 },
    logFooter: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e5e5', alignItems: 'center' },
    logTotal: { fontSize: 16, fontWeight: '700', color: '#2563eb' },
});

