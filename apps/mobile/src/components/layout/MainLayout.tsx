import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdBanner } from './AdBanner';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileTodoList } from '../home/MobileTodoList';
import { MobileDaySchedule } from '../home/MobileDaySchedule';
import { MobileCalendar } from '../home/MobileCalendar';

// Modals
import { TodoCreateModal } from '../modals/TodoCreateModal';
import { SettingsModal } from '../modals/SettingsModal';
import { TemplateModal } from '../modals/TemplateModal';
import { ActivityModal } from '../modals/ActivityModal';

// Hooks
import { useMobileCategories } from '../../hooks/useMobileCategories';

type ViewMode = 'DEFAULT' | 'TODO_EXPANDED' | 'SCHEDULE_EXPANDED' | 'CALENDAR_EXPANDED';

export const MainLayout = () => {
    const { height: SCREEN_HEIGHT } = useWindowDimensions();

    // Global State
    const [currentDate, setCurrentDate] = useState(new Date());

    // Data Hooks
    const { categories } = useMobileCategories();

    // Modal State
    const [isTodoModalVisible, setTodoModalVisible] = useState(false);
    const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
    const [isTemplateModalVisible, setTemplateModalVisible] = useState(false);
    const [isActivityModalVisible, setActivityModalVisible] = useState(false);

    // Shared Values for Animation
    const splitRatio = useSharedValue(0.5); // 0.5 = 50/50
    const calendarHeightRatio = useSharedValue(0.2); // 0.2 = 20% height

    const [mode, setMode] = useState<ViewMode>('DEFAULT');

    const updateMode = (newMode: ViewMode) => {
        setMode(newMode);
    };

    // --- Gestures ---

    const todoSwipe = Gesture.Pan()
        .activeOffsetX(20)
        .failOffsetY(20)
        .onEnd((e) => {
            if (e.translationX > 50) {
                splitRatio.value = withSpring(0.9);
                calendarHeightRatio.value = withTiming(0.2);
                runOnJS(updateMode)('TODO_EXPANDED');
            } else if (e.translationX < -50 && mode === 'TODO_EXPANDED') {
                splitRatio.value = withSpring(0.5);
                runOnJS(updateMode)('DEFAULT');
            }
        });

    const scheduleSwipe = Gesture.Pan()
        .activeOffsetX(-20)
        .failOffsetY(20)
        .onEnd((e) => {
            if (e.translationX < -50) {
                splitRatio.value = withSpring(0.1);
                calendarHeightRatio.value = withTiming(0.2);
                runOnJS(updateMode)('SCHEDULE_EXPANDED');
            } else if (e.translationX > 50 && mode === 'SCHEDULE_EXPANDED') {
                splitRatio.value = withSpring(0.5);
                runOnJS(updateMode)('DEFAULT');
            }
        });

    const calendarSwipe = Gesture.Pan()
        .activeOffsetY(-20)
        .failOffsetX(20)
        .onEnd((e) => {
            if (e.translationY < -50) {
                calendarHeightRatio.value = withSpring(0.65);
                splitRatio.value = withSpring(0.5);
                runOnJS(updateMode)('CALENDAR_EXPANDED');
            } else if (e.translationY > 50 && mode === 'CALENDAR_EXPANDED') {
                calendarHeightRatio.value = withSpring(0.2);
                runOnJS(updateMode)('DEFAULT');
            }
        });

    // --- Animated Styles ---

    const leftPaneStyle = useAnimatedStyle(() => {
        return { flex: splitRatio.value };
    });

    const rightPaneStyle = useAnimatedStyle(() => {
        return { flex: 1 - splitRatio.value };
    });

    const calendarPaneStyle = useAnimatedStyle(() => {
        return { flex: calendarHeightRatio.value };
    });

    const splitViewContainerStyle = useAnimatedStyle(() => {
        return { flex: 1 - calendarHeightRatio.value };
    });

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <AdBanner />
                <Header
                    // date={currentDate} // TODO: Add date prop to Header
                    onOpenSettings={() => setSettingsModalVisible(true)}
                />

                {/* Main Content Area */}
                <View style={styles.mainContent}>

                    {/* Split View (Todo + Schedule) */}
                    <Animated.View style={[styles.splitViewWrapper, splitViewContainerStyle]}>
                        <GestureDetector gesture={todoSwipe}>
                            <Animated.View style={[styles.leftPane, leftPaneStyle]}>
                                <MobileTodoList
                                    date={currentDate}
                                />
                            </Animated.View>
                        </GestureDetector>

                        <GestureDetector gesture={scheduleSwipe}>
                            <Animated.View style={[styles.rightPane, rightPaneStyle]}>
                                <MobileDaySchedule
                                    currentDate={currentDate}
                                    onDateChange={setCurrentDate}
                                />
                            </Animated.View>
                        </GestureDetector>
                    </Animated.View>

                    {/* Calendar Pane */}
                    <GestureDetector gesture={calendarSwipe}>
                        <Animated.View style={[styles.calendarPane, calendarPaneStyle]}>
                            <MobileCalendar
                                currentDate={currentDate}
                                onDateSelect={setCurrentDate}
                            />
                        </Animated.View>
                    </GestureDetector>

                </View>

                <Footer
                    onOpenTemplate={() => setTemplateModalVisible(true)}
                    onOpenTodo={() => setTodoModalVisible(true)}
                    onOpenReport={() => setActivityModalVisible(true)}
                />

                {/* Modals */}
                <TodoCreateModal
                    visible={isTodoModalVisible}
                    onClose={() => setTodoModalVisible(false)}
                    categories={categories}
                />
                <SettingsModal
                    visible={isSettingsModalVisible}
                    onClose={() => setSettingsModalVisible(false)}
                />
                <TemplateModal
                    visible={isTemplateModalVisible}
                    onClose={() => setTemplateModalVisible(false)}
                />
                <ActivityModal
                    visible={isActivityModalVisible}
                    onClose={() => setActivityModalVisible(false)}
                />

            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeArea: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
    },
    splitViewWrapper: {
        flexDirection: 'row',
        overflow: 'hidden',
    },
    leftPane: {
        borderRightWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden',
    },
    rightPane: {
        overflow: 'hidden',
    },
    calendarPane: {
        borderTopWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden',
    }
});
