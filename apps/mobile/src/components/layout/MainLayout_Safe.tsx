import React, { useState } from 'react';
import { View, StyleSheet, Text, useWindowDimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdBanner } from './AdBanner';
import { Header } from './Header';
import { Footer } from './Footer';
import { HomeTodoList } from '../home/HomeTodoList';
import { HomeDaySchedule } from '../home/HomeDaySchedule';
import { HomeCalendar } from '../home/HomeCalendar';

// Modals
import { TodoCreateModal } from '../modals/TodoCreateModal';
import { SettingsModal } from '../modals/SettingsModal';
import { TemplateModal } from '../modals/TemplateModal';
import { ActivityModal } from '../modals/ActivityModal';
import { MobileTimerView } from '../timer/MobileTimerView'; // Import Timer

import { useMobileCategories } from '../../hooks/useMobileCategories';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileSessions } from '../../hooks/useMobileSessions';
import { Todo, generateId } from '@pomarc/shared'; // Utils

export const MainLayout = () => {
    // Basic Layout without Reanimated
    const [currentDate, setCurrentDate] = useState(new Date());
    const { categories, refreshCategories } = useMobileCategories();
    const { addTodo } = useMobileTodos();
    const { addSession } = useMobileSessions();

    const [viewMode, setViewMode] = useState<"home" | "timer">("home");
    const [activeTodo, setActiveTodo] = useState<Todo | null>(null);

    // Keep State
    const [keptDate, setKeptDate] = useState<Date | null>(null);
    const [keptTime, setKeptTime] = useState<string | null>(null);

    const [isTodoModalVisible, setTodoModalVisible] = useState(false);
    const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
    const [isTemplateModalVisible, setTemplateModalVisible] = useState(false);
    const [isActivityModalVisible, setActivityModalVisible] = useState(false);

    // Keep Handlers
    const handleDateLongPress = (date: Date) => {
        if (keptDate && date.getTime() === keptDate.getTime()) {
            setKeptDate(null);
        } else {
            setKeptDate(date);
        }
    };

    // For Schedule time slot
    const handleTimeLongPress = (date: Date, time: string) => {
        // If same slot, toggle off
        if (keptTime === time && keptDate && date.getTime() === keptDate.getTime()) {
            setKeptTime(null);
            setKeptDate(null);
        } else {
            setKeptTime(time);
            setKeptDate(date);
        }
    };

    const handleResetKeep = () => {
        setKeptDate(null);
        setKeptTime(null);
    };

    const handleStartNow = async (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => {
        const newTodo: Todo = {
            ...todoData,
            id: generateId(),
            createdAt: new Date(),
            completed: false,
        };
        await addTodo(newTodo);
        setActiveTodo(newTodo);
        setViewMode("timer");
        setTodoModalVisible(false);
    };

    if (viewMode === "timer" && activeTodo) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <MobileTimerView
                    todo={activeTodo}
                    onBack={() => {
                        setViewMode("home");
                        setActiveTodo(null);
                    }}
                    onSaveSession={async (data) => {
                        await addSession({
                            id: generateId(),
                            todoId: data.todoId,
                            todoTitle: data.todoTitle,
                            duration: data.duration,
                            mode: data.mode as "pomodoro" | "stopwatch" | "countdown",
                            createdAt: new Date(),
                        });
                    }}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <AdBanner />
            <Header
                date={currentDate}
                onOpenSettings={() => setSettingsModalVisible(true)}
                onPrevDate={() => setCurrentDate(d => {
                    const safeD = (d instanceof Date && !isNaN(d.getTime())) ? d : new Date();
                    const newDate = new Date(safeD);
                    newDate.setDate(safeD.getDate() - 1);
                    return newDate;
                })}
                onNextDate={() => setCurrentDate(d => {
                    const safeD = (d instanceof Date && !isNaN(d.getTime())) ? d : new Date();
                    const newDate = new Date(safeD);
                    newDate.setDate(safeD.getDate() + 1);
                    return newDate;
                })}
            />

            {/* Simple Flex Layout */}
            <View style={styles.mainContent}>
                <View style={styles.splitRow}>
                    <View style={styles.paneHalf}>
                        <HomeTodoList date={currentDate} />
                    </View>
                    <View style={styles.paneHalf}>
                        <HomeDaySchedule
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            keptDate={keptDate}
                            keptTime={keptTime}
                            onTimeLongPress={(date, time) => handleTimeLongPress(date, time)}
                        />
                    </View>
                </View>
                <View style={styles.calendarPane}>
                    <HomeCalendar
                        currentDate={currentDate}
                        onDateSelect={setCurrentDate}
                        keptDate={keptDate}
                        onDateLongPress={(date) => handleDateLongPress(date)}
                    />
                </View>
            </View>

            <Footer
                onOpenTemplate={() => setTemplateModalVisible(true)}
                onOpenTodo={() => setTodoModalVisible(true)}
                onOpenReport={() => setActivityModalVisible(true)}
                isHighlighted={!!keptDate || !!keptTime}
                onResetKeep={handleResetKeep}
            />

            <TodoCreateModal
                visible={isTodoModalVisible}
                onClose={() => setTodoModalVisible(false)}
                categories={categories}
                initialDate={keptDate || undefined}
                initialTime={keptTime || undefined}
                onStartNow={handleStartNow}
            />
            <SettingsModal
                visible={isSettingsModalVisible}
                onClose={() => setSettingsModalVisible(false)}
            />
            <TemplateModal
                visible={isTemplateModalVisible}
                onClose={() => {
                    setTemplateModalVisible(false);
                    refreshCategories();
                }}
            />
            <ActivityModal
                visible={isActivityModalVisible}
                onClose={() => setActivityModalVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mainContent: {
        flex: 1,
    },
    splitRow: {
        flex: 1,
        flexDirection: 'row',
    },
    paneHalf: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#eee',
    },
    calendarPane: {
        height: 150,
        borderTopWidth: 1,
        borderColor: '#eee',
    }
});
