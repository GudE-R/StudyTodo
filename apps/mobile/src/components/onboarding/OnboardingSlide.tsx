import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../providers/ThemeProvider';

const { width } = Dimensions.get('window');

export type OnboardingSlideData = {
    id: string;
    title: string;
    description: string;
    Icon: LucideIcon;
    color: string;
};

type OnboardingSlideProps = {
    item: OnboardingSlideData;
};

export const OnboardingSlide = ({ item }: OnboardingSlideProps) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { width }]}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <item.Icon size={64} color={item.color} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {item.title}
                </Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {item.description}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});
