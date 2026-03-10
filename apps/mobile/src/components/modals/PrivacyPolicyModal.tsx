import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../hooks/useThemeColors';
import { X } from 'lucide-react-native';

interface PrivacyPolicyModalProps {
    visible: boolean;
    onClose: () => void;
}

export function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
    const { t } = useTranslation();
    const { colors } = useThemeColors();

    const renderSection = (title: string, content: string | React.ReactNode) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            {typeof content === 'string' ? (
                <Text style={[styles.sectionText, { color: colors.textSecondary }]}>{content}</Text>
            ) : (
                content
            )}
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <SafeAreaView style={styles.safeArea}>
                        <View style={[styles.header, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>
                                {t('common.privacyPolicy', 'Privacy Policy')}
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                            <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
                                Last updated: 2026-02-19
                            </Text>

                            {renderSection(
                                "Introduction",
                                "StudyTodo (\"we\", \"our\", or \"us\") respects your privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our mobile application."
                            )}

                            {renderSection(
                                "Information We Collect",
                                "1. Information You Provide to Us\nIf you choose to create an account, we collect your email address and an encrypted password. We also collect the data you generate within the app (Todo items, categories, study sessions, etc.) which is synced to our secure database to allow you to access your data across multiple devices. If you upload custom icons, these images are stored in our secure cloud storage.\n\nIf you use the application without creating an account (\"Guest Mode\"), your data is stored locally on your device and is not transmitted to our servers.\n\n2. Information Collected Automatically\nWhen you use our application, certain information is collected automatically, primarily to support third-party services like advertising."
                            )}

                            {renderSection(
                                "Third-Party Services",
                                "Google AdMob\nWe use Google AdMob to display advertisements. AdMob may collect and use Device Identifiers (e.g., GAID), IP address, Usage Data, and Diagnostics. For more information, please see Google's Privacy Policy.\n\nSupabase\nWe use Supabase as our backend service provider for authentication and database storage. Data is stored securely and is encrypted in transit and at rest."
                            )}

                            {renderSection(
                                "How We Use Your Information",
                                "• To provide, maintain, and improve our application.\n• To manage your account and sync your data (if signed in).\n• To display advertisements (via AdMob).\n• To respond to your comments and questions."
                            )}

                            {renderSection(
                                "Data Security",
                                "We use industry-standard encryption to protect your data both in transit and at rest. However, no method of transmission over the internet or method of electronic storage is 100% secure."
                            )}

                            {renderSection(
                                "Children's Privacy",
                                "Our services are not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13."
                            )}

                            {renderSection(
                                "Changes to This Privacy Policy",
                                "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page."
                            )}

                            {renderSection(
                                "Contact Us",
                                "If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at studytodoapp@gmail.com."
                            )}

                            <View style={styles.bottomPadding} />
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '90%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    lastUpdated: {
        fontSize: 14,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    sectionText: {
        fontSize: 15,
        lineHeight: 24,
    },
    bottomPadding: {
        height: 40,
    },
});
