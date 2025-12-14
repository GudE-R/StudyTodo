import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FolderTree, BarChart2 } from 'lucide-react-native';

interface FooterProps {
    onOpenTemplate: () => void;
    onOpenTodo: () => void;
    onOpenReport: () => void;
}

export const Footer = ({ onOpenTemplate, onOpenTodo, onOpenReport }: FooterProps) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={onOpenTemplate}>
                <FolderTree size={20} color="#555" />
                <Text style={styles.label}>Template</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainButton} onPress={onOpenTodo}>
                <Text style={styles.mainButtonText}>+</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={onOpenReport}>
                <BarChart2 size={20} color="#555" />
                <Text style={styles.label}>Report</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        flexDirection: 'row',
        backgroundColor: '#fff',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#eee',
    },
    button: {
        padding: 5,
        alignItems: 'center',
    },
    label: {
        fontSize: 10,
        color: '#555',
        marginTop: 2,
    },
    mainButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#007AFF', // Blue
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -15, // Pop out
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: -2,
    }
});
