"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { format, eachHourOfInterval, startOfDay, endOfDay, isSameDay } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Todo } from "@pomarc/shared";

interface DayScheduleProps {
    selectedDate: Date;
}

export function DaySchedule({ selectedDate }: DayScheduleProps) {
    const todos = useLiveQuery(() => db.todos.where("dueDate").between(startOfDay(selectedDate), endOfDay(selectedDate), true, true).toArray()) || [];

    const hours = eachHourOfInterval({
        start: startOfDay(selectedDate),
        end: endOfDay(selectedDate)
    });

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto scroll to current time if today
    useEffect(() => {
        if (isSameDay(selectedDate, new Date()) && scrollContainerRef.current) {
            const currentHour = new Date().getHours();
            // Scroll to 1 hour before current time for context
            const targetPos = Math.max(0, (currentHour - 1) * 60);
            scrollContainerRef.current.scrollTop = targetPos;
        }
    }, [selectedDate]);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="font-bold text-gray-700 dark:text-gray-200">
                    {format(selectedDate, "MMM d, yyyy")}
                </h3>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
                {/* Time Grid */}
                <div className="relative min-h-[1440px]"> {/* 24h * 60px/h */}
                    {hours.map((hour) => (
                        <div key={hour.toISOString()} className="absolute w-full flex border-b border-gray-50 dark:border-gray-700/50" style={{ top: hour.getHours() * 60, height: 60 }}>
                            <div className="w-16 text-right pr-4 pt-1 text-xs font-bold text-gray-400">
                                {format(hour, "HH:mm")}
                            </div>
                            <div className="flex-1 relative">
                                {/* Grid line is border-b of parent */}
                            </div>
                        </div>
                    ))}

                    {/* Tasks Overlay */}
                    {todos.map((todo) => {
                        // Assuming todo has explicit start/end time. 
                        // If not, we might place them in an "All Day" section or default slot.
                        // For this implementation, let's assume if it has dueDate, it's at that time, default 1 hr duration.
                        if (!todo.dueDate) return null;

                        const start = new Date(todo.dueDate);
                        const startMinutes = start.getHours() * 60 + start.getMinutes();
                        const duration = 60; // default 60 mins

                        return (
                            <div
                                key={todo.id}
                                className="absolute left-16 right-4 rounded-lg bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500 p-2 text-xs overflow-hidden hover:z-10 hover:shadow-lg transition-all"
                                style={{
                                    top: startMinutes,
                                    height: duration,
                                }}
                            >
                                <div className="font-bold text-blue-700 dark:text-blue-200 truncate">{todo.title}</div>
                                {todo.memo && <div className="text-blue-500 dark:text-blue-300 truncate font-medium">{todo.memo}</div>}
                            </div>
                        );
                    })}

                    {/* Current Time Indicator */}
                    {isSameDay(selectedDate, new Date()) && (
                        <div
                            className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                            style={{ top: new Date().getHours() * 60 + new Date().getMinutes() }}
                        >
                            <div className="w-16 text-right pr-2">
                                <span className="bg-red-500 text-white text-[10px] px-1 rounded-sm font-bold">NOW</span>
                            </div>
                            <div className="flex-1"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
