import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Animated, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Clock, Brain, BarChart3, ArrowRight } from 'lucide-react-native';
import { OnboardingSlide, OnboardingSlideData } from './OnboardingSlide';
import { Paginator } from './Paginator';
import { useTheme } from '../../providers/ThemeProvider';
import { useOnboarding } from '../../providers/OnboardingProvider';
import { useAuth } from '../../providers/AuthProvider';

const { width } = Dimensions.get('window');

// Data for slides
const slides: OnboardingSlideData[] = [
    {
        id: '1',
        title: 'Welcome to StudyTodo',
        description: 'The all-in-one app for learning: Tasks, Timer, SRS, and Analytics.',
        Icon: CheckSquare, // Placeholder icon for logo
        color: '#3b82f6', // blue-500
    },
    {
        id: '2',
        title: 'Manage Tasks',
        description: 'Create tasks, organize with categories, and set priorities to stay on top of your work.',
        Icon: CheckSquare,
        color: '#f59e0b', // amber-500
    },
    {
        id: '3',
        title: 'Boost Focus',
        description: 'Use the Pomodoro timer to focus deeply and track your study time.',
        Icon: Clock,
        color: '#ef4444', // red-500
    },
    {
        id: '4',
        title: 'Smart Review',
        description: 'Master any subject with Spaced Repetition System (SRS).',
        Icon: Brain,
        color: '#22c55e', // green-500
    },
    {
        id: '5',
        title: 'Visualize Progress',
        description: 'Track your growth with detailed analytics and charts.',
        Icon: BarChart3,
        color: '#8b5cf6', // violet-500
    },
];

export const OnboardingScreen = () => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { completeOnboarding } = useOnboarding();
    const { signIn } = useAuth(); // Assuming basic access or we just navigate to main
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

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
                />
            </View>

            <Paginator data={slides} scrollX={scrollX} />

            <View style={styles.footer}>
                {/* Navigation Buttons */}
                <View style={styles.buttonContainer}>
                    {currentIndex < slides.length - 1 ? (
                        <>
                            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                                <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
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
                            <Text style={styles.getStartedText}>Get Started</Text>
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
