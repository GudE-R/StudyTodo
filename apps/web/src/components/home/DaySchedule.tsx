"use client";

import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";

import { Todo } from "@pomarc/shared";
import { TodoTitle } from "@/components/ui/TodoTitle";

interface DayScheduleProps {
    keptTime?: string | null;
    keptDate?: Date | null;
    onTimeLongPress?: (date: Date, time: string) => void;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    todos: Todo[];
    onTodoClick?: (todo: Todo) => void; // Todo隧ｳ邏ｰ縺ｸ縺ｮ驕ｷ遘ｻ逕ｨ
}

/**
 * 騾｣邯壹せ繧ｱ繧ｸ繝･繝ｼ繝ｫ繧ｳ繝ｳ繝昴・繝阪Φ繝茨ｼ育┌髯舌せ繧ｯ繝ｭ繝ｼ繝ｫ蟇ｾ蠢懶ｼ・
 * 
 * 繝帙・繝逕ｻ髱｢蜿ｳ繧ｫ繝ｩ繝縺ｫ陦ｨ遉ｺ縺輔ｌ繧九ち繧､繝繝ｩ繧､繝ｳ繝薙Η繝ｼ縺ｧ縺吶・
 * 驕ｸ謚樔ｸｭ縺ｮ譌･莉倥ｒ荳ｭ蠢・↓縲∝燕蠕御ｸ螳壽悄髢難ｼ医ヰ繝・ヵ繧｡・峨・譌･莉倥ｒ繝ｬ繝ｳ繝繝ｪ繝ｳ繧ｰ縺励∪縺吶・
 * 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺励※遶ｯ縺ｫ霑代▼縺上→縲∬・蜍慕噪縺ｫ繝舌ャ繝輔ぃ繧呈峩譁ｰ・亥・荳ｭ蠢・喧・峨＠縲・
 * 謫ｬ莨ｼ逧・↑辟｡髯舌せ繧ｯ繝ｭ繝ｼ繝ｫ繧貞ｮ溽樟縺励∪縺吶・
 */
export function DaySchedule({
    keptTime,
    keptDate,
    onTimeLongPress,
    selectedDate,
    onDateChange,
    todos,
    onTodoClick
}: DayScheduleProps) {
    // 繝舌ャ繝輔ぃ繧ｵ繧､繧ｺ・亥燕蠕御ｽ墓律蛻・ｒ陦ｨ遉ｺ縺吶ｋ縺具ｼ・
    // 60譌･蛻・≠繧後・縲・ｻ郢√↑蜀阪Ξ繝ｳ繝繝ｪ繝ｳ繧ｰ繧帝亟縺偵∪縺・
    const BUFFER_DAYS = 60;
    // 蜀堺ｸｭ蠢・喧縺ｮ繝医Μ繧ｬ繝ｼ縺ｨ縺ｪ繧矩明蛟､・育ｫｯ縺九ｉ菴墓律莉･蜀・〒譖ｴ譁ｰ縺吶ｋ縺具ｼ・
    const RECENTER_THRESHOLD = 15;

    // 0譎ゅ°繧・3譎ゅ∪縺ｧ縺ｮ譎る俣譫 (24譎る俣蟇ｾ蠢・
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // 陦ｨ遉ｺ縺吶ｋ譌･莉倥Μ繧ｹ繝医・迥ｶ諷・
    const [days, setDays] = useState<Date[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const dayRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ蛻ｶ蠕｡逕ｨ繝輔Λ繧ｰ
    const isAutoScrollingRef = useRef(false);
    const isUserScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // IntersectionObserver繧呈怏蜉ｹ縺ｫ縺吶ｋ縺九←縺・°・亥・譛溘せ繧ｯ繝ｭ繝ｼ繝ｫ螳御ｺ・ｾ後↓譛牙柑蛹厄ｼ・
    const [isObserverEnabled, setIsObserverEnabled] = useState(false);

    // 譌･莉倥Μ繧ｹ繝育函謌舌・繝ｫ繝代・
    const generateDays = (centerDate: Date) => {
        const start = subDays(centerDate, BUFFER_DAYS);
        return Array.from({ length: BUFFER_DAYS * 2 + 1 }, (_, i) => addDays(start, i));
    };

    // 蛻晄悄蛹悶♀繧医・selectedDate縺悟､ｧ縺阪￥螟峨ｏ縺｣縺溷ｴ蜷医・蜀咲函謌・
    useEffect(() => {
        // days縺檎ｩｺ縲√∪縺溘・selectedDate縺檎樟蝨ｨ縺ｮ遽・峇縺九ｉ螟ｧ縺阪￥螟悶ｌ縺ｦ縺・ｋ蝣ｴ蜷医・蜀咲函謌・
        const needsRegeneration = days.length === 0 || !days.some(d => isSameDay(d, selectedDate));

        if (needsRegeneration) {
            const newDays = generateDays(selectedDate);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDays(newDays);
            // 蛻晏屓繧・ず繝｣繝ｳ繝玲凾縺ｯ蜊ｳ蠎ｧ縺ｫ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ繧貞粋繧上○繧九ヵ繝ｩ繧ｰ繧堤ｫ九※繧・
            isAutoScrollingRef.current = true;
        }
    }, [selectedDate, days]); // Added days to dependencies

    // selectedDate縺ｮ螟画峩繧堤屮隕悶＠縲∝ｿ・ｦ√↓蠢懊§縺ｦ繝舌ャ繝輔ぃ繧呈峩譁ｰ・育┌髯舌せ繧ｯ繝ｭ繝ｼ繝ｫ蜃ｦ逅・ｼ・
    useEffect(() => {
        if (days.length === 0) return;

        const index = days.findIndex(d => isSameDay(d, selectedDate));

        // 遽・峇螟悶√∪縺溘・遶ｯ縺ｫ霑代▼縺・◆繧牙・荳ｭ蠢・喧
        if (index < RECENTER_THRESHOLD || index > days.length - RECENTER_THRESHOLD) {
            // 繝ｦ繝ｼ繧ｶ繝ｼ縺後せ繧ｯ繝ｭ繝ｼ繝ｫ荳ｭ縺ｮ蝣ｴ蜷医．OM譖ｴ譁ｰ縺ｧ繧ｬ繧ｿ縺､縺上・繧帝亟縺舌◆繧√・
            // 譛ｬ蠖薙・諷朱㍾縺ｫ陦後≧縺ｹ縺阪□縺後ヽeact縺ｮKey縺悟柑縺・※縺・ｋ縺ｮ縺ｧ
            // DOM隕∫ｴ閾ｪ菴薙・邯ｭ謖√＆繧後ｋ蜿ｯ閭ｽ諤ｧ縺碁ｫ倥＞縲・
            // 縺溘□縺励∽ｸ翫↓霑ｽ蜉縺輔ｌ繧九→繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ縺後★繧後ｋ縺溘ａ陬懈ｭ｣縺悟ｿ・ｦ√・
            // 縺薙％縺ｧ縺ｯ繧ｷ繝ｳ繝励Ν縺ｫ縲悟・逕滓・縺励※縲《electedDate縺ｫ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧貞粋繧上○繧九阪い繝励Ο繝ｼ繝√ｒ縺ｨ繧九・

            const newDays = generateDays(selectedDate);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDays(newDays);

            // DOM譖ｴ譁ｰ蠕後↓繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ繧剃ｿｮ豁｣縺吶ｋ縺溘ａ縺ｫ繝輔Λ繧ｰ繧堤ｫ九※繧・
            isAutoScrollingRef.current = true;
        }
    }, [selectedDate, days]);

    // days譖ｴ譁ｰ蠕後ｄselectedDate螟画峩蠕後・繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ隱ｿ謨ｴ
    useLayoutEffect(() => {
        // 繝ｦ繝ｼ繧ｶ繝ｼ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ荳ｭ縺ｯ縲∽ｽ咲ｽｮ隱ｿ謨ｴ繧定｡後ｏ縺ｪ縺・ｼ医ぎ繧ｿ縺､縺埼亟豁｢・・
        // 縺溘□縺励∝・荳ｭ蠢・喧・・ays譖ｴ譁ｰ・峨′逋ｺ逕溘＠縺溷ｴ蜷医・菴咲ｽｮ隱ｿ謨ｴ縺悟ｿ・ｦ・
        if (isUserScrollingRef.current && !isAutoScrollingRef.current) return;

        const targetDay = days.find(d => isSameDay(d, selectedDate));
        if (targetDay) {
            const el = dayRefs.current[targetDay.toISOString()];
            if (el && containerRef.current) {
                // scrollIntoView縺御ｸ榊ｮ牙ｮ壹↑縺溘ａ縲《crollTop繧堤峩謗･險ｭ螳壹☆繧・
                containerRef.current.scrollTop = el.offsetTop;

                // 繝輔Λ繧ｰ隗｣髯､・・ntersectionObserver繧呈怏蜉ｹ蛹厄ｼ・
                // 繝ｬ繝ｳ繝繝ｪ繝ｳ繧ｰ縺ｨ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺ｮ螳御ｺ・ｒ遒ｺ螳溘↓蠕・▽縺溘ａ譎る俣繧貞ｻｶ縺ｰ縺・
                setTimeout(() => {
                    isAutoScrollingRef.current = false;
                    setIsObserverEnabled(true);
                }, 300);
            }
        }
    }, [days, selectedDate]);

    // 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ騾｣蜍包ｼ・ntersectionObserver・・ 蛻晄悄繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ螳御ｺ・ｾ後↓縺ｮ縺ｿ譛牙柑蛹・
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Observer縺梧怏蜉ｹ蛹悶＆繧後ｋ縺ｾ縺ｧ蠕・ｩ・
        if (!isObserverEnabled) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // 閾ｪ蜍輔せ繧ｯ繝ｭ繝ｼ繝ｫ荳ｭ縺ｯ辟｡隕・
                if (isAutoScrollingRef.current) return;

                // 譛繧り｡ｨ遉ｺ鬆伜沺縺悟､ｧ縺阪＞隕∫ｴ繧呈爾縺・
                const visibleEntry = entries.reduce((prev, current) => {
                    return (prev.intersectionRatio > current.intersectionRatio) ? prev : current;
                });

                if (visibleEntry.isIntersecting && visibleEntry.intersectionRatio > 0.3) {
                    const dateStr = visibleEntry.target.getAttribute("data-date");
                    if (dateStr) {
                        const date = new Date(dateStr);

                        // 隕ｪ縺ｮ迥ｶ諷九ｒ譖ｴ譁ｰ縺吶ｋ蜑阪↓縲√％繧後′迴ｾ蝨ｨ縺ｮselectedDate縺ｨ驕輔≧縺狗｢ｺ隱・
                        if (!isSameDay(date, selectedDate)) {
                            isUserScrollingRef.current = true;
                            console.log('[DaySchedule] Scroll trigger: Changing date from', selectedDate.toISOString(), 'to', date.toISOString());
                            onDateChange(date);

                            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
                            scrollTimeoutRef.current = setTimeout(() => {
                                isUserScrollingRef.current = false;
                            }, 200);
                        }
                    }
                }
            },
            {
                root: container,
                threshold: 0.3 // 蛻､螳夐明蛟､繧貞ｰ代＠邱ｩ繧√ｋ
            }
        );

        Object.values(dayRefs.current).forEach(el => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [days, onDateChange, selectedDate, isObserverEnabled]); // isObserverEnabled縺ｮ螟牙喧繧堤屮隕・


    // 髟ｷ謚ｼ縺鈴未騾｣縺ｮ蜃ｦ逅・
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleTouchStart = (date: Date, hour: number) => {
        longPressTimerRef.current = setTimeout(() => {
            if (onTimeLongPress) {
                const timeStr = `${hour.toString().padStart(2, "0")}:00`;
                onTimeLongPress(date, timeStr);
                if (navigator.vibrate) navigator.vibrate(50);
            }
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    // 譎る俣譁・ｭ怜・(HH:mm)繧貞・縺ｫ螟画鋤縺吶ｋ繝倥Ν繝代・
    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden border-l border-gray-100">
            {/* 繝倥ャ繝繝ｼ鬆伜沺蜑企勁 (ExpandablePane縺ｸ遘ｻ蜍・ */}

            {/* 繧ｿ繧､繝繝ｩ繧､繝ｳ鬆伜沺・医せ繧ｯ繝ｭ繝ｼ繝ｫ蜿ｯ閭ｽ・・*/}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto relative scroll-smooth"
            >
                {days.map((day) => {
                    // 縺昴・譌･縺ｮTodo繧偵ヵ繧｣繝ｫ繧ｿ繝ｪ繝ｳ繧ｰ
                    const dayTodos = todos.filter(t =>
                        t.dueDate && isSameDay(new Date(t.dueDate), day) && t.dueTime
                    );

                    return (
                        <div
                            key={day.toISOString()}
                            ref={el => { dayRefs.current[day.toISOString()] = el; }}
                            data-date={day.toISOString()}
                            className="pb-8 relative"
                        >
                            {/* 譌･莉倥・繝・ム繝ｼ */}
                            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-3 py-1 z-10">
                                <span className={`text-xs font-bold ${isSameDay(day, new Date()) ? "text-blue-600" : "text-gray-600"}`}>
                                    {format(day, "M譛・譌･(EEE)", { locale: ja })}
                                </span>
                            </div>

                            {/* 譎る俣譫 */}
                            <div className="relative">
                                {hours.map((hour) => {
                                    const timeStr = `${hour.toString().padStart(2, "0")}:00`;
                                    const isKept = keptTime === timeStr && keptDate && isSameDay(day, keptDate);

                                    return (
                                        <div
                                            key={`${day.toISOString()}-${hour}`}
                                            className={`
                                                flex h-12 border-b border-gray-50 relative group transition-colors duration-200 select-none
                                                ${isKept ? "bg-orange-50" : "hover:bg-gray-50"}
                                            `}
                                            onMouseDown={() => handleTouchStart(day, hour)}
                                            onMouseUp={handleTouchEnd}
                                            onMouseLeave={handleTouchEnd}
                                            onTouchStart={() => handleTouchStart(day, hour)}
                                            onTouchEnd={handleTouchEnd}
                                        >
                                            <div className={`
                                                w-12 text-[10px] text-right pr-2 pt-1 transition-colors
                                                ${isKept ? "text-orange-600 font-bold" : "text-gray-400"}
                                            `}>
                                                {timeStr}
                                            </div>
                                            <div className="flex-1 relative">
                                                <div className={`
                                                    absolute inset-0 border-l border-dashed
                                                    ${isKept ? "border-orange-200" : "border-gray-50"}
                                                `} />
                                            </div >
                                        </div >
                                    );
                                })}

                                {/* Todo繝悶Ο繝・け縺ｮ謠冗判 */}
                                {
                                    dayTodos.map(todo => {
                                        if (!todo.dueTime) return null;

                                        const startMinutes = timeToMinutes(todo.dueTime);
                                        const endMinutes = todo.endTime ? timeToMinutes(todo.endTime) : startMinutes + 60; // Default 1 hour
                                        const duration = endMinutes - startMinutes;

                                        // 1譎る俣 = 48px (h-12) -> 1蛻・= 0.8px
                                        const top = startMinutes * 0.8;
                                        const height = Math.max(duration * 0.8, 24); // Min height 30 mins visual

                                        return (
                                            <div
                                                key={todo.id}
                                                onClick={() => onTodoClick?.(todo)}
                                                className="absolute left-14 right-2 rounded-md bg-blue-100/80 dark:bg-blue-900/40 border-l-4 border-blue-500 p-1 text-xs overflow-hidden z-10 cursor-pointer hover:bg-blue-200/80 dark:hover:bg-blue-800/50 transition-colors"
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                }}
                                            >
                                                <div className="font-bold text-blue-800 dark:text-blue-200 truncate">
                                                    <TodoTitle title={todo.title} />
                                                </div>
                                                <div className="text-blue-600 dark:text-blue-300 text-[10px]">
                                                    {todo.dueTime} - {todo.endTime || "?"}
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div >
                        </div >
                    );
                })}
            </div >
        </div >
    );
}
