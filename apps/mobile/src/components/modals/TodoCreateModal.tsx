import React from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Tag, Repeat, Play, CheckCircle, Plus, Calendar, Clock, CalendarDays, Save } from 'lucide-react-native';
import { format } from 'date-fns';
import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';
import { Todo, Category } from '@studytodo/shared';
import { useThemeColors } from '../../providers/ThemeProvider';
import { CategoryTreePicker } from '../ui/CategoryTreePicker';
import { useTodoCreateForm } from '../../hooks/useTodoCreateForm';
import { ModalOverlay } from '../ui/ModalOverlay';

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

    const form = useTodoCreateForm({
        visible, categories, initialDate, initialTime, onClose, onStartNow
    });

    if (!visible) return null;

    return (
        <ModalOverlay visible={visible} animationType="slide">
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
                        {/* Category Selection */}
                        <TouchableOpacity
                            style={[styles.optionRow, { backgroundColor: colors.surface }]}
                            onPress={() => form.setShowCategoryPicker(true)}
                        >
                            <Tag size={18} color={colors.icon} />
                            <Text style={[styles.optionText, { color: colors.text }]}>{form.selectedCategoryLabel}</Text>
                        </TouchableOpacity>

                        {/* Content Input */}
                        <TextInput
                            style={[styles.contentInput, { color: colors.text, borderColor: colors.primary }]}
                            value={form.content}
                            onChangeText={form.setContent}
                            placeholder={t('todo.contentPlaceholder', "Title\nMemo (2nd line+)")}
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Date & Time Grid */}
                        <View style={[styles.gridRow, { alignItems: 'stretch' }]}>
                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: colors.surface, flex: 1 }]}
                                onPress={() => form.setShowDatePicker(true)}
                            >
                                <Calendar size={18} color={colors.primary} />
                                <Text style={[styles.gridText, { color: colors.text }]}>
                                    {form.dueDate ? format(form.dueDate, t('common.dateFormat', 'MMM d (EEE)'), { locale }) : t('todo.datePlaceholder', 'Select Date')}
                                </Text>
                            </TouchableOpacity>

                            <View style={{ flex: 1, gap: 10 }}>
                                <TouchableOpacity
                                    style={[styles.gridItem, { backgroundColor: colors.surface, flex: 1 }]}
                                    onPress={() => form.setShowTimePicker('start')}
                                >
                                    <Clock size={18} color={colors.primary} />
                                    <Text style={[styles.gridText, { color: colors.text }]}>
                                        {form.dueTime || t('todo.startTime', 'Start Time')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.gridItem, { backgroundColor: colors.surface, opacity: form.dueTime ? 1 : 0.5, flex: 1 }]}
                                    onPress={() => form.dueTime && form.setShowTimePicker('end')}
                                    disabled={!form.dueTime}
                                >
                                    <Clock size={18} color={form.dueTime ? colors.danger : colors.textMuted} />
                                    <Text style={[styles.gridText, { color: form.dueTime ? colors.text : colors.textMuted }]}>
                                        {form.endTime || t('todo.endTime', 'End Time')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* SRS & Routine Row */}
                        <View style={styles.srsRoutineRow}>
                            <TouchableOpacity
                                style={[styles.srsBtn, { backgroundColor: colors.surface }]}
                                onPress={() => form.setShowSRSPicker(true)}
                            >
                                <Repeat size={18} color={colors.success} />
                                <Text style={[styles.srsBtnText, { color: colors.text }]} numberOfLines={1}>
                                    {form.selectedSrsName || t('todo.noSrs', 'No SRS')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.routineToggle,
                                    { backgroundColor: form.isRoutineOpen || form.routineDays.length > 0 ? 'rgba(168, 85, 247, 0.1)' : colors.surface }
                                ]}
                                onPress={() => form.setIsRoutineOpen(!form.isRoutineOpen)}
                            >
                                <CalendarDays size={18} color={form.isRoutineOpen || form.routineDays.length > 0 ? '#a855f7' : colors.icon} />
                            </TouchableOpacity>
                        </View>

                        {/* Routine Weekday Picker */}
                        {form.isRoutineOpen && (
                            <View style={[styles.routineContainer, { backgroundColor: colors.surface }]}>
                                <View style={styles.routineHeader}>
                                    <View style={styles.routineLabelRow}>
                                        <CalendarDays size={14} color="#a855f7" />
                                        <Text style={[styles.routineLabel, { color: colors.textSecondary }]}>{t('guide.routineTitle', 'Routine')}</Text>
                                    </View>
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
                                                key={index}
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
                        {form.isRecordMode ? (
                            <View style={styles.recordingRow}>
                                <TouchableOpacity onPress={form.handleRecord} style={[styles.recordActionBtn, { backgroundColor: colors.success }]}>
                                    <Save size={20} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.durationPickerBtn, { backgroundColor: colors.surface }]}
                                    onPress={() => form.setShowDurationPicker(true)}
                                >
                                    <Clock size={20} color={colors.primary} />
                                    <View style={styles.durationValueContainer}>
                                        <Text style={[styles.durationValueText, { color: colors.text }]}>
                                            {form.duration ? (
                                                <>
                                                    {parseInt(form.duration, 10)}
                                                    <Text style={styles.durationUnitText}>{t('common.minute', 'min')}</Text>
                                                </>
                                            ) : (
                                                <Text style={{ color: colors.textMuted }}>{t('todo.durationPlaceholder', 'Select Duration')}</Text>
                                            )}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => form.setIsRecordMode(false)} style={[styles.recordActionBtn, { backgroundColor: colors.surface }]}>
                                    <X size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.actionBtnRecord]}
                                    onPress={() => form.setIsRecordMode(true)}
                                >
                                    <CheckCircle size={18} color={colors.success} />
                                    <Text style={[styles.actionBtnText, { color: colors.success }]}>
                                        {t('todo.record', 'Record')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionBtnStart} onPress={form.handleStartNow}>
                                    <Play size={18} color="#ea580c" fill="#ea580c" />
                                    <Text style={[styles.actionBtnText, { color: '#ea580c' }]}>{t('todo.start', 'Start')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionBtnCreate} onPress={form.handleCreate}>
                                    <Plus size={18} color={colors.primary} />
                                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>{t('todo.create', 'Create')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Date Picker */}
            {form.showDatePicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible={form.showDatePicker} transparent animationType="fade">
                        <View style={styles.datePickerOverlay}>
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
                                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity onPress={() => { form.setDueDate(null); form.setShowDatePicker(false); }}>
                                        <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('todo.selectDate', 'Select Date')}</Text>
                                    <TouchableOpacity onPress={() => { if (!form.dueDate) form.setDueDate(new Date()); form.setShowDatePicker(false); }}>
                                        <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={form.dueDate || new Date()}
                                    mode="date"
                                    display="spinner"
                                    textColor={colors.text}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    onChange={(event, date) => { if (date) form.setDueDate(date); }}
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
                        onChange={(event, date) => { form.setShowDatePicker(false); if (date) form.setDueDate(date); }}
                    />
                )
            )}

            {/* Time Picker */}
            {form.showTimePicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible={!!form.showTimePicker} transparent animationType="fade">
                        <View style={styles.datePickerOverlay}>
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
                                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity onPress={() => {
                                        if (form.showTimePicker === 'start') form.setDueTime('');
                                        else form.setEndTime('');
                                        form.setShowTimePicker(null);
                                    }}>
                                        <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>
                                        {form.showTimePicker === 'start' ? t('todo.startTime', 'Start Time') : t('todo.endTime', 'End Time')}
                                    </Text>
                                    <TouchableOpacity onPress={() => {
                                        const timeStr = format(new Date(), 'HH:mm');
                                        if (form.showTimePicker === 'start' && !form.dueTime) form.setDueTime(timeStr);
                                        if (form.showTimePicker === 'end' && !form.endTime) form.setEndTime(timeStr);
                                        form.setShowTimePicker(null);
                                    }}>
                                        <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={
                                        form.showTimePicker === 'start' && form.dueTime ? new Date(`2000-01-01T${form.dueTime}`)
                                            : form.showTimePicker === 'end' && form.endTime ? new Date(`2000-01-01T${form.endTime}`)
                                                : new Date()
                                    }
                                    mode="time"
                                    display="spinner"
                                    textColor={colors.text}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    minuteInterval={5}
                                    onChange={(event, date) => {
                                        if (date) {
                                            const timeStr = format(date, 'HH:mm');
                                            if (form.showTimePicker === 'start') form.setDueTime(timeStr);
                                            else form.setEndTime(timeStr);
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
                            form.showTimePicker === 'start' && form.dueTime ? new Date(`2000-01-01T${form.dueTime}`)
                                : form.showTimePicker === 'end' && form.endTime ? new Date(`2000-01-01T${form.endTime}`)
                                    : new Date()
                        }
                        mode="time"
                        display="default"
                        minuteInterval={5}
                        onChange={(event, date) => {
                            const pickerType = form.showTimePicker;
                            form.setShowTimePicker(null);
                            if (date) {
                                const timeStr = format(date, 'HH:mm');
                                if (pickerType === 'start') { form.setDueTime(timeStr); if (!timeStr) form.setEndTime(''); }
                                else form.setEndTime(timeStr);
                            }
                        }}
                    />
                )
            )}

            {/* Category Picker */}
            <CategoryTreePicker
                visible={form.showCategoryPicker}
                onClose={() => form.setShowCategoryPicker(false)}
                categories={categories}
                selectedId={form.categoryId}
                onSelect={(id) => form.setCategoryId(id)}
            />

            {/* Duration Picker */}
            {form.showDurationPicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible={form.showDurationPicker} transparent animationType="fade">
                        <View style={styles.datePickerOverlay}>
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
                                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity onPress={() => { form.setDuration(''); form.setShowDurationPicker(false); }}>
                                        <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('todo.durationPlaceholder', 'Duration')}</Text>
                                    <TouchableOpacity onPress={() => {
                                        if (!form.duration || form.duration === '0') form.setDuration('30');
                                        form.setShowDurationPicker(false);
                                    }}>
                                        <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={(() => { const d = new Date(); d.setHours(0); d.setMinutes(parseInt(form.duration || '0', 10)); return d; })()}
                                    mode="countdown"
                                    display="spinner"
                                    textColor={colors.text}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    minuteInterval={5}
                                    onChange={(event, date) => { if (date) { const m = date.getHours() * 60 + date.getMinutes(); form.setDuration(m.toString()); } }}
                                    style={styles.datePickerSpinner}
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={(() => { const d = new Date(); d.setHours(0); d.setMinutes(parseInt(form.duration || '0', 10)); return d; })()}
                        mode="time"
                        display="spinner"
                        is24Hour={true}
                        minuteInterval={5}
                        onChange={(event, date) => { form.setShowDurationPicker(false); if (date) { const m = date.getHours() * 60 + date.getMinutes(); form.setDuration(m.toString()); } }}
                    />
                )
            )}

            {/* SRS Picker */}
            <Modal visible={form.showSRSPicker} transparent animationType="fade">
                <TouchableOpacity style={styles.pickerOverlay} onPress={() => form.setShowSRSPicker(false)}>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('srs.selectProfile', 'Select SRS Profile')}</Text>
                        <ScrollView style={styles.pickerScroll}>
                            <TouchableOpacity
                                style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                onPress={() => { form.setSrsProfileId(''); form.setShowSRSPicker(false); }}
                            >
                                <Text style={[styles.pickerItemText, { color: colors.textSecondary }]}>{t('todo.noSrs', 'No SRS')}</Text>
                            </TouchableOpacity>
                            {form.srsProfiles.map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                    onPress={() => { form.setSrsProfileId(p.id); form.setShowSRSPicker(false); }}
                                >
                                    <Text style={[styles.pickerItemText, { color: colors.text }]}>{p.isDefault ? t('srs.defaultProfileName', 'Forgetting Curve (Standard)') : p.name}</Text>
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    closeBtn: { padding: 4 },
    content: { padding: 16 },
    optionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 10, marginBottom: 12 },
    optionText: { flex: 1, fontSize: 14 },
    contentInput: { borderBottomWidth: 2, paddingVertical: 12, fontSize: 16, fontWeight: '500', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
    gridRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    gridItem: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8 },
    gridText: { fontSize: 14 },
    actions: { flexDirection: 'row', padding: 16, borderTopWidth: 1, gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 6 },
    actionBtnRecord: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 6, backgroundColor: 'rgba(34, 197, 94, 0.1)' },
    actionBtnStart: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 6, backgroundColor: 'rgba(234, 88, 12, 0.1)' },
    actionBtnCreate: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 6, backgroundColor: 'rgba(59, 130, 246, 0.1)' },
    actionBtnText: { fontWeight: 'bold', fontSize: 13 },
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    pickerContainer: { width: '80%', maxHeight: '60%', borderRadius: 16, padding: 16 },
    pickerTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    pickerScroll: { maxHeight: 300 },
    pickerItem: { paddingVertical: 14, borderBottomWidth: 1 },
    pickerItemText: { fontSize: 15 },
    srsRoutineRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    srsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8 },
    srsBtnText: { flex: 1, fontSize: 14 },
    routineToggle: { padding: 12, borderRadius: 12 },
    routineContainer: { padding: 12, borderRadius: 12, marginBottom: 12 },
    routineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    routineLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    routineLabel: { fontSize: 12, fontWeight: 'bold' },
    routineClear: { fontSize: 10, color: '#ef4444' },
    weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
    weekdayBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    weekdayBtnActive: { backgroundColor: '#3b82f6' },
    weekdayText: { fontSize: 12, fontWeight: 'bold', color: '#6b7280' },
    weekdayTextActive: { color: '#fff' },
    datePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    datePickerContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30 },
    datePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    datePickerTitle: { fontSize: 16, fontWeight: 'bold' },
    datePickerDone: { fontSize: 16, fontWeight: 'bold' },
    datePickerCancel: { fontSize: 16 },
    datePickerSpinner: { height: 200 },
    recordingRow: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 },
    durationPickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8 },
    durationValueContainer: { flex: 1 },
    durationValueText: { fontSize: 14, fontWeight: 'bold' },
    durationUnitText: { fontSize: 12, fontWeight: 'normal', marginLeft: 4 },
    recordActionBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
