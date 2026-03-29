import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ModalOverlay } from '../ui/ModalOverlay';
import { X, BarChart2, History } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useMobileSessions } from '../../hooks/useMobileSessions';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileCategories } from '../../hooks/useMobileCategories';
import { useTheme } from '../../providers/ThemeProvider';
import { ActivityCharts } from '../activity/ActivityCharts';
import { ActivitySummary } from '../activity/ActivitySummary';
import { ActivityHistory } from '../activity/ActivityHistory';
import { useActivityAnalytics, Range } from '../../hooks/useActivityAnalytics';

interface ActivityModalProps {
    visible: boolean;
    onClose: () => void;
}

type Tab = "analytics" | "history";

export const ActivityModal = ({ visible, onClose }: ActivityModalProps) => {
    const { sessions, refreshSessions } = useMobileSessions();
    const { todos, refreshTodos, deleteTodo } = useMobileTodos();
    const { categories } = useMobileCategories();
    const { colors } = useTheme();
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState<Tab>("analytics");
    const [range, setRange] = useState<Range>("week");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    const {
        chartData,
        pieData,
        totalTimeMinutes,
        completedCount,
        flatCategories
    } = useActivityAnalytics({
        sessions,
        todos,
        categories,
        range,
        filterCategory
    });

    useEffect(() => {
        if (visible) {
            refreshSessions();
            refreshTodos();
        }
    }, [visible]);

    return (
        <ModalOverlay visible={visible} animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>{t('common.activity', 'Activity')}</Text>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Tabs */}
                        <View style={{ alignItems: 'center', marginBottom: 15 }}>
                            <View style={[styles.tabContainer, { backgroundColor: colors.surfaceHighlight }]}>
                                <TouchableOpacity
                                    style={[styles.tab, activeTab === 'analytics' && [styles.activeTab, { backgroundColor: colors.surface }]]}
                                    onPress={() => setActiveTab('analytics')}
                                >
                                    <BarChart2 size={16} color={activeTab === 'analytics' ? colors.primary : colors.textSecondary} />
                                    <Text style={[
                                        styles.tabText,
                                        { color: colors.textSecondary },
                                        activeTab === 'analytics' && { color: colors.primary }
                                    ]}>{t('activity.analytics', 'Analytics')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tab, activeTab === 'history' && [styles.activeTab, { backgroundColor: colors.surface }]]}
                                    onPress={() => setActiveTab('history')}
                                >
                                    <History size={16} color={activeTab === 'history' ? colors.primary : colors.textSecondary} />
                                    <Text style={[
                                        styles.tabText,
                                        { color: colors.textSecondary },
                                        activeTab === 'history' && { color: colors.primary }
                                    ]}>{t('activity.history', 'History')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {activeTab === 'analytics' ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Range Selector */}
                                <View style={[styles.rangeContainer, { backgroundColor: colors.surfaceHighlight }]}>
                                    {(['week', 'month', 'year'] as Range[]).map(r => (
                                        <TouchableOpacity
                                            key={r}
                                            style={[styles.rangeBtn, range === r && [styles.activeRangeBtn, { backgroundColor: colors.primary }]]}
                                            onPress={() => setRange(r)}
                                        >
                                            <Text style={[
                                                styles.rangeText,
                                                { color: colors.textSecondary },
                                                range === r && { color: '#fff' }
                                            ]}>{t(`common.period.${r}`)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Category Filter */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                                    <TouchableOpacity
                                        style={[styles.filterChip, { backgroundColor: colors.surfaceHighlight }, filterCategory === 'all' && [styles.activeFilterChip, { backgroundColor: colors.primary }]]}
                                        onPress={() => setFilterCategory('all')}
                                    >
                                        <Text style={[
                                            styles.filterChipText,
                                            { color: colors.textSecondary },
                                            filterCategory === 'all' && { color: '#fff' }
                                        ]}>{t('common.all', 'All')}</Text>
                                    </TouchableOpacity>
                                    {flatCategories.map(c => (
                                        <TouchableOpacity
                                            key={c.id}
                                            style={[
                                                styles.filterChip,
                                                { backgroundColor: colors.surfaceHighlight },
                                                filterCategory === c.id && { backgroundColor: c.color + '20', borderColor: c.color }
                                            ]}
                                            onPress={() => setFilterCategory(c.id)}
                                        >
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.color, marginEnd: 4 }} />
                                            <Text style={[
                                                styles.filterChipText,
                                                { color: colors.textSecondary },
                                                filterCategory === c.id && { color: c.color }
                                            ]}>{c.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <ActivitySummary totalTimeMinutes={totalTimeMinutes} completedCount={completedCount} />
                                <ActivityCharts chartData={chartData} pieData={pieData} range={range} />
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        ) : (
                            <ActivityHistory todos={todos} categories={categories} deleteTodo={deleteTodo} />
                        )}
                    </View>
                </View>
            </View>
        </ModalOverlay>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        paddingTop: 50,
        paddingBottom: 30,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        padding: 4,
        gap: 5,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
        gap: 4,
    },
    activeTab: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    closeBtn: {
        padding: 5,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
    },
    content: {
        flex: 1,
        padding: 15,
        paddingBottom: 0,
    },
    // Analytics Controls
    rangeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 4,
        marginBottom: 10,
        alignSelf: 'center',
    },
    rangeBtn: {
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 16,
    },
    activeRangeBtn: {
        backgroundColor: '#3b82f6',
    },
    rangeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    filterScroll: {
        flexDirection: 'row',
        marginBottom: 15,
        maxHeight: 40,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        marginEnd: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeFilterChip: {
        backgroundColor: '#3b82f6',
    },
    filterChipText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
});
