import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Search } from 'lucide-react-native';
import { useThemeColors } from '../../providers/ThemeProvider';
import { POPULAR_ICONS, CategoryIcon } from '../ui/CategoryIcon';

interface IconPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (iconName: string) => void;
    currentIcon?: string;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({ visible, onClose, onSelect, currentIcon }) => {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredIcons = POPULAR_ICONS.filter(icon =>
        icon.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderItem = ({ item }: { item: string }) => {
        const isSelected = currentIcon === item;
        return (
            <TouchableOpacity
                style={[
                    styles.iconItem,
                    {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: 1
                    }
                ]}
                onPress={() => {
                    onSelect(item);
                    onClose();
                }}
            >
                <CategoryIcon
                    iconName={item}
                    size={24}
                    color={isSelected ? '#fff' : colors.text}
                />
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.container, { backgroundColor: colors.background }]} >
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {t('category.selectIcon', 'Select Icon')}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                        <TextInput
                            style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text }]}
                            placeholder={t('common.search', 'Search...')}
                            placeholderTextColor={colors.textMuted}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>

                    <FlatList
                        data={filteredIcons}
                        renderItem={renderItem}
                        keyExtractor={item => item}
                        numColumns={5}
                        contentContainerStyle={styles.listContent}
                        keyboardShouldPersistTaps="handled"
                    />
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
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        maxHeight: '80%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: 4,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    listContent: {
        padding: 12,
        alignItems: 'center',
    },
    iconItem: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        margin: 6,
    },
});
