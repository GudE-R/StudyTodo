import { addDays, format, isSameDay } from 'date-fns';
import { Category, Todo } from '@studytodo/shared';

export const WIDGET_MAX_ITEMS = 8;

export interface WidgetItem {
    title: string;
    time: string;
    color: string;
}

export interface WidgetDay {
    items: WidgetItem[];
    total: number;
}

export interface WidgetLabels {
    title: string;
    empty: string;
    /** "%d" が残り件数に置換される */
    more: string;
    openApp: string;
}

export interface TodayWidgetPayload {
    /** key: yyyy-MM-dd（端末ローカル日付） */
    days: Record<string, WidgetDay>;
    labels: WidgetLabels;
}

/**
 * iOS ウィジェット用に「今日」と「明日」の未完了 Todo を抽出する。
 * 抽出条件は HomeTodoList と同じ（dueDate なしは毎日表示）。
 * 明日分も入れておくことで、アプリを開かなくても日付が変わった時点で切り替えられる。
 */
export function buildTodayWidgetPayload(
    todos: Todo[],
    categories: Category[],
    now: Date,
    labels: WidgetLabels
): TodayWidgetPayload {
    const colorMap = new Map(categories.map(c => [c.id, c.color ?? '']));

    const buildDay = (date: Date): WidgetDay => {
        const matched = todos
            .filter(todo => {
                if (todo.completed) return false;
                if (!todo.dueDate) return true;
                const todoDate = todo.dueDate instanceof Date ? todo.dueDate : new Date(todo.dueDate);
                return isSameDay(todoDate, date);
            })
            .sort((a, b) => {
                // 時刻ありを先に、時刻昇順
                if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
                if (a.dueTime) return -1;
                if (b.dueTime) return 1;
                return 0;
            });

        return {
            items: matched.slice(0, WIDGET_MAX_ITEMS).map(todo => ({
                title: todo.title,
                time: todo.dueTime ?? '',
                color: (todo.categoryId && colorMap.get(todo.categoryId)) || '',
            })),
            total: matched.length,
        };
    };

    const tomorrow = addDays(now, 1);
    return {
        days: {
            [format(now, 'yyyy-MM-dd')]: buildDay(now),
            [format(tomorrow, 'yyyy-MM-dd')]: buildDay(tomorrow),
        },
        labels,
    };
}
