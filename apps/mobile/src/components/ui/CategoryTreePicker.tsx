import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Category } from '@pomarc/shared';
import { useThemeColors } from '../../providers/ThemeProvider';
import { buildCategoryTree } from '../../lib/categoryUtils';
import { CategoryIcon } from './CategoryIcon';

interface CategoryTreePickerProps {
    visible: boolean;
    onClose: () => void;
    categories: Category[];
    selectedId?: string;
    onSelect: (categoryId: string) => void;
    title?: string;
    showNoCategory?: boolean;
}

/**
 * カテゴリ選択用のツリービューモーダル
 * TodoCreateModal と TodoDetailModal で共通使用
 */
export const CategoryTreePicker: React.FC<CategoryTreePickerProps> = ({
    visible,
    onClose,
    categories,
    selectedId,
    onSelect,
    title,
    showNoCategory = true,
}) => {
    const { t } = useTranslation();
    const { colors } = useThemeColors();

    const tree = useMemo(() => buildCategoryTree(categories || []), [categories]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Expand all by default when categories change
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

    const renderCategoryNode = (node: Category, depth: number = 0): React.ReactNode => {
        const isExpanded = expandedIds.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isSmall = node.level === 'small';
        const isSelected = selectedId === node.id;

        return (
            <View key={node.id}>
                <TouchableOpacity
                    style={[
                        styles.item,
                        {
                            borderBottomColor: colors.border,
                            paddingLeft: 16 + depth * 20,
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                        }
                    ]}
                    onPress={() => { onSelect(node.id); onClose(); }}
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
                        {node.customIconUri || node.icon ? (
                            <CategoryIcon
                                iconName={node.icon}
                                customIconUri={node.customIconUri}
                                size={16}
                                color={node.color || (isSmall ? colors.primary : colors.orange)}
                            />
                        ) : (
                            isSmall
                                ? <File size={16} color={node.color || colors.primary} />
                                : <Folder size={16} color={node.color || colors.orange} />
                        )}
                    </View>

                    <Text style={[
                        styles.itemText,
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

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.container, { backgroundColor: colors.background }]}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {title || t('todo.selectCategory', 'Select Category')}
                    </Text>
                    <ScrollView style={styles.scroll}>
                        {/* No Category Option */}
                        {showNoCategory && (
                            <TouchableOpacity
                                style={[
                                    styles.item,
                                    {
                                        borderBottomColor: colors.border,
                                        backgroundColor: !selectedId ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                    }
                                ]}
                                onPress={() => { onSelect(''); onClose(); }}
                            >
                                <Text style={[
                                    styles.itemText,
                                    { color: !selectedId ? colors.primary : colors.textSecondary }
                                ]}>
                                    {t('todo.noCategory', 'No Category')}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {tree.map(root => renderCategoryNode(root))}
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '80%',
        maxHeight: '60%',
        borderRadius: 16,
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    scroll: {
        maxHeight: 300,
    },
    item: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 15,
        flex: 1,
    },
});
