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
import { X, Tag, Repeat, Play, CheckCircle, Plus, Calendar, Clock, Hourglass, CalendarDays, Folder, File, ChevronRight, ChevronDown } from 'lucide-react-native';
import { CategoryIcon } from '../ui/CategoryIcon';
import { format } from 'date-fns';
import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';
import { Todo, Category, SRSProfile, generateId } from '@pomarc/shared';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileSRS } from '../../hooks/useMobileSRS';
import { useMobileSessions } from '../../hooks/useMobileSessions';
import { useThemeColors } from '../../providers/ThemeProvider';

// Utility to build tree
const buildCategoryTree = (categories: Category[]): Category[] => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, { ...c, children: [] }));
    const roots: Category[] = [];
    map.forEach(c => {
        if (c.parentId && map.has(c.parentId)) {
            map.get(c.parentId)?.children?.push(c);
        } else {
            roots.push(c);
        }
    });
    return roots;
};

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
    const { addTodo } = useMobileTodos();
    const { profiles: srsProfiles } = useMobileSRS();
    const { addSession } = useMobileSessions();

    // States matching web version
    const [content, setContent] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [dueTime, setDueTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [srsInterval, setSrsInterval] = useState('');
    const [duration, setDuration] = useState('');
    const [isRecordMode, setIsRecordMode] = useState(false);
    const [routineDays, setRoutineDays] = useState<number[]>([]);
    const [isRoutineOpen, setIsRoutineOpen] = useState(false);

    // Picker states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showSRSPicker, setShowSRSPicker] = useState(false);

    // Tree Logic
    const tree = useMemo(() => buildCategoryTree(categories || []), [categories]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Expand all by default
    useEffect(() => {
        if (categories.length > 0) {
            setExpandedIds(new Set(categories.map(c => c.id)));
        }
    }, [categories]);

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const renderCategoryNode = (node: Category, depth: number = 0) => {
        const isExpanded = expandedIds.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isSmall = node.level === 'small';
        const isSelected = categoryId === node.id;

        return (
            <View key={node.id}>
                <TouchableOpacity
                    style={[
                        styles.pickerItem,
                        {
                            borderBottomColor: colors.border,
                            paddingLeft: 16 + depth * 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                        }
                    ]}
                    onPress={() => { setCategoryId(node.id); setShowCategoryPicker(false); }}
                >
                    {/* Expand/Collapse Icon */}
                    {hasChildren && !isSmall ? (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                toggleExpand(node.id);
                            }}
                            style={{ padding: 4, marginRight: 4 }}
                        >
                            {isExpanded
                                ? <ChevronDown size={16} color={colors.textSecondary} />
                                : <ChevronRight size={16} color={colors.textSecondary} />
                            }
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 24, marginRight: 4 }} />
                    )}

                    {/* Category Icon */}
                    <View style={{ marginRight: 8 }}>
                        {node.icon ? (
                            <CategoryIcon iconName={node.icon} size={16} color={node.color || (isSmall ? colors.primary : colors.orange)} />
                        ) : (
                            isSmall
                                ? <File size={16} color={node.color || colors.primary} />
                                : <Folder size={16} color={node.color || colors.orange} />
                        )}
                    </View>

                    <Text style={[
                        styles.pickerItemText,
                        {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? 'bold' : 'normal'
                        }
                    ]}>
                        {node.name}
                    </Text>
                </TouchableOpacity>

                {isExpanded && node.children && node.children.map(child => renderCategoryNode(child, depth + 1))}
            </View>
        );
    };

    // Initialize on open
    useEffect(() => {
        if (visible) {
            setDueDate(initialDate || null);
            setDueTime(initialTime || '');
            setEndTime('');
        }
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
        const effectiveDate = dueTime ? ensureDateIfTimeSet() : (dueDate ?? undefined);

        return {
            title: title || '無題',
            dueDate: effectiveDate,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            categoryId: categoryId || undefined,
            srsInterval: srsInterval || undefined,
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
        await addTodo({
            ...todoData,
            id: generateId(),
            createdAt: new Date(),
            completed: false,
        });
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
            srsInterval: srsInterval || undefined,
            memo: notes,
            priority: 'medium',
            updatedAt: new Date(),
        };
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
        if (durationNum <= 0) {
            Alert.alert(t('common.error', 'Error'), t('todo.inputDuration', 'Please enter a duration'));
            return;
        }
        const todoData = buildTodoData();
        const newTodo: Todo = {
            ...todoData,
            id: generateId(),
            createdAt: new Date(),
            completed: true,
        };
        await addTodo(newTodo);
        await addSession({
            id: generateId(),
            todoId: newTodo.id,
            todoTitle: newTodo.title,
            duration: durationNum * 60,
            mode: 'pomodoro',
            createdAt: new Date(),
        });
        resetForm();
    };

    const resetForm = () => {
        setContent('');
        setDueDate(null);
        setDueTime('');
        setEndTime('');
        setCategoryId('');
        setSrsInterval('');
        setDuration('');
        setIsRecordMode(false);
        setRoutineDays([]);
        setIsRoutineOpen(false);
        onClose();
    };

    const selectedCategoryLabel = categoryOptions.find(c => c.value === categoryId)?.label || t('todo.noCategory', 'No Category');

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
                        <View style={styles.gridRow}>
                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: colors.surface }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={18} color={colors.primary} />
                                <Text style={[styles.gridText, { color: colors.text }]}>
                                    {dueDate ? format(dueDate, t('common.dateFormat', 'MMM d (EEE)'), { locale }) : t('todo.datePlaceholder', 'Select Date')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: colors.surface }]}
                                onPress={() => setShowTimePicker('start')}
                            >
                                <Clock size={18} color={colors.primary} />
                                <Text style={[styles.gridText, { color: colors.text }]}>
                                    {dueTime || t('todo.startTime', 'Start Time')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.gridRow}>
                            {/* Duration (Record mode only) */}
                            {isRecordMode ? (
                                <View style={[styles.gridItem, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: colors.success, borderWidth: 1 }]}>
                                    <Hourglass size={18} color={colors.success} />
                                    <TextInput
                                        style={[styles.durationInput, { color: colors.text }]}
                                        value={duration}
                                        onChangeText={setDuration}
                                        placeholder={t('todo.durationPlaceholder', 'Duration (min)')}
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                    />
                                </View>
                            ) : (
                                <View style={[styles.gridItem, { backgroundColor: colors.surface, opacity: 0.5 }]}>
                                    <Hourglass size={18} color={colors.textMuted} />
                                    <Text style={[styles.gridText, { color: colors.textMuted }]}>{t('todo.durationRecordOnly', 'Record only')}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: colors.surface, opacity: dueTime ? 1 : 0.5 }]}
                                onPress={() => dueTime && setShowTimePicker('end')}
                                disabled={!dueTime}
                            >
                                <Clock size={18} color={dueTime ? colors.danger : colors.textMuted} />
                                <Text style={[styles.gridText, { color: dueTime ? colors.text : colors.textMuted }]}>
                                    {endTime || t('todo.endTime', 'End Time')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* SRS Profile & Routine Row */}
                        <View style={styles.srsRoutineRow}>
                            <TouchableOpacity
                                style={[styles.srsBtn, { backgroundColor: colors.surface }]}
                                onPress={() => setShowSRSPicker(true)}
                            >
                                <Repeat size={18} color={colors.success} />
                                <Text style={[styles.srsBtnText, { color: colors.text }]} numberOfLines={1}>
                                    {srsInterval || t('todo.noSrs', 'No SRS')}
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

                    {/* Action Buttons (3-column: Record, Start, Create) */}
                    <View style={[styles.actions, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.actionBtn, isRecordMode ? styles.actionBtnRecordActive : styles.actionBtnRecord]}
                            onPress={() => isRecordMode ? handleRecord() : setIsRecordMode(true)}
                        >
                            <CheckCircle size={18} color={isRecordMode ? '#fff' : colors.success} />
                            <Text style={[styles.actionBtnText, { color: isRecordMode ? '#fff' : colors.success }]}>
                                {isRecordMode ? t('todo.recordConfirm', 'Confirm') : t('todo.record', 'Record')}
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
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('todo.selectDate', 'Select Date')}</Text>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={dueDate || new Date()}
                                    mode="date"
                                    display="spinner"
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
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>
                                        {showTimePicker === 'start' ? t('todo.startTime', 'Start Time') : t('todo.endTime', 'End Time')}
                                    </Text>
                                    <TouchableOpacity onPress={() => {
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
            <Modal visible={showCategoryPicker} transparent animationType="fade">
                <TouchableOpacity style={styles.pickerOverlay} onPress={() => setShowCategoryPicker(false)}>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('category.selectCategory', 'Select Category')}</Text>
                        <ScrollView style={styles.pickerScroll}>
                            <TouchableOpacity
                                style={[styles.pickerItem, { borderBottomColor: colors.border, paddingLeft: 16 }]}
                                onPress={() => { setCategoryId(''); setShowCategoryPicker(false); }}
                            >
                                <View style={{ width: 24, marginRight: 12 }}>
                                    <File size={16} color={colors.textSecondary} />
                                </View>
                                <Text style={[styles.pickerItemText, { color: colors.textSecondary }]}>{t('todo.noCategory', 'No Category')}</Text>
                            </TouchableOpacity>
                            {tree.map(root => renderCategoryNode(root))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* SRS Picker Modal */}
            <Modal visible={showSRSPicker} transparent animationType="fade">
                <TouchableOpacity style={styles.pickerOverlay} onPress={() => setShowSRSPicker(false)}>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('srs.selectProfile', 'Select SRS Profile')}</Text>
                        <ScrollView style={styles.pickerScroll}>
                            <TouchableOpacity
                                style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                onPress={() => { setSrsInterval(''); setShowSRSPicker(false); }}
                            >
                                <Text style={[styles.pickerItemText, { color: colors.textSecondary }]}>{t('todo.noSrs', 'No SRS')}</Text>
                            </TouchableOpacity>
                            {srsProfiles.map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                    onPress={() => { setSrsInterval(p.name); setShowSRSPicker(false); }}
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
    datePickerSpinner: {
        height: 200,
    },
});
