import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../hooks/useThemeColors';
import { X, FileText } from 'lucide-react-native';

interface TermsModalProps {
    visible: boolean;
    onClose: () => void;
}

export function TermsModal({ visible, onClose }: TermsModalProps) {
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
                                {t('common.termsOfService', 'Terms of Service')}
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                            <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
                                効力発生日: 2026年1月11日
                            </Text>

                            <View style={styles.section}>
                                <View style={styles.titleWithIcon}>
                                    <FileText size={20} color={colors.primary} style={{ marginEnd: 8 }} />
                                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>第1条（はじめに）</Text>
                                </View>
                                <Text style={[styles.sectionText, { color: colors.textSecondary, marginTop: 12 }]}>
                                    この利用規約（以下，「本規約」といいます。）は，本サービス「StudyTodo」（以下，「本サービス」といいます。）の利用条件を定めるものです。本サービスは、開発者本人（以下，「管理者」といいます。）が個人で提供します。ユーザーの皆さまには，本規約に従って，本サービスをご利用いただきます。
                                </Text>
                            </View>

                            {renderSection(
                                "第2条（利用登録）",
                                "本サービスにおいては，登録希望者が本規約に同意の上，管理者の定める方法によって利用登録を申請し，管理者がこれを承認することによって，利用登録が完了するものとします。"
                            )}

                            {renderSection(
                                "第3条（禁止事項）",
                                "ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。\n\n• 法令または公序良俗に違反する行為\n• 犯罪行為に関連する行為\n• 本サービスの内容等，本サービスに含まれる著作権，商標権ほか知的財産権を侵害する行為\n• 本サービスのサーバーまたはネットワークの機能を破壊したり，妨害したりする行為\n• 本サービスによって得られた情報を商業的に利用する行為\n• 管理者のサービスの運営を妨害するおそれのある行為"
                            )}

                            {renderSection(
                                "第4条（本サービスの提供の停止等）",
                                "管理者は，以下のいずれかの事由があると判断した場合，ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。\n\n• 本サービスにかかるコンピュータシステムの保守点検または更新を行う場合\n• 地震，落雷，火災，停電または天災などの不可抗力により，本サービスの提供が困難となった場合\n• その他，管理者が本サービスの提供が困難と判断した場合"
                            )}

                            {renderSection(
                                "第5条（保証の否認および免責事項）",
                                "管理者は，本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。管理者は，本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。"
                            )}

                            <View style={[styles.footerDivider, { borderTopColor: colors.border }]} />
                            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                                StudyTodoは個人開発によるプロジェクトです。法人ではありません。
                            </Text>

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
    titleWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
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
    footerDivider: {
        borderTopWidth: 1,
        marginTop: 16,
        paddingTop: 16,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
    },
    bottomPadding: {
        height: 40,
    },
});
