import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Repeat, Plus, Trash2, Calendar, TrendingUp } from 'lucide-react-native';
import { useMobileSRS } from '../../hooks/useMobileSRS';
import { SRSProfile } from '@pomarc/shared';
import { generateId } from '../../lib/utils';


export const SRSEditor = () => {
    const { profiles, addSRSProfile, deleteSRSProfile } = useMobileSRS();
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newIntervals, setNewIntervals] = useState("");

    const handleAdd = async () => {
        if (!newName.trim() || !newIntervals.trim()) {
            Alert.alert("Validation Error", "Please enter both name and intervals.");
            return;
        }

        const intervals = newIntervals.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (intervals.length === 0) {
            Alert.alert("Validation Error", "Please enter valid comma-separated numbers for intervals (e.g., 1, 3, 7).");
            return;
        }

        const newProfile: SRSProfile = {
            id: generateId(),
            name: newName.trim(),
            intervals: intervals,
            isDefault: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await addSRSProfile(newProfile);
        setIsAdding(false);
        setNewName("");
        setNewIntervals("");
    };

    const handleDelete = (id: string, isDefault?: boolean) => {
        if (isDefault) {
            Alert.alert("Cannot Delete", "The default profile cannot be deleted.");
            return;
        }

        Alert.alert(
            "Delete SRS Profile",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteSRSProfile(id) }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>SRS Profiles</Text>
                {!isAdding && (
                    <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
                        <Plus size={16} color="#fff" />
                        <Text style={styles.addBtnText}>New Profile</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content}>
                {isAdding && (
                    <View style={styles.addForm}>
                        <Text style={styles.formTitle}>New SRS Profile</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Profile Name (e.g. Exam Cram)"
                            value={newName}
                            onChangeText={setNewName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Intervals (e.g. 1, 3, 7, 14)"
                            value={newIntervals}
                            onChangeText={setNewIntervals}
                            keyboardType="numbers-and-punctuation"
                        />
                        <View style={styles.formActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAdding(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                                <Text style={styles.saveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {profiles.map((profile) => (
                    <View key={profile.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardTitleRow}>
                                {profile.isDefault ? (
                                    <TrendingUp size={18} color="#f97316" />
                                ) : (
                                    <Calendar size={18} color="#3b82f6" />
                                )}
                                <Text style={styles.cardName}>{profile.name}</Text>
                                {profile.isDefault && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>Default</Text>
                                    </View>
                                )}
                            </View>
                            {!profile.isDefault && (
                                <TouchableOpacity onPress={() => handleDelete(profile.id, profile.isDefault)}>
                                    <Trash2 size={18} color="#94a3b8" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.intervalsRow}>
                            {profile.intervals.map((day, idx) => (
                                <View key={idx} style={styles.intervalTag}>
                                    <Text style={styles.intervalText}>{day}d</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    content: {
        flex: 1,
        padding: 15,
    },
    addForm: {
        backgroundColor: '#f0f9ff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    formTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 6,
        padding: 10,
        marginBottom: 10,
        fontSize: 14,
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    cancelBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    cancelText: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 14,
    },
    saveBtn: {
        backgroundColor: '#2563eb',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#334155',
    },
    badge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '600',
    },
    intervalsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    intervalTag: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    intervalText: {
        fontSize: 12,
        color: '#475569',
    },
});
