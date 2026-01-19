import { Session } from '../types';
import { isSameDay, subDays, startOfDay, differenceInCalendarDays } from 'date-fns';

export interface StreakStats {
    currentStreak: number;
    longestStreak: number;
}

export const calculateStreak = (sessions: Session[]): StreakStats => {
    if (sessions.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // specific to shared logic
    const uniqueDates = Array.from(new Set(
        sessions.map(s => startOfDay(new Date(s.createdAt)).getTime())
    )).sort((a, b) => b - a);

    if (uniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const today = startOfDay(new Date());

    // Current Streak Calculation
    let currentStreak = 0;
    const lastStudyDate = new Date(uniqueDates[0]);

    if (isSameDay(lastStudyDate, today)) {
        currentStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i]);
            const expectedDate = subDays(new Date(uniqueDates[i - 1]), 1);
            if (isSameDay(prevDate, expectedDate)) {
                currentStreak++;
            } else {
                break;
            }
        }
    } else if (isSameDay(lastStudyDate, subDays(today, 1))) {
        currentStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i]);
            const expectedDate = subDays(new Date(uniqueDates[i - 1]), 1);
            if (isSameDay(prevDate, expectedDate)) {
                currentStreak++;
            } else {
                break;
            }
        }
    } else {
        currentStreak = 0;
    }

    // Longest Streak Calculation
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i]);
        const prevDate = new Date(uniqueDates[i - 1]);

        if (differenceInCalendarDays(prevDate, currentDate) === 1) {
            tempStreak++;
        } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
        }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    return { currentStreak, longestStreak };
};
