import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { MainLayout as MainLayoutDefault } from './MainLayout_Safe';
import { MainLayoutSimple } from './MainLayoutSimple';
import { useLayout } from '../../providers/LayoutProvider';
import { useOnboarding } from '../../providers/OnboardingProvider';
import { InteractiveOnboarding } from '../onboarding/InteractiveOnboarding';

export const MainLayoutSelector = () => {
    const { layoutMode } = useLayout();
    const { hasCompletedOnboarding, isLoading } = useOnboarding();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!hasCompletedOnboarding) {
        return <InteractiveOnboarding />;
    }

    if (layoutMode === 'simple') {
        return <MainLayoutSimple />;
    }

    return <MainLayoutDefault />;
};
