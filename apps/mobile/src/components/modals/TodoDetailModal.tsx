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
import { X, Play, Calendar, Clock, Tag, Repeat, CheckCircle, Save, Check, Trash2, ChevronRight, CalendarRange } from 'lucide-react-native';
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
    onUpdate: (todo: Todo, options?: { applySrs?: boolean }) => void;
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
    const [content, setContent] = useState('');
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
            const initialContent = todo.memo ? `${todo.title}\n${todo.memo}` : (todo.title || '');
            setContent(initialContent);
            setCategoryId(todo.categoryId || '');
            setDueDate(todo.dueDate ? new Date(todo.dueDate) : null);
            setDueTime(todo.dueTime || '');
            setSrsInterval(todo.srsInterval || '');
            setIsRecording(false);
            setRecordDuration('');
        }
    }, [todo, visible]);

    // parseContent logic like Web version
    const parseContent = () => {
        const lines = content.split('\n');
        const rawTitle = lines[0].trim();
        const notes = lines.slice(1).join('\n').trim();

        let effectiveTitle = rawTitle;
        if (!effectiveTitle && categoryId) {
            // If title is empty but category is selected, use category name as title
            const cat = categoryOptions.find(c => c.value === categoryId);
            if (cat) effectiveTitle = cat.label.split(' > ').pop() || cat.label;
        }

        return {
            title: effectiveTitle || t('todo.noTitle', 'Untitled'),
            memo: notes || undefined
        };
    };

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
        const { title: parsedTitle, memo: parsedMemo } = parseContent();
        const updated: Todo = {
            ...todo,
            title: parsedTitle,
            memo: parsedMemo,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            srsInterval: srsInterval || undefined,
            updatedAt: new Date(),
        };

        // SRS Logic: Check if newly added or changed
        if (srsInterval && srsInterval !== todo.srsInterval && srsInterval !== '') {
            Alert.alert(
                t('srs.confirmTitle', 'SRS Schedule'),
                t('srs.confirmGenerate', 'SRS profile changed. Generate review schedule?'),
                [
                    { text: t('common.no', 'No'), onPress: () => { onUpdate(updated); onClose(); } },
                    { text: t('common.yes', 'Yes'), onPress: () => { onUpdate(updated, { applySrs: true }); onClose(); } }
                ]
            );
        } else {
            onUpdate(updated);
            onClose();
        }
    };

    const handleStartNow = () => {
        const { title: parsedTitle, memo: parsedMemo } = parseContent();
        const updated: Todo = {
            ...todo,
            title: parsedTitle,
            memo: parsedMemo,
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
        const { title: parsedTitle, memo: parsedMemo } = parseContent();
        const updated: Todo = {
            ...todo,
            title: parsedTitle,
            memo: parsedMemo,
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
                        {/* Merged Content Input (Title & Memo) */}
                        <View style={styles.contentRow}>
                            {todo.completed ? (
                                <CheckCircle size={24} color={colors.success} style={styles.contentIcon} />
                            ) : (
                                <View style={[styles.checkbox, { borderColor: colors.primary, marginTop: 10 }]} />
                            )}
                            <TextInput
                                style={[
                                    styles.contentInput,
                                    { color: colors.text },
                                    todo.completed && styles.completedText
                                ]}
                                value={content}
                                onChangeText={setContent}
                                placeholder={t('todo.contentPlaceholder', 'What needs to be done?\n(1st line: Title, 2nd line: Memo)')}
                                placeholderTextColor={colors.textMuted}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Category */}
                        <TouchableOpacity
                            style={[styles.optionRow, { backgroundColor: colors.surface }]}
                            onPress={() => setIsCategoryPickerVisible(true)}
                        >
                            <Tag size={18} color={colors.icon} />
                            <Text style={[styles.optionText, { color: colors.text }]}>{selectedCategoryLabel}</Text>
                            <ChevronRight size={18} color={colors.textMuted} />
                        </TouchableOpacity>

                        {/* Date/Time Row */}
                        <View style={styles.gridRow}>
                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: colors.surface }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={18} color={colors.primary} />
                                <Text style={[styles.gridText, { color: colors.text }]} numberOfLines={1}>
                                    {dueDate ? format(dueDate, t('common.dateFormat', 'MMM d'), { locale }) : t('todo.datePlaceholder', 'Date')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: colors.surface }]}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Clock size={18} color={colors.primary} />
                                <Text style={[styles.gridText, { color: colors.text }]}>
                                    {dueTime || t('todo.startTime', 'Time')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.gridRow}>
                            {/* SRS */}
                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: colors.surface }]}
                                onPress={showSRSPicker}
                            >
                                <Repeat size={18} color={colors.success} />
                                <Text style={[styles.gridText, { color: colors.text }]} numberOfLines={1}>
                                    {srsInterval || t('todo.noSrs', 'No SRS')}
                                </Text>
                            </TouchableOpacity>
                            {/* Empty space or other field if needed */}
                            <View style={[styles.gridItem, { backgroundColor: 'transparent' }]} />
                        </View>

                        {/* Stats */}
                        <View style={[styles.statsBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}>
                            <Clock size={20} color={colors.primary} />
                            <View style={styles.statsContent}>
                                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>{t('todo.results', 'Results')}</Text>
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
                                        <CalendarRange size={16} color={colors.textSecondary} />
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
        fontSize: 15,
    },
    closeBtn: {
        padding: 4,
        marginLeft: 4,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        gap: 16,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 8,
    },
    contentIcon: {
        marginTop: 6,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        marginTop: 6,
    },
    contentInput: {
        flex: 1,
        fontSize: 19,
        fontWeight: 'bold',
        minHeight: 80,
        paddingTop: 4,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        gap: 10,
    },
    optionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
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
        fontSize: 10,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statsValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    gridRow: {
        flexDirection: 'row',
        gap: 12,
    },
    gridItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        gap: 10,
    },
    gridText: {
        fontSize: 14,
        flex: 1,
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
        borderRadius: 14,
        backgroundColor: '#dcfce7', // bg-green-100
        gap: 8,
    },
    startBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#ffedd5', // bg-orange-100
        gap: 8,
    },
    actionBtnText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    postponeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 14,
        gap: 8,
    },
    postponeBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    deleteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 14,
        gap: 6,
    },
    deleteBtnText: {
        fontSize: 13,
        fontWeight: '600',
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