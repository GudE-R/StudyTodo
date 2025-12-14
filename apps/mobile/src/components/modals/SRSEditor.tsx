import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SRSEditor = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>SRS Profile Editor</Text>
            <Text style={styles.subText}>Coming soon...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    subText: {
        fontSize: 14,
        color: '#888',
    }
});
