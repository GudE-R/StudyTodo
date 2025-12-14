"use client";

import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { CalendarPane } from "@/components/home/CalendarPane";

interface DatePickerProps {
    value?: Date;
    onChange: (date: Date) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center w-full px-3 py-2 text-left text-sm border rounded-lg transition-colors ${value ? "text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" : "text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
            >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                <span>{value ? format(value, "PPP") : "Pick a date"}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 z-50 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 w-[320px] h-[350px]">
                    {/* Reuse CalendarPane but in a smaller/modal context if possible, or just a simple calendar */}
                    {/* CalendarPane is designed as a pane, so it might need height adjustment. 
                         For now, this reuse is acceptable or we should implement a dedicated simple calendar.
                         Given the corruptions, simple is key. But CalendarPane is already restored. */}
                    <div className="h-full">
                        <CalendarPane selectedDate={value || new Date()} onSelectDate={(d) => { onChange(d); setIsOpen(false); }} />
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}
