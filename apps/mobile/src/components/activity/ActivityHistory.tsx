import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ChevronDown, ChevronRight, Layers, CheckCircle } from 'lucide-react-native';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Todo, Category } from '@studytodo/shared';
import { useTheme } from '../../providers/ThemeProvider';
import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useActivityHistory } from '../../hooks/useActivityHistory';

interface ActivityHistoryProps {
    todos: Todo[];
    categories: Category[];
    deleteTodo: (id: string) => Promise<void>;
}

export const ActivityHistory = ({ todos, categories, deleteTodo }: ActivityHistoryProps) => {
    const { colors, isDark } = useTheme();
    const { t, i18n } = useTranslation();
    const locale = getDateFnsLocale(i18n.language);

    const {
        historyFilterStatus,
        setHistoryFilterStatus,
        isSelectionMode,
        setIsSelectionMode,
        selectedIds,
        expandedGroups,
        historyList,
        toggleSelection,
        toggleGroup,
        toggleGroupSelection,
        handleBulkDelete
    } = useActivityHistory({ todos, categories, deleteTodo });

    return (
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
                                            <View style={{ flex: 1, marginStart: 8 }}>
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
                                                    <Text style={[styles.historyMeta, { color: colors.textMuted }]}>
                                                        {todo.dueDate
                                                            ? format(new Date(todo.dueDate), 'MM/dd (EEE)', { locale })
                                                            : format(new Date(todo.createdAt), 'MM/dd')}
                                                    </Text>
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
    );
};

const styles = StyleSheet.create({
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
        marginEnd: 8,
        gap: 4,
    },
    groupBadgeText: {
        fontSize: 10,
        color: '#7e22ce',
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
        marginEnd: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
});
