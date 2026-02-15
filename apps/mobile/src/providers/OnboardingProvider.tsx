import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

const ONBOARDING_COMPLETED_KEY = 'HAS_COMPLETED_ONBOARDING';

type OnboardingContextType = {
    hasCompletedOnboarding: boolean;
    isLoading: boolean;
    completeOnboarding: () => Promise<void>;
    resetOnboarding: () => Promise<void>; // For debugging/testing
};

const OnboardingContext = createContext<OnboardingContextType>({
    hasCompletedOnboarding: false,
    isLoading: true,
    completeOnboarding: async () => { },
    resetOnboarding: async () => { },
});

export const useOnboarding = () => useContext(OnboardingContext);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
            if (value !== null) {
                setHasCompletedOnboarding(true);
            }
        } catch (e) {
            console.error('Failed to load onboarding status', e);
        } finally {
            setIsLoading(false);
        }
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
            setHasCompletedOnboarding(true);
        } catch (e) {
            console.error('Failed to save onboarding status', e);
        }
    };

    const resetOnboarding = async () => {
        try {
            await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
            setHasCompletedOnboarding(false);
        } catch (e) {
            console.error('Failed to reset onboarding status', e);
        }
    };

    if (isLoading) {
        // You might want to show a splash screen here, but for now a simple loading loop
        // prevents the main app from flashing before checking status.
        return null;
    }

    return (
        <OnboardingContext.Provider
            value={{
                hasCompletedOnboarding,
                isLoading,
                completeOnboarding,
                resetOnboarding,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}
