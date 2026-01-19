import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { X, FolderTree, Repeat } from 'lucide-react-native';
import { CategoryEditor } from './CategoryEditor';
import { SRSEditor } from './SRSEditor';
import { useTheme } from '../../providers/ThemeProvider';

interface TemplateModalProps {
    visible: boolean;
    onClose: () => void;
}

import { useTranslation } from 'react-i18next';

export const TemplateModal = ({ visible, onClose }: TemplateModalProps) => {
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<"category" | "srs">("category");

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>{t('template.title', 'Templates')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "category" && styles.activeTabCat]}
                            onPress={() => setActiveTab("category")}
                        >
                            <FolderTree size={18} color={activeTab === "category" ? colors.primary : colors.textSecondary} />
                            <Text style={[
                                styles.tabText,
                                { color: colors.textSecondary },
                                activeTab === "category" && { color: colors.primary }
                            ]}>{t('template.categoryTab', 'Categories')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, activeTab === "srs" && styles.activeTabSrs]}
                            onPress={() => setActiveTab("srs")}
                        >
                            <Repeat size={18} color={activeTab === "srs" ? "#9333ea" : colors.textSecondary} />
                            <Text style={[
                                styles.tabText,
                                { color: colors.textSecondary },
                                activeTab === "srs" && { color: "#9333ea" }
                            ]}>{t('template.srsTab', 'SRS Profiles')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {activeTab === "category" ? <CategoryEditor /> : <SRSEditor />}
                    </View>
                </View>
            </View>
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
        height: 600, // Fixed height or flex
        maxHeight: '80%',
        overflow: 'hidden',
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
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabCat: {
        borderBottomColor: '#3b82f6',
    },
    activeTabSrs: {
        borderBottomColor: '#9333ea',
    },
    tabText: {
        fontWeight: '600',
    },
    content: {
        flex: 1,
    }
});
