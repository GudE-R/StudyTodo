
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotification } from './useNotification';
import { tick as coreTick, resetTimerState, createInitialState, TimerMode } from './timerCore';

export type { TimerMode } from './timerCore';

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
    const initial = createInitialState(initialMode, initialDuration);
    const [mode, setMode] = useState<TimerMode>(initial.mode);
    const [timeLeft, setTimeLeft] = useState(initial.timeLeft);
    const [isActive, setIsActive] = useState(initial.isActive);
    const [elapsed, setElapsed] = useState(initial.elapsed);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onCompleteRef = useRef(onComplete);
    const notificationIdRef = useRef<string | null>(null);

    const { scheduleTimerNotification, cancelNotification } = useNotification();

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const performTick = useCallback(() => {
        const currentState = { mode, timeLeft, isActive: true, elapsed };
        // We use a functional update pattern to get latest state
        setTimeLeft(prevTimeLeft => {
            setElapsed(prevElapsed => {
                const state = { mode, timeLeft: prevTimeLeft, isActive: true, elapsed: prevElapsed };
                const result = coreTick(state);
                if (result.completed) {
                    setIsActive(false);
                    if (onCompleteRef.current) onCompleteRef.current();
                }
                // elapsed is set here via the outer setElapsed
                return result.elapsed;
            });
            const state = { mode, timeLeft: prevTimeLeft, isActive: true, elapsed: 0 };
            return coreTick(state).timeLeft;
        });
    }, [mode]);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(performTick, 1000);

            if (mode !== 'stopwatch') {
                scheduleTimerNotification(timeLeft, notificationTitle, notificationBody)
                    .then(id => { notificationIdRef.current = id ?? null; });
            }
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
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
    }, [isActive, performTick]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = (newDuration?: number) => {
        const reset = resetTimerState(mode, newDuration ?? initialDuration);
        setIsActive(reset.isActive);
        setElapsed(reset.elapsed);
        setTimeLeft(reset.timeLeft);
    };

    const setDuration = (duration: number) => {
        setTimeLeft(duration);
        setElapsed(0);
        setIsActive(false);
    };

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
