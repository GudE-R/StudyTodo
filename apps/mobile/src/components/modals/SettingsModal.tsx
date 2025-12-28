import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Switch } from 'react-native';
import { X, Moon, Sun, Monitor, BookOpen } from 'lucide-react-native';
import { useAuth } from '../../providers/AuthProvider';
import { AuthModal } from './AuthModal';
import { useThemeColors } from '../../hooks/useThemeColors';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SettingsModal = ({ visible, onClose }: SettingsModalProps) => {
    // Note: Theme switching logic is not fully implemented in valid React Native without a Context.
    // For now, this is UI only.
    const { colors, isDark } = useThemeColors();
    const { user, signOut } = useAuth();
    const [showAuthModal, setShowAuthModal] = React.useState(false);

    const renderThemeOption = (label: string, icon: any, selected: boolean) => (
        <TouchableOpacity
            style={[
                styles.themeOption,
                selected && { borderColor: '#3b82f6', backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }
            ]}
        >
            {icon}
            <Text style={[styles.themeText, selected && { color: '#3b82f6' }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Theme Settings */}
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Theme Settings</Text>
                        <View style={styles.themeRow}>
                            {renderThemeOption("Light", <Sun size={24} color={isDark ? '#fff' : '#000'} />, !isDark)}
                            {renderThemeOption("Dark", <Moon size={24} color={isDark ? '#fff' : '#000'} />, isDark)}
                            {renderThemeOption("System", <Monitor size={24} color={isDark ? '#fff' : '#000'} />, false)}
                        </View>

                        {/* Cloud Sync / Account */}
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>Account</Text>

                        {user ? (
                            <View>
                                <View style={[styles.userInfo, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff', borderColor: '#bfdbfe' }]}>
                                    <Text style={[styles.userLabel, { color: '#2563eb' }]}>LOGGED IN AS</Text>
                                    <Text style={[styles.userEmail, { color: colors.text }]}>{user.email}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { borderColor: user ? '#ef4444' : colors.border, marginTop: 10 }]}
                                    onPress={async () => {
                                        await signOut();
                                        alert("Logged out");
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Log Out</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                                onPress={() => setShowAuthModal(true)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={[styles.actionBtnText, { color: colors.text }]}>Log In / Sign Up</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Guide */}
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>About App</Text>
                        <TouchableOpacity style={[styles.guideBtn, { borderColor: colors.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <BookOpen size={20} color={colors.textSecondary} />
                                <Text style={[styles.guideText, { color: colors.text }]}>Usage Guide</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        borderRadius: 15,
        overflow: 'hidden',
        maxHeight: 500,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5,
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    themeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    themeOption: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    themeText: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
    },
    guideBtn: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
    },
    guideText: {
        marginLeft: 10,
        fontWeight: '500',
    },
    userInfo: {
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 10,
    },
    userLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        fontWeight: '500',
    },
    actionBtn: {
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
    }
});
