"use client";

import { useState, useCallback } from "react";

export function useKeepState() {
    const [keptDate, setKeptDate] = useState<Date | null>(null);
    const [keptTime, setKeptTime] = useState<string | null>(null);

    const handleDateLongPress = useCallback((date: Date) => {
        if (keptDate && date.getTime() === keptDate.getTime()) {
            setKeptDate(null);
        } else {
            setKeptDate(date);
        }
    }, [keptDate]);

    const handleTimeLongPress = useCallback((date: Date, time: string) => {
        if (keptTime === time && keptDate && date.getTime() === keptDate.getTime()) {
            setKeptTime(null);
            setKeptDate(null);
        } else {
            setKeptTime(time);
            setKeptDate(date);
        }
    }, [keptTime, keptDate]);

    const handleResetKeep = useCallback(() => {
        setKeptDate(null);
        setKeptTime(null);
    }, []);

    return {
        keptDate,
        keptTime,
        handleDateLongPress,
        handleTimeLongPress,
        handleResetKeep,
    };
}
