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
import { X, Play, Calendar, Clock, Tag, Repeat, CheckCircle, Save, CalendarRange, ChevronRight, Hourglass } from 'lucide-react-native';
import { format, addDays } from 'date-fns';
import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';
import { Todo, Category, SRSProfile, parseTodoContent } from '@studytodo/shared';
import { useThemeColors } from '../../providers/ThemeProvider';
import { useMobileCategories } from '../../hooks/useMobileCategories';
import { useMobileTodos } from '../../hooks/useMobileTodos';
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
    const { updateRoutine } = useMobileTodos(); // Added hook usage

    // Edit States
    const [content, setContent] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [dueTime, setDueTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [srsInterval, setSrsInterval] = useState('');

    // Routine States
    const [routineDays, setRoutineDays] = useState<number[]>([]);
    const [isRoutineOpen, setIsRoutineOpen] = useState(false);

    // Recording States
    const [isRecording, setIsRecording] = useState(false);
    const [recordDuration, setRecordDuration] = useState('');

    // UI States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
    const [showDurationPicker, setShowDurationPicker] = useState(false);
    const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
    const [isSRSPickerVisible, setIsSRSPickerVisible] = useState(false);

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
            setEndTime(todo.endTime || '');
            setSrsInterval(todo.srsInterval || '');
            setIsRecording(false);
            setRecordDuration('');

            // Initialize routine info if available (Note: Todo type might not carry routineDays explicitly if not stored, 
            // but we can infer or maybe we should have stored it? 
            // The types.ts has routineDays?: number[]. Assuming it's populated.
            // If not, we might need to fetch it or just allow setting new routine.
            // For now, assume it's passed or empty.)
            setRoutineDays(todo.routineDays || []);
            setIsRoutineOpen((todo.routineDays?.length || 0) > 0);
        }
    }, [todo, visible]);

    // parseContent logic (Strict parity with Web)
    const parseContent = () => {
        const cat = categoryOptions.find(c => c.value === categoryId);
        const fallbackTitle = cat ? (cat.label.split(' > ').pop() || cat.label) : undefined;

        return parseTodoContent(content, fallbackTitle, t('todo.noTitle', 'Untitled'));
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
            endTime: endTime || undefined,
            srsInterval: srsInterval || undefined,
            routineDays: routineDays.length > 0 ? routineDays : undefined, // Save routine days
            updatedAt: new Date(),
        };

        const performUpdate = () => {
            // Handle Recording if duration is present
            const durationNum = parseInt(recordDuration, 10);
            if (!isNaN(durationNum) && durationNum > 0) {
                onRecord(updated, durationNum * 60);
            } else {
                onUpdate(updated);
            }
            onClose();
        };

        // Routine Logic
        const oldRoutine = todo.routineDays || [];
        const isRoutineChanged =
            routineDays.length !== oldRoutine.length ||
            !routineDays.every(d => oldRoutine.includes(d));

        if (isRoutineChanged && routineDays.length > 0) {
            Alert.alert(
                t('guide.routineTitle', 'Routine'),
                t('todo.updateRoutineConfirm', 'Update routine schedule? This will regenerate tasks for next 30 days.'),
                [
                    { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                    {
                        text: t('common.update', 'Update'),
                        onPress: async () => {
                            await updateRoutine(updated, routineDays);
                            onClose();
                        }
                    }
                ]
            );
            return;
        }

        // SRS Logic: Check if newly added or changed (Strict parity with Web Alert)
        if (srsInterval && srsInterval !== todo.srsInterval && srsInterval !== '') {
            Alert.alert(
                t('srs.confirmTitle', 'SRS Schedule'),
                t('srs.confirmGenerate', 'SRS profile changed. Generate review schedule?'),
                [
                    { text: t('common.no', 'No'), onPress: () => performUpdate() },
                    { text: t('common.yes', 'Yes'), onPress: () => { onUpdate(updated, { applySrs: true }); onClose(); } }
                ]
            );
        } else {
            performUpdate();
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

        const { title: parsedTitle, memo: parsedMemo } = parseContent();

        // Create updated todo object
        const updatedTodo = {
            ...todo,
            title: parsedTitle,
            memo: parsedMemo,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            srsInterval: srsInterval || undefined,
            routineDays: routineDays.length > 0 ? routineDays : undefined,
            updatedAt: new Date(),
        };

        if (!isNaN(d) && d > 0) {
            onRecord(updatedTodo, d * 60);
        } else {
            onUpdate(updatedTodo);
        }

        setRecordDuration('');
        setIsRecording(false);
        onClose();
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
                                    onPress={() => setShowTimePicker('start')}
                                >
                                    <Clock size={18} color={colors.primary} />
                                    <Text style={[styles.gridItemText, { color: colors.text }]}>
                                        {dueTime || t('todo.startTime', 'Time')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.gridRow}>
                                {/* End Time Picker (Full Width) */}
                                <TouchableOpacity
                                    style={[styles.gridItem, { backgroundColor: colors.surface, opacity: dueTime ? 1 : 0.5 }]}
                                    onPress={() => dueTime && setShowTimePicker('end')}
                                    disabled={!dueTime}
                                >
                                    <Clock size={18} color={dueTime ? colors.danger : colors.textMuted} />
                                    <Text style={[styles.gridItemText, { color: dueTime ? colors.text : colors.textMuted }]}>
                                        {endTime || t('todo.endTime', 'End Time')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.gridRow}>
                                {/* SRS Profile (Flex 1) */}
                                <TouchableOpacity
                                    style={[styles.gridItem, { backgroundColor: colors.surface }]}
                                    onPress={() => setIsSRSPickerVisible(true)}
                                >
                                    <Repeat size={18} color={colors.success} />
                                    <Text style={[styles.gridItemText, { color: colors.text }]} numberOfLines={1}>
                                        {srsInterval || t('todo.noSrs', 'No SRS')}
                                    </Text>
                                </TouchableOpacity>

                                {/* Routine Toggle (Icon Only) */}
                                <TouchableOpacity
                                    style={[
                                        styles.routineToggle,
                                        { backgroundColor: isRoutineOpen || routineDays.length > 0 ? 'rgba(168, 85, 247, 0.1)' : colors.surface }
                                    ]}
                                    onPress={() => setIsRoutineOpen(!isRoutineOpen)}
                                >
                                    <CalendarRange size={18} color={isRoutineOpen || routineDays.length > 0 ? '#a855f7' : colors.icon} />
                                </TouchableOpacity>
                            </View>

                            {/* Routine Picker (Expandable) */}
                            {isRoutineOpen && (
                                <View style={[styles.routineContainer, { backgroundColor: colors.surface }]}>
                                    <View style={styles.routineHeader}>
                                        <Text style={[styles.routineLabel, { color: colors.textSecondary }]}>{t('guide.routineTitle', 'Routine Days')}</Text>
                                        {routineDays.length > 0 && (
                                            <TouchableOpacity onPress={() => setRoutineDays([])}>
                                                <Text style={styles.routineClear}>{t('common.clear', 'Clear')}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <View style={styles.weekdayRow}>
                                        {['0', '1', '2', '3', '4', '5', '6'].map((key, index) => {
                                            const isSelected = routineDays.includes(index);
                                            const isWeekend = index === 0 || index === 6;
                                            return (
                                                <TouchableOpacity
                                                    key={key}
                                                    style={[
                                                        styles.weekdayBtn,
                                                        isSelected && styles.weekdayBtnActive,
                                                        !isSelected && { backgroundColor: colors.background }
                                                    ]}
                                                    onPress={() => {
                                                        if (isSelected) {
                                                            setRoutineDays(routineDays.filter(d => d !== index));
                                                        } else {
                                                            setRoutineDays([...routineDays, index].sort((a, b) => a - b));
                                                        }
                                                    }}
                                                >
                                                    <Text style={[
                                                        styles.weekdayText,
                                                        isSelected && styles.weekdayTextActive,
                                                        !isSelected && isWeekend && { color: colors.textMuted },
                                                        !isSelected && !isWeekend && { color: colors.text }
                                                    ]}>
                                                        {t(`common.weekdays.${key}`)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
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
                                <TouchableOpacity onPress={handleRecordSubmit} style={[styles.recordActionBtn, { backgroundColor: colors.success }]}>
                                    <Save size={20} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.durationPickerBtn, { backgroundColor: colors.surface }]}
                                    onPress={() => setShowDurationPicker(true)}
                                >
                                    <Clock size={20} color={colors.primary} />
                                    <View style={styles.durationValueContainer}>
                                        <Text style={[styles.durationValueText, { color: colors.text }]}>
                                            {recordDuration ? (
                                                <>
                                                    {parseInt(recordDuration, 10)}
                                                    <Text style={styles.durationUnitText}>{t('common.minute', 'min')}</Text>
                                                </>
                                            ) : (
                                                <Text style={{ color: colors.textMuted }}>{t('todo.durationPlaceholder', 'Select Duration')}</Text>
                                            )}
                                        </Text>
                                    </View>
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

            {/* Category Picker */}
            <CategoryTreePicker
                visible={isCategoryPickerVisible}
                onClose={() => setIsCategoryPickerVisible(false)}
                categories={categories}
                selectedId={categoryId}
                onSelect={(id) => setCategoryId(id)}
            />

            {/* Date Picker Modal */}
            {showDatePicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible={showDatePicker} transparent animationType="fade">
                        <View style={styles.datePickerOverlay}>
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
                                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity onPress={() => {
                                        setDueDate(null);
                                        setShowDatePicker(false);
                                    }}>
                                        <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('todo.datePlaceholder', 'Date')}</Text>
                                    <TouchableOpacity onPress={() => {
                                        if (!dueDate) setDueDate(new Date());
                                        setShowDatePicker(false);
                                    }}>
                                        <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={dueDate || new Date()}
                                    mode="date"
                                    display="spinner"
                                    textColor={colors.text}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    onChange={(event, date) => {
                                        if (date) setDueDate(date);
                                    }}
                                    style={styles.datePickerSpinner}
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={dueDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowDatePicker(false);
                            if (date) setDueDate(date);
                        }}
                    />
                )
            )}

            {/* Time Picker Modal */}
            {showTimePicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible={!!showTimePicker} transparent animationType="fade">
                        <View style={styles.datePickerOverlay}>
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
                                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity onPress={() => {
                                        if (showTimePicker === 'start') setDueTime('');
                                        if (showTimePicker === 'end') setEndTime('');
                                        setShowTimePicker(null);
                                    }}>
                                        <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>
                                        {showTimePicker === 'start' ? t('todo.startTime', 'Time') : t('todo.endTime', 'End Time')}
                                    </Text>
                                    <TouchableOpacity onPress={() => {
                                        if (showTimePicker === 'start' && !dueTime) setDueTime(format(new Date(), 'HH:mm'));
                                        if (showTimePicker === 'end' && !endTime) setEndTime(format(new Date(), 'HH:mm'));
                                        setShowTimePicker(null);
                                    }}>
                                        <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={
                                        (showTimePicker === 'start' ? dueTime : endTime)
                                            ? new Date(`2000-01-01T${showTimePicker === 'start' ? dueTime : endTime}`)
                                            : new Date()
                                    }
                                    mode="time"
                                    display="spinner"
                                    textColor={colors.text}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    onChange={(event, date) => {
                                        if (date) {
                                            const time = format(date, 'HH:mm');
                                            if (showTimePicker === 'start') setDueTime(time);
                                            else setEndTime(time);
                                        }
                                    }}
                                    style={styles.datePickerSpinner}
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={
                            (showTimePicker === 'start' ? dueTime : endTime)
                                ? new Date(`2000-01-01T${showTimePicker === 'start' ? dueTime : endTime}`)
                                : new Date()
                        }
                        mode="time"
                        display="default"
                        onChange={(event, date) => {
                            setShowTimePicker(null);
                            if (date) {
                                const time = format(date, 'HH:mm');
                                if (showTimePicker === 'start') setDueTime(time);
                                else setEndTime(time);
                            }
                        }}
                    />
                )
            )}



            {/* Duration Picker Modal */}
            {showDurationPicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible={showDurationPicker} transparent animationType="fade">
                        <View style={styles.datePickerOverlay}>
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
                                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity onPress={() => {
                                        setRecordDuration('');
                                        setShowDurationPicker(false);
                                    }}>
                                        <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('todo.durationPlaceholder', 'Duration')}</Text>
                                    <TouchableOpacity onPress={() => {
                                        if (!recordDuration || recordDuration === '0') {
                                            setRecordDuration('30');
                                        }
                                        setShowDurationPicker(false);
                                    }}>
                                        <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={(() => {
                                        const d = new Date();
                                        d.setHours(0);
                                        d.setMinutes(parseInt(recordDuration || '0', 10));
                                        return d;
                                    })()}
                                    mode="countdown"
                                    display="spinner"
                                    textColor={colors.text}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    minuteInterval={5}
                                    onChange={(event, date) => {
                                        if (date) {
                                            const minutes = date.getHours() * 60 + date.getMinutes();
                                            setRecordDuration(minutes.toString());
                                        }
                                    }}
                                    style={styles.datePickerSpinner}
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={(() => {
                            const d = new Date();
                            d.setHours(0);
                            d.setMinutes(parseInt(recordDuration || '0', 10));
                            return d;
                        })()}
                        mode="time"
                        display="spinner"
                        is24Hour={true}
                        minuteInterval={5}
                        onChange={(event, date) => {
                            setShowDurationPicker(false);
                            if (date) {
                                const minutes = date.getHours() * 60 + date.getMinutes();
                                setRecordDuration(minutes.toString());
                            }
                        }}
                    />
                )
            )}

            {/* SRS Picker Modal */}
            <Modal visible={isSRSPickerVisible} transparent animationType="fade">
                <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsSRSPickerVisible(false)}>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('srs.selectProfile', 'Select SRS Profile')}</Text>
                        <ScrollView style={styles.pickerScroll}>
                            <TouchableOpacity
                                style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                onPress={() => { setSrsInterval(''); setIsSRSPickerVisible(false); }}
                            >
                                <Text style={[styles.pickerItemText, { color: colors.textSecondary }]}>{t('todo.noSrs', 'No SRS')}</Text>
                            </TouchableOpacity>
                            {srsProfiles.map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                    onPress={() => { setSrsInterval(p.name); setIsSRSPickerVisible(false); }}
                                >
                                    <Text style={[styles.pickerItemText, { color: colors.text }]}>{p.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        // Removed flex: 1 to allow auto-height behavior
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
    durationInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
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
        alignItems: 'center',
        gap: 12,
        justifyContent: 'space-between',
    },
    durationPickerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        gap: 10,
        height: 44,
    },
    durationValueContainer: {
        flex: 1,
    },
    durationValueText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    durationUnitText: {
        fontSize: 14,
        fontWeight: 'normal',
        opacity: 0.7,
        marginLeft: 4,
    },
    recordActions: {
        flexDirection: 'row',
        gap: 8,
    },
    recordActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // DateTimePicker Modal styles
    datePickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    datePickerContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    datePickerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    datePickerDone: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    datePickerCancel: {
        fontSize: 16,
    },
    datePickerSpinner: {
        height: 200,
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
    // Routine Styles
    routineToggle: {
        padding: 12,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    routineContainer: {
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    routineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    routineLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    routineClear: {
        fontSize: 10,
        color: '#ef4444',
    },
    weekdayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
    },
    weekdayBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekdayBtnActive: {
        backgroundColor: '#3b82f6',
    },
    weekdayText: {
        fontSize: 14,
        fontWeight: '500',
    },
    weekdayTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
});