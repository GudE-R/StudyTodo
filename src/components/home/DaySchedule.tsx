"use client";

import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
import { format, addDays, subDays, isSameDay, startOfDay, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";

import { Todo } from "@/types";

interface DayScheduleProps {
    keptTime?: string | null;
    keptDate?: Date | null;
    onTimeLongPress?: (date: Date, time: string) => void;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    todos: Todo[];
}

/**
 * 連続スケジュールコンポーネント（無限スクロール対応）
 * 
 * ホーム画面右カラムに表示されるタイムラインビューです。
 * 選択中の日付を中心に、前後一定期間（バッファ）の日付をレンダリングします。
 * スクロールして端に近づくと、自動的にバッファを更新（再中心化）し、
 * 擬似的な無限スクロールを実現します。
 */
export function DaySchedule({
    keptTime,
    keptDate,
    onTimeLongPress,
    selectedDate,
    onDateChange,
    todos
}: DayScheduleProps) {
    // バッファサイズ（前後何日分を表示するか）
    // 60日分あれば、頻繁な再レンダリングを防げます
    const BUFFER_DAYS = 60;
    // 再中心化のトリガーとなる閾値（端から何日以内で更新するか）
    const RECENTER_THRESHOLD = 15;

    // 0時から23時までの時間枠 (24時間対応)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // 表示する日付リストの状態
    const [days, setDays] = useState<Date[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const dayRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // スクロール制御用フラグ
    const isAutoScrollingRef = useRef(false);
    const isUserScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 初期化およびselectedDateが大きく変わった場合の再生成
    useEffect(() => {
        // daysが空、またはselectedDateが現在の範囲から大きく外れている場合は再生成
        const needsRegeneration = days.length === 0 || !days.some(d => isSameDay(d, selectedDate));

        if (needsRegeneration) {
            const newDays = generateDays(selectedDate);
            setDays(newDays);
            // 初回やジャンプ時は即座にスクロール位置を合わせるフラグを立てる
            isAutoScrollingRef.current = true;
        }
    }, [selectedDate]);

    // 日付リスト生成ヘルパー
    const generateDays = (centerDate: Date) => {
        const start = subDays(centerDate, BUFFER_DAYS);
        return Array.from({ length: BUFFER_DAYS * 2 + 1 }, (_, i) => addDays(start, i));
    };

    // selectedDateの変更を監視し、必要に応じてバッファを更新（無限スクロール処理）
    useEffect(() => {
        if (days.length === 0) return;

        const index = days.findIndex(d => isSameDay(d, selectedDate));

        // 範囲外、または端に近づいたら再中心化
        if (index < RECENTER_THRESHOLD || index > days.length - RECENTER_THRESHOLD) {
            // ユーザーがスクロール中の場合、DOM更新でガタつくのを防ぐため、
            // 本当は慎重に行うべきだが、ReactのKeyが効いているので
            // DOM要素自体は維持される可能性が高い。
            // ただし、上に追加されるとスクロール位置がずれるため補正が必要。
            // ここではシンプルに「再生成して、selectedDateにスクロールを合わせる」アプローチをとる。

            const newDays = generateDays(selectedDate);
            setDays(newDays);

            // DOM更新後にスクロール位置を修正するためにフラグを立てる
            isAutoScrollingRef.current = true;
        }
    }, [selectedDate, days]);

    // days更新後やselectedDate変更後のスクロール位置調整
    useLayoutEffect(() => {
        // ユーザースクロール中は、位置調整を行わない（ガタつき防止）
        // ただし、再中心化（days更新）が発生した場合は位置調整が必要
        if (isUserScrollingRef.current && !isAutoScrollingRef.current) return;

        const targetDay = days.find(d => isSameDay(d, selectedDate));
        if (targetDay) {
            const el = dayRefs.current[targetDay.toISOString()];
            if (el && containerRef.current) {
                // 自動スクロール（再中心化やカレンダー遷移）の場合
                // 'auto'で即座に移動させることで、視覚的なズレを一瞬で補正する
                el.scrollIntoView({ behavior: "auto", block: "start" });

                // フラグ解除
                setTimeout(() => {
                    isAutoScrollingRef.current = false;
                }, 50);
            }
        }
    }, [days, selectedDate]);

    // スクロール連動（IntersectionObserver）
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (isAutoScrollingRef.current) return;

                // 最も表示領域が大きい要素を探す
                const visibleEntry = entries.reduce((prev, current) => {
                    return (prev.intersectionRatio > current.intersectionRatio) ? prev : current;
                });

                if (visibleEntry.isIntersecting && visibleEntry.intersectionRatio > 0.3) {
                    const dateStr = visibleEntry.target.getAttribute("data-date");
                    if (dateStr) {
                        const date = new Date(dateStr);

                        // 親の状態を更新する前に、これが現在のselectedDateと違うか確認
                        if (!isSameDay(date, selectedDate)) {
                            isUserScrollingRef.current = true;
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
                threshold: 0.3 // 判定閾値を少し緩める
            }
        );

        Object.values(dayRefs.current).forEach(el => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [days, onDateChange, selectedDate]);


    // 長押し関連の処理
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

    // 時間文字列(HH:mm)を分に変換するヘルパー
    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden border-l border-gray-100">
            {/* ヘッダー領域 */}
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 z-10">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule</h3>
            </div>

            {/* タイムライン領域（スクロール可能） */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto relative scroll-smooth"
            >
                {days.map((day) => {
                    // その日のTodoをフィルタリング
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
                            {/* 日付ヘッダー */}
                            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-3 py-1 z-10">
                                <span className={`text-xs font-bold ${isSameDay(day, new Date()) ? "text-blue-600" : "text-gray-600"}`}>
                                    {format(day, "M月d日(EEE)", { locale: ja })}
                                </span>
                            </div>

                            {/* 時間枠 */}
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

                                {/* Todoブロックの描画 */}
                                {
                                    dayTodos.map(todo => {
                                        if (!todo.dueTime) return null;

                                        const startMinutes = timeToMinutes(todo.dueTime);
                                        const endMinutes = todo.endTime ? timeToMinutes(todo.endTime) : startMinutes + 60; // Default 1 hour
                                        const duration = endMinutes - startMinutes;

                                        // 1時間 = 48px (h-12) -> 1分 = 0.8px
                                        const top = startMinutes * 0.8;
                                        const height = Math.max(duration * 0.8, 24); // Min height 30 mins visual

                                        return (
                                            <div
                                                key={todo.id}
                                                className="absolute left-14 right-2 rounded-md bg-blue-100/80 border-l-4 border-blue-500 p-1 text-xs overflow-hidden z-0 pointer-events-none"
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                }}
                                            >
                                                <div className="font-bold text-blue-800 truncate">{todo.title}</div>
                                                <div className="text-blue-600 text-[10px]">
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
