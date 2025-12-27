import React from "react";
import { View, StyleSheet, Dimensions, Text, SafeAreaView, LayoutAnimation, UIManager, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureDetector, Gesture } from "react-native-gesture-handler";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

// Expanded mode type
export type ExpandedMode = 'none' | 'todo' | 'schedule' | 'calendar';

interface LayoutV2Props {
    header: React.ReactNode;
    todoList: React.ReactNode;
    daySchedule: React.ReactNode;
    calendar: React.ReactNode;
    footer: React.ReactNode;

    // Controlled State
    expandedMode: ExpandedMode;
    onModeChange: (mode: ExpandedMode) => void;
}

export function LayoutV2({
    header,
    todoList,
    daySchedule,
    calendar,
    footer,
    expandedMode,
    onModeChange
}: LayoutV2Props) {

    const changeMode = (newMode: ExpandedMode) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onModeChange(newMode);
    };

    /**
     * Gesture Definitions
     */
    // Todo (Left) -> Swipe Right to expand
    // Restore: Tap minimized area or Swipe Left
    const todoGesture = Gesture.Fling().direction(1).onEnd(() => { // Direction 1 = Right
        if (expandedMode === 'none') changeMode('todo');
    });

    // Schedule (Right) -> Swipe Left to expand
    // Restore: Tap minimized or Swipe Right
    const scheduleGesture = Gesture.Fling().direction(2).onEnd(() => { // Direction 2 = Left
        if (expandedMode === 'none') changeMode('schedule');
    });

    // Calendar (Bottom) -> Swipe Up to expand
    // Restore: Tap minimized or Swipe Down
    const calendarGesture = Gesture.Fling().direction(4).onEnd(() => { // Direction 4 = Up
        if (expandedMode === 'none') changeMode('calendar');
    });

    // Restore Gestures
    const restoreFromTodo = Gesture.Fling().direction(2).onEnd(() => { // Swipe Left to restore
        if (expandedMode === 'todo') changeMode('none');
    });
    const restoreFromSchedule = Gesture.Fling().direction(1).onEnd(() => { // Swipe Right to restore
        if (expandedMode === 'schedule') changeMode('none');
    });
    const restoreFromCalendar = Gesture.Fling().direction(8).onEnd(() => { // Swipe Down to restore
        if (expandedMode === 'calendar') changeMode('none');
    });

    // Tap to restore (for minimized areas)
    const tapRestore = Gesture.Tap().onEnd(() => {
        if (expandedMode !== 'none') changeMode('none');
    });


    /**
     * Flex Logic
     */
    const getMainFlex = () => (expandedMode === 'calendar' ? 1 : 8); // Slightly reduced main area
    const getCalendarFlex = () => (expandedMode === 'calendar' ? 9 : 4); // Increased calendar area (approx 33%)

    // Within Main Row
    const getTodoFlex = () => {
        if (expandedMode === 'none') return 1;
        if (expandedMode === 'todo') return 9;
        if (expandedMode === 'schedule') return 1; // minimized 10%
        return 1;
    };

    const getScheduleFlex = () => {
        if (expandedMode === 'none') return 1;
        if (expandedMode === 'todo') return 1; // minimized 10%
        if (expandedMode === 'schedule') return 9;
        return 1;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />

            {/* 1. Ad Banner */}
            <View style={styles.adBanner}>
                <Text style={styles.adText}>Ad Banner Area</Text>
            </View>

            {/* 2. Header */}
            <View style={styles.header}>
                {header}
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>

                {/* Main Split View */}
                <View style={[styles.mainSplit, { flex: getMainFlex() }]}>

                    {/* Left Column: Todo */}
                    <View style={[styles.column, { flex: getTodoFlex(), backgroundColor: '#FFF' }]}>
                        <GestureDetector gesture={
                            expandedMode === 'todo' ? restoreFromTodo :
                                (expandedMode === 'none' ? todoGesture : tapRestore)
                        }>
                            <View style={styles.widgetInner}>
                                {todoList}
                                {/* Overlay only when minimizing to catch taps */}
                                {expandedMode !== 'none' && expandedMode !== 'todo' && (
                                    <View style={styles.restoreOverlay} />
                                )}
                            </View>
                        </GestureDetector>
                    </View>

                    {/* Right Column: Schedule */}
                    <View style={[styles.column, { flex: getScheduleFlex(), backgroundColor: '#F9F9F9' }]}>
                        <GestureDetector gesture={
                            expandedMode === 'schedule' ? restoreFromSchedule :
                                (expandedMode === 'none' ? scheduleGesture : tapRestore)
                        }>
                            <View style={styles.widgetInner}>
                                {daySchedule}
                                {expandedMode !== 'none' && expandedMode !== 'schedule' && (
                                    <View style={styles.restoreOverlay} />
                                )}
                            </View>
                        </GestureDetector>
                    </View>

                </View>

                {/* Calendar Area */}
                <View style={[styles.calendarArea, { flex: getCalendarFlex() }]}>
                    <GestureDetector gesture={
                        expandedMode === 'calendar' ? restoreFromCalendar :
                            (expandedMode === 'none' ? calendarGesture : tapRestore)
                    }>
                        <View style={styles.widgetInner}>
                            {calendar}
                            {expandedMode !== 'none' && expandedMode !== 'calendar' && (
                                <View style={styles.restoreOverlay} />
                            )}
                        </View>
                    </GestureDetector>
                </View>

            </View>

            {/* Footer */}
            <View style={styles.footer}>
                {footer}
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F0F0F0",
    },
    adBanner: {
        height: 50,
        backgroundColor: "#E0E0E0",
        justifyContent: "center",
        alignItems: "center",
    },
    adText: { color: "#999" },
    header: {
        height: 40,
        borderBottomWidth: 1,
        borderBottomColor: "#DDD",
        backgroundColor: "#FFF",
    },
    contentArea: {
        flex: 1,
    },
    mainSplit: {
        flexDirection: "row",
    },
    column: {
        borderRightWidth: 1,
        borderRightColor: "#EEE",
        overflow: "hidden",
    },
    calendarArea: {
        borderTopWidth: 1,
        borderTopColor: "#DDD",
        backgroundColor: "#FFF",
        overflow: "hidden",
    },
    footer: {
        height: 60, // Compact footer
        borderTopWidth: 1,
        borderTopColor: "#DDD",
        backgroundColor: "#FFF",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "flex-end",
        paddingBottom: 5,
    },
    widgetInner: {
        flex: 1,
        position: 'relative',
    },
    restoreOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)', // High opacity to hide content
        zIndex: 20,
    }
});
