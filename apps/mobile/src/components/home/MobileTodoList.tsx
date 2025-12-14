import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MobileTodoListProps {
    date?: Date;
}

export const MobileTodoList = ({ date = new Date() }: MobileTodoListProps) => {
    return (
        <View style={styles.container}>
            {/* Header Removed as requested */}
            <View style={styles.content}>
                <Text style={styles.emptyText}>No tasks for today</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#aaa',
        marginTop: 20,
    }
});
