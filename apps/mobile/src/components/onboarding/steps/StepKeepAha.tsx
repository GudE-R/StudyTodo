import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock, Check } from 'lucide-react-native';
import { format } from 'date-fns';
import { useTheme } from '../../../providers/ThemeProvider';

interface StepKeepAhaProps {
    onNext: () => void;
}

export function StepKeepAha({ onNext }: StepKeepAhaProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const [keptSlot, setKeptSlot] = useState<number | null>(null);

    const slots = useMemo(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = Math.max(0, currentHour - 1);
        const result: { hour: number; minute: number; label: string }[] = [];
        for (let h = startHour; h < Math.min(24, startHour + 6); h++) {
            result.push({ hour: h, minute: 0, label: `${String(h).padStart(2, '0')}:00` });
            result.push({ hour: h, minute: 30, label: `${String(h).padStart(2, '0')}:30` });
        }
        return result;
    }, []);

    const guideSlotIndex = useMemo(() => {
        const now = new Date();
        const currentMinute = now.getHours() * 60 + now.getMinutes();
        const idx = slots.findIndex(s => s.hour * 60 + s.minute > currentMinute);
        return idx >= 0 ? idx : 2;
    }, [slots]);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: '#f97316' }]}>
                    <Clock size={40} color="#fff" />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                    {t('interactiveOnboarding.step3Title')}
                </Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {t('interactiveOnboarding.step3Desc')}
                </Text>

                {/* Mini schedule */}
                <View style={styles.scheduleContainer}>
                    <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                        {format(new Date(), 'M/d (EEE)')}
                    </Text>
                    <View style={[styles.schedule, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {slots.map((slot, i) => (
                            <TimeSlot
                                key={i}
                                label={slot.label}
                                isKept={keptSlot === i}
                                isGuide={i === guideSlotIndex && keptSlot === null}
                                hintText={t('interactiveOnboarding.step3Hint')}
                                onLongPress={() => setKeptSlot(prev => prev === i ? null : i)}
                                colors={colors}
                            />
                        ))}
                    </View>
                </View>

                {keptSlot !== null && (
                    <Text style={styles.keptMessage}>
                        {t('interactiveOnboarding.step3Kept')}
                    </Text>
                )}

                <TouchableOpacity
                    onPress={onNext}
                    disabled={keptSlot === null}
                    style={[styles.button, { opacity: keptSlot !== null ? 1 : 0.4 }]}
                >
                    <Text style={styles.buttonText}>{t('interactiveOnboarding.step3Cta')}</Text>
                    <Check size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function TimeSlot({
    label,
    isKept,
    isGuide,
    hintText,
    onLongPress,
    colors,
}: {
    label: string;
    isKept: boolean;
    isGuide: boolean;
    hintText: string;
    onLongPress: () => void;
    colors: any;
}) {
    return (
        <Pressable
            onLongPress={onLongPress}
            delayLongPress={500}
            style={[
                styles.slot,
                { borderBottomColor: colors.border },
                isKept && styles.slotKept,
            ]}
        >
            <Text style={[
                styles.slotLabel,
                { color: isKept ? '#f97316' : colors.textSecondary },
                isKept && styles.slotLabelKept,
            ]}>
                {label}
            </Text>
            {isKept && (
                <Text style={styles.keepBadge}>KEEP</Text>
            )}
            {isGuide && (
                <Text style={styles.hintText}>{hintText}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 20,
        maxWidth: 320,
    },
    scheduleContainer: {
        width: '100%',
        maxWidth: 360,
        marginBottom: 16,
    },
    dateLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
    },
    schedule: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    slot: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    slotKept: {
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
    },
    slotLabel: {
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    slotLabelKept: {
        fontWeight: 'bold',
        color: '#f97316',
    },
    keepBadge: {
        marginLeft: 'auto',
        fontSize: 11,
        fontWeight: '600',
        color: '#f97316',
    },
    hintText: {
        marginLeft: 'auto',
        fontSize: 11,
        fontWeight: '500',
        color: '#3b82f6',
    },
    keptMessage: {
        fontSize: 13,
        color: '#22c55e',
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
