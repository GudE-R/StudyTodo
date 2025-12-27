import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AdBanner = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Ad Banner Area</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    text: {
        color: '#888',
    }
});
