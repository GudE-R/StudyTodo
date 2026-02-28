import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useNotification } from './useNotification';

const REMINDER_ENABLED_KEY = '@studytodo_reminder_enabled';
const REMINDER_TIME_KEY = '@studytodo_reminder_time';

export function useSettingsForm() {
    const { t } = useTranslation();
    const { scheduleDailyReminder, cancelNotification, requestPermissions } = useNotification();

    // リマインダー設定
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    // 設定のロード
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const enabled = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
                const time = await AsyncStorage.getItem(REMINDER_TIME_KEY);

                if (enabled !== null) setReminderEnabled(enabled === 'true');
                if (time !== null) setReminderTime(new Date(time));
                else {
                    const defaultTime = new Date();
                    defaultTime.setHours(9, 0, 0, 0);
                    setReminderTime(defaultTime);
                }
            } catch (e) {
                console.error("Failed to load settings", e);
            }
        };
        loadSettings();
    }, []);

    const updateReminder = async (enabled: boolean, time: Date) => {
        try {
            if (enabled) {
                const hasPermission = await requestPermissions();
                if (!hasPermission) {
                    alert(t('settings.permissionRequired', 'Notification permission is required for reminders.'));
                    setReminderEnabled(false);
                    return;
                }

                await scheduleDailyReminder(
                    time.getHours(),
                    time.getMinutes(),
                    t('notification.dailyReminderTitle', "Time to learn!"),
                    t('notification.dailyReminderBody', "Let's check your tasks for today.")
                );
            } else {
                await cancelNotification('daily-reminder');
            }

            await AsyncStorage.setItem(REMINDER_ENABLED_KEY, String(enabled));
            await AsyncStorage.setItem(REMINDER_TIME_KEY, time.toISOString());
        } catch (e) {
            console.error(e);
        }
    };

    const toggleReminder = (value: boolean) => {
        setReminderEnabled(value);
        updateReminder(value, reminderTime);
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }

        if (selectedDate) {
            setReminderTime(selectedDate);
            if (reminderEnabled) {
                updateReminder(true, selectedDate);
            }
        }
    };

    return {
        reminderEnabled,
        reminderTime,
        showTimePicker, setShowTimePicker,
        toggleReminder,
        onTimeChange,
    };
}
