import { Todo } from "../types";
import { addDays } from "date-fns";

/**
 * SRSグループ内の後続Todoの日付シフトを計算する（純粋関数）
 *
 * あるTodoの日付を変更した際に、同じSRSグループ内で
 * そのTodoより後の日付を持つTodoの日付をシフトする。
 *
 * @param updatedTodoId - 日付を変更したTodoのID
 * @param oldDate - 変更前の日付
 * @param newDate - 変更後の日付
 * @param groupId - SRSグループID
 * @param allGroupTodos - 同じグループの全Todo（変更したTodo自身を含む）
 * @returns シフトが必要なTodoのIDと新しい日付の配列
 */
export function calculateSrsDateShifts(
    updatedTodoId: string,
    oldDate: Date,
    newDate: Date,
    groupId: string,
    allGroupTodos: Todo[]
): Array<{ id: string; newDueDate: Date }> {
    // 日付を正規化（midnight）
    const normalizedOld = new Date(oldDate);
    normalizedOld.setHours(0, 0, 0, 0);
    const normalizedNew = new Date(newDate);
    normalizedNew.setHours(0, 0, 0, 0);

    const diffTime = normalizedNew.getTime() - normalizedOld.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return [];
    }

    const shifts: Array<{ id: string; newDueDate: Date }> = [];

    // グループ内の他のTodoで、元の日付より後のものをシフト
    for (const todo of allGroupTodos) {
        if (todo.id === updatedTodoId) continue;
        if (todo.srsGroupId !== groupId) continue;
        if (!todo.dueDate) continue;

        const todoDate = new Date(todo.dueDate);
        if (todoDate.getTime() > normalizedOld.getTime()) {
            shifts.push({
                id: todo.id,
                newDueDate: addDays(todoDate, diffDays),
            });
        }
    }

    return shifts;
}
