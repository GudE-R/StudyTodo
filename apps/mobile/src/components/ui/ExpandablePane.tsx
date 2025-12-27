import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";

interface ExpandablePaneProps {
    title: string;
    children: React.ReactNode; // Content shown when expanded
    preview?: React.ReactNode; // Content shown when collapsed (widget mode)
    color?: string;
}

export function ExpandablePane({ title, children, preview, color = "#fff" }: ExpandablePaneProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <TouchableOpacity
                style={[styles.card, { backgroundColor: color }]}
                onPress={() => setIsExpanded(true)}
                activeOpacity={0.9}
            >
                <Text style={styles.title}>{title}</Text>
                <View style={styles.previewContainer}>
                    {preview || <Text style={styles.placeholder}>Tap to view details</Text>}
                </View>
            </TouchableOpacity>

            <Modal
                visible={isExpanded}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsExpanded(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: color }}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{title}</Text>
                        <TouchableOpacity onPress={() => setIsExpanded(false)} style={styles.closeButton}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.content}>
                        {children}
                    </View>
                </SafeAreaView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minHeight: 120,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#333",
    },
    previewContainer: {
        flex: 1,
    },
    placeholder: {
        color: "#666",
        fontStyle: "italic",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.1)",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    closeButton: {
        padding: 8,
    },
    closeText: {
        color: "#007AFF",
        fontSize: 16,
        fontWeight: "600",
    },
    content: {
        flex: 1,
        padding: 16,
    }
});
