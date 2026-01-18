import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Switch, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { X, Moon, Sun, Monitor, BookOpen, RefreshCw, Languages, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../providers/AuthProvider';
import { AuthModal } from './AuthModal';
import { useTheme, ThemeMode } from '../../providers/ThemeProvider';
import { useMobileSync } from '../../hooks/useMobileSync';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SettingsModal = ({ visible, onClose }: SettingsModalProps) => {
    const { colors, isDark, themeMode, setThemeMode } = useTheme();
    const { user, signOut } = useAuth();
    const [showAuthModal, setShowAuthModal] = React.useState(false);
    const { isSyncing, lastSyncTime, sync } = useMobileSync();
    const { t, i18n } = useTranslation();
    const [view, setView] = React.useState<'main' | 'language'>('main');

    // Reset view when modal opens/closes
    React.useEffect(() => {
        if (!visible) setView('main');
    }, [visible]);

    const renderThemeOption = (label: string, icon: any, mode: ThemeMode) => {
        const selected = themeMode === mode;
        return (
            <TouchableOpacity
                style={[
                    styles.themeOption,
                    { borderColor: colors.border },
                    selected && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                ]}
                onPress={() => setThemeMode(mode)}
            >
                {icon}
                <Text style={[styles.themeText, { color: selected ? colors.primary : colors.textSecondary }]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    const currentLanguageLabel = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)?.label || i18n.language;

    const renderMainView = () => (
        <ScrollView contentContainerStyle={styles.content}>
            {/* Theme Settings */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.appearance', 'Appearance')}</Text>
            <View style={styles.themeRow}>
                {renderThemeOption(t('theme.light', 'Light'), <Sun size={24} color={themeMode === 'light' ? colors.primary : colors.icon} />, 'light')}
                {renderThemeOption(t('theme.dark', 'Dark'), <Moon size={24} color={themeMode === 'dark' ? colors.primary : colors.icon} />, 'dark')}
                {renderThemeOption(t('theme.system', 'System'), <Monitor size={24} color={themeMode === 'system' ? colors.primary : colors.icon} />, 'system')}
            </View>

            {/* Language Settings */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>{t('settings.language', 'Language')}</Text>
            <TouchableOpacity
                style={[styles.menuItem, { borderColor: colors.border }]}
                onPress={() => setView('language')}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Languages size={20} color={colors.textSecondary} />
                    <Text style={[styles.menuItemText, { color: colors.text }]}>{currentLanguageLabel}</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Cloud Sync / Account */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>{t('settings.cloudSync', 'Cloud Sync')}</Text>

            {user ? (
                <View>
                    <View style={[styles.userInfo, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff', borderColor: '#bfdbfe' }]}>
                        <Text style={[styles.userLabel, { color: '#2563eb' }]}>{t('settings.loggedInAs', 'LOGGED IN AS')}</Text>
                        <Text style={[styles.userEmail, { color: colors.text }]}>{user.email}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: user ? '#ef4444' : colors.border, marginTop: 10 }]}
                        onPress={async () => {
                            await signOut();
                            // alert("Logged out");
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>{t('settings.logout', 'Log Out')}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Sync Button */}
                    <TouchableOpacity
                        style={[styles.syncBtn, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}
                        onPress={async () => {
                            if (user && !isSyncing) {
                                await sync(user.id);
                                // alert("Sync Complete!");
                            }
                        }}
                        disabled={isSyncing}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={[styles.syncBtnText, { color: colors.text }]}>
                                    {isSyncing ? t('common.syncing', "Syncing...") : t('settings.syncNow', "Sync Now")}
                                </Text>
                                <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
                                    {lastSyncTime
                                        ? `${t('settings.lastSynced', 'Last sync')}: ${lastSyncTime.toLocaleTimeString()}`
                                        : t('settings.backupCloudDescription', "Sync to cloud")}
                                </Text>
                            </View>
                            {isSyncing ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <RefreshCw size={20} color={colors.textSecondary} />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                    onPress={() => setShowAuthModal(true)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[styles.actionBtnText, { color: colors.text }]}>{t('settings.loginToBackup', 'Log In / Sign Up')}</Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Guide */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>{t('settings.guide', 'About App')}</Text>
            <TouchableOpacity style={[styles.guideBtn, { borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <BookOpen size={20} color={colors.textSecondary} />
                    <Text style={[styles.guideText, { color: colors.text }]}>{t('guide.title', 'Usage Guide')}</Text>
                </View>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderLanguageView = () => (
        <View style={styles.languageContainer}>
            <TouchableOpacity style={[styles.backRow, { borderBottomColor: colors.border }]} onPress={() => setView('main')}>
                <ArrowLeft size={24} color={colors.text} />
                <Text style={[styles.backText, { color: colors.text }]}>{t('common.back', 'Back')}</Text>
            </TouchableOpacity>
            <FlatList
                data={SUPPORTED_LANGUAGES}
                keyExtractor={item => item.code}
                renderItem={({ item }) => {
                    const isSelected = item.code === i18n.language || (i18n.language === 'en-US' && item.code === 'en');
                    // Simple fuzzy match check if needed or just exact

                    return (
                        <TouchableOpacity
                            style={[
                                styles.languageItem,
                                { borderBottomColor: colors.border },
                                isSelected && { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }
                            ]}
                            onPress={() => {
                                i18n.changeLanguage(item.code);
                                // Optional: persist via LANGUAGE_DETECTOR.cacheUserLanguage called by i18next internally? 
                                // Yes, if detection order includes AsyncStorage and we have cacheUserLanguage.
                            }}
                        >
                            <Text style={[
                                styles.languageLabel,
                                { color: colors.text },
                                isSelected && { color: colors.primary, fontWeight: 'bold' }
                            ]}>
                                {item.label}
                            </Text>
                            {isSelected && <View style={[styles.checkMark, { backgroundColor: colors.primary }]} />}
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {view === 'language' ? t('settings.language', 'Language') : t('settings.title', 'Settings')}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {view === 'main' ? renderMainView() : renderLanguageView()}
                </View>
            </View>

            <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </Modal >
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
        maxHeight: 600, // Slightly taller for better list view
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        flex: 1, // Allow flex
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
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
    },
    syncBtn: {
        marginTop: 10,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
    },
    syncBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderWidth: 1,
        borderRadius: 10,
    },
    menuItemText: {
        marginLeft: 10,
        fontSize: 16,
    },
    languageContainer: {
        flex: 1,
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    backText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
    },
    languageItem: {
        padding: 15,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    languageLabel: {
        fontSize: 16,
    },
    checkMark: {
        width: 8,
        height: 8,
        borderRadius: 4,
    }
});
