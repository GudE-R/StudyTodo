import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { X } from 'lucide-react-native';

interface ActivityModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ActivityModal = ({ visible, onClose }: ActivityModalProps) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Activity Report</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.content}>
                        <Text>Activity Log Report (Coming Soon)</Text>
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
        height: 500,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
