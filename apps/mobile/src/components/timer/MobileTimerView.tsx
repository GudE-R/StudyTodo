import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Modal, ScrollView, Switch, useColorScheme } from 'react-native';
import { Play, Pause, Square, ArrowLeft, MoreVertical, Timer, Watch, CheckCircle, ChevronDown, X, RotateCcw } from 'lucide-react-native';
import { Svg, Circle } from 'react-native-svg';
import { Todo } from '@studytodo/shared';
import { useMobileTimer } from '../../hooks/useMobileTimer';
import { useTranslation } from 'react-i18next';

interface MobileTimerViewProps {
    todo: Todo;
    onBack: () => void;
    onSaveSession?: (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => void;
    onCompleteTask?: () => void;
}

export const MobileTimerView = ({ todo, onBack, onSaveSession, onCompleteTask }: MobileTimerViewProps) => {
    const { width } = useWindowDimensions();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const CIRCLE_SIZE = width * 0.75;
    const RADIUS = CIRCLE_SIZE / 2 - 10;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    const { t } = useTranslation();
    const timer = useMobileTimer({ todo, onBack, onSaveSession, onCompleteTask });

    const strokeDashoffset = CIRCUMFERENCE - (timer.progress / 100) * CIRCUMFERENCE;

    // Dynamic dark mode colors
    const colors = {
        bg: isDark
            ? (timer.status === 'break' ? '#052e16' : '#172554')
            : timer.bgColor,
        text: isDark ? '#f3f4f6' : '#1f2937',
        textSub: isDark ? '#9ca3af' : '#6b7280',
        circleTrack: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        iconBtn: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.8)',
        modeTabs: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)',
        activeTab: isDark ? '#374151' : '#fff',
        badge: {
            focus: isDark ? { bg: '#1e3a5f', text: '#60a5fa' } : { bg: '#dbeafe', text: '#2563eb' },
            break: isDark ? { bg: '#14532d', text: '#4ade80' } : { bg: '#dcfce7', text: '#166534' },
        },
        durationBtn: isDark ? '#374151' : '#fff',
        durationText: isDark ? '#d1d5db' : '#6b7280',
        menuBg: isDark ? '#1f2937' : '#fff',
        menuBorder: isDark ? '#374151' : '#f0f0f0',
        logBg: isDark ? '#1f2937' : '#fff',
        logItemBorder: isDark ? '#374151' : '#f0f0f0',
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={timer.handleBack} style={[styles.iconBtn, { backgroundColor: colors.iconBtn }]}>
                    <ArrowLeft size={24} color={colors.textSub} />
                </TouchableOpacity>

                <View style={[styles.modeTabs, { backgroundColor: colors.modeTabs }]}>
                    <TouchableOpacity onPress={() => { timer.setMode("pomodoro"); timer.setStatus("focus"); timer.setIsRunning(false); }} style={[styles.tab, timer.mode === "pomodoro" && [styles.activeTab, { backgroundColor: colors.activeTab }]]}>
                        <Timer size={20} color={timer.mode === "pomodoro" ? "#2563eb" : "#999"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { timer.setMode("countdown"); timer.setIsRunning(false); }} style={[styles.tab, timer.mode === "countdown" && [styles.activeTab, { backgroundColor: colors.activeTab }]]}>
                        <Watch size={20} color={timer.mode === "countdown" ? "#2563eb" : "#999"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={timer.switchToStopwatch}
                        style={[styles.tab, timer.mode === "stopwatch" && [styles.activeTab, { backgroundColor: colors.activeTab }]]}
                    >
                        <Play size={20} color={timer.mode === "stopwatch" ? "#2563eb" : "#999"} style={{ transform: [{ rotate: '90deg' }] }} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.iconBtn }]} onPress={() => timer.setShowMenu(true)}>
                    <MoreVertical size={24} color={colors.textSub} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.taskInfo}>
                    <View style={[styles.statusBadge, { backgroundColor: timer.status === 'break' ? colors.badge.break.bg : colors.badge.focus.bg }]}>
                        <Text style={[styles.statusText, { color: timer.status === 'break' ? colors.badge.break.text : colors.badge.focus.text }]}>
                            {timer.status === "break" ? "BREAK TIME" : "CURRENT TASK"}
                        </Text>
                    </View>
                    <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>{todo.title}</Text>
                </View>

                {/* Timer Circle with embedded controls */}
                <View style={[styles.timerCircle, { width: CIRCLE_SIZE, height: CIRCLE_SIZE }]}>
                    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
                        <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke={colors.circleTrack} strokeWidth="12" fill="transparent" />
                        <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke={timer.themeColor} strokeWidth="12" fill="transparent" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                    </Svg>
                    <View style={styles.timerInner}>
                        <Text style={[styles.timeText, { color: colors.text }]}>
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
                                <TouchableOpacity style={[styles.inCircleResetBtn, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]} onPress={timer.resetTimer}>
                                    <Square size={18} color={isDark ? '#aaa' : '#999'} fill={isDark ? '#aaa' : '#999'} />
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
                                <TouchableOpacity onPress={() => timer.setFocusDuration(25)} style={[styles.durationBtn, { backgroundColor: colors.durationBtn }, timer.focusDuration === 25 && styles.activeDurationBtn]}>
                                    <Text style={[styles.durationText, { color: colors.durationText }, timer.focusDuration === 25 && styles.activeDurationText]}>25 min</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => timer.setFocusDuration(50)} style={[styles.durationBtn, { backgroundColor: colors.durationBtn }, timer.focusDuration === 50 && styles.activeDurationBtn]}>
                                    <Text style={[styles.durationText, { color: colors.durationText }, timer.focusDuration === 50 && styles.activeDurationText]}>50 min</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity onPress={() => timer.setBreakDuration(5)} style={[styles.durationBtn, { backgroundColor: colors.durationBtn }, timer.breakDuration === 5 && styles.activeDurationBtnBreak]}>
                                    <Text style={[styles.durationText, { color: colors.durationText }, timer.breakDuration === 5 && styles.activeDurationText]}>5 min</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => timer.setBreakDuration(10)} style={[styles.durationBtn, { backgroundColor: colors.durationBtn }, timer.breakDuration === 10 && styles.activeDurationBtnBreak]}>
                                    <Text style={[styles.durationText, { color: colors.durationText }, timer.breakDuration === 10 && styles.activeDurationText]}>10 min</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}

                {/* Settings (Countdown) */}
                {timer.mode === "countdown" && !timer.isRunning && !timer.isPaused && (
                    <View style={styles.settingsRow}>
                        <TouchableOpacity onPress={() => timer.setCountdownDuration(d => Math.max(1, d - 5))} style={[styles.adjustBtn, { backgroundColor: colors.durationBtn }]}><Text style={{ color: colors.text }}>-</Text></TouchableOpacity>
                        <Text style={[styles.adjustText, { color: colors.text }]}>{timer.countdownDuration} min</Text>
                        <TouchableOpacity onPress={() => timer.setCountdownDuration(d => d + 5)} style={[styles.adjustBtn, { backgroundColor: colors.durationBtn }]}><Text style={{ color: colors.text }}>+</Text></TouchableOpacity>
                    </View>
                )}

                {/* Switch to Stopwatch */}
                {timer.mode !== "stopwatch" && (timer.isRunning || timer.isPaused) && (
                    <TouchableOpacity style={[styles.switchBtn, isDark && { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' }]} onPress={timer.switchToStopwatch}>
                        <ChevronDown size={18} color="#2563eb" style={{ transform: [{ rotate: '-90deg' }] }} />
                        <Text style={styles.switchBtnText}>{t('timer.switchToStopwatch')}</Text>
                    </TouchableOpacity>
                )}

                {/* Bottom Actions */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.recordBtn} onPress={timer.handleSave}>
                        <CheckCircle size={18} color={isDark ? '#6b7280' : '#999'} />
                        <Text style={[styles.recordText, { color: colors.textSub }]}>{t('timer.saveRecordOnly')}</Text>
                    </TouchableOpacity>

                    {onCompleteTask && (
                        <TouchableOpacity style={styles.completeBtn} onPress={timer.handleCompleteTask}>
                            <CheckCircle size={18} color="#fff" />
                            <Text style={styles.completeBtnText}>{t('timer.completeTask')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Menu Modal */}
            <Modal visible={timer.showMenu} transparent animationType="fade">
                <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => timer.setShowMenu(false)}>
                    <View style={[styles.menuContainer, { backgroundColor: colors.menuBg }]}>
                        {/* Auto Progress Toggle */}
                        <View style={[styles.menuItem, { borderBottomColor: colors.menuBorder }]}>
                            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('timer.autoProgress')}</Text>
                            <Switch
                                value={timer.autoProgress}
                                onValueChange={(v) => timer.setAutoProgress(v)}
                                trackColor={{ false: isDark ? '#4b5563' : '#d1d5db', true: '#3b82f6' }}
                                thumbColor="#fff"
                            />
                        </View>
                        {/* Session Log */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => { timer.fetchSessionLog(); timer.setShowMenu(false); timer.setShowSessionLog(true); }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <RotateCcw size={16} color={colors.textSub} />
                                <Text style={[styles.menuItemText, { color: colors.text }]}>{t('timer.sessionLog')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Session Log Modal */}
            <Modal visible={timer.showSessionLog} transparent animationType="slide">
                <View style={styles.logOverlay}>
                    <View style={[styles.logContainer, { backgroundColor: colors.logBg }]}>
                        <View style={styles.logHeader}>
                            <Text style={[styles.logTitle, { color: colors.text }]}>{t('timer.sessionLog')}</Text>
                            <TouchableOpacity onPress={() => timer.setShowSessionLog(false)}>
                                <X size={24} color={colors.textSub} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.logScroll}>
                            {timer.sessionLog.length === 0 ? (
                                <Text style={[styles.logEmpty, { color: colors.textSub }]}>{t('timer.noRecordsYet')}</Text>
                            ) : (
                                timer.sessionLog.map((s) => {
                                    const d = new Date(s.createdAt);
                                    const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                                    const min = Math.floor(s.duration / 60);
                                    const sec = s.duration % 60;
                                    const modeLabel = s.mode === 'pomodoro' ? '🍅' : s.mode === 'countdown' ? '⏱' : '⏱️';
                                    return (
                                        <View key={s.id} style={[styles.logItem, { borderBottomColor: colors.logItemBorder }]}>
                                            <Text style={styles.logMode}>{modeLabel}</Text>
                                            <View style={styles.logInfo}>
                                                <Text style={[styles.logDuration, { color: colors.text }]}>{sec > 0 ? t('timer.durationMinSec', { min, sec }) : t('timer.durationMin', { min })}</Text>
                                                <Text style={[styles.logDate, { color: colors.textSub }]}>{dateStr}</Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>
                        {timer.sessionLog.length > 0 && (
                            <View style={[styles.logFooter, { borderTopColor: colors.menuBorder }]}>
                                <Text style={styles.logTotal}>
                                    {t('timer.totalMinutes', { min: Math.floor(timer.sessionLog.reduce((sum, s) => sum + s.duration, 0) / 60) })}
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
    iconBtn: { padding: 8, borderRadius: 20 },
    modeTabs: { flexDirection: 'row', borderRadius: 28, padding: 6, gap: 10 },
    tab: { padding: 14, borderRadius: 22 },
    activeTab: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: 4 },
    taskInfo: { alignItems: 'center', gap: 5 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    taskTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
    timerCircle: { justifyContent: 'center', alignItems: 'center' },
    timerInner: { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: 12 },
    timeText: { fontSize: 64, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
    inCircleControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    inCircleBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    inCircleBtnFocus: { backgroundColor: 'rgba(37, 99, 235, 0.12)' },
    inCircleBtnBreak: { backgroundColor: 'rgba(22, 163, 74, 0.12)' },
    inCircleBtnPause: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(234, 179, 8, 0.15)', justifyContent: 'center', alignItems: 'center' },
    inCircleResetBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
    settingsRow: { flexDirection: 'row', gap: 15 },
    durationBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
    activeDurationBtn: { backgroundColor: '#2563eb' },
    activeDurationBtnBreak: { backgroundColor: '#16a34a' },
    durationText: { fontSize: 14, fontWeight: 'bold' },
    activeDurationText: { color: '#fff' },
    bottomActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 },
    recordBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 10 },
    recordText: { fontSize: 14, fontWeight: '500' },
    completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#22c55e', borderRadius: 12 },
    completeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    adjustBtn: { padding: 10, borderRadius: 8 },
    adjustText: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 10 },
    switchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#2563eb' },
    switchBtnText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
    // Menu
    menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 55, paddingRight: 16 },
    menuContainer: { borderRadius: 14, width: 220, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    menuItemText: { fontSize: 15, fontWeight: '600' },
    // Session Log
    logOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    logContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', padding: 20 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    logTitle: { fontSize: 18, fontWeight: '700' },
    logScroll: { maxHeight: 300 },
    logEmpty: { textAlign: 'center', fontSize: 14, paddingVertical: 30 },
    logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
    logMode: { fontSize: 24 },
    logInfo: { flex: 1 },
    logDuration: { fontSize: 16, fontWeight: '600' },
    logDate: { fontSize: 12, marginTop: 2 },
    logFooter: { paddingTop: 12, borderTopWidth: 1, alignItems: 'center' },
    logTotal: { fontSize: 16, fontWeight: '700', color: '#2563eb' },
});
