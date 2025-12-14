import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { X, FolderTree, Repeat } from 'lucide-react-native';
import { CategoryEditor } from './CategoryEditor';
import { SRSEditor } from './SRSEditor';

interface TemplateModalProps {
    visible: boolean;
    onClose: () => void;
}

export const TemplateModal = ({ visible, onClose }: TemplateModalProps) => {
    const [activeTab, setActiveTab] = useState<"category" | "srs">("category");

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Templates & Categories</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "category" && styles.activeTabCat]}
                            onPress={() => setActiveTab("category")}
                        >
                            <FolderTree size={18} color={activeTab === "category" ? "#2563eb" : "#64748b"} />
                            <Text style={[styles.tabText, activeTab === "category" && styles.activeTabTextCat]}>Categories</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, activeTab === "srs" && styles.activeTabSrs]}
                            onPress={() => setActiveTab("srs")}
                        >
                            <Repeat size={18} color={activeTab === "srs" ? "#9333ea" : "#64748b"} />
                            <Text style={[styles.tabText, activeTab === "srs" && styles.activeTabTextSrs]}>SRS Profiles</Text>
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
        backgroundColor: '#fff',
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
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeBtn: {
        padding: 5,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
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
        color: '#64748b',
    },
    activeTabTextCat: {
        color: '#2563eb',
    },
    activeTabTextSrs: {
        color: '#9333ea',
    },
    content: {
        flex: 1,
    }
});
