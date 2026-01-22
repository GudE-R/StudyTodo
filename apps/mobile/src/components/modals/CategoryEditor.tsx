import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Folder, File, ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react-native';
import { useMobileCategories } from '../../hooks/useMobileCategories';
import { Category } from '@pomarc/shared';
import { generateId } from '../../lib/utils';
import { useTheme } from '../../providers/ThemeProvider';
import { buildCategoryTree } from '../../lib/categoryUtils';
import { useTranslation } from 'react-i18next';
import { CategoryIcon } from '../ui/CategoryIcon';
import { IconPickerModal } from './IconPickerModal';

// カラーパレット定義（Web版と統一）
const CATEGORY_COLORS = [
    "#ef4444", // 赤
    "#f97316", // オレンジ
    "#eab308", // 黄
    "#22c55e", // 緑
    "#14b8a6", // ティール
    "#3b82f6", // 青
    "#8b5cf6", // 紫
    "#ec4899", // ピンク
    "#6b7280", // グレー
];

export const CategoryEditor = () => {
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const { categories, addCategory, updateCategory, deleteCategory } = useMobileCategories();
    const tree = useMemo(() => buildCategoryTree(categories || []), [categories]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Adding state
    const [addingParentId, setAddingParentId] = useState<string | undefined>(undefined);
    const [addingLevel, setAddingLevel] = useState<'large' | 'medium' | 'small' | null>(null);
    const [inputName, setInputName] = useState("");

    // Color Picker state
    const [colorPickerId, setColorPickerId] = useState<string | null>(null);

    // Icon Picker state
    const [pickingIconCategoryId, setPickingIconCategoryId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const handleColorSelect = async (categoryId: string, color: string) => {
        await updateCategory(categoryId, { color: color || undefined, updatedAt: new Date() });
        setColorPickerId(null);
    };

    const handleIconSelect = async (iconName: string) => {
        if (pickingIconCategoryId) {
            // When selecting a Lucide icon, clear any custom image
            await updateCategory(pickingIconCategoryId, {
                icon: iconName,
                customIconUri: undefined,
                updatedAt: new Date()
            });
            setPickingIconCategoryId(null);
        }
    };

    const handleImageSelect = async (imageUri: string) => {
        if (pickingIconCategoryId) {
            // When selecting a custom image, clear the Lucide icon
            await updateCategory(pickingIconCategoryId, {
                icon: undefined,
                customIconUri: imageUri,
                updatedAt: new Date()
            } as any);
            setPickingIconCategoryId(null);
        }
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
            id: generateId(),
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
            t('category.deleteTitle', "Delete Category"),
            t('category.deleteConfirm', "Are you sure? Sub-categories will also be deleted."),
            [
                { text: t('common.cancel', "Cancel"), style: "cancel" },
                { text: t('category.deleteButton', "Delete"), style: "destructive", onPress: () => deleteCategory(id) }
            ]
        );
    };

    const renderNode = (node: Category, depth: number = 0) => {
        const isExpanded = expandedIds.has(node.id);
        const isSmall = node.level === 'small';
        const isPickingColor = colorPickerId === node.id;

        return (
            <View key={node.id}>
                <View style={[styles.nodeRow, { paddingLeft: depth * 20, borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        style={styles.expandIcon}
                        onPress={() => !isSmall && toggleExpand(node.id)}
                        disabled={isSmall}
                    >
                        {!isSmall && (isExpanded ? <ChevronDown size={20} color={colors.textSecondary} /> : <ChevronRight size={20} color={colors.textSecondary} />)}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.colorIndicator, {
                            backgroundColor: node.color || 'transparent',
                            borderColor: node.color ? 'transparent' : (isDark ? colors.textMuted : '#ccc')
                        }]}
                        onPress={() => setColorPickerId(isPickingColor ? null : node.id)}
                    >
                        {!node.color && <View style={[styles.noColorLine, { backgroundColor: colors.danger }]} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.iconContainer}
                        onPress={() => setPickingIconCategoryId(node.id)}
                    >
                        {(node as any).customIconUri || node.icon ? (
                            <CategoryIcon
                                iconName={node.icon}
                                customIconUri={(node as any).customIconUri}
                                size={18}
                                color={node.color || (isSmall ? colors.primary : colors.orange)}
                            />
                        ) : (
                            isSmall ? <File size={18} color={node.color || colors.primary} /> : <Folder size={18} color={node.color || colors.orange} />
                        )}
                    </TouchableOpacity>

                    <Text style={[styles.nodeText, { color: colors.text }]}>{node.name}</Text>

                    <View style={styles.actions}>
                        {!isSmall && (
                            <TouchableOpacity
                                onPress={() => startAdding(node.id, node.level === 'large' ? 'medium' : 'small')}
                                style={styles.actionBtn}
                            >
                                <Plus size={16} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleDelete(node.id)} style={styles.actionBtn}>
                            <Trash2 size={16} color={colors.danger} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Color Picker Palette */}
                {isPickingColor && (
                    <View style={[styles.colorPalette, { marginLeft: depth * 20 + 40, backgroundColor: colors.surfaceHighlight }]}>
                        {/* Clear Color Option */}
                        <TouchableOpacity
                            style={[styles.colorOption, { borderColor: colors.border, borderWidth: 1 }]}
                            onPress={() => handleColorSelect(node.id, "")}
                        >
                            <View style={[styles.noColorLine, { backgroundColor: colors.danger }]} />
                        </TouchableOpacity>
                        {CATEGORY_COLORS.map(color => (
                            <TouchableOpacity
                                key={color}
                                style={[styles.colorOption, { backgroundColor: color }]}
                                onPress={() => handleColorSelect(node.id, color)}
                            />
                        ))}
                    </View>
                )}

                {isExpanded && node.children && node.children.map(child => renderNode(child, depth + 1))}

                {/* Input for new child */}
                {addingParentId === node.id && (
                    <View style={[styles.inputRow, { paddingLeft: (depth + 1) * 20, backgroundColor: colors.surfaceHighlight }]}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            value={inputName}
                            onChangeText={setInputName}
                            placeholder={t('category.placeholder', 'Category Name')}
                            placeholderTextColor={colors.textMuted}
                            autoFocus
                        />
                        <TouchableOpacity onPress={confirmAdding} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                            <Text style={styles.saveText}>{t('category.add', 'Add')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cancelAdding} style={styles.cancelBtn}>
                            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>{t('category.treeTitle', 'Categories')}</Text>
                <TouchableOpacity
                    style={[styles.addMainBtn, { backgroundColor: colors.primary }]}
                    onPress={() => startAdding(undefined, 'large')}
                    disabled={addingLevel !== null}
                >
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addMainText}>{t('category.addLargeCategory', 'Add Main')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll}>
                {/* Input for main category */}
                {addingLevel === 'large' && !addingParentId && (
                    <View style={[styles.inputRow, { backgroundColor: colors.surfaceHighlight }]}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            value={inputName}
                            onChangeText={setInputName}
                            placeholder={t('category.placeholder', 'Main Category Name')}
                            placeholderTextColor={colors.textMuted}
                            autoFocus
                        />
                        <TouchableOpacity onPress={confirmAdding} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                            <Text style={styles.saveText}>{t('category.add', 'Add')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cancelAdding} style={styles.cancelBtn}>
                            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {tree.map(root => renderNode(root))}
                <View style={{ height: 100 }} />
            </ScrollView>

            <IconPickerModal
                visible={!!pickingIconCategoryId}
                onClose={() => setPickingIconCategoryId(null)}
                onSelect={(iconName) => pickingIconCategoryId && handleIconSelect(iconName)}
                onSelectImage={handleImageSelect}
                currentIcon={pickingIconCategoryId ? categories.find(c => c.id === pickingIconCategoryId)?.icon : undefined}
                currentImageUri={pickingIconCategoryId ? (categories.find(c => c.id === pickingIconCategoryId) as any)?.customIconUri : undefined}
            />
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
        padding: 10,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    addMainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
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
        borderRadius: 6,
        marginVertical: 4,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
    },
    saveBtn: {
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
        fontSize: 12,
    },
    // Color Picker Styles
    colorIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    noColorLine: {
        width: '140%',
        height: 1,
        transform: [{ rotate: '45deg' }],
    },
    colorPalette: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    colorOption: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
});
