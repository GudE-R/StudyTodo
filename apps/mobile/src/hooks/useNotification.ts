import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useCallback } from 'react';

export const useNotification = () => {
    const requestPermissions = useCallback(async () => {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    }, []);

    const scheduleTimerNotification = useCallback(
        async (seconds: number, title: string, body: string) => {
            // Cancel any existing notifications first to avoid duplicates if necessary
            // But for timer, we usually just schedule a new one.

            const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                    vibrate: [0, 250, 250, 250],
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: seconds,
                    repeats: false,
                },
            });
            return identifier;
        },
        []
    );

    const cancelNotification = useCallback(async (identifier: string) => {
        await Notifications.cancelScheduledNotificationAsync(identifier);
    }, []);

    const scheduleDailyReminder = useCallback(
        async (hour: number, minute: number, title: string, body: string) => {
            // First, cancel all existing daily reminders to avoid duplicates
            // In a real app, we might want to track the ID of the daily reminder
            // For now, let's assume one daily reminder.
            // A better approach is to use a specific identifier or category, 
            // but expo-notifications manages IDs. We can store the ID in AsyncStorage if needed.
            // For simplicity/v1: cancel all scheduled notifications might be too aggressive if we have other notifications.
            // Let's rely on the calling component to manage cancellation if changing time, 
            // or we can implement a specific logic here.

            // For now, functionality to just schedule:
            const identifier = await Notifications.scheduleNotificationAsync({
                identifier: 'daily-reminder',
                content: {
                    title,
                    body,
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour,
                    minute,
                },
            });
            return identifier;
        },
        []
    );

    const cancelAllNotifications = useCallback(async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }, []);

    return {
        requestPermissions,
        scheduleTimerNotification,
        cancelNotification,
        scheduleDailyReminder,
        cancelAllNotifications
    };
};
