"use client";

import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { getDateFnsLocale } from "@/lib/date-fns-locales";

import { Todo, getTodoScheduleRange } from "@pomarc/shared";
import { TodoTitle } from "@/components/ui/TodoTitle";

interface DayScheduleProps {
    keptTime?: string | null;
    keptDate?: Date | null;
    onTimeLongPress?: (date: Date, time: string) => void;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    todos: Todo[];
    onTodoClick?: (todo: Todo) => void; // Todo詳細への遷移用
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
    todos,
    onTodoClick
}: DayScheduleProps) {
    const locale = useLocale();
    const t = useTranslations("common");
    const dateFnsLocale = getDateFnsLocale(locale);

    // バッファサイズ（前後何日分を表示するか）
    // 60日分あれば、頻繁な再レンダリングを防げます
    const BUFFER_DAYS = 60;
    // 再中心化のトリガーとなる閾値（端から何日以内で更新するか）
    const RECENTER_THRESHOLD = 15;

    // 30分刻みの時間枠 (24時間 * 2 = 48枠)
    const timeSlots = Array.from({ length: 48 }, (_, i) => i * 0.5);

    // 表示する日付リストの状態
    const [days, setDays] = useState<Date[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const dayRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // スクロール制御用フラグ
    const isAutoScrollingRef = useRef(false);
    const isUserScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // IntersectionObserverを有効にするかどうか（初期スクロール完了後に有効化）
    const [isObserverEnabled, setIsObserverEnabled] = useState(false);

    // 日付リスト生成ヘルパー
    const generateDays = (centerDate: Date) => {
        const start = subDays(centerDate, BUFFER_DAYS);
        return Array.from({ length: BUFFER_DAYS * 2 + 1 }, (_, i) => addDays(start, i));
    };

    // 初期化およびselectedDateが大きく変わった場合の再生成
    useEffect(() => {
        // daysが空、またはselectedDateが現在の範囲から大きく外れている場合は再生成
        const needsRegeneration = days.length === 0 || !days.some(d => isSameDay(d, selectedDate));

        if (needsRegeneration) {
            const newDays = generateDays(selectedDate);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDays(newDays);
            // 初回やジャンプ時は即座にスクロール位置を合わせるフラグを立てる
            isAutoScrollingRef.current = true;
        }
    }, [selectedDate, days]); // Added days to dependencies

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
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
                // scrollIntoViewが不安定なため、scrollTopを直接設定する
                containerRef.current.scrollTop = el.offsetTop;

                // フラグ解除（IntersectionObserverを有効化）
                // レンダリングとスクロールの完了を確実に待つため時間を延ばす
                setTimeout(() => {
                    isAutoScrollingRef.current = false;
                    setIsObserverEnabled(true);
                }, 300);
            }
        }
    }, [days, selectedDate]);

    // スクロール連動（IntersectionObserver）- 初期スクロール完了後にのみ有効化
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Observerが有効化されるまで待機
        if (!isObserverEnabled) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // 自動スクロール中は無視
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
                threshold: 0.3 // 判定閾値を少し緩める
            }
        );

        Object.values(dayRefs.current).forEach(el => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [days, onDateChange, selectedDate, isObserverEnabled]); // isObserverEnabledの変化を監視

    // 長押し関連の処理
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleTouchStart = (date: Date, timeSlot: number) => {
        longPressTimerRef.current = setTimeout(() => {
            if (onTimeLongPress) {
                const hour = Math.floor(timeSlot);
                const minutes = (timeSlot % 1) * 60;
                const timeStr = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
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

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden border-l border-border transition-colors duration-300">
            {/* ヘッダー領域削除 (ExpandablePaneへ移動) */}

            {/* タイムライン領域（スクロール可能） */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto relative scroll-smooth"
            >
                {days.map((day) => {
                    // その日のTodoをフィルタリングし、スケジュール情報を計算
                    const dayTodos = todos.map(todo => {
                        if (!todo.dueDate || !isSameDay(new Date(todo.dueDate), day)) return null;
                        const schedule = getTodoScheduleRange(todo);
                        if (!schedule) return null;
                        return { ...todo, schedule };
                    }).filter((t): t is (Todo & { schedule: { start: number, end: number } }) => t !== null);

                    return (
                        <div
                            key={day.toISOString()}
                            ref={el => { dayRefs.current[day.toISOString()] = el; }}
                            data-date={day.toISOString()}
                            className="pb-8 relative"
                        >
                            {/* 日付ヘッダー */}
                            <div className="sticky top-0 bg-card/90 backdrop-blur-sm border-b border-border px-3 py-1 z-10 transition-colors duration-300">
                                <span className={`text-xs font-bold ${isSameDay(day, new Date()) ? "text-blue-600" : "text-gray-600"}`}>
                                    {format(day, t("dateFormat"), { locale: dateFnsLocale })}
                                </span>
                            </div>

                            {/* 時間枠 */}
                            <div className="relative">
                                {timeSlots.map((slot) => {
                                    const hour = Math.floor(slot);
                                    const minutes = (slot % 1) * 60;
                                    const timeStr = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                                    const isHalfHour = minutes === 30;
                                    const isKept = keptTime === timeStr && keptDate && isSameDay(day, keptDate);

                                    return (
                                        <div
                                            key={`${day.toISOString()}-${slot}`}
                                            className={`
                                                flex h-6 relative group transition-colors duration-200 select-none border-border
                                                ${isHalfHour ? "border-t border-dashed border-border/30" : "border-t border-solid border-border"}
                                                ${isKept ? "bg-orange-50 dark:bg-orange-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}
                                            `}
                                            onMouseDown={() => handleTouchStart(day, slot)}
                                            onMouseUp={handleTouchEnd}
                                            onMouseLeave={handleTouchEnd}
                                            onTouchStart={() => handleTouchStart(day, slot)}
                                            onTouchEnd={handleTouchEnd}
                                        >
                                            <div className={`
                                                w-12 text-[10px] text-right pr-2 pt-0.5 transition-colors
                                                ${isKept ? "text-orange-600 font-bold" : "text-gray-400"}
                                            `}>
                                                {!isHalfHour || isKept ? timeStr : ""}
                                            </div>
                                            <div className="flex-1 relative">
                                                <div className={`
                                                    absolute inset-y-0 left-0 border-l border-dashed border-gray-50
                                                    ${isKept ? "border-orange-200" : ""}
                                                `} />
                                            </div >
                                        </div >
                                    );
                                })}


                                {/* Todoブロックの描画 */}
                                {
                                    dayTodos.map(todo => {
                                        const { start: startMinutes, end: endMinutes } = todo.schedule;
                                        const duration = endMinutes - startMinutes;

                                        // 1時間 = 48px (h-12) -> 1分 = 0.8px
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
                                                    {todo.dueTime || format(new Date(todo.dueDate!), "HH:mm")} - {todo.endTime || "?"}
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
