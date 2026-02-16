import { Todo } from "../types";
import { addDays } from "date-fns";

/**
 * ルーティンTodoの一括生成（純粋関数）
 * 指定された曜日に該当する日付のTodoを指定日数分生成する。
 *
 * @param baseTodo - 元となるTodo
 * @param routineDays - 対象曜日の配列 (0=日, 1=月, ..., 6=土)
 * @param days - 生成対象の日数（デフォルト30日）
 * @param idGenerator - ID生成関数
 * @returns 生成されたTodo配列。最初のTodoのIDがgroupIdとなる。
 */
export function generateRoutineTodos(
    baseTodo: Todo,
    routineDays: number[],
    idGenerator: () => string,
    days: number = 30
): Todo[] {
    if (routineDays.length === 0) {
        return [];
    }

    const groupId = idGenerator();
    const now = new Date();
    const todosToAdd: Todo[] = [];

    for (let i = 0; i < days; i++) {
        const date = addDays(now, i);
        const dayOfWeek = date.getDay();

        if (routineDays.includes(dayOfWeek)) {
            const routineTodo: Todo = {
                ...baseTodo,
                id: todosToAdd.length === 0 ? groupId : idGenerator(),
                dueDate: date,
                completed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                srsGroupId: groupId,
            };
            todosToAdd.push(routineTodo);
        }
    }

    return todosToAdd;
}
