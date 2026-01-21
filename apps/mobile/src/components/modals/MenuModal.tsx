import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { X, Settings, MessageSquare, BookOpen, LogOut, RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../providers/ThemeProvider';

interface MenuModalProps {
    visible: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
    onOpenFeedback: () => void;
    onOpenGuide: () => void;
}

export const MenuModal = ({ visible, onClose, onOpenSettings, onOpenFeedback, onOpenGuide }: MenuModalProps) => {
    const { colors, isDark } = useThemeColors();
    const { t } = useTranslation();

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
                {/* Close on background tap handled by overlay */}
                <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>{t('common.menu', 'Menu')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Settings */}
                        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => { onClose(); onOpenSettings(); }}>
                            <Settings size={24} color={colors.textSecondary} />
                            <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.title', 'Settings')}</Text>
                        </TouchableOpacity>

                        {/* Usage Guide */}
                        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => { onClose(); onOpenGuide(); }}>
                            <BookOpen size={24} color={colors.textSecondary} />
                            <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.guide', 'About App')}</Text>
                        </TouchableOpacity>

                        {/* Feedback */}
                        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => { onClose(); onOpenFeedback(); }}>
                            <MessageSquare size={24} color={colors.textSecondary} />
                            <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.feedback', 'Feedback')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    container: {
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        borderWidth: 1,
        borderBottomWidth: 0,
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
        paddingBottom: 40 // Safe area bottom
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5,
    },
    content: {
        padding: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        gap: 15
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
    }
});
