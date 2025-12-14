
import React, { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import { Todo } from '@pomarc/shared';
import { format } from 'date-fns';

interface MobileTodoCreateModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (todo: Todo) => void;
}

export const MobileTodoCreateModal = ({ visible, onClose, onAdd }: MobileTodoCreateModalProps) => {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [duration, setDuration] = useState('25'); // text input for minutes
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        if (!title.trim()) return;

        const newTodo: Todo = {
            id: Crypto.randomUUID(),
            title,
            priority,
            dueDate: dueDate,
            estimatedDuration: parseInt(duration) || 25,
            notes,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            categoryId: 'default', // TODO: Category selection
            tags: [],
            reviewHistory: [],
        };

        onAdd(newTodo);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setTitle('');
        setPriority('medium');
        setDueDate(new Date());
        setDuration('25');
        setNotes('');
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const current = new Date(dueDate);
            selectedDate.setHours(current.getHours());
            selectedDate.setMinutes(current.getMinutes());
            setDueDate(selectedDate);
        }
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate) {
            const current = new Date(dueDate);
            current.setHours(selectedDate.getHours());
            current.setMinutes(selectedDate.getMinutes());
            setDueDate(current);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>New Task</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* Title */}
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="What needs to be done?"
                            autoFocus
                        />

                        {/* Date & Time */}
                        <Text style={styles.label}>Due Date</Text>
                        <View style={styles.row}>
                            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                                <CalendarIcon size={16} color="#666" />
                                <Text style={styles.dateText}>{format(dueDate, 'yyyy/MM/dd')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTimePicker(true)}>
                                <Clock size={16} color="#666" />
                                <Text style={styles.dateText}>{format(dueDate, 'HH:mm')}</Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={dueDate}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                            />
                        )}

                        {showTimePicker && (
                            <DateTimePicker
                                value={dueDate}
                                mode="time"
                                display="default"
                                onChange={onTimeChange}
                            />
                        )}

                        {/* Priority */}
                        <Text style={styles.label}>Priority</Text>
                        <View style={styles.row}>
                            {(['low', 'medium', 'high'] as const).map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[
                                        styles.priorityBtn,
                                        priority === p && styles[`priority${p}`]
                                    ]}
                                    onPress={() => setPriority(p)}
                                >
                                    <Text style={[
                                        styles.priorityText,
                                        priority === p && styles.priorityTextSelected
                                    ]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Duration */}
                        <Text style={styles.label}>Duration (min)</Text>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="numeric"
                        />

                        {/* Notes */}
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                        />

                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>Create Task</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
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
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        gap: 6,
    },
    dateText: {
        fontSize: 14,
    },
    priorityBtn: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    prioritylow: { backgroundColor: '#cbd5e1', borderColor: '#cbd5e1' },
    prioritymedium: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    priorityhigh: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
    priorityText: { color: '#666' },
    priorityTextSelected: { color: '#fff', fontWeight: 'bold' },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    saveBtn: {
        backgroundColor: '#2563eb',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
