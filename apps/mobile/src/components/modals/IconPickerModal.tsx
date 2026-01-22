import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, FlatList, StyleSheet, Alert, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Search, ImagePlus, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useThemeColors } from '../../providers/ThemeProvider';
import { POPULAR_ICONS, CategoryIcon } from '../ui/CategoryIcon';

interface IconPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (iconName: string) => void;
    onSelectImage?: (imageUri: string) => void;
    currentIcon?: string;
    currentImageUri?: string;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
    visible,
    onClose,
    onSelect,
    onSelectImage,
    currentIcon,
    currentImageUri
}) => {
    const { t } = useTranslation();
    const { colors } = useThemeColors();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredIcons = POPULAR_ICONS.filter(icon =>
        icon.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pickImageFromLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                t('common.permissionRequired', 'Permission Required'),
                t('category.photoPermission', 'Photo library access is required to select a custom icon.')
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            await saveAndSelectImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                t('common.permissionRequired', 'Permission Required'),
                t('category.cameraPermission', 'Camera access is required to take a photo.')
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            await saveAndSelectImage(result.assets[0].uri);
        }
    };

    const saveAndSelectImage = async (tempUri: string) => {
        try {
            // Create icons directory if it doesn't exist
            const iconsDir = `${FileSystem.documentDirectory}category-icons/`;
            const dirInfo = await FileSystem.getInfoAsync(iconsDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(iconsDir, { intermediates: true });
            }

            // Generate unique filename
            const filename = `icon-${Date.now()}.jpg`;
            const permanentUri = `${iconsDir}${filename}`;

            // Copy image to permanent location
            await FileSystem.copyAsync({ from: tempUri, to: permanentUri });

            if (onSelectImage) {
                onSelectImage(permanentUri);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save image:', error);
            Alert.alert(t('common.error', 'Error'), t('category.imageSaveError', 'Failed to save image.'));
        }
    };

    const renderItem = ({ item }: { item: string }) => {
        const isSelected = currentIcon === item && !currentImageUri;
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

                    {/* Image Picker Buttons */}
                    {onSelectImage && (
                        <View style={[styles.imagePickerRow, { borderBottomColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.imagePickerBtn, { backgroundColor: colors.surface }]}
                                onPress={pickImageFromLibrary}
                            >
                                <ImagePlus size={20} color={colors.primary} />
                                <Text style={[styles.imagePickerText, { color: colors.text }]}>
                                    {t('category.fromLibrary', 'Library')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.imagePickerBtn, { backgroundColor: colors.surface }]}
                                onPress={takePhoto}
                            >
                                <Camera size={20} color={colors.primary} />
                                <Text style={[styles.imagePickerText, { color: colors.text }]}>
                                    {t('category.takePhoto', 'Camera')}
                                </Text>
                            </TouchableOpacity>
                            {currentImageUri && (
                                <View style={styles.currentImageContainer}>
                                    <Image
                                        source={{ uri: currentImageUri }}
                                        style={styles.currentImage}
                                    />
                                </View>
                            )}
                        </View>
                    )}

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
    imagePickerRow: {
        flexDirection: 'row',
        padding: 12,
        gap: 12,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    imagePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 6,
    },
    imagePickerText: {
        fontSize: 14,
        fontWeight: '500',
    },
    currentImageContainer: {
        marginLeft: 'auto',
    },
    currentImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
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
