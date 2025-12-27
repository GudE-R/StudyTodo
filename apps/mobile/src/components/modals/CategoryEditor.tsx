import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Folder, File, ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react-native';
import { useMobileCategories } from '../../hooks/useMobileCategories';
import { Category } from '@pomarc/shared';

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
    return roots; // Sort by order if needed
};

export const CategoryEditor = () => {
    const { categories, addCategory, deleteCategory } = useMobileCategories();
    const tree = useMemo(() => buildCategoryTree(categories || []), [categories]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Adding state
    const [addingParentId, setAddingParentId] = useState<string | undefined>(undefined);
    const [addingLevel, setAddingLevel] = useState<'large' | 'medium' | 'small' | null>(null);
    const [inputName, setInputName] = useState("");

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const startAdding = (parentId: string | undefined, level: 'large' | 'medium' | 'small') => {
        setAddingParentId(parentId);
        setAddingLevel(level);
        setInputName("");
        if (parentId) {
            const newSet = new Set(expandedIds);
            newSet.add(parentId);
            setExpandedIds(newSet);
        }
    };

    const cancelAdding = () => {
        setAddingLevel(null);
        setAddingParentId(undefined);
        setInputName("");
    };

    const confirmAdding = async () => {
        if (!inputName.trim() || !addingLevel) return;
        const newCat: Category = {
            id: Date.now().toString(), // Helper in shared would be better
            name: inputName.trim(),
            level: addingLevel,
            parentId: addingParentId,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await addCategory(newCat);
        cancelAdding();
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Category",
            "Are you sure? Sub-categories will also be deleted.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteCategory(id) }
            ]
        );
    };

    const renderNode = (node: Category, depth: number = 0) => {
        const isExpanded = expandedIds.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isSmall = node.level === 'small';

        return (
            <View key={node.id}>
                <View style={[styles.nodeRow, { paddingLeft: depth * 20 }]}>
                    <TouchableOpacity
                        style={styles.expandIcon}
                        onPress={() => !isSmall && toggleExpand(node.id)}
                        disabled={isSmall}
                    >
                        {!isSmall && (isExpanded ? <ChevronDown size={20} color="#666" /> : <ChevronRight size={20} color="#666" />)}
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        {isSmall ? <File size={18} color="#3b82f6" /> : <Folder size={18} color="#f59e0b" />}
                    </View>

                    <Text style={styles.nodeText}>{node.name}</Text>

                    <View style={styles.actions}>
                        {!isSmall && (
                            <TouchableOpacity
                                onPress={() => startAdding(node.id, node.level === 'large' ? 'medium' : 'small')}
                                style={styles.actionBtn}
                            >
                                <Plus size={16} color="#3b82f6" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleDelete(node.id)} style={styles.actionBtn}>
                            <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                {isExpanded && node.children && node.children.map(child => renderNode(child, depth + 1))}

                {/* Input for new child */}
                {addingParentId === node.id && (
                    <View style={[styles.inputRow, { paddingLeft: (depth + 1) * 20 }]}>
                        <TextInput
                            style={styles.input}
                            value={inputName}
                            onChangeText={setInputName}
                            placeholder="Category Name"
                            autoFocus
                        />
                        <TouchableOpacity onPress={confirmAdding} style={styles.saveBtn}>
                            <Text style={styles.saveText}>Add</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cancelAdding} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Categories</Text>
                <TouchableOpacity
                    style={styles.addMainBtn}
                    onPress={() => startAdding(undefined, 'large')}
                    disabled={addingLevel !== null}
                >
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addMainText}>Add Main</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll}>
                {/* Input for main category */}
                {addingLevel === 'large' && !addingParentId && (
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            value={inputName}
                            onChangeText={setInputName}
                            placeholder="Main Category Name"
                            autoFocus
                        />
                        <TouchableOpacity onPress={confirmAdding} style={styles.saveBtn}>
                            <Text style={styles.saveText}>Add</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cancelAdding} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {tree.map(root => renderNode(root))}
                <View style={{ height: 100 }} />
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
        padding: 10,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    addMainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    addMainText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    scroll: {
        flex: 1,
        padding: 10,
    },
    nodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    expandIcon: {
        width: 24,
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 8,
    },
    nodeText: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginRight: 5,
    },
    actionBtn: {
        padding: 4,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        backgroundColor: '#f0f9ff',
        borderRadius: 6,
        marginVertical: 4,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#fff',
        marginRight: 8,
    },
    saveBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
        marginRight: 4,
    },
    saveText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    cancelBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    cancelText: {
        color: '#64748b',
        fontSize: 12,
    },
});
