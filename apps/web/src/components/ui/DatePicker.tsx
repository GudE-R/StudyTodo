"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface DatePickerProps {
    value: Date | null;
    onChange: (date: Date) => void;
    placeholder?: string;
}

/**
 * 繧ｫ繧ｹ繧ｿ繝譌･莉倬∈謚槭さ繝ｳ繝昴・繝阪Φ繝・
 * 
 * 隘ｿ證ｦ繝ｻ譛郁｡ｨ遉ｺ・井ｾ具ｼ・025蟷ｴ 11譛茨ｼ峨・繧ｫ繝ｬ繝ｳ繝繝ｼ繧呈署萓帙＠縺ｾ縺吶・
 * 螟夜Κ繝ｩ繧､繝悶Λ繝ｪ縺ｫ萓晏ｭ倥○縺壹‥ate-fns繧剃ｽｿ逕ｨ縺励※繧ｫ繝ｬ繝ｳ繝繝ｼ繝ｭ繧ｸ繝・け繧貞ｮ溯｣・＠縺ｦ縺・∪縺吶・
 */
export function DatePicker({ value, onChange, placeholder = "譌･莉倥ｒ驕ｸ謚・ }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value || new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // 繧ｯ繝ｪ繝・け譎ゅ・繧､繝吶Φ繝医Μ繧ｹ繝翫・險ｭ螳・
    // 繧ｳ繝ｳ繝昴・繝阪Φ繝亥､悶ｒ繧ｯ繝ｪ繝・け縺励◆蝣ｴ蜷医↓繧ｫ繝ｬ繝ｳ繝繝ｼ繧帝哩縺倥ｋ蜃ｦ逅・
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (value) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentMonth(value);
        }
    }, [value]);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    // 繧ｫ繝ｬ繝ｳ繝繝ｼ繧ｰ繝ｪ繝・ラ縺ｮ逕滓・繝ｭ繧ｸ繝・け
    // 1. 迴ｾ蝨ｨ陦ｨ遉ｺ縺励※縺・ｋ譛医・髢句ｧ区律縺ｨ邨ゆｺ・律繧貞叙蠕・
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // 2. 繧ｫ繝ｬ繝ｳ繝繝ｼ陦ｨ遉ｺ逕ｨ縺ｫ縲・幕蟋矩ｱ縺ｮ譌･譖懈律縺ｨ邨ゆｺ・ｱ縺ｮ蝨滓屆譌･縺ｾ縺ｧ遽・峇繧呈僑蠑ｵ
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    // 3. 陦ｨ遉ｺ遽・峇蜀・・縺吶∋縺ｦ縺ｮ譌･莉倬・蛻励ｒ逕滓・
    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    const weekDays = ["譌･", "譛・, "轣ｫ", "豌ｴ", "譛ｨ", "驥・, "蝨・];

    const handleDateClick = (date: Date) => {
        onChange(date);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
          w-full flex items-center space-x-2 bg-gray-50 p-2 rounded-lg text-sm outline-none transition-colors
          ${isOpen ? "ring-2 ring-blue-100 bg-white" : "hover:bg-gray-100"}
        `}
            >
                <CalendarIcon size={18} className="text-gray-500" />
                <span className={value ? "text-gray-700" : "text-gray-400"}>
                    {value ? format(value, "yyyy蟷ｴ M譛・譌･(E)", { locale: ja }) : placeholder}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-bold text-gray-700">
                            {format(currentMonth, "yyyy蟷ｴ M譛・, { locale: ja })}
                        </span>
                        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Week Days */}
                    <div className="grid grid-cols-7 mb-1">
                        {weekDays.map((day, i) => (
                            <div key={i} className="text-center text-[10px] text-gray-400 font-medium">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date, i) => {
                            const isCurrentMonth = isSameMonth(date, monthStart);
                            const isSelected = value && isSameDay(date, value);
                            const isToday = isSameDay(date, new Date());

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDateClick(date)}
                                    className={`
                    h-8 w-8 rounded-full flex items-center justify-center text-xs transition-colors
                    ${!isCurrentMonth ? "text-gray-300" : "text-gray-700"}
                    ${isSelected ? "bg-blue-600 text-white font-bold shadow-md" : isToday ? "bg-orange-100 text-orange-600 font-bold" : "hover:bg-gray-100"}
                  `}
                                >
                                    {format(date, "d")}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
