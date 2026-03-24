import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Brain, Sparkles, Check } from 'lucide-react-native';
import { addDays, format } from 'date-fns';
import { Todo } from '@studytodo/shared';
import { useMobileSRS } from '../../../hooks/useMobileSRS';
import { useMobileTodos } from '../../../hooks/useMobileTodos';
import { generateId } from '../../../lib/utils';
import { useTheme } from '../../../providers/ThemeProvider';

interface StepSrsAhaProps {
    studyTopic: string;
    onNext: () => void;
}

export function StepSrsAha({ studyTopic, onNext }: StepSrsAhaProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { profiles } = useMobileSRS();
    const { addSRSTodos } = useMobileTodos();
    const [saved, setSaved] = useState(false);

    const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
    const intervals = defaultProfile?.intervals || [1, 3, 7, 14, 30];

    const timeline = useMemo(() => {
        const today = new Date();
        return [
            { label: t('interactiveOnboarding.step2Today'), date: today, title: studyTopic, isOriginal: true },
            ...intervals.map((days, i) => ({
                label: t('interactiveOnboarding.step2Day', { n: days }),
                date: addDays(today, days),
                title: `${studyTopic} (${i + 1}回目)`,
                isOriginal: false,
            })),
        ];
    }, [intervals, studyTopic, t]);

    const handleStart = async () => {
        if (!defaultProfile || saved) return;

        const baseTodo: Todo = {
            id: generateId(),
            title: studyTopic,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            dueDate: new Date(),
            srsInterval: defaultProfile.name,
            srsProfileId: defaultProfile.id,
        };

        await addSRSTodos(baseTodo, defaultProfile.intervals);
        setSaved(true);
        setTimeout(onNext, 800);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.iconContainer, { backgroundColor: '#22c55e' }]}>
                    <Brain size={40} color="#fff" />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                    {t('interactiveOnboarding.step2Title')}
                </Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {t('interactiveOnboarding.step2Desc')}
                </Text>

                {/* Timeline */}
                <View style={styles.timeline}>
                    <View style={styles.timelineLine} />
                    {timeline.map((item, i) => (
                        <View key={i} style={styles.timelineItem}>
                            <View style={[
                                styles.timelineDot,
                                item.isOriginal
                                    ? { backgroundColor: '#3b82f6' }
                                    : { backgroundColor: colors.surface, borderWidth: 2, borderColor: '#22c55e' }
                            ]}>
                                {item.isOriginal ? (
                                    <Sparkles size={16} color="#fff" />
                                ) : (
                                    <Text style={[styles.dotText, { color: '#22c55e' }]}>{i}</Text>
                                )}
                            </View>
                            <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                                <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                                    {item.label} — {format(item.date, 'M/d')}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    onPress={handleStart}
                    disabled={saved}
                    style={[styles.button, saved && styles.buttonSaved]}
                >
                    {saved ? (
                        <Check size={20} color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>{t('interactiveOnboarding.step2Cta')}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
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
        marginBottom: 24,
        maxWidth: 320,
    },
    timeline: {
        width: '100%',
        maxWidth: 400,
        marginBottom: 24,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 23,
        top: 12,
        bottom: 12,
        width: 2,
        backgroundColor: '#22c55e',
        opacity: 0.3,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    timelineDot: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    dotText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    timelineCard: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    cardDate: {
        fontSize: 12,
        marginTop: 2,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        minWidth: 180,
    },
    buttonSaved: {
        backgroundColor: '#22c55e',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
