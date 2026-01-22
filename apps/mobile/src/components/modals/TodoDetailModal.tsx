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
import { X, Play, Calendar, Clock, Tag, Repeat, CheckCircle, Save, Trash2, CalendarRange, ChevronRight } from 'lucide-react-native';
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

    // Recording States
    const [isRecording, setIsRecording] = useState(false);
    const [recordDuration, setRecordDuration] = useState('');

    // UI States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);

    // Flatten categories for selection logic
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

    // Initialize states when todo is opened (Strict parity with Web)
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

    // parseContent logic (Strict parity with Web)
    const parseContent = () => {
        const lines = content.split('\n');
        const rawTitle = lines[0].trim();
        const notes = lines.slice(1).join('\n').trim();

        let effectiveTitle = rawTitle;
        if (!effectiveTitle && categoryId) {
            const cat = categoryOptions.find(c => c.value === categoryId);
            if (cat) effectiveTitle = cat.label.split(' > ').pop() || cat.label;
        }

        return {
            title: effectiveTitle || t('todo.noTitle', 'Untitled'),
            memo: notes || undefined
        };
    };

    const handleUpdate = () => {
        if (!todo) return;
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

        // SRS Logic: Check if newly added or changed (Strict parity with Web Alert)
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
        if (!todo) return;
        const { title: parsedTitle, memo: parsedMemo } = parseContent();
        onStartNow({
            ...todo,
            title: parsedTitle,
            memo: parsedMemo,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            srsInterval: srsInterval || undefined,
            updatedAt: new Date(),
        });
        onClose();
    };

    const handlePostpone = () => {
        if (!todo) return;
        const currentDate = dueDate || new Date();
        const nextDate = addDays(currentDate, 1);
        onUpdate({ ...todo, dueDate: nextDate, updatedAt: new Date() });
        onClose();
    };

    const handleDelete = () => {
        if (!todo) return;
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
        if (!todo) return;
        const d = parseInt(recordDuration, 10);
        if (isNaN(d) || d <= 0) {
            Alert.alert(t('common.error', 'Error'), t('todo.invalidDuration', 'Invalid duration'));
            return;
        }
        const { title: parsedTitle, memo: parsedMemo } = parseContent();
        onRecord({
            ...todo,
            title: parsedTitle,
            memo: parsedMemo,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            srsInterval: srsInterval || undefined,
            updatedAt: new Date(),
        }, d * 60);
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

    const todoSessions = useMemo(() => {
        if (!todo) return [];
        return sessions.filter(s => s.todoId === todo.id);
    }, [sessions, todo]);

    const totalMinutes = Math.floor(todoSessions.reduce((acc, s) => acc + s.duration, 0) / 60);
    const selectedCategoryLabel = categoryOptions.find(c => c.value === categoryId)?.label || t('todo.noCategory', 'No Category');

    if (!visible || !todo) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>

                    {/* Header (Web Parity) */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('todo.detailTitle', 'Task Details')}</Text>
                        <View style={styles.headerRight}>
                            <TouchableOpacity onPress={handleUpdate} style={styles.saveBtn}>
                                <Text style={[styles.saveBtnText, { color: colors.primary }]}>{t('common.save', 'Save')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtnIcon}>
                                <X size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                        {/* Category (Strict Parity with Web Top-Level Choice) */}
                        <TouchableOpacity
                            style={[styles.inputRow, { backgroundColor: colors.surface }]}
                            onPress={() => setIsCategoryPickerVisible(true)}
                        >
                            <Tag size={18} color={colors.textMuted} />
                            <Text style={[styles.inputText, { color: colors.text }]} numberOfLines={1}>
                                {selectedCategoryLabel}
                            </Text>
                            <ChevronRight size={16} color={colors.textMuted} />
                        </TouchableOpacity>

                        {/* Merged Content Input (Strict Parity) */}
                        <View style={styles.contentInputWrapper}>
                            <View style={styles.statusIconWrapper}>
                                {todo.completed ? (
                                    <CheckCircle size={24} color={colors.success} />
                                ) : (
                                    <View style={[styles.checkboxCircle, { borderColor: colors.border }]} />
                                )}
                            </View>
                            <TextInput
                                style={[
                                    styles.contentInput,
                                    { color: colors.text },
                                    todo.completed && styles.completedText
                                ]}
                                value={content}
                                onChangeText={setContent}
                                placeholder={t('todo.contentPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Grid Options (Strict parity with Web grid-cols-2) */}
                        <View style={styles.gridContainer}>
                            <View style={styles.gridRow}>
                                {/* Due Date */}
                                <TouchableOpacity
                                    style={[styles.gridItem, { backgroundColor: colors.surface }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Calendar size={18} color={colors.primary} />
                                    <Text style={[styles.gridItemText, { color: colors.text }]} numberOfLines={1}>
                                        {dueDate ? format(dueDate, "yyyy-MM-dd") : t('todo.datePlaceholder', 'Date')}
                                    </Text>
                                </TouchableOpacity>

                                {/* Start Time */}
                                <TouchableOpacity
                                    style={[styles.gridItem, { backgroundColor: colors.surface }]}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Clock size={18} color={colors.primary} />
                                    <Text style={[styles.gridItemText, { color: colors.text }]}>
                                        {dueTime || t('todo.startTime', 'Time')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.gridRow}>
                                {/* SRS Profile */}
                                <TouchableOpacity
                                    style={[styles.gridItem, { backgroundColor: colors.surface }]}
                                    onPress={showSRSPicker}
                                >
                                    <Repeat size={18} color={colors.success} />
                                    <Text style={[styles.gridItemText, { color: colors.text }]} numberOfLines={1}>
                                        {srsInterval || t('todo.noSrs', 'No SRS')}
                                    </Text>
                                </TouchableOpacity>

                                {/* Placeholder for balance if needed, or other field */}
                                <View style={styles.gridItemPlaceholder} />
                            </View>
                        </View>

                        {/* Stats Summary (Strict Parity with Web Box) */}
                        <View style={styles.statsSection}>
                            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t('todo.statsTitle', 'Learning History').toUpperCase()}</Text>
                            <View style={[styles.statsBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff' }]}>
                                <Clock size={20} color={colors.primary} />
                                <View style={styles.statsTextColumn}>
                                    <Text style={[styles.statsSmallLabel, { color: colors.textSecondary }]}>{t('todo.results', 'Results')}</Text>
                                    <Text style={[styles.statsValueText, { color: colors.text }]}>
                                        {todoSessions.length}回 ({totalMinutes}分)
                                    </Text>
                                </View>
                            </View>
                        </View>

                    </ScrollView>

                    {/* Bottom Actions (Strict Parity) */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        {isRecording ? (
                            <View style={styles.recordingRow}>
                                <TextInput
                                    style={[styles.recordInput, { backgroundColor: colors.surface, color: colors.text }]}
                                    keyboardType="numeric"
                                    value={recordDuration}
                                    onChangeText={setRecordDuration}
                                    placeholder={t('todo.durationPlaceholder')}
                                    placeholderTextColor={colors.textMuted}
                                    autoFocus
                                />
                                <TouchableOpacity onPress={handleRecordSubmit} style={[styles.recordActionBtn, { backgroundColor: colors.success }]}>
                                    <Save size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsRecording(false)} style={[styles.recordActionBtn, { backgroundColor: colors.surface }]}>
                                    <X size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.mainActionContainer}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7' }]}
                                        onPress={() => setIsRecording(true)}
                                    >
                                        <CheckCircle size={20} color="#16a34a" />
                                        <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>{t('todo.record')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#ffedd5' }]}
                                        onPress={handleStartNow}
                                    >
                                        <Play size={18} color="#d97706" fill="#d97706" />
                                        <Text style={[styles.actionBtnText, { color: '#d97706' }]}>{t('todo.start')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.secondaryActionContainer}>
                                    <TouchableOpacity
                                        style={[styles.secondaryActionBtn, { backgroundColor: colors.surface }]}
                                        onPress={handlePostpone}
                                    >
                                        <CalendarRange size={16} color={colors.textSecondary} />
                                        <Text style={[styles.secondaryActionText, { color: colors.textSecondary }]}>{t('todo.postpone')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteBtnContainer}
                                        onPress={handleDelete}
                                    >
                                        <Text style={styles.deleteText}>{t('todo.deleteTask')}</Text>
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

            {/* Category Picker */}
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        fontSize: 15,
        fontWeight: 'bold',
    },
    closeBtnIcon: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        gap: 10,
    },
    inputText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    contentInputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    statusIconWrapper: {
        marginTop: 6,
    },
    checkboxCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
    },
    contentInput: {
        flex: 1,
        fontSize: 19,
        fontWeight: 'bold',
        minHeight: 120,
        paddingTop: 4,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    gridContainer: {
        gap: 12,
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
    gridItemPlaceholder: {
        flex: 1,
    },
    gridItemText: {
        fontSize: 14,
        flex: 1,
    },
    statsSection: {
        gap: 8,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    statsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        gap: 12,
    },
    statsTextColumn: {
        flex: 1,
    },
    statsSmallLabel: {
        fontSize: 10,
        marginBottom: 2,
    },
    statsValueText: {
        fontSize: 15,
        fontWeight: '600',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        gap: 12,
        paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    },
    mainActionContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 14,
        gap: 8,
    },
    actionBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    secondaryActionContainer: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        marginTop: 4,
    },
    secondaryActionBtn: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 14,
        gap: 8,
    },
    secondaryActionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    deleteBtnContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    deleteText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '500',
    },
    recordingRow: {
        flexDirection: 'row',
        gap: 10,
    },
    recordInput: {
        flex: 1,
        padding: 14,
        borderRadius: 14,
        fontSize: 16,
        fontWeight: '600',
    },
    recordActionBtn: {
        padding: 14,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
});