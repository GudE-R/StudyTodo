import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Repeat, Plus, Trash2, Calendar, TrendingUp } from 'lucide-react-native';
import { useMobileSRS } from '../../hooks/useMobileSRS';
import { SRSProfile } from '@studytodo/shared';
import { generateId } from '../../lib/utils';
import { useTheme } from '../../providers/ThemeProvider';

import { useTranslation } from 'react-i18next';

export const SRSEditor = () => {
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const { profiles, addSRSProfile, deleteSRSProfile } = useMobileSRS();
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newIntervals, setNewIntervals] = useState("");

    const handleAdd = async () => {
        if (!newName.trim() || !newIntervals.trim()) {
            Alert.alert(t('srs.validationError', "Validation Error"), t('srs.enterBoth', "Please enter both name and intervals."));
            return;
        }

        const intervals = newIntervals.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (intervals.length === 0) {
            Alert.alert(t('srs.validationError', "Validation Error"), t('srs.validIntervals', "Please enter valid comma-separated numbers for intervals (e.g., 1, 3, 7)."));
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
            Alert.alert(t('srs.cannotDelete', "Cannot Delete"), t('srs.defaultDeleteError', "The default profile cannot be deleted."));
            return;
        }

        Alert.alert(
            t('srs.deleteProfile', "Delete SRS Profile"),
            t('srs.deleteConfirm', "Are you sure?"),
            [
                { text: t('common.cancel', "Cancel"), style: "cancel" },
                { text: t('common.delete', "Delete"), style: "destructive", onPress: () => deleteSRSProfile(id) }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>{t('srs.listTitle', 'SRS Profiles')}</Text>
                {!isAdding && (
                    <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setIsAdding(true)}
                    >
                        <Plus size={16} color="#fff" />
                        <Text style={styles.addBtnText}>{t('srs.createNew', 'New Profile')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content}>
                {isAdding && (
                    <View style={[styles.addForm, { backgroundColor: colors.surfaceHighlight, borderColor: colors.primaryLight }]}>
                        <Text style={[styles.formTitle, { color: colors.primary }]}>{t('srs.createNew')}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder={t('srs.namePlaceholder', 'Profile Name')}
                            placeholderTextColor={colors.textMuted}
                            value={newName}
                            onChangeText={setNewName}
                        />
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder={t('srs.intervalPlaceholder', 'Intervals (e.g. 1, 3, 7)')}
                            placeholderTextColor={colors.textMuted}
                            value={newIntervals}
                            onChangeText={setNewIntervals}
                            keyboardType="numbers-and-punctuation"
                        />
                        <View style={styles.formActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAdding(false)}>
                                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                                onPress={handleAdd}
                            >
                                <Text style={styles.saveText}>{t('common.save', 'Save')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {profiles.map((profile) => (
                    <View key={profile.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardTitleRow}>
                                {profile.isDefault ? (
                                    <TrendingUp size={18} color={colors.orange} />
                                ) : (
                                    <Calendar size={18} color={colors.primary} />
                                )}
                                <Text style={[styles.cardName, { color: colors.text }]}>{profile.name}</Text>
                                {profile.isDefault && (
                                    <View style={[styles.badge, { backgroundColor: colors.surfaceHighlight }]}>
                                        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{t('srs.defaultBadge', 'Default')}</Text>
                                    </View>
                                )}
                            </View>
                            {!profile.isDefault && (
                                <TouchableOpacity onPress={() => handleDelete(profile.id, profile.isDefault)}>
                                    <Trash2 size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.intervalsRow}>
                            {profile.intervals.map((day, idx) => (
                                <View key={idx} style={[styles.intervalTag, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                                    <Text style={[styles.intervalText, { color: colors.textSecondary }]}>{day}d</Text>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
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
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
    },
    formTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
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
        fontWeight: '600',
        fontSize: 14,
    },
    saveBtn: {
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
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
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
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    intervalsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    intervalTag: {
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    intervalText: {
        fontSize: 12,
    },
});
