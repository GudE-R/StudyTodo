import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../providers/ThemeProvider';
import { useOnboarding } from '../../providers/OnboardingProvider';
import { StepWelcomeInput } from './steps/StepWelcomeInput';
import { StepSrsAha } from './steps/StepSrsAha';
import { StepKeepAha } from './steps/StepKeepAha';

type OnboardingStep = 'welcome-input' | 'srs-aha' | 'keep-aha';

const STEPS: OnboardingStep[] = ['welcome-input', 'srs-aha', 'keep-aha'];

export function InteractiveOnboarding() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { completeOnboarding } = useOnboarding();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome-input');
    const [studyTopic, setStudyTopic] = useState('');

    const currentIndex = STEPS.indexOf(currentStep);

    const handleComplete = () => {
        completeOnboarding();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.stepIndicator, { color: colors.textMuted }]}>
                    {t('interactiveOnboarding.stepIndicator', { current: currentIndex + 1, total: STEPS.length })}
                </Text>
                <TouchableOpacity onPress={handleComplete}>
                    <Text style={[styles.skipText, { color: colors.textMuted }]}>
                        {t('interactiveOnboarding.skipAll')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${((currentIndex + 1) / STEPS.length) * 100}%` },
                        ]}
                    />
                </View>
            </View>

            {/* Step content */}
            <View style={styles.content}>
                {currentStep === 'welcome-input' && (
                    <StepWelcomeInput
                        onNext={(value) => {
                            setStudyTopic(value);
                            setCurrentStep('srs-aha');
                        }}
                    />
                )}
                {currentStep === 'srs-aha' && (
                    <StepSrsAha
                        studyTopic={studyTopic}
                        onNext={() => setCurrentStep('keep-aha')}
                    />
                )}
                {currentStep === 'keep-aha' && (
                    <StepKeepAha onNext={handleComplete} />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    stepIndicator: {
        fontSize: 13,
    },
    skipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    progressBarContainer: {
        paddingHorizontal: 20,
    },
    progressBarBg: {
        height: 3,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 2,
    },
    content: {
        flex: 1,
    },
});
