import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    Platform,
    ActionSheetIOS,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Play, Calendar, Clock, Tag, Repeat, CheckCircle, Save, Check, Trash2 } from 'lucide-react-native';
import { format, addDays } from 'date-fns';
import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';
import { Todo, Category, SRSProfile } from '@pomarc/shared';
import { useThemeColors } from '../../providers/ThemeProvider';
import { useMobileCategories } from '../../hooks/useMobileCategories';
import { useMobileSRS } from '../../hooks/useMobileSRS';
import { useMobileSessions } from '../../hooks/useMobileSessions';
import { CategoryTreePicker } from '../ui/CategoryTreePicker';

interface TodoDetailModalProps {
    visible: boolean;
    onClose: () => void;
    todo: Todo | null;
    onStartNow: (todo: Todo) => void;
    onDelete: (todoId: string) => void;
    onUpdate: (todo: Todo) => void;
    onRecord: (todo: Todo, duration: number) => void;
}

export const TodoDetailModal = ({
    visible,
    onClose,
    todo,
    onStartNow,
    onDelete,
    onUpdate,
    onRecord
}: TodoDetailModalProps) => {
    const { colors, isDark } = useThemeColors();
    const { t, i18n } = useTranslation();
    const locale = getDateFnsLocale(i18n.language);
    const { categories } = useMobileCategories();
    const { profiles: srsProfiles } = useMobileSRS();
    const { sessions } = useMobileSessions();

    // Edit States
    const [title, setTitle] = useState('');
    const [memo, setMemo] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [dueTime, setDueTime] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [srsInterval, setSrsInterval] = useState('');

    // Recording
    const [isRecording, setIsRecording] = useState(false);
    const [recordDuration, setRecordDuration] = useState('');

    // DateTimePicker
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);

    // Initialize when modal opens
    useEffect(() => {
        if (todo && visible) {
            setTitle(todo.title || '');
            setMemo(todo.memo || '');
            setCategoryId(todo.categoryId || '');
            setDueDate(todo.dueDate ? new Date(todo.dueDate) : null);
            setDueTime(todo.dueTime || '');
            setSrsInterval(todo.srsInterval || '');
            setIsRecording(false);
            setRecordDuration('');
        }
    }, [todo, visible]);

    // Flatten categories for selection
    const categoryOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        const traverse = (cats: Category[], prefix = '') => {
            cats.forEach(cat => {
                const label = prefix ? `${prefix} > ${cat.name}` : cat.name;
                options.push({ value: cat.id, label });
                if (cat.children) traverse(cat.children, label);
            });
        };
        traverse(categories);
        return options;
    }, [categories]);

    // Todo sessions
    const todoSessions = useMemo(() => {
        if (!todo) return [];
        return sessions.filter(s => s.todoId === todo.id);
    }, [sessions, todo]);

    const totalMinutes = Math.floor(todoSessions.reduce((acc, s) => acc + s.duration, 0) / 60);

    if (!visible || !todo) return null;

    const handleUpdate = () => {
        const updated: Todo = {
            ...todo,
            title: title.trim() || 'Untitled',
            memo: memo.trim() || undefined,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            srsInterval: srsInterval || undefined,
            updatedAt: new Date(),
        };
        onUpdate(updated);
        onClose();
    };

    const handleStartNow = () => {
        const updated: Todo = {
            ...todo,
            title: title.trim() || 'Untitled',
            memo: memo.trim() || undefined,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            srsInterval: srsInterval || undefined,
            updatedAt: new Date(),
        };
        onStartNow(updated);
        onClose();
    };

    const handlePostpone = () => {
        const currentDate = dueDate || new Date();
        const nextDate = addDays(currentDate, 1);
        onUpdate({ ...todo, dueDate: nextDate, updatedAt: new Date() });
        onClose();
    };

    const handleDelete = () => {
        Alert.alert(
            t('todo.deleteTask', 'Delete Task'),
            t('todo.deleteConfirm', 'Are you sure?'),
            [
                { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                { text: t('common.delete', 'Delete'), style: 'destructive', onPress: () => { onDelete(todo.id); onClose(); } },
            ]
        );
    };

    const handleRecordSubmit = () => {
        const d = parseInt(recordDuration, 10);
        if (isNaN(d) || d <= 0) {
            Alert.alert(t('common.error', 'Error'), t('todo.invalidDuration', 'Invalid duration'));
            return;
        }
        const updated: Todo = {
            ...todo,
            title: title.trim() || t('todo.noTitle', 'Untitled'),
            memo: memo.trim() || undefined,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            srsInterval: srsInterval || undefined,
            updatedAt: new Date(),
        };
        onRecord(updated, d * 60);
        setRecordDuration('');
        setIsRecording(false);
        onClose();
    };


    const showSRSPicker = () => {
        if (Platform.OS === 'ios') {
            const options = [t('todo.noSrs', 'No SRS'), ...srsProfiles.map(p => p.name), t('common.cancel', 'Cancel')];
            ActionSheetIOS.showActionSheetWithOptions(
                { options, cancelButtonIndex: options.length - 1 },
                (index) => {
                    if (index === 0) setSrsInterval('');
                    else if (index < options.length - 1) setSrsInterval(srsProfiles[index - 1].name);
                }
            );
        } else {
            const buttons = [
                { text: t('todo.noSrs', 'No SRS'), onPress: () => setSrsInterval('') },
                ...srsProfiles.map(p => ({ text: p.name, onPress: () => setSrsInterval(p.name) })),
                { text: t('common.cancel', 'Cancel'), style: 'cancel' as const },
            ];
            Alert.alert(t('srs.listTitle', 'Select SRS'), '', buttons);
        }
    };

    const selectedCategoryLabel = categoryOptions.find(c => c.value === categoryId)?.label || 'カテゴリなし';

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('todo.detailTitle', 'Task Details')}</Text>
                        <View style={styles.headerRight}>
                            <TouchableOpacity onPress={handleUpdate} style={styles.saveBtn}>
                                <Text style={[styles.saveBtnText, { color: colors.primary }]}>{t('common.save', 'Save')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                        {/* Title */}
                        <View style={styles.titleRow}>
                            {todo.completed ? (
                                <CheckCircle size={24} color={colors.success} />
                            ) : (
                                <View style={[styles.checkbox, { borderColor: colors.primary }]} />
                            )}
                            <TextInput
                                style={[styles.titleInput, { color: colors.text }, todo.completed && styles.completedText]}
                                value={title}
                                onChangeText={setTitle}
                                placeholder={t('todo.titleLabel', 'Task Title')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Memo */}
                        <TextInput
                            style={[styles.memoInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                            value={memo}
                            onChangeText={setMemo}
                            placeholder={t('todo.memoLabel', 'Memo')}
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Category */}
                        <TouchableOpacity
                            style={[styles.optionRow, { backgroundColor: colors.surface }]}
                            onPress={() => setIsCategoryPickerVisible(true)}
                        >
                            <Tag size={18} color={colors.icon} />
                            <Text style={[styles.optionText, { color: colors.text }]}>{selectedCategoryLabel}</Text>
                            <ChevronRight size={18} color={colors.textMuted} />
                        </TouchableOpacity>

                        {/* Date & Time */}
                        <View style={styles.dateTimeRow}>
                            <TouchableOpacity
                                style={[styles.dateBtn, { backgroundColor: colors.surface }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={18} color={colors.primary} />
                                <Text style={[styles.dateText, { color: colors.text }]}>
                                    {dueDate ? format(dueDate, t('common.dateFormat', 'MMM d (EEE)'), { locale }) : t('todo.datePlaceholder', 'Date')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.timeBtn, { backgroundColor: colors.surface }]}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Clock size={18} color={colors.primary} />
                                <Text style={[styles.dateText, { color: colors.text }]}>
                                    {dueTime || t('todo.startTime', 'Time')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* SRS */}
                        <TouchableOpacity
                            style={[styles.optionRow, { backgroundColor: colors.surface }]}
                            onPress={showSRSPicker}
                        >
                            <Repeat size={18} color={colors.success} />
                            <Text style={[styles.optionText, { color: colors.text }]}>{srsInterval || t('todo.noSrs', 'No SRS')}</Text>
                            <ChevronRight size={18} color={colors.textMuted} />
                        </TouchableOpacity>

                        {/* Stats */}
                        <View style={[styles.statsBox, { backgroundColor: colors.primaryLight }]}>
                            <Clock size={20} color={colors.primary} />
                            <View style={styles.statsContent}>
                                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>{t('todo.statsTitle', 'Learning Stats')}</Text>
                                <Text style={[styles.statsValue, { color: colors.text }]}>
                                    {todoSessions.length} {t('common.times', 'times')} ({totalMinutes}{t('common.units.minutes', 'm')})
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View style={[styles.actions, { borderTopColor: colors.border }]}>
                        {isRecording ? (
                            <View style={styles.recordRow}>
                                <TextInput
                                    style={[styles.recordInput, { backgroundColor: colors.surface, color: colors.text }]}
                                    value={recordDuration}
                                    onChangeText={setRecordDuration}
                                    placeholder={t('todo.durationPlaceholder', 'Duration (min)')}
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                    autoFocus
                                />
                                <TouchableOpacity style={styles.recordSubmitBtn} onPress={handleRecordSubmit}>
                                    <Save size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.recordCancelBtn, { backgroundColor: colors.surface }]} onPress={() => setIsRecording(false)}>
                                    <X size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={styles.recordBtn} onPress={() => setIsRecording(true)}>
                                        <CheckCircle size={20} color={colors.success} />
                                        <Text style={[styles.actionBtnText, { color: colors.success }]}>{t('todo.record', 'Record')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.startBtn} onPress={handleStartNow}>
                                        <Play size={18} color={colors.warning} fill={colors.warning} />
                                        <Text style={[styles.actionBtnText, { color: colors.warning }]}>{t('todo.start', 'Start')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.secondaryActions}>
                                    <TouchableOpacity style={[styles.postponeBtn, { backgroundColor: colors.surface }]} onPress={handlePostpone}>
                                        <Text style={[styles.postponeBtnText, { color: colors.textSecondary }]}>{t('todo.postpone', 'Postpone')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                                        <Trash2 size={16} color={colors.danger} />
                                        <Text style={[styles.deleteBtnText, { color: colors.danger }]}>{t('common.delete', 'Delete')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </View>

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={dueDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setDueDate(date);
                    }}
                />
            )}

            {/* Time Picker */}
            {showTimePicker && (
                <DateTimePicker
                    value={dueTime ? new Date(`2000-01-01T${dueTime}`) : new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                        setShowTimePicker(false);
                        if (date) setDueTime(format(date, 'HH:mm'));
                    }}
                />
            )}

            {/* Category Picker Modal */}
            <CategoryTreePicker
                visible={isCategoryPickerVisible}
                onClose={() => setIsCategoryPickerVisible(false)}
                categories={categories}
                selectedId={categoryId}
                onSelect={(id) => setCategoryId(id)}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    saveBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    saveBtnText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        gap: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
    },
    titleInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    memoInput: {
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    optionText: {
        flex: 1,
        fontSize: 14,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    dateBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    timeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    dateText: {
        fontSize: 14,
    },
    statsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    statsContent: {
        flex: 1,
    },
    statsLabel: {
        fontSize: 12,
    },
    statsValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    actions: {
        padding: 16,
        borderTopWidth: 1,
        gap: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    recordBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        gap: 8,
    },
    startBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        gap: 8,
    },
    actionBtnText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: 10,
    },
    postponeBtn: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
    },
    postponeBtnText: {
        fontSize: 13,
        fontWeight: '500',
    },
    deleteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 12,
        gap: 6,
    },
    deleteBtnText: {
        fontSize: 13,
        fontWeight: '500',
    },
    recordRow: {
        flexDirection: 'row',
        gap: 10,
    },
    recordInput: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        fontSize: 16,
    },
    recordSubmitBtn: {
        backgroundColor: '#22c55e',
        padding: 14,
        borderRadius: 12,
    },
    recordCancelBtn: {
        padding: 14,
        borderRadius: 12,
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        width: '80%',
        maxHeight: '60%',
        borderRadius: 16,
        padding: 16,
    },
    pickerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    pickerScroll: {
        maxHeight: 300,
    },
    pickerItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    pickerItemText: {
        fontSize: 15,
    },
});