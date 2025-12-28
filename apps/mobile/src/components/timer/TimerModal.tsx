
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { X, Play, Pause, Save, RotateCcw } from 'lucide-react-native';
import { Todo, Session } from '@pomarc/shared';
import * as Crypto from 'expo-crypto';
import { useTimer, TimerMode } from '../../hooks/useTimer';
import { useMobileSRS } from '../../hooks/useMobileSRS';
import { format } from 'date-fns';

interface TimerModalProps {
    visible: boolean;
    onClose: () => void;
    todo?: Todo; // Optional: Timer can be run without a specific todo? Requirements imply Todo context usually.
    onSaveSession: (session: Session) => void;
}

export const TimerModal = ({ visible, onClose, todo, onSaveSession }: TimerModalProps) => {
    // Default to Pomodoro (25m = 1500s)
    const { mode, setMode, timeLeft, isActive, toggleTimer, resetTimer, setDuration, elapsed } = useTimer({
        initialMode: 'pomodoro',
        initialDuration: 1500,
        onComplete: () => {
            Alert.alert("Time's up!", "Did you finish the task?", [
                { text: "Continue", onPress: () => { } }, // Just stay
                { text: "Finish Task", onPress: () => saveSession() }
            ]);
        }
    });

    const [startTime, setStartTime] = useState<Date | null>(null);

    // Reset when modal opens/changes
    useEffect(() => {
        if (visible) {
            setStartTime(new Date());
            resetTimer(1500);
            setMode('pomodoro');
        } else {
            // When closing, maybe strictly reset?
        }
    }, [visible]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleModeChange = (newMode: TimerMode) => {
        setMode(newMode);
        if (newMode === 'pomodoro') resetTimer(1500);
        else if (newMode === 'countdown') resetTimer(600); // 10 min default
        else if (newMode === 'stopwatch') resetTimer(0);
    };

    const { processReview } = useMobileSRS();

    const saveSession = async () => {
        if (elapsed < 5) { // Too short
            onClose();
            return;
        }

        const session: Session = {
            id: Crypto.randomUUID(),
            todoId: todo?.id || '',
            todoTitle: todo?.title || 'No Task',
            startTime: startTime || new Date(),
            endTime: new Date(),
            duration: elapsed,
            mode: mode,
            createdAt: new Date()
        };
        onSaveSession(session);

        if (todo && mode === 'pomodoro') {
            await processReview(todo, true);
        }

        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { width: '80%' }]} numberOfLines={1}>
                        {todo?.title || 'Timer'}
                    </Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Timer Display */}
                    <View style={styles.timerCircle}>
                        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                        <Text style={styles.modeText}>{mode.toUpperCase()}</Text>
                    </View>

                    {/* Mode Selector */}
                    <View style={styles.modeRow}>
                        {(['pomodoro', 'countdown', 'stopwatch'] as TimerMode[]).map(m => (
                            <TouchableOpacity
                                key={m}
                                style={[styles.modeBtn, mode === m && styles.activeModeBtn]}
                                onPress={() => handleModeChange(m)}
                            >
                                <Text style={[styles.modeBtnText, mode === m && styles.activeModeText]}>
                                    {m === 'pomodoro' ? 'Focus' : m === 'countdown' ? 'Timer' : 'Watch'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Controls */}
                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.controlBtn} onPress={() => resetTimer(mode === 'pomodoro' ? 1500 : mode === 'stopwatch' ? 0 : 600)}>
                            <RotateCcw size={24} color="#666" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.mainControlBtn} onPress={toggleTimer}>
                            {isActive ? (
                                <Pause size={40} color="#fff" fill="#fff" />
                            ) : (
                                <Play size={40} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.controlBtn} onPress={saveSession}>
                            <Save size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 40, // for statusBar
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeBtn: {
        padding: 8,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    timerCircle: {
        width: 250,
        height: 250,
        borderRadius: 125,
        borderWidth: 8,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        backgroundColor: '#f8fafc',
    },
    timerText: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#333',
        fontVariant: ['tabular-nums'],
    },
    modeText: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
        letterSpacing: 2,
    },
    modeRow: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 60,
    },
    modeBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    activeModeBtn: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    modeBtnText: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 14,
    },
    activeModeText: {
        color: '#333',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 40,
    },
    controlBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainControlBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
