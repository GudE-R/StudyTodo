import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, FlatList, Alert, useWindowDimensions } from 'react-native';
import { X, BarChart2, History, Filter, Trash2, TrendingUp, Calendar, CheckCircle } from 'lucide-react-native';
import { Svg, Rect, Text as SvgText, G } from 'react-native-svg';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, isWithinInterval, isSameDay, getMonth, getYear, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Session, Todo, Category } from '@pomarc/shared';
import { useMobileSessions } from '../../hooks/useMobileSessions';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileCategories } from '../../hooks/useMobileCategories';

interface ActivityModalProps {
    visible: boolean;
    onClose: () => void;
}

type Tab = "analytics" | "history";
type Range = "week" | "month" | "year";

export const ActivityModal = ({ visible, onClose }: ActivityModalProps) => {
    const { sessions, refreshSessions } = useMobileSessions();
    const { todos, refreshTodos, deleteTodo } = useMobileTodos();
    const { categories } = useMobileCategories();
    const { width } = useWindowDimensions();

    const [activeTab, setActiveTab] = useState<Tab>("analytics");
    const [range, setRange] = useState<Range>("week");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    // History State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (visible) {
            refreshSessions();
            refreshTodos();
            setSelectedIds(new Set());
            setIsSelectionMode(false);
        }
    }, [visible]);

    // Helpers
    const flattenCategories = (cats: Category[]): { id: string, name: string }[] => {
        let flat: { id: string, name: string }[] = [];
        cats.forEach(c => {
            flat.push({ id: c.id, name: c.name });
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
            data = days.map(d => ({ label: format(d, 'EEE', { locale: ja }), value: 0, date: d }));
        } else if (range === "month") {
            start = startOfMonth(now);
            end = endOfMonth(now);
            const days = eachDayOfInterval({ start, end });
            // Show only every 5 days or so for cleaner axis? or just all
            data = days.map(d => ({ label: format(d, 'd'), value: 0, date: d }));
        } else {
            start = startOfYear(now);
            end = endOfYear(now);
            const months = eachMonthOfInterval({ start, end });
            data = months.map(d => ({ label: format(d, 'M月'), value: 0, date: d }));
        }

        // Aggregate Data
        sessions.forEach(session => {
            const date = new Date(session.createdAt);
            if (!isWithinInterval(date, { start, end })) return;

            // Category Filter
            if (filterCategory !== 'all') {
                const todo = todos.find(t => t.id === session.todoId); // Optimizable?
                if (!todo || todo.categoryId !== filterCategory) return;
            }

            if (range === "year") {
                const idx = getMonth(date);
                if (data[idx]) data[idx].value += session.duration / 60;
            } else {
                const dayLabel = range === "week" ? format(date, 'EEE', { locale: ja }) : format(date, 'd');
                const idx = data.findIndex(d => d.label === dayLabel); // Simple matching
                // More robust: match date strings
                // For 'month', label is 'd', so multiple months could clash if not careful, but we filtered interval.
                if (idx !== -1) data[idx].value += session.duration / 60;
            }
        });

        return data;
    }, [sessions, todos, range, filterCategory]);

    const totalTimeMinutes = useMemo(() => chartData.reduce((acc, d) => acc + d.value, 0), [chartData]);
    const totalHours = Math.floor(totalTimeMinutes / 60);
    const totalMins = Math.floor(totalTimeMinutes % 60);

    const completedCount = useMemo(() => {
        // Simple filter based on range start/end logic duplicated from above or simplified
        // Let's just filter simply
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
        return todos.filter(t => {
            if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
            // Maybe filter status? Web has status filter. Just show all for now or add toggle.
            // Let's simplified to just finished tasks + created tasks? 
            // Web shows "All / Completed / Incomplete".
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [todos, filterCategory]);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkDelete = () => {
        Alert.alert(
            "Delete Tasks",
            `Are you sure you want to delete ${selectedIds.size} tasks?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
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

    // Chart Component
    const Chart = () => {
        const barWidth = (width - 60) / chartData.length * 0.6;
        const maxVal = Math.max(...chartData.map(d => d.value), 10); // Min 10
        const chartHeight = 200;

        return (
            <View style={{ height: 250, marginTop: 20 }}>
                <Svg height="100%" width="100%">
                    {chartData.map((d, i) => {
                        const barHeight = (d.value / maxVal) * chartHeight;
                        const x = i * ((width - 60) / chartData.length) + 10;
                        const y = chartHeight - barHeight + 20;

                        return (
                            <G key={i}>
                                <Rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill="#3b82f6"
                                    rx={4}
                                />
                                <SvgText
                                    x={x + barWidth / 2}
                                    y={chartHeight + 40}
                                    fontSize="10"
                                    fill="#666"
                                    textAnchor="middle"
                                >
                                    {d.label}
                                </SvgText>
                                {d.value > 0 && (
                                    <SvgText
                                        x={x + barWidth / 2}
                                        y={y - 5}
                                        fontSize="10"
                                        fill="#666"
                                        textAnchor="middle"
                                    >
                                        {Math.round(d.value)}
                                    </SvgText>
                                )}
                            </G>
                        );
                    })}
                </Svg>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>Activity</Text>
                            <View style={styles.tabContainer}>
                                <TouchableOpacity
                                    style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
                                    onPress={() => setActiveTab('analytics')}
                                >
                                    <BarChart2 size={16} color={activeTab === 'analytics' ? '#2563eb' : '#64748b'} />
                                    <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>Analytics</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                                    onPress={() => setActiveTab('history')}
                                >
                                    <History size={16} color={activeTab === 'history' ? '#2563eb' : '#64748b'} />
                                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {activeTab === 'analytics' ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Range Selector */}
                                <View style={styles.rangeContainer}>
                                    {(['week', 'month', 'year'] as Range[]).map(r => (
                                        <TouchableOpacity
                                            key={r}
                                            style={[styles.rangeBtn, range === r && styles.activeRangeBtn]}
                                            onPress={() => setRange(r)}
                                        >
                                            <Text style={[styles.rangeText, range === r && styles.activeRangeText]}>
                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Summary Cards */}
                                <View style={styles.summaryGrid}>
                                    <View style={styles.card}>
                                        <Text style={styles.cardLabel}>Focus Time</Text>
                                        <View style={styles.cardValueRow}>
                                            <Text style={styles.cardValue}>{totalHours}</Text>
                                            <Text style={styles.cardUnit}>h</Text>
                                            <Text style={styles.cardValue}>{totalMins}</Text>
                                            <Text style={styles.cardUnit}>m</Text>
                                        </View>
                                    </View>
                                    <View style={styles.card}>
                                        <Text style={styles.cardLabel}>Completed</Text>
                                        <View style={styles.cardValueRow}>
                                            <Text style={styles.cardValue}>{completedCount}</Text>
                                            <Text style={styles.cardUnit}>tasks</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Chart */}
                                <View style={styles.chartCard}>
                                    <Text style={styles.chartTitle}>Trend (min)</Text>
                                    <Chart />
                                </View>
                            </ScrollView>
                        ) : (
                            <View style={{ flex: 1 }}>
                                {/* History Filters & Actions */}
                                <View style={styles.historyActions}>
                                    <View style={styles.filters}>
                                        <Filter size={14} color="#666" />
                                        <Text style={styles.filterText}>Recent Tasks</Text>
                                    </View>

                                    {isSelectionMode ? (
                                        <View style={styles.selectionActions}>
                                            <TouchableOpacity onPress={() => setIsSelectionMode(false)}>
                                                <Text style={styles.cancelText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={handleBulkDelete} disabled={selectedIds.size === 0}>
                                                <Text style={[styles.deleteText, selectedIds.size === 0 && { opacity: 0.5 }]}>
                                                    Delete ({selectedIds.size})
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity onPress={() => setIsSelectionMode(true)}>
                                            <Text style={styles.selectText}>Select</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <FlatList
                                    data={historyList}
                                    keyExtractor={item => item.id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.historyItem, selectedIds.has(item.id) && styles.selectedItem]}
                                            onPress={() => isSelectionMode && toggleSelection(item.id)}
                                            activeOpacity={isSelectionMode ? 0.7 : 1}
                                        >
                                            {isSelectionMode && (
                                                <View style={[styles.checkbox, selectedIds.has(item.id) && styles.checkboxChecked]}>
                                                    {selectedIds.has(item.id) && <CheckCircle size={14} color="#fff" />}
                                                </View>
                                            )}
                                            <View style={styles.historyContent}>
                                                <Text style={[styles.historyTitle, item.completed && styles.completedTitle]}>
                                                    {item.title}
                                                </Text>
                                                <Text style={styles.historyMeta}>
                                                    {format(new Date(item.createdAt), 'MM/dd HH:mm')}
                                                </Text>
                                            </View>
                                            {!isSelectionMode && (
                                                <View style={[styles.statusBadge, item.completed ? styles.statusDone : styles.statusTodo]}>
                                                    <Text style={styles.statusText}>{item.completed ? 'DONE' : 'TODO'}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    )}
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
        justifyContent: 'center', // Center modal on screen? Or full screen sheet
        // Web modal was centered. Let's do bottom sheet style or centered card.
        // Let's do full screen-ish card with padding
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
    },
    // Analytics
    rangeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 4,
        marginBottom: 20,
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
        height: 350,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    // History
    historyActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    filters: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
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
        color: '#166534', // or gray for todo
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
