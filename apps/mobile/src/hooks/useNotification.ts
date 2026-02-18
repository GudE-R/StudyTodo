import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useCallback } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const useNotification = () => {
    const requestPermissions = useCallback(async () => {
        if (isExpoGo) {
            console.log('Notifications are not supported in Expo Go');
            return false;
        }

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
            if (isExpoGo) return;

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
        if (isExpoGo) return;
        await Notifications.cancelScheduledNotificationAsync(identifier);
    }, []);

    const scheduleDailyReminder = useCallback(
        async (hour: number, minute: number, title: string, body: string) => {
            if (isExpoGo) return;

            // First, cancel all existing daily reminders to avoid duplicates
            // ... (comment remains same)

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
        if (isExpoGo) return;
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
