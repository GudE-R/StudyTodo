import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../providers/ThemeProvider';

interface ActivitySummaryProps {
    totalTimeMinutes: number;
    completedCount: number;
}

export const ActivitySummary = ({ totalTimeMinutes, completedCount }: ActivitySummaryProps) => {
    const { t } = useTranslation();
    const { colors } = useTheme();

    const totalHours = Math.floor(totalTimeMinutes / 60);
    const totalMins = Math.floor(totalTimeMinutes % 60);

    return (
        <View style={styles.summaryGrid}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('activity.focusTime', 'Focus Time')}</Text>
                <View style={styles.cardValueRow}>
                    <Text style={[styles.cardValue, { color: colors.text }]}>{totalHours}</Text>
                    <Text style={[styles.cardUnit, { color: colors.textMuted }]}>h</Text>
                    <Text style={[styles.cardValue, { color: colors.text }]}>{totalMins}</Text>
                    <Text style={[styles.cardUnit, { color: colors.textMuted }]}>m</Text>
                </View>
            </View>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('activity.completed', 'Completed')}</Text>
                <View style={styles.cardValueRow}>
                    <Text style={[styles.cardValue, { color: colors.text }]}>{completedCount}</Text>
                    <Text style={[styles.cardUnit, { color: colors.textMuted }]}>{t('common.tasks')}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    summaryGrid: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 15,
    },
    cardLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 5,
        fontWeight: '600',
    },
    cardValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    cardUnit: {
        fontSize: 14,
        color: '#94a3b8',
        marginStart: 2,
    },
});
