import { Todo } from "../types";
import { getHours, getMinutes, parse } from "date-fns";

/**
 * Todoからスケジュールの開始・終了位置（分単位）を算出する
 * @param todo 
 * @returns { start: number, end: number } | null (時間指定がない場合はnull)
 */
export const getTodoScheduleRange = (todo: Todo): { start: number; end: number } | null => {
    let startMinutes: number | null = null;

    // 1. dueTime ("HH:mm") を最優先
    if (todo.dueTime) {
        const [h, m] = todo.dueTime.split(":").map(Number);
        if (!isNaN(h) && !isNaN(m)) {
            startMinutes = h * 60 + m;
        }
    }

    // 2. dueDate fallback (Removed to fix 0:00 placement bug for date-only tasks)
    // 明示的な時間指定(dueTime)がない場合はスケジュールには表示しない方針とする。
    /*
    if (startMinutes === null && todo.dueDate) {
        ...
    }
    */

    // 時間が特定できない場合は null
    if (startMinutes === null) {
        return null;
    }

    // 終了時間を決定
    let duration = 30; // Default 30 mins

    if (todo.endTime) {
        const [endH, endM] = todo.endTime.split(":").map(Number);
        if (!isNaN(endH) && !isNaN(endM)) {
            const endMinutes = endH * 60 + endM;
            // 日をまたぐ場合（終了時刻 < 開始時刻）の考慮は？
            // 現在のUIでは日またぎはあまり考慮されていないが、単純な引き算で負になる場合は
            // 翌日とみなして +24時間(1440分) するなどの対応が考えられる。
            // ここでは単純に差分を取る。
            let diff = endMinutes - startMinutes;
            if (diff < 0) {
                diff += 1440; // 翌日扱い
            }
            if (diff > 0) {
                duration = diff;
            }
        }
    } else if (todo.estimatedDuration && todo.estimatedDuration > 0) {
        duration = todo.estimatedDuration;
    }

    return {
        start: startMinutes,
        end: startMinutes + duration
    };
};
