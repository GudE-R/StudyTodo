
import { useState, useEffect, useRef, useCallback } from 'react';

export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch';

interface UseTimerProps {
    initialMode?: TimerMode;
    initialDuration?: number; // in seconds
    onComplete?: () => void;
}

export function useTimer({ initialMode = 'pomodoro', initialDuration = 1500, onComplete }: UseTimerProps) {
    const [mode, setMode] = useState<TimerMode>(initialMode);
    const [timeLeft, setTimeLeft] = useState(initialDuration);
    const [isActive, setIsActive] = useState(false);
    const [elapsed, setElapsed] = useState(0); // For stopwatch or tracking actual time spent

    // Refs for interval and callback ensuring latest closure availability
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onCompleteRef = useRef(onComplete);

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
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, tick]);

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
