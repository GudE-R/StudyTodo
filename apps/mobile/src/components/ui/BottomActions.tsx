
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Layers, Plus, BarChart3 } from 'lucide-react-native';

interface BottomActionsProps {
    onAddPress: () => void;
    onTemplatePress: () => void;
}

export const BottomActions = ({ onAddPress, onTemplatePress }: BottomActionsProps) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={onTemplatePress}>
                <Layers size={24} color="#666" />
                <Text style={styles.label}>Template</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainButton} onPress={onAddPress}>
                <Plus size={32} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
                <BarChart3 size={24} color="#666" />
                <Text style={styles.label}>Report</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    mainButton: {
        backgroundColor: '#3b82f6', // Tailwind blue-500
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20, // Elevate slightly
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    label: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
    },
});
