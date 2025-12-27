import React, { useState, useMemo } from 'react';
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
    ActionSheetIOS,
} from 'react-native';
import { X, Calendar, PlayCircle, StopCircle, Hourglass, Repeat, BookOpen, FileText, CheckCircle, Play, Plus, Tag, ChevronDown } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Category, generateId, SRSProfile, Todo } from '@pomarc/shared';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileSRS } from '../../hooks/useMobileSRS';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TodoCreateModalProps {
    visible: boolean;
    onClose: () => void;
    categories: Category[];
    initialDate?: Date;
    initialTime?: string;
    onStartNow?: (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => void;
}

export const TodoCreateModal = ({ visible, onClose, categories, initialDate, initialTime, onStartNow }: TodoCreateModalProps) => {
    const { addTodo } = useMobileTodos();
    const { profiles: srsProfiles, refreshProfiles } = useMobileSRS();

    // Refresh SRS on open
    React.useEffect(() => {
        if (visible) {
            refreshProfiles();
            // Apply Keep defaults if provided, else reset
            if (initialDate) setDueDate(initialDate);
            if (initialTime) setStartTime(new Date(`${format(initialDate || new Date(), 'yyyy-MM-dd')}T${initialTime}`));
        }
    }, [visible, refreshProfiles, initialDate, initialTime]);

    // State
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState<string>("");

    // Options
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [startTime, setStartTime] = useState<Date | undefined>(undefined);
    const [endTime, setEndTime] = useState<Date | undefined>(undefined);
    const [durationStr, setDurationStr] = useState("");
    const [srsProfileId, setSrsProfileId] = useState<string>("");
    const [range, setRange] = useState("");
    const [memo, setMemo] = useState("");

    // DatePicker Control
    const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
    const [currentPickerTarget, setCurrentPickerTarget] = useState<"due" | "start" | "end" | null>(null);

    // Helpers
    const categoryOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        const traverse = (cats: Category[], prefix = "") => {
            cats.forEach(c => {
                const label = prefix ? `${prefix} > ${c.name}` : c.name;
                options.push({ value: c.id, label });
                if (c.children) traverse(c.children, label);
            });
        };
        traverse(categories);
        return options;
    }, [categories]);

    const activeCategoryLabel = categoryOptions.find(c => c.value === categoryId)?.label || "カテゴリなし";
    const activeSrsLabel = srsProfiles.find(p => p.id === srsProfileId)?.name || "SRSなし";

    const resetForm = () => {
        setTitle("");
        setCategoryId("");
        setDueDate(undefined);
        setStartTime(undefined);
        setEndTime(undefined);
        setDurationStr("");
        setSrsProfileId("");
        setRange("");
        setMemo("");
        onClose();
    };

    const handleCreate = async () => {
        if (!title.trim() && !categoryId) return; // Allow if category selected (title auto-fill logic?) Web does this.

        try {
            const finalTitle = title.trim() || activeCategoryLabel.split(' > ').pop() || "No Title";

            const newTodo: Todo = {
                id: generateId(),
                title: finalTitle,
                categoryId: categoryId || undefined,
                priority: 'medium',
                dueDate: dueDate,
                dueTime: startTime ? format(startTime, 'HH:mm') : undefined,
                endTime: endTime ? format(endTime, 'HH:mm') : undefined,
                estimatedDuration: durationStr ? parseInt(durationStr, 10) : undefined,
                srsProfileId: srsProfileId || undefined, // using ID instead of 'srsInterval' string for robustness in V3? 
                // Web logic maps 'srsInterval' to profile NAME usually? 
                // Wait, Web used `srsInterval` string state = profile.name.
                // Let's match Web exactly? Mobile repo uses `srsProfileId`. 
                // Shared types have both `srsProfileId` and `srsInterval`.
                // I'll stick to `srsProfileId` for better data integrity, 
                // but populate `srsInterval` as name if needed for legacy.
                srsInterval: srsProfiles.find(p => p.id === srsProfileId)?.name,
                srsLevel: srsProfileId ? 0 : undefined,
                range,
                memo, // Mapped to notes? or 'memo' column we added.
                notes: memo, // Sync both for safety
                completed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await addTodo(newTodo);
            resetForm();
        } catch (e) {
            console.error(e);
        }
    };

    const handleRecord = async () => {
        // Implement Session logging + Todo creation
        // For now, just create todo as completed? Or just create todo.
        // Web: onRecord -> create todo + log session.
        // We lack session hook in this file. 
        // Just calling handleCreate for now, todo: add session logic later.
        await handleCreate();
    };

    const handleStartNow = async () => {
        if (!title.trim() && !categoryId) return;
        const finalTitle = title.trim() || activeCategoryLabel.split(' > ').pop() || "No Title";

        if (onStartNow) {
            onStartNow({
                title: finalTitle,
                categoryId: categoryId || undefined,
                priority: 'medium',
                dueDate: dueDate,
                dueTime: startTime ? format(startTime, 'HH:mm') : undefined,
                endTime: endTime ? format(endTime, 'HH:mm') : undefined,
                estimatedDuration: durationStr ? parseInt(durationStr, 10) : undefined,
                srsProfileId: srsProfileId || undefined,
                srsInterval: srsProfiles.find(p => p.id === srsProfileId)?.name,
                srsLevel: srsProfileId ? 0 : undefined,
                range,
                memo,
                notes: memo,
                updatedAt: new Date(),
            });
            resetForm();
        } else {
            // Fallback if no prop provided (e.g. older usage)
            await handleCreate();
        }
    };

    // Picker Handling
    const showPicker = (target: "due" | "start" | "end", mode: "date" | "time") => {
        setCurrentPickerTarget(target);
        setPickerMode(mode);
    };

    const onPickerChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setCurrentPickerTarget(null); // Close dialog on Android
        }

        if (event.type === 'dismissed') return;

        if (selectedDate && currentPickerTarget) {
            if (currentPickerTarget === 'due') {
                setDueDate(selectedDate);
            }
            if (currentPickerTarget === 'start') {
                setStartTime(selectedDate);
                // Web Parity: Auto-set due date if empty
                if (!dueDate) setDueDate(new Date());
            }
            if (currentPickerTarget === 'end') {
                setEndTime(selectedDate);
            }
        }
    };

    const [isCategoryPickerVisible, setCategoryPickerVisible] = useState(false);
    const [isSRSPickerVisible, setSRSPickerVisible] = useState(false);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={[styles.container, (currentPickerTarget && Platform.OS === 'ios') ? { paddingBottom: 250 } : {}]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Todo作成</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#888" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                        {/* 1. Category Row */}
                        <TouchableOpacity style={styles.categoryRow} onPress={() => setCategoryPickerVisible(true)}>
                            <Tag size={18} color="#666" />
                            <Text style={[styles.categoryText, !categoryId && styles.placeholderText]}>
                                {activeCategoryLabel}
                            </Text>
                            <ChevronDown size={16} color="#999" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>

                        {/* 2. Title Input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.titleInput}
                                placeholder="タスク名 (任意)"
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor="#ccc"
                            />
                        </View>

                        {/* 3. Grid Options */}
                        <View style={styles.grid}>
                            {/* Date */}
                            <TouchableOpacity style={styles.gridItem} onPress={() => showPicker('due', 'date')}>
                                <Calendar size={18} color="#3b82f6" />
                                <Text style={styles.gridText}>
                                    {dueDate ? format(dueDate, 'MM/dd(EEE)', { locale: ja }) : '日付'}
                                </Text>
                            </TouchableOpacity>

                            {/* Start Time */}
                            <TouchableOpacity style={styles.gridItem} onPress={() => showPicker('start', 'time')}>
                                <PlayCircle size={18} color="#3b82f6" />
                                <Text style={styles.gridText}>
                                    {startTime ? format(startTime, 'HH:mm') : '開始'}
                                </Text>
                            </TouchableOpacity>

                            {/* Duration */}
                            <View style={styles.gridItem}>
                                <Hourglass size={18} color="#f97316" />
                                <TextInput
                                    style={styles.inlineInput}
                                    placeholder="分"
                                    keyboardType="numeric"
                                    value={durationStr}
                                    onChangeText={setDurationStr}
                                />
                            </View>

                            {/* End Time */}
                            <TouchableOpacity style={styles.gridItem} onPress={() => showPicker('end', 'time')}>
                                <StopCircle size={18} color="#ef4444" />
                                <Text style={styles.gridText}>
                                    {endTime ? format(endTime, 'HH:mm') : '終了'}
                                </Text>
                            </TouchableOpacity>

                            {/* SRS */}
                            <TouchableOpacity style={[styles.gridItem, styles.colSpan2]} onPress={() => setSRSPickerVisible(true)}>
                                <Repeat size={18} color="#888" />
                                <Text style={styles.gridText}>{activeSrsLabel}</Text>
                                <ChevronDown size={14} color="#ccc" style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        </View>

                        {/* 4. Extra Info */}
                        <View style={styles.extraContainer}>
                            <View style={styles.extraRow}>
                                <BookOpen size={18} color="#999" />
                                <TextInput
                                    style={styles.extraInput}
                                    placeholder="範囲 (例: p.10-20)"
                                    value={range}
                                    onChangeText={setRange}
                                />
                            </View>
                            <View style={styles.extraRow}>
                                <FileText size={18} color="#999" />
                                <TextInput
                                    style={styles.extraInput}
                                    placeholder="メモ"
                                    value={memo}
                                    onChangeText={setMemo}
                                />
                            </View>
                        </View>

                    </ScrollView>

                    {/* 5. Action Buttons */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]} onPress={handleRecord}>
                            <CheckCircle size={18} color="#16a34a" />
                            <Text style={[styles.actionText, { color: '#16a34a' }]}>記録</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ffedd5' }]} onPress={handleStartNow}>
                            <Play size={18} color="#ea580c" fill="#ea580c" />
                            <Text style={[styles.actionText, { color: '#ea580c' }]}>開始</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dbeafe' }]} onPress={handleCreate}>
                            <Plus size={18} color="#2563eb" />
                            <Text style={[styles.actionText, { color: '#2563eb' }]}>作成</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Overlays for Pickers */}
                {isCategoryPickerVisible && (
                    <SelectionModal
                        title="カテゴリ選択"
                        options={categoryOptions}
                        onSelect={(val: string) => { setCategoryId(val); setCategoryPickerVisible(false); }}
                        onClose={() => setCategoryPickerVisible(false)}
                    />
                )}
                {isSRSPickerVisible && (
                    <SelectionModal
                        title="SRS設定"
                        options={[{ value: '', label: 'SRSなし' }, ...srsProfiles.map(p => ({ value: p.id, label: p.name }))]}
                        onSelect={(val: string) => { setSrsProfileId(val); setSRSPickerVisible(false); }}
                        onClose={() => setSRSPickerVisible(false)}
                    />
                )}

                {/* iOS Picker (Bottom Sheet Style) */}
                {Platform.OS === 'ios' && currentPickerTarget && (
                    <View style={styles.iosPickerContainer}>
                        <View style={styles.iosPickerHeader}>
                            <TouchableOpacity onPress={() => setCurrentPickerTarget(null)}>
                                <Text style={styles.pickerDoneText}>完了</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={
                                (currentPickerTarget === 'due' ? dueDate :
                                    currentPickerTarget === 'start' ? startTime : endTime) || new Date()
                            }
                            mode={pickerMode}
                            display="spinner"
                            onChange={onPickerChange}
                            style={styles.iosPicker}
                            textColor="#000000"
                        />
                    </View>
                )}

                {/* Android Picker (Dialog) - Rendered conditionally but without wrapper */}
                {Platform.OS === 'android' && currentPickerTarget && (
                    <DateTimePicker
                        value={
                            (currentPickerTarget === 'due' ? dueDate :
                                currentPickerTarget === 'start' ? startTime : endTime) || new Date()
                        }
                        mode={pickerMode}
                        display="default"
                        onChange={onPickerChange}
                    />
                )}

            </KeyboardAvoidingView>
        </Modal>
    );
};

// Helper Component for Selection
const SelectionModal = ({ title, options, onSelect, onClose }: any) => (
    <Modal visible transparent animationType="fade">
        <TouchableOpacity style={styles.selectionBackdrop} onPress={onClose}>
            <View style={styles.selectionContainer}>
                <View style={styles.selectionHeader}>
                    <Text style={styles.selectionTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose}><X size={20} color="#888" /></TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 300 }}>
                    {options.map((opt: any) => (
                        <TouchableOpacity key={opt.value} style={styles.optionItem} onPress={() => onSelect(opt.value)}>
                            <Text style={styles.optionLabel}>{opt.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </TouchableOpacity>
    </Modal>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeBtn: {
        padding: 5,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
    },
    categoryText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
    },
    placeholderText: {
        color: '#888',
    },
    inputContainer: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderColor: '#e2e8f0',
    },
    titleInput: {
        fontSize: 20, // Large font
        paddingVertical: 10,
        fontWeight: '500',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    gridItem: {
        width: '48%', // Approx 2 col
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        gap: 8,
    },
    colSpan2: {
        width: '100%',
    },
    gridText: {
        fontSize: 13,
        color: '#333',
    },
    inlineInput: {
        flex: 1,
        fontSize: 13,
        color: '#333',
    },
    extraContainer: {
        gap: 10,
        marginBottom: 20,
    },
    extraRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
        paddingVertical: 5,
    },
    extraInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 5,
    },
    actionText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    // Picker specific
    pickerDoneBtn: {
        alignItems: 'flex-end',
        padding: 10,
        backgroundColor: '#f0f0f0',
    },
    pickerDoneText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    // Selection Modal
    selectionBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    selectionContainer: {
        backgroundColor: '#fff',
        width: '100%',
        borderRadius: 15,
        padding: 15,
        maxHeight: 400,
    },
    selectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderColor: '#eee',
        paddingBottom: 10,
    },
    selectionTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    optionLabel: {
        fontSize: 16,
        color: '#333',
    },
    // iOS Picker Styles
    iosPickerContainer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100, // Ensure on top
    },
    iosPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 10,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    iosPicker: {
        backgroundColor: '#d1d5db', // Contrast background for white spinner text? Or just white. 
        // Typically system picker is transparent/white. 
        // If we force text color black, white bg is fine.
        backgroundColor: '#fff',
    }
});
