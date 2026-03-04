import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Play, Calendar, Clock, Tag, Repeat, CheckCircle, Save, CalendarRange, ChevronRight } from 'lucide-react-native';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Todo } from '@studytodo/shared';
import { useThemeColors } from '../../providers/ThemeProvider';
import { CategoryTreePicker } from '../ui/CategoryTreePicker';
import { useTodoDetailForm } from '../../hooks/useTodoDetailForm';
import { ModalOverlay } from '../ui/ModalOverlay';

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
    const { t } = useTranslation();

    const form = useTodoDetailForm({
        visible, todo, onClose, onStartNow, onDelete, onUpdate, onRecord
    });

    if (!visible || !todo) return null;

    return (
        <ModalOverlay visible={visible} animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>

                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('todo.detailTitle', 'Task Details')}</Text>
                        <View style={styles.headerRight}>
                            <TouchableOpacity onPress={form.handleUpdate} style={styles.saveBtn}>
                                <Text style={[styles.saveBtnText, { color: colors.primary }]}>{t('common.save', 'Save')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtnIcon}>
                                <X size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                        {/* Category */}
                        <TouchableOpacity
                            style={[styles.inputRow, { backgroundColor: colors.surface }]}
                            onPress={() => form.setIsCategoryPickerVisible(true)}
                        >
                            <Tag size={18} color={colors.textMuted} />
                            <Text style={[styles.inputText, { color: colors.text }]} numberOfLines={1}>
                                {form.selectedCategoryLabel}
                            </Text>
                            <ChevronRight size={16} color={colors.textMuted} />
                        </TouchableOpacity>

                        {/* Content Input */}
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
                                value={form.content}
                                onChangeText={form.setContent}
                                placeholder={t('todo.contentPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.gridContainer}>
                            <View style={[styles.gridRow, { alignItems: 'stretch' }]}>
                                {/* Due Date */}
                                <TouchableOpacity
                                    style={[styles.gridItem, { backgroundColor: colors.surface, flex: 1, height: '100%', justifyContent: 'center' }]}
                                    onPress={() => form.setShowDatePicker(true)}
                                >
                                    <Calendar size={18} color={colors.primary} />
                                    <Text style={[styles.gridItemText, { color: colors.text }]} numberOfLines={1}>
                                        {form.dueDate ? format(form.dueDate, "yyyy-MM-dd") : t('todo.datePlaceholder', 'Date')}
                                    </Text>
                                </TouchableOpacity>

                                {/* Times */}
                                <View style={{ flex: 1, gap: 10 }}>
                                    <TouchableOpacity
                                        style={[styles.gridItem, { backgroundColor: colors.surface, flex: 1 }]}
                                        onPress={() => form.setShowTimePicker('start')}
                                    >
                                        <Clock size={18} color={colors.primary} />
                                        <Text style={[styles.gridItemText, { color: colors.text }]}>
                                            {form.dueTime || t('todo.startTime', 'Time')}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.gridItem, { backgroundColor: colors.surface, opacity: form.dueTime ? 1 : 0.5, flex: 1 }]}
                                        onPress={() => form.dueTime && form.setShowTimePicker('end')}
                                        disabled={!form.dueTime}
                                    >
                                        <Clock size={18} color={form.dueTime ? colors.danger : colors.textMuted} />
                                        <Text style={[styles.gridItemText, { color: form.dueTime ? colors.text : colors.textMuted }]}>
                                            {form.endTime || t('todo.endTime', 'End Time')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.gridRow}>
                                {/* SRS Profile */}
                                <TouchableOpacity
                                    style={[styles.gridItem, { backgroundColor: colors.surface }]}
                                    onPress={() => form.setIsSRSPickerVisible(true)}
                                >
                                    <Repeat size={18} color={colors.success} />
                                    <Text style={[styles.gridItemText, { color: colors.text }]} numberOfLines={1}>
                                        {form.srsInterval || t('todo.noSrs', 'No SRS')}
                                    </Text>
                                </TouchableOpacity>

                                {/* Routine Toggle */}
                                <TouchableOpacity
                                    style={[
                                        styles.routineToggle,
                                        { backgroundColor: form.isRoutineOpen || form.routineDays.length > 0 ? 'rgba(168, 85, 247, 0.1)' : colors.surface }
                                    ]}
                                    onPress={() => form.setIsRoutineOpen(!form.isRoutineOpen)}
                                >
                                    <CalendarRange size={18} color={form.isRoutineOpen || form.routineDays.length > 0 ? '#a855f7' : colors.icon} />
                                </TouchableOpacity>
                            </View>

                            {/* Routine Picker */}
                            {form.isRoutineOpen && (
                                <View style={[styles.routineContainer, { backgroundColor: colors.surface }]}>
                                    <View style={styles.routineHeader}>
                                        <Text style={[styles.routineLabel, { color: colors.textSecondary }]}>{t('guide.routineTitle', 'Routine Days')}</Text>
                                        {form.routineDays.length > 0 && (
                                            <TouchableOpacity onPress={() => form.setRoutineDays([])}>
                                                <Text style={styles.routineClear}>{t('common.clear', 'Clear')}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <View style={styles.weekdayRow}>
                                        {['0', '1', '2', '3', '4', '5', '6'].map((key, index) => {
                                            const isSelected = form.routineDays.includes(index);
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
                                                            form.setRoutineDays(form.routineDays.filter(d => d !== index));
                                                        } else {
                                                            form.setRoutineDays([...form.routineDays, index].sort((a, b) => a - b));
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

                        {/* Stats Summary */}
                        <View style={styles.statsSection}>
                            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t('todo.statsTitle', 'Learning History').toUpperCase()}</Text>
                            <View style={[styles.statsBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff' }]}>
                                <Clock size={20} color={colors.primary} />
                                <View style={styles.statsTextColumn}>
                                    <Text style={[styles.statsSmallLabel, { color: colors.textSecondary }]}>{t('todo.results', 'Results')}</Text>
                                    <Text style={[styles.statsValueText, { color: colors.text }]}>
                                        {form.todoSessions.length}回 ({form.totalMinutes}分)
                                    </Text>
                                </View>
                            </View>
                        </View>

                    </ScrollView>

                    {/* Bottom Actions */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        {form.isRecording ? (
                            <View style={styles.recordingRow}>
                                <TouchableOpacity onPress={form.handleRecordSubmit} style={[styles.recordActionBtn, { backgroundColor: colors.success }]}>
                                    <Save size={20} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.durationPickerBtn, { backgroundColor: colors.surface }]}
                                    onPress={() => form.setShowDurationPicker(true)}
                                >
                                    <Clock size={20} color={colors.primary} />
                                    <View style={styles.durationValueContainer}>
                                        <Text style={[styles.durationValueText, { color: colors.text }]}>
                                            {form.recordDuration ? (
                                                <>
                                                    {parseInt(form.recordDuration, 10)}
                                                    <Text style={styles.durationUnitText}>{t('common.minute', 'min')}</Text>
                                                </>
                                            ) : (
                                                <Text style={{ color: colors.textMuted }}>{t('todo.durationPlaceholder', 'Select Duration')}</Text>
                                            )}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => form.setIsRecording(false)} style={[styles.recordActionBtn, { backgroundColor: colors.surface }]}>
                                    <X size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.mainActionContainer}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7' }]}
                                        onPress={() => form.setIsRecording(true)}
                                    >
                                        <CheckCircle size={20} color="#16a34a" />
                                        <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>{t('todo.record')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#ffedd5' }]}
                                        onPress={form.handleStartNow}
                                    >
                                        <Play size={18} color="#d97706" fill="#d97706" />
                                        <Text style={[styles.actionBtnText, { color: '#d97706' }]}>{t('todo.start')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.secondaryActionContainer}>
                                    <TouchableOpacity
                                        style={[styles.secondaryActionBtn, { backgroundColor: colors.surface }]}
                                        onPress={form.handlePostpone}
                                    >
                                        <CalendarRange size={16} color={colors.textSecondary} />
                                        <Text style={[styles.secondaryActionText, { color: colors.textSecondary }]}>{t('todo.postpone')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteBtnContainer}
                                        onPress={form.handleDelete}
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
                visible={form.isCategoryPickerVisible}
                onClose={() => form.setIsCategoryPickerVisible(false)}
                categories={form.categories}
                selectedId={form.categoryId}
                onSelect={(id) => form.setCategoryId(id)}
            />

            {/* Date Picker Modal */}
            {form.showDatePicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible={form.showDatePicker} transparent animationType="fade">
                        <View style={styles.datePickerOverlay}>
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
                                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity onPress={() => {
                                        form.setDueDate(null);
                                        form.setShowDatePicker(false);
                                    }}>
                                        <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('todo.datePlaceholder', 'Date')}</Text>
                                    <TouchableOpacity onPress={() => {
                                        if (!form.dueDate) form.setDueDate(new Date());
                                        form.setShowDatePicker(false);
                                    }}>
                                        <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={form.dueDate || new Date()}
                                    mode="date"
                                    display="spinner"
                                    textColor={colors.text}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    onChange={(event, date) => {
                                        if (date) form.setDueDate(date);
                                    }}
                                    style={styles.datePickerSpinner}
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={form.dueDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            form.setShowDatePicker(false);
                            if (date) form.setDueDate(date);
                        }}
                    />
                )
            )}

            {/* Time Picker Modal */}
            {form.showTimePicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible={!!form.showTimePicker} transparent animationType="fade">
                        <View style={styles.datePickerOverlay}>
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
                                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity onPress={() => {
                                        if (form.showTimePicker === 'start') form.setDueTime('');
                                        if (form.showTimePicker === 'end') form.setEndTime('');
                                        form.setShowTimePicker(null);
                                    }}>
                                        <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>
                                        {form.showTimePicker === 'start' ? t('todo.startTime', 'Time') : t('todo.endTime', 'End Time')}
                                    </Text>
                                    <TouchableOpacity onPress={() => {
                                        if (form.showTimePicker === 'start' && !form.dueTime) form.setDueTime(format(new Date(), 'HH:mm'));
                                        if (form.showTimePicker === 'end' && !form.endTime) form.setEndTime(format(new Date(), 'HH:mm'));
                                        form.setShowTimePicker(null);
                                    }}>
                                        <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={
                                        (form.showTimePicker === 'start' ? form.dueTime : form.endTime)
                                            ? new Date(`2000-01-01T${form.showTimePicker === 'start' ? form.dueTime : form.endTime}`)
                                            : new Date()
                                    }
                                    mode="time"
                                    display="spinner"
                                    textColor={colors.text}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    onChange={(event, date) => {
                                        if (date) {
                                            const time = format(date, 'HH:mm');
                                            if (form.showTimePicker === 'start') form.setDueTime(time);
                                            else form.setEndTime(time);
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
                            (form.showTimePicker === 'start' ? form.dueTime : form.endTime)
                                ? new Date(`2000-01-01T${form.showTimePicker === 'start' ? form.dueTime : form.endTime}`)
                                : new Date()
                        }
                        mode="time"
                        display="default"
                        onChange={(event, date) => {
                            form.setShowTimePicker(null);
                            if (date) {
                                const time = format(date, 'HH:mm');
                                if (form.showTimePicker === 'start') form.setDueTime(time);
                                else form.setEndTime(time);
                            }
                        }}
                    />
                )
            )}

            {/* Duration Picker Modal */}
            {form.showDurationPicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible={form.showDurationPicker} transparent animationType="fade">
                        <View style={styles.datePickerOverlay}>
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
                                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity onPress={() => {
                                        form.setRecordDuration('');
                                        form.setShowDurationPicker(false);
                                    }}>
                                        <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('todo.durationPlaceholder', 'Duration')}</Text>
                                    <TouchableOpacity onPress={() => {
                                        if (!form.recordDuration || form.recordDuration === '0') {
                                            form.setRecordDuration('30');
                                        }
                                        form.setShowDurationPicker(false);
                                    }}>
                                        <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={(() => {
                                        const d = new Date();
                                        d.setHours(0);
                                        d.setMinutes(parseInt(form.recordDuration || '0', 10));
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
                                            form.setRecordDuration(minutes.toString());
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
                            d.setMinutes(parseInt(form.recordDuration || '0', 10));
                            return d;
                        })()}
                        mode="time"
                        display="spinner"
                        is24Hour={true}
                        minuteInterval={5}
                        onChange={(event, date) => {
                            form.setShowDurationPicker(false);
                            if (date) {
                                const minutes = date.getHours() * 60 + date.getMinutes();
                                form.setRecordDuration(minutes.toString());
                            }
                        }}
                    />
                )
            )}

            {/* SRS Picker Modal */}
            <Modal visible={form.isSRSPickerVisible} transparent animationType="fade">
                <TouchableOpacity style={styles.pickerOverlay} onPress={() => form.setIsSRSPickerVisible(false)}>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('srs.selectProfile', 'Select SRS Profile')}</Text>
                        <ScrollView style={styles.pickerScroll}>
                            <TouchableOpacity
                                style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                onPress={() => { form.setSrsInterval(''); form.setIsSRSPickerVisible(false); }}
                            >
                                <Text style={[styles.pickerItemText, { color: colors.textSecondary }]}>{t('todo.noSrs', 'No SRS')}</Text>
                            </TouchableOpacity>
                            {form.srsProfiles.map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                    onPress={() => { form.setSrsInterval(p.name); form.setIsSRSPickerVisible(false); }}
                                >
                                    <Text style={[styles.pickerItemText, { color: colors.text }]}>{p.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ModalOverlay>
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
    content: {},
    scrollContent: {
        padding: 16,
        gap: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    inputText: {
        flex: 1,
        fontSize: 15,
    },
    contentInputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    statusIconWrapper: {
        marginTop: 4,
    },
    checkboxCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
    },
    contentInput: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    gridContainer: {
        gap: 10,
    },
    gridRow: {
        flexDirection: 'row',
        gap: 10,
    },
    gridItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
        flex: 1,
    },
    gridItemText: {
        fontSize: 14,
    },
    routineToggle: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    routineContainer: {
        borderRadius: 12,
        padding: 12,
    },
    routineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    routineLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    routineClear: {
        fontSize: 12,
        color: '#ef4444',
    },
    weekdayRow: {
        flexDirection: 'row',
        gap: 6,
    },
    weekdayBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 8,
    },
    weekdayBtnActive: {
        backgroundColor: '#a855f7',
    },
    weekdayText: {
        fontSize: 12,
        fontWeight: '600',
    },
    weekdayTextActive: {
        color: '#fff',
    },
    statsSection: {
        gap: 8,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    statsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 12,
    },
    statsTextColumn: {
        flex: 1,
    },
    statsSmallLabel: {
        fontSize: 11,
    },
    statsValueText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        gap: 10,
    },
    recordingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    recordActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
        fontSize: 16,
        fontWeight: '600',
    },
    durationUnitText: {
        fontSize: 12,
        fontWeight: 'normal',
    },
    mainActionContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    secondaryActionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    secondaryActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
    },
    secondaryActionText: {
        fontSize: 13,
    },
    deleteBtnContainer: {
        padding: 8,
    },
    deleteText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '500',
    },
    datePickerOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
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
        fontWeight: '600',
    },
    datePickerCancel: {
        fontSize: 15,
    },
    datePickerDone: {
        fontSize: 15,
        fontWeight: '600',
    },
    datePickerSpinner: {
        height: 200,
    },
    pickerOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    pickerContainer: {
        width: '80%',
        maxHeight: '50%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    pickerTitle: {
        fontSize: 16,
        fontWeight: '600',
        padding: 16,
    },
    pickerScroll: {
        maxHeight: 300,
    },
    pickerItem: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    pickerItemText: {
        fontSize: 15,
    },
});