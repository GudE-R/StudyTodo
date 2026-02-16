
import { useState, useEffect, useRef, useCallback } from 'react';

import { useNotification } from './useNotification';

export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch';

interface UseTimerProps {
    initialMode?: TimerMode;
    initialDuration?: number; // in seconds
    onComplete?: () => void;
    notificationTitle?: string;
    notificationBody?: string;
}

export function useTimer({
    initialMode = 'pomodoro',
    initialDuration = 1500,
    onComplete,
    notificationTitle = "Timer Completed",
    notificationBody = "Time is up!"
}: UseTimerProps) {
    const [mode, setMode] = useState<TimerMode>(initialMode);
    const [timeLeft, setTimeLeft] = useState(initialDuration);
    const [isActive, setIsActive] = useState(false);
    const [elapsed, setElapsed] = useState(0); // For stopwatch or tracking actual time spent

    // Refs for interval and callback ensuring latest closure availability
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onCompleteRef = useRef(onComplete);
    const notificationIdRef = useRef<string | null>(null);

    const { scheduleTimerNotification, cancelNotification } = useNotification();

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const tick = useCallback(() => {
        if (mode === 'stopwatch') {
            setElapsed(prev => prev + 1);
            setTimeLeft(prev => prev + 1); // For stopwatch, timeLeft acts as total time
        } else {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsActive(false);
                    if (onCompleteRef.current) onCompleteRef.current();
                    return 0;
                }
                return prev - 1;
            });
            setElapsed(prev => prev + 1);
        }
    }, [mode]);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(tick, 1000);

            // Schedule notification if not stopwatch
            if (mode !== 'stopwatch') {
                scheduleTimerNotification(timeLeft, notificationTitle, notificationBody)
                    .then(id => { notificationIdRef.current = id; });
            }

        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Cancel notification
            if (notificationIdRef.current) {
                cancelNotification(notificationIdRef.current);
                notificationIdRef.current = null;
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (notificationIdRef.current) {
                cancelNotification(notificationIdRef.current);
            }
        };
    }, [isActive, tick]); // timeLeft is not in dependency array to avoid rescheduling every second

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = (newDuration?: number) => {
        setIsActive(false);
        setElapsed(0);
        if (mode === 'stopwatch') {
            setTimeLeft(0);
        } else {
            setTimeLeft(newDuration ?? initialDuration);
        }
    };

    const setDuration = (duration: number) => {
        setTimeLeft(duration);
        setElapsed(0);
        setIsActive(false);
    }

    return {
        mode,
        setMode,
        timeLeft,
        isActive,
        toggleTimer,
        resetTimer,
        setDuration,
        elapsed
    };
}
