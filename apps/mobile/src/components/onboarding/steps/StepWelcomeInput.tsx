import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookOpen, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../../providers/ThemeProvider';

interface StepWelcomeInputProps {
    onNext: (value: string) => void;
}

export function StepWelcomeInput({ onNext }: StepWelcomeInputProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const [value, setValue] = useState('');

    const handleSubmit = () => {
        const trimmed = value.trim();
        if (trimmed) onNext(trimmed);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: '#3b82f6' }]}>
                    <BookOpen size={40} color="#fff" />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                    {t('interactiveOnboarding.step1Title')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {t('interactiveOnboarding.step1Subtitle')}
                </Text>

                <TextInput
                    style={[styles.input, {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                    }]}
                    value={value}
                    onChangeText={setValue}
                    onSubmitEditing={handleSubmit}
                    placeholder={t('interactiveOnboarding.step1Placeholder')}
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    returnKeyType="next"
                />

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!value.trim()}
                    style={[styles.button, { opacity: value.trim() ? 1 : 0.4 }]}
                >
                    <Text style={styles.buttonText}>{t('interactiveOnboarding.step1Cta')}</Text>
                    <ArrowRight size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    input: {
        width: '100%',
        maxWidth: 400,
        fontSize: 18,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
