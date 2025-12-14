
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Settings, UserCircle } from 'lucide-react-native';

export const Header = () => {
    const today = new Date().toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.iconButton}>
                <UserCircle size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.dateText}>{today}</Text>

            <TouchableOpacity style={styles.iconButton}>
                <Settings size={24} color="#333" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    iconButton: {
        padding: 8,
    },
});
