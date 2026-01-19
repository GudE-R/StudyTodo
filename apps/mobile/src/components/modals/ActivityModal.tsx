import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, FlatList, Alert, useWindowDimensions } from 'react-native';
import { X, BarChart2, History, Filter, Trash2, ChevronDown, ChevronRight, Layers, CheckCircle, Share2 } from 'lucide-react-native';
import { Svg, Rect, Text as SvgText, G, Path } from 'react-native-svg';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, isWithinInterval, isSameDay, getMonth, getYear } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';
import { Session, Todo, Category } from '@pomarc/shared';
import { useMobileSessions } from '../../hooks/useMobileSessions';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileCategories } from '../../hooks/useMobileCategories';
import { useTheme } from '../../providers/ThemeProvider';
import { captureRef } from 'react-native-view-shot';
import { shareAsync } from 'expo-sharing';
import { calculateStreak } from '@pomarc/shared';
import { ShareCard } from '../activity/ShareCard';

interface ActivityModalProps {
    visible: boolean;
    onClose: () => void;
}

type Tab = "analytics" | "history" | "share";
type Range = "week" | "month" | "year";

// Helper for Pie Chart
const CATEGORY_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"
];

const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
};

export const ActivityModal = ({ visible, onClose }: ActivityModalProps) => {
    const { sessions, refreshSessions } = useMobileSessions();
    const { todos, refreshTodos, deleteTodo } = useMobileTodos();
    const { categories } = useMobileCategories();
    const { colors, isDark } = useTheme();
    const { width } = useWindowDimensions();
    const { t, i18n } = useTranslation();
    const locale = getDateFnsLocale(i18n.language);

    const [activeTab, setActiveTab] = useState<Tab>("analytics");
    const [range, setRange] = useState<Range>("week");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [historyFilterCategory, setHistoryFilterCategory] = useState<string>("all");
    const [historyFilterStatus, setHistoryFilterStatus] = useState<"all" | "completed" | "incomplete">("all");

    const shareRef = useRef<View>(null);
    const streakStats = useMemo(() => calculateStreak(sessions), [sessions]);

    const handleShare = async () => {
        try {
            const uri = await captureRef(shareRef, {
                format: 'png',
                quality: 1,
            });
            await shareAsync(uri);
        } catch (e) {
            console.error(e);
            Alert.alert(t('common.error'), t('activity.shareError', 'Failed to share'));
        }
    };

    // History State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (visible) {
            refreshSessions();
            refreshTodos();
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            setExpandedGroups(new Set());
        }
    }, [visible]);

    // Helpers
    const flattenCategories = (cats: Category[]): Category[] => {
        let flat: Category[] = [];
        cats.forEach(c => {
            flat.push(c);
            if (c.children) flat = [...flat, ...flattenCategories(c.children)];
        });
        return flat;
    };
    const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

    // --- Analytics Logic ---
    const chartData = useMemo(() => {
        const now = new Date();
        let data: { label: string; value: number; date?: Date }[] = [];

        let start: Date, end: Date;

        if (range === "week") {
            start = startOfWeek(now, { weekStartsOn: 1 });
            end = endOfWeek(now, { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start, end });
            data = days.map(d => ({ label: format(d, 'EEE', { locale }), value: 0, date: d }));
        } else if (range === "month") {
            start = startOfMonth(now);
            end = endOfMonth(now);
            const days = eachDayOfInterval({ start, end });
            // Show fewer labels for month view? Or just 'd'
            data = days.map(d => ({ label: format(d, 'd'), value: 0, date: d }));
        } else {
            start = startOfYear(now);
            end = endOfYear(now);
            const months = eachMonthOfInterval({ start, end });
            data = months.map(d => ({ label: format(d, 'MMM', { locale }), value: 0, date: d }));
        }

        sessions.forEach(session => {
            const date = new Date(session.createdAt);
            if (!isWithinInterval(date, { start, end })) return;

            if (filterCategory !== 'all') {
                const todo = todos.find(t => t.id === session.todoId);
                if (!todo || todo.categoryId !== filterCategory) return;
            }

            if (range === "year") {
                const idx = getMonth(date);
                if (data[idx]) data[idx].value += session.duration / 60;
            } else {
                const dayLabel = range === "week" ? format(date, 'EEE', { locale }) : format(date, 'd');
                const idx = data.findIndex(d => d.label === dayLabel);
                if (idx !== -1) data[idx].value += session.duration / 60;
            }
        });

        return data;
    }, [sessions, todos, range, filterCategory]);

    const pieData = useMemo(() => {
        const now = new Date();
        let start: Date, end: Date;
        if (range === "week") { start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); }
        else if (range === "month") { start = startOfMonth(now); end = endOfMonth(now); }
        else { start = startOfYear(now); end = endOfYear(now); }

        const distribution: { [key: string]: { name: string, value: number, color: string } } = {};

        sessions.forEach(session => {
            const date = new Date(session.createdAt);
            if (!isWithinInterval(date, { start, end })) return;

            // Category Filter also applies to PieChart? In Web, Analytics Category filter applies to everything. 
            // If filterCategory is set, PieChart will show only that category (100%).
            if (filterCategory !== 'all') {
                const todo = todos.find(t => t.id === session.todoId);
                if (!todo || todo.categoryId !== filterCategory) return;
            }

            const todo = todos.find(t => t.id === session.todoId);
            const catId = todo?.categoryId || "none";
            const category = flatCategories.find(c => c.id === catId);
            const name = category?.name || (catId === "none" ? t('todo.noCategory', 'No Category') : "Unknown");
            const color = category?.color || "#9ca3af";

            if (!distribution[catId]) {
                distribution[catId] = { name, value: 0, color };
            }
            distribution[catId].value += session.duration / 60;
        });

        return Object.values(distribution)
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);

    }, [sessions, todos, range, filterCategory, flatCategories]);

    const totalTimeMinutes = useMemo(() => chartData.reduce((acc, d) => acc + d.value, 0), [chartData]);
    const totalHours = Math.floor(totalTimeMinutes / 60);
    const totalMins = Math.floor(totalTimeMinutes % 60);

    const completedCount = useMemo(() => {
        const now = new Date();
        let start: Date, end: Date;
        if (range === "week") { start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); }
        else if (range === "month") { start = startOfMonth(now); end = endOfMonth(now); }
        else { start = startOfYear(now); end = endOfYear(now); }

        return todos.filter(t => {
            if (!t.completed) return false;
            if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
            return isWithinInterval(new Date(t.createdAt), { start, end });
        }).length;
    }, [todos, range, filterCategory]);


    // --- History Logic ---
    const historyList = useMemo(() => {
        const filtered = todos.filter(t => {
            if (historyFilterCategory !== 'all' && t.categoryId !== historyFilterCategory) return false;
            if (historyFilterStatus === 'completed' && !t.completed) return false;
            if (historyFilterStatus === 'incomplete' && t.completed) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const items: (Todo | { type: 'group', id: string, todos: Todo[], title: string, createdAt: Date, completedCount: number })[] = [];
        const seenGroups = new Set<string>();

        filtered.forEach(todo => {
            if (todo.srsGroupId) {
                if (!seenGroups.has(todo.srsGroupId)) {
                    seenGroups.add(todo.srsGroupId);
                    const groupTodos = filtered.filter(t => t.srsGroupId === todo.srsGroupId)
                        .sort((a, b) => {
                            if (!a.dueDate) return 1;
                            if (!b.dueDate) return -1;
                            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                        });
                    items.push({
                        type: 'group',
                        id: todo.srsGroupId,
                        todos: groupTodos,
                        title: groupTodos[0].title,
                        createdAt: new Date(groupTodos[0].createdAt),
                        completedCount: groupTodos.filter(t => t.completed).length
                    });
                }
            } else {
                items.push(todo);
            }
        });
        return items;
    }, [todos, historyFilterCategory, historyFilterStatus]);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleGroup = (id: string) => {
        const next = new Set(expandedGroups);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedGroups(next);
    };

    const toggleGroupSelection = (groupTodos: Todo[]) => {
        const next = new Set(selectedIds);
        const allSelected = groupTodos.every(t => selectedIds.has(t.id));

        if (allSelected) {
            groupTodos.forEach(t => next.delete(t.id));
        } else {
            groupTodos.forEach(t => next.add(t.id));
        }
        setSelectedIds(next);
    }

    const handleBulkDelete = () => {
        Alert.alert(
            t('activity.deleteTitle', "Delete Tasks"),
            t('activity.deleteTodoConfirm', `Are you sure you want to delete {count} tasks?`).replace('{count}', selectedIds.size.toString()),
            [
                { text: t('common.cancel', "Cancel"), style: "cancel" },
                {
                    text: t('common.delete', "Delete"),
                    style: "destructive",
                    onPress: async () => {
                        const ids = Array.from(selectedIds);
                        for (const id of ids) {
                            await deleteTodo(id);
                        }
                        setSelectedIds(new Set());
                        setIsSelectionMode(false);
                    }
                }
            ]
        );
    };

    // Components
    const BarChartComponent = () => {
        const barWidth = (width - 80) / chartData.length * 0.6;
        const maxVal = Math.max(...chartData.map(d => d.value), 10);
        const chartHeight = 150;
        const showLabel = (index: number) => {
            if (range !== "month") return true;
            // For month view (30-31 days), show every 5th label
            return index % 5 === 0;
        };

        return (
            <View style={{ height: 200, marginTop: 10 }}>
                <Svg height="100%" width="100%">
                    {chartData.map((d, i) => {
                        const barHeight = (d.value / maxVal) * chartHeight;
                        const x = i * ((width - 80) / chartData.length) + 10;
                        const y = chartHeight - barHeight + 20;

                        return (
                            <G key={i}>
                                <Rect x={x} y={y} width={barWidth} height={barHeight} fill={colors.primary} rx={4} />
                                {showLabel(i) && (
                                    <SvgText x={x + barWidth / 2} y={chartHeight + 40} fontSize="10" fill={colors.textSecondary} textAnchor="middle">{d.label}</SvgText>
                                )}
                                {d.value > 0 && (
                                    <SvgText x={x + barWidth / 2} y={y - 5} fontSize="10" fill={colors.textSecondary} textAnchor="middle">{Math.round(d.value)}</SvgText>
                                )}
                            </G>
                        );
                    })}
                </Svg>
            </View>
        );
    };

    const PieChartComponent = () => {
        const radius = 60;
        let cumulativePercent = 0;
        const total = pieData.reduce((acc, d) => acc + d.value, 0);

        if (total === 0) return <View style={styles.noDataContainer}><Text style={[styles.noDataText, { color: colors.textMuted }]}>No Data</Text></View>;

        return (
            <View style={styles.pieContainer}>
                <Svg height={160} width={160} viewBox="-1 -1 2 2" style={{ transform: [{ rotate: '-90deg' }] }}>
                    {pieData.map((slice, i) => {
                        const percent = slice.value / total;
                        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                        cumulativePercent += percent;
                        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                        const largeArcFlag = percent > .5 ? 1 : 0;
                        const pathData = [
                            `M ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                            `L 0 0`,
                        ].join(' ');

                        return <Path key={i} d={pathData} fill={slice.color} />;
                    })}
                </Svg>
                <View style={styles.legendContainer}>
                    {pieData.slice(0, 5).map((d, i) => (
                        <View key={i} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: d.color }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]} numberOfLines={1}>{d.name} ({Math.round(d.value)}m)</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
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
                                <TouchableOpacity
                                    style={[styles.tab, activeTab === 'share' && [styles.activeTab, { backgroundColor: colors.surface }]]}
                                    onPress={() => setActiveTab('share')}
                                >
                                    <Share2 size={16} color={activeTab === 'share' ? colors.primary : colors.textSecondary} />
                                    <Text style={[
                                        styles.tabText,
                                        { color: colors.textSecondary },
                                        activeTab === 'share' && { color: colors.primary }
                                    ]}>{t('activity.share', 'Share')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {activeTab === 'share' ? (
                            <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 20 }}>
                                <View ref={shareRef} collapsable={false} style={{ backgroundColor: colors.background, padding: 10, borderRadius: 20 }}>
                                    <ShareCard
                                        sessions={sessions}
                                        todos={todos}
                                        categories={categories}
                                        streak={streakStats}
                                        totalDuration={totalTimeMinutes}
                                        completedCount={completedCount}
                                    />
                                </View>
                                <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.primary }]} onPress={handleShare}>
                                    <Share2 size={20} color="#fff" />
                                    <Text style={styles.shareBtnText}>{t('activity.shareAction', 'Share Activity')}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        ) : activeTab === 'analytics' ? (
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

                                {/* Category Filter (Simplified Dropdown) */}
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
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.color, marginRight: 4 }} />
                                            <Text style={[
                                                styles.filterChipText,
                                                { color: colors.textSecondary },
                                                filterCategory === c.id && { color: c.color }
                                            ]}>{c.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {/* Summary */}
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

                                {/* Charts */}
                                <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <Text style={[styles.chartTitle, { color: colors.text }]}>{t('activity.trend', 'Trend (min)')}</Text>
                                    <BarChartComponent />
                                </View>
                                <View style={[styles.chartCard, { marginTop: 15, backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <Text style={[styles.chartTitle, { color: colors.text }]}>{t('activity.distribution', 'Distribution')}</Text>
                                    <PieChartComponent />
                                </View>
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        ) : (
                            <View style={{ flex: 1 }}>
                                {/* Filters */}
                                <View style={styles.historyFilters}>
                                    <View style={{ flexDirection: 'row', gap: 5 }}>
                                        <TouchableOpacity
                                            style={[styles.filterBtn, { backgroundColor: colors.surfaceHighlight }, historyFilterStatus === 'all' && { backgroundColor: isDark ? colors.surface : '#eff6ff' }]}
                                            onPress={() => setHistoryFilterStatus(prev => prev === 'all' ? 'completed' : prev === 'completed' ? 'incomplete' : 'all')}
                                        >
                                            <Text style={[styles.filterBtnText, { color: colors.textSecondary }, historyFilterStatus !== 'all' && { color: colors.primary }]}>
                                                {historyFilterStatus === 'all' ? t('activity.allStatus') : historyFilterStatus === 'completed' ? t('common.done') : t('common.todo')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    {isSelectionMode ? (
                                        <View style={styles.selectionActions}>
                                            <TouchableOpacity onPress={() => setIsSelectionMode(false)}>
                                                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={handleBulkDelete} disabled={selectedIds.size === 0}>
                                                <Text style={[styles.deleteText, { color: colors.danger }, selectedIds.size === 0 && { opacity: 0.5 }]}>{t('common.delete')} ({selectedIds.size})</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity onPress={() => setIsSelectionMode(true)}>
                                            <Text style={[styles.selectText, { color: colors.primary }]}>{t('common.select')}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <FlatList
                                    data={historyList}
                                    keyExtractor={item => 'type' in item ? item.id : item.id}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    renderItem={({ item }) => {
                                        if ('type' in item && item.type === 'group') {
                                            const isExpanded = expandedGroups.has(item.id);
                                            const isGroupSelected = item.todos.length > 0 && item.todos.every(t => selectedIds.has(t.id));

                                            return (
                                                <View style={[styles.groupContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                                                    <View style={styles.groupHeader}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                            {isSelectionMode && (
                                                                <TouchableOpacity
                                                                    style={[styles.checkbox, { borderColor: colors.border }, isGroupSelected && [styles.checkboxChecked, { backgroundColor: colors.primary, borderColor: colors.primary }]]}
                                                                    onPress={() => toggleGroupSelection(item.todos)}
                                                                >
                                                                    {isGroupSelected && <CheckCircle size={14} color="#fff" />}
                                                                </TouchableOpacity>
                                                            )}
                                                            <TouchableOpacity onPress={() => toggleGroup(item.id)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                                <View style={[styles.groupBadge, { backgroundColor: isDark ? '#3b0764' : '#e9d5ff' }]}>
                                                                    <Layers size={12} color={isDark ? '#d8b4fe' : '#7e22ce'} />
                                                                    <Text style={[styles.groupBadgeText, { color: isDark ? '#d8b4fe' : '#7e22ce' }]}>{item.todos.length}</Text>
                                                                </View>
                                                                <View style={{ flex: 1, marginLeft: 8 }}>
                                                                    <Text style={[styles.groupTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                                                                    <Text style={[styles.groupMeta, { color: colors.textSecondary }]}>{item.completedCount}/{item.todos.length} {t('common.done')} • {format(item.createdAt, 'MM/dd')}</Text>
                                                                </View>
                                                                {isExpanded ? <ChevronDown size={18} color={colors.textSecondary} /> : <ChevronRight size={18} color={colors.textSecondary} />}
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                    {isExpanded && (
                                                        <View style={[styles.groupItems, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                                                            {item.todos.map(todo => (
                                                                <TouchableOpacity
                                                                    key={todo.id}
                                                                    style={[styles.historyItem, { backgroundColor: colors.background, borderBottomColor: colors.border }, selectedIds.has(todo.id) && [styles.selectedItem, { backgroundColor: isDark ? colors.surfaceHighlight : '#f0f9ff' }]]}
                                                                    onPress={() => isSelectionMode && toggleSelection(todo.id)}
                                                                    activeOpacity={isSelectionMode ? 0.7 : 1}
                                                                >
                                                                    {isSelectionMode && (
                                                                        <View style={[styles.checkbox, { borderColor: colors.border }, selectedIds.has(todo.id) && [styles.checkboxChecked, { backgroundColor: colors.primary, borderColor: colors.primary }]]} >
                                                                            {selectedIds.has(todo.id) && <CheckCircle size={14} color="#fff" />}
                                                                        </View>
                                                                    )}
                                                                    <View style={styles.historyContent}>
                                                                        <Text style={[styles.historyTitle, { color: colors.text }, todo.completed && styles.completedTitle]}>{todo.title}</Text>
                                                                        <Text style={[styles.historyMeta, { color: colors.textMuted }]}>{format(new Date(todo.createdAt), 'MM/dd HH:mm')}</Text>
                                                                    </View>
                                                                    <View style={[styles.statusBadge, todo.completed ? [styles.statusDone, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }] : [styles.statusTodo, { backgroundColor: colors.surfaceHighlight }]]}>
                                                                        <Text style={[styles.statusText, { color: todo.completed ? (isDark ? '#4ade80' : '#166534') : colors.textSecondary }]}>{todo.completed ? t('common.done') : t('common.todo')}</Text>
                                                                    </View>
                                                                </TouchableOpacity>
                                                            ))}
                                                        </View>
                                                    )}
                                                </View>
                                            );
                                        }

                                        const todo = item as Todo;
                                        return (
                                            <TouchableOpacity
                                                style={[styles.historyItem, { backgroundColor: colors.background, borderBottomColor: colors.border }, selectedIds.has(todo.id) && [styles.selectedItem, { backgroundColor: isDark ? colors.surfaceHighlight : '#f0f9ff' }]]}
                                                onPress={() => isSelectionMode && toggleSelection(todo.id)}
                                                activeOpacity={isSelectionMode ? 0.7 : 1}
                                            >
                                                {isSelectionMode && (
                                                    <View style={[styles.checkbox, { borderColor: colors.border }, selectedIds.has(todo.id) && [styles.checkboxChecked, { backgroundColor: colors.primary, borderColor: colors.primary }]]} >
                                                        {selectedIds.has(todo.id) && <CheckCircle size={14} color="#fff" />}
                                                    </View>
                                                )}
                                                <View style={styles.historyContent}>
                                                    <Text style={[styles.historyTitle, { color: colors.text }, todo.completed && styles.completedTitle]}>
                                                        {todo.title}
                                                    </Text>
                                                    <Text style={[styles.historyMeta, { color: colors.textMuted }]}>
                                                        {format(new Date(todo.createdAt), 'MM/dd HH:mm')}
                                                    </Text>
                                                </View>
                                                {!isSelectionMode && (
                                                    <View style={[styles.statusBadge, todo.completed ? [styles.statusDone, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }] : [styles.statusTodo, { backgroundColor: colors.surfaceHighlight }]]}>
                                                        <Text style={[styles.statusText, { color: todo.completed ? (isDark ? '#4ade80' : '#166534') : colors.textSecondary }]}>{todo.completed ? t('common.done') : t('common.todo')}</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        )
                                    }}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
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
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
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
    activeTabText: {
        color: '#2563eb',
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
    // Analytics
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
    activeRangeText: {
        color: '#fff',
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
        marginRight: 8,
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
    activeFilterChipText: {
        color: '#fff',
    },
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
        marginLeft: 2,
        marginRight: 6,
    },
    chartCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 15,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    // Pie Chart
    pieContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    legendContainer: {
        flex: 1,
        marginLeft: 20,
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
        color: '#64748b',
        flex: 1,
    },
    noDataContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataText: {
        color: '#94a3b8',
    },
    // History
    historyFilters: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    filterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#f8fafc',
    },
    activeFilterBtn: {
        backgroundColor: '#eff6ff',
    },
    filterBtnText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    selectText: {
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '600',
    },
    selectionActions: {
        flexDirection: 'row',
        gap: 15,
    },
    cancelText: {
        color: '#64748b',
    },
    deleteText: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
    // Grouping
    groupContainer: {
        marginBottom: 10,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    groupHeader: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    groupBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e9d5ff',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
        gap: 4,
    },
    groupBadgeText: {
        fontSize: 10,
        color: '#7e22ce',
        fontWeight: 'bold',
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        gap: 8,
        marginTop: 30,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    shareBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    groupMeta: {
        fontSize: 10,
        color: '#64748b',
    },
    groupItems: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    selectedItem: {
        backgroundColor: '#f0f9ff',
    },
    historyContent: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    completedTitle: {
        color: '#94a3b8',
        textDecorationLine: 'line-through',
    },
    historyMeta: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusDone: {
        backgroundColor: '#dcfce7',
    },
    statusTodo: {
        backgroundColor: '#f1f5f9',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#166534',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
});
