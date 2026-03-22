import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Animated, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Clock, Brain, BarChart3, ArrowRight, MessageSquare, Calendar, Smartphone, Crown } from 'lucide-react-native';
import { OnboardingSlide, OnboardingSlideData } from './OnboardingSlide';
import { Paginator } from './Paginator';
import { useTheme } from '../../providers/ThemeProvider';
import { useOnboarding } from '../../providers/OnboardingProvider';

export const OnboardingScreen = () => {
    const { width } = useWindowDimensions();
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { completeOnboarding } = useOnboarding();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    const slides: OnboardingSlideData[] = useMemo(() => [
        {
            id: '1',
            title: t('onboarding.slides.welcome.title'),
            description: t('onboarding.slides.welcome.description'),
            Icon: CheckSquare, // Placeholder icon for logo
            color: colors.primary,
        },
        {
            id: '2',
            title: t('onboarding.slides.manage.title'),
            description: t('onboarding.slides.manage.description'),
            Icon: CheckSquare,
            color: '#f59e0b', // amber-500
        },
        {
            id: '7',
            title: t('onboarding.slides.calendar.title'),
            description: t('onboarding.slides.calendar.description'),
            Icon: Calendar,
            color: '#06b6d4', // cyan-500
        },
        {
            id: '3',
            title: t('onboarding.slides.focus.title'),
            description: t('onboarding.slides.focus.description'),
            Icon: Clock,
            color: '#ef4444', // red-500
        },
        {
            id: '4',
            title: t('onboarding.slides.srs.title'),
            description: t('onboarding.slides.srs.description'),
            Icon: Brain,
            color: '#22c55e', // green-500
        },
        {
            id: '5',
            title: t('onboarding.slides.analytics.title'),
            description: t('onboarding.slides.analytics.description'),
            Icon: BarChart3,
            color: '#8b5cf6', // violet-500
        },
        {
            id: '6',
            title: t('onboarding.slides.feedback.title'),
            description: t('onboarding.slides.feedback.description'),
            Icon: MessageSquare,
            color: '#ec4899', // pink-500
        },
        {
            id: '8',
            title: t('onboarding.slides.offline.title', 'Your Data, Your Device'),
            description: t('onboarding.slides.offline.description', 'All your data is stored locally on this device. No account required — start using the app right away.'),
            Icon: Smartphone,
            color: '#14b8a6', // teal-500
        },
        {
            id: '9',
            title: t('onboarding.slides.pro.title', 'Pro Plan (Coming Soon)'),
            description: t('onboarding.slides.pro.description', 'Cloud sync, multi-device support, and more features will be available in the upcoming Pro plan.'),
            Icon: Crown,
            color: '#f59e0b', // amber-500
        },
    ], [t]);

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollToNext = () => {
        if (currentIndex < slides.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={{ flex: 3 }}>
                <FlatList
                    data={slides}
                    renderItem={({ item }) => <OnboardingSlide item={item} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={32}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                    getItemLayout={(_, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                />
            </View>

            <Paginator data={slides} scrollX={scrollX} />

            <View style={styles.footer}>
                {/* Navigation Buttons */}
                <View style={styles.buttonContainer}>
                    {currentIndex < slides.length - 1 ? (
                        <>
                            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                                <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t('onboarding.skip')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={scrollToNext}
                                style={[styles.nextButton, { backgroundColor: colors.primary }]}
                            >
                                <ArrowRight size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            onPress={completeOnboarding}
                            style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
                        >
                            <Text style={styles.getStartedText}>{t('onboarding.getStarted')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        width: '100%',
        paddingBottom: 40,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    skipButton: {
        padding: 10,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '500',
    },
    nextButton: {
        padding: 16,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    getStartedButton: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    getStartedText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
