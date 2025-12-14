"use client";

import React, { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

interface CalendarPaneProps {
    onSelectDate: (date: Date) => void;
    selectedDate: Date;
}

export function CalendarPane({ onSelectDate, selectedDate }: CalendarPaneProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
    const todos = useLiveQuery(() => db.todos.toArray()) || [];

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    const hasActivity = (date: Date) => {
        return sessions.some(session => isSameDay(new Date(session.createdAt), date));
    };

    const hasTasks = (date: Date) => {
        return todos.some(todo => todo.dueDate && isSameDay(new Date(todo.dueDate), date));
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                <span className="font-bold text-gray-700 dark:text-gray-200">
                    {format(currentMonth, "yyyy年 M月", { locale: ja })}
                </span>
                <div className="flex space-x-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Days Grid */}
            <div className="flex-1 p-2">
                <div className="grid grid-cols-7 mb-2">
                    {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
                        <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, idx) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isTodayDate = isToday(day);

                        const hasSession = hasActivity(day);
                        const hasToDo = hasTasks(day);

                        return (
                            <button
                                key={idx}
                                onClick={() => onSelectDate(day)}
                                className={`
                                    relative flex flex-col items-center justify-center p-2 rounded-lg text-sm transition-all
                                    ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-gray-700 dark:text-gray-200"}
                                    ${isSelected ? "bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-none" : "hover:bg-gray-50 dark:hover:bg-gray-700"}
                                    ${isTodayDate && !isSelected ? "font-bold text-blue-600 dark:text-blue-400" : ""}
                                `}
                            >
                                <span>{format(day, "d")}</span>
                                <div className="flex space-x-0.5 mt-1 h-1.5">
                                    {hasSession && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-green-400"}`} />}
                                    {hasToDo && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-orange-400"}`} />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
