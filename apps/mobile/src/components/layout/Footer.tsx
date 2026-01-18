import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FolderTree, BarChart2, X } from 'lucide-react-native';
import { useThemeColors } from '../../providers/ThemeProvider';

interface FooterProps {
    onOpenTemplate: () => void;
    onOpenTodo: () => void;
    onOpenReport: () => void;
    isHighlighted?: boolean;
    onResetKeep?: () => void;
}

export const Footer = ({ onOpenTemplate, onOpenTodo, onOpenReport, isHighlighted, onResetKeep }: FooterProps) => {
    const { colors } = useThemeColors();

    return (
        <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.button} onPress={onOpenTemplate}>
                <FolderTree size={20} color={colors.icon} />
                <Text style={[styles.label, { color: colors.textSecondary }]}>Template</Text>
            </TouchableOpacity>

            <View style={styles.centerContainer}>
                <TouchableOpacity
                    style={[styles.mainButton, isHighlighted && styles.mainButtonHighlighted]}
                    onPress={onOpenTodo}
                >
                    <Text style={styles.mainButtonText}>+</Text>
                </TouchableOpacity>
                {isHighlighted && onResetKeep && (
                    <TouchableOpacity style={styles.resetButton} onPress={onResetKeep}>
                        <X size={16} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity style={styles.button} onPress={onOpenReport}>
                <BarChart2 size={20} color={colors.icon} />
                <Text style={[styles.label, { color: colors.textSecondary }]}>Report</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
    },
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -15,
        width: 80,
        height: 50,
    },
    button: {
        padding: 5,
        alignItems: 'center',
    },
    label: {
        fontSize: 10,
        marginTop: 2,
    },
    mainButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
        zIndex: 1,
    },
    mainButtonHighlighted: {
        backgroundColor: '#f97316',
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: -2,
    },
    resetButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#ef4444',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 6,
        zIndex: 2,
    }
});

