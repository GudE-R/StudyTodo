"use client";

import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TimePickerProps {
    value: string; // HH:mm format
    onChange: (value: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0);

    useEffect(() => {
        if (value && value.includes(":")) {
            const [h, m] = value.split(":").map(Number);
            setHour(isNaN(h) ? 0 : h);
            setMinute(isNaN(m) ? 0 : m);
        }
    }, [value]);

    const updateTime = (h: number, m: number) => {
        const newH = (h + 24) % 24;
        const newM = (m + 60) % 60;
        setHour(newH);
        setMinute(newM);
        onChange(`${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`);
    };

    return (
        <div className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <div className="flex flex-col items-center">
                <button onClick={() => updateTime(hour + 1, minute)} className="p-1 text-gray-400 hover:text-blue-500">
                    <ChevronUp size={16} />
                </button>
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200 font-mono w-8 text-center">
                    {hour.toString().padStart(2, "0")}
                </div>
                <button onClick={() => updateTime(hour - 1, minute)} className="p-1 text-gray-400 hover:text-blue-500">
                    <ChevronDown size={16} />
                </button>
            </div>

            <div className="text-xl font-bold text-gray-400 pb-1">:</div>

            <div className="flex flex-col items-center">
                <button onClick={() => updateTime(hour, minute + 5)} className="p-1 text-gray-400 hover:text-blue-500">
                    <ChevronUp size={16} />
                </button>
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200 font-mono w-8 text-center">
                    {minute.toString().padStart(2, "0")}
                </div>
                <button onClick={() => updateTime(hour, minute - 5)} className="p-1 text-gray-400 hover:text-blue-500">
                    <ChevronDown size={16} />
                </button>
            </div>
        </div>
    );
}
