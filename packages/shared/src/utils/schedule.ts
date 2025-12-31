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

    // 2. dueDate が Date オブジェクトまたは ISO 文字列で以前時間が含まれている場合
    // (通常は dueTime がセットされるはずだが、フォールバックとして)
    if (startMinutes === null && todo.dueDate) {
        const date = new Date(todo.dueDate);
        if (!isNaN(date.getTime())) {
            // 時間が 00:00 でない場合のみ採用（日付のみ指定の場合は 00:00 になることが多いため要検討だが、
            // Mobile版の実装では日付の時間を採用していたため、ここでも考慮する）
            // ただし、明示的に 00:00 を指定したい場合と区別がつかないため、
            // 明示的な時間指定は dueTime フィールドの使用を推奨する方針とする。
            // ここでは、dueTimeがない場合の補助として扱う。
            const h = getHours(date);
            const m = getMinutes(date);
            // 0:00 以外、または dueTime がないが dueDate に時間情報が含まれているとみなせる場合
            // いったんそのまま計算する
            startMinutes = h * 60 + m;
        }
    }

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
