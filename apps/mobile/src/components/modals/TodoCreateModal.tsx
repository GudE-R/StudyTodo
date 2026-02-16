import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
    Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Tag, Repeat, Play, CheckCircle, Plus, Calendar, Clock, Hourglass, CalendarDays, Save } from 'lucide-react-native';
import { format } from 'date-fns';
import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';
import { Todo, Category, SRSProfile, generateId } from '@studytodo/shared';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileSRS } from '../../hooks/useMobileSRS';
import { useMobileSessions } from '../../hooks/useMobileSessions';
import { useThemeColors } from '../../providers/ThemeProvider';
import { CategoryTreePicker } from '../ui/CategoryTreePicker';

interface TodoCreateModalProps {
    visible: boolean;
    onClose: () => void;
    categories: Category[];
    initialDate?: Date;
    initialTime?: string;
    onStartNow?: (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => void;
}

export const TodoCreateModal = ({
    visible,
    onClose,
    categories,
    initialDate,
    initialTime,
    onStartNow
}: TodoCreateModalProps) => {
    const { colors, isDark } = useThemeColors();
    const { t, i18n } = useTranslation();
    const locale = getDateFnsLocale(i18n.language);
    const { addTodo, addRoutineTodos, addSRSTodos } = useMobileTodos();
    const { profiles: srsProfiles } = useMobileSRS();
    const { addSession } = useMobileSessions();

    // States matching web version
    const [content, setContent] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [dueTime, setDueTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [srsProfileId, setSrsProfileId] = useState('');
    const [duration, setDuration] = useState('');
    const [isRecordMode, setIsRecordMode] = useState(false);
    const [routineDays, setRoutineDays] = useState<number[]>([]);
    const [isRoutineOpen, setIsRoutineOpen] = useState(false);

    // Picker states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
    const [showDurationPicker, setShowDurationPicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showSRSPicker, setShowSRSPicker] = useState(false);

    // Initialize on open
    useEffect(() => {
        setDueDate(initialDate || null);
        setDueTime(initialTime || '');
        setEndTime('');
        setDuration('');
        setIsRecordMode(false);
    }, [visible, initialDate, initialTime]);

    // Flatten categories
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

    if (!visible) return null;

    // Parse content (1st line = title, rest = memo)
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
            title: effectiveTitle || '',
            notes: notes || undefined
        };
    };

    // Validation
    const isValid = () => {
        const rawTitle = content.split('\n')[0].trim();
        return rawTitle.length > 0 || categoryId.length > 0;
    };

    // Auto-fill date if time is set
    const ensureDateIfTimeSet = (): Date | undefined => {
        if (dueTime && !dueDate) {
            return new Date();
        }
        return dueDate ?? undefined;
    };

    // Build todo data
    const buildTodoData = (): Omit<Todo, 'id' | 'createdAt' | 'completed'> => {
        const { title, notes } = parseContent();
        let effectiveDate = dueTime ? ensureDateIfTimeSet() : (dueDate ?? undefined);

        // If SRS or Routine is selected but no date is set, default to Today
        if (!effectiveDate && (srsProfileId || routineDays.length > 0)) {
            effectiveDate = new Date();
        }

        return {
            title: title || '無題',
            dueDate: effectiveDate,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            categoryId: categoryId || undefined,
            srsProfileId: srsProfileId || undefined,
            srsInterval: selectedSrsName || undefined,
            memo: notes,
            priority: 'medium',
            routineDays: routineDays.length > 0 ? routineDays : undefined,
            updatedAt: new Date(),
        };
    };

    // Create handler
    const handleCreate = async () => {
        if (!isValid()) {
            Alert.alert(t('common.error', 'Error'), t('todo.inputTitleOrCategory', 'Please enter a title or select a category'));
            return;
        }
        const todoData = buildTodoData();

        if (routineDays.length > 0) {
            // Routine creation
            await addRoutineTodos(
                {
                    ...todoData,
                    id: generateId(),
                    createdAt: new Date(),
                    completed: false,
                } as Todo,
                routineDays
            );
        } else if (srsProfileId) {
            // SRS creation
            const profile = srsProfiles.find(p => p.id === srsProfileId);
            const intervals = profile?.intervals || [1, 3, 7];

            await addSRSTodos(
                {
                    ...todoData,
                    id: generateId(),
                    createdAt: new Date(),
                    completed: false,
                } as Todo,
                intervals
            );
        } else {
            // Normal creation
            await addTodo({
                ...todoData,
                id: generateId(),
                createdAt: new Date(),
                completed: false,
            });
        }
        resetForm();
    };

    // Start now handler
    const handleStartNow = () => {
        if (!isValid()) {
            Alert.alert(t('common.error', 'Error'), t('todo.inputTitleOrCategory', 'Please enter a title or select a category'));
            return;
        }
        const { title, notes } = parseContent();
        const now = new Date();
        const todoData: Omit<Todo, 'id' | 'createdAt' | 'completed'> = {
            title: title || t('todo.noTitle', 'Untitled'),
            dueDate: now,
            dueTime: format(now, 'HH:mm'),
            categoryId: categoryId || undefined,
            srsProfileId: srsProfileId || undefined,
            memo: notes,
            priority: 'medium',
            updatedAt: new Date(),
        };
        // If SRS is selected, ensure we set srsGroupId

        if (srsProfileId) {
            todoData.srsGroupId = generateId();
        }

        if (onStartNow) {
            onStartNow(todoData);
        }
        resetForm();
    };



    // Record handler
    const handleRecord = async () => {
        if (!isValid()) {
            Alert.alert(t('common.error', 'Error'), t('todo.inputTitleOrCategory', 'Please enter a title or select a category'));
            return;
        }
        const durationNum = parseInt(duration, 10) || 0;

        // Build basic todo data
        const baseData = buildTodoData();

        // Create full todo object
        const newTodo: Todo = {
            ...baseData,
            id: generateId(),
            createdAt: new Date(),
            completed: true, // Mark as completed since it's a recorded session
        };

        await addTodo(newTodo);

        // Add session only if duration > 0
        if (durationNum > 0) {
            await addSession({
                id: generateId(),
                todoId: newTodo.id,
                startTime: new Date(Date.now() - durationNum * 60000),
                endTime: new Date(),
                duration: durationNum * 60,
                todoTitle: newTodo.title,
                mode: 'pomodoro',
                createdAt: new Date(),
            });
        }

        resetForm();
    };

    const resetForm = () => {
        setContent('');
        setDueDate(null);
        setDueTime('');
        setEndTime('');
        setCategoryId('');
        setSrsProfileId('');
        setRoutineDays([]);
        setIsRoutineOpen(false);
        setDuration('');
        setIsRecordMode(false);
        onClose();
    };

    const selectedCategoryLabel = categoryOptions.find(c => c.value === categoryId)?.label || t('todo.noCategory', 'No Category');
    const selectedSrsName = srsProfiles.find(p => p.id === srsProfileId)?.name || '';

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('todo.createTitle', 'Create Todo')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                        {/* Category Selection (Top) */}
                        <TouchableOpacity
                            style={[styles.optionRow, { backgroundColor: colors.surface }]}
                            onPress={() => setShowCategoryPicker(true)}
                        >
                            <Tag size={18} color={colors.icon} />
                            <Text style={[styles.optionText, { color: colors.text }]}>{selectedCategoryLabel}</Text>
                        </TouchableOpacity>

                        {/* Content Input (Title + Memo) */}
                        <TextInput
                            style={[styles.contentInput, { color: colors.text, borderColor: colors.primary }]}
                            value={content}
                            onChangeText={setContent}
                            placeholder={t('todo.contentPlaceholder', "Title\nMemo (2nd line+)")}
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Date & Time Grid */}
                        <View style={[styles.gridRow, { alignItems: 'stretch' }]}>
                            {/* Date (Left Side) */}
                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: colors.surface, flex: 1 }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={18} color={colors.primary} />
                                <Text style={[styles.gridText, { color: colors.text }]}>
                                    {dueDate ? format(dueDate, t('common.dateFormat', 'MMM d (EEE)'), { locale }) : t('todo.datePlaceholder', 'Select Date')}
                                </Text>
                            </TouchableOpacity>

                            {/* Times (Right Side Column) */}
                            <View style={{ flex: 1, gap: 10 }}>
                                <TouchableOpacity
                                    style={[styles.gridItem, { backgroundColor: colors.surface, flex: 1 }]}
                                    onPress={() => setShowTimePicker('start')}
                                >
                                    <Clock size={18} color={colors.primary} />
                                    <Text style={[styles.gridText, { color: colors.text }]}>
                                        {dueTime || t('todo.startTime', 'Start Time')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.gridItem, { backgroundColor: colors.surface, opacity: dueTime ? 1 : 0.5, flex: 1 }]}
                                    onPress={() => dueTime && setShowTimePicker('end')}
                                    disabled={!dueTime}
                                >
                                    <Clock size={18} color={dueTime ? colors.danger : colors.textMuted} />
                                    <Text style={[styles.gridText, { color: dueTime ? colors.text : colors.textMuted }]}>
                                        {endTime || t('todo.endTime', 'End Time')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* SRS Profile & Routine Row */}
                        <View style={styles.srsRoutineRow}>
                            <TouchableOpacity
                                style={[styles.srsBtn, { backgroundColor: colors.surface }]}
                                onPress={() => setShowSRSPicker(true)}
                            >
                                <Repeat size={18} color={colors.success} />
                                <Text style={[styles.srsBtnText, { color: colors.text }]} numberOfLines={1}>
                                    {selectedSrsName || t('todo.noSrs', 'No SRS')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.routineToggle,
                                    { backgroundColor: isRoutineOpen || routineDays.length > 0 ? 'rgba(168, 85, 247, 0.1)' : colors.surface }
                                ]}
                                onPress={() => setIsRoutineOpen(!isRoutineOpen)}
                            >
                                <CalendarDays size={18} color={isRoutineOpen || routineDays.length > 0 ? '#a855f7' : colors.icon} />
                            </TouchableOpacity>
                        </View>

                        {/* Routine Weekday Picker (Expandable) */}
                        {isRoutineOpen && (
                            <View style={[styles.routineContainer, { backgroundColor: colors.surface }]}>
                                <View style={styles.routineHeader}>
                                    <View style={styles.routineLabelRow}>
                                        <CalendarDays size={14} color="#a855f7" />
                                        <Text style={[styles.routineLabel, { color: colors.textSecondary }]}>{t('guide.routineTitle', 'Routine')}</Text>
                                    </View>
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
                                                key={index}
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
                                                    !isSelected && isWeekend && { color: colors.textMuted }
                                                ]}>
                                                    {t(`common.weekdays.${key}`)}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={[styles.actions, { borderTopColor: colors.border }]}>
                        {isRecordMode ? (
                            <View style={styles.recordingRow}>
                                <TouchableOpacity onPress={handleRecord} style={[styles.recordActionBtn, { backgroundColor: colors.success }]}>
                                    <Save size={20} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.durationPickerBtn, { backgroundColor: colors.surface }]}
                                    onPress={() => setShowDurationPicker(true)}
                                >
                                    <Clock size={20} color={colors.primary} />
                                    <View style={styles.durationValueContainer}>
                                        <Text style={[styles.durationValueText, { color: colors.text }]}>
                                            {duration ? (
                                                <>
                                                    {parseInt(duration, 10)}
                                                    <Text style={styles.durationUnitText}>{t('common.minute', 'min')}</Text>
                                                </>
                                            ) : (
                                                <Text style={{ color: colors.textMuted }}>{t('todo.durationPlaceholder', 'Select Duration')}</Text>
                                            )}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => setIsRecordMode(false)} style={[styles.recordActionBtn, { backgroundColor: colors.surface }]}>
                                    <X size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.actionBtnRecord]}
                                    onPress={() => setIsRecordMode(true)}
                                >
                                    <CheckCircle size={18} color={colors.success} />
                                    <Text style={[styles.actionBtnText, { color: colors.success }]}>
                                        {t('todo.record', 'Record')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionBtnStart} onPress={handleStartNow}>
                                    <Play size={18} color="#ea580c" fill="#ea580c" />
                                    <Text style={[styles.actionBtnText, { color: '#ea580c' }]}>{t('todo.start', 'Start')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionBtnCreate} onPress={handleCreate}>
                                    <Plus size={18} color={colors.primary} />
                                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>{t('todo.create', 'Create')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>

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
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('todo.selectDate', 'Select Date')}</Text>
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
                                        if (showTimePicker === 'start') {
                                            setDueTime('');
                                        } else {
                                            setEndTime('');
                                        }
                                        setShowTimePicker(null);
                                    }}>
                                        <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>
                                        {showTimePicker === 'start' ? t('todo.startTime', 'Start Time') : t('todo.endTime', 'End Time')}
                                    </Text>
                                    <TouchableOpacity onPress={() => {
                                        const timeStr = format(new Date(), 'HH:mm');
                                        if (showTimePicker === 'start') {
                                            if (!dueTime) setDueTime(timeStr);
                                        } else {
                                            if (!endTime) setEndTime(timeStr);
                                        }
                                        setShowTimePicker(null);
                                    }}>
                                        <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={showTimePicker === 'start' && dueTime
                                        ? new Date(`2000-01-01T${dueTime}`)
                                        : showTimePicker === 'end' && endTime
                                            ? new Date(`2000-01-01T${endTime}`)
                                            : new Date()}
                                    mode="time"
                                    display="spinner"
                                    textColor={colors.text}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    minuteInterval={5}
                                    onChange={(event, date) => {
                                        if (date) {
                                            const timeStr = format(date, 'HH:mm');
                                            if (showTimePicker === 'start') {
                                                setDueTime(timeStr);
                                            } else {
                                                setEndTime(timeStr);
                                            }
                                        }
                                    }}
                                    style={styles.datePickerSpinner}
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={showTimePicker === 'start' && dueTime
                            ? new Date(`2000-01-01T${dueTime}`)
                            : showTimePicker === 'end' && endTime
                                ? new Date(`2000-01-01T${endTime}`)
                                : new Date()}
                        mode="time"
                        display="default"
                        minuteInterval={5}
                        onChange={(event, date) => {
                            const pickerType = showTimePicker;
                            setShowTimePicker(null);
                            if (date) {
                                const timeStr = format(date, 'HH:mm');
                                if (pickerType === 'start') {
                                    setDueTime(timeStr);
                                    if (!timeStr) setEndTime('');
                                } else {
                                    setEndTime(timeStr);
                                }
                            }
                        }}
                    />
                )
            )}

            {/* Category Picker Modal */}
            <CategoryTreePicker
                visible={showCategoryPicker}
                onClose={() => setShowCategoryPicker(false)}
                categories={categories}
                selectedId={categoryId}
                onSelect={(id) => setCategoryId(id)}
            />

            {/* Duration Picker Modal */}
            {showDurationPicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible={showDurationPicker} transparent animationType="fade">
                        <View style={styles.datePickerOverlay}>
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
                                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity onPress={() => {
                                        setDuration('');
                                        setShowDurationPicker(false);
                                    }}>
                                        <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('todo.durationPlaceholder', 'Duration')}</Text>
                                    <TouchableOpacity onPress={() => {
                                        if (!duration || duration === '0') {
                                            setDuration('30');
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
                                        d.setMinutes(parseInt(duration || '0', 10));
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
                                            setDuration(minutes.toString());
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
                            d.setMinutes(parseInt(duration || '0', 10));
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
                                setDuration(minutes.toString());
                            }
                        }}
                    />
                )
            )}

            {/* SRS Picker Modal */}
            <Modal visible={showSRSPicker} transparent animationType="fade">
                <TouchableOpacity style={styles.pickerOverlay} onPress={() => setShowSRSPicker(false)}>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('srs.selectProfile', 'Select SRS Profile')}</Text>
                        <ScrollView style={styles.pickerScroll}>
                            <TouchableOpacity
                                style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                onPress={() => { setSrsProfileId(''); setShowSRSPicker(false); }}
                            >
                                <Text style={[styles.pickerItemText, { color: colors.textSecondary }]}>{t('todo.noSrs', 'No SRS')}</Text>
                            </TouchableOpacity>
                            {srsProfiles.map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                    onPress={() => { setSrsProfileId(p.id); setShowSRSPicker(false); }}
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
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: 16,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        marginBottom: 12,
    },
    optionText: {
        flex: 1,
        fontSize: 14,
    },
    contentInput: {
        borderBottomWidth: 2,
        paddingVertical: 12,
        fontSize: 16,
        fontWeight: '500',
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    gridRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    gridItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    gridText: {
        fontSize: 14,
    },
    durationInput: {
        flex: 1,
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 6,
    },
    actionBtnRecord: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 6,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    actionBtnRecordActive: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 6,
        backgroundColor: '#22c55e',
    },
    actionBtnStart: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 6,
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
    },
    actionBtnCreate: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 6,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    actionBtnText: {
        fontWeight: 'bold',
        fontSize: 13,
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
    // Routine styles
    srsRoutineRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    srsBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    srsBtnText: {
        flex: 1,
        fontSize: 14,
    },
    routineToggle: {
        padding: 12,
        borderRadius: 12,
    },
    routineContainer: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    routineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    routineLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
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
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    weekdayTextActive: {
        color: '#fff',
    },
    routineHint: {
        fontSize: 10,
        color: '#a855f7',
        marginTop: 8,
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
    recordingRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        flex: 1,
    },
    durationPickerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    durationValueContainer: {
        flex: 1,
    },
    durationValueText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    durationUnitText: {
        fontSize: 12,
        fontWeight: 'normal',
        marginLeft: 4,
    },
    recordActions: {
        flexDirection: 'row',
        gap: 10,
    },
    recordActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
