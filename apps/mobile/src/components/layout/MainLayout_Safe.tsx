import React, { useState } from 'react';
import { View, StyleSheet, Text, useWindowDimensions, ScrollView } from 'react-native';
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

import { useMobileCategories } from '../../hooks/useMobileCategories';

export const MainLayout = () => {
    // Basic Layout without Reanimated
    const [currentDate, setCurrentDate] = useState(new Date());
    const { categories, refreshCategories } = useMobileCategories();

    const [isTodoModalVisible, setTodoModalVisible] = useState(false);
    const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
    const [isTemplateModalVisible, setTemplateModalVisible] = useState(false);
    const [isActivityModalVisible, setActivityModalVisible] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea}>
            <AdBanner />
            <Header
                date={currentDate}
                onOpenSettings={() => setSettingsModalVisible(true)}
                onPrevDate={() => setCurrentDate(d => {
                    const newDate = new Date(d);
                    newDate.setDate(d.getDate() - 1);
                    return newDate;
                })}
                onNextDate={() => setCurrentDate(d => {
                    const newDate = new Date(d);
                    newDate.setDate(d.getDate() + 1);
                    return newDate;
                })}
            />

            {/* Simple Flex Layout */}
            <View style={styles.mainContent}>
                <View style={styles.splitRow}>
                    <View style={styles.paneHalf}>
                        <MobileTodoList date={currentDate} />
                    </View>
                    <View style={styles.paneHalf}>
                        <MobileDaySchedule currentDate={currentDate} onDateChange={setCurrentDate} />
                    </View>
                </View>
                <View style={styles.calendarPane}>
                    <MobileCalendar currentDate={currentDate} onDateSelect={setCurrentDate} />
                </View>
            </View>

            <Footer
                onOpenTemplate={() => setTemplateModalVisible(true)}
                onOpenTodo={() => setTodoModalVisible(true)}
                onOpenReport={() => setActivityModalVisible(true)}
            />

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
