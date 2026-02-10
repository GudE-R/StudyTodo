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
import { TodoDetailModal } from '../modals/TodoDetailModal';
import { SettingsModal } from '../modals/SettingsModal';
import { TemplateModal } from '../modals/TemplateModal';
import { ActivityModal } from '../modals/ActivityModal';
import { FeedbackModal } from '../modals/FeedbackModal';
import { UsageGuideModal } from '../modals/UsageGuideModal';
import { MobileTimerView } from '../timer/MobileTimerView'; // Import Timer

import { useMobileCategories } from '../../hooks/useMobileCategories';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileSessions } from '../../hooks/useMobileSessions';
import { useThemeColors } from '../../providers/ThemeProvider';
import { Todo, generateId } from '@studytodo/shared'; // Utils

export const MainLayout = () => {
    // Basic Layout without Reanimated
    const [currentDate, setCurrentDate] = useState(new Date());
    const { categories, refreshCategories } = useMobileCategories();
    const { addTodo, updateTodo, deleteTodo } = useMobileTodos();
    const { addSession } = useMobileSessions();
    const { colors, isDark } = useThemeColors();

    const [viewMode, setViewMode] = useState<"home" | "timer">("home");
    const [activeTodo, setActiveTodo] = useState<Todo | null>(null);

    // Keep State
    const [keptDate, setKeptDate] = useState<Date | null>(null);
    const [keptTime, setKeptTime] = useState<string | null>(null);

    const [isTodoModalVisible, setTodoModalVisible] = useState(false);
    const [isDetailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
    const [isTemplateModalVisible, setTemplateModalVisible] = useState(false);
    const [isActivityModalVisible, setActivityModalVisible] = useState(false);
    const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [isGuideModalVisible, setGuideModalVisible] = useState(false);

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

    // TodoDetailModal handlers
    const handleTodoPress = (todo: Todo) => {
        setSelectedTodo(todo);
        setDetailModalVisible(true);
    };

    const handleTodoStartNow = (todo: Todo) => {
        setActiveTodo(todo);
        setViewMode("timer");
    };

    const handleTodoUpdate = async (todo: Todo) => {
        await updateTodo(todo.id, todo);
    };

    const handleTodoDelete = async (todoId: string) => {
        await deleteTodo(todoId);
    };

    const handleTodoRecord = async (todo: Todo, duration: number) => {
        await updateTodo(todo.id, { ...todo, completed: true });
        await addSession({
            id: generateId(),
            todoId: todo.id,
            todoTitle: todo.title,
            duration: duration,
            mode: 'pomodoro',
            createdAt: new Date(),
        });
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
                    onCompleteTask={async () => {
                        await updateTodo(activeTodo.id, { ...activeTodo, completed: true });
                        setViewMode("home");
                        setActiveTodo(null);
                    }}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <AdBanner />
            <Header
                date={currentDate}
                onOpenSettings={() => setSettingsModalVisible(true)}
                onOpenFeedback={() => setFeedbackModalVisible(true)}
                onOpenGuide={() => setGuideModalVisible(true)}
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
            <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
                <View style={styles.splitRow}>
                    <View style={[styles.paneHalf, { borderColor: colors.border }]}>
                        <HomeTodoList date={currentDate} onTodoPress={handleTodoPress} />
                    </View>
                    <View style={[styles.paneHalf, { borderColor: colors.border }]}>
                        <HomeDaySchedule
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            keptDate={keptDate}
                            keptTime={keptTime}
                            onTimeLongPress={(date, time) => handleTimeLongPress(date, time)}
                        />
                    </View>
                </View>
                <View style={[styles.calendarPane, { borderColor: colors.border }]}>
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
            <FeedbackModal
                visible={isFeedbackModalVisible}
                onClose={() => setFeedbackModalVisible(false)}
            />
            <UsageGuideModal
                visible={isGuideModalVisible}
                onClose={() => setGuideModalVisible(false)}
            />
            <TodoDetailModal
                visible={isDetailModalVisible}
                onClose={() => setDetailModalVisible(false)}
                todo={selectedTodo}
                onStartNow={handleTodoStartNow}
                onDelete={handleTodoDelete}
                onUpdate={handleTodoUpdate}
                onRecord={handleTodoRecord}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
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
    },
    calendarPane: {
        height: 150,
        borderTopWidth: 1,
    }
});

