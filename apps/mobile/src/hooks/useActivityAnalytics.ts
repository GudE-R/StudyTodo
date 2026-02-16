import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, isWithinInterval, getMonth } from 'date-fns';
import { getDateFnsLocale } from '../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';
import { Session, Todo, Category } from '@studytodo/shared';
import { isCategoryMatch } from '../lib/categoryUtils';

export type Range = "week" | "month" | "year";

interface UseActivityAnalyticsProps {
    sessions: Session[];
    todos: Todo[];
    categories: Category[];
    range: Range;
    filterCategory: string;
}

export const useActivityAnalytics = ({ sessions, todos, categories, range, filterCategory }: UseActivityAnalyticsProps) => {
    const { t, i18n } = useTranslation();
    const locale = getDateFnsLocale(i18n.language);

    // Helpers
    const flattenCategories = (cats: Category[]): Category[] => {
        let flat: Category[] = [];
        cats.forEach(c => {
            flat.push(c);
            if (c.children) flat = [...flat, ...flattenCategories(c.children)];
        });
        return flat;
    };
    const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

    // --- Analytics Logic ---
    const chartData = useMemo(() => {
        const now = new Date();
        let data: { label: string; value: number; date?: Date }[] = [];

        let start: Date, end: Date;

        if (range === "week") {
            start = startOfWeek(now, { weekStartsOn: 1 });
            end = endOfWeek(now, { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start, end });
            data = days.map(d => ({ label: format(d, 'EEE', { locale }), value: 0, date: d }));
        } else if (range === "month") {
            start = startOfMonth(now);
            end = endOfMonth(now);
            const days = eachDayOfInterval({ start, end });
            data = days.map(d => ({ label: format(d, 'd'), value: 0, date: d }));
        } else {
            start = startOfYear(now);
            end = endOfYear(now);
            const months = eachMonthOfInterval({ start, end });
            data = months.map(d => ({ label: format(d, 'MMM', { locale }), value: 0, date: d }));
        }

        sessions.forEach(session => {
            const date = new Date(session.createdAt);
            if (!isWithinInterval(date, { start, end })) return;

            if (filterCategory !== 'all') {
                const todo = todos.find(t => t.id === session.todoId);
                if (!todo || !isCategoryMatch(todo.categoryId, filterCategory, categories)) return;
            }

            if (range === "year") {
                const idx = getMonth(date);
                if (data[idx]) data[idx].value += session.duration / 60;
            } else {
                const dayLabel = range === "week" ? format(date, 'EEE', { locale }) : format(date, 'd');
                const idx = data.findIndex(d => d.label === dayLabel);
                if (idx !== -1) data[idx].value += session.duration / 60;
            }
        });

        return data;
    }, [sessions, todos, range, filterCategory, locale, categories]);

    const pieData = useMemo(() => {
        const now = new Date();
        let start: Date, end: Date;
        if (range === "week") { start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); }
        else if (range === "month") { start = startOfMonth(now); end = endOfMonth(now); }
        else { start = startOfYear(now); end = endOfYear(now); }

        const distribution: { [key: string]: { name: string, value: number, color: string } } = {};

        sessions.forEach(session => {
            const date = new Date(session.createdAt);
            if (!isWithinInterval(date, { start, end })) return;

            if (filterCategory !== 'all') {
                const todo = todos.find(t => t.id === session.todoId);
                if (!todo || !isCategoryMatch(todo.categoryId, filterCategory, categories)) return;
            }

            const todo = todos.find(t => t.id === session.todoId);
            const catId = todo?.categoryId || "none";
            const category = flatCategories.find(c => c.id === catId);
            const name = category?.name || (catId === "none" ? t('todo.noCategory', 'No Category') : "Unknown");
            const color = category?.color || "#9ca3af";

            if (!distribution[catId]) {
                distribution[catId] = { name, value: 0, color };
            }
            distribution[catId].value += session.duration / 60;
        });

        return Object.values(distribution)
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);

    }, [sessions, todos, range, filterCategory, flatCategories, categories, t]);

    const totalTimeMinutes = useMemo(() => chartData.reduce((acc, d) => acc + d.value, 0), [chartData]);

    const completedCount = useMemo(() => {
        const now = new Date();
        let start: Date, end: Date;
        if (range === "week") { start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); }
        else if (range === "month") { start = startOfMonth(now); end = endOfMonth(now); }
        else { start = startOfYear(now); end = endOfYear(now); }

        return todos.filter(t => {
            if (!t.completed) return false;
            if (filterCategory !== 'all' && !isCategoryMatch(t.categoryId, filterCategory, categories)) return false;
            return isWithinInterval(new Date(t.createdAt), { start, end });
        }).length;
    }, [todos, range, filterCategory, categories]);

    return {
        chartData,
        pieData,
        totalTimeMinutes,
        completedCount,
        flatCategories
    };
};
