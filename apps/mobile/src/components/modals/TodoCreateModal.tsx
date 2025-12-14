import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Platform,
    KeyboardAvoidingView,
    ScrollView
} from 'react-native';
import { X, Calendar, Flag, Send } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Category, generateId, Todo } from '@pomarc/shared';
import { useMobileTodos } from '../../hooks/useMobileTodos';

interface TodoCreateModalProps {
    visible: boolean;
    onClose: () => void;
    categories?: Category[]; // Optional for now
}

export const TodoCreateModal = ({ visible, onClose, categories = [] }: TodoCreateModalProps) => {
    const { addTodo } = useMobileTodos();
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

    // Date Picker State
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) return;

        try {
            const newTodo: Todo = {
                id: generateId(),
                title,
                categoryId: categoryId || undefined,
                priority,
                dueDate: dueDate,
                completed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                srsGroupId: undefined,
                // srsInterval: undefined, 
            };

            await addTodo(newTodo);
            resetForm();
            onClose();
        } catch (error) {
            console.error("Failed to add todo", error);
            // Alert.alert("Error", "Failed to create task");
        }
    };

    const resetForm = () => {
        setTitle("");
        setCategoryId("");
        setPriority("medium");
        setDueDate(undefined);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            const current = dueDate || new Date();
            // Set year/month/day
            const newDate = new Date(current);
            newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

            setDueDate(newDate);

            if (Platform.OS === 'android') {
                setShowTimePicker(true); // Chain to time picker
            }
        }
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        if (selectedDate) {
            const current = dueDate || new Date();
            const newDate = new Date(current);
            newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
            setDueDate(newDate);
        }
    };

    // Render Priority Button
    const renderPriorityBtn = (p: "low" | "medium" | "high", color: string) => (
        <TouchableOpacity
            onPress={() => setPriority(p)}
            style={[
                styles.iconButton,
                priority === p ? { backgroundColor: color } : {}
            ]}
        >
            <Flag size={16} color={priority === p ? '#fff' : '#888'} fill={priority === p ? '#fff' : 'none'} />
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardView}
                >
                    <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalContent}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>New Task</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <X size={20} color="#555" />
                                </TouchableOpacity>
                            </View>

                            {/* Input */}
                            <TextInput
                                style={styles.input}
                                placeholder="What needs to be done?"
                                value={title}
                                onChangeText={setTitle}
                                autoFocus={visible}
                            />

                            {/* Options Row */}
                            <View style={styles.optionsRow}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollOptions}>

                                    {/* Category Placeholder (Simple Button for now) */}
                                    <TouchableOpacity style={styles.optionChip}>
                                        <Text style={styles.optionText}>
                                            {categories.find(c => c.id === categoryId)?.name || "No Category"}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Date Picker Trigger */}
                                    <TouchableOpacity
                                        style={[styles.optionChip, dueDate && styles.activeChip]}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Calendar size={16} color={dueDate ? "#fff" : "#555"} />
                                        {dueDate && (
                                            <Text style={[styles.optionText, { color: '#fff', marginLeft: 4 }]}>
                                                {dueDate.toLocaleDateString()} {dueDate.getHours()}:{String(dueDate.getMinutes()).padStart(2, '0')}
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    {/* Priority */}
                                    <View style={styles.priorityGroup}>
                                        {renderPriorityBtn("low", "#3b82f6")}
                                        {renderPriorityBtn("medium", "#f97316")}
                                        {renderPriorityBtn("high", "#ef4444")}
                                    </View>
                                </ScrollView>

                                {/* Submit Button */}
                                <TouchableOpacity
                                    style={[styles.submitBtn, !title.trim() && styles.disabledBtn]}
                                    onPress={handleSubmit}
                                    disabled={!title.trim()}
                                >
                                    <Send size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {/* Date Pickers (Hidden/Modal) */}
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dueDate || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={handleDateChange}
                                />
                            )}
                            {showTimePicker && (
                                <DateTimePicker
                                    value={dueDate || new Date()}
                                    mode="time"
                                    display="default"
                                    onChange={handleTimeChange}
                                />
                            )}
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    keyboardView: {
        width: '100%',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeBtn: {
        padding: 5,
    },
    input: {
        fontSize: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 10,
        marginBottom: 20,
    },
    optionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scrollOptions: {
        alignItems: 'center',
        paddingRight: 10,
        gap: 10,
    },
    optionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    activeChip: {
        backgroundColor: '#3b82f6',
    },
    optionText: {
        fontSize: 14,
        color: '#555',
    },
    priorityGroup: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        padding: 4,
        gap: 4,
    },
    iconButton: {
        padding: 6,
        borderRadius: 15,
    },
    submitBtn: {
        backgroundColor: '#2563eb',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    disabledBtn: {
        backgroundColor: '#93c5fd',
    }
});
